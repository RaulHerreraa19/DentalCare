const express = require('express');
const router = express.Router();
const PrescriptionController = require('./prescriptions.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

router.use(protect);

// Solo doctores pueden recetar
router.post('/patient/:patientId', restrictTo('DOCTOR'), PrescriptionController.create);

// Consulta de historial (acceso para doctores, recepción y dueños)
router.get('/patient/:patientId', restrictTo('DOCTOR', 'RECEPTIONIST', 'OWNER'), PrescriptionController.getHistory);

// Detalle individual (por ejemplo para imprimir)
router.get('/:id', PrescriptionController.getDetail);

module.exports = router;
