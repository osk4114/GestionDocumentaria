const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkAnyPermission } = require('../middleware/permissionMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Private (requiere crear usuarios)
 */
router.post('/register', registerLimiter, authMiddleware, checkAnyPermission(['users.create.all', 'users.create.area']), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.put('/change-password', authMiddleware, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión actual
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token usando refresh token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   GET /api/auth/sessions
 * @desc    Obtener sesiones activas del usuario
 * @access  Private
 */
router.get('/sessions', authMiddleware, authController.getSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revocar sesión específica
 * @access  Private
 */
router.delete('/sessions/:sessionId', authMiddleware, authController.revokeSession);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Cerrar todas las demás sesiones
 * @access  Private
 */
router.post('/logout-all', authMiddleware, authController.logoutAll);

module.exports = router;
