const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

/**
 * Rutas de Roles
 * Lectura pública (para selects), escritura solo admin
 */

/**
 * @route   GET /api/roles
 * @desc    Obtener todos los roles
 * @access  Public (para selects en formularios)
 */
router.get('/', roleController.getAllRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener rol por ID
 * @access  Private
 */
router.get('/:id', authMiddleware, roleController.getRoleById);

/**
 * @route   POST /api/roles
 * @desc    Crear nuevo rol
 * @access  Private (Solo Admin)
 */
router.post('/', authMiddleware, isAdmin, roleController.createRole);

/**
 * @route   PUT /api/roles/:id
 * @desc    Actualizar rol
 * @access  Private (Solo Admin)
 */
router.put('/:id', authMiddleware, isAdmin, roleController.updateRole);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar rol
 * @access  Private (Solo Admin)
 */
router.delete('/:id', authMiddleware, isAdmin, roleController.deleteRole);

module.exports = router;
