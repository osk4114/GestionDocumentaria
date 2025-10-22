/**
 * Middleware para verificar roles de usuario
 * Uso: router.get('/ruta', authMiddleware, checkRole(['Administrador', 'Jefe de Área']), controller)
 */

/**
 * Verifica que el usuario tenga uno de los roles permitidos
 * @param {Array} allowedRoles - Array de nombres de roles permitidos
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Verificar que tenga el rol
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'No se pudo determinar el rol del usuario'
        });
      }

      // Verificar si el rol del usuario está en los roles permitidos
      const userRole = req.user.role.nombre;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`,
          currentRole: userRole
        });
      }

      // Usuario tiene el rol correcto, continuar
      next();

    } catch (error) {
      console.error('Error en checkRole:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**
 * Verifica que el usuario sea administrador
 */
const isAdmin = checkRole(['Administrador']);

/**
 * Verifica que el usuario sea administrador o jefe de área
 */
const isAdminOrJefe = checkRole(['Administrador', 'Jefe de Área']);

/**
 * Verifica que el usuario pertenezca a un área específica
 */
const checkArea = (allowedAreaIds) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      if (!req.user.areaId) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no tiene área asignada'
        });
      }

      if (!allowedAreaIds.includes(req.user.areaId)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a esta área'
        });
      }

      next();
    } catch (error) {
      console.error('Error en checkArea:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar área',
        error: error.message
      });
    }
  };
};

/**
 * Verifica que el usuario sea el propietario del recurso o administrador
 */
const isOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Si es admin, permitir acceso
      if (req.user.role.nombre === 'Administrador') {
        return next();
      }

      // Verificar si es el propietario
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (parseInt(resourceUserId) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este recurso'
        });
      }

      next();
    } catch (error) {
      console.error('Error en isOwnerOrAdmin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

module.exports = {
  checkRole,
  isAdmin,
  isAdminOrJefe,
  checkArea,
  isOwnerOrAdmin
};
