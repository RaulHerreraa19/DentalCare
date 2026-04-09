const db = require('../../config/database');
const AppError = require('../../utils/AppError');

class PrescriptionService {
  /**
   * Generar una nueva receta médica.
   */
  static async createPrescription(doctorId, patientId, data) {
    // Validar existencia de médico y paciente
    const patient = await db.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new AppError('Paciente no encontrado', 404);

    return await db.prescription.create({
      data: {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: data.appointment_id || null,
        medications: data.medications || [],
        instructions: data.instructions || '',
      },
      include: {
        doctor: {
           select: { first_name: true, last_name: true, license_number: true, specialty: true }
        },
        patient: {
           select: { first_name: true, last_name: true, date_of_birth: true, gender: true }
        }
      }
    });
  }

  /**
   * Obtener historial de recetas de un paciente.
   */
  static async getPatientPrescriptions(patientId) {
    return await db.prescription.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: {
           select: { first_name: true, last_name: true, license_number: true, specialty: true, signature_stamp_url: true }
        },
        patient: {
           select: { first_name: true, last_name: true, date_of_birth: true, gender: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Obtener una receta específica con datos de branding de la clínica.
   */
  static async getPrescriptionById(id) {
    const prescription = await db.prescription.findUnique({
      where: { id },
      include: {
        doctor: {
           select: { 
             first_name: true, 
             last_name: true, 
             license_number: true, 
             specialty: true,
             signature_stamp_url: true 
           }
        },
        patient: {
           select: { first_name: true, last_name: true, date_of_birth: true }
        },
        appointment: {
           include: {
             clinic: {
               select: { name: true, address: true, phone: true, logo_url: true }
             }
           }
        }
      }
    });

    if (!prescription) throw new AppError('Receta no encontrada', 404);
    return prescription;
  }
}

module.exports = PrescriptionService;
