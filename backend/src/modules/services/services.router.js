const express = require('express');
const ServicesController = require('./services.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('DOCTOR')); // Solo los doctores gestionan sus catálogos

router.get('/', ServicesController.getMyServices);
router.post('/', ServicesController.create);
router.patch('/:id', ServicesController.update);
router.delete('/:id', ServicesController.remove);

module.exports = router;
