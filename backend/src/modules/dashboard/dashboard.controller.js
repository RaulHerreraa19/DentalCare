const OwnerDashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/apiResponse');

class OwnerDashboardController {
  static async getStats(req, res, next) {
    try {
      const stats = await OwnerDashboardService.getStats(req.user.organization_id, req.query);
      return ApiResponse.success(res, 'Estadísticas del negocio', stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OwnerDashboardController;
