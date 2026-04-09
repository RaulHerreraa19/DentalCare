const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const { signToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

class AuthService {
  static async login(email, password) {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (!user || !user.is_active) {
      throw new AppError('Credenciales inválidas o cuenta desactivada', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      organization_id: user.organization_id
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization: user.organization?.name || null
      },
      token
    };
  }
}

module.exports = AuthService;
