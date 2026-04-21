const bcrypt = require("bcryptjs");
const db = require("../../config/database");
const { signToken } = require("../../utils/jwt");
const AppError = require("../../utils/AppError");
const { assertEmail } = require("../../utils/validators");

class AuthService {
  static async login(email, password) {
    const safeEmail = assertEmail(email, "El correo electrónico");
    const safePassword = String(password || "").trim();

    if (!safePassword) {
      throw new AppError("La contraseña es obligatoria.", 400);
    }

    const user = await db.user.findUnique({
      where: { email: safeEmail },
      include: {
        organization: true,
      },
    });

    if (!user || !user.is_active) {
      throw new AppError("Credenciales inválidas o cuenta desactivada", 401);
    }

    const isPasswordValid = await bcrypt.compare(
      safePassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      organization_id: user.organization_id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization: user.organization?.name || null,
      },
      token,
    };
  }
}

module.exports = AuthService;
