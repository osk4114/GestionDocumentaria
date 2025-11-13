const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas de Tipos de Documento
 * Lectura pública (para selects), escritura solo admin
 */

/**
 * @route   GET /api/document-types/public
 * @desc    Obtener tipos de documento activos (público para submit)
 * @access  Public (sin autenticación)
 */
router.get('/public', documentTypeController.getActiveDocumentTypes);

/**
 * @route   GET /api/document-types
 * @desc    Obtener todos los tipos de documento
 * @access  Private (requiere autenticación para filtrar por permisos)
 * @query   ?active=true (opcional)
 */
router.get('/', authMiddleware, checkAnyPermission(['document_types.view', 'area_mgmt.document_types.view']), documentTypeController.getAllDocumentTypes);

/**
 * @route   GET /api/document-types/active
 * @desc    Obtener solo tipos de documento activos (para filtros en bandeja)
 * @access  Private (requiere autenticación, sin restricción de permisos)
 */
router.get('/active', authMiddleware, documentTypeController.getActiveDocumentTypes);

/**
 * @route   GET /api/document-types/:id
 * @desc    Obtener tipo de documento por ID
 * @access  Private (requiere ver tipos de documento)
 */
router.get('/:id', authMiddleware, checkAnyPermission(['document_types.view', 'area_mgmt.document_types.view']), documentTypeController.getDocumentTypeById);

/**
 * @route   POST /api/document-types
 * @desc    Crear nuevo tipo de documento
 * @access  Private (requiere crear tipos de documento)
 */
router.post('/', authMiddleware, checkAnyPermission(['document_types.create', 'area_mgmt.document_types.create']), documentTypeController.createDocumentType);

/**
 * @route   PUT /api/document-types/:id
 * @desc    Actualizar tipo de documento
 * @access  Private (requiere editar tipos de documento)
 */
router.put('/:id', authMiddleware, checkAnyPermission(['document_types.edit', 'area_mgmt.document_types.edit']), documentTypeController.updateDocumentType);

/**
 * @route   DELETE /api/document-types/:id
 * @desc    Eliminar tipo de documento permanentemente
 * @access  Private (requiere eliminar tipos de documento)
 */
router.delete('/:id', authMiddleware, checkPermission('document_types.delete'), documentTypeController.deleteDocumentType);

/**
 * @route   PATCH /api/document-types/:id/activate
 * @desc    Activar tipo de documento previamente desactivado
 * @access  Private (requiere activar tipos de documento)
 */
router.patch('/:id/activate', authMiddleware, checkPermission('document_types.activate'), documentTypeController.activateDocumentType);

/**
 * @route   PATCH /api/document-types/:id/deactivate
 * @desc    Desactivar tipo de documento (soft delete)
 * @access  Private (requiere desactivar tipos de documento)
 */
router.patch('/:id/deactivate', authMiddleware, checkPermission('document_types.deactivate'), documentTypeController.deactivateDocumentType);

module.exports = router;
