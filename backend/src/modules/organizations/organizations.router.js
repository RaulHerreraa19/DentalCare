const express = require('express');
const OrganizationsController = require('./organizations.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/rbac.middleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

router.get('/', OrganizationsController.getAll);
router.get('/:id', OrganizationsController.getOne);
router.post('/', OrganizationsController.create);

module.exports = router;
