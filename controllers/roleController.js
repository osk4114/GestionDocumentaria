const { Role, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador de Roles
 * Gestión completa de roles del sistema
 */

/**
 * Obtener todos los roles
 * @route GET /api/roles
 * @access Public (para selects)
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });

  } catch (error) {
    console.error('Error en getAllRoles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

/**
 * Obtener rol por ID
 * @route GET /api/roles/:id
 * @access Private
 */
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
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

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: role
    });

  } catch (error) {
    console.error('Error en getRoleById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      error: error.message
    });
  }
};

/**
 * Crear nuevo rol
 * @route POST /api/roles
 * @access Private (Solo Admin)
 */
exports.createRole = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es obligatorio'
      });
    }

    // Verificar que el rol no exista
    const existingRole = await Role.findOne({
      where: { nombre: { [Op.like]: nombre } }
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: `El rol "${nombre}" ya existe`
      });
    }

    // Crear rol
    const role = await Role.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null
    });

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: role
    });

  } catch (error) {
    console.error('Error en createRole:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear rol',
      error: error.message
    });
  }
};

/**
 * Actualizar rol
 * @route PUT /api/roles/:id
 * @access Private (Solo Admin)
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    // Buscar rol
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Proteger roles del sistema
    const systemRoles = ['Administrador', 'Mesa de Partes', 'Funcionario'];
    if (systemRoles.includes(role.nombre) && nombre && nombre !== role.nombre) {
      return res.status(403).json({
        success: false,
        message: 'No se puede cambiar el nombre de un rol del sistema'
      });
    }

    // Si se actualiza el nombre, verificar que no exista
    if (nombre && nombre !== role.nombre) {
      const existingRole = await Role.findOne({
        where: { 
          nombre: { [Op.like]: nombre },
          id: { [Op.ne]: id }
        }
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: `El rol "${nombre}" ya existe`
        });
      }
    }

    // Actualizar rol
    await role.update({
      nombre: nombre ? nombre.trim() : role.nombre,
      descripcion: descripcion !== undefined ? descripcion?.trim() : role.descripcion
    });

    res.status(200).json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: role
    });

  } catch (error) {
    console.error('Error en updateRole:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error.message
    });
  }
};

/**
 * Eliminar rol
 * @route DELETE /api/roles/:id
 * @access Private (Solo Admin)
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar rol
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Proteger roles del sistema
    const systemRoles = ['Administrador', 'Mesa de Partes', 'Funcionario'];
    if (systemRoles.includes(role.nombre)) {
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar un rol del sistema'
      });
    }

    // Verificar si el rol tiene usuarios
    const usersCount = await User.count({
      where: { rolId: id }
    });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el rol porque tiene ${usersCount} usuario(s) asignado(s)`
      });
    }

    // Eliminar rol
    await role.destroy();

    res.status(200).json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteRole:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar rol',
      error: error.message
    });
  }
};

module.exports = exports;
