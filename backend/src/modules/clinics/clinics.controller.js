const ClinicsService = require('./clinics.service');
const ApiResponse = require('../../utils/apiResponse');

class ClinicsController {
  static async create(req, res, next) {
    try {
      const clinic = await ClinicsService.createClinic(req.user.organization_id, req.body);
      return ApiResponse.success(res, 'Clínica creada y en espera de activación de pago', clinic, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyClinics(req, res, next) {
    try {
      const clinics = await ClinicsService.getClinicsByOrg(req.user.organization_id);
      return ApiResponse.success(res, 'Sucursales obtenidas', clinics);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { clinicId } = req.params;
      const clinic = await ClinicsService.updateClinic(clinicId, req.user.organization_id, req.body);
      return ApiResponse.success(res, 'Clínica actualizada exitosamente', clinic);
    } catch (error) {
      next(error);
    }
  }

  static async createOffice(req, res, next) {
    try {
      const { clinicId } = req.params;
      const office = await ClinicsService.createOffice(clinicId, req.body, req.user.organization_id);
      return ApiResponse.success(res, 'Consultorio creado y en espera de activación de pago', office, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getOffices(req, res, next) {
    try {
      const { clinicId } = req.params;
      const offices = await ClinicsService.getOfficesByClinic(clinicId, req.user.organization_id);
      return ApiResponse.success(res, 'Consultorios obtenidos', offices);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClinicsController;
