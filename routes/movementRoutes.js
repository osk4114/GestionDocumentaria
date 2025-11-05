const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkPermission, checkAnyPermission } = require('../middleware/permissionMiddleware');
const movementController = require('../controllers/movementController');

/**
 * @route   POST /api/movements
 * @desc    Crear movimiento manual
 * @access  Private (requiere crear movimientos)
 */
router.post('/', authMiddleware, checkPermission('movements.create'), movementController.createMovement);

/**
 * @route   GET /api/movements/document/:documentId
 * @desc    Obtener historial de movimientos de un documento
 * @access  Private (requiere ver movimientos)
 */
router.get('/document/:documentId', authMiddleware, checkPermission('movements.view'), movementController.getMovementHistory);

/**
 * @route   POST /api/movements/accept/:documentId
 * @desc    Aceptar/recepcionar un documento
 * @access  Private (requiere aceptar documentos)
 */
router.post('/accept/:documentId', authMiddleware, checkPermission('movements.accept'), movementController.acceptDocument);

/**
 * @route   POST /api/movements/reject/:documentId
 * @desc    Rechazar un documento
 * @access  Private (requiere rechazar documentos)
 */
router.post('/reject/:documentId', authMiddleware, checkPermission('movements.reject'), movementController.rejectDocument);

/**
 * @route   POST /api/movements/complete/:documentId
 * @desc    Finalizar/completar un documento
 * @access  Private (requiere completar documentos)
 */
router.post('/complete/:documentId', authMiddleware, checkPermission('movements.complete'), movementController.completeDocument);

module.exports = router;
