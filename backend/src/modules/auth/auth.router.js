const express = require('express');
const AuthController = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/me', protect, AuthController.me);

module.exports = router;
