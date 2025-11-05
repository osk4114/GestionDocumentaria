const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { canManagePermissions } = require('../middleware/permissionMiddleware');

/**
 * Rutas para gestión de Permisos
 * 
 * Todas las rutas requieren autenticación.
 * Las rutas de creación/edición/eliminación requieren ser Administrador.
 */

// ============================================================
// RUTAS DE CONSULTA (Cualquier usuario autenticado)
// ============================================================

/**
 * GET /api/permissions
 * Obtener todos los permisos (con paginación y filtros)
 * 
 * Query params:
 * - categoria: Filtrar por categoría
 * - es_sistema: true/false
 * - search: Buscar en nombre, código, descripción
 * - page: Página actual (default: 1)
 * - limit: Resultados por página (default: 100)
 * 
 * IMPORTANTE: Esta ruta debe ir PRIMERO antes de las rutas específicas
 */
router.get(
  '/',
  authMiddleware,
  permissionController.getAllPermissions
);

/**
 * GET /api/permissions/categories
 * Obtener lista de categorías disponibles
 */
router.get(
  '/categories',
  authMiddleware,
  permissionController.getCategories
);

/**
 * GET /api/permissions/grouped
 * Obtener todos los permisos agrupados por categoría
 */
router.get(
  '/grouped',
  authMiddleware,
  permissionController.getGroupedPermissions
);

/**
 * GET /api/permissions/category/:categoria
 * Obtener permisos de una categoría específica
 */
router.get(
  '/category/:categoria',
  authMiddleware,
  permissionController.getPermissionsByCategory
);

/**
 * GET /api/permissions/:id
 * Obtener detalle de un permiso específico
 * 
 * IMPORTANTE: Esta ruta debe ir AL FINAL porque /:id captura cualquier path
 */
router.get(
  '/:id',
  authMiddleware,
  permissionController.getPermissionById
);

// ============================================================
// RUTAS DE ADMINISTRACIÓN (Solo Administrador)
// ============================================================

/**
 * POST /api/permissions
 * Crear un nuevo permiso personalizado
 * 
 * Body:
 * - codigo: string (formato: categoria.accion)
 * - nombre: string
 * - descripcion: string
 * - categoria: string (enum)
 */
router.post(
  '/',
  authMiddleware,
  canManagePermissions,
  permissionController.createPermission
);

/**
 * PUT /api/permissions/:id
 * Actualizar un permiso personalizado (no del sistema)
 * 
 * Body:
 * - nombre: string
 * - descripcion: string
 * - categoria: string
 */
router.put(
  '/:id',
  authMiddleware,
  canManagePermissions,
  permissionController.updatePermission
);

/**
 * DELETE /api/permissions/:id
 * Eliminar un permiso personalizado (no del sistema)
 */
router.delete(
  '/:id',
  authMiddleware,
  canManagePermissions,
  permissionController.deletePermission
);

module.exports = router;
