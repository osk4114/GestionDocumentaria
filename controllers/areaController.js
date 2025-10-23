const { Area, User, Document } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador de Áreas
 * Gestión completa de áreas/departamentos de la organización
 */

/**
 * Obtener todas las áreas
 * @route GET /api/areas
 * @access Public (para selects) o Private (para gestión)
 */
exports.getAllAreas = async (req, res) => {
  try {
    const { active } = req.query;
    
    // Construir filtros
    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const areas = await Area.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: areas.length,
      data: areas
    });

  } catch (error) {
    console.error('Error en getAllAreas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener áreas',
      error: error.message
    });
  }
};

/**
 * Obtener área por ID
 * @route GET /api/areas/:id
 * @access Private
 */
exports.getAreaById = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await Area.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'nombre', 'email'],
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: area
    });

  } catch (error) {
    console.error('Error en getAreaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener área',
      error: error.message
    });
  }
};

/**
 * Crear nueva área
 * @route POST /api/areas
 * @access Private (Solo Admin)
 */
exports.createArea = async (req, res) => {
  try {
    const { nombre, sigla, descripcion, isActive } = req.body;

    // Validaciones
    if (!nombre || !sigla) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y sigla son obligatorios'
      });
    }

    // Verificar que la sigla no exista
    const existingSigla = await Area.findOne({
      where: { sigla: sigla.toUpperCase() }
    });

    if (existingSigla) {
      return res.status(400).json({
        success: false,
        message: `La sigla "${sigla}" ya está registrada`
      });
    }

    // Verificar que el nombre no exista
    const existingNombre = await Area.findOne({
      where: { nombre: { [Op.like]: nombre } }
    });

    if (existingNombre) {
      return res.status(400).json({
        success: false,
        message: `El área "${nombre}" ya existe`
      });
    }

    // Crear área
    const area = await Area.create({
      nombre: nombre.trim(),
      sigla: sigla.toUpperCase().trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Área creada exitosamente',
      data: area
    });

  } catch (error) {
    console.error('Error en createArea:', error);
    
    // Error de clave duplicada
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un área con esa sigla'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear área',
      error: error.message
    });
  }
};

/**
 * Actualizar área
 * @route PUT /api/areas/:id
 * @access Private (Solo Admin)
 */
exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, sigla, descripcion, isActive } = req.body;

    // Buscar área
    const area = await Area.findByPk(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // Si se actualiza la sigla, verificar que no exista
    if (sigla && sigla.toUpperCase() !== area.sigla) {
      const existingSigla = await Area.findOne({
        where: { 
          sigla: sigla.toUpperCase(),
          id: { [Op.ne]: id } // Excluir el área actual
        }
      });

      if (existingSigla) {
        return res.status(400).json({
          success: false,
          message: `La sigla "${sigla}" ya está registrada`
        });
      }
    }

    // Si se actualiza el nombre, verificar que no exista
    if (nombre && nombre !== area.nombre) {
      const existingNombre = await Area.findOne({
        where: { 
          nombre: { [Op.like]: nombre },
          id: { [Op.ne]: id }
        }
      });

      if (existingNombre) {
        return res.status(400).json({
          success: false,
          message: `El área "${nombre}" ya existe`
        });
      }
    }

    // Actualizar área
    await area.update({
      nombre: nombre ? nombre.trim() : area.nombre,
      sigla: sigla ? sigla.toUpperCase().trim() : area.sigla,
      descripcion: descripcion !== undefined ? descripcion?.trim() : area.descripcion,
      isActive: isActive !== undefined ? isActive : area.isActive
    });

    res.status(200).json({
      success: true,
      message: 'Área actualizada exitosamente',
      data: area
    });

  } catch (error) {
    console.error('Error en updateArea:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un área con esa sigla'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar área',
      error: error.message
    });
  }
};

/**
 * Desactivar área (soft delete)
 * @route DELETE /api/areas/:id
 * @access Private (Solo Admin)
 */
exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar área
    const area = await Area.findByPk(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // Verificar si el área tiene usuarios activos
    const activeUsersCount = await User.count({
      where: {
        areaId: id,
        isActive: true
      }
    });

    if (activeUsersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede desactivar el área porque tiene ${activeUsersCount} usuario(s) activo(s)`
      });
    }

    // Verificar si el área tiene documentos activos
    const activeDocumentsCount = await Document.count({
      where: {
        currentAreaId: id,
        statusId: { [Op.ne]: 4 } // 4 = Finalizado
      }
    });

    if (activeDocumentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede desactivar el área porque tiene ${activeDocumentsCount} documento(s) en proceso`
      });
    }

    // Desactivar área
    await area.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Área desactivada exitosamente',
      data: area
    });

  } catch (error) {
    console.error('Error en deleteArea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar área',
      error: error.message
    });
  }
};

/**
 * Activar área
 * @route PATCH /api/areas/:id/activate
 * @access Private (Solo Admin)
 */
exports.activateArea = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await Area.findByPk(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    await area.update({ isActive: true });

    res.status(200).json({
      success: true,
      message: 'Área activada exitosamente',
      data: area
    });

  } catch (error) {
    console.error('Error en activateArea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar área',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas del área
 * @route GET /api/areas/:id/stats
 * @access Private
 */
exports.getAreaStats = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await Area.findByPk(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // Contar usuarios
    const usersCount = await User.count({
      where: { areaId: id, isActive: true }
    });

    // Contar documentos actuales
    const currentDocumentsCount = await Document.count({
      where: { currentAreaId: id }
    });

    // Contar documentos por estado
    const { DocumentStatus } = require('../models');
    const documentsByStatus = await Document.findAll({
      where: { currentAreaId: id },
      attributes: [
        'statusId',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      include: [{
        model: DocumentStatus,
        as: 'status',
        attributes: ['nombre', 'codigo']
      }],
      group: ['statusId', 'status.id']
    });

    res.status(200).json({
      success: true,
      data: {
        area: {
          id: area.id,
          nombre: area.nombre,
          sigla: area.sigla
        },
        usersCount,
        currentDocumentsCount,
        documentsByStatus
      }
    });

  } catch (error) {
    console.error('Error en getAreaStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del área',
      error: error.message
    });
  }
};

module.exports = exports;
