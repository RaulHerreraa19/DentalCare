const express = require('express');
const PatientsController = require('./patients.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Todos los roles de la organización necesitan ver/crear pacientes (según alcance)
router.use(protect);

router.post('/', PatientsController.createPatient);
router.get('/', PatientsController.getPatients);
router.get('/:id', PatientsController.getPatientById);
router.put('/:id', PatientsController.updatePatient);

module.exports = router;
