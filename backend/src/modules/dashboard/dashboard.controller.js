const OwnerDashboardService = require("./dashboard.service");
const ApiResponse = require("../../utils/apiResponse");

class OwnerDashboardController {
  static async getStats(req, res, next) {
    try {
      const stats = await OwnerDashboardService.getStats(
        req.user.organization_id,
        req.query,
      );
      return ApiResponse.success(res, "Estadísticas del negocio", stats);
    } catch (error) {
      next(error);
    }
  }

  static async exportReport(req, res, next) {
    try {
      const stats = await OwnerDashboardService.getStats(
        req.user.organization_id,
        req.query,
      );
      const pdfBuffer = await OwnerDashboardService.buildPdfExport(
        stats,
        req.query,
      );

      const today = new Date().toISOString().slice(0, 10);
      const fileName = `reporte_ingresos_${today}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OwnerDashboardController;
