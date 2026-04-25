const ApiResponse = require("../../utils/apiResponse");
const RemindersService = require("./reminders.service");
const ReminderScheduler = require("../../services/reminder.scheduler");

class RemindersController {
  static async sendNow(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const force = req.body?.force === true;
      const result = await RemindersService.sendReminderForAppointment(
        appointmentId,
        req.user.id,
        force,
      );
      return ApiResponse.success(res, "Recordatorio procesado", result);
    } catch (error) {
      next(error);
    }
  }

  static async run24hJob(req, res, next) {
    try {
      const result = await RemindersService.processUpcoming24hReminders(
        req.user.id,
      );
      return ApiResponse.success(
        res,
        "Ejecución de recordatorios completada",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getLogs(req, res, next) {
    try {
      const { status, appointment_id, limit } = req.query;
      const logs = await RemindersService.getReminderLogs(
        req.user.organization_id,
        {
          status,
          appointmentId: appointment_id,
          limit,
        },
      );
      return ApiResponse.success(res, "Bitácora de recordatorios", logs);
    } catch (error) {
      next(error);
    }
  }

  static async getConfigStatus(req, res, next) {
    try {
      const status = await RemindersService.getConfigStatus(
        req.user.organization_id,
      );
      return ApiResponse.success(res, "Estado de integración WhatsApp", status);
    } catch (error) {
      next(error);
    }
  }

  static async updateConfig(req, res, next) {
    try {
      const status = await RemindersService.updateConfig(
        req.user.organization_id,
        req.body || {},
      );

      ReminderScheduler.start();

      return ApiResponse.success(
        res,
        "Configuración actualizada en runtime",
        status,
      );
    } catch (error) {
      next(error);
    }
  }

  static async sendTestMessage(req, res, next) {
    try {
      const result = await RemindersService.sendTestMessage(
        req.user.organization_id,
        req.user.id,
        req.body || {},
      );

      return ApiResponse.success(res, "Mensaje de prueba enviado", result);
    } catch (error) {
      next(error);
    }
  }

  static async sendTestToPatients(req, res, next) {
    try {
      const result = await RemindersService.sendTestMessageToRegisteredPatients(
        req.user.organization_id,
        req.user.id,
        req.body || {},
      );

      return ApiResponse.success(
        res,
        "Prueba enviada a pacientes registrados",
        result,
      );
    } catch (error) {
      next(error);
    }
  }

  static async verifyWebhook(req, res, next) {
    try {
      const challenge = await RemindersService.verifyWebhook(
        req.query["hub.mode"],
        req.query["hub.verify_token"],
        req.query["hub.challenge"],
      );
      return res.status(200).send(challenge);
    } catch (error) {
      next(error);
    }
  }

  static async receiveWebhook(req, res, next) {
    try {
      const result = await RemindersService.processWebhookPayload(req.body);
      return ApiResponse.success(res, "Webhook procesado", result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RemindersController;
