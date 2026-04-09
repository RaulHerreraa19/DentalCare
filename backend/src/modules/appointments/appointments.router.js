const express = require('express');
const AppointmentsController = require('./appointments.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', AppointmentsController.createAppointment);
router.get('/', AppointmentsController.getAppointments);
router.patch('/:id/status', AppointmentsController.updateStatus);

module.exports = router;
