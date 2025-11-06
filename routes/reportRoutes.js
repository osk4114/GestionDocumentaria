const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * @route   GET /api/reports/stats
 * @desc    Obtener estadísticas para el dashboard
 * @access  Private (requiere ver reportes)
 */
router.get('/stats', authMiddleware, checkAnyPermission(['reports.view.all', 'reports.view.area']), reportController.getStats);

/**
 * @route   GET /api/reports/export
 * @desc    Exportar reporte a CSV
 * @access  Private (requiere exportar reportes)
 * @query   type: 'general' | 'by-status' | 'by-area'
 * @query   startDate, endDate (opcional)
 */
router.get('/export', authMiddleware, checkAnyPermission(['reports.export.all', 'reports.export.area']), reportController.exportToCsv);

module.exports = router;
