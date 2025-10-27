const jwt = require('jsonwebtoken');
const { User, Role, Area, UserSession } = require('../models');

// Secret key (debe coincidir con authController)
const JWT_SECRET = process.env.JWT_SECRET || 'sgd_secret_key_change_in_production';

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

    // Verificar si la sesión está activa en la base de datos
    const session = await UserSession.findOne({
      where: {
        jti: decoded.jti,
        isActive: true
      }
    });

    if (!session) {
      console.log(`❌ [AUTH MIDDLEWARE] Sesión no encontrada o inactiva`);
      console.log(`   JTI buscado: ${decoded.jti}`);
      console.log(`   Usuario ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o cerrada. Por favor inicie sesión nuevamente'
      });
    }

    // Verificar si la sesión no ha expirado
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    console.log(`🔍 [AUTH MIDDLEWARE] Verificando sesión ID ${session.id}`);
    console.log(`   Usuario: ${decoded.id}`);
    console.log(`   JTI: ${decoded.jti}`);
    console.log(`   Fecha actual: ${now.toISOString()}`);
    console.log(`   Expira en: ${expiresAt.toISOString()}`);
    console.log(`   ¿Expirada? ${now > expiresAt ? 'SÍ ❌' : 'NO ✅'}`);
    console.log(`   Diferencia: ${((expiresAt.getTime() - now.getTime()) / 1000 / 60 / 60).toFixed(2)} horas`);
    
    if (now > expiresAt) {
      console.error(`❌ [AUTH MIDDLEWARE] Sesión ${session.id} expirada - Desactivando`);
      await session.update({ isActive: false });
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada. Por favor inicie sesión nuevamente'
      });
    }
    
    console.log(`✅ [AUTH MIDDLEWARE] Sesión ${session.id} válida`);


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

    // Actualizar última actividad de la sesión
    await session.update({ lastActivity: new Date() });

    // Agregar usuario y sesión a la request
    req.user = user;
    req.session = session;
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
