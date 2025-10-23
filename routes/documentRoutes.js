const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole, isAdmin } = require('../middleware/roleMiddleware');
const documentController = require('../controllers/documentController');

// ============================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================

/**
 * @route   POST /api/documents/submit
 * @desc    Presentar documento (Mesa de Partes Virtual - público)
 * @access  Public
 */
router.post('/submit', documentController.submitDocument);

/**
 * @route   GET /api/documents/tracking/:code
 * @desc    Buscar documento por código de seguimiento (público)
 * @access  Public
 */
router.get('/tracking/:code', documentController.getDocumentByTrackingCode);

// ============================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================

/**
 * @route   GET /api/documents/stats
 * @desc    Obtener estadísticas de documentos
 * @access  Private
 */
router.get('/stats', authMiddleware, documentController.getDocumentStats);

/**
 * @route   GET /api/documents/search
 * @desc    Búsqueda avanzada de documentos con paginación
 * @access  Private
 * @query   trackingCode, asunto, remitente, area, status, priority, type, dateFrom, dateTo, page, pageSize
 */
router.get('/search', authMiddleware, documentController.advancedSearch);

/**
 * @route   GET /api/documents/by-status
 * @desc    Obtener documentos agrupados por estado
 * @access  Private
 * @query   areaId (opcional)
 */
router.get('/by-status', authMiddleware, documentController.getDocumentsByStatus);

/**
 * @route   GET /api/documents/area/:areaId/archived
 * @desc    Obtener documentos archivados por área
 * @access  Private
 * @query   dateFrom, dateTo, search
 */
router.get('/area/:areaId/archived', authMiddleware, documentController.getArchivedDocumentsByArea);

/**
 * @route   GET /api/documents/area/:areaId
 * @desc    Obtener documentos por área
 * @access  Private
 */
router.get('/area/:areaId', authMiddleware, documentController.getDocumentsByArea);

/**
 * @route   GET /api/documents/:id/history
 * @desc    Obtener historial completo de un documento con timeline
 * @access  Private
 */
router.get('/:id/history', authMiddleware, documentController.getDocumentHistory);

/**
 * @route   GET /api/documents/:id
 * @desc    Obtener un documento por ID con todas sus relaciones
 * @access  Private
 */
router.get('/:id', authMiddleware, documentController.getDocumentById);

/**
 * @route   GET /api/documents
 * @desc    Obtener todos los documentos con filtros (status, area, priority, search)
 * @access  Private
 */
router.get('/', authMiddleware, documentController.getDocuments);

/**
 * @route   POST /api/documents
 * @desc    Crear nuevo documento
 * @access  Private (Mesa de Partes o Admin)
 */
router.post('/', authMiddleware, checkRole(['Administrador', 'Mesa de Partes', 'Funcionario']), documentController.createDocument);

/**
 * @route   PUT /api/documents/:id
 * @desc    Actualizar documento
 * @access  Private (Área actual o Admin)
 */
router.put('/:id', authMiddleware, documentController.updateDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Archivar documento
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware, isAdmin, documentController.deleteDocument);

/**
 * @route   POST /api/documents/:id/derive
 * @desc    Derivar documento a otra área/usuario
 * @access  Private
 */
router.post('/:id/derive', authMiddleware, documentController.deriveDocument);

/**
 * @route   POST /api/documents/:id/finalize
 * @desc    Finalizar/Atender documento
 * @access  Private
 */
router.post('/:id/finalize', authMiddleware, documentController.finalizeDocument);

module.exports = router;
