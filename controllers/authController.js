const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Role, Area, UserSession, LoginAttempt } = require('../models');
const { Op } = require('sequelize');

// Configuración JWT desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'sgd_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOGIN_ATTEMPT_WINDOW = parseInt(process.env.LOGIN_ATTEMPT_WINDOW) || 15; // minutos
const MAX_SESSIONS_PER_USER = parseInt(process.env.MAX_SESSIONS_PER_USER) || 3;

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { nombre, email, password, rolId, areaId } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !rolId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email, password y rol son obligatorios'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar que el rol existe
    const role = await Role.findByPk(rolId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'El rol especificado no existe'
      });
    }

    // Verificar área si se proporcionó
    if (areaId) {
      const area = await Area.findByPk(areaId);
      if (!area) {
        return res.status(400).json({
          success: false,
          message: 'El área especificada no existe'
        });
      }
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rolId,
      areaId: areaId || null
    });

    // Obtener usuario con relaciones
    const userWithRelations = await User.findByPk(user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ],
      attributes: { exclude: ['password'] }
    });

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rolId: user.rolId 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userWithRelations,
        token
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * Verificar intentos de login
 */
const checkLoginAttempts = async (email, ipAddress) => {
  const windowStart = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW * 60 * 1000);
  
  const attempts = await LoginAttempt.count({
    where: {
      email,
      success: false,
      attemptedAt: {
        [Op.gte]: windowStart
      }
    }
  });

  return attempts >= MAX_LOGIN_ATTEMPTS;
};

/**
 * Registrar intento de login
 */
const recordLoginAttempt = async (email, ipAddress, userAgent, success) => {
  try {
    await LoginAttempt.create({
      email,
      ipAddress,
      userAgent,
      success
    });
  } catch (error) {
    console.error('Error al registrar intento de login:', error);
  }
};

/**
 * Limpiar intentos antiguos (ejecutar periódicamente)
 */
const cleanupOldAttempts = async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
  await LoginAttempt.destroy({
    where: {
      attemptedAt: {
        [Op.lt]: cutoff
      }
    }
  });
};

/**
 * Crear sesión y generar tokens
 */
const createSession = async (user, ipAddress, userAgent) => {
  const jti = uuidv4(); // JWT ID único
  
  // ⚠️ SESIÓN ÚNICA: Invalidar TODAS las sesiones anteriores del usuario
  const previousSessions = await UserSession.update(
    { isActive: false },
    {
      where: {
        userId: user.id,
        isActive: true
      },
      returning: true // Para PostgreSQL, en MySQL no funciona
    }
  );

  if (previousSessions[0] > 0) {
    console.log(`🔒 Sesión única activada: ${previousSessions[0]} sesión(es) anterior(es) cerrada(s) automáticamente para usuario ${user.id}`);
    
    // 📢 Notificar via WebSocket a las sesiones cerradas
    if (global.io) {
      global.io.to(`user:${user.id}`).emit('session-invalidated', {
        reason: 'new-login',
        message: 'Tu sesión fue cerrada porque iniciaste sesión desde otro dispositivo'
      });
      console.log(`📢 Notificación WebSocket enviada a usuario ${user.id}`);
    }
  }
  
  // Calcular fecha de expiración
  const expiresAt = new Date();
  const hours = parseInt(JWT_EXPIRES_IN.replace('h', ''));
  expiresAt.setHours(expiresAt.getHours() + hours);

  // Generar access token
  const token = jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role.nombre,
      jti  // JWT ID para tracking
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Generar refresh token
  const refreshToken = jwt.sign(
    { id: user.id, jti, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  // Crear registro de sesión
  const session = await UserSession.create({
    userId: user.id,
    token,
    jti,
    refreshToken,
    ipAddress,
    userAgent,
    expiresAt,
    isActive: true
  });

  return { token, refreshToken, session };
};

/**
 * Login de usuario
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son obligatorios'
      });
    }

    // Verificar si hay demasiados intentos fallidos
    const isBlocked = await checkLoginAttempts(email, ipAddress);
    if (isBlocked) {
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos fallidos. Intente nuevamente en ${LOGIN_ATTEMPT_WINDOW} minutos`
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ]
    });

    if (!user) {
      await recordLoginAttempt(email, ipAddress, userAgent, false);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      await recordLoginAttempt(email, ipAddress, userAgent, false);
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await recordLoginAttempt(email, ipAddress, userAgent, false);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Login exitoso - registrar intento
    await recordLoginAttempt(email, ipAddress, userAgent, true);

    // Crear sesión y generar tokens
    const { token, refreshToken, session } = await createSession(user, ipAddress, userAgent);

    // Remover password de la respuesta
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userResponse,
        token,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
        sessionId: session.id
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    // req.user viene del middleware de autenticación
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Role, as: 'role', attributes: ['id', 'nombre', 'descripcion'] },
        { model: Area, as: 'area', attributes: ['id', 'nombre', 'sigla'] }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

/**
 * Cambiar contraseña
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son obligatorias'
      });
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(req.user.id);

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await user.update({ password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

/**
 * Logout - Invalidar sesión
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // Desactivar la sesión
    await UserSession.update(
      { isActive: false },
      { where: { token } }
    );

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};

/**
 * Refresh Token - Renovar token sin re-login
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: oldRefreshToken } = req.body;

    if (!oldRefreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token no proporcionado'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(oldRefreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Buscar sesión activa
    const session = await UserSession.findOne({
      where: {
        refreshToken: oldRefreshToken,
        isActive: true,
        userId: decoded.id
      },
      include: [{
        model: User,
        as: 'user',
        include: [
          { model: Role, as: 'role' },
          { model: Area, as: 'area' }
        ]
      }]
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    // Crear nueva sesión
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { token: newToken, refreshToken: newRefreshToken, session: newSession } = 
      await createSession(session.user, ipAddress, userAgent);

    // Invalidar sesión anterior
    await session.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_EXPIRES_IN,
        sessionId: newSession.id
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }

    console.error('Error en refreshToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error al renovar token',
      error: error.message
    });
  }
};

/**
 * Obtener sesiones activas del usuario
 * GET /api/auth/sessions
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await UserSession.findAll({
      where: {
        userId: req.user.id,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      attributes: ['id', 'ipAddress', 'userAgent', 'isActive', 'lastActivity', 'expiresAt'],
      order: [['lastActivity', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });

  } catch (error) {
    console.error('Error en getSessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sesiones',
      error: error.message
    });
  }
};

/**
 * Revocar sesión específica
 * DELETE /api/auth/sessions/:sessionId
 */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await UserSession.findOne({
      where: {
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada'
      });
    }

    await session.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Sesión revocada exitosamente'
    });

  } catch (error) {
    console.error('Error en revokeSession:', error);
    res.status(500).json({
      success: false,
      message: 'Error al revocar sesión',
      error: error.message
    });
  }
};

/**
 * Cerrar todas las sesiones excepto la actual
 * POST /api/auth/logout-all
 */
const logoutAll = async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];

    await UserSession.update(
      { isActive: false },
      {
        where: {
          userId: req.user.id,
          token: { [Op.ne]: currentToken },
          isActive: true
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Todas las demás sesiones han sido cerradas'
    });

  } catch (error) {
    console.error('Error en logoutAll:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesiones',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  changePassword,
  getSessions,
  revokeSession,
  logoutAll,
  cleanupOldAttempts
};
