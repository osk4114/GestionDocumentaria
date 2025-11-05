const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas de Usuarios
 * Todas las operaciones requieren autenticación
 * Las operaciones de escritura son solo para administradores
 */

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios (con filtros opcionales)
 * @access  Private (requiere ver todos los usuarios o de su área)
 * @query   ?active=true&roleId=1&areaId=2
 */
router.get('/', authMiddleware, 
  checkAnyPermission(['users.view.all', 'users.view.area']),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener usuario por ID
 * @access  Private (requiere ver usuarios)
 */
router.get('/:id', authMiddleware, 
  checkAnyPermission(['users.view.all', 'users.view.area', 'users.view.own']),
  userController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Crear nuevo usuario
 * @access  Private (requiere crear usuarios)
 * @note    También existe en /api/auth/register
 */
router.post('/', authMiddleware, 
  checkAnyPermission(['users.create.all', 'users.create.area']),
  userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar usuario
 * @access  Private (requiere editar usuarios)
 */
router.put('/:id', authMiddleware, 
  checkAnyPermission(['users.edit.all', 'users.edit.area']),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Desactivar usuario (soft delete)
 * @access  Private (requiere permiso de desactivar usuarios)
 */
router.delete('/:id', authMiddleware, 
  checkPermission('users.delete'),
  userController.deleteUser
);

/**
 * @route   PATCH /api/users/:id/activate
 * @desc    Activar usuario previamente desactivado
 * @access  Private (requiere permiso de activar usuarios)
 */
router.patch('/:id/activate', authMiddleware, 
  checkPermission('users.activate'),
  userController.activateUser
);

module.exports = router;
