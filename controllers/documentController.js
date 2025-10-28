const documentService = require('../services/documentService');

/**
 * Controlador de Documentos (Delgado)
 * Solo maneja requests HTTP y delega la lógica al servicio
 */

/**
 * Presentar documento (público - Mesa de Partes Virtual)
 */
exports.submitDocument = async (req, res) => {
  try {
    // Extraer todos los campos del formulario
    const { 
      tipoPersona, 
      email, 
      telefono, 
      asunto, 
      descripcion, 
      linkDescarga,
      // Campos persona natural
      tipoDocumentoNatural,
      numeroDocumentoNatural,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      // Campos persona jurídica
      ruc,
      nombreEmpresa,
      tipoDocumentoRepresentante,
      numeroDocumentoRepresentante,
      nombresRepresentante,
      apellidoPaternoRepresentante,
      apellidoMaternoRepresentante,
      // Campos de dirección (comunes)
      departamento,
      provincia,
      distrito,
      direccion
    } = req.body;

    // Validar datos requeridos
    if (!email || !telefono || !asunto) {
      return res.status(400).json({
        success: false,
        message: 'Email, teléfono y asunto son requeridos'
      });
    }

    // Separar datos para el servicio
    const senderData = {
      tipoPersona: tipoPersona || 'natural',
      email,
      telefono,
      // Persona natural
      tipoDocumentoNatural,
      numeroDocumentoNatural,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      // Persona jurídica
      ruc,
      nombreEmpresa,
      tipoDocumentoRepresentante,
      numeroDocumentoRepresentante,
      nombresRepresentante,
      apellidoPaternoRepresentante,
      apellidoMaternoRepresentante,
      // Dirección
      departamento,
      provincia,
      distrito,
      direccion
    };

    const documentData = {
      asunto,
      descripcion: descripcion || null,
      documentTypeId: null, // El formulario no pide tipo de documento
      linkDescarga: linkDescarga || null
    };

    // Archivos adjuntos (puede ser un array si hay múltiples archivos)
    const files = req.files || [];

    const result = await documentService.submitPublicDocument(senderData, documentData, files);

    res.status(201).json({
      success: true,
      message: 'Documento registrado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error en submitDocument:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al registrar documento',
      error: error.message
    });
  }
};

/**
 * Crear nuevo documento
 */
exports.createDocument = async (req, res) => {
  try {
    const document = await documentService.createNewDocument(
      req.body,
      req.user,
      req.file
    );

    res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: document
    });

  } catch (error) {
    console.error('Error en createDocument:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear documento',
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
    const updatedDocument = await documentService.updateDocument(
      id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Error en updateDocument:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 : 
                       error.message.includes('permisos') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al actualizar documento',
      error: error.message
    });
  }
};

/**
 * Archivar documento
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    
    const result = await documentService.archiveDocument(id, req.user, observacion);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error en deleteDocument:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 :
                       error.message.includes('área') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al archivar documento',
      error: error.message
    });
  }
};

/**
 * Desarchivar documento (reactivar)
 */
exports.unarchiveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    
    const result = await documentService.unarchiveDocument(id, req.user, observacion);

    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error en unarchiveDocument:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 :
                       error.message.includes('área') || error.message.includes('archivado') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al desarchivar documento',
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
    const { toAreaId, userId, observacion } = req.body;

    if (!toAreaId) {
      return res.status(400).json({
        success: false,
        message: 'El campo toAreaId es obligatorio'
      });
    }

    const document = await documentService.deriveDocument(
      id,
      toAreaId,
      userId,
      observacion,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Documento derivado exitosamente',
      data: document
    });

  } catch (error) {
    console.error('Error en deriveDocument:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 :
                       error.message.includes('área') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al derivar documento',
      error: error.message
    });
  }
};

/**
 * Finalizar documento
 */
exports.finalizeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;

    const document = await documentService.finalizeDocument(
      id,
      observacion,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Documento finalizado exitosamente',
      data: document
    });

  } catch (error) {
    console.error('Error en finalizeDocument:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 :
                       error.message.includes('área') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al finalizar documento',
      error: error.message
    });
  }
};

/**
 * Cambiar estado de un documento manualmente
 * PUT /api/documents/:id/status
 */
exports.changeDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statusId, observacion } = req.body;

    // Validar datos requeridos
    if (!statusId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del estado es requerido'
      });
    }

    const result = await documentService.changeDocumentStatus(
      parseInt(id),
      parseInt(statusId),
      req.user,
      observacion
    );

    res.status(200).json(result);

  } catch (error) {
    console.error('Error en changeDocumentStatus:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 :
                       error.message.includes('permisos') ? 403 : 
                       error.message.includes('mismo estado') ? 400 :
                       error.message.includes('manualmente') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al cambiar estado del documento',
      error: error.message
    });
  }
};

/**
 * Obtener todos los estados disponibles
 * GET /api/documents/statuses
 */
exports.getDocumentStatuses = async (req, res) => {
  try {
    const { DocumentStatus } = require('../models');
    const statuses = await DocumentStatus.findAll({
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Error en getDocumentStatuses:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estados de documentos',
      error: error.message
    });
  }
};

/**
 * Obtener documentos (con filtros)
 */
exports.getDocuments = async (req, res) => {
  try {
    const documents = await documentService.getDocuments(req.query);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Error en getDocuments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
};

/**
 * Obtener documento por ID
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await documentService.getDocumentById(id);

    res.status(200).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Error en getDocumentById:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener documento',
      error: error.message
    });
  }
};

/**
 * Obtener documento por código de seguimiento (público)
 */
exports.getDocumentByTrackingCode = async (req, res) => {
  try {
    const { code } = req.params;
    const document = await documentService.getDocumentByTrackingCode(code);

    res.status(200).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Error en getDocumentByTrackingCode:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al buscar documento',
      error: error.message
    });
  }
};

/**
 * Obtener documentos por área con filtros avanzados
 */
exports.getDocumentsByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { status, priority, search, dateFrom, dateTo, documentType } = req.query;

    // Construir objeto de filtros
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (search) filters.search = search;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (documentType) filters.documentType = documentType;

    const documents = await documentService.getDocumentsByArea(areaId, req.user, filters);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Error en getDocumentsByArea:', error);
    const statusCode = error.message.includes('permisos') ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener documentos',
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
    const stats = await documentService.getDocumentStats(areaId);

    res.status(200).json({
      success: true,
      data: stats
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

/**
 * Obtener documentos archivados por área con filtros avanzados
 */
exports.getArchivedDocumentsByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { dateFrom, dateTo, search, priority, documentType } = req.query;
    
    // Construir objeto de filtros
    const filters = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (search) filters.search = search;
    if (priority) filters.priority = priority;
    if (documentType) filters.documentType = documentType;
    
    const documents = await documentService.getArchivedDocumentsByArea(areaId, filters);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Error en getArchivedDocumentsByArea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos archivados',
      error: error.message
    });
  }
};

/**
 * Búsqueda avanzada de documentos
 */
exports.advancedSearch = async (req, res) => {
  try {
    const criteria = req.query;
    const result = await documentService.advancedSearch(criteria);

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error en advancedSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda avanzada',
      error: error.message
    });
  }
};

/**
 * Obtener historial completo de un documento
 */
exports.getDocumentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await documentService.getDocumentHistory(id);

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error en getDocumentHistory:', error);
    const statusCode = error.message === 'Documento no encontrado' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al obtener historial',
      error: error.message
    });
  }
};

/**
 * Obtener documentos agrupados por estado
 */
exports.getDocumentsByStatus = async (req, res) => {
  try {
    const { areaId } = req.query;
    const documents = await documentService.getDocumentsByStatus(areaId);

    res.status(200).json({
      success: true,
      data: documents
    });

  } catch (error) {
    console.error('Error en getDocumentsByStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos por estado',
      error: error.message
    });
  }
};

/**
 * Descargar archivo adjunto
 */
exports.downloadAttachment = async (req, res) => {
  try {
    const { documentId, attachmentId } = req.params;
    const attachment = await documentService.getAttachmentById(documentId, attachmentId);

    // Verificar que el archivo existe físicamente
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(attachment.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }

    // Establecer headers para descarga
    res.setHeader('Content-Type', attachment.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    
    // Enviar archivo
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error en downloadAttachment:', error);
    const statusCode = error.message.includes('no encontrado') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al descargar archivo',
      error: error.message
    });
  }
};
