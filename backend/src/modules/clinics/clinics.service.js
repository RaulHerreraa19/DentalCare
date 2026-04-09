const db = require('../../config/database');
const AppError = require('../../utils/AppError');

class ClinicsService {
  static async createClinic(organizationId, data) {
    // Por defecto el status es PENDING_PAYMENT gracias al prisma schema
    return await db.clinic.create({
      data: {
        organization_id: organizationId,
        name: data.name,
        address: data.address,
        phone: data.phone
      }
    });
  }

  static async getClinicsByOrg(organizationId) {
    return await db.clinic.findMany({
      where: { organization_id: organizationId },
      include: {
        offices: true
      }
    });
  }

  static async updateClinic(clinicId, organizationId, data) {
    // Validar que la clínica pertenezca a la organización
    const clinic = await db.clinic.findFirst({
      where: { id: clinicId, organization_id: organizationId }
    });
    if (!clinic) throw new AppError('Clínica no encontrada o inaccesible', 404);

    return await db.clinic.update({
      where: { id: clinicId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        logo_url: data.logo_url
      }
    });
  }

  static async createOffice(clinicId, data, organizationId) {
    // Verificar que la clínica pertenezca a la organización
    const clinic = await db.clinic.findFirst({
      where: { id: clinicId, organization_id: organizationId }
    });

    if (!clinic) throw new AppError('Clínica no encontrada o no autorizada', 404);

    return await db.office.create({
      data: {
        clinic_id: clinicId,
        name: data.name,
        floor: data.floor
      }
    });
  }

  static async getOfficesByClinic(clinicId, organizationId) {
    const clinic = await db.clinic.findFirst({
      where: { id: clinicId, organization_id: organizationId }
    });
    if (!clinic) throw new AppError('Clínica no encontrada o no autorizada', 404);

    return await db.office.findMany({
      where: { clinic_id: clinicId },
      orderBy: { name: 'asc' }
    });
  }
}

module.exports = ClinicsService;
