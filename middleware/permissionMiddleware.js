const { Permission, RolePermission, Role } = require('../models');

/**
 * Middleware para verificar si el usuario tiene un permiso específico
 * 
 * Reemplaza el sistema antiguo de checkRole(['Admin', 'Jefe']) con permisos granulares
 * 
 * Uso:
 *   router.post('/documents', checkPermission('documents.create'), documentController.create);
 *   router.get('/users', checkPermission('users.view.all'), userController.getAll);
 */
const checkPermission = (requiredPermissionCode) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado. Inicie sesión para acceder'
        });
      }

      // Verificar que el usuario tenga un rol asignado
      if (!req.user.rolId) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacte al administrador'
        });
      }

      // Obtener el rol del usuario con sus permisos
      const role = await Role.findByPk(req.user.rolId, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }, // No incluir atributos de la tabla intermedia
          where: { codigo: requiredPermissionCode },
          required: false
        }]
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Rol de usuario no encontrado. Contacte al administrador'
        });
      }

      // Verificar si el rol está activo
      if (!role.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Su rol está desactivado. Contacte al administrador'
        });
      }

      // Verificar si el rol tiene el permiso requerido
      if (!role.permissions || role.permissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. No tiene permiso: ${requiredPermissionCode}`,
          required_permission: requiredPermissionCode,
          user_role: role.nombre
        });
      }

      // Usuario tiene el permiso - continuar
      // Agregar información del permiso al request para uso posterior
      req.permission = role.permissions[0];
      req.userRole = role;
      
      next();
    } catch (error) {
      console.error('Error en checkPermission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar múltiples permisos (el usuario debe tener AL MENOS UNO)
 * 
 * Uso:
 *   router.get('/documents', checkAnyPermission(['documents.view.all', 'documents.view.area']), ...);
 */
const checkAnyPermission = (permissionCodes) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado. Inicie sesión para acceder'
        });
      }

      // Verificar que el usuario tenga un rol asignado
      if (!req.user.rolId) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacte al administrador'
        });
      }

      // Obtener el rol del usuario con sus permisos
      const role = await Role.findByPk(req.user.rolId, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Rol de usuario no encontrado. Contacte al administrador'
        });
      }

      // Verificar si el rol está activo
      if (!role.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Su rol está desactivado. Contacte al administrador'
        });
      }

      // Verificar si el usuario tiene AL MENOS UNO de los permisos
      const userPermissionCodes = role.permissions.map(p => p.codigo);
      const hasAnyPermission = permissionCodes.some(code => userPermissionCodes.includes(code));

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Necesita uno de estos permisos: ${permissionCodes.join(', ')}`,
          required_permissions: permissionCodes,
          user_role: role.nombre
        });
      }

      // Usuario tiene al menos uno de los permisos - continuar
      req.userRole = role;
      req.userPermissions = role.permissions;
      
      next();
    } catch (error) {
      console.error('Error en checkAnyPermission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar múltiples permisos (el usuario debe tenerlos TODOS)
 * 
 * Uso:
 *   router.post('/special', checkAllPermissions(['documents.create', 'documents.edit.all']), ...);
 */
const checkAllPermissions = (permissionCodes) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado. Inicie sesión para acceder'
        });
      }

      // Verificar que el usuario tenga un rol asignado
      if (!req.user.rolId) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacte al administrador'
        });
      }

      // Obtener el rol del usuario con sus permisos
      const role = await Role.findByPk(req.user.rolId, {
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Rol de usuario no encontrado. Contacte al administrador'
        });
      }

      // Verificar si el rol está activo
      if (!role.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Su rol está desactivado. Contacte al administrador'
        });
      }

      // Verificar si el usuario tiene TODOS los permisos
      const userPermissionCodes = role.permissions.map(p => p.codigo);
      const hasAllPermissions = permissionCodes.every(code => userPermissionCodes.includes(code));

      if (!hasAllPermissions) {
        const missingPermissions = permissionCodes.filter(code => !userPermissionCodes.includes(code));
        
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Le faltan estos permisos: ${missingPermissions.join(', ')}`,
          required_permissions: permissionCodes,
          missing_permissions: missingPermissions,
          user_role: role.nombre
        });
      }

      // Usuario tiene todos los permisos - continuar
      req.userRole = role;
      req.userPermissions = role.permissions;
      
      next();
    } catch (error) {
      console.error('Error en checkAllPermissions middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Middleware auxiliar: Verificar si el usuario puede gestionar permisos
 * (Solo Administrador)
 */
const canManagePermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.rolId) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const role = await Role.findByPk(req.user.rolId);
    
    if (!role || !role.puede_asignar_permisos) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para gestionar permisos y roles'
      });
    }

    next();
  } catch (error) {
    console.error('Error en canManagePermissions middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

/**
 * Helper: Obtener todos los permisos del usuario actual
 */
const getUserPermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.rolId) {
      req.userPermissions = [];
      return next();
    }

    const role = await Role.findByPk(req.user.rolId, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }]
    });

    req.userPermissions = role && role.permissions ? role.permissions : [];
    req.userRole = role;
    
    next();
  } catch (error) {
    console.error('Error en getUserPermissions helper:', error);
    req.userPermissions = [];
    next();
  }
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  canManagePermissions,
  getUserPermissions
};
