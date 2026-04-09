const crypto = require('crypto');

/**
 * Genera un sello digital SHA-256 para una nota médica.
 * El sello vincula contenido, médico, paciente y tiempo.
 */
const generateDigitalSeal = (data) => {
  const { 
    patientId, 
    doctorId, 
    content, 
    timestamp, 
    licenseNumber 
  } = data;
  
  if (!licenseNumber) {
    throw new Error('La cédula profesional del médico es obligatoria para firmar.');
  }

  const payload = `${patientId}|${doctorId}|${content}|${timestamp}|${licenseNumber}|${process.env.SIGNATURE_SALT || 'dental-care-salt-2026'}`;
  
  return crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');
};

module.exports = {
  generateDigitalSeal
};
