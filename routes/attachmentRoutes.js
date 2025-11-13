const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');
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
  checkAnyPermission(['attachments.upload', 'area_mgmt.attachments.full']),
  upload.single('file'),
  handleMulterError,
  attachmentController.uploadAttachment
);

/**
 * @route   GET /api/attachments/view/:id
 * @desc    Visualizar archivo adjunto (inline, sin forzar descarga)
 * @access  Private (requiere ver adjuntos)
 */
router.get('/view/:id', authMiddleware, checkAnyPermission(['attachments.view', 'area_mgmt.attachments.full']), attachmentController.viewAttachment);

/**
 * @route   GET /api/attachments/download/:id
 * @desc    Descargar archivo adjunto (fuerza descarga)
 * @access  Private (requiere descargar adjuntos)
 */
router.get('/download/:id', authMiddleware, checkAnyPermission(['attachments.download', 'area_mgmt.attachments.full']), attachmentController.downloadAttachment);

/**
 * @route   DELETE /api/attachments/:id
 * @desc    Eliminar archivo adjunto
 * @access  Private (requiere eliminar adjuntos)
 */
router.delete('/:id', authMiddleware, checkAnyPermission(['attachments.delete', 'area_mgmt.attachments.full']), attachmentController.deleteAttachment);

/**
 * @route   GET /api/attachments/document/:documentId
 * @desc    Listar archivos adjuntos de un documento
 * @access  Private (requiere ver adjuntos)
 */
router.get('/document/:documentId', authMiddleware, checkAnyPermission(['attachments.view', 'area_mgmt.attachments.full']), attachmentController.listAttachments);

module.exports = router;
