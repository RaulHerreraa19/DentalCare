const express = require('express');
const BillingController = require('./billing.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

const router = express.Router();

router.use(protect);

router.get('/history', restrictTo('OWNER', 'RECEPTIONIST'), BillingController.getHistory);
router.post('/movement', restrictTo('OWNER', 'RECEPTIONIST'), BillingController.recordMovement);
router.post('/collect/:appointmentId', restrictTo('RECEPTIONIST', 'OWNER'), BillingController.collectPayment);

module.exports = router;
