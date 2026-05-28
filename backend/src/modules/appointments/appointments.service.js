const db = require("../../config/database");
const AppError = require("../../utils/AppError");

class AppointmentsService {
  static async createAppointment(organizationId, userId, data) {
    // Validar clínica y si el usuario tiene acceso
    const clinic = await db.clinic.findFirst({
      where: { id: data.clinic_id, organization_id: organizationId },
    });
    if (!clinic) throw new AppError("Clínica no válida.", 400);

    const office = await db.office.findFirst({
      where: { id: data.office_id, clinic_id: data.clinic_id },
    });
    if (!office) throw new AppError("Consultorio no válido.", 400);

    // Validar overlapping schedules si es necesario (simplificado por ahora)

    // Iniciar transacción si enviamos servicios desde la creación, sino se insertan luego.
    const appointment = await db.$transaction(async (prisma) => {
      let totalAmount = 0;

      const newAppointment = await prisma.appointment.create({
        data: {
          organization_id: organizationId,
          clinic_id: data.clinic_id,
          office_id: data.office_id,
          doctor_id: data.doctor_id,
          patient_id: data.patient_id,
          created_by: userId,
          start_time: new Date(data.start_time),
          end_time: new Date(data.end_time),
          reason: data.reason || null,
          status: "PENDING",
          total_amount: 0,
        },
      });

      // Si mandamos un array de serviceIds
      if (data.service_ids && data.service_ids.length > 0) {
        const services = await prisma.service.findMany({
          where: { id: { in: data.service_ids } },
        });

        for (const service of services) {
          await prisma.appointmentService.create({
            data: {
              appointment_id: newAppointment.id,
              service_id: service.id,
              name: service.name,
              price: service.price,
            },
          });
          totalAmount += parseFloat(service.price);
        }

        // Actualizar el total_amount
        await prisma.appointment.update({
          where: { id: newAppointment.id },
          data: { total_amount: totalAmount },
        });
        newAppointment.total_amount = totalAmount;
      }

      return newAppointment;
    });

    return appointment;
  }

  static async getAppointmentsByClinic(
    organizationId,
    clinicId,
    startDate,
    endDate,
  ) {
    const whereClause = {
      organization_id: organizationId,
      start_time: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (clinicId) {
      whereClause.clinic_id = clinicId;
    }

    return await db.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, first_name: true, last_name: true, phone: true },
        },
        doctor: { select: { id: true, first_name: true, last_name: true } },
        services: {
          include: {
            service: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { start_time: "asc" },
    });
  }

  static async updateAppointmentStatus(
    organizationId,
    doctorId,
    appointmentId,
    status,
    cancelReason = null,
    totalAmount = null,
    serviceIds = [],
  ) {
    const appointment = await db.appointment.findFirst({
      where: { id: appointmentId, organization_id: organizationId },
    });
    if (!appointment) throw new AppError("Cita no encontrada.", 404);

    const updateData = {
      status,
      cancel_reason: cancelReason || appointment.cancel_reason,
    };

    // Si se especifica un monto, actualizarlo (el doctor puede fijar el precio)
    if (totalAmount !== null && totalAmount !== undefined) {
      updateData.total_amount = parseFloat(totalAmount);
    }

    return await db.$transaction(async (prisma) => {
      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        const selectedServices = await prisma.service.findMany({
          where: {
            id: { in: serviceIds },
            doctor_id: doctorId,
            is_active: true,
          },
        });

        if (selectedServices.length !== serviceIds.length) {
          throw new AppError(
            "Uno o más servicios seleccionados no pertenecen a tu catálogo.",
            400,
          );
        }

        await prisma.appointmentService.deleteMany({
          where: { appointment_id: appointmentId },
        });

        await prisma.appointmentService.createMany({
          data: selectedServices.map((service) => ({
            appointment_id: appointmentId,
            service_id: service.id,
            name: service.name,
            price: service.price,
          })),
        });
      }

      return await prisma.appointment.update({
        where: { id: appointmentId },
        data: updateData,
        include: {
          patient: { select: { first_name: true, last_name: true } },
          doctor: { select: { first_name: true, last_name: true } },
          services: {
            include: {
              service: {
                select: { id: true, name: true, price: true },
              },
            },
          },
        },
      });
    });
  }
}

module.exports = AppointmentsService;
