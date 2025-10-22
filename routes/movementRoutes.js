const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const movementController = require('../controllers/movementController');

/**
 * @route   POST /api/movements
 * @desc    Crear movimiento manual
 * @access  Private (Admin only)
 */
router.post('/', authMiddleware, isAdmin, movementController.createMovement);

/**
 * @route   GET /api/movements/document/:documentId
 * @desc    Obtener historial de movimientos de un documento
 * @access  Private
 */
router.get('/document/:documentId', authMiddleware, movementController.getMovementHistory);

/**
 * @route   POST /api/movements/accept/:documentId
 * @desc    Aceptar/recepcionar un documento
 * @access  Private
 */
router.post('/accept/:documentId', authMiddleware, movementController.acceptDocument);

/**
 * @route   POST /api/movements/reject/:documentId
 * @desc    Rechazar un documento
 * @access  Private
 */
router.post('/reject/:documentId', authMiddleware, movementController.rejectDocument);

/**
 * @route   POST /api/movements/complete/:documentId
 * @desc    Finalizar/completar un documento
 * @access  Private
 */
router.post('/complete/:documentId', authMiddleware, movementController.completeDocument);

module.exports = router;
