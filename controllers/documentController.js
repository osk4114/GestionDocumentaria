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
    // El nuevo formulario envía todo junto, no separado en sender y document
    const { tipoPersona, email, telefono, asunto, descripcion, linkDescarga } = req.body;

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
      telefono
    };

    const documentData = {
      asunto,
      descripcion: descripcion || null,
      prioridad: 'normal',
      documentTypeId: null // El formulario no pide tipo de documento
    };

    const result = await documentService.submitPublicDocument(senderData, documentData);

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
    const { toAreaId, userId, observacion, prioridad } = req.body;

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
      req.user,
      prioridad
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
