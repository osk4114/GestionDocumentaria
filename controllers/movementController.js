const { DocumentMovement, Document, Area, User, DocumentStatus } = require('../models');

/**
 * Crear movimiento manual (para casos especiales)
 */
exports.createMovement = async (req, res) => {
  try {
    const { documentId, fromAreaId, toAreaId, accion, observacion } = req.body;

    if (!documentId || !accion) {
      return res.status(400).json({
        success: false,
        message: 'Los campos documentId y accion son obligatorios'
      });
    }

    const movement = await DocumentMovement.create({
      documentId,
      fromAreaId,
      toAreaId,
      userId: req.user.id,
      accion,
      observacion
    });

    const fullMovement = await DocumentMovement.findByPk(movement.id, {
      include: [
        { model: Area, as: 'fromArea', attributes: ['id', 'nombre', 'sigla'] },
        { model: Area, as: 'toArea', attributes: ['id', 'nombre', 'sigla'] },
        { model: User, as: 'user', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      data: fullMovement
    });

  } catch (error) {
    console.error('Error en createMovement:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear movimiento',
      error: error.message
    });
  }
};

/**
 * Obtener historial de movimientos de un documento
 */
exports.getMovementHistory = async (req, res) => {
  try {
    const { documentId } = req.params;

    const movements = await DocumentMovement.findAll({
      where: { documentId },
      include: [
        { model: Area, as: 'fromArea', attributes: ['id', 'nombre', 'sigla'] },
        { model: Area, as: 'toArea', attributes: ['id', 'nombre', 'sigla'] },
        { model: User, as: 'user', attributes: ['id', 'nombre', 'email'] }
      ],
      order: [['timestamp', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: movements.length,
      data: movements
    });

  } catch (error) {
    console.error('Error en getMovementHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

/**
 * Aceptar/recepcionar un documento
 */
exports.acceptDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { observacion } = req.body;

    const document = await Document.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar que el documento esté en el área del usuario
    if (document.currentAreaId !== req.user.areaId) {
      return res.status(403).json({
        success: false,
        message: 'El documento no está en tu área'
      });
    }

    // Cambiar estado a "En proceso"
    const statusEnTramite = await DocumentStatus.findOne({ 
      where: { nombre: 'En proceso' } 
    });

    await document.update({
      statusId: statusEnTramite.id,
      currentUserId: req.user.id
    });

    // Registrar movimiento de aceptación
    await DocumentMovement.create({
      documentId: document.id,
      fromAreaId: null,
      toAreaId: document.currentAreaId,
      userId: req.user.id,
      accion: 'Aceptación',
      observacion: observacion || 'Documento aceptado para trámite'
    });

    const updatedDocument = await Document.findByPk(documentId, {
      include: [
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Documento aceptado exitosamente',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Error en acceptDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar documento',
      error: error.message
    });
  }
};

/**
 * Rechazar un documento
 */
exports.rejectDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { observacion, returnToAreaId } = req.body;

    if (!observacion) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar una observación para el rechazo'
      });
    }

    const document = await Document.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar que el documento esté en el área del usuario (excepto Administrador)
    if (document.currentAreaId !== req.user.areaId && req.user.role.nombre !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'El documento no está en tu área'
      });
    }

    const statusRechazado = await DocumentStatus.findOne({ 
      where: { nombre: 'Observado' } // Usar "Observado" para documentos rechazados
    });

    const fromAreaId = document.currentAreaId;

    // Si se especifica área de retorno, devolver el documento
    if (returnToAreaId) {
      await document.update({
        currentAreaId: returnToAreaId,
        currentUserId: null,
        statusId: statusRechazado.id
      });
    } else {
      // Solo cambiar estado a rechazado
      await document.update({
        statusId: statusRechazado.id
      });
    }

    // Registrar movimiento de rechazo
    await DocumentMovement.create({
      documentId: document.id,
      fromAreaId,
      toAreaId: returnToAreaId || null,
      userId: req.user.id,
      accion: 'Rechazo',
      observacion
    });

    const updatedDocument = await Document.findByPk(documentId, {
      include: [
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Documento rechazado',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Error en rejectDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar documento',
      error: error.message
    });
  }
};

/**
 * Finalizar/completar un documento
 */
exports.completeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { observacion } = req.body;

    const document = await Document.findByPk(documentId);

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
        message: 'No tienes permisos para finalizar este documento'
      });
    }

    const statusFinalizado = await DocumentStatus.findOne({ 
      where: { nombre: 'Atendido' } // Usar "Atendido" como estado final
    });

    if (!statusFinalizado) {
      return res.status(500).json({
        success: false,
        message: 'Estado "Atendido" no encontrado en la base de datos'
      });
    }

    await document.update({
      statusId: statusFinalizado.id
    });

    // Registrar movimiento de finalización
    await DocumentMovement.create({
      documentId: document.id,
      fromAreaId: document.currentAreaId,
      toAreaId: null,
      userId: req.user.id,
      accion: 'Finalización',
      observacion: observacion || 'Documento finalizado'
    });

    const updatedDocument = await Document.findByPk(documentId, {
      include: [
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Documento finalizado exitosamente',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Error en completeDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al finalizar documento',
      error: error.message
    });
  }
};
