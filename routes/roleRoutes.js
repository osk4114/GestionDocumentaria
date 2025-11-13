const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas de Roles
 * Lectura pública (para selects), escritura solo admin
 */

/**
 * @route   GET /api/roles/permissions
 * @desc    Obtener todos los permisos disponibles (agrupados por categoría)
 * @access  Private (solo admin para gestión de roles)
 */
router.get('/permissions', authMiddleware, checkAnyPermission(['roles.view', 'area_mgmt.roles.view']), roleController.getAllPermissions);

/**
 * @route   GET /api/roles
 * @desc    Obtener todos los roles (con opciones: ?includePermissions=true&activeOnly=true)
 * @access  Private (requiere autenticación para filtrar por área)
 */
router.get('/', authMiddleware, checkAnyPermission(['roles.view', 'area_mgmt.roles.view']), roleController.getAllRoles);

/**
 * @route   GET /api/roles/custom
 * @desc    Obtener solo roles personalizados (no del sistema)
 * @access  Private (requiere ver roles)
 */
router.get('/custom', authMiddleware, checkAnyPermission(['roles.view', 'area_mgmt.roles.view']), roleController.getCustomRoles);

/**
 * @route   GET /api/roles/:id
 * @desc    Obtener rol por ID (incluye permisos y usuarios)
 * @access  Private (requiere ver roles)
 */
router.get('/:id', authMiddleware, checkAnyPermission(['roles.view', 'area_mgmt.roles.view']), roleController.getRoleById);

/**
 * @route   POST /api/roles
 * @desc    Crear nuevo rol
 * @access  Private (requiere crear roles)
 */
router.post('/', authMiddleware, checkAnyPermission(['roles.create', 'area_mgmt.roles.create']), roleController.createRole);

/**
 * @route   PUT /api/roles/:id
 * @desc    Actualizar rol
 * @access  Private (requiere editar roles)
 */
router.put('/:id', authMiddleware, checkAnyPermission(['roles.edit', 'area_mgmt.roles.edit']), roleController.updateRole);

/**
 * @route   PATCH /api/roles/:id/toggle-status
 * @desc    Activar/Desactivar rol
 * @access  Private (requiere editar roles)
 */
router.patch('/:id/toggle-status', authMiddleware, checkAnyPermission(['roles.edit', 'area_mgmt.roles.edit']), roleController.toggleRoleStatus);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Eliminar rol
 * @access  Private (requiere eliminar roles)
 */
router.delete('/:id', authMiddleware, checkPermission('roles.delete'), roleController.deleteRole);

module.exports = router;
