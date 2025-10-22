const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload, handleMulterError } = require('../middleware/uploadMiddleware');
const attachmentController = require('../controllers/attachmentController');

/**
 * @route   POST /api/attachments/upload/:documentId
 * @desc    Subir archivo adjunto a un documento
 * @access  Private
 */
router.post(
  '/upload/:documentId',
  authMiddleware,
  upload.single('file'),
  handleMulterError,
  attachmentController.uploadAttachment
);

/**
 * @route   GET /api/attachments/download/:id
 * @desc    Descargar archivo adjunto
 * @access  Private
 */
router.get('/download/:id', authMiddleware, attachmentController.downloadAttachment);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Eliminar archivo adjunto
 * @access  Private
 */
router.delete('/:id', authMiddleware, attachmentController.deleteAttachment);

/**
 * @route   GET /api/attachments/document/:documentId
 * @desc    Listar archivos adjuntos de un documento
 * @access  Private
 */
router.get('/document/:documentId', authMiddleware, attachmentController.listAttachments);

module.exports = router;
