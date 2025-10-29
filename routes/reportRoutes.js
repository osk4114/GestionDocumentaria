const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reports/stats
 * @desc    Obtener estadísticas para el dashboard
 * @access  Private
 */
router.get('/stats', authMiddleware, reportController.getStats);

/**
 * @route   GET /api/reports/export
 * @desc    Exportar reporte a CSV
 * @access  Private
 * @query   type: 'general' | 'by-status' | 'by-area'
 * @query   startDate, endDate (opcional)
 */
router.get('/export', authMiddleware, reportController.exportToCsv);

module.exports = router;
