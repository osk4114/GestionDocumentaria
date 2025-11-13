const { Role, User, Permission } = require('../models');
const { Op } = require('sequelize');
const { hasAreaMgmtPermissions, isAdmin } = require('../middleware/areaFilterMiddleware');

/**
 * Controlador de Roles
 * Gestión completa de roles del sistema
 */

/**
 * Obtener todos los permisos disponibles
 * @route GET /api/roles/permissions
 * @access Private (admin)
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      attributes: ['id', 'codigo', 'nombre', 'descripcion', 'categoria'],
      order: [['categoria', 'ASC'], ['nombre', 'ASC']]
    });

    // Agrupar permisos por categoría
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const categoria = permission.categoria;
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(permission);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions,
      grouped: groupedPermissions
    });

  } catch (error) {
    console.error('Error en getAllPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

/**
 * Obtener todos los roles
 * @route GET /api/roles
 * @access Public (para selects)
 */
exports.getAllRoles = async (req, res) => {
  try {
    const { includePermissions, activeOnly } = req.query;

    const whereClause = activeOnly === 'true' ? { is_active: true } : {};

    // 🔒 FILTRADO POR PERMISOS DE USUARIO Y ÁREA
    const userPermissions = req.user?.permissions || [];
    console.log('🔍 [ROLES] Usuario:', req.user?.id, 'Área:', req.user?.areaId);
    console.log('🔍 [ROLES] Permisos del usuario:', userPermissions.map(p => p.codigo).join(', '));
    
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => 
      p.codigo === 'roles.view' || 
      p.codigo === 'roles.create' || 
      p.codigo === 'roles.edit' || 
      p.codigo === 'roles.delete'
    );

    console.log('🔍 [ROLES] hasAreaMgmtPermissions:', hasAreaMgmtPermissions);
    console.log('🔍 [ROLES] isAdmin:', isAdmin);

    // Encargados de Área ven: roles globales (areaId = NULL) + roles de su área
    if (hasAreaMgmtPermissions && !isAdmin) {
      whereClause.es_sistema = false;
      whereClause[Op.or] = [
        { areaId: null },
        { areaId: req.user.areaId }
      ];
      console.log(`🔒 [ROLES] Filtrando: roles globales + área ${req.user.areaId}`);
    }

    const includeOptions = includePermissions === 'true' ? [
      {
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'codigo', 'nombre', 'categoria'],
        through: { attributes: [] }
      }
    ] : [];

    const roles = await Role.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['nombre', 'ASC']]
    });

    console.log(`✅ [ROLES] ${roles.length} roles cargados`);

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
        },
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'codigo', 'nombre', 'descripcion', 'categoria'],
          through: { attributes: ['asignado_por', 'fecha_asignacion'] }
        }
      ]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // 🔒 VALIDACIÓN DE ÁREA PARA ENCARGADOS
    const userPermissions = req.user?.permissions || [];
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => 
      p.codigo === 'roles.view' || 
      p.codigo === 'roles.create' || 
      p.codigo === 'roles.edit' || 
      p.codigo === 'roles.delete'
    );

    if (hasAreaMgmtPermissions && !isAdmin) {
      // No pueden ver roles del sistema
      if (role.es_sistema) {
        console.log(`⛔ [ROLES] Usuario intentó acceder a rol del sistema: ${id}`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver roles del sistema'
        });
      }
      // No pueden ver roles de otras áreas
      if (role.areaId && role.areaId !== req.user.areaId) {
        console.log(`⛔ [ROLES] Usuario área ${req.user.areaId} intentó acceder a rol del área ${role.areaId}`);
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver roles de otras áreas'
        });
      }
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
    const { nombre, descripcion, puede_asignar_permisos, permisos } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es obligatorio'
      });
    }

    // 🔒 DETERMINAR ÁREA DEL ROL
    const userPermissions = req.user?.permissions || [];
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo?.startsWith('area_mgmt.'));
    const isAdmin = userPermissions.some(p => p.codigo === 'roles.create');
    
    let areaId = null; // Por defecto: rol global
    
    if (hasAreaMgmtPermissions && !isAdmin) {
      // Encargados de Área crean roles específicos para su área
      areaId = req.user.areaId;
      console.log(`🔒 [ROLES] Rol será específico del área: ${areaId}`);
    } else {
      console.log('🌐 [ROLES] Rol será GLOBAL (todas las áreas)');
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

    // Crear rol (los roles personalizados NO son de sistema)
    const role = await Role.create({
      nombre: nombre.trim(),
      areaId: areaId, // NULL para roles globales, areaId para roles específicos
      descripcion: descripcion ? descripcion.trim() : null,
      es_sistema: false, // Los roles creados por usuarios NO son de sistema
      puede_asignar_permisos: puede_asignar_permisos || false,
      is_active: true
    });

    // Asignar permisos si se proporcionaron
    if (permisos && Array.isArray(permisos) && permisos.length > 0) {
      // Verificar que los permisos existan
      const permisosValidos = await Permission.findAll({
        where: { id: { [Op.in]: permisos } }
      });

      if (permisosValidos.length > 0) {
        await role.addPermissions(permisosValidos, {
          through: {
            asignado_por: req.user.id,
            fecha_asignacion: new Date()
          }
        });
      }
    }

    // Obtener el rol con permisos para respuesta
    const roleWithPermissions = await Role.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'codigo', 'nombre', 'categoria'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: roleWithPermissions
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
    const { nombre, descripcion, puede_asignar_permisos, is_active, permisos } = req.body;

    // Buscar rol
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Proteger roles del sistema (no se pueden editar campos críticos)
    if (role.es_sistema) {
      // Los roles de sistema solo permiten editar la descripción
      if (nombre && nombre !== role.nombre) {
        return res.status(403).json({
          success: false,
          message: 'No se puede cambiar el nombre de un rol del sistema'
        });
      }
      if (puede_asignar_permisos !== undefined && puede_asignar_permisos !== role.puede_asignar_permisos) {
        return res.status(403).json({
          success: false,
          message: 'No se puede cambiar los permisos de asignación de un rol del sistema'
        });
      }
      if (is_active !== undefined && is_active !== role.is_active) {
        return res.status(403).json({
          success: false,
          message: 'No se puede desactivar un rol del sistema'
        });
      }
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
    const updateData = {
      nombre: nombre ? nombre.trim() : role.nombre,
      descripcion: descripcion !== undefined ? descripcion?.trim() : role.descripcion
    };

    // Solo actualizar estos campos si NO es rol de sistema
    if (!role.es_sistema) {
      if (puede_asignar_permisos !== undefined) {
        updateData.puede_asignar_permisos = puede_asignar_permisos;
      }
      if (is_active !== undefined) {
        updateData.is_active = is_active;
      }
    }

    await role.update(updateData);

    // Actualizar permisos si se proporcionaron
    if (permisos && Array.isArray(permisos)) {
      console.log(`🔄 [ROLES] Actualizando permisos del rol ${id}:`, permisos);
      
      // Validar que los permisos existan
      const validPermissions = await Permission.findAll({
        where: { id: permisos }
      });

      if (validPermissions.length !== permisos.length) {
        return res.status(400).json({
          success: false,
          message: 'Algunos permisos especificados no son válidos'
        });
      }

      // Actualizar permisos del rol
      await role.setPermissions(permisos);
      console.log(`✅ [ROLES] Permisos actualizados para rol ${id}`);
    }

    // Obtener rol actualizado con permisos
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['id', 'codigo', 'nombre', 'categoria'],
        through: { attributes: [] }
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: updatedRole
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

    // Proteger roles del sistema (no se pueden eliminar)
    if (role.es_sistema) {
      return res.status(403).json({
        success: false,
        message: 'No se puede eliminar un rol del sistema'
      });
    }

    // Verificar si el rol tiene usuarios ACTIVOS
    const usersCount = await User.count({
      where: { 
        rolId: id,
        isActive: true  // Solo contar usuarios activos
      }
    });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el rol porque tiene ${usersCount} usuario(s) activo(s) asignado(s)`
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

/**
 * Obtener roles personalizados (no del sistema)
 * @route GET /api/roles/custom
 * @access Private
 */
exports.getCustomRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { es_sistema: false },
      include: [
        {
          model: Permission,
          as: 'permissions',
          attributes: ['id', 'codigo', 'nombre', 'categoria'],
          through: { attributes: [] }
        }
      ],
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });

  } catch (error) {
    console.error('Error en getCustomRoles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles personalizados',
      error: error.message
    });
  }
};

/**
 * Activar/Desactivar rol
 * @route PATCH /api/roles/:id/toggle-status
 * @access Private (Solo Admin)
 */
exports.toggleRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // No se pueden desactivar roles del sistema
    if (role.es_sistema) {
      return res.status(403).json({
        success: false,
        message: 'No se puede cambiar el estado de un rol del sistema'
      });
    }

    // Cambiar estado
    await role.update({ is_active: !role.is_active });

    res.status(200).json({
      success: true,
      message: `Rol ${role.is_active ? 'activado' : 'desactivado'} exitosamente`,
      data: role
    });

  } catch (error) {
    console.error('Error en toggleRoleStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del rol',
      error: error.message
    });
  }
};
