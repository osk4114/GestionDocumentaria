const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');
const { upload, handleMulterError, uploadDocumentVersion } = require('../middleware/uploadMiddleware');
const documentController = require('../controllers/documentController');
const documentVersionController = require('../controllers/documentVersionController');

// ============================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================

/**
 * @route   POST /api/documents/submit
 * @desc    Presentar documento (Mesa de Partes Virtual - público)
 * @access  Public
 * @note    Acepta hasta 5 archivos adjuntos
 */
router.post('/submit', 
  upload.array('archivos', 5), // Máximo 5 archivos
  handleMulterError,
  documentController.submitDocument
);

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
 * @access  Private (requiere ver documentos de al menos su área)
 */
router.get('/stats', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area']),
  documentController.getDocumentStats
);

/**
 * @route   GET /api/documents/statuses
 * @desc    Obtener todos los estados disponibles
 * @access  Private (cualquier usuario autenticado)
 */
router.get('/statuses', authMiddleware, documentController.getDocumentStatuses);

/**
 * @route   GET /api/documents/search
 * @desc    Búsqueda avanzada de documentos con paginación
 * @access  Private (requiere permiso de búsqueda)
 * @query   trackingCode, asunto, remitente, area, status, priority, type, dateFrom, dateTo, page, pageSize
 */
router.get('/search', authMiddleware, 
  checkPermission('documents.search'),
  documentController.advancedSearch
);

/**
 * @route   GET /api/documents/by-status
 * @desc    Obtener documentos agrupados por estado
 * @access  Private (requiere ver documentos)
 * @query   areaId (opcional)
 */
router.get('/by-status', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area']),
  documentController.getDocumentsByStatus
);

/**
 * @route   GET /api/documents/area/:areaId/archived
 * @desc    Obtener documentos archivados por área
 * @access  Private (requiere permiso de archivar/ver archivados)
 * @query   dateFrom, dateTo, search
 */
router.get('/area/:areaId/archived', authMiddleware, 
  checkAnyPermission(['documents.archive', 'documents.view.all']),
  documentController.getArchivedDocumentsByArea
);

/**
 * @route   GET /api/documents/area/:areaId
 * @desc    Obtener documentos por área
 * @access  Private (requiere ver documentos de área o todos)
 */
router.get('/area/:areaId', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area']),
  documentController.getDocumentsByArea
);

/**
 * @route   GET /api/documents/:id/history
 * @desc    Obtener historial completo de un documento con timeline
 * @access  Private (requiere ver documentos)
 */
router.get('/:id/history', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area', 'documents.view.own']),
  documentController.getDocumentHistory
);

/**
 * @route   GET /api/documents/:id
 * @desc    Obtener un documento por ID con todas sus relaciones
 * @access  Private (requiere ver documentos)
 */
router.get('/:id', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area', 'documents.view.own']),
  documentController.getDocumentById
);

/**
 * @route   GET /api/documents
 * @desc    Obtener todos los documentos con filtros (status, area, priority, search)
 * @access  Private (requiere ver documentos: todos, de área o propios)
 */
router.get('/', authMiddleware, 
  checkAnyPermission(['documents.view.all', 'documents.view.area', 'documents.view.own']),
  documentController.getDocuments
);

/**
 * @route   POST /api/documents
 * @desc    Crear nuevo documento
 * @access  Private (requiere permiso de crear documentos)
 */
router.post('/', authMiddleware, 
  checkPermission('documents.create'), 
  documentController.createDocument
);

/**
 * @route   PUT /api/documents/:id
 * @desc    Actualizar documento
 * @access  Private (requiere editar todos o editar de su área)
 */
router.put('/:id', authMiddleware, 
  checkAnyPermission(['documents.edit.all', 'documents.edit.area']),
  documentController.updateDocument
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Archivar documento
 * @access  Private (requiere permiso de archivar)
 */
router.delete('/:id', authMiddleware, 
  checkPermission('documents.archive'),
  documentController.deleteDocument
);

/**
 * @route   POST /api/documents/:id/unarchive
 * @desc    Desarchivar documento (reactivar)
 * @access  Private (requiere permiso de desarchivar)
 */
router.post('/:id/unarchive', authMiddleware, 
  checkPermission('documents.unarchive'),
  documentController.unarchiveDocument
);

/**
 * @route   POST /api/documents/:id/derive
 * @desc    Derivar documento a otra área/usuario
 * @access  Private (requiere permiso de derivar)
 */
router.post('/:id/derive', authMiddleware, 
  checkPermission('documents.derive'),
  documentController.deriveDocument
);

/**
 * @route   POST /api/documents/:id/finalize
 * @desc    Finalizar/Atender documento
 * @access  Private (requiere permiso de finalizar)
 */
router.post('/:id/finalize', authMiddleware, 
  checkPermission('documents.finalize'),
  documentController.finalizeDocument
);

/**
 * @route   PATCH /api/documents/:id/category
 * @desc    Actualizar categoría del documento
 * @access  Private (requiere permiso de asignar categorías)
 */
router.patch('/:id/category', authMiddleware, 
  checkPermission('documents.category.assign'),
  documentController.updateDocumentCategory
);

/**
 * @route   PUT /api/documents/:id/status
 * @desc    Cambiar estado del documento manualmente
 * @access  Private (requiere permiso de cambiar estados)
 */
router.put('/:id/status', authMiddleware, 
  checkPermission('documents.status.change'),
  documentController.changeDocumentStatus
);

/**
 * @route   GET /api/documents/:documentId/attachments/:attachmentId/view
 * @desc    Visualizar archivo adjunto (inline, sin forzar descarga)
 * @access  Public (puede ser consultado por código de seguimiento)
 */
router.get('/:documentId/attachments/:attachmentId/view', documentController.viewAttachment);

/**
 * @route   GET /api/documents/:documentId/attachments/:attachmentId/download
 * @desc    Descargar archivo adjunto (fuerza descarga)
 * @access  Public (puede ser consultado por código de seguimiento)
 */
router.get('/:documentId/attachments/:attachmentId/download', documentController.downloadAttachment);

// ============================================================
// RUTAS DE VERSIONES DE DOCUMENTOS
// ============================================================

/**
 * @route   GET /api/documents/:documentId/versions
 * @desc    Obtener todas las versiones de un documento
 * @access  Private (requiere permiso de ver versiones)
 */
router.get('/:documentId/versions', authMiddleware, 
  checkPermission('versions.view'),
  documentVersionController.getVersionsByDocument
);

/**
 * @route   GET /api/documents/:documentId/versions/latest
 * @desc    Obtener última versión de un documento
 * @access  Private (requiere permiso de ver versiones)
 */
router.get('/:documentId/versions/latest', authMiddleware, 
  checkPermission('versions.view'),
  documentVersionController.getLatestVersion
);

/**
 * @route   POST /api/documents/:documentId/versions
 * @desc    Subir nueva versión de documento (con sello y firma)
 * @access  Private (requiere permiso de crear versiones)
 */
router.post('/:documentId/versions', authMiddleware, 
  checkPermission('versions.create'),
  uploadDocumentVersion, handleMulterError, 
  documentVersionController.uploadVersion
);

/**
 * @route   GET /api/documents/versions/:id
 * @desc    Obtener versión específica por ID
 * @access  Private (requiere permiso de ver versiones)
 */
router.get('/versions/:id', authMiddleware, 
  checkPermission('versions.view'),
  documentVersionController.getVersionById
);

/**
 * @route   GET /api/documents/versions/:id/download
 * @desc    Descargar versión específica
 * @access  Private (requiere permiso de ver versiones)
 */
router.get('/versions/:id/download', authMiddleware, 
  checkPermission('versions.view'),
  documentVersionController.downloadVersion
);

/**
 * @route   DELETE /api/documents/versions/:id
 * @desc    Eliminar versión
 * @access  Private (requiere permiso de eliminar versiones)
 */
router.delete('/versions/:id', authMiddleware, 
  checkPermission('versions.delete'),
  documentVersionController.deleteVersion
);

module.exports = router;
