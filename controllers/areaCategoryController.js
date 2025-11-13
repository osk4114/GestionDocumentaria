const { AreaDocumentCategory, Area, User, Document } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador de Categorías de Documentos por Área
 * Permite que cada área gestione sus propias categorías personalizadas
 */

/**
 * Obtener todas las categorías de un área
 * @route GET /api/areas/:areaId/categories
 * @access Private
 */
exports.getCategoriesByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { active } = req.query;

    // 🔒 VALIDACIÓN DE ÁREA PARA ENCARGADOS
    const userPermissions = req.user?.permissions || [];
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => p.codigo === 'categories.view' || p.codigo === 'categories.create');
    
    if (hasAreaMgmtPermissions && !isAdmin) {
      if (req.user.areaId && parseInt(areaId) !== req.user.areaId) {
        console.log(`⛔ [CATEGORIES] Usuario área ${req.user.areaId} intentó acceder a área ${areaId}`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver categorías de otras áreas'
        });
      }
    }

    // Verificar que el área existe
    const area = await Area.findByPk(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // Construir filtros
    const where = { areaId };
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    console.log(`🔒 [CATEGORIES] Obteniendo categorías del área: ${areaId}`);

    const categories = await AreaDocumentCategory.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [['orden', 'ASC'], ['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error('Error en getCategoriesByArea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

/**
 * Obtener categoría por ID
 * @route GET /api/areas/categories/:id
 * @access Private
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await AreaDocumentCategory.findByPk(id, {
      include: [
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'nombre', 'email']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // 🔒 VALIDACIÓN DE ÁREA PARA ENCARGADOS
    const userPermissions = req.user?.permissions || [];
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => p.codigo === 'categories.view');
    
    if (hasAreaMgmtPermissions && !isAdmin) {
      if (req.user.areaId && category.areaId !== req.user.areaId) {
        console.log(`⛔ [CATEGORIES] Usuario área ${req.user.areaId} intentó acceder a categoría del área ${category.areaId}`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver categorías de otras áreas'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error en getCategoryById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

/**
 * Crear nueva categoría para un área
 * @route POST /api/areas/:areaId/categories
 * @access Private
 */
exports.createCategory = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { nombre, codigo, descripcion, color, icono, orden, requiereAdjunto } = req.body;
    const userId = req.user?.id;

    // Validaciones
    if (!nombre || !codigo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y código son obligatorios'
      });
    }

    // Verificar que el área existe
    const area = await Area.findByPk(areaId);
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Área no encontrada'
      });
    }

    // Verificar que el código no exista en esta área
    const existingCodigo = await AreaDocumentCategory.findOne({
      where: { 
        areaId: areaId,
        codigo: codigo.toUpperCase()
      }
    });

    if (existingCodigo) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una categoría con el código ${codigo.toUpperCase()} en esta área`
      });
    }

    // Crear categoría
    const category = await AreaDocumentCategory.create({
      areaId: areaId,
      nombre,
      codigo: codigo.toUpperCase(),
      descripcion: descripcion || null,
      color: color || '#0066CC',
      icono: icono || 'file',
      orden: orden || 0,
      requiereAdjunto: requiereAdjunto || false,
      createdBy: userId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: category
    });

  } catch (error) {
    console.error('Error en createCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

/**
 * Actualizar categoría
 * @route PUT /api/areas/categories/:id
 * @access Private
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, descripcion, color, icono, orden, requiereAdjunto, isActive } = req.body;

    const category = await AreaDocumentCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Si se está actualizando el código, verificar que no exista en el área
    if (codigo && codigo.toUpperCase() !== category.codigo) {
      const existingCodigo = await AreaDocumentCategory.findOne({
        where: { 
          areaId: category.areaId,
          codigo: codigo.toUpperCase(),
          id: { [Op.ne]: id }
        }
      });

      if (existingCodigo) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una categoría con el código ${codigo.toUpperCase()} en esta área`
        });
      }
    }

    // Actualizar campos
    if (nombre !== undefined) category.nombre = nombre;
    if (codigo !== undefined) category.codigo = codigo.toUpperCase();
    if (descripcion !== undefined) category.descripcion = descripcion;
    if (color !== undefined) category.color = color;
    if (icono !== undefined) category.icono = icono;
    if (orden !== undefined) category.orden = orden;
    if (requiereAdjunto !== undefined) category.requiereAdjunto = requiereAdjunto;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: category
    });

  } catch (error) {
    console.error('Error en updateCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

/**
 * Eliminar categoría
 * @route DELETE /api/areas/categories/:id
 * @access Private (Solo Admin)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await AreaDocumentCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar si hay documentos usando esta categoría
    const documentsCount = await Document.count({
      where: { categoriaId: id }
    });

    if (documentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${documentsCount} documento(s) asociado(s). Desactívala en su lugar.`
      });
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
};

/**
 * Activar/Desactivar categoría
 * @route PATCH /api/areas/categories/:id/toggle
 * @access Private
 */
exports.toggleCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await AreaDocumentCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Categoría ${category.isActive ? 'activada' : 'desactivada'} exitosamente`,
      data: category
    });

  } catch (error) {
    console.error('Error en toggleCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de categoría',
      error: error.message
    });
  }
};

/**
 * Reordenar categorías
 * @route PUT /api/areas/:areaId/categories/reorder
 * @access Private
 */
exports.reorderCategories = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { categories } = req.body; // Array de { id, orden }

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de categorías con { id, orden }'
      });
    }

    // Actualizar el orden de cada categoría
    for (const cat of categories) {
      await AreaDocumentCategory.update(
        { orden: cat.orden },
        { where: { id: cat.id, areaId: areaId } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Categorías reordenadas exitosamente'
    });

  } catch (error) {
    console.error('Error en reorderCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar categorías',
      error: error.message
    });
  }
};

module.exports = exports;
