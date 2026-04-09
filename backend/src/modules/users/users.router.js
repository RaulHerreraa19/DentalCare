const express = require('express');
const UsersController = require('./users.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

const router = express.Router();

router.use(protect);
router.post('/invite', restrictTo('OWNER'), UsersController.invite);
router.get('/team', restrictTo('OWNER', 'DOCTOR', 'RECEPTIONIST'), UsersController.getTeam);
router.patch('/me', UsersController.updateMe);
router.patch('/:id', restrictTo('OWNER'), UsersController.updateEmployee);

module.exports = router;
