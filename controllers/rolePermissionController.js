const { Role, Permission, RolePermission, User } = require('../models');

/**
 * Controlador para gestión de Permisos de Roles
 * 
 * Endpoints:
 * - GET    /api/roles/:id/permissions              - Obtener permisos de un rol
 * - POST   /api/roles/:id/permissions              - Asignar permisos a un rol
 * - DELETE /api/roles/:id/permissions/:permId      - Remover permiso de un rol
 * - PUT    /api/roles/:id/permissions/sync         - Sincronizar permisos (reemplazar todos)
 * - GET    /api/roles/:id/permissions/available    - Permisos no asignados al rol
 */

/**
 * GET /api/roles/:id/permissions
 * Obtener todos los permisos de un rol
 */
exports.getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { grouped } = req.query;

    // Verificar que el rol exista
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Obtener permisos del rol
    const permissions = await role.getPermissions();

    // Si se solicita agrupado por categoría
    if (grouped === 'true') {
      const groupedPermissions = {};
      permissions.forEach(perm => {
        if (!groupedPermissions[perm.categoria]) {
          groupedPermissions[perm.categoria] = [];
        }
        groupedPermissions[perm.categoria].push(perm);
      });

      return res.json({
        success: true,
        data: groupedPermissions,
        role: {
          id: role.id,
          nombre: role.nombre,
          es_sistema: role.es_sistema
        }
      });
    }

    res.json({
      success: true,
      data: permissions,
      role: {
        id: role.id,
        nombre: role.nombre,
        es_sistema: role.es_sistema
      },
      total: permissions.length
    });
  } catch (error) {
    console.error('Error al obtener permisos del rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del rol',
      error: error.message
    });
  }
};

/**
 * POST /api/roles/:id/permissions
 * Asignar uno o más permisos a un rol
 * 
 * Body: { permission_id: number } o { permission_ids: number[] }
 */
exports.assignPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_id, permission_ids } = req.body;

    // Verificar que el rol exista
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Determinar qué permisos asignar
    let permissionsToAssign = [];
    
    if (permission_id) {
      permissionsToAssign = [permission_id];
    } else if (permission_ids && Array.isArray(permission_ids)) {
      permissionsToAssign = permission_ids;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar permission_id o permission_ids'
      });
    }

    // Asignar permisos
    const userId = req.user ? req.user.id : null;
    const results = await RolePermission.assignMultiplePermissions(
      id, 
      permissionsToAssign, 
      userId
    );

    // Preparar respuesta
    const response = {
      success: true,
      message: 'Permisos procesados',
      results: {
        assigned: results.success.length,
        skipped: results.skipped.length,
        failed: results.failed.length
      }
    };

    if (results.skipped.length > 0) {
      response.skipped = results.skipped;
    }

    if (results.failed.length > 0) {
      response.failed = results.failed;
    }

    res.json(response);
  } catch (error) {
    console.error('Error al asignar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar permisos',
      error: error.message
    });
  }
};

/**
 * DELETE /api/roles/:id/permissions/:permId
 * Remover un permiso de un rol
 */
exports.removePermission = async (req, res) => {
  try {
    const { id, permId } = req.params;

    // Verificar que el rol exista
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar que el permiso exista
    const permission = await Permission.findByPk(permId);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Remover el permiso
    const result = await RolePermission.removePermission(id, permId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      message: `Permiso "${permission.nombre}" removido del rol "${role.nombre}"`
    });
  } catch (error) {
    console.error('Error al remover permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover permiso',
      error: error.message
    });
  }
};

/**
 * PUT /api/roles/:id/permissions/sync
 * Sincronizar permisos de un rol (reemplazar todos los permisos existentes)
 * 
 * Body: { permission_ids: number[] }
 */
exports.syncPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    // Validar que se proporcionen permission_ids
    if (!permission_ids || !Array.isArray(permission_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de permission_ids'
      });
    }

    // Verificar que el rol exista
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Sincronizar permisos
    const userId = req.user ? req.user.id : null;
    const result = await RolePermission.syncPermissions(id, permission_ids, userId);

    res.json({
      success: true,
      message: `Permisos sincronizados para el rol "${role.nombre}"`,
      count: result.count
    });
  } catch (error) {
    console.error('Error al sincronizar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar permisos',
      error: error.message
    });
  }
};

/**
 * GET /api/roles/:id/permissions/available
 * Obtener permisos NO asignados a un rol
 */
exports.getAvailablePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { grouped } = req.query;

    // Verificar que el rol exista
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Obtener permisos asignados al rol
    const assignedPermissions = await role.getPermissions();
    const assignedIds = assignedPermissions.map(p => p.id);

    // Obtener todos los permisos
    const allPermissions = await Permission.findAll({
      order: [['categoria', 'ASC'], ['nombre', 'ASC']]
    });

    // Filtrar permisos no asignados
    const availablePermissions = allPermissions.filter(p => !assignedIds.includes(p.id));

    // Si se solicita agrupado por categoría
    if (grouped === 'true') {
      const groupedPermissions = {};
      availablePermissions.forEach(perm => {
        if (!groupedPermissions[perm.categoria]) {
          groupedPermissions[perm.categoria] = [];
        }
        groupedPermissions[perm.categoria].push(perm);
      });

      return res.json({
        success: true,
        data: groupedPermissions,
        role: {
          id: role.id,
          nombre: role.nombre
        }
      });
    }

    res.json({
      success: true,
      data: availablePermissions,
      role: {
        id: role.id,
        nombre: role.nombre
      },
      total: availablePermissions.length
    });
  } catch (error) {
    console.error('Error al obtener permisos disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos disponibles',
      error: error.message
    });
  }
};

/**
 * GET /api/roles/:id/users
 * Obtener usuarios que tienen asignado este rol
 */
exports.getRoleUsers = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el rol exista
    const role = await Role.findByPk(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Obtener usuarios con este rol
    const users = await User.findAll({
      where: { rolId: id },
      attributes: ['id', 'nombre', 'apellido', 'email', 'is_active'],
      include: [{
        model: require('../models').Area,
        as: 'area',
        attributes: ['id', 'nombre']
      }]
    });

    res.json({
      success: true,
      data: users,
      role: {
        id: role.id,
        nombre: role.nombre
      },
      total: users.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios del rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios del rol',
      error: error.message
    });
  }
};
