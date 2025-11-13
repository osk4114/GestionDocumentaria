const express = require('express');
const router = express.Router();
const documentVersionController = require('../controllers/documentVersionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');
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
 * @access  Private (requiere ver versiones)
 */
router.get('/:documentId/versions', authMiddleware, checkAnyPermission(['versions.view', 'versions.list', 'area_mgmt.versions.view', 'area_mgmt.versions.list', 'area_mgmt.versions.full']), documentVersionController.getVersionsByDocument);

/**
 * @route   GET /api/documents/:documentId/versions/latest
 * @desc    Obtener última versión de un documento
 * @access  Private (requiere ver versiones)
 */
router.get('/:documentId/versions/latest', authMiddleware, checkAnyPermission(['versions.view', 'area_mgmt.versions.view', 'area_mgmt.versions.full']), documentVersionController.getLatestVersion);

/**
 * @route   POST /api/documents/:documentId/versions
 * @desc    Subir nueva versión de documento (con sello y firma)
 * @access  Private (requiere subir versiones)
 */
router.post('/:documentId/versions', authMiddleware, checkAnyPermission(['versions.upload', 'area_mgmt.versions.upload', 'area_mgmt.versions.full']), uploadDocumentVersion, documentVersionController.uploadVersion);

/**
 * @route   GET /api/documents/versions/:id
 * @desc    Obtener versión específica por ID
 * @access  Private (requiere ver versiones)
 */
router.get('/versions/:id', authMiddleware, checkAnyPermission(['versions.view', 'area_mgmt.versions.view', 'area_mgmt.versions.full']), documentVersionController.getVersionById);

/**
 * @route   GET /api/documents/versions/:id/download
 * @desc    Descargar versión específica
 * @access  Private (requiere descargar versiones)
 */
router.get('/versions/:id/download', authMiddleware, checkAnyPermission(['versions.download', 'area_mgmt.versions.download', 'area_mgmt.versions.full']), documentVersionController.downloadVersion);

/**
 * @route   DELETE /api/documents/versions/:id
 * @desc    Eliminar versión
 * @access  Private (requiere eliminar versiones)
 */
router.delete('/versions/:id', authMiddleware, checkAnyPermission(['versions.delete', 'area_mgmt.versions.delete', 'area_mgmt.versions.full']), documentVersionController.deleteVersion);

module.exports = router;
