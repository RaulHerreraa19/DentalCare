const db = require('../../config/database');
const AppError = require('../../utils/AppError');

class PatientsService {
  static async createPatient(organizationId, data) {
    // Validar si el paciente (email/telefono) ya existe en la misma org para no duplicar (Opcional, pero recomendado)
    if (data.email) {
      const existing = await db.patient.findFirst({
        where: { email: data.email, organization_id: organizationId }
      });
      if (existing) {
        throw new AppError('El correo electrónico ya está registrado para otro paciente.', 400);
      }
    }

    return await db.patient.create({
      data: {
        organization_id: organizationId,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        gender: data.gender || null,
        address: data.address || null,
        emergency_contact: data.emergency_contact || null,
        notes: data.notes || null,
      }
    });
  }

  static async getPatients(organizationId, search = '') {
    const whereClause = { organization_id: organizationId };
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await db.patient.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      take: 50 // Límite para evitar query gigante
    });
  }

  static async getPatientById(organizationId, patientId) {
    const patient = await db.patient.findFirst({
      where: { id: patientId, organization_id: organizationId },
      include: {
        appointments: {
          orderBy: { start_time: 'desc' },
          take: 5
        }
      }
    });

    if (!patient) throw new AppError('Paciente no encontrado o no pertenece a tu organización.', 404);
    return patient;
  }

  static async updatePatient(organizationId, patientId, data) {
    const patient = await db.patient.findFirst({
      where: { id: patientId, organization_id: organizationId }
    });

    if (!patient) throw new AppError('Paciente no encontrado o no pertenece a tu organización.', 404);

    return await db.patient.update({
      where: { id: patientId },
      data: {
        first_name: data.first_name !== undefined ? data.first_name : patient.first_name,
        last_name: data.last_name !== undefined ? data.last_name : patient.last_name,
        email: data.email !== undefined ? data.email : patient.email,
        phone: data.phone !== undefined ? data.phone : patient.phone,
        date_of_birth: data.date_of_birth !== undefined ? (data.date_of_birth ? new Date(data.date_of_birth) : null) : patient.date_of_birth,
        gender: data.gender !== undefined ? data.gender : patient.gender,
        address: data.address !== undefined ? data.address : patient.address,
        emergency_contact: data.emergency_contact !== undefined ? data.emergency_contact : patient.emergency_contact,
        notes: data.notes !== undefined ? data.notes : patient.notes,
      }
    });
  }
}

module.exports = PatientsService;
