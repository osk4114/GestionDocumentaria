const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

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
 * @access  Private
 */
router.get('/:id', authMiddleware, areaController.getAreaById);

/**
 * @route   GET /api/areas/:id/stats
 * @desc    Obtener estadísticas del área
 * @access  Private
 */
router.get('/:id/stats', authMiddleware, areaController.getAreaStats);

/**
 * @route   POST /api/areas
 * @desc    Crear nueva área
 * @access  Private (Solo Admin)
 */
router.post('/', authMiddleware, isAdmin, areaController.createArea);

/**
 * @route   PUT /api/areas/:id
 * @desc    Actualizar área
 * @access  Private (Solo Admin)
 */
router.put('/:id', authMiddleware, isAdmin, areaController.updateArea);

/**
 * @route   DELETE /api/areas/:id
 * @desc    Desactivar área (soft delete)
 * @access  Private (Solo Admin)
 */
router.delete('/:id', authMiddleware, isAdmin, areaController.deleteArea);

/**
 * @route   PATCH /api/areas/:id/activate
 * @desc    Activar área previamente desactivada
 * @access  Private (Solo Admin)
 */
router.patch('/:id/activate', authMiddleware, isAdmin, areaController.activateArea);

/**
 * @route   PATCH /api/areas/:id/deactivate
 * @desc    Desactivar área
 * @access  Private (Solo Admin)
 */
router.patch('/:id/deactivate', authMiddleware, isAdmin, areaController.deactivateArea);

module.exports = router;
