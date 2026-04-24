const AppError = require("../utils/AppError");
const db = require("../config/database");

class WhatsAppService {
  static normalizePhone(rawPhone) {
    const digits = String(rawPhone || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 10) return `52${digits}`;
    return digits;
  }

  static getEnvConfig() {
    return {
      enabled:
        String(process.env.WHATSAPP_ENABLED || "false").toLowerCase() ===
        "true",
      dryRun:
        String(process.env.WHATSAPP_DRY_RUN || "false").toLowerCase() ===
        "true",
      token: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
      templateName:
        process.env.WHATSAPP_TEMPLATE_NAME || "appointment_confirmation_24h",
      templateLang: process.env.WHATSAPP_TEMPLATE_LANG || "es_MX",
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
      remindersEnabled:
        String(process.env.REMINDERS_ENABLED || "false").toLowerCase() ===
        "true",
      jobIntervalMs: Number(process.env.REMINDERS_JOB_INTERVAL_MS || 300000),
      windowMinutes: Number(process.env.REMINDERS_WINDOW_MINUTES || 15),
    };
  }

  static getConfig(organizationConfig = null) {
    const env = this.getEnvConfig();
    if (!organizationConfig) return env;

    return {
      enabled: organizationConfig.enabled,
      dryRun: organizationConfig.dry_run,
      token: organizationConfig.access_token || env.token,
      phoneNumberId: organizationConfig.phone_number_id || env.phoneNumberId,
      apiVersion: organizationConfig.api_version || env.apiVersion,
      templateName: organizationConfig.template_name || env.templateName,
      templateLang: organizationConfig.template_lang || env.templateLang,
      webhookVerifyToken:
        organizationConfig.webhook_verify_token || env.webhookVerifyToken,
      remindersEnabled: organizationConfig.reminders_enabled,
      jobIntervalMs: organizationConfig.job_interval_ms || env.jobIntervalMs,
      windowMinutes: organizationConfig.window_minutes || env.windowMinutes,
    };
  }

  static isEnabled(organizationConfig = null) {
    return this.getConfig(organizationConfig).enabled;
  }

  static getIntegrationStatus(organizationConfig = null) {
    const cfg = this.getConfig(organizationConfig);
    const missing = [];

    if (!cfg.token) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!cfg.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (!cfg.webhookVerifyToken) missing.push("WHATSAPP_WEBHOOK_VERIFY_TOKEN");

    return {
      enabled: cfg.enabled,
      dryRun: cfg.dryRun,
      apiVersion: cfg.apiVersion,
      templateName: cfg.templateName,
      templateLang: cfg.templateLang,
      phoneNumberId: cfg.phoneNumberId || null,
      tokenConfigured: Boolean(cfg.token),
      webhookVerifyTokenConfigured: Boolean(cfg.webhookVerifyToken),
      remindersEnabled: cfg.remindersEnabled,
      jobIntervalMs: cfg.jobIntervalMs,
      windowMinutes: cfg.windowMinutes,
      missing,
      readyForProduction: cfg.enabled && !cfg.dryRun && missing.length === 0,
      readyForDryRun: cfg.enabled && missing.length === 0,
    };
  }

  static async getOrganizationConfig(organizationId) {
    if (!organizationId) return null;
    return db.organizationWhatsAppConfig.findUnique({
      where: { organization_id: organizationId },
    });
  }

  static async isWebhookTokenValid(token) {
    if (!token) return false;

    if (this.getEnvConfig().webhookVerifyToken === token) {
      return true;
    }

    const found = await db.organizationWhatsAppConfig.findFirst({
      where: { webhook_verify_token: token },
      select: { id: true },
    });

    return Boolean(found);
  }

  static async upsertOrganizationConfig(organizationId, input = {}) {
    if (!organizationId) {
      throw new AppError(
        "No se pudo determinar la organización para guardar configuración.",
        400,
      );
    }

    const allowedKeys = [
      "enabled",
      "dryRun",
      "token",
      "phoneNumberId",
      "apiVersion",
      "templateName",
      "templateLang",
      "webhookVerifyToken",
      "remindersEnabled",
      "jobIntervalMs",
      "windowMinutes",
    ];

    const updates = {};
    for (const key of allowedKeys) {
      if (input[key] !== undefined) {
        updates[key] = input[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(
        "No se recibieron campos válidos para actualizar configuración.",
        400,
      );
    }

    const persisted = await db.organizationWhatsAppConfig.upsert({
      where: { organization_id: organizationId },
      create: {
        organization_id: organizationId,
        enabled: Boolean(updates.enabled),
        dry_run: updates.dryRun === undefined ? true : Boolean(updates.dryRun),
        access_token: updates.token ? String(updates.token) : null,
        phone_number_id: updates.phoneNumberId
          ? String(updates.phoneNumberId)
          : null,
        api_version: updates.apiVersion ? String(updates.apiVersion) : "v21.0",
        template_name: updates.templateName
          ? String(updates.templateName)
          : "appointment_confirmation_24h",
        template_lang: updates.templateLang
          ? String(updates.templateLang)
          : "es_MX",
        webhook_verify_token: updates.webhookVerifyToken
          ? String(updates.webhookVerifyToken)
          : null,
        reminders_enabled:
          updates.remindersEnabled === undefined
            ? false
            : Boolean(updates.remindersEnabled),
        job_interval_ms: updates.jobIntervalMs
          ? Number(updates.jobIntervalMs)
          : 300000,
        window_minutes: updates.windowMinutes
          ? Number(updates.windowMinutes)
          : 15,
      },
      update: {
        ...(updates.enabled !== undefined
          ? { enabled: Boolean(updates.enabled) }
          : {}),
        ...(updates.dryRun !== undefined
          ? { dry_run: Boolean(updates.dryRun) }
          : {}),
        ...(updates.token !== undefined
          ? { access_token: updates.token ? String(updates.token) : null }
          : {}),
        ...(updates.phoneNumberId !== undefined
          ? {
              phone_number_id: updates.phoneNumberId
                ? String(updates.phoneNumberId)
                : null,
            }
          : {}),
        ...(updates.apiVersion !== undefined
          ? { api_version: String(updates.apiVersion || "v21.0") }
          : {}),
        ...(updates.templateName !== undefined
          ? {
              template_name: String(
                updates.templateName || "appointment_confirmation_24h",
              ),
            }
          : {}),
        ...(updates.templateLang !== undefined
          ? { template_lang: String(updates.templateLang || "es_MX") }
          : {}),
        ...(updates.webhookVerifyToken !== undefined
          ? {
              webhook_verify_token: updates.webhookVerifyToken
                ? String(updates.webhookVerifyToken)
                : null,
            }
          : {}),
        ...(updates.remindersEnabled !== undefined
          ? { reminders_enabled: Boolean(updates.remindersEnabled) }
          : {}),
        ...(updates.jobIntervalMs !== undefined
          ? { job_interval_ms: Number(updates.jobIntervalMs || 300000) }
          : {}),
        ...(updates.windowMinutes !== undefined
          ? { window_minutes: Number(updates.windowMinutes || 15) }
          : {}),
      },
    });

    return this.getIntegrationStatus(persisted);
  }

  static async sendAppointmentConfirmation({
    to,
    patientName,
    clinicName,
    startTime,
    appointmentId,
    organizationConfig = null,
  }) {
    const cfg = this.getConfig(organizationConfig);

    if (!cfg.enabled) {
      return { skipped: true, messageId: null, reason: "whatsapp-disabled" };
    }

    if (cfg.dryRun) {
      console.log("[WHATSAPP_DRY_RUN] Reminder", {
        to,
        patientName,
        clinicName,
        startTime,
        appointmentId,
      });
      return {
        skipped: true,
        messageId: null,
        reason: "dry-run",
      };
    }

    if (!cfg.token || !cfg.phoneNumberId) {
      throw new AppError("Configuración de WhatsApp incompleta.", 500);
    }

    const endpoint = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`;

    const startDate = new Date(startTime);
    const dateText = startDate.toLocaleDateString("es-MX");
    const timeText = startDate.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: cfg.templateName,
        language: { code: cfg.templateLang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: patientName || "Paciente" },
              { type: "text", text: clinicName || "Clínica" },
              { type: "text", text: dateText },
              { type: "text", text: timeText },
              { type: "text", text: appointmentId },
            ],
          },
        ],
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.error?.message || "Error al enviar mensaje por WhatsApp.";
      throw new AppError(errorMessage, response.status || 500);
    }

    const messageId = data?.messages?.[0]?.id || null;
    return { skipped: false, messageId, reason: "sent" };
  }

  static async sendTestMessage({
    to,
    organizationConfig = null,
    templateName = 'hello_world',
    templateLang = 'en_US',
  }) {
    const cfg = this.getConfig(organizationConfig);
    const normalizedTo = this.normalizePhone(to);

    if (!normalizedTo) {
      throw new AppError('Número de destino inválido para WhatsApp.', 400);
    }

    if (!cfg.token || !cfg.phoneNumberId) {
      throw new AppError('Configuración de WhatsApp incompleta.', 400);
    }

    const endpoint = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: normalizedTo,
      type: 'template',
      template: {
        name: String(templateName || 'hello_world'),
        language: { code: String(templateLang || 'en_US') },
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'Error al enviar mensaje de prueba por WhatsApp.';
      throw new AppError(errorMessage, response.status || 500);
    }

    return {
      skipped: false,
      messageId: data?.messages?.[0]?.id || null,
      reason: 'sent-test',
      to: normalizedTo,
      templateName: String(templateName || 'hello_world'),
      templateLang: String(templateLang || 'en_US'),
    };
  }
}

module.exports = WhatsAppService;
