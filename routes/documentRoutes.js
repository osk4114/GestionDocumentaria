const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole, isAdmin } = require('../middleware/roleMiddleware');
const documentController = require('../controllers/documentController');
const { Document, Sender, DocumentType, DocumentStatus, Area, User, DocumentMovement, Attachment } = require('../models');

/**
 * @route   GET /api/documents/stats
 * @desc    Obtener estadísticas de documentos
 * @access  Private
 */
router.get('/stats', authMiddleware, documentController.getDocumentStats);

/**
 * @route   GET /api/documents/tracking/:code
 * @desc    Buscar documento por código de seguimiento (público)
 * @access  Public
 */
router.get('/tracking/:code', async (req, res) => {
  try {
    const { status, area, priority, search } = req.query;
    
    const where = {};
    
    // Filtros opcionales
    if (status) where.statusId = status;
    if (area) where.currentAreaId = area;
    if (priority) where.prioridad = priority;
    
    // Búsqueda por tracking code o asunto
    if (search) {
      where[Op.or] = [
        { trackingCode: { [Op.like]: `%${search}%` } },
        { asunto: { [Op.like]: `%${search}%` } }
      ];
    }

    const documents = await Document.findAll({
      where,
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Error en GET /documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/documents/:id
 * @desc    Obtener un documento por ID
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre', 'email'] },
        { 
          model: DocumentMovement, 
          as: 'movements',
          include: [
            { model: Area, as: 'fromArea' },
            { model: Area, as: 'toArea' },
            { model: User, as: 'user', attributes: ['id', 'nombre'] }
          ],
          order: [['timestamp', 'ASC']]
        },
        { 
          model: Attachment, 
          as: 'attachments',
          include: [{ model: User, as: 'uploader', attributes: ['id', 'nombre'] }]
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Error en GET /documents/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documento',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/documents/tracking/:code
 * @desc    Buscar documento por código de seguimiento (público)
 * @access  Public
 */
router.get('/tracking/:code', async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { trackingCode: req.params.code },
      include: [
        { model: Sender, as: 'sender', attributes: ['nombreCompleto'] },
        { model: DocumentType, as: 'documentType', attributes: ['nombre'] },
        { model: DocumentStatus, as: 'status', attributes: ['nombre', 'color'] },
        { 
          model: DocumentMovement, 
          as: 'movements',
          include: [
            { model: Area, as: 'fromArea', attributes: ['nombre', 'sigla'] },
            { model: Area, as: 'toArea', attributes: ['nombre', 'sigla'] }
          ],
          attributes: ['id', 'accion', 'observacion', 'timestamp'],
          order: [['timestamp', 'ASC']]
        }
      ],
      attributes: ['id', 'trackingCode', 'asunto', 'prioridad', 'created_at']
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Error en GET /tracking/:code:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar documento',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/documents/area/:areaId
 * @desc    Obtener documentos por área
 * @access  Private
 */
router.get('/area/:areaId', authMiddleware, documentController.getDocumentsByArea);

/**
 * @route   GET /api/documents
 * @desc    Obtener todos los documentos (con filtros)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, area, priority, search } = req.query;
    
    const where = {};
    
    // Filtros opcionales
    if (status) where.statusId = status;
    if (area) where.currentAreaId = area;
    if (priority) where.prioridad = priority;
    
    // Búsqueda por tracking code o asunto
    if (search) {
      where[Op.or] = [
        { trackingCode: { [Op.like]: `%${search}%` } },
        { asunto: { [Op.like]: `%${search}%` } }
      ];
    }

    const documents = await Document.findAll({
      where,
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Error en GET /documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/documents
 * @desc    Crear nuevo documento
 * @access  Private (Mesa de Partes o Admin)
 */
router.post('/', authMiddleware, checkRole(['Administrador', 'Mesa de Partes', 'Funcionario']), documentController.createDocument);

/**
 * @route   PUT /api/documents/:id
 * @desc    Actualizar documento
 * @access  Private (Área actual o Admin)
 */
router.put('/:id', authMiddleware, documentController.updateDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Archivar documento
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware, isAdmin, documentController.deleteDocument);

/**
 * @route   POST /api/documents/:id/derive
 * @desc    Derivar documento a otra área
 * @access  Private
 */
router.post('/:id/derive', authMiddleware, documentController.deriveDocument);

module.exports = router;
