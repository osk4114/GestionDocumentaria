const { Document, Sender, DocumentType, DocumentStatus, Area, User, DocumentMovement, Attachment, Notification } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Servicio de Gestión de Documentos
 * Contiene toda la lógica de negocio para el módulo de documentos
 */
class DocumentService {
  
  /**
   * Presentar documento público (Mesa de Partes Virtual)
   * @param {Object} senderData - Datos del remitente
   * @param {Object} documentData - Datos del documento
   * @returns {Object} Documento creado con código de seguimiento
   */
  async submitPublicDocument(senderData, documentData) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Crear o buscar remitente
      let sender = await Sender.findOne({
        where: {
          tipoDocumento: senderData.tipoDocumento,
          numeroDocumento: senderData.numeroDocumento
        },
        transaction
      });

      if (!sender) {
        sender = await Sender.create(senderData, { transaction });
      } else {
        // Actualizar datos si han cambiado
        await sender.update(senderData, { transaction });
      }

      // 2. Generar código de seguimiento
      const trackingCode = await this.generateTrackingCode();

      // 3. Obtener estado "Recibido" y área "Mesa de Partes"
      const statusRecibido = await DocumentStatus.findOne({
        where: { nombre: 'Recibido' },
        transaction
      });

      if (!statusRecibido) {
        throw new Error('Estado "Recibido" no encontrado en el sistema');
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
        documentTypeId: documentData.documentTypeId,
        statusId: statusRecibido.id,
        currentAreaId: mesaDePartes.id,
        asunto: documentData.asunto,
        descripcion: documentData.descripcion || null,
        prioridad: documentData.prioridad || 'normal',
        fechaRecepcion: new Date()
      }, { transaction });

      // 5. Crear movimiento inicial
      await DocumentMovement.create({
        documentId: document.id,
        toAreaId: mesaDePartes.id,
        accion: 'Recepción',
        observacion: 'Documento presentado a través de la Mesa de Partes Virtual',
        timestamp: new Date()
      }, { transaction });

      await transaction.commit();

      // 6. Retornar documento con relaciones
      const createdDocument = await Document.findByPk(document.id, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' }
        ]
      });

      return {
        document: createdDocument,
        sender,
        trackingCode
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
        prioridad,
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
        prioridad: prioridad || 'normal',
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

      // Crear notificación para usuarios del área
      await this.createNotification({
        areaId: user.areaId,
        documentId: document.id,
        titulo: 'Nuevo documento recibido',
        mensaje: `Documento "${asunto}" ha sido ingresado al sistema`,
        tipo: 'nuevo_documento'
      }, transaction);

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
   * @param {String} prioridad - Nueva prioridad (opcional)
   * @returns {Object} Documento actualizado
   */
  async deriveDocument(documentId, toAreaId, toUserId, observacion, user, prioridad = null) {
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
        statusId: statusEnProceso.id,
        prioridad: prioridad || document.prioridad
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

      // Crear notificación para el área destino
      await this.createNotification({
        areaId: toAreaId,
        userId: toUserId,
        documentId: document.id,
        titulo: 'Documento derivado a tu área',
        mensaje: `El documento "${document.asunto}" ha sido derivado a tu área`,
        tipo: 'derivacion'
      }, transaction);

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

      // Cambiar estado a "Finalizado"
      const statusFinalizado = await DocumentStatus.findOne({ 
        where: { nombre: 'Finalizado' },
        transaction
      });

      if (!statusFinalizado) {
        throw new Error('Estado "Finalizado" no encontrado en la base de datos');
      }

      // Actualizar documento
      await document.update({
        statusId: statusFinalizado.id
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

      // Crear notificación
      await this.createNotification({
        areaId: document.currentAreaId,
        documentId: document.id,
        titulo: 'Documento finalizado',
        mensaje: `El documento "${document.asunto}" ha sido finalizado`,
        tipo: 'finalizacion'
      }, transaction);

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

      return finalizedDocument;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Archivar documento
   * @param {Number} documentId - ID del documento
   * @param {Object} user - Usuario administrador
   * @returns {Object} Resultado de la operación
   */
  async archiveDocument(documentId, user) {
    const transaction = await sequelize.transaction();
    
    try {
      const document = await Document.findByPk(documentId, { transaction });

      if (!document) {
        throw new Error('Documento no encontrado');
      }

      // Solo admin puede archivar
      if (user.role?.nombre !== 'Administrador') {
        throw new Error('Solo administradores pueden archivar documentos');
      }

      // Cambiar estado a "Archivado"
      const statusArchivado = await DocumentStatus.findOne({ 
        where: { nombre: 'Archivado' },
        transaction
      });

      if (!statusArchivado) {
        throw new Error('Estado "Archivado" no encontrado en la base de datos');
      }

      await document.update({ statusId: statusArchivado.id }, { transaction });

      // Crear movimiento de archivado
      await DocumentMovement.create({
        documentId: document.id,
        fromAreaId: document.currentAreaId,
        toAreaId: document.currentAreaId,
        userId: user.id,
        accion: 'Archivado',
        observacion: 'Documento archivado por administrador'
      }, { transaction });

      await transaction.commit();

      return { success: true, message: 'Documento archivado exitosamente' };

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
        prioridad,
        fechaDocumento,
        numeroDocumento,
        folios
      } = data;

      await document.update({
        asunto: asunto || document.asunto,
        descripcion: descripcion !== undefined ? descripcion : document.descripcion,
        prioridad: prioridad || document.prioridad,
        fechaDocumento: fechaDocumento || document.fechaDocumento,
        numeroDocumento: numeroDocumento || document.numeroDocumento,
        folios: folios || document.folios
      });

      const updatedDocument = await Document.findByPk(documentId, {
        include: [
          { model: Sender, as: 'sender' },
          { model: DocumentType, as: 'documentType' },
          { model: DocumentStatus, as: 'status' },
          { model: Area, as: 'currentArea' }
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
        priority, 
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
      if (priority) where.prioridad = priority;
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
        attributes: ['id', 'trackingCode', 'asunto', 'prioridad', 'created_at']
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
   * Obtener documentos por área
   * @param {Number} areaId - ID del área
   * @param {Object} user - Usuario que consulta
   * @returns {Array} Lista de documentos del área
   */
  async getDocumentsByArea(areaId, user) {
    try {
      // Verificar permisos
      if (parseInt(areaId) !== user.areaId && user.role?.nombre !== 'Administrador') {
        throw new Error('No tienes permisos para ver documentos de esta área');
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

      const byPriority = await Document.findAll({
        where,
        attributes: [
          'prioridad',
          [Document.sequelize.fn('COUNT', Document.sequelize.col('Document.id')), 'count']
        ],
        group: ['prioridad'],
        raw: true
      });

      return {
        total,
        byStatus,
        byPriority
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener documentos archivados por área
   * @param {Number} areaId - ID del área
   * @param {Object} filters - Filtros adicionales
   * @returns {Array} Lista de documentos archivados
   */
  async getArchivedDocumentsByArea(areaId, filters = {}) {
    try {
      const { dateFrom, dateTo, search } = filters;
      
      const where = {
        currentAreaId: areaId,
        statusId: 6 // Estado "Archivado"
      };
      
      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
        if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
      }
      
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
          { model: DocumentStatus, as: 'status' },
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

      const where = {};
      const senderWhere = {};

      if (trackingCode) where.trackingCode = { [Op.like]: `%${trackingCode}%` };
      if (asunto) where.asunto = { [Op.like]: `%${asunto}%` };
      if (area) where.currentAreaId = area;
      if (status) where.statusId = status;
      if (priority) where.prioridad = priority;
      if (type) where.documentTypeId = type;
      if (remitente) senderWhere.nombreCompleto = { [Op.like]: `%${remitente}%` };
      
      if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
        if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
      }

      const offset = (page - 1) * pageSize;

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
        limit: pageSize,
        offset
      });

      return {
        documents: rows,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
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
          { model: DocumentStatus, as: 'status' }
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
          prioridad: document.prioridad,
          status: document.status,
          documentType: document.documentType,
          sender: document.sender,
          createdAt: document.created_at
        },
        timeline,
        estadisticas: {
          totalMovimientos: movements.length,
          totalDias,
          areasVisitadas,
          estadoActual: document.status.nombre
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
   * Crear notificación para usuarios
   * @param {Object} data - Datos de la notificación
   * @param {Object} transaction - Transacción de Sequelize
   */
  async createNotification(data, transaction) {
    try {
      const { areaId, userId, documentId, titulo, mensaje, tipo } = data;

      // Si se especifica un usuario, crear notificación solo para él
      if (userId) {
        await Notification.create({
          userId,
          documentId,
          titulo,
          mensaje,
          tipo,
          leido: false
        }, { transaction });
        
        // Emitir notificación por WebSocket
        if (global.io) {
          global.io.to(`user:${userId}`).emit('notification', {
            titulo,
            mensaje,
            tipo,
            documentId
          });
        }
      } 
      // Si se especifica un área, crear notificación para todos los usuarios del área
      else if (areaId) {
        const users = await User.findAll({
          where: { areaId },
          attributes: ['id'],
          transaction
        });

        for (const user of users) {
          await Notification.create({
            userId: user.id,
            documentId,
            titulo,
            mensaje,
            tipo,
            leido: false
          }, { transaction });

          // Emitir notificación por WebSocket
          if (global.io) {
            global.io.to(`user:${user.id}`).emit('notification', {
              titulo,
              mensaje,
              tipo,
              documentId
            });
          }
        }
      }

    } catch (error) {
      console.error('Error al crear notificación:', error);
      // No lanzar error para no afectar la transacción principal
    }
  }
}

module.exports = new DocumentService();
