const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const db = require('../config/database');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('No has iniciado sesión. Por favor inicia sesión para obtener acceso.', 401));
    }

    const decoded = verifyToken(token);

    const currentUser = await db.user.findUnique({
      where: { id: decoded.id }
    });

    if (!currentUser || !currentUser.is_active) {
      return next(new AppError('El usuario que pertenece a este token ya no existe o está inactivo.', 401));
    }

    // Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido. Inicia sesión de nuevo.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Tu token expiró. Inicia sesión de nuevo.', 401));
    }
    next(error);
  }
};

module.exports = { protect };
