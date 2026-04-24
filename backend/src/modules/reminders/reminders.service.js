const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const AuditLogService = require("../audit/audit.service");
const WhatsAppService = require("../../services/whatsapp.service");

const REMINDER_TYPE = "WHATSAPP_CONFIRM_24H";
const REMINDER_LOCK_NAMESPACE = 91324;
const INBOUND_MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;
const inboundMessageCache = new Map();

const normalizePhone = (rawPhone) => {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 10) {
    return `52${digits}`;
  }

  if (digits.startsWith("52") && digits.length >= 12) {
    return digits;
  }

  return digits;
};

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const extractAppointmentIdFromContent = (content) => {
  if (!content) return null;
  const match = String(content).match(UUID_REGEX);
  return match ? match[0] : null;
};

const shouldProcessInboundMessage = (messageId) => {
  if (!messageId) return true;

  const now = Date.now();

  for (const [id, seenAt] of inboundMessageCache.entries()) {
    if (now - seenAt > INBOUND_MESSAGE_TTL_MS) {
      inboundMessageCache.delete(id);
    }
  }

  if (inboundMessageCache.has(messageId)) {
    return false;
  }

  inboundMessageCache.set(messageId, now);
  return true;
};

class RemindersService {
  static async tryAcquireReminderLock(appointmentId) {
    if (!appointmentId) return false;

    const result = await db.$queryRaw`
      SELECT pg_try_advisory_lock(${REMINDER_LOCK_NAMESPACE}, hashtext(${appointmentId})) AS locked
    `;

    return Boolean(result?.[0]?.locked);
  }

  static async releaseReminderLock(appointmentId) {
    if (!appointmentId) return;

    await db.$queryRaw`
      SELECT pg_advisory_unlock(${REMINDER_LOCK_NAMESPACE}, hashtext(${appointmentId}))
    `;
  }

  static async findInboundReminderMatch({ from, content, messageContextId }) {
    if (messageContextId) {
      const byContext = await db.appointmentReminder.findFirst({
        where: {
          reminder_type: REMINDER_TYPE,
          status: "SENT",
          provider_message_id: messageContextId,
        },
        include: {
          appointment: {
            include: {
              patient: { select: { phone: true } },
            },
          },
        },
      });

      if (byContext) return byContext;
    }

    const appointmentIdFromText = extractAppointmentIdFromContent(content);
    if (appointmentIdFromText) {
      const byAppointmentId = await db.appointmentReminder.findFirst({
        where: {
          reminder_type: REMINDER_TYPE,
          status: "SENT",
          appointment_id: appointmentIdFromText,
          sent_at: {
            gte: new Date(Date.now() - 72 * 60 * 60 * 1000),
          },
        },
        include: {
          appointment: {
            include: {
              patient: { select: { phone: true } },
            },
          },
        },
      });

      if (
        byAppointmentId &&
        normalizePhone(byAppointmentId.appointment?.patient?.phone) === from
      ) {
        return byAppointmentId;
      }
    }

    const recent = await db.appointmentReminder.findMany({
      where: {
        reminder_type: REMINDER_TYPE,
        status: "SENT",
        sent_at: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      },
      include: {
        appointment: {
          include: {
            patient: { select: { phone: true } },
          },
        },
      },
      orderBy: { sent_at: "desc" },
      take: 50,
    });

    const matches = recent.filter(
      (r) => normalizePhone(r.appointment?.patient?.phone) === from,
    );

    if (matches.length === 1) return matches[0];
    if (matches.length > 1) return null;

    return null;
  }

  static getWindowMinutes(config) {
    const parsed = Number(config?.windowMinutes ?? 15);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
  }

  static async sendReminderForAppointment(
    appointmentId,
    userId = null,
    force = false,
  ) {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { first_name: true, last_name: true, phone: true } },
        clinic: { select: { name: true } },
      },
    });

    if (!appointment) {
      throw new AppError("Cita no encontrada para recordatorio.", 404);
    }

    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      throw new AppError(
        "La cita no está en un estado válido para enviar recordatorio.",
        400,
      );
    }

    const phone = normalizePhone(appointment.patient?.phone);
    if (!phone) {
      throw new AppError(
        "El paciente no tiene teléfono válido para WhatsApp.",
        400,
      );
    }

    const orgConfig = await WhatsAppService.getOrganizationConfig(
      appointment.organization_id,
    );
    const integrationStatus = WhatsAppService.getIntegrationStatus(orgConfig);
    if (!integrationStatus.remindersEnabled) {
      return {
        skipped: true,
        reason: "reminders-disabled",
      };
    }

    let lockAcquired = false;
    let reminder = null;

    try {
      lockAcquired = await this.tryAcquireReminderLock(appointment.id);
      if (!lockAcquired) {
        return { skipped: true, reason: "in-progress" };
      }

      reminder = await db.appointmentReminder.upsert({
        where: {
          appointment_id_reminder_type: {
            appointment_id: appointment.id,
            reminder_type: REMINDER_TYPE,
          },
        },
        create: {
          appointment_id: appointment.id,
          reminder_type: REMINDER_TYPE,
          scheduled_for: new Date(appointment.start_time),
          status: "PENDING",
        },
        update: {
          scheduled_for: new Date(appointment.start_time),
        },
      });

      if (!force && reminder.status === "SENT") {
        return { skipped: true, reason: "already-sent", reminder };
      }

      const sendResult = await WhatsAppService.sendAppointmentConfirmation({
        to: phone,
        patientName: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
        clinicName: appointment.clinic?.name,
        startTime: appointment.start_time,
        appointmentId: appointment.id,
        organizationConfig: orgConfig,
      });

      const updated = await db.appointmentReminder.update({
        where: { id: reminder.id },
        data: {
          status: sendResult.skipped ? "PENDING" : "SENT",
          sent_at: sendResult.skipped ? null : new Date(),
          provider_message_id: sendResult.messageId,
          last_error: sendResult.skipped ? sendResult.reason : null,
        },
      });

      await AuditLogService.log({
        userId,
        action: "WHATSAPP_REMINDER_SENT",
        targetModel: "APPOINTMENT",
        targetId: appointment.id,
        metadata: {
          reminderType: REMINDER_TYPE,
          messageId: sendResult.messageId,
          skipped: sendResult.skipped,
          reason: sendResult.reason,
        },
      });

      return { skipped: sendResult.skipped, reminder: updated };
    } catch (error) {
      let updated = null;

      if (reminder?.id) {
        updated = await db.appointmentReminder.update({
          where: { id: reminder.id },
          data: {
            status: "FAILED",
            retry_count: { increment: 1 },
            last_error: error.message || "Error desconocido en envío WhatsApp",
          },
        });
      }

      await AuditLogService.log({
        userId,
        action: "WHATSAPP_REMINDER_FAILED",
        targetModel: "APPOINTMENT",
        targetId: appointment.id,
        metadata: {
          reminderType: REMINDER_TYPE,
          error: error.message,
        },
      });

      throw new AppError(
        updated?.last_error ||
          error.message ||
          "No se pudo enviar el recordatorio.",
        500,
      );
    } finally {
      if (lockAcquired) {
        await this.releaseReminderLock(appointment.id);
      }
    }
  }

  static async processUpcoming24hReminders(userId = null) {
    const now = new Date();
    const configs = await db.organizationWhatsAppConfig.findMany({
      where: { reminders_enabled: true, enabled: true },
      select: { organization_id: true, window_minutes: true },
    });

    const appointments = [];
    const scannedWindows = [];

    for (const config of configs) {
      const windowMinutes = this.getWindowMinutes({
        windowMinutes: config.window_minutes,
      });
      const lookbackMinutes = Math.max(windowMinutes, 5);
      const nominalTarget = now.getTime() + 24 * 60 * 60 * 1000;
      const targetStart = new Date(nominalTarget - lookbackMinutes * 60 * 1000);
      const targetEnd = new Date(nominalTarget + windowMinutes * 60 * 1000);

      const orgAppointments = await db.appointment.findMany({
        where: {
          organization_id: config.organization_id,
          start_time: {
            gte: targetStart,
            lt: targetEnd,
          },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: { id: true },
      });

      appointments.push(...orgAppointments);
      scannedWindows.push({
        organizationId: config.organization_id,
        targetStart,
        targetEnd,
      });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const appointment of appointments) {
      try {
        const result = await this.sendReminderForAppointment(
          appointment.id,
          userId,
          false,
        );
        if (result.skipped) skipped += 1;
        else sent += 1;
      } catch (error) {
        failed += 1;
      }
    }

    return {
      scanned: appointments.length,
      sent,
      skipped,
      failed,
      windows: scannedWindows,
    };
  }

  static async getReminderLogs(
    organizationId,
    { status, appointmentId, limit = 50 },
  ) {
    return db.appointmentReminder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(appointmentId ? { appointment_id: appointmentId } : {}),
        appointment: {
          organization_id: organizationId,
        },
      },
      include: {
        appointment: {
          select: {
            id: true,
            start_time: true,
            status: true,
            patient: {
              select: { first_name: true, last_name: true, phone: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: Number(limit),
    });
  }

  static async verifyWebhook(mode, token, challenge) {
    const isValid = await WhatsAppService.isWebhookTokenValid(token);
    if (mode === "subscribe" && isValid) {
      return challenge;
    }
    throw new AppError("Webhook verification failed", 403);
  }

  static async processWebhookPayload(payload) {
    const incomingMessages = [];
    const entries = payload?.entry || [];
    let duplicateInboundIgnored = 0;

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value || {};
        const messages = value?.messages || [];
        incomingMessages.push(...messages);
      }
    }

    for (const message of incomingMessages) {
      const inboundMessageId = message?.id || null;
      if (!shouldProcessInboundMessage(inboundMessageId)) {
        duplicateInboundIgnored += 1;
        continue;
      }

      const from = normalizePhone(message?.from);
      if (!from) continue;

      const messageContextId = message?.context?.id || null;

      const textBody =
        message?.text?.body ||
        message?.button?.text ||
        message?.interactive?.button_reply?.title ||
        message?.interactive?.button_reply?.id ||
        "";

      const content = String(textBody).trim().toLowerCase();
      if (!content) continue;

      let desiredStatus = null;
      let desiredAction = null;
      if (content.startsWith("1")) desiredStatus = "CONFIRMED";
      if (content.startsWith("2")) desiredAction = "REPROGRAM_REQUEST";
      if (content.startsWith("3")) desiredStatus = "CANCELLED";

      if (!desiredStatus && !desiredAction) {
        await AuditLogService.log({
          userId: null,
          action: "WHATSAPP_INBOUND_IGNORED",
          targetModel: "APPOINTMENT",
          targetId: null,
          metadata: { from, content },
        });
        continue;
      }

      const match = await this.findInboundReminderMatch({
        from,
        content,
        messageContextId,
      });

      if (!match) {
        await AuditLogService.log({
          userId: null,
          action: "WHATSAPP_INBOUND_NO_MATCH",
          targetModel: "APPOINTMENT",
          targetId: null,
          metadata: { from, content, messageContextId },
        });
        continue;
      }

      if (desiredAction === "REPROGRAM_REQUEST") {
        await AuditLogService.log({
          userId: null,
          action: "WHATSAPP_INBOUND_REPROGRAM_REQUEST",
          targetModel: "APPOINTMENT",
          targetId: match.appointment_id,
          metadata: { from, content },
        });
        continue;
      }

      if (
        !match.appointment ||
        !["PENDING", "CONFIRMED"].includes(match.appointment.status)
      ) {
        await AuditLogService.log({
          userId: null,
          action: "WHATSAPP_INBOUND_STALE_IGNORED",
          targetModel: "APPOINTMENT",
          targetId: match.appointment_id,
          metadata: {
            from,
            content,
            appointmentStatus: match.appointment?.status || null,
          },
        });
        continue;
      }

      const updateData =
        desiredStatus === "CANCELLED"
          ? {
              status: "CANCELLED",
              cancel_reason: "Cancelada por confirmación WhatsApp del paciente",
            }
          : { status: "CONFIRMED" };

      await db.appointment.update({
        where: { id: match.appointment_id },
        data: updateData,
      });

      await AuditLogService.log({
        userId: null,
        action: "WHATSAPP_INBOUND_APPLIED",
        targetModel: "APPOINTMENT",
        targetId: match.appointment_id,
        metadata: { from, content, desiredStatus },
      });
    }

    return {
      processed: incomingMessages.length,
      duplicateInboundIgnored,
    };
  }

  static async getConfigStatus(organizationId) {
    const config = await WhatsAppService.getOrganizationConfig(organizationId);
    return WhatsAppService.getIntegrationStatus(config);
  }

  static async updateConfig(organizationId, configInput) {
    return WhatsAppService.upsertOrganizationConfig(
      organizationId,
      configInput,
    );
  }

  static async sendTestMessage(organizationId, userId, payload = {}) {
    const orgConfig = await WhatsAppService.getOrganizationConfig(organizationId);

    const result = await WhatsAppService.sendTestMessage({
      to: payload.to,
      templateName: payload.templateName,
      templateLang: payload.templateLang,
      organizationConfig: orgConfig,
    });

    await AuditLogService.log({
      userId: userId || null,
      action: 'WHATSAPP_TEST_SENT',
      targetModel: 'ORGANIZATION_WHATSAPP_CONFIG',
      targetId: organizationId,
      metadata: {
        to: result.to,
        templateName: result.templateName,
        templateLang: result.templateLang,
        messageId: result.messageId,
      },
    });

    return result;
  }

  static async sendTestMessageToRegisteredPatients(
    organizationId,
    userId,
    payload = {},
  ) {
    const orgConfig = await WhatsAppService.getOrganizationConfig(organizationId);

    const patients = await db.patient.findMany({
      where: {
        organization_id: organizationId,
        phone: {
          not: null,
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
      },
      orderBy: { created_at: 'desc' },
      take: Number(payload.limit || 100),
    });

    const uniquePhones = new Map();
    for (const patient of patients) {
      const normalized = WhatsAppService.normalizePhone(patient.phone);
      if (!normalized) continue;
      if (!uniquePhones.has(normalized)) {
        uniquePhones.set(normalized, patient);
      }
    }

    if (uniquePhones.size === 0) {
      throw new AppError(
        'No hay pacientes con teléfono válido para prueba WhatsApp.',
        400,
      );
    }

    let sent = 0;
    let failed = 0;
    const details = [];

    for (const [phone, patient] of uniquePhones.entries()) {
      try {
        const result = await WhatsAppService.sendTestMessage({
          to: phone,
          templateName: payload.templateName,
          templateLang: payload.templateLang,
          organizationConfig: orgConfig,
        });

        sent += 1;
        details.push({
          patient_id: patient.id,
          patient_name: `${patient.first_name} ${patient.last_name}`.trim(),
          to: result.to,
          status: 'SENT',
          messageId: result.messageId,
        });
      } catch (error) {
        failed += 1;
        details.push({
          patient_id: patient.id,
          patient_name: `${patient.first_name} ${patient.last_name}`.trim(),
          to: phone,
          status: 'FAILED',
          error: error.message,
        });
      }
    }

    await AuditLogService.log({
      userId: userId || null,
      action: 'WHATSAPP_TEST_BULK_SENT',
      targetModel: 'ORGANIZATION_WHATSAPP_CONFIG',
      targetId: organizationId,
      metadata: {
        totalCandidates: uniquePhones.size,
        sent,
        failed,
        templateName: String(payload.templateName || 'hello_world'),
        templateLang: String(payload.templateLang || 'en_US'),
      },
    });

    return {
      totalCandidates: uniquePhones.size,
      sent,
      failed,
      details,
    };
  }
}

module.exports = RemindersService;
