const AuthService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return ApiResponse.error(res, 'Por favor provee un email y password', 400);
      }

      const { user, token } = await AuthService.login(email, password);

      // Set cookie if needed for web
      res.cookie('jwt', token, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });

      return ApiResponse.success(res, 'Login exitoso', { user, token });
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      // req.user comes from auth.middleware
      return ApiResponse.success(res, 'Datos de usuario', {
        id: req.user.id,
        email: req.user.email,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        role: req.user.role,
        organization_id: req.user.organization_id
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
