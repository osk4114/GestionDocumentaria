const { Document, Sender, DocumentType, DocumentStatus, Area, User, DocumentMovement, Attachment } = require('../models');
const { Op } = require('sequelize');

/**
 * Generar código de seguimiento único
 */
const generateTrackingCode = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000);
  return `SGD-${year}-${random}`;
};

/**
 * Crear nuevo documento
 */
exports.createDocument = async (req, res) => {
  try {
    const {
      senderId,
      documentTypeId,
      asunto,
      descripcion,
      prioridad,
      fechaDocumento,
      numeroDocumento,
      folios
    } = req.body;

    // Validar campos requeridos
    if (!senderId || !documentTypeId || !asunto) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: senderId, documentTypeId, asunto'
      });
    }

    // Generar tracking code único
    let trackingCode;
    let exists = true;
    while (exists) {
      trackingCode = generateTrackingCode();
      const existing = await Document.findOne({ where: { trackingCode } });
      exists = !!existing;
    }

    // El documento inicia en el área del usuario que lo crea
    const statusRecibido = await DocumentStatus.findOne({ 
      where: { nombre: 'Pendiente' } // Usar estado inicial "Pendiente"
    });

    if (!statusRecibido) {
      return res.status(500).json({
        success: false,
        message: 'Estado inicial no encontrado en la base de datos'
      });
    }

    const document = await Document.create({
      trackingCode,
      senderId,
      docTypeId: documentTypeId, // Usar docTypeId como en el modelo
      statusId: statusRecibido.id,
      currentAreaId: req.user.areaId,
      currentUserId: req.user.id,
      asunto,
      descripcion,
      prioridad: prioridad || 'normal',
      fechaDocumento,
      numeroDocumento,
      folios
    });

    // Crear movimiento inicial de recepción
    await DocumentMovement.create({
      documentId: document.id,
      fromAreaId: null, // Viene de externo
      toAreaId: req.user.areaId,
      userId: req.user.id,
      accion: 'Recepción',
      observacion: 'Documento recibido e ingresado al sistema'
    });

    // Obtener documento completo con relaciones
    const fullDocument = await Document.findByPk(document.id, {
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: fullDocument
    });

  } catch (error) {
    console.error('Error en createDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear documento',
      error: error.message
    });
  }
};

/**
 * Actualizar documento
 */
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      asunto,
      descripcion,
      prioridad,
      fechaDocumento,
      numeroDocumento,
      folios
    } = req.body;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar permisos: solo el área actual o admin pueden editar
    if (req.user.areaId !== document.currentAreaId && req.user.role.nombre !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este documento'
      });
    }

    await document.update({
      asunto: asunto || document.asunto,
      descripcion: descripcion || document.descripcion,
      prioridad: prioridad || document.prioridad,
      fechaDocumento: fechaDocumento || document.fechaDocumento,
      numeroDocumento: numeroDocumento || document.numeroDocumento,
      folios: folios || document.folios
    });

    const updatedDocument = await Document.findByPk(id, {
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Error en updateDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar documento',
      error: error.message
    });
  }
};

/**
 * Eliminar documento (soft delete)
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Solo admin puede eliminar
    if (req.user.role.nombre !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar documentos'
      });
    }

    // Cambiar estado a "Archivado" en lugar de eliminar
    const statusArchivado = await DocumentStatus.findOne({ 
      where: { nombre: 'Archivado' } 
    });

    await document.update({ statusId: statusArchivado.id });

    res.status(200).json({
      success: true,
      message: 'Documento archivado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al archivar documento',
      error: error.message
    });
  }
};

/**
 * Derivar documento a otra área
 */
exports.deriveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { toAreaId, userId, observacion, prioridad } = req.body;

    if (!toAreaId) {
      return res.status(400).json({
        success: false,
        message: 'El campo toAreaId es obligatorio'
      });
    }

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar que el documento esté en el área del usuario
    if (document.currentAreaId !== req.user.areaId && req.user.role.nombre !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'El documento no está en tu área'
      });
    }

    // Verificar que no se derive a la misma área
    if (parseInt(toAreaId) === document.currentAreaId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes derivar un documento a la misma área'
      });
    }

    const fromAreaId = document.currentAreaId;

    // Cambiar estado a "En proceso"
    const statusEnTramite = await DocumentStatus.findOne({ 
      where: { nombre: 'En proceso' } 
    });

    if (!statusEnTramite) {
      return res.status(500).json({
        success: false,
        message: 'Estado "En proceso" no encontrado en la base de datos'
      });
    }

    // Actualizar documento
    await document.update({
      currentAreaId: toAreaId,
      currentUserId: userId || null,
      statusId: statusEnTramite.id,
      prioridad: prioridad || document.prioridad
    });

    // Crear movimiento de derivación
    await DocumentMovement.create({
      documentId: document.id,
      fromAreaId,
      toAreaId,
      userId: req.user.id,
      accion: 'Derivación',
      observacion: observacion || 'Documento derivado'
    });

    // TODO: Crear notificación para el área destino

    const updatedDocument = await Document.findByPk(id, {
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Documento derivado exitosamente',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Error en deriveDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al derivar documento',
      error: error.message
    });
  }
};

/**
 * Obtener documentos por área
 */
exports.getDocumentsByArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    // Verificar permisos
    if (parseInt(areaId) !== req.user.areaId && req.user.role.nombre !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver documentos de esta área'
      });
    }

    const documents = await Document.findAll({
      where: { currentAreaId: areaId },
      include: [
        { model: Sender, as: 'sender', attributes: ['id', 'nombreCompleto'] },
        { model: DocumentType, as: 'documentType', attributes: ['id', 'nombre'] },
        { model: DocumentStatus, as: 'status', attributes: ['id', 'nombre', 'color'] },
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
    console.error('Error en getDocumentsByArea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de documentos
 */
exports.getDocumentStats = async (req, res) => {
  try {
    const { areaId } = req.query;

    const where = {};
    if (areaId) {
      where.currentAreaId = areaId;
    }

    const total = await Document.count({ where });
    
    const byStatus = await Document.findAll({
      where,
      attributes: [
        'statusId',
        [Document.sequelize.fn('COUNT', Document.sequelize.col('Document.id')), 'count']
      ],
      include: [
        { 
          model: DocumentStatus, 
          as: 'status', 
          attributes: ['nombre', 'color'] 
        }
      ],
      group: ['statusId', 'status.id']
    });

    const byPriority = await Document.findAll({
      where,
      attributes: [
        'prioridad',
        [Document.sequelize.fn('COUNT', Document.sequelize.col('Document.id')), 'count']
      ],
      group: ['prioridad']
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byPriority
      }
    });

  } catch (error) {
    console.error('Error en getDocumentStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
