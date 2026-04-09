const db = require('../../config/database');
const AppError = require('../../utils/AppError');

class MedicalRecordsService {
  /**
   * Obtiene o inicializa el expediente para un binomio específico de médico-paciente.
   */
  static async getOrCreateRecord(doctorId, patientId) {
    // Verificar que el paciente exista
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError('Paciente no encontrado', 404);

    // Buscar expediente existente
    let record = await db.medicalRecord.findUnique({
      where: {
        patient_id_doctor_id: {
          patient_id: patientId,
          doctor_id: doctorId
        }
      },
      include: {
        notes: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    // Si no existe, crear uno vacío inicial
    if (!record) {
      record = await db.medicalRecord.create({
        data: {
          patient_id: patientId,
          doctor_id: doctorId,
          organization_id: patient.organization_id,
        },
        include: {
          notes: true
        }
      });
    }

    return record;
  }

  /**
   * Firma digitalmente una nota médica.
   * Una vez firmada, la nota es inmutable.
   */
  static async signNote(doctorId, noteId, ipAddress) {
    const doctor = await db.user.findUnique({ where: { id: doctorId } });
    if (!doctor || !doctor.license_number) {
      throw new AppError('El médico debe configurar su cédula profesional en su perfil para firmar.', 400);
    }

    const note = await db.medicalNote.findUnique({
      where: { id: noteId },
      include: { medical_record: true }
    });

    if (!note) throw new AppError('Nota no encontrada', 404);
    if (note.is_signed) throw new AppError('Esta nota ya ha sido firmada.', 400);

    // Generar sello digital
    const signatureHash = require('../../utils/crypto').generateDigitalSeal({
      patientId: note.medical_record.patient_id,
      doctorId: doctorId,
      content: note.content,
      timestamp: new Date().toISOString(),
      licenseNumber: doctor.license_number
    });

    const signedNote = await db.medicalNote.update({
      where: { id: noteId },
      data: {
        is_signed: true,
        signed_at: new Date(),
        signature_hash: signatureHash
      }
    });

    // Auditoría legal
    const AuditLogService = require('../audit/audit.service');
    await AuditLogService.log({
      userId: doctorId,
      action: 'SIGN',
      targetModel: 'MEDICAL_NOTE',
      targetId: noteId,
      metadata: { ip: ipAddress, hash: signatureHash }
    });

    return signedNote;
  }

  static async updateRecord(doctorId, patientId, data, ipAddress) {
    // ... existing ...
    const allowedFields = [
      'diagnosis', 'treatment_plan', 'family_history', 'pathological_history',
      'non_pathological_history', 'allergies', 'surgeries', 'current_medications',
      'dental_history', 'brushing_frequency', 'use_floss'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const record = await db.medicalRecord.update({
      where: {
        patient_id_doctor_id: {
          patient_id: patientId,
          doctor_id: doctorId
        }
      },
      data: updateData
    });

    const AuditLogService = require('../audit/audit.service');
    await AuditLogService.log({
      userId: doctorId,
      action: 'UPDATE',
      targetModel: 'MEDICAL_RECORD',
      targetId: record.id,
      metadata: { ip: ipAddress }
    });

    return record;
  }

  /**
   * Las notas de evolución se crean vinculadas a una cita y al expediente.
   */
  static async addProgressNote(doctorId, patientId, data, ipAddress) {
    const record = await this.getOrCreateRecord(doctorId, patientId);

    const note = await db.medicalNote.create({
      data: {
        medical_record_id: record.id,
        appointment_id: data.appointment_id || null,
        content: data.content,
        note_type: data.note_type || 'CONSULTATION',
      }
    });

    const AuditLogService = require('../audit/audit.service');
    await AuditLogService.log({
      userId: doctorId,
      action: 'CREATE',
      targetModel: 'MEDICAL_NOTE',
      targetId: note.id,
      metadata: { ip: ipAddress }
    });

    return note;
  }
}

module.exports = MedicalRecordsService;
