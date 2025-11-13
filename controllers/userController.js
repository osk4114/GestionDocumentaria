const { User, Role, Area, UserSession, Document, DocumentMovement, Attachment, AreaDocumentCategory, DocumentVersion } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/sequelize');
const { shouldFilterByArea, getAreaFilter } = require('../middleware/areaFilterMiddleware');

/**
 * Controlador de Usuarios
 * Gestión completa de usuarios del sistema
 * Nota: El registro inicial está en authController.register
 */

/**
 * Obtener todos los usuarios
 * @route GET /api/users
 * @access Private (Solo Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { active, roleId, areaId } = req.query;
    
    // Construir filtros
    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    if (roleId) {
      where.rolId = roleId;
    }
    
    // 🔒 FILTRO POR ÁREA
    if (areaId) {
      // Si se especifica explícitamente un areaId, usarlo (para derivaciones)
      where.areaId = areaId;
      console.log(`🔍 [USERS] Filtrando por área especificada: ${areaId}`);
    } else if (shouldFilterByArea(req)) {
      // Si NO se especifica área, aplicar filtro automático para usuarios con area_mgmt.*
      const areaFilter = getAreaFilter(req);
      if (areaFilter) {
        where.areaId = areaFilter.areaId;
        console.log(`🔒 [USERS] Filtrando usuarios por área del usuario: ${areaFilter.areaId}`);
      }
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] }, // No enviar contraseñas
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nombre']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Error en getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * Obtener usuario por ID
 * @route GET /api/users/:id
 * @access Private
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla', 'descripcion']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * Crear nuevo usuario
 * @route POST /api/users
 * @access Private (Solo Admin)
 * Nota: También existe en /api/auth/register
 */
exports.createUser = async (req, res) => {
  try {
    const { nombre, email, password, rolId, areaId, isActive } = req.body;

    // Validaciones
    if (!nombre || !email || !password || !rolId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email, contraseña y rol son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar que el email no exista
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar que el rol exista
    const role = await Role.findByPk(rolId);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'El rol especificado no existe'
      });
    }

    // Verificar que el área exista (si se proporciona)
    if (areaId) {
      const area = await Area.findByPk(areaId);
      if (!area) {
        return res.status(400).json({
          success: false,
          message: 'El área especificada no existe'
        });
      }
      if (!area.isActive) {
        return res.status(400).json({
          success: false,
          message: 'El área especificada está desactivada'
        });
      }
      
      // 🔒 VALIDACIÓN: Si tiene permisos area_mgmt.*, solo puede crear usuarios en SU área
      if (shouldFilterByArea(req)) {
        if (areaId !== req.user.areaId) {
          return res.status(403).json({
            success: false,
            message: 'No tiene permiso para crear usuarios en otras áreas. Solo puede crear usuarios en su área asignada.'
          });
        }
      }
    } else {
      // 🔒 Si tiene permisos area_mgmt.* y NO proporciona área, usar su área por defecto
      if (shouldFilterByArea(req)) {
        return res.status(400).json({
          success: false,
          message: 'Debe especificar un área. Solo puede crear usuarios en su área asignada.'
        });
      }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await User.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      rolId,
      areaId: areaId || null,
      isActive: isActive !== undefined ? isActive : true
    });

    // Obtener usuario con relaciones
    const userWithRelations = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nombre']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userWithRelations
    });

  } catch (error) {
    console.error('Error en createUser:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

/**
 * Actualizar usuario
 * @route PUT /api/users/:id
 * @access Private (Solo Admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rolId, areaId, isActive } = req.body;

    // Buscar usuario
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si se actualiza el email, verificar que no exista
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email: email.toLowerCase(),
          id: { [Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Verificar que el rol exista (si se proporciona)
    if (rolId && rolId !== user.rolId) {
      const role = await Role.findByPk(rolId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'El rol especificado no existe'
        });
      }
    }

    // Verificar que el área exista (si se proporciona)
    if (areaId && areaId !== user.areaId) {
      const area = await Area.findByPk(areaId);
      if (!area) {
        return res.status(400).json({
          success: false,
          message: 'El área especificada no existe'
        });
      }
      if (!area.isActive) {
        return res.status(400).json({
          success: false,
          message: 'El área especificada está desactivada'
        });
      }
    }

    // Preparar datos de actualización
    const updateData = {
      nombre: nombre ? nombre.trim() : user.nombre,
      email: email ? email.toLowerCase().trim() : user.email,
      rolId: rolId || user.rolId,
      areaId: areaId !== undefined ? areaId : user.areaId,
      isActive: isActive !== undefined ? isActive : user.isActive
    };

    // Si se proporciona contraseña, encriptarla
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar usuario
    await user.update(updateData);

    // Obtener usuario actualizado con relaciones
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'nombre']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'nombre', 'sigla']
        }
      ]
    });

    // 🔔 EVENTO WEBSOCKET: Notificar al usuario que su perfil fue actualizado
    if (global.io) {
      const eventData = {
        event: 'user:updated',
        timestamp: new Date().toISOString(),
        userId: updatedUser.id,
        user: updatedUser,
        message: `Tu perfil ha sido actualizado`,
        changedFields: Object.keys(updateData)
      };

      // Emitir solo al usuario afectado
      global.io.to(`user:${updatedUser.id}`).emit('user:updated', eventData);
      console.log(`📤 Evento 'user:updated' enviado a usuario ${updatedUser.id} (${updatedUser.email})`);
    }

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error en updateUser:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * Eliminar usuario (DELETE físico con reasignación)
 * @route DELETE /api/users/:id
 * @access Private (Solo Admin)
 */
exports.deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    // Buscar usuario
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar al propio usuario
    if (req.user && req.user.id === parseInt(id)) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Verificar si es el único usuario ACTIVO del área (solo aplica si el usuario está activo)
    if (user.isActive && user.areaId) {
      const usersInArea = await User.count({
        where: { 
          areaId: user.areaId,
          isActive: true,
          id: { [Op.ne]: id }
        }
      });

      if (usersInArea === 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el único usuario activo del área. Asigne otro usuario primero.'
        });
      }
    }

    // Buscar usuario administrador para reasignar
    let systemUser = await User.findOne({
      include: [{
        model: Role,
        as: 'role',
        where: { nombre: 'Administrador' }
      }],
      where: { 
        isActive: true,
        id: { [Op.ne]: id } // No el mismo que se está eliminando
      },
      order: [['id', 'ASC']] // El primer admin
    });

    if (!systemUser) {
      await t.rollback();
      return res.status(500).json({
        success: false,
        message: 'No se encontró un administrador del sistema para reasignar registros'
      });
    }

    console.log(`🔄 Reasignando registros del usuario ${id} (${user.nombre}) al administrador ${systemUser.id} (${systemUser.nombre})`);

    // 1. Reasignar documentos actuales (currentUserId)
    await Document.update(
      { currentUserId: systemUser.id },
      { where: { currentUserId: id }, transaction: t }
    );

    // 2. Reasignar movimientos (userId)
    await DocumentMovement.update(
      { userId: systemUser.id },
      { where: { userId: id }, transaction: t }
    );

    // 3. Reasignar adjuntos (uploadedBy)
    await Attachment.update(
      { uploadedBy: systemUser.id },
      { where: { uploadedBy: id }, transaction: t }
    );

    // 4. Reasignar categorías creadas (createdBy)
    await AreaDocumentCategory.update(
      { createdBy: systemUser.id },
      { where: { createdBy: id }, transaction: t }
    );

    // 5. Reasignar versiones subidas (uploadedBy)
    await DocumentVersion.update(
      { uploadedBy: systemUser.id },
      { where: { uploadedBy: id }, transaction: t }
    );

    // 6. Cerrar todas las sesiones activas del usuario
    await UserSession.destroy({
      where: { userId: id },
      transaction: t
    });

    // 8. Eliminar físicamente el usuario
    // Para usuarios inactivos, MySQL permite la eliminación aunque tengan FK
    // porque no hay restricción ON DELETE RESTRICT desde otras tablas hacia users
    await user.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente. Sus registros fueron reasignados al sistema.'
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en deleteUser:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

/**
 * Activar usuario
 * @route PATCH /api/users/:id/activate
 * @access Private (Solo Admin)
 */
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.update({ isActive: true });

    res.status(200).json({
      success: true,
      message: 'Usuario activado exitosamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Error en activateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar usuario',
      error: error.message
    });
  }
};

/**
 * Desactivar usuario
 * @route PATCH /api/users/:id/deactivate
 * @access Private (Admin o Encargado de Área)
 */
exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivarse a sí mismo
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Error en deactivateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar usuario',
      error: error.message
    });
  }
};

module.exports = exports;
