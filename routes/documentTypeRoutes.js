const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

/**
 * Rutas de Tipos de Documento
 * Lectura pública (para selects), escritura solo admin
 */

/**
 * @route   GET /api/document-types
 * @desc    Obtener todos los tipos de documento
 * @access  Public (para selects en formularios)
 * @query   ?active=true (opcional)
 */
router.get('/', documentTypeController.getAllDocumentTypes);

/**
 * @route   GET /api/document-types/:id
 * @desc    Obtener tipo de documento por ID
 * @access  Private (requiere ver tipos de documento)
 */
router.get('/:id', authMiddleware, checkPermission('document_types.view'), documentTypeController.getDocumentTypeById);

/**
 * @route   POST /api/document-types
 * @desc    Crear nuevo tipo de documento
 * @access  Private (requiere crear tipos de documento)
 */
router.post('/', authMiddleware, checkPermission('document_types.create'), documentTypeController.createDocumentType);

/**
 * @route   PUT /api/document-types/:id
 * @desc    Actualizar tipo de documento
 * @access  Private (requiere editar tipos de documento)
 */
router.put('/:id', authMiddleware, checkPermission('document_types.edit'), documentTypeController.updateDocumentType);

/**
 * @route   DELETE /api/document-types/:id
 * @desc    Desactivar tipo de documento
 * @access  Private (requiere desactivar tipos de documento)
 */
router.delete('/:id', authMiddleware, checkPermission('document_types.deactivate'), documentTypeController.deleteDocumentType);

/**
 * @route   PATCH /api/document-types/:id/activate
 * @desc    Activar tipo de documento previamente desactivado
 * @access  Private (requiere activar tipos de documento)
 */
router.patch('/:id/activate', authMiddleware, checkPermission('document_types.activate'), documentTypeController.activateDocumentType);

module.exports = router;
