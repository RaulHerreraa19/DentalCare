const crypto = require("crypto");
const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const { generateDigitalSeal } = require("../../utils/crypto");
const AuditLogService = require("../audit/audit.service");

class MedicalRecordsService {
  /**
   * Obtiene o inicializa el expediente para un binomio específico de médico-paciente.
   */
  static async getOrCreateRecord(doctorId, patientId) {
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError("Paciente no encontrado", 404);

    let record = await db.medicalRecord.findUnique({
      where: {
        patient_id_doctor_id: {
          patient_id: patientId,
          doctor_id: doctorId,
        },
      },
      include: {
        notes: {
          orderBy: { created_at: "desc" },
          take: 10,
        },
      },
    });

    if (!record) {
      record = await db.medicalRecord.create({
        data: {
          patient_id: patientId,
          doctor_id: doctorId,
          organization_id: patient.organization_id,
        },
        include: {
          notes: true,
        },
      });
    }

    return record;
  }

  static async getAllRecordsByDoctor(doctorId) {
    return db.medicalRecord.findMany({
      where: { doctor_id: doctorId },
      include: {
        patient: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            date_of_birth: true,
          },
        },
        doctor: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            license_number: true,
            specialty: true,
          },
        },
        versions: {
          orderBy: { version_number: "desc" },
          take: 1,
          select: {
            id: true,
            version_number: true,
            change_reason: true,
            is_locked: true,
            signed_at: true,
            created_at: true,
          },
        },
        notes: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            note_type: true,
            is_signed: true,
            created_at: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    });
  }

  static async getHistory(doctorId, patientId) {
    const { patient, record } = await this.getOrCreateRecord(
      doctorId,
      patientId,
    );

    const [versions, noteVersions, odontograms, consents, auditLogs] =
      await Promise.all([
        db.medicalRecordVersion.findMany({
          where: { medical_record_id: record.id },
          orderBy: { version_number: "desc" },
          take: 50,
          include: {
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
                license_number: true,
                specialty: true,
              },
            },
          },
        }),
        db.medicalNoteVersion.findMany({
          where: { medical_note: { medical_record_id: record.id } },
          orderBy: { created_at: "desc" },
          take: 50,
          include: {
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
                license_number: true,
                specialty: true,
              },
            },
          },
        }),
        db.odontogram.findMany({
          where: { medical_record_id: record.id },
          orderBy: { version: "desc" },
          take: 50,
          include: {
            creator: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
                license_number: true,
                specialty: true,
              },
            },
          },
        }),
        db.consent.findMany({
          where: { patient_id: patient.id },
          orderBy: { version: "desc" },
          include: {
            accepted_by_user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
              },
            },
          },
        }),
        db.auditLog.findMany({
          where: {
            patient_id: patient.id,
            organization_id: patient.organization_id,
          },
          orderBy: { created_at: "desc" },
          take: 100,
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
              },
            },
          },
        }),
      ]);

    return {
      record,
      versions,
      note_versions: noteVersions,
      odontograms,
      consents,
      audit_logs: auditLogs,
    };
  }

  /**
   * Firma digitalmente una nota médica.
   * Una vez firmada, la nota es inmutable.
   */
  static async signNote(doctorId, noteId, ipAddress) {
    const doctor = await db.user.findUnique({ where: { id: doctorId } });
    if (!doctor || !doctor.license_number) {
      throw new AppError(
        "El médico debe configurar su cédula profesional en su perfil para firmar.",
        400,
      );
    }

    const note = await db.medicalNote.findUnique({
      where: { id: noteId },
      include: { medical_record: true },
    });

    if (!note) throw new AppError("Nota no encontrada", 404);
    if (note.is_signed)
      throw new AppError("Esta nota ya ha sido firmada.", 400);

    const signatureHash = generateDigitalSeal({
      patientId: note.medical_record.patient_id,
      doctorId,
      content: note.content,
      timestamp: new Date().toISOString(),
      licenseNumber: doctor.license_number,
    });

    const signedNote = await db.medicalNote.update({
      where: { id: noteId },
      data: {
        is_signed: true,
        signed_at: new Date(),
        signature_hash: signatureHash,
      },
    });

    await AuditLogService.log({
      userId: doctorId,
      action: "SIGN",
      targetModel: "MEDICAL_NOTE",
      targetId: noteId,
      organizationId: note.medical_record.organization_id,
      patientId: note.medical_record.patient_id,
      resourceType: "medical_note",
      resourceId: noteId,
      accessGranted: true,
      ipAddress,
      afterSnapshot: signedNote,
      metadata: { hash: signatureHash },
    });

    return signedNote;
  }

  static async updateRecord(doctorId, patientId, data, ipAddress) {
    const allowedFields = [
      "diagnosis",
      "treatment_plan",
      "family_history",
      "pathological_history",
      "non_pathological_history",
      "allergies",
      "surgeries",
      "current_medications",
      "dental_history",
      "brushing_frequency",
      "use_floss",
      "clinical_notes",
      "medications",
      "status",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const record = await db.medicalRecord.update({
      where: {
        patient_id_doctor_id: {
          patient_id: patientId,
          doctor_id: doctorId,
        },
      },
      data: updateData,
    });

    await AuditLogService.log({
      userId: doctorId,
      action: "UPDATE",
      targetModel: "MEDICAL_RECORD",
      targetId: record.id,
      organizationId: record.organization_id,
      patientId,
      resourceType: "medical_record",
      resourceId: record.id,
      accessGranted: true,
      ipAddress,
      afterSnapshot: updateData,
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
        author_id: doctorId,
        content: data.content,
        note_type: data.note_type || "CONSULTATION",
      },
    });

    await AuditLogService.log({
      userId: doctorId,
      action: "CREATE",
      targetModel: "MEDICAL_NOTE",
      targetId: note.id,
      organizationId: record.organization_id,
      patientId,
      resourceType: "medical_note",
      resourceId: note.id,
      accessGranted: true,
      ipAddress,
      afterSnapshot: note,
    });

    return note;
  }

  static async upsertConsent(doctorId, patientId, data, ipAddress, userAgent) {
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError("Paciente no encontrado", 404);

    const consentType = data.consent_type;
    if (!consentType) {
      throw new AppError("El tipo de consentimiento es obligatorio.", 400);
    }

    const title = data.title || "Consentimiento informado";
    const content = data.content || "";
    const lastConsent = await db.consent.findFirst({
      where: {
        patient_id: patientId,
        consent_type: consentType,
      },
      orderBy: { version: "desc" },
    });

    const nextVersion = (lastConsent?.version || 0) + 1;
    const accepted = data.accepted !== false;
    const acceptedAt = accepted ? new Date() : null;
    const signatureType =
      data.signature_type || (accepted ? "CLICK_WRAP" : null);
    const documentHash = crypto
      .createHash("sha256")
      .update(
        [
          patientId,
          consentType,
          title,
          content,
          nextVersion,
          accepted ? "accepted" : "pending",
          process.env.SIGNATURE_SALT || "dental-care-salt-2026",
        ].join("|"),
      )
      .digest("hex");

    const consent = await db.consent.create({
      data: {
        organization_id: patient.organization_id,
        patient_id: patientId,
        consent_type: consentType,
        title,
        content,
        version: nextVersion,
        language: data.language || "es_MX",
        accepted,
        accepted_at: acceptedAt,
        accepted_by: accepted ? doctorId : null,
        signature_type: signatureType,
        document_hash: documentHash,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        revoked_at: data.revoked ? new Date() : null,
        revoked_reason: data.revoked_reason || null,
      },
      include: {
        accepted_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
    });

    await AuditLogService.log({
      userId: doctorId,
      action: accepted ? "SIGN" : "UPDATE",
      targetModel: "CONSENT",
      targetId: consent.id,
      organizationId: patient.organization_id,
      patientId,
      resourceType: "consent",
      resourceId: consent.id,
      accessGranted: true,
      ipAddress,
      userAgent,
      afterSnapshot: consent,
      reason: data.revoked ? data.revoked_reason || null : null,
      metadata: {
        consent_type: consentType,
        version: nextVersion,
      },
    });

    return consent;
  }

  static async listConsents(doctorId, patientId) {
    const { patient } = await this.getOrCreateRecord(doctorId, patientId);
    return db.consent.findMany({
      where: { patient_id: patient.id },
      orderBy: [{ consent_type: "asc" }, { version: "desc" }],
      include: {
        accepted_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
          },
        },
      },
    });
  }
}

module.exports = MedicalRecordsService;
