const { Document, Sender, DocumentType, DocumentStatus, Area, User, DocumentMovement, Attachment, AreaDocumentCategory } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const realtimeEvents = require('./realtimeEventService');

/**
 * Servicio de Gestión de Documentos
 * Contiene toda la lógica de negocio para el módulo de documentos
 */
class DocumentService {
  
  /**
   * Presentar documento público (Mesa de Partes Virtual)
   * @param {Object} senderData - Datos del remitente
   * @param {Object} documentData - Datos del documento
   * @param {Array} files - Archivos adjuntos (opcional)
   * @returns {Object} Documento creado con código de seguimiento
   */
  async submitPublicDocument(senderData, documentData, files = []) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Crear remitente con todos los campos del formulario
      const senderPayload = {
        tipoPersona: senderData.tipoPersona || 'natural',
        email: senderData.email,
        telefono: senderData.telefono,
        // Campos comunes
        nombreCompleto: senderData.nombreCompleto || null,
        tipoDocumento: senderData.tipoDocumento || null,
        numeroDocumento: senderData.numeroDocumento || null,
        direccion: senderData.direccion || null,
        // Dirección detallada (común para ambos tipos)
        departamento: senderData.departamento || null,
        provincia: senderData.provincia || null,
        distrito: senderData.distrito || null,
        direccionCompleta: senderData.direccion || null
      };

      // Campos específicos según tipo de persona
      if (senderData.tipoPersona === 'natural') {
        // Persona natural
        senderPayload.nombres = senderData.nombres || null;
        senderPayload.apellidoPaterno = senderData.apellidoPaterno || null;
        senderPayload.apellidoMaterno = senderData.apellidoMaterno || null;
        senderPayload.tipoDocumento = senderData.tipoDocumentoNatural || null;
        senderPayload.numeroDocumento = senderData.numeroDocumentoNatural || null;
      } else if (senderData.tipoPersona === 'juridica') {
        // Persona jurídica
        senderPayload.ruc = senderData.ruc || null;
        senderPayload.nombreEmpresa = senderData.nombreEmpresa || null;
        // Representante legal
        senderPayload.representanteTipoDoc = senderData.tipoDocumentoRepresentante || null;
        senderPayload.representanteNumDoc = senderData.numeroDocumentoRepresentante || null;
        senderPayload.representanteNombres = senderData.nombresRepresentante || null;
        senderPayload.representanteApellidoPaterno = senderData.apellidoPaternoRepresentante || null;
        senderPayload.representanteApellidoMaterno = senderData.apellidoMaternoRepresentante || null;
      }

      const sender = await Sender.create(senderPayload, { transaction });

      // 2. Generar código de seguimiento
      const trackingCode = await this.generateTrackingCode();

      // 3. Obtener estado "Pendiente" y área "Mesa de Partes"
      const statusPendiente = await DocumentStatus.findOne({
        where: { nombre: 'Pendiente' },
        transaction
      });

      if (!statusPendiente) {
        throw new Error('Estado "Pendiente" no encontrado en el sistema');
      }

      const mesaDePartes = await Area.findOne({
        where: { nombre: 'Mesa de Partes' },
        transaction
      });

      if (!mesaDePartes) {
        throw new Error('Área "Mesa de Partes" no encontrada en el sistema');
      }

      // 4. Crear documento
      const document = await Document.create({
        trackingCode,
        senderId: sender.id,
        documentTypeId: documentData.documentTypeId || null,
        statusId: statusPendiente.id,
        currentAreaId: mesaDePartes.id,
        asunto: documentData.asunto,
        descripcion: documentData.descripcion || null,
        fechaRecepcion: new Date()
      }, { transaction });

      // 5. Guardar archivos adjuntos (si existen)
      if (files && files.length > 0) {
        for (const file of files) {
          await Attachment.create({
            documentId: document.id,
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: null // NULL para uploads públicos
          }, { transaction });
        }
      }

      // 6. Crear movimiento inicial (sin userId para Mesa de Partes Virtual)
      await DocumentMovement.create({
        documentId: document.id,
        toAreaId: mesaDePartes.id,
        userId: null, // NULL para acciones públicas desde Mesa de Partes Virtual
        accion: 'Recepción',
        observacion: `Documento presentado a través de la Mesa de Partes Virtual${files.length > 0 ? ` con ${files.length} archivo(s) adjunto(s)` : ''}`,
        timestamp: new Date()
      }, { transaction });

      await transaction.commit();

      // 7. Retornar documento con relaciones y adjuntos
      const createdDocument = await Document.findByPk(document.id, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' },
          { model: Attachment, as: 'attachments' }
        ]
      });

      // 🔥 EVENTO EN TIEMPO REAL: Documento creado
      // Notificar a usuarios de Mesa de Partes
      const mesaDePartesUsers = await realtimeEvents.getUsersByArea(mesaDePartes.id);
      await realtimeEvents.emitDocumentCreated(createdDocument, mesaDePartesUsers);

      return {
        document: createdDocument,
        sender,
        trackingCode,
        attachmentsCount: files.length
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error en submitPublicDocument:', error);
      throw error;
    }
  }

  /**
   * Generar código de seguimiento único
   */
  async generateTrackingCode() {
    const year = new Date().getFullYear();
    let trackingCode;
    let exists = true;
    
    while (exists) {
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      trackingCode = `SGD-${year}-${random}`;
      const existing = await Document.findOne({ where: { trackingCode } });
      exists = !!existing;
    }
    
    return trackingCode;
  }

  /**
   * Crear nuevo documento (Mesa de Partes)
   * @param {Object} data - Datos del documento
   * @param {Object} user - Usuario que crea el documento
   * @param {Object} file - Archivo adjunto opcional
   * @returns {Object} Documento creado con relaciones
   */
  async createNewDocument(data, user, file = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        senderId,
        documentTypeId,
        asunto,
        descripcion,
        fechaDocumento,
        numeroDocumento,
        folios
      } = data;

      // Validar campos requeridos
      if (!senderId || !documentTypeId || !asunto) {
        throw new Error('Faltan campos obligatorios: senderId, documentTypeId, asunto');
      }

      // Generar tracking code único
      const trackingCode = await this.generateTrackingCode();

      // Obtener estado inicial
      const statusRecibido = await DocumentStatus.findOne({ 
        where: { nombre: 'Pendiente' },
        transaction
      });

      if (!statusRecibido) {
        throw new Error('Estado inicial "Pendiente" no encontrado en la base de datos');
      }

      // Crear documento
      const document = await Document.create({
        trackingCode,
        senderId,
        docTypeId: documentTypeId,
        statusId: statusRecibido.id,
        currentAreaId: user.areaId,
        currentUserId: user.id,
        asunto,
        descripcion,
        fechaDocumento,
        numeroDocumento,
        folios
      }, { transaction });

      // Crear movimiento inicial de recepción
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: null, // Viene de externo
        toAreaId: user.areaId,
        userId: user.id,
        accion: 'Recepción',
        observacion: 'Documento recibido e ingresado al sistema'
      }, { transaction });

      // Si hay archivo adjunto, crear el attachment
      if (file) {
        await Attachment.create({
          documentId: document.id,
          nombreOriginal: file.originalname,
          nombreArchivo: file.filename,
          rutaArchivo: file.path,
          tipoMime: file.mimetype,
          tamano: file.size,
          uploadedBy: user.id
        }, { transaction });
      }

      await transaction.commit();

      // Obtener documento completo con relaciones
      const fullDocument = await Document.findByPk(document.id, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' },
          { model: User, as: 'currentUser', attributes: ['id', 'nombre', 'email'] },
          { model: Attachment, as: 'attachments' }
        ]
      });

      return fullDocument;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Derivar documento a otra área o usuario
   * @param {Number} documentId - ID del documento
   * @param {Number} toAreaId - ID del área destino
   * @param {Number} toUserId - ID del usuario destino (opcional)
   * @param {String} observacion - Observaciones de la derivación
   * @param {Object} user - Usuario que deriva
   * @returns {Object} Documento actualizado
   */
  async deriveDocument(documentId, toAreaId, toUserId, observacion, user) {
    const transaction = await sequelize.transaction();
    
    try {
      const document = await Document.findByPk(documentId, { transaction });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar que el documento esté en el área del usuario
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('El documento no está en tu área');
      }

      // Verificar que no se derive a la misma área
      if (parseInt(toAreaId) === document.currentAreaId) {
        throw new Error('No puedes derivar un documento a la misma área');
      }

      const fromAreaId = document.currentAreaId;

      // Cambiar estado a "En proceso"
      const statusEnProceso = await DocumentStatus.findOne({ 
        where: { nombre: 'En proceso' },
        transaction
      });

      if (!statusEnProceso) {
        throw new Error('Estado "En proceso" no encontrado en la base de datos');
      }

      // Actualizar documento
      await document.update({
        currentAreaId: toAreaId,
        currentUserId: toUserId || null,
        statusId: statusEnProceso.id
      }, { transaction });

      // Crear movimiento de derivación
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId,
        toAreaId,
        userId: user.id,
        accion: 'Derivación',
        observacion: observacion || 'Documento derivado'
      }, { transaction });

      await transaction.commit();

      // Obtener documento actualizado
      const updatedDocument = await Document.findByPk(documentId, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' },
          { model: User, as: 'currentUser', attributes: ['id', 'nombre', 'email'] }
        ]
      });

      // 🔥 EVENTO EN TIEMPO REAL: Documento derivado
      await realtimeEvents.emitDocumentDerived(
        updatedDocument, 
        fromAreaId, 
        toAreaId, 
        toUserId
      );

      return updatedDocument;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Finalizar/Atender documento
   * @param {Number} documentId - ID del documento
   * @param {String} observacion - Observaciones finales
   * @param {Object} user - Usuario que finaliza
   * @returns {Object} Documento finalizado
   */
  async finalizeDocument(documentId, observacion, user) {
    const transaction = await sequelize.transaction();
    
    try {
      const document = await Document.findByPk(documentId, { transaction });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar permisos
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('El documento no está en tu área');
      }

      // Cambiar estado a "Atendido" (Finalizado)
      const statusAtendido = await DocumentStatus.findOne({ 
        where: { nombre: 'Atendido' },
        transaction
      });

      if (!statusAtendido) {
        throw new Error('Estado "Atendido" no encontrado en la base de datos');
      }

      // Actualizar documento
      await document.update({
        statusId: statusAtendido.id
      }, { transaction });

      // Crear movimiento de finalización
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Finalización',
        observacion: observacion || 'Documento atendido y finalizado'
      }, { transaction });

      await transaction.commit();

      // Obtener documento actualizado
      const finalizedDocument = await Document.findByPk(documentId, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' },
          { model: User, as: 'currentUser', attributes: ['id', 'nombre'] }
        ]
      });

      // 🔥 EVENTO EN TIEMPO REAL: Documento finalizado
      await realtimeEvents.emitDocumentFinalized(finalizedDocument);

      return finalizedDocument;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Archivar documento
   * @param {Number} documentId - ID del documento
   * @param {Object} user - Usuario que archiva
   * @param {String} observacion - Observación opcional
   * @returns {Object} Resultado de la operación
   */
  async archiveDocument(documentId, user, observacion = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const document = await Document.findByPk(documentId, { transaction });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar que el documento esté en el área del usuario
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('Solo puedes archivar documentos que están en tu área');
      }

      // Verificar que no esté ya archivado
      const statusArchivado = await DocumentStatus.findOne({ 
        where: { nombre: 'Archivado' },
        transaction
      });

      if (!statusArchivado) {
        throw new Error('Estado "Archivado" no encontrado en la base de datos');
      }

      if (document.statusId === statusArchivado.id) {
        throw new Error('El documento ya está archivado');
      }

      // Cambiar estado a "Archivado"
      await document.update({ statusId: statusArchivado.id }, { transaction });

      // Crear movimiento de archivado
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Archivado',
        observacion: observacion || `Documento archivado en ${user.area?.nombre || 'el área'}`
      }, { transaction });

      await transaction.commit();

      // Obtener documento archivado completo
      const archivedDocument = await Document.findByPk(documentId, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' }
        ]
      });

      // 🔥 EVENTO EN TIEMPO REAL: Documento archivado
      await realtimeEvents.emitDocumentArchived(archivedDocument);

      return { success: true, message: 'Documento archivado exitosamente' };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Actualizar categoría de un documento
   * @param {number} documentId - ID del documento
   * @param {number} categoryId - ID de la categoría
   * @param {Object} user - Usuario que realiza la acción
   * @returns {Object} Resultado de la operación
   */
  async updateDocumentCategory(documentId, categoryId, user) {
    const transaction = await sequelize.transaction();
    
    try {
      // Buscar documento
      const document = await Document.findByPk(documentId, { 
        include: [{ model: Area, as: 'currentArea' }],
        transaction 
      });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar permisos: el documento debe estar en el área del usuario
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('No tienes permisos para actualizar este documento');
      }

      // Verificar que la categoría existe y pertenece al área del documento
      const category = await AreaDocumentCategory.findOne({
        where: { 
          id: categoryId,
          areaId: document.currentAreaId,
          isActive: true
        },
        transaction
      });

      if (!category) {
        throw new Error('Categoría no encontrada o no pertenece a esta área');
      }

      // Actualizar categoría del documento
      const previousCategoryId = document.categoriaId;
      await document.update({ categoriaId: categoryId }, { transaction });

      // Crear movimiento registrando el cambio de categoría
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Actualización de Categoría',
        observacion: previousCategoryId 
          ? `Categoría cambiada a: ${category.nombre}` 
          : `Categoría asignada: ${category.nombre}`
      }, { transaction });

      await transaction.commit();

      // Retornar documento actualizado con la categoría
      const updatedDocument = await Document.findByPk(documentId, {
        include: [
          { model: AreaDocumentCategory, as: 'categoria' }
        ]
      });

      return { 
        success: true, 
        message: 'Categoría actualizada exitosamente',
        data: updatedDocument
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Actualizar tipo de documento
   * @param {Number} documentId - ID del documento
   * @param {Number} docTypeId - ID del tipo de documento
   * @param {Object} user - Usuario que actualiza
   * @returns {Object} Resultado de la operación
   */
  async updateDocumentType(documentId, docTypeId, user) {
    const transaction = await sequelize.transaction();
    
    try {
      // Buscar documento
      const document = await Document.findByPk(documentId, { 
        include: [{ model: Area, as: 'currentArea' }],
        transaction 
      });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar permisos: el documento debe estar en el área del usuario o ser administrador
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('No tienes permisos para actualizar este documento');
      }

      // Verificar que el tipo de documento existe y está activo
      const docType = await DocumentType.findOne({
        where: { 
          id: docTypeId,
          isActive: true
        },
        transaction
      });

      if (!docType) {
        throw new Error('Tipo de documento no encontrado o inactivo');
      }

      // Actualizar tipo de documento
      const previousDocTypeId = document.docTypeId;
      await document.update({ docTypeId: docTypeId }, { transaction });

      // Crear movimiento registrando el cambio de tipo
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Actualización de Tipo',
        observacion: previousDocTypeId 
          ? `Tipo cambiado a: ${docType.nombre}` 
          : `Tipo asignado: ${docType.nombre}`
      }, { transaction });

      await transaction.commit();

      // Retornar documento actualizado con el tipo
      const updatedDocument = await Document.findByPk(documentId, {
        include: [
          { model: DocumentType, as: 'documentType' }
        ]
      });

      return { 
        success: true, 
        message: 'Tipo de documento actualizado exitosamente',
        data: updatedDocument
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Desarchivar documento (reactivar)
   * @param {Number} documentId - ID del documento
   * @param {Object} user - Usuario que desarchiva
   * @param {String} observacion - Observación opcional
   * @returns {Object} Resultado de la operación
   */
  async unarchiveDocument(documentId, user, observacion = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const document = await Document.findByPk(documentId, { transaction });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar que el documento esté en el área del usuario
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('Solo puedes desarchivar documentos de tu área');
      }

      // Verificar que esté archivado
      const statusArchivado = await DocumentStatus.findOne({ 
        where: { nombre: 'Archivado' },
        transaction
      });

      if (document.statusId !== statusArchivado.id) {
        throw new Error('El documento no está archivado');
      }

      // Cambiar estado a "En proceso"
      const statusEnProceso = await DocumentStatus.findOne({ 
        where: { nombre: 'En proceso' },
        transaction
      });

      if (!statusEnProceso) {
        throw new Error('Estado "En proceso" no encontrado en la base de datos');
      }

      await document.update({ statusId: statusEnProceso.id }, { transaction });

      // Crear movimiento de desarchivado
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Desarchivado',
        observacion: observacion || 'Documento reactivado desde archivo'
      }, { transaction });

      await transaction.commit();

      return { success: true, message: 'Documento desarchivado exitosamente' };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cambiar estado de un documento manualmente
   * @param {Number} documentId - ID del documento
   * @param {Number} newStatusId - ID del nuevo estado
   * @param {Object} user - Usuario que realiza el cambio
   * @param {String} observacion - Observación del cambio (opcional)
   * @returns {Object} Resultado del cambio de estado
   */
  async changeDocumentStatus(documentId, newStatusId, user, observacion = null) {
    const transaction = await sequelize.transaction();

    try {
      // Buscar documento
      const document = await Document.findByPk(documentId, {
        include: [
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' }
        ],
        transaction
      });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar permisos: solo el área asignada o administradores
      if (document.currentAreaId !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('No tienes permisos para cambiar el estado de este documento');
      }

      // Buscar nuevo estado
      const newStatus = await DocumentStatus.findByPk(newStatusId, { transaction });

      if (!newStatus) {
        throw new Error('Estado no encontrado');
      }

      // Validar que no se cambie a estados que requieren acciones específicas
      const restrictedStatuses = ['Archivado', 'Atendido'];
      if (restrictedStatuses.includes(newStatus.nombre)) {
        throw new Error(`No puedes cambiar manualmente a estado "${newStatus.nombre}". Usa la acción correspondiente.`);
      }

      // Si es el mismo estado, no hacer nada
      if (document.statusId === newStatusId) {
        throw new Error('El documento ya tiene ese estado');
      }

      const oldStatus = document.status;

      // Actualizar estado del documento
      await document.update({ statusId: newStatusId }, { transaction });

      // Crear movimiento de cambio de estado
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Cambio de Estado',
        observacion: observacion || `Estado cambiado de "${oldStatus.nombre}" a "${newStatus.nombre}"`
      }, { transaction });

      await transaction.commit();

      return { 
        success: true, 
        message: `Estado cambiado exitosamente a "${newStatus.nombre}"`,
        previousStatus: oldStatus.nombre,
        newStatus: newStatus.nombre
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Actualizar documento
   * @param {Number} documentId - ID del documento
   * @param {Object} data - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Object} Documento actualizado
   */
  async updateDocument(documentId, data, user) {
    try {
      const document = await Document.findByPk(documentId);

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Verificar permisos
      if (user.areaId !== document.currentAreaId && user.role?.nombre !== 'Administrador') {
        throw new Error('No tienes permisos para editar este documento');
      }

      const {
        asunto,
        descripcion,
        fechaDocumento,
        numeroDocumento,
        folios,
        categoriaId
      } = data;

      await document.update({
        asunto: asunto || document.asunto,
        descripcion: descripcion !== undefined ? descripcion : document.descripcion,
        fechaDocumento: fechaDocumento || document.fechaDocumento,
        numeroDocumento: numeroDocumento || document.numeroDocumento,
        folios: folios || document.folios,
        categoriaId: categoriaId !== undefined ? categoriaId : document.categoriaId
      });

      const updatedDocument = await Document.findByPk(documentId, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' },
          { model: AreaDocumentCategory, as: 'categoria', required: false }
        ]
      });

      return updatedDocument;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documentos con filtros avanzados
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Array} Lista de documentos
   */
  async getDocuments(filters = {}) {
    try {
      const { 
        status, 
        area, 
        search, 
        archived, 
        dateFrom, 
        dateTo, 
        sender, 
        type,
        limit,
        offset 
      } = filters;
      
      const where = {};
      
      // Filtros básicos
      if (status) where.statusId = status;
      if (area) where.currentAreaId = area;
      if (type) where.documentTypeId = type;
      
      // Filtro de archivados
      if (archived === 'true') {
        where.statusId = 6; // Estado "Archivado"
      } else if (archived === 'false') {
        where.statusId = { [Op.ne]: 6 };
      }
      
      // Filtro por rango de fechas
      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
        if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
      }
      
      // Búsqueda avanzada
      if (search) {
        where[Op.or] = [
          { trackingCode: { [Op.like]: `%${search}%` } },
          { asunto: { [Op.like]: `%${search}%` } },
          { descripcion: { [Op.like]: `%${search}%` } }
        ];
      }

      // Include con filtro de sender si se proporciona
      const include = [
        { 
          model: Sender, 
          as: 'sender',
          where: sender ? { nombreCompleto: { [Op.like]: `%${sender}%` } } : undefined,
          required: sender ? true : false
        },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre'], required: false }
      ];

      const documents = await Document.findAll({
        where,
        include,
        order: [['created_at', 'DESC']],
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      });

      return documents;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documento por ID con todas sus relaciones
   * @param {Number} documentId - ID del documento
   * @returns {Object} Documento completo
   */
  async getDocumentById(documentId) {
    try {
      const document = await Document.findByPk(documentId, {
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
        throw new Error('Documento no encontrado');
      }

      return document;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documento por código de seguimiento (público)
   * @param {String} trackingCode - Código de seguimiento
   * @returns {Object} Documento con información limitada
   */
  async getDocumentByTrackingCode(trackingCode) {
    try {
      const { DocumentVersion } = require('../models');
      
      const document = await Document.findOne({
        where: { trackingCode },
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
        attributes: ['id', 'trackingCode', 'asunto', 'created_at']
      });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Obtener la última versión si existe
      const latestVersion = await DocumentVersion.findOne({
        where: { documentId: document.id },
        attributes: ['versionNumber', 'tieneSello', 'tieneFirma', 'uploadedAt'],
        order: [['versionNumber', 'DESC']]
      });

      // Agregar versión al documento
      const documentData = document.toJSON();
      documentData.latestVersion = latestVersion ? latestVersion.toJSON() : null;

      return documentData;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documentos por área con filtros avanzados
   * @param {Number} areaId - ID del área
   * @param {Object} user - Usuario que consulta
   * @param {Object} filters - Filtros opcionales (status, priority, search, dateFrom, dateTo, documentType)
   * @returns {Array} Lista de documentos del área
   */
  async getDocumentsByArea(areaId, user, filters = {}) {
    try {
      // Verificar permisos
      if (parseInt(areaId) !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('No tienes permisos para ver documentos de esta área');
      }

      // Construir cláusula WHERE
      const whereClause = { currentAreaId: areaId };

      // Filtro por estado
      if (filters.status) {
        whereClause.statusId = filters.status;
      }

      // Filtro por tipo de documento
      if (filters.documentType) {
        whereClause.docTypeId = filters.documentType;
      }

      // Filtro por categoría personalizada
      if (filters.category) {
        whereClause.categoriaId = filters.category;
      }

      // Filtro por rango de fechas
      if (filters.dateFrom || filters.dateTo) {
        whereClause.created_at = {};
        if (filters.dateFrom) {
          whereClause.created_at[Op.gte] = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          const endDate = new Date(filters.dateTo);
          endDate.setHours(23, 59, 59, 999);
          whereClause.created_at[Op.lte] = endDate;
        }
      }

      // Filtro por búsqueda de texto (trackingCode, asunto)
      if (filters.search) {
        whereClause[Op.or] = [
          { trackingCode: { [Op.like]: `%${filters.search}%` } },
          { asunto: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const documents = await Document.findAll({
        where: whereClause,
        include: [
          { model: Sender, as: 'sender', attributes: ['id', 'nombreCompleto'] },
          { model: DocumentType, as: 'documentType', attributes: ['id', 'nombre'] },
          { model: DocumentStatus, as: 'status', attributes: ['id', 'nombre', 'color'] },
          { model: Area, as: 'currentArea', attributes: ['id', 'nombre', 'sigla'] },
          { model: User, as: 'currentUser', attributes: ['id', 'nombre'] },
          { 
            model: AreaDocumentCategory, 
            as: 'categoria', 
            attributes: ['id', 'nombre', 'codigo', 'color'],
            required: false // LEFT JOIN para incluir documentos sin categoría
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return documents;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de documentos
   * @param {Number} areaId - ID del área (opcional)
   * @returns {Object} Estadísticas
   */
  async getDocumentStats(areaId = null) {
    try {
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
        group: ['statusId', 'status.id'],
        raw: false
      });

      return {
        total,
        byStatus
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documentos archivados por área con filtros avanzados
   * @param {Number} areaId - ID del área
   * @param {Object} filters - Filtros adicionales (dateFrom, dateTo, search, priority, documentType)
   * @returns {Array} Lista de documentos archivados
   */
  async getArchivedDocumentsByArea(areaId, filters = {}) {
    try {
      const { dateFrom, dateTo, search, priority, documentType } = filters;
      
      // Obtener ID del estado "Archivado"
      const statusArchivado = await DocumentStatus.findOne({ 
        where: { nombre: 'Archivado' }
      });

      if (!statusArchivado) {
        throw new Error('Estado "Archivado" no encontrado en la base de datos');
      }
      
      const where = {
        currentAreaId: areaId,
        statusId: statusArchivado.id
      };
      
      // Filtro por tipo de documento
      if (documentType) {
        where.docTypeId = documentType;
      }
      
      // Filtro por rango de fechas
      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) {
          where.created_at[Op.gte] = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.created_at[Op.lte] = endDate;
        }
      }
      
      // Filtro por búsqueda de texto
      if (search) {
        where[Op.or] = [
          { trackingCode: { [Op.like]: `%${search}%` } },
          { asunto: { [Op.like]: `%${search}%` } }
        ];
      }

      const documents = await Document.findAll({
        where,
        include: [
          { model: Sender, as: 'sender', attributes: ['id', 'nombreCompleto'] },
          { model: DocumentType, as: 'documentType', attributes: ['id', 'nombre'] },
          { model: DocumentStatus, as: 'status', attributes: ['id', 'nombre', 'color'] },
          { model: Area, as: 'currentArea', attributes: ['id', 'nombre', 'sigla'] },
          { model: User, as: 'currentUser', attributes: ['id', 'nombre'], required: false }
        ],
        order: [['updated_at', 'DESC']]
      });

      return documents;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Búsqueda avanzada de documentos
   * @param {Object} criteria - Criterios de búsqueda
   * @returns {Object} Documentos con paginación
   */
  async advancedSearch(criteria) {
    try {
      const {
        trackingCode, asunto, remitente, area, status, priority, type,
        dateFrom, dateTo, page = 1, pageSize = 20
      } = criteria;

      // Convertir a números para evitar problemas con SQL
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;

      const where = {};
      const senderWhere = {};

      if (trackingCode) where.trackingCode = { [Op.like]: `%${trackingCode}%` };
      if (asunto) where.asunto = { [Op.like]: `%${asunto}%` };
      if (area) where.currentAreaId = area;
      if (status) where.statusId = status;
      if (type) where.documentTypeId = type;
      if (remitente) senderWhere.nombreCompleto = { [Op.like]: `%${remitente}%` };
      
      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
        if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
      }

      const offset = (pageNum - 1) * pageSizeNum;

      const { count, rows } = await Document.findAndCountAll({
        where,
        include: [
          { 
            model: Sender, as: 'sender',
            where: Object.keys(senderWhere).length > 0 ? senderWhere : undefined,
            required: Object.keys(senderWhere).length > 0
          },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' },
          { model: User, as: 'currentUser', attributes: ['id', 'nombre'], required: false }
        ],
        order: [['created_at', 'DESC']],
        limit: pageSizeNum,
        offset
      });

      return {
        documents: rows,
        pagination: {
          total: count,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(count / pageSizeNum)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener historial completo de un documento
   * @param {Number} documentId - ID del documento
   * @returns {Object} Historial con timeline
   */
  async getDocumentHistory(documentId) {
    try {
      const document = await Document.findByPk(documentId, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea', attributes: ['id', 'nombre', 'sigla'] },
          { 
            model: Attachment, 
            as: 'attachments',
            attributes: ['id', 'fileName', 'originalName', 'fileType', 'fileSize', 'uploadedAt'],
            include: [
              { model: User, as: 'uploader', attributes: ['id', 'nombre'] }
            ]
          }
        ]
      });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      const movements = await DocumentMovement.findAll({
        where: { documentId },
        include: [
          { model: Area, as: 'fromArea', attributes: ['id', 'nombre', 'sigla'] },
          { model: Area, as: 'toArea', attributes: ['id', 'nombre', 'sigla'] },
          { model: User, as: 'user', attributes: ['id', 'nombre', 'email'] }
        ],
        order: [['timestamp', 'ASC']]
      });

      const timeline = movements.map((mov, index) => {
        const nextMov = movements[index + 1];
        const permanencia = nextMov 
          ? Math.floor((new Date(nextMov.timestamp) - new Date(mov.timestamp)) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: mov.id,
          accion: mov.accion,
          fromArea: mov.fromArea,
          toArea: mov.toArea,
          user: mov.user,
          observacion: mov.observacion,
          timestamp: mov.timestamp,
          diasPermanencia: permanencia
        };
      });

      const totalDias = movements.length > 0 
        ? Math.floor((new Date() - new Date(document.created_at)) / (1000 * 60 * 60 * 24))
        : 0;

      const areasVisitadas = [...new Set(movements.map(m => m.toAreaId))].length;

      return {
        document: {
          id: document.id,
          trackingCode: document.trackingCode,
          asunto: document.asunto,
          descripcion: document.descripcion,
          status: document.status,
          documentType: document.documentType,
          sender: document.sender,
          currentArea: document.currentArea,
          createdAt: document.created_at,
          attachments: document.attachments || []
        },
        timeline,
        estadisticas: {
          totalMovimientos: movements.length,
          totalDias,
          areasVisitadas,
          estadoActual: document.status.nombre,
          totalAdjuntos: document.attachments?.length || 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documentos agrupados por estado
   * @param {Number} areaId - ID del área (opcional)
   * @returns {Object} Documentos por estado
   */
  async getDocumentsByStatus(areaId = null) {
    try {
      const where = areaId ? { currentAreaId: areaId } : {};

      const documents = await Document.findAll({
        where,
        attributes: [
          'statusId',
          [sequelize.fn('COUNT', sequelize.col('Document.id')), 'count']
        ],
        include: [
          { 
            model: DocumentStatus, 
            as: 'status',
            attributes: ['id', 'nombre', 'codigo', 'color']
          }
        ],
        group: ['statusId', 'status.id'],
        raw: false
      });

      return documents;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener archivo adjunto por ID
   * @param {Number} documentId - ID del documento
   * @param {Number} attachmentId - ID del adjunto
   * @returns {Object} Attachment
   */
  async getAttachmentById(documentId, attachmentId) {
    try {
      const attachment = await Attachment.findOne({
        where: {
          id: attachmentId,
          documentId: documentId
        }
      });

      if (!attachment) {
        throw new Error('Archivo adjunto no encontrado');
      }

      return attachment;

    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DocumentService();
