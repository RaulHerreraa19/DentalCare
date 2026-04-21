const db = require("../../config/database");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/AppError");
const {
  assertEmail,
  assertStrongPassword,
  assertRequiredText,
  assertOptionalPhone,
  assertOptionalText,
} = require("../../utils/validators");

class UsersService {
  static async inviteEmployee(organizationId, data) {
    const {
      email,
      first_name,
      last_name,
      role,
      password,
      clinics,
      office_ids,
      office_id,
      supervisor_id,
    } = data;

    if (!["DOCTOR", "RECEPTIONIST"].includes(role)) {
      throw new AppError("Rol inválido para invitación", 400);
    }

    const safeEmail = assertEmail(email, "El correo del colaborador");
    const safePassword = assertStrongPassword(
      password,
      "La contraseña temporal",
    );
    const safeFirstName = assertRequiredText(first_name, "El nombre", 2, 80);
    const safeLastName = assertRequiredText(last_name, "El apellido", 2, 80);

    // Normalizar office_ids a array
    const officesToAssign = office_ids || (office_id ? [office_id] : []);

    if (role === "DOCTOR" && officesToAssign.length > 1) {
      throw new AppError(
        "Un médico solo puede tener un consultorio asignado.",
        400,
      );
    }

    const exists = await db.user.findUnique({ where: { email: safeEmail } });
    if (exists) throw new AppError("Email ya registrado", 400);

    const hashedPassword = await bcrypt.hash(safePassword, 10);

    // clinics = array of clinic_ids
    const clinicAssignments =
      clinics?.map((clinicId) => ({ clinic_id: clinicId })) || [];
    const officeAssignments = officesToAssign.map((offId) => ({
      office_id: offId,
    }));

    return await db.user.create({
      data: {
        organization_id: organizationId,
        email: safeEmail,
        first_name: safeFirstName,
        last_name: safeLastName,
        password_hash: hashedPassword,
        role,
        supervisor_id: supervisor_id || null,
        clinic_assignments: {
          create: clinicAssignments,
        },
        office_assignments: {
          create: officeAssignments,
        },
      },
    });
  }

  static async getEmployees(organizationId) {
    return await db.user.findMany({
      where: {
        organization_id: organizationId,
        role: { in: ["DOCTOR", "RECEPTIONIST"] },
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        supervisor_id: true,
        supervisor: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        clinic_assignments: {
          include: { clinic: true },
        },
        office_assignments: {
          include: { office: true },
        },
      },
    });
  }

  static async updateEmployee(organizationId, employeeId, data) {
    const {
      first_name,
      last_name,
      is_active,
      clinic_id,
      office_ids,
      office_id,
      supervisor_id,
    } = data;

    // Normalizar office_ids
    const officesToAssign = office_ids || (office_id ? [office_id] : []);

    // Verificar existencia del empleado
    const user = await db.user.findFirst({
      where: { id: employeeId, organization_id: organizationId },
    });

    if (!user) throw new AppError("Empleado no encontrado", 404);

    if (user.role === "DOCTOR" && officesToAssign.length > 1) {
      throw new AppError(
        "Un médico solo puede tener un consultorio asignado.",
        400,
      );
    }

    const updateData = {};
    if (first_name !== undefined)
      updateData.first_name = assertRequiredText(
        first_name,
        "El nombre",
        2,
        80,
      );
    if (last_name !== undefined)
      updateData.last_name = assertRequiredText(
        last_name,
        "El apellido",
        2,
        80,
      );
    if (is_active !== undefined) updateData.is_active = is_active;
    if (supervisor_id !== undefined)
      updateData.supervisor_id = supervisor_id || null;

    return await db.$transaction(async (prisma) => {
      // 1. Actualizar clínicas
      if (clinic_id !== undefined) {
        await prisma.userClinicAssignment.deleteMany({
          where: { user_id: employeeId },
        });

        if (clinic_id) {
          await prisma.userClinicAssignment.create({
            data: { user_id: employeeId, clinic_id: clinic_id },
          });
        }
      }

      // 2. Actualizar consultorios
      if (
        officesToAssign.length > 0 ||
        office_ids !== undefined ||
        office_id !== undefined
      ) {
        await prisma.userOfficeAssignment.deleteMany({
          where: { user_id: employeeId },
        });

        await prisma.userOfficeAssignment.createMany({
          data: officesToAssign.map((offId) => ({
            user_id: employeeId,
            office_id: offId,
          })),
        });
      }

      // 3. Actualizar al usuario
      return await prisma.user.update({
        where: { id: employeeId },
        data: updateData,
      });
    });
  }

  static async updateMe(userId, data) {
    const allowedFields = [
      "first_name",
      "last_name",
      "phone",
      "license_number",
      "specialty",
      "signature_stamp_url",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (updateData.first_name !== undefined) {
      updateData.first_name = assertRequiredText(
        updateData.first_name,
        "El nombre",
        2,
        80,
      );
    }
    if (updateData.last_name !== undefined) {
      updateData.last_name = assertRequiredText(
        updateData.last_name,
        "El apellido",
        2,
        80,
      );
    }
    if (updateData.phone !== undefined) {
      updateData.phone = assertOptionalPhone(updateData.phone, "El teléfono");
    }
    if (updateData.license_number !== undefined) {
      updateData.license_number = assertOptionalText(
        updateData.license_number,
        "La cédula profesional",
        40,
      );
    }
    if (updateData.specialty !== undefined) {
      updateData.specialty = assertOptionalText(
        updateData.specialty,
        "La especialidad",
        120,
      );
    }
    if (updateData.signature_stamp_url !== undefined) {
      updateData.signature_stamp_url = assertOptionalText(
        updateData.signature_stamp_url,
        "La URL de firma",
        500,
      );
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(
        "No se enviaron datos válidos para actualizar el perfil.",
        400,
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        organization_id: true,
        license_number: true,
        specialty: true,
        signature_stamp_url: true,
      },
    });

    return updatedUser;
  }
}

module.exports = UsersService;
