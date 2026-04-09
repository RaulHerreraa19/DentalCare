const MedicalServicesService = require('./services.service');
const ApiResponse = require('../../utils/apiResponse');

class ServicesController {
  static async create(req, res, next) {
    try {
      const service = await MedicalServicesService.createService(req.user.id, req.body);
      return ApiResponse.success(res, 'Servicio agregado al catálogo', service, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyServices(req, res, next) {
    try {
      const services = await MedicalServicesService.getServicesByDoctor(req.user.id);
      return ApiResponse.success(res, 'Catálogo de servicios', services);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const service = await MedicalServicesService.updateService(req.params.id, req.user.id, req.body);
      return ApiResponse.success(res, 'Servicio actualizado', service);
    } catch (error) {
      next(error);
    }
  }

  static async remove(req, res, next) {
    try {
      await MedicalServicesService.deleteService(req.params.id, req.user.id);
      return ApiResponse.success(res, 'Servicio eliminado del catálogo', null);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ServicesController;
