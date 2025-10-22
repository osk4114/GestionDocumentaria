const jwt = require('jsonwebtoken');
const { User, Role, Area } = require('../models');

// Secret key (debe coincidir con authController)
const JWT_SECRET = process.env.JWT_SECRET || 'sgd_secret_key_2025_change_in_production';

/**
 * Middleware para verificar token JWT
 * Uso: router.get('/ruta-protegida', authMiddleware, controller)
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado. Acceso denegado'
      });
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Agregar usuario a la request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor inicie sesión nuevamente'
      });
    }

    console.error('Error en authMiddleware:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
      error: error.message
    });
  }
};

/**
 * Middleware opcional - No requiere autenticación pero la agrega si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await User.findByPk(decoded.id, {
        include: [
          { model: Role, as: 'role' },
          { model: Area, as: 'area' }
        ],
        attributes: { exclude: ['password'] }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Si hay error, simplemente continuar sin usuario
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };
