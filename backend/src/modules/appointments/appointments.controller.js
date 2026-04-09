const AppointmentsService = require('./appointments.service');
const ApiResponse = require('../../utils/apiResponse');

class AppointmentsController {
  static async createAppointment(req, res, next) {
    try {
      const { clinic_id, office_id, doctor_id, patient_id, start_time, end_time } = req.body;
      if (!clinic_id || !office_id || !doctor_id || !patient_id || !start_time || !end_time) {
        return res.status(400).json({ status: 'fail', message: 'Faltan datos obligatorios para crear la cita' });
      }

      const appointment = await AppointmentsService.createAppointment(req.user.organization_id, req.user.id, req.body);
      return ApiResponse.success(res, 'Cita agendada exitosamente', appointment, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAppointments(req, res, next) {
    try {
      const { clinic_id, start_date, end_date } = req.query;
      if (!clinic_id || !start_date || !end_date) {
        return res.status(400).json({ status: 'fail', message: 'Se requiere clinic_id, start_date y end_date' });
      }
      const appointments = await AppointmentsService.getAppointmentsByClinic(req.user.organization_id, clinic_id, start_date, end_date);
      return ApiResponse.success(res, 'Citas obtenidas', appointments);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, cancel_reason, total_amount } = req.body;
      if (!status) {
        return res.status(400).json({ status: 'fail', message: 'El estado es obligatorio' });
      }

      const appointment = await AppointmentsService.updateAppointmentStatus(req.user.organization_id, id, status, cancel_reason, total_amount);
      return ApiResponse.success(res, 'Estado actualizado', appointment);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentsController;
