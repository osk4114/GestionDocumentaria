const { DocumentCargo, DocumentVersion, Document, Area, User, Sender, DocumentType } = require('../models');

class CargoService {
  /**
   * Crear un nuevo cargo (conservar versión)
   * @param {Number} versionId - ID de la versión a conservar
   * @param {String} customName - Nombre personalizado (opcional)
   * @param {Object} user - Usuario que crea el cargo
   * @returns {Object} Cargo creado
   */
  async createCargo(versionId, customName, user) {
    try {
      // Verificar que la versión existe
      const version = await DocumentVersion.findByPk(versionId, {
        include: [{
          model: Document,
          as: 'document',
          attributes: ['id', 'trackingCode', 'asunto', 'currentAreaId']
        }]
      });

      if (!version) {
        throw new Error('Versión no encontrada');
      }

      // Verificar que el usuario tiene acceso al documento
      // (el documento debe estar en su área o el usuario debe tener permisos globales)
      const userPermissions = user.permissions || [];
      const hasGlobalAccess = userPermissions.some(p => 
        p.codigo === 'documents.view.all'
      );

      if (!hasGlobalAccess && version.document.currentAreaId !== user.areaId) {
        throw new Error('No tienes acceso a este documento');
      }

      // Verificar que no exista ya un cargo de esta versión para esta área
      const existingCargo = await DocumentCargo.findOne({
        where: {
          areaId: user.areaId,
          versionId: versionId
        }
      });

      if (existingCargo) {
        throw new Error('Ya existe un cargo de esta versión en tu área');
      }

      // Crear el cargo
      const cargo = await DocumentCargo.create({
        areaId: user.areaId,
        versionId: versionId,
        customName: customName || null,
        createdBy: user.id
      });

      // Retornar cargo con datos completos
      return await this.getCargoById(cargo.id, user);

    } catch (error) {
      console.error('Error en createCargo:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los cargos del área del usuario
   * @param {Object} user - Usuario que solicita los cargos
   * @returns {Array} Lista de cargos
   */
  async getCargosByArea(user) {
    try {
      const cargos = await DocumentCargo.findAll({
        where: {
          areaId: user.areaId
        },
        include: [
          {
            model: DocumentVersion,
            as: 'version',
            attributes: ['id', 'documentId', 'versionNumber', 'fileName', 'originalName', 'filePath', 'fileType', 'fileSize', 'descripcion', 'tieneSello', 'tieneFirma', 'uploadedAt'],
            include: [{
              model: Document,
              as: 'document',
              attributes: ['id', 'trackingCode', 'asunto'],
              include: [
                {
                  model: Sender,
                  as: 'sender',
                  attributes: ['id', 'nombreCompleto', 'email']
                },
                {
                  model: DocumentType,
                  as: 'documentType',
                  attributes: ['id', 'nombre']
                }
              ]
            }]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nombre', 'email']
          },
          {
            model: Area,
            as: 'area',
            attributes: ['id', 'nombre', 'sigla']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return cargos;

    } catch (error) {
      console.error('Error en getCargosByArea:', error);
      throw error;
    }
  }

  /**
   * Obtener un cargo por ID
   * @param {Number} cargoId - ID del cargo
   * @param {Object} user - Usuario que solicita
   * @returns {Object} Cargo
   */
  async getCargoById(cargoId, user) {
    try {
      const cargo = await DocumentCargo.findByPk(cargoId, {
        include: [
          {
            model: DocumentVersion,
            as: 'version',
            include: [{
              model: Document,
              as: 'document',
              include: [
                { model: Sender, as: 'sender' },
                { model: DocumentType, as: 'documentType' }
              ]
            }]
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'nombre', 'email']
          },
          {
            model: Area,
            as: 'area',
            attributes: ['id', 'nombre', 'sigla']
          }
        ]
      });

      if (!cargo) {
        throw new Error('Cargo no encontrado');
      }

      // Verificar que el cargo pertenece al área del usuario
      if (cargo.areaId !== user.areaId) {
        const hasGlobalAccess = (user.permissions || []).some(p => 
          p.codigo === 'documents.view.all'
        );
        
        if (!hasGlobalAccess) {
          throw new Error('No tienes acceso a este cargo');
        }
      }

      return cargo;

    } catch (error) {
      console.error('Error en getCargoById:', error);
      throw error;
    }
  }

  /**
   * Actualizar nombre personalizado del cargo
   * @param {Number} cargoId - ID del cargo
   * @param {String} customName - Nuevo nombre
   * @param {Object} user - Usuario que actualiza
   * @returns {Object} Cargo actualizado
   */
  async updateCargoName(cargoId, customName, user) {
    try {
      const cargo = await DocumentCargo.findByPk(cargoId);

      if (!cargo) {
        throw new Error('Cargo no encontrado');
      }

      // Verificar que el cargo pertenece al área del usuario
      if (cargo.areaId !== user.areaId) {
        throw new Error('No tienes permiso para editar este cargo');
      }

      // Actualizar nombre
      await cargo.update({
        customName: customName || null
      });

      return await this.getCargoById(cargoId, user);

    } catch (error) {
      console.error('Error en updateCargoName:', error);
      throw error;
    }
  }

  /**
   * Eliminar cargo
   * @param {Number} cargoId - ID del cargo
   * @param {Object} user - Usuario que elimina
   * @returns {Boolean} Success
   */
  async deleteCargo(cargoId, user) {
    try {
      const cargo = await DocumentCargo.findByPk(cargoId);

      if (!cargo) {
        throw new Error('Cargo no encontrado');
      }

      // Verificar que el cargo pertenece al área del usuario
      if (cargo.areaId !== user.areaId) {
        throw new Error('No tienes permiso para eliminar este cargo');
      }

      await cargo.destroy();

      return true;

    } catch (error) {
      console.error('Error en deleteCargo:', error);
      throw error;
    }
  }
}

module.exports = new CargoService();
