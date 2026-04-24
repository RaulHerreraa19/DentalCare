const BillingService = require("./billing.service");
const ApiResponse = require("../../utils/apiResponse");

class BillingController {
  static async collectPayment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { finalAmount, paymentMethod } = req.body;
      const appointment = await BillingService.collectPayment(
        req.user.organization_id,
        req.user.id,
        appointmentId,
        finalAmount,
        paymentMethod,
      );
      return ApiResponse.success(
        res,
        "Pago registrado y cita completada",
        appointment,
      );
    } catch (error) {
      next(error);
    }
  }

  static async recordMovement(req, res, next) {
    try {
      const movement = await BillingService.recordMovement(
        req.user.organization_id,
        req.user.id,
        req.body,
      );
      return ApiResponse.success(
        res,
        "Movimiento registrado exitosamente",
        movement,
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const history = await BillingService.getHistory(
        req.user.organization_id,
        req.query,
      );
      return ApiResponse.success(
        res,
        "Historial de movimientos recuperado",
        history,
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BillingController;
