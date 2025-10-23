const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

/**
 * Rutas de Usuarios
 * Todas las operaciones requieren autenticación
 * Las operaciones de escritura son solo para administradores
 */

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (con filtros opcionales)
 * @access  Private (Solo Admin)
 * @query   ?active=true&roleId=1&areaId=2
 */
router.get('/', authMiddleware, isAdmin, userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario por ID
 * @access  Private
 */
router.get('/:id', authMiddleware, userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Crear nuevo usuario
 * @access  Private (Solo Admin)
 * @note    También existe en /api/auth/register
 */
router.post('/', authMiddleware, isAdmin, userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario
 * @access  Private (Solo Admin)
 */
router.put('/:id', authMiddleware, isAdmin, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Desactivar usuario (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/:id', authMiddleware, isAdmin, userController.deleteUser);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activar usuario previamente desactivado
 * @access  Private (Solo Admin)
 */
router.patch('/:id/activate', authMiddleware, isAdmin, userController.activateUser);

module.exports = router;
