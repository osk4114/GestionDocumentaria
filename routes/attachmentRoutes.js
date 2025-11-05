const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const attachmentController = require('../controllers/attachmentController');

/**
 * @route   POST /api/attachments/upload/:documentId
 * @desc    Subir archivo adjunto a un documento
 * @access  Private (requiere subir adjuntos)
 */
router.post(
  '/upload/:documentId',
  authMiddleware,
  checkPermission('attachments.upload'),
  upload.single('file'),
  handleMulterError,
  attachmentController.uploadAttachment
);

/**
 * @route   GET /api/attachments/view/:id
 * @desc    Visualizar archivo adjunto (inline, sin forzar descarga)
 * @access  Private (requiere ver adjuntos)
 */
router.get('/view/:id', authMiddleware, checkPermission('attachments.view'), attachmentController.viewAttachment);

/**
 * @route   GET /api/attachments/download/:id
 * @desc    Descargar archivo adjunto (fuerza descarga)
 * @access  Private (requiere descargar adjuntos)
 */
router.get('/download/:id', authMiddleware, checkPermission('attachments.download'), attachmentController.downloadAttachment);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Eliminar archivo adjunto
 * @access  Private (requiere eliminar adjuntos)
 */
router.delete('/:id', authMiddleware, checkPermission('attachments.delete'), attachmentController.deleteAttachment);

/**
 * @route   GET /api/attachments/document/:documentId
 * @desc    Listar archivos adjuntos de un documento
 * @access  Private (requiere ver adjuntos)
 */
router.get('/document/:documentId', authMiddleware, checkPermission('attachments.view'), attachmentController.listAttachments);

module.exports = router;
