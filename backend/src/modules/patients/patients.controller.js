const PatientsService = require('./patients.service');
const ApiResponse = require('../../utils/apiResponse');

class PatientsController {
  static async createPatient(req, res, next) {
    try {
      const { first_name, last_name, phone } = req.body;
      if (!first_name || !last_name || !phone) {
        return res.status(400).json({ status: 'fail', message: 'Nombre, apellidos y teléfono son obligatorios' });
      }
      
      const patient = await PatientsService.createPatient(req.user.organization_id, req.body);
      return ApiResponse.success(res, 'Paciente creado exitosamente', patient, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPatients(req, res, next) {
    try {
      const { search } = req.query;
      const patients = await PatientsService.getPatients(req.user.organization_id, search);
      return ApiResponse.success(res, 'Lista de pacientes obtenida', patients);
    } catch (error) {
      next(error);
    }
  }

  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientsService.getPatientById(req.user.organization_id, id);
      return ApiResponse.success(res, 'Detalle del paciente obtenido', patient);
    } catch (error) {
      next(error);
    }
  }

  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientsService.updatePatient(req.user.organization_id, id, req.body);
      return ApiResponse.success(res, 'Paciente actualizado exitosamente', patient);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientsController;
