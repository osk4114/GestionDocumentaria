const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Private (Solo admin puede crear usuarios)
 */
router.post('/register', authMiddleware, isAdmin, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post('/login', authController.login);

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

module.exports = router;
