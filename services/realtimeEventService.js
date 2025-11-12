/**
 * ============================================================
 * SERVICIO DE EVENTOS EN TIEMPO REAL
 * ============================================================
 * 
 * Emite eventos via WebSocket cuando ocurren acciones importantes
 * en el sistema, permitiendo actualización automática del frontend
 * SIN necesidad de polling o refresh.
 * 
 * Eventos soportados:
 * - document:created    - Nuevo documento creado
 * - document:derived    - Documento derivado a área
 * - document:updated    - Documento actualizado
 * - document:assigned   - Documento asignado a usuario
 * - document:finalized  - Documento finalizado/atendido
 * - document:archived   - Documento archivado
 * 
 * Uso en controllers:
 * const realtimeEvents = require('./services/realtimeEventService');
 * await realtimeEvents.emitDocumentCreated(document, targetUserIds);
 * 
 * @author Sistema SGD
 * @version 1.0
 * @date 2025-11-12
 */

const { User, Area, Role, DocumentType, DocumentStatus, Sender } = require('../models');

class RealtimeEventService {
  /**
   * Emitir evento cuando se crea un documento nuevo
   * 
   * @param {Object} document - Documento creado
   * @param {Array<number>} targetUserIds - IDs de usuarios que deben ser notificados
   */
  async emitDocumentCreated(document, targetUserIds = []) {
    if (!global.io) {
      console.warn('⚠️ WebSocket no disponible - Evento no emitido');
      return;
    }

    try {
      // Obtener datos completos del documento
      const documentData = await this.getDocumentFullData(document);

      const eventData = {
        event: 'document:created',
        timestamp: new Date().toISOString(),
        document: documentData,
        message: `Nuevo documento: ${document.tracking_code}`
      };

      // Si hay usuarios específicos, emitir solo a ellos
      if (targetUserIds.length > 0) {
        targetUserIds.forEach(userId => {
          global.io.to(`user:${userId}`).emit('document:created', eventData);
        });
        console.log(`📤 Evento 'document:created' enviado a ${targetUserIds.length} usuarios`);
      } else {
        // Si no hay usuarios específicos, emitir a todos los conectados
        global.io.emit('document:created', eventData);
        console.log(`📤 Evento 'document:created' enviado a todos`);
      }
    } catch (error) {
      console.error('❌ Error emitiendo evento document:created:', error);
    }
  }

  /**
   * Emitir evento cuando se deriva un documento
   * 
   * @param {Object} document - Documento derivado
   * @param {number} fromAreaId - ID área origen
   * @param {number} toAreaId - ID área destino
   * @param {number|null} assignedUserId - ID usuario asignado (opcional)
   */
  async emitDocumentDerived(document, fromAreaId, toAreaId, assignedUserId = null) {
    if (!global.io) return;

    try {
      const documentData = await this.getDocumentFullData(document);
      
      // Obtener usuarios del área destino
      const targetUsers = await this.getUsersByArea(toAreaId);

      const eventData = {
        event: 'document:derived',
        timestamp: new Date().toISOString(),
        document: documentData,
        fromAreaId,
        toAreaId,
        assignedUserId,
        message: `Documento derivado a tu área: ${document.tracking_code}`
      };

      // Emitir a todos los usuarios del área destino
      targetUsers.forEach(userId => {
        global.io.to(`user:${userId}`).emit('document:derived', eventData);
      });

      // Si hay un usuario específicamente asignado, enviar evento adicional
      if (assignedUserId) {
        global.io.to(`user:${assignedUserId}`).emit('document:assigned', {
          ...eventData,
          event: 'document:assigned',
          message: `Se te ha asignado el documento: ${document.tracking_code}`
        });
      }

      console.log(`📤 Evento 'document:derived' enviado a ${targetUsers.length} usuarios del área ${toAreaId}`);
    } catch (error) {
      console.error('❌ Error emitiendo evento document:derived:', error);
    }
  }

  /**
   * Emitir evento cuando se actualiza un documento
   * 
   * @param {Object} document - Documento actualizado
   * @param {Array<string>} changedFields - Campos que cambiaron
   */
  async emitDocumentUpdated(document, changedFields = []) {
    if (!global.io) return;

    try {
      const documentData = await this.getDocumentFullData(document);

      // Obtener usuarios interesados (área actual + usuario asignado)
      const targetUserIds = await this.getInterestedUsers(document);

      const eventData = {
        event: 'document:updated',
        timestamp: new Date().toISOString(),
        document: documentData,
        changedFields,
        message: `Documento actualizado: ${document.tracking_code}`
      };

      targetUserIds.forEach(userId => {
        global.io.to(`user:${userId}`).emit('document:updated', eventData);
      });

      console.log(`📤 Evento 'document:updated' enviado a ${targetUserIds.length} usuarios`);
    } catch (error) {
      console.error('❌ Error emitiendo evento document:updated:', error);
    }
  }

  /**
   * Emitir evento cuando se asigna un documento a un usuario
   * 
   * @param {Object} document - Documento asignado
   * @param {number} userId - ID del usuario asignado
   */
  async emitDocumentAssigned(document, userId) {
    if (!global.io) return;

    try {
      const documentData = await this.getDocumentFullData(document);

      const eventData = {
        event: 'document:assigned',
        timestamp: new Date().toISOString(),
        document: documentData,
        message: `Se te ha asignado: ${document.tracking_code}`
      };

      global.io.to(`user:${userId}`).emit('document:assigned', eventData);
      console.log(`📤 Evento 'document:assigned' enviado a usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error emitiendo evento document:assigned:', error);
    }
  }

  /**
   * Emitir evento cuando se finaliza un documento
   * 
   * @param {Object} document - Documento finalizado
   */
  async emitDocumentFinalized(document) {
    if (!global.io) return;

    try {
      const documentData = await this.getDocumentFullData(document);

      // Obtener usuarios que deberían saber (creador, área actual, etc)
      const targetUserIds = await this.getInterestedUsers(document);

      const eventData = {
        event: 'document:finalized',
        timestamp: new Date().toISOString(),
        document: documentData,
        message: `Documento finalizado: ${document.tracking_code}`
      };

      targetUserIds.forEach(userId => {
        global.io.to(`user:${userId}`).emit('document:finalized', eventData);
      });

      console.log(`📤 Evento 'document:finalized' enviado a ${targetUserIds.length} usuarios`);
    } catch (error) {
      console.error('❌ Error emitiendo evento document:finalized:', error);
    }
  }

  /**
   * Emitir evento cuando se archiva un documento
   * 
   * @param {Object} document - Documento archivado
   */
  async emitDocumentArchived(document) {
    if (!global.io) return;

    try {
      const documentData = await this.getDocumentFullData(document);
      const targetUserIds = await this.getInterestedUsers(document);

      const eventData = {
        event: 'document:archived',
        timestamp: new Date().toISOString(),
        document: documentData,
        message: `Documento archivado: ${document.tracking_code}`
      };

      targetUserIds.forEach(userId => {
        global.io.to(`user:${userId}`).emit('document:archived', eventData);
      });

      console.log(`📤 Evento 'document:archived' enviado a ${targetUserIds.length} usuarios`);
    } catch (error) {
      console.error('❌ Error emitiendo evento document:archived:', error);
    }
  }

  /**
   * HELPERS - Obtener datos completos del documento
   */
  async getDocumentFullData(document) {
    // Si ya es un objeto plano, retornarlo
    if (!document.reload) {
      return document;
    }

    // Si es una instancia Sequelize, recargar con asociaciones
    await document.reload({
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', attributes: ['id', 'nombre', 'email'] }
      ]
    });

    return document.toJSON();
  }

  /**
   * Obtener IDs de usuarios de un área específica
   */
  async getUsersByArea(areaId) {
    try {
      const users = await User.findAll({
        where: { area_id: areaId, is_active: true },
        attributes: ['id']
      });
      return users.map(u => u.id);
    } catch (error) {
      console.error('Error obteniendo usuarios de área:', error);
      return [];
    }
  }

  /**
   * Obtener IDs de usuarios interesados en un documento
   * (usuarios del área actual + usuario asignado)
   */
  async getInterestedUsers(document) {
    try {
      const userIds = new Set();

      // Usuario asignado
      if (document.current_user_id) {
        userIds.add(document.current_user_id);
      }

      // Todos los usuarios del área actual
      if (document.current_area_id) {
        const areaUsers = await this.getUsersByArea(document.current_area_id);
        areaUsers.forEach(id => userIds.add(id));
      }

      return Array.from(userIds);
    } catch (error) {
      console.error('Error obteniendo usuarios interesados:', error);
      return [];
    }
  }

  /**
   * Obtener usuarios de un rol específico
   */
  async getUsersByRole(roleId) {
    try {
      const users = await User.findAll({
        where: { rol_id: roleId, is_active: true },
        attributes: ['id']
      });
      return users.map(u => u.id);
    } catch (error) {
      console.error('Error obteniendo usuarios por rol:', error);
      return [];
    }
  }

  /**
   * Emitir evento genérico a usuarios específicos
   */
  emitToUsers(userIds, eventName, data) {
    if (!global.io) return;

    userIds.forEach(userId => {
      global.io.to(`user:${userId}`).emit(eventName, data);
    });

    console.log(`📤 Evento '${eventName}' enviado a ${userIds.length} usuarios`);
  }

  /**
   * Emitir evento a todos los usuarios de un área
   */
  async emitToArea(areaId, eventName, data) {
    const userIds = await this.getUsersByArea(areaId);
    this.emitToUsers(userIds, eventName, data);
  }

  /**
   * Emitir evento a todos los usuarios conectados
   */
  emitToAll(eventName, data) {
    if (!global.io) return;
    global.io.emit(eventName, data);
    console.log(`📤 Evento '${eventName}' enviado a todos los usuarios`);
  }
}

// Exportar instancia única (Singleton)
module.exports = new RealtimeEventService();
