const express = require('express');
const ClinicsController = require('./clinics.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

const router = express.Router();

router.use(protect);

// Dueños pueden crear clinicas y verlas. Doctores y recepcionistas pueden verlas
router.get('/', restrictTo('OWNER', 'DOCTOR', 'RECEPTIONIST'), ClinicsController.getMyClinics);

// Roles exclusivos de dueño
router.post('/', restrictTo('OWNER'), ClinicsController.create);
router.patch('/:clinicId', restrictTo('OWNER'), ClinicsController.update);
router.post('/:clinicId/offices', restrictTo('OWNER'), ClinicsController.createOffice);
// Todos los roles pueden ver los consultorios de una clínica
router.get('/:clinicId/offices', restrictTo('OWNER', 'DOCTOR', 'RECEPTIONIST'), ClinicsController.getOffices);

module.exports = router;
