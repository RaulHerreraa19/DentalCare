const db = require('../../config/database');
const AppError = require('../../utils/AppError');

class MedicalServicesService {
  static async createService(doctorId, data) {
    return await db.service.create({
      data: {
        doctor_id: doctorId,
        name: data.name,
        price: data.price,
        description: data.description,
      }
    });
  }

  static async getServicesByDoctor(doctorId) {
    return await db.service.findMany({
      where: { doctor_id: doctorId, is_active: true }
    });
  }

  static async updateService(serviceId, doctorId, data) {
    const service = await db.service.findFirst({
      where: { id: serviceId, doctor_id: doctorId }
    });
    if (!service) throw new AppError('Servicio no encontrado', 404);

    return await db.service.update({
      where: { id: serviceId },
      data
    });
  }

  static async deleteService(serviceId, doctorId) {
    const service = await db.service.findFirst({
      where: { id: serviceId, doctor_id: doctorId }
    });
    if (!service) throw new AppError('Servicio no encontrado', 404);

    // En lugar de borrar duro, hacemos un soft delete para no romper historial de citas pasadas
    return await db.service.update({
      where: { id: serviceId },
      data: { is_active: false }
    });
  }
}

module.exports = MedicalServicesService;
