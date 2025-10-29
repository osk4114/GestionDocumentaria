const express = require('express');
const router = express.Router();
const documentVersionController = require('../controllers/documentVersionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { uploadDocumentVersion } = require('../middleware/uploadMiddleware');

/**
 * Rutas para gestión de versiones de documentos
 * Base: /api/documents
 */

// ============================================================
// Rutas de Versiones de Documentos
// ============================================================

/**
 * @route   GET /api/documents/:documentId/versions
 * @desc    Obtener todas las versiones de un documento
 * @access  Private
 */
router.get('/:documentId/versions', authenticateToken, documentVersionController.getVersionsByDocument);

/**
 * @route   GET /api/documents/:documentId/versions/latest
 * @desc    Obtener última versión de un documento
 * @access  Private
 */
router.get('/:documentId/versions/latest', authenticateToken, documentVersionController.getLatestVersion);

/**
 * @route   POST /api/documents/:documentId/versions
 * @desc    Subir nueva versión de documento (con sello y firma)
 * @access  Private
 */
router.post('/:documentId/versions', authenticateToken, uploadDocumentVersion, documentVersionController.uploadVersion);

/**
 * @route   GET /api/documents/versions/:id
 * @desc    Obtener versión específica por ID
 * @access  Private
 */
router.get('/versions/:id', authenticateToken, documentVersionController.getVersionById);

/**
 * @route   GET /api/documents/versions/:id/download
 * @desc    Descargar versión específica
 * @access  Private
 */
router.get('/versions/:id/download', authenticateToken, documentVersionController.downloadVersion);

/**
 * @route   DELETE /api/documents/versions/:id
 * @desc    Eliminar versión
 * @access  Private (Solo Admin o creador)
 */
router.delete('/versions/:id', authenticateToken, documentVersionController.deleteVersion);

module.exports = router;
