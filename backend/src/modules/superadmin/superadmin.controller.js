const SuperAdminService = require('./superadmin.service');
const ApiResponse = require('../../utils/apiResponse');

class SuperAdminController {
  static async getDashboard(req, res, next) {
    try {
      const clinics = await SuperAdminService.getPendingClinics();
      const offices = await SuperAdminService.getPendingOffices();
      const organizations = await SuperAdminService.getAllOrganizations();

      return ApiResponse.success(res, 'Super Admin Dashboard', {
        pending_clinics: clinics,
        pending_offices: offices,
        organizations,
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveClinic(req, res, next) {
    try {
      const { id } = req.params;
      const clinic = await SuperAdminService.approveClinic(id);
      return ApiResponse.success(res, 'Clínica aprobada con éxito', clinic);
    } catch (error) {
      next(error);
    }
  }

  static async approveOffice(req, res, next) {
    try {
      const { id } = req.params;
      const office = await SuperAdminService.approveOffice(id);
      return ApiResponse.success(res, 'Consultorio aprobado con éxito', office);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SuperAdminController;
