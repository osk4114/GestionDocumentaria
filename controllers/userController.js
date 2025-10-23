const { User, Role, Area, UserSession } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

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
    if (areaId) {
      where.areaId = areaId;
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
 * Desactivar usuario
 * @route DELETE /api/users/:id
 * @access Private (Solo Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar usuario
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar al propio usuario
    if (req.user && req.user.id === parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Desactivar usuario
    await user.update({ isActive: false });

    // Cerrar todas las sesiones activas del usuario
    await UserSession.update(
      { isActive: false },
      { where: { userId: id, isActive: true } }
    );

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar usuario',
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

module.exports = exports;
