const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const areaCategoryController = require('../controllers/areaCategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas de Áreas
 * Algunas rutas son públicas para obtener listados (para selects en formularios)
 * Las operaciones de escritura son solo para administradores
 */

/**
 * @route   GET /api/areas
 * @desc    Obtener todas las áreas (con filtro opcional de activas)
 * @access  Public (para selects en formularios)
 * @query   ?active=true (opcional)
 */
router.get('/', areaController.getAllAreas);

/**
 * @route   GET /api/areas/:id
 * @desc    Obtener área por ID con información detallada
 * @access  Private (requiere ver áreas)
 */
router.get('/:id', authMiddleware, checkPermission('areas.view.all'), areaController.getAreaById);

/**
 * @route   GET /api/areas/:id/stats
 * @desc    Obtener estadísticas del área
 * @access  Private (requiere ver estadísticas de áreas)
 */
router.get('/:id/stats', authMiddleware, 
  checkAnyPermission(['areas.view.stats.all', 'areas.view.stats.own']), 
  areaController.getAreaStats);

/**
 * @route   POST /api/areas
 * @desc    Crear nueva área
 * @access  Private (requiere crear áreas)
 */
router.post('/', authMiddleware, checkPermission('areas.create'), areaController.createArea);

/**
 * @route   PUT /api/areas/:id
 * @desc    Actualizar área
 * @access  Private (requiere editar áreas)
 */
router.put('/:id', authMiddleware, 
  checkAnyPermission(['areas.edit.all', 'areas.edit.own']), 
  areaController.updateArea);

/**
 * @route   DELETE /api/areas/:id
 * @desc    Desactivar área (soft delete)
 * @access  Private (requiere desactivar áreas)
 */
router.delete('/:id', authMiddleware, checkPermission('areas.deactivate'), areaController.deleteArea);

/**
 * @route   PATCH /api/areas/:id/activate
 * @desc    Activar área previamente desactivada
 * @access  Private (requiere activar áreas)
 */
router.patch('/:id/activate', authMiddleware, checkPermission('areas.activate'), areaController.activateArea);

/**
 * @route   PATCH /api/areas/:id/deactivate
 * @desc    Desactivar área
 * @access  Private (requiere desactivar áreas)
 */
router.patch('/:id/deactivate', authMiddleware, checkPermission('areas.deactivate'), areaController.deactivateArea);

// ============================================================
// Rutas de Categorías Personalizadas por Área
// ============================================================

/**
 * @route   GET /api/areas/:areaId/categories
 * @desc    Obtener todas las categorías de un área
 * @access  Private (requiere ver categorías)
 */
router.get('/:areaId/categories', authMiddleware, checkAnyPermission(['categories.view', 'area_mgmt.categories.full']), areaCategoryController.getCategoriesByArea);

/**
 * @route   POST /api/areas/:areaId/categories
 * @desc    Crear nueva categoría para un área
 * @access  Private (requiere crear categorías)
 */
router.post('/:areaId/categories', authMiddleware, checkAnyPermission(['categories.create', 'area_mgmt.categories.full']), areaCategoryController.createCategory);

/**
 * @route   PUT /api/areas/:areaId/categories/reorder
 * @desc    Reordenar categorías de un área
 * @access  Private (requiere editar categorías)
 */
router.put('/:areaId/categories/reorder', authMiddleware, checkAnyPermission(['categories.edit', 'area_mgmt.categories.full']), areaCategoryController.reorderCategories);

/**
 * @route   GET /api/areas/categories/:id
 * @desc    Obtener categoría por ID
 * @access  Private (requiere ver categorías)
 */
router.get('/categories/:id', authMiddleware, checkAnyPermission(['categories.view', 'area_mgmt.categories.full']), areaCategoryController.getCategoryById);

/**
 * @route   PUT /api/areas/categories/:id
 * @desc    Actualizar categoría
 * @access  Private (requiere editar categorías)
 */
router.put('/categories/:id', authMiddleware, checkAnyPermission(['categories.edit', 'area_mgmt.categories.full']), areaCategoryController.updateCategory);

/**
 * @route   DELETE /api/areas/categories/:id
 * @desc    Eliminar categoría
 * @access  Private (requiere eliminar categorías)
 */
router.delete('/categories/:id', authMiddleware, checkAnyPermission(['categories.delete', 'area_mgmt.categories.full']), areaCategoryController.deleteCategory);

/**
 * @route   PATCH /api/areas/categories/:id/toggle
 * @desc    Activar/Desactivar categoría
 * @access  Private (requiere editar categorías)
 */
router.patch('/categories/:id/toggle', authMiddleware, checkAnyPermission(['categories.edit', 'area_mgmt.categories.full']), areaCategoryController.toggleCategory);

module.exports = router;
