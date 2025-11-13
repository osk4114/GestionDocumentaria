const { DocumentType, Document } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador de Tipos de Documento
 * Gestión completa de tipos de documento (solicitud, oficio, etc.)
 */

/**
 * Obtener todos los tipos de documento
 * @route GET /api/document-types
 * @access Public (para selects en formularios)
 */
exports.getAllDocumentTypes = async (req, res) => {
  try {
    const { active } = req.query;
    
    // Construir filtros
    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    // 🔒 FILTRADO POR PERMISOS DE USUARIO Y ÁREA
    const userPermissions = req.user?.permissions || [];
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => 
      p.codigo === 'document_types.view' || 
      p.codigo === 'document_types.create' || 
      p.codigo === 'document_types.edit'
    );

    if (hasAreaMgmtPermissions && !isAdmin) {
      where.isActive = true;
      // Mostrar tipos globales (areaId = NULL) + tipos de su área
      where[Op.or] = [
        { areaId: null },
        { areaId: req.user.areaId }
      ];
      console.log(`🔒 [DOCUMENT_TYPES] Filtrando: tipos globales + área ${req.user.areaId}`);
    }

    const documentTypes = await DocumentType.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    console.log(`✅ [DOCUMENT_TYPES] ${documentTypes.length} tipos cargados`);

    res.status(200).json({
      success: true,
      count: documentTypes.length,
      data: documentTypes
    });

  } catch (error) {
    console.error('Error en getAllDocumentTypes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de documento',
      error: error.message
    });
  }
};

/**
 * Obtener solo tipos de documento activos
 * @route GET /api/document-types/active
 * @access Public (para selects en formularios)
 */
exports.getActiveDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.findAll({
      where: { isActive: true },
      order: [['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'descripcion', 'codigo']
    });

    res.status(200).json({
      success: true,
      count: documentTypes.length,
      data: documentTypes
    });

  } catch (error) {
    console.error('Error en getActiveDocumentTypes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de documento activos',
      error: error.message
    });
  }
};

/**
 * Obtener tipo de documento por ID
 * @route GET /api/document-types/:id
 * @access Private
 */
exports.getDocumentTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: documentType
    });

  } catch (error) {
    console.error('Error en getDocumentTypeById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipo de documento',
      error: error.message
    });
  }
};

/**
 * Crear nuevo tipo de documento
 * @route POST /api/document-types
 * @access Private (Solo Admin)
 */
exports.createDocumentType = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, requiereAdjunto, diasMaxAtencion, isActive } = req.body;

    // Validaciones
    if (!nombre || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y código son obligatorios'
      });
    }

    // 🔒 DETERMINAR ÁREA DEL TIPO DE DOCUMENTO
    const userPermissions = req.user?.permissions || [];
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => p.codigo === 'document_types.create');
    
    let areaId = null; // Por defecto: tipo global
    
    if (hasAreaMgmtPermissions && !isAdmin) {
      // Encargados de Área crean tipos específicos para su área
      areaId = req.user.areaId;
      console.log(`🔒 [DOCUMENT_TYPES] Tipo de documento será específico del área: ${areaId}`);
    } else {
      console.log('🌐 [DOCUMENT_TYPES] Tipo de documento será GLOBAL (todas las áreas)');
    }

    // Verificar que el código no exista
    const existingCodigo = await DocumentType.findOne({
      where: { codigo: codigo.toUpperCase() }
    });

    if (existingCodigo) {
      return res.status(400).json({
        success: false,
        message: `El código "${codigo}" ya está registrado`
      });
    }

    // Verificar que el nombre no exista
    const existingNombre = await DocumentType.findOne({
      where: { nombre: { [Op.like]: nombre } }
    });

    if (existingNombre) {
      return res.status(400).json({
        success: false,
        message: `El tipo de documento "${nombre}" ya existe`
      });
    }

    // Crear tipo de documento
    const documentType = await DocumentType.create({
      nombre: nombre.trim(),
      codigo: codigo.toUpperCase().trim(),
      areaId: areaId, // NULL para tipos globales, areaId para tipos específicos
      descripcion: descripcion ? descripcion.trim() : null,
      requiereAdjunto: requiereAdjunto !== undefined ? requiereAdjunto : false,
      diasMaxAtencion: diasMaxAtencion || null,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Tipo de documento creado exitosamente',
      data: documentType
    });

  } catch (error) {
    console.error('Error en createDocumentType:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tipo de documento con ese código o nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear tipo de documento',
      error: error.message
    });
  }
};

/**
 * Actualizar tipo de documento
 * @route PUT /api/document-types/:id
 * @access Private (Solo Admin)
 */
exports.updateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, descripcion, requiereAdjunto, diasMaxAtencion, isActive } = req.body;

    // Buscar tipo de documento
    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    }

    // Si se actualiza el código, verificar que no exista
    if (codigo && codigo.toUpperCase() !== documentType.codigo) {
      const existingCodigo = await DocumentType.findOne({
        where: { 
          codigo: codigo.toUpperCase(),
          id: { [Op.ne]: id }
        }
      });

      if (existingCodigo) {
        return res.status(400).json({
          success: false,
          message: `El código "${codigo}" ya está registrado`
        });
      }
    }

    // Si se actualiza el nombre, verificar que no exista
    if (nombre && nombre !== documentType.nombre) {
      const existingNombre = await DocumentType.findOne({
        where: { 
          nombre: { [Op.like]: nombre },
          id: { [Op.ne]: id }
        }
      });

      if (existingNombre) {
        return res.status(400).json({
          success: false,
          message: `El tipo de documento "${nombre}" ya existe`
        });
      }
    }

    // Actualizar tipo de documento
    await documentType.update({
      nombre: nombre ? nombre.trim() : documentType.nombre,
      codigo: codigo ? codigo.toUpperCase().trim() : documentType.codigo,
      descripcion: descripcion !== undefined ? descripcion?.trim() : documentType.descripcion,
      requiereAdjunto: requiereAdjunto !== undefined ? requiereAdjunto : documentType.requiereAdjunto,
      diasMaxAtencion: diasMaxAtencion !== undefined ? diasMaxAtencion : documentType.diasMaxAtencion,
      isActive: isActive !== undefined ? isActive : documentType.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Tipo de documento actualizado exitosamente',
      data: documentType
    });

  } catch (error) {
    console.error('Error en updateDocumentType:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tipo de documento con ese código o nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipo de documento',
      error: error.message
    });
  }
};

/**
 * Eliminar tipo de documento permanentemente
 * @route DELETE /api/document-types/:id
 * @access Private (Solo Admin)
 */
exports.deleteDocumentType = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar tipo de documento
    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    }

    // Verificar si hay documentos usando este tipo
    const documentsCount = await Document.count({
      where: { docTypeId: id }
    });

    if (documentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar porque hay ${documentsCount} documento(s) de este tipo. Desactívelo en su lugar.`
      });
    }

    // Eliminar tipo de documento permanentemente
    await documentType.destroy();

    res.status(200).json({
      success: true,
      message: 'Tipo de documento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteDocumentType:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de documento',
      error: error.message
    });
  }
};

/**
 * Desactivar tipo de documento (soft delete)
 * @route PATCH /api/document-types/:id/deactivate
 * @access Private (Solo Admin)
 */
exports.deactivateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;

    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    }

    await documentType.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Tipo de documento desactivado exitosamente',
      data: documentType
    });

  } catch (error) {
    console.error('Error en deactivateDocumentType:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar tipo de documento',
      error: error.message
    });
  }
};

/**
 * Activar tipo de documento
 * @route PATCH /api/document-types/:id/activate
 * @access Private (Solo Admin)
 */
exports.activateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;

    const documentType = await DocumentType.findByPk(id);

    if (!documentType) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de documento no encontrado'
      });
    }

    await documentType.update({ isActive: true });

    res.status(200).json({
      success: true,
      message: 'Tipo de documento activado exitosamente',
      data: documentType
    });

  } catch (error) {
    console.error('Error en activateDocumentType:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar tipo de documento',
      error: error.message
    });
  }
};

module.exports = exports;
