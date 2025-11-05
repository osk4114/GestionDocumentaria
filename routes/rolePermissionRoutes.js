const express = require('express');
const router = express.Router();
const rolePermissionController = require('../controllers/rolePermissionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { canManagePermissions } = require('../middleware/permissionMiddleware');

/**
 * Rutas para gestión de Permisos de Roles
 * 
 * Todas las rutas requieren autenticación.
 * Las rutas de asignación/remoción requieren ser Administrador.
 * 
 * Nota: Estas rutas están anidadas bajo /api/roles/:id/permissions
 */

// ============================================================
// RUTAS DE CONSULTA
// ============================================================

/**
 * GET /api/roles/:id/permissions/available?grouped=true
 * Obtener permisos NO asignados a un rol
 */
router.get(
  '/:id/permissions/available',
  authMiddleware,
  rolePermissionController.getAvailablePermissions
);

/**
 * GET /api/roles/:id/permissions?grouped=true
 * Obtener todos los permisos asignados a un rol
 */
router.get(
  '/:id/permissions',
  authMiddleware,
  rolePermissionController.getRolePermissions
);

/**
 * GET /api/roles/:id/users
 * Obtener usuarios que tienen asignado este rol
 */
router.get(
  '/:id/users',
  authMiddleware,
  rolePermissionController.getRoleUsers
);

// ============================================================
// RUTAS DE ADMINISTRACIÓN (Solo Administrador)
// ============================================================

/**
 * POST /api/roles/:id/permissions
 * Asignar uno o más permisos a un rol
 * 
 * Body:
 * - permission_id: number (un solo permiso)
 * - permission_ids: number[] (múltiples permisos)
 */
router.post(
  '/:id/permissions',
  authMiddleware,
  canManagePermissions,
  rolePermissionController.assignPermissions
);

/**
 * PUT /api/roles/:id/permissions/sync
 * Sincronizar permisos de un rol (reemplazar todos)
 * 
 * Body:
 * - permission_ids: number[]
 */
router.put(
  '/:id/permissions/sync',
  authMiddleware,
  canManagePermissions,
  rolePermissionController.syncPermissions
);

/**
 * DELETE /api/roles/:id/permissions/:permId
 * Remover un permiso de un rol
 */
router.delete(
  '/:id/permissions/:permId',
  authMiddleware,
  canManagePermissions,
  rolePermissionController.removePermission
);

module.exports = router;
