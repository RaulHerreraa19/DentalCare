const db = require('../../config/database');
const AppError = require('../../utils/AppError');

class SuperAdminService {
  static async getPendingClinics() {
    return await db.clinic.findMany({
      where: {
        status: 'PENDING_PAYMENT'
      },
      include: {
        organization: true
      }
    });
  }

  static async getPendingOffices() {
    return await db.office.findMany({
      where: {
        status: 'PENDING_PAYMENT'
      },
      include: {
        clinic: {
          include: {
            organization: true
          }
        }
      }
    });
  }

  static async approveClinic(clinicId) {
    const clinic = await db.clinic.update({
      where: { id: clinicId },
      data: { status: 'ACTIVE' }
    });
    return clinic;
  }

  static async approveOffice(officeId) {
    const office = await db.office.update({
      where: { id: officeId },
      data: { status: 'ACTIVE' }
    });
    return office;
  }
  
  static async getAllOrganizations() {
    return await db.organization.findMany({
      include: { 
        clinics: true 
      }
    });
  }
}

module.exports = SuperAdminService;
