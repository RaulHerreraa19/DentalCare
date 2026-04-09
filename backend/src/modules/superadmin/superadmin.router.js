const express = require('express');
const SuperAdminController = require('./superadmin.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

const router = express.Router();

// All routes require SUPER_ADMIN role
router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

router.get('/dashboard', SuperAdminController.getDashboard);
router.patch('/approve-clinic/:id', SuperAdminController.approveClinic);
router.patch('/approve-office/:id', SuperAdminController.approveOffice);

module.exports = router;
