const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError');

class UsersService {
  static async inviteEmployee(organizationId, data) {
    const { email, first_name, last_name, role, password, clinics, office_ids, office_id, supervisor_id } = data;

    if (!['DOCTOR', 'RECEPTIONIST'].includes(role)) {
      throw new AppError('Rol inválido para invitación', 400);
    }

    // Normalizar office_ids a array
    const officesToAssign = office_ids || (office_id ? [office_id] : []);

    if (role === 'DOCTOR' && officesToAssign.length > 1) {
      throw new AppError('Un médico solo puede tener un consultorio asignado.', 400);
    }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) throw new AppError('Email ya registrado', 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    // clinics = array of clinic_ids
    const clinicAssignments = clinics?.map(clinicId => ({ clinic_id: clinicId })) || [];
    const officeAssignments = officesToAssign.map(offId => ({ office_id: offId }));

    return await db.user.create({
      data: {
        organization_id: organizationId,
        email,
        first_name,
        last_name,
        password_hash: hashedPassword,
        role,
        supervisor_id: supervisor_id || null,
        clinic_assignments: {
          create: clinicAssignments
        },
        office_assignments: {
          create: officeAssignments
        }
      }
    });
  }

  static async getEmployees(organizationId) {
    return await db.user.findMany({
      where: {
        organization_id: organizationId,
        role: { in: ['DOCTOR', 'RECEPTIONIST'] }
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
            last_name: true
          }
        },
        clinic_assignments: {
          include: { clinic: true }
        },
        office_assignments: {
          include: { office: true }
        }
      }
    });
  }

  static async updateEmployee(organizationId, employeeId, data) {
    const { first_name, last_name, is_active, clinic_id, office_ids, office_id, supervisor_id } = data;

    // Normalizar office_ids
    const officesToAssign = office_ids || (office_id ? [office_id] : []);

    // Verificar existencia del empleado
    const user = await db.user.findFirst({
      where: { id: employeeId, organization_id: organizationId }
    });
    
    if (!user) throw new AppError('Empleado no encontrado', 404);

    if (user.role === 'DOCTOR' && officesToAssign.length > 1) {
      throw new AppError('Un médico solo puede tener un consultorio asignado.', 400);
    }

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (supervisor_id !== undefined) updateData.supervisor_id = supervisor_id || null;

    return await db.$transaction(async (prisma) => {
      // 1. Actualizar clínicas
      if (clinic_id !== undefined) {
        await prisma.userClinicAssignment.deleteMany({
          where: { user_id: employeeId }
        });
        
        if (clinic_id) {
          await prisma.userClinicAssignment.create({
            data: { user_id: employeeId, clinic_id: clinic_id }
          });
        }
      }

      // 2. Actualizar consultorios
      if (officesToAssign.length > 0 || office_ids !== undefined || office_id !== undefined) {
        await prisma.userOfficeAssignment.deleteMany({
          where: { user_id: employeeId }
        });

        await prisma.userOfficeAssignment.createMany({
          data: officesToAssign.map(offId => ({
            user_id: employeeId,
            office_id: offId
          }))
        });
      }

      // 3. Actualizar al usuario
      return await prisma.user.update({
        where: { id: employeeId },
        data: updateData
      });
    });
  }
}

module.exports = UsersService;
