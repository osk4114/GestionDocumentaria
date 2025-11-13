const express = require('express');
const router = express.Router();
const areaCategoryController = require('../controllers/areaCategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas para gestión de categorías personalizadas por área
 * Base: /api/areas
 */

// ============================================================
// Rutas de Categorías por Área
// ============================================================

/**
 * @route   GET /api/areas/:areaId/categories
 * @desc    Obtener todas las categorías de un área
 * @access  Private
 */
router.get('/:areaId/categories', 
  authMiddleware, 
  checkAnyPermission(['categories.view', 'area_mgmt.categories.full']),
  areaCategoryController.getCategoriesByArea
);

/**
 * @route   POST /api/areas/:areaId/categories
 * @desc    Crear nueva categoría para un área
 * @access  Private
 */
router.post('/:areaId/categories', 
  authMiddleware, 
  checkAnyPermission(['categories.create', 'area_mgmt.categories.full']),
  areaCategoryController.createCategory
);

/**
 * @route   PUT /api/areas/:areaId/categories/reorder
 * @desc    Reordenar categorías de un área
 * @access  Private
 */
router.put('/:areaId/categories/reorder', 
  authMiddleware, 
  checkAnyPermission(['categories.edit', 'area_mgmt.categories.full']),
  areaCategoryController.reorderCategories
);

/**
 * @route   GET /api/areas/categories/:id
 * @desc    Obtener categoría por ID
 * @access  Private
 */
router.get('/categories/:id', 
  authMiddleware, 
  checkAnyPermission(['categories.view', 'area_mgmt.categories.full']),
  areaCategoryController.getCategoryById
);

/**
 * @route   PUT /api/areas/categories/:id
 * @desc    Actualizar categoría
 * @access  Private
 */
router.put('/categories/:id', 
  authMiddleware, 
  checkAnyPermission(['categories.edit', 'area_mgmt.categories.full']),
  areaCategoryController.updateCategory
);

/**
 * @route   DELETE /api/areas/categories/:id
 * @desc    Eliminar categoría
 * @access  Private (Solo Admin)
 */
router.delete('/categories/:id', 
  authMiddleware, 
  checkAnyPermission(['categories.delete', 'area_mgmt.categories.full']),
  areaCategoryController.deleteCategory
);

/**
 * @route   PATCH /api/areas/categories/:id/toggle
 * @desc    Activar/Desactivar categoría
 * @access  Private
 */
router.patch('/categories/:id/toggle', 
  authMiddleware, 
  checkAnyPermission(['categories.edit', 'area_mgmt.categories.full']),
  areaCategoryController.toggleCategory
);

module.exports = router;
