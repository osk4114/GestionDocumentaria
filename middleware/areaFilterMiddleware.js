/**
 * Middleware Helper: Area Filter for area_mgmt permissions
 * 
 * Este middleware detecta si el usuario tiene permisos area_mgmt.* 
 * y automáticamente filtra consultas por su areaId.
 * 
 * USO:
 * const { shouldFilterByArea, getAreaFilter } = require('../middleware/areaFilterMiddleware');
 * 
 * if (shouldFilterByArea(req)) {
 *   const areaFilter = getAreaFilter(req);
 *   // Aplicar filtro: { areaId: userAreaId }
 * }
 */

/**
 * Verificar si el usuario tiene permisos area_mgmt.*
 * @param {Object} req - Request object
 * @returns {boolean} - true si tiene permisos area_mgmt y debe filtrar por área
 */
function hasAreaMgmtPermissions(req) {
  if (!req.userPermissions || req.userPermissions.length === 0) {
    return false;
  }
  
  // Verificar si tiene algún permiso area_mgmt.*
  const hasAreaMgmt = req.userPermissions.some(perm => 
    perm.codigo && perm.codigo.startsWith('area_mgmt.')
  );
  
  // Verificar si tiene permisos NO area_mgmt.* (generales)
  const hasNonAreaMgmt = req.userPermissions.some(perm => 
    perm.codigo && !perm.codigo.startsWith('area_mgmt.')
  );
  
  // Solo retorna true si tiene area_mgmt Y NO tiene permisos generales
  return hasAreaMgmt && !hasNonAreaMgmt;
}

/**
 * Verificar si es Administrador (sin restricción de área)
 * Admin = tiene permisos generales (no area_mgmt) O nombre de rol es Administrador
 * @param {Object} req - Request object
 * @returns {boolean} - true si es Administrador
 */
function isAdmin(req) {
  // Verificar por nombre de rol
  if (req.user?.role?.nombre === 'Administrador') {
    return true;
  }
  
  // Verificar si tiene permisos generales (no area_mgmt)
  if (req.userPermissions && req.userPermissions.length > 0) {
    const hasNonAreaMgmt = req.userPermissions.some(perm => 
      perm.codigo && !perm.codigo.startsWith('area_mgmt.')
    );
    return hasNonAreaMgmt;
  }
  
  return false;
}

/**
 * Verificar si debe filtrar por área
 * Retorna true si:
 * - NO es Administrador Y
 * - Tiene permisos area_mgmt.* Y
 * - Tiene areaId asignado
 * 
 * @param {Object} req - Request object
 * @returns {boolean}
 */
function shouldFilterByArea(req) {
  // Admin nunca filtra por área
  if (isAdmin(req)) {
    return false;
  }
  
  // Si tiene permisos area_mgmt.* y tiene área asignada
  if (hasAreaMgmtPermissions(req) && req.user?.areaId) {
    return true;
  }
  
  return false;
}

/**
 * Obtener filtro de área para aplicar en consultas
 * @param {Object} req - Request object
 * @returns {Object|null} - Objeto con areaId o null si no aplica filtro
 */
function getAreaFilter(req) {
  if (!shouldFilterByArea(req)) {
    return null;
  }
  
  return {
    areaId: req.user.areaId
  };
}

/**
 * Verificar si el usuario puede acceder a un área específica
 * @param {Object} req - Request object
 * @param {number} targetAreaId - ID del área objetivo
 * @returns {boolean}
 */
function canAccessArea(req, targetAreaId) {
  // Admin puede acceder a todas las áreas
  if (isAdmin(req)) {
    return true;
  }
  
  // Si tiene permisos area_mgmt.*, solo puede acceder a su área
  if (hasAreaMgmtPermissions(req)) {
    return req.user?.areaId === targetAreaId;
  }
  
  // Si tiene permisos .all, puede acceder a todas
  if (req.userPermissions?.some(perm => perm.codigo?.includes('.all'))) {
    return true;
  }
  
  // Por defecto, si tiene permisos .area, solo su área
  return req.user?.areaId === targetAreaId;
}

/**
 * Middleware para agregar helpers al request
 * Usar DESPUÉS de getUserPermissions o checkAnyPermission
 */
function attachAreaFilters(req, res, next) {
  req.shouldFilterByArea = () => shouldFilterByArea(req);
  req.getAreaFilter = () => getAreaFilter(req);
  req.canAccessArea = (targetAreaId) => canAccessArea(req, targetAreaId);
  req.isAdmin = () => isAdmin(req);
  req.hasAreaMgmtPermissions = () => hasAreaMgmtPermissions(req);
  next();
}

module.exports = {
  shouldFilterByArea,
  getAreaFilter,
  canAccessArea,
  isAdmin,
  hasAreaMgmtPermissions,
  attachAreaFilters
};
