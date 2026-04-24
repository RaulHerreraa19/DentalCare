const db = require("../../config/database");
const AppError = require("../../utils/AppError");

class BillingService {
  static normalizePaymentMethod(paymentMethod, required = false) {
    if (
      paymentMethod === undefined ||
      paymentMethod === null ||
      paymentMethod === ""
    ) {
      if (required) {
        throw new AppError("Debes seleccionar el método de pago.", 400);
      }
      return null;
    }

    const normalized = String(paymentMethod).toUpperCase().trim();
    const valid = ["CASH", "TRANSFER", "CARD"];
    if (!valid.includes(normalized)) {
      throw new AppError(
        "Método de pago inválido. Usa efectivo, transferencia o tarjeta/terminal.",
        400,
      );
    }

    return normalized;
  }

  static async collectPayment(
    organizationId,
    userId,
    appointmentId,
    finalAmount = null,
    paymentMethod,
  ) {
    const appointment = await db.appointment.findFirst({
      where: { id: appointmentId, organization_id: organizationId },
    });

    if (!appointment) throw new AppError("Cita no encontrada.", 404);
    if (appointment.is_paid)
      throw new AppError("Esta cita ya fue cobrada.", 400);

    const normalizedPaymentMethod = BillingService.normalizePaymentMethod(
      paymentMethod,
      true,
    );

    console.log("collectPayment inputs:", {
      finalAmount,
      paymentMethod: normalizedPaymentMethod,
      appointment_total_amount: appointment.total_amount,
    });
    let actualAmount = parseFloat(appointment.total_amount || 0);
    if (
      finalAmount !== undefined &&
      finalAmount !== null &&
      finalAmount !== ""
    ) {
      console.log("finalAmount is truthy", finalAmount);
      const parsed = parseFloat(finalAmount);
      if (!isNaN(parsed)) {
        actualAmount = parsed;
      }
    }
    console.log("actualAmount finalized as:", actualAmount);
    return await db.$transaction(async (prisma) => {
      // 1. Marcar la cita como pagada y completada
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          is_paid: true,
          status: "COMPLETED",
          total_amount: actualAmount,
        },
      });

      // 2. Registrar el ingreso en la caja
      await prisma.cashRegister.create({
        data: {
          organization_id: organizationId,
          clinic_id: appointment.clinic_id,
          appointment_id: appointment.id,
          type: "INCOME",
          amount: actualAmount,
          description: `Cobro de consulta (Cita: ${appointment.id})`,
          category: "APPOINTMENT_PAYMENT",
          payment_method: normalizedPaymentMethod,
          registered_by: userId,
        },
      });

      return updatedAppointment;
    });
  }

  static async recordMovement(organizationId, userId, data) {
    const { clinic_id, type, amount, description, category, payment_method } =
      data;
    const normalizedPaymentMethod = BillingService.normalizePaymentMethod(
      payment_method,
      false,
    );

    return await db.cashRegister.create({
      data: {
        organization_id: organizationId,
        clinic_id,
        type,
        amount,
        description,
        category,
        payment_method: normalizedPaymentMethod,
        registered_by: userId,
      },
    });
  }

  static async getHistory(organizationId, filters = {}) {
    const { clinic_id, type, payment_method, startDate, endDate } = filters;

    const where = { organization_id: organizationId };
    if (clinic_id) where.clinic_id = clinic_id;
    if (type) where.type = type;
    if (payment_method)
      where.payment_method = BillingService.normalizePaymentMethod(
        payment_method,
        false,
      );
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate)
        where.created_at.lte = new Date(
          endDate.includes("T") ? endDate : endDate + "T23:59:59.999Z",
        );
    }

    return await db.cashRegister.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        clinic: { select: { name: true } },
        user: { select: { first_name: true, last_name: true } },
      },
    });
  }
}

module.exports = BillingService;
