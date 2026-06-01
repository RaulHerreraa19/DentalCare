const crypto = require("crypto");
const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const { generateDigitalSeal } = require("../../utils/crypto");
const AuditLogService = require("../audit/audit.service");
const StorageService = require("../../services/storage.service");

const DEFAULT_TOOTH_DATA = [];

const normalizeToothData = (value) => {
  if (!value) return DEFAULT_TOOTH_DATA;

  const normalizeEntry = (entry, fallbackToothNumber = null) => ({
    patient_id: entry?.patient_id || null,
    tooth_number:
      `${entry?.tooth_number || entry?.toothNumber || fallbackToothNumber || ""}`.trim(),
    status: `${entry?.status || ""}`.trim() || "NORMAL",
    treatment: `${entry?.treatment || entry?.treatment_text || ""}`.trim(),
    date: entry?.date || entry?.created_at || new Date().toISOString(),
    notes: `${entry?.notes || entry?.finding_text || ""}`.trim(),
    created_by: entry?.created_by || entry?.createdBy || null,
    action: `${entry?.action || "UPDATE"}`.trim() || "UPDATE",
    custom_status:
      `${entry?.custom_status || entry?.customStatus || ""}`.trim(),
  });

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeEntry(item))
      .filter(
        (item) =>
          item.tooth_number || item.status || item.treatment || item.notes,
      );
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .flatMap(([toothNumber, item]) => {
        if (Array.isArray(item)) {
          return item.map((entry) => normalizeEntry(entry, toothNumber));
        }

        if (!item || typeof item !== "object") {
          return [normalizeEntry({ tooth_number: toothNumber })];
        }

        return [normalizeEntry({ ...item, tooth_number: toothNumber })];
      })
      .filter(
        (item) =>
          item.tooth_number || item.status || item.treatment || item.notes,
      );
  }

  return DEFAULT_TOOTH_DATA;
};

const extractBase64ImageBuffer = (value) => {
  const base64Data = String(value || "").replace(
    /^data:image\/\w+;base64,/,
    "",
  );
  if (!base64Data) {
    return null;
  }

  return Buffer.from(base64Data, "base64");
};

const attachLatestOdontogram = async (record) => {
  if (!record) return record;

  const latestOdontogram = await db.odontogram.findFirst({
    where: { medical_record_id: record.id },
    orderBy: { version: "desc" },
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
  });

  return {
    ...record,
    tooth_data: latestOdontogram?.tooth_data || DEFAULT_TOOTH_DATA,
    odontogram_version: latestOdontogram?.version || null,
    latest_odontogram: latestOdontogram,
  };
};

class MedicalRecordsService {
  /**
   * Obtiene o inicializa el expediente para un binomio específico de médico-paciente.
   */
  static async getOrCreateRecord(doctorId, patientId, ipAddress = null, userAgent = null) {
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
      try {
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
      } catch (error) {
        // Si dos requests llegan al mismo tiempo, una puede chocar con @@unique(patient_id, doctor_id).
        // En ese caso reutilizamos el expediente ya creado por la otra request.
        if (error?.code === "P2002") {
          record = await db.medicalRecord.findUnique({
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
        } else {
          throw error;
        }
      }
    }

    if (ipAddress || userAgent) {
      await AuditLogService.log({
        userId: doctorId,
        action: "VIEW",
        targetModel: "MEDICAL_RECORD",
        targetId: record.id,
        organizationId: record.organization_id,
        patientId,
        resourceType: "medical_record",
        resourceId: record.id,
        accessGranted: true,
        ipAddress,
        userAgent,
        metadata: { source: "getOrCreateRecord" },
      });
    }

    return attachLatestOdontogram(record);
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

  static async getHistory(doctorId, patientId, ipAddress = null, userAgent = null) {
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError("Paciente no encontrado", 404);

    const record = await this.getOrCreateRecord(doctorId, patientId);

    if (ipAddress || userAgent) {
      await AuditLogService.log({
        userId: doctorId,
        action: "VIEW",
        targetModel: "MEDICAL_RECORD",
        targetId: record.id,
        organizationId: record.organization_id,
        patientId,
        resourceType: "medical_record_history",
        resourceId: record.id,
        accessGranted: true,
        ipAddress,
        userAgent,
        metadata: { source: "getHistory" },
      });
    }

    const [versions, noteVersions, notes, odontograms, consents, auditLogs] =
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
        db.medicalNote.findMany({
          where: { medical_record_id: record.id },
          orderBy: { created_at: "desc" },
          take: 100,
          include: {
            author: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
                license_number: true,
                specialty: true,
              },
            },
            appointment: {
              select: {
                id: true,
                start_time: true,
                end_time: true,
                status: true,
                reason: true,
                clinic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
      notes,
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

  static async updateRecord(doctorId, patientId, data, ipAddress, userAgent = null) {
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

    // Blindaje de seguridad en Alergias (NOM-004)
    if (data.allergies !== undefined) {
      const existingRecord = await db.medicalRecord.findUnique({
        where: {
          patient_id_doctor_id: {
            patient_id: patientId,
            doctor_id: doctorId,
          },
        },
      });

      if (existingRecord && existingRecord.allergies) {
        const oldAllergies = (existingRecord.allergies || "").trim();
        const newAllergies = (data.allergies || "").trim();

        if (oldAllergies && newAllergies !== oldAllergies) {
          if (!newAllergies.includes(oldAllergies)) {
            data.allergies = `${oldAllergies}\n[Adición por actualización]: ${newAllergies}`;
          }
        }
      }
    }

    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const toothData = normalizeToothData(
      data.tooth_data ?? data.odontogram ?? data.tooth_entries,
    );

    const record = await db.$transaction(async (transaction) => {
      const updatedRecord =
        Object.keys(updateData).length > 0
          ? await transaction.medicalRecord.update({
              where: {
                patient_id_doctor_id: {
                  patient_id: patientId,
                  doctor_id: doctorId,
                },
              },
              data: updateData,
            })
          : await transaction.medicalRecord.findUnique({
              where: {
                patient_id_doctor_id: {
                  patient_id: patientId,
                  doctor_id: doctorId,
                },
              },
            });

      if (!updatedRecord) {
        throw new AppError("Expediente no encontrado", 404);
      }

      if (toothData.length > 0) {
        const latestOdontogram = await transaction.odontogram.findFirst({
          where: { medical_record_id: updatedRecord.id },
          orderBy: { version: "desc" },
        });

        await transaction.odontogram.create({
          data: {
            medical_record_id: updatedRecord.id,
            created_by: doctorId,
            tooth_data: toothData,
            version: (latestOdontogram?.version || 0) + 1,
            status: updatedRecord.status,
            is_locked: updatedRecord.status === "CLOSED",
            signed_at: updatedRecord.status === "CLOSED" ? new Date() : null,
            signature_hash: null,
          },
        });
      }

      return updatedRecord;
    });

    const latestRecord = await attachLatestOdontogram(record);

    await AuditLogService.log({
      userId: doctorId,
      action: "UPDATE",
      targetModel: "MEDICAL_RECORD",
      targetId: latestRecord.id,
      organizationId: latestRecord.organization_id,
      patientId,
      resourceType: "medical_record",
      resourceId: latestRecord.id,
      accessGranted: true,
      ipAddress,
      afterSnapshot: {
        ...updateData,
        odontogram_entries: toothData.length,
      },
    });

    return latestRecord;
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

  static async savePatientSignature(
    doctorId,
    patientId,
    data,
    ipAddress,
    userAgent,
  ) {
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError("Paciente no encontrado", 404);

    const buffer = extractBase64ImageBuffer(data.base64);

    if (!buffer || buffer.length === 0) {
      throw new AppError("La firma del paciente es obligatoria.", 400);
    }

    const record = await this.getOrCreateRecord(doctorId, patientId);

    const signatureUrl = await StorageService.uploadImage(
      buffer,
      data.original_name || "patient-signature.png",
      "patient-signatures",
    );

    const patientSignatureAt = new Date();
    const signatureHash = crypto
      .createHash("sha256")
      .update(
        [
          record.id,
          patientId,
          signatureUrl,
          patientSignatureAt.toISOString(),
          process.env.SIGNATURE_SALT || "dental-care-salt-2026",
        ].join("|"),
      )
      .digest("hex");

    const updatedRecord = await db.medicalRecord.update({
      where: { id: record.id },
      data: {
        patient_signature_url: signatureUrl,
        patient_signature_at: patientSignatureAt,
        patient_signature_hash: signatureHash,
      },
    });

    await AuditLogService.log({
      userId: doctorId,
      action: "UPDATE",
      targetModel: "MEDICAL_RECORD",
      targetId: updatedRecord.id,
      organizationId: updatedRecord.organization_id,
      patientId,
      resourceType: "medical_record_signature",
      resourceId: updatedRecord.id,
      accessGranted: true,
      ipAddress,
      userAgent,
      afterSnapshot: {
        patient_signature_url: signatureUrl,
        patient_signature_at: patientSignatureAt,
      },
      metadata: {
        signature_hash: signatureHash,
      },
    });

    return updatedRecord;
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
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError("Paciente no encontrado", 404);
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
