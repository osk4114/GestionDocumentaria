const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

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
 * @access  Private
 */
router.get('/:id', authMiddleware, documentTypeController.getDocumentTypeById);

/**
 * @route   POST /api/document-types
 * @desc    Crear nuevo tipo de documento
 * @access  Private (Solo Admin)
 */
router.post('/', authMiddleware, isAdmin, documentTypeController.createDocumentType);

/**
 * @route   PUT /api/document-types/:id
 * @desc    Actualizar tipo de documento
 * @access  Private (Solo Admin)
 */
router.put('/:id', authMiddleware, isAdmin, documentTypeController.updateDocumentType);

/**
 * @route   DELETE /api/document-types/:id
 * @desc    Desactivar tipo de documento
 * @access  Private (Solo Admin)
 */
router.delete('/:id', authMiddleware, isAdmin, documentTypeController.deleteDocumentType);

/**
 * @route   PATCH /api/document-types/:id/activate
 * @desc    Activar tipo de documento previamente desactivado
 * @access  Private (Solo Admin)
 */
router.patch('/:id/activate', authMiddleware, isAdmin, documentTypeController.activateDocumentType);

module.exports = router;
