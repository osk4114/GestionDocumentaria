const rateLimit = require('express-rate-limit');

/**
 * Rate limiter para endpoints de autenticación
 * Previene ataques de fuerza bruta
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por favor intente nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // No contar requests exitosos
  skipSuccessfulRequests: true
});

/**
 * Rate limiter general para API
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Por favor intente nuevamente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para registro de usuarios
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros
  message: {
    success: false,
    message: 'Demasiados intentos de registro. Por favor intente nuevamente en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  apiLimiter,
  registerLimiter
};
