const PrescriptionService = require('./prescriptions.service');
const ApiResponse = require('../../utils/apiResponse');

class PrescriptionController {
  static async create(req, res, next) {
    try {
      const { patientId } = req.params;
      const prescription = await PrescriptionService.createPrescription(req.user.id, patientId, req.body);
      return ApiResponse.success(res, 'Receta generada exitosamente', prescription, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      const prescriptions = await PrescriptionService.getPatientPrescriptions(patientId);
      return ApiResponse.success(res, 'Historial de recetas obtenido', prescriptions);
    } catch (error) {
      next(error);
    }
  }

  static async getDetail(req, res, next) {
    try {
      const { id } = req.params;
      const prescription = await PrescriptionService.getPrescriptionById(id);
      return ApiResponse.success(res, 'Detalle de receta obtenido', prescription);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PrescriptionController;
