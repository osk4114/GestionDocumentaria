const { Permission, Role, RolePermission } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador para gestión de Permisos
 * 
 * Endpoints:
 * - GET    /api/permissions                - Listar todos los permisos
 * - GET    /api/permissions/grouped        - Permisos agrupados por categoría
 * - GET    /api/permissions/:id            - Detalle de un permiso
 * - POST   /api/permissions                - Crear permiso personalizado (Admin)
 * - PUT    /api/permissions/:id            - Editar permiso (solo no-sistema)
 * - DELETE /api/permissions/:id            - Eliminar permiso (solo no-sistema)
 * - GET    /api/permissions/category/:cat  - Permisos de una categoría
 */

/**
 * GET /api/permissions
 * Obtener todos los permisos del sistema
 * FILTRADO: Si el usuario solo tiene permisos area_mgmt.*, solo ve esos permisos
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const { 
      categoria, 
      es_sistema, 
      search, 
      page = 1, 
      limit = 100 
    } = req.query;

    // Obtener permisos del usuario autenticado
    const userPermissions = req.user.permissions || [];
    
    // Verificar si el usuario tiene SOLO permisos de area_management
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo && p.codigo.startsWith('area_mgmt.'));
    const hasNonAreaMgmtPermissions = userPermissions.some(p => p.codigo && !p.codigo.startsWith('area_mgmt.'));

    // Construir filtros
    const where = {};
    
    // Si SOLO tiene permisos de area_mgmt, forzar filtro
    if (hasAreaMgmtPermissions && !hasNonAreaMgmtPermissions) {
      where.categoria = 'area_management';
      console.log('🔒 [PERMISOS] Usuario con acceso limitado: solo permisos area_management');
    } else if (categoria) {
      where.categoria = categoria;
    }
    
    if (es_sistema !== undefined) {
      where.es_sistema = es_sistema === 'true';
    }
    
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { codigo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    // Consultar permisos
    const offset = (page - 1) * limit;
    const { count, rows: permissions } = await Permission.findAndCountAll({
      where,
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: permissions,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

/**
 * GET /api/permissions/grouped
 * Obtener permisos agrupados por categoría
 * FILTRADO: Si el usuario solo tiene permisos area_mgmt.*, solo ve esos permisos
 */
exports.getGroupedPermissions = async (req, res) => {
  try {
    // Obtener permisos del usuario autenticado
    const userPermissions = req.user.permissions || [];
    
    // Verificar si el usuario tiene SOLO permisos de area_management
    const hasAreaMgmtPermissions = userPermissions.some(p => p.codigo && p.codigo.startsWith('area_mgmt.'));
    const hasNonAreaMgmtPermissions = userPermissions.some(p => p.codigo && !p.codigo.startsWith('area_mgmt.'));
    
    let grouped;
    let permissions;
    
    // Si SOLO tiene permisos de area_mgmt (es Jefe de Área), filtrar
    if (hasAreaMgmtPermissions && !hasNonAreaMgmtPermissions) {
      // Jefe de Área: solo puede ver/asignar permisos de area_management
      permissions = await Permission.findAll({
        where: { categoria: 'area_management' },
        order: [['nombre', 'ASC']]
      });
      
      grouped = { area_management: permissions };
      
      console.log('🔒 [PERMISOS] Usuario con acceso limitado: solo permisos area_management');
      console.log(`📊 [PERMISOS] ${permissions.length} permisos de area_management cargados`);
    } else {
      // Admin o usuario con permisos generales: ver todos
      grouped = await Permission.getAllGroupedByCategory();
      permissions = await Permission.findAll({
        order: [['categoria', 'ASC'], ['nombre', 'ASC']]
      });
      
      console.log('✅ [PERMISOS] Usuario con acceso completo: todos los permisos');
      console.log(`📊 [PERMISOS] ${permissions.length} permisos en ${Object.keys(grouped).length} categorías`);
    }

    res.json({
      success: true,
      count: permissions.length,
      data: permissions,
      grouped: grouped
    });
  } catch (error) {
    console.error('Error al obtener permisos agrupados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos agrupados',
      error: error.message
    });
  }
};

/**
 * GET /api/permissions/category/:categoria
 * Obtener permisos de una categoría específica
 */
exports.getPermissionsByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;

    const permissions = await Permission.getByCategory(categoria);

    res.json({
      success: true,
      data: permissions,
      categoria
    });
  } catch (error) {
    console.error('Error al obtener permisos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

/**
 * GET /api/permissions/:id
 * Obtener detalle de un permiso
 */
exports.getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id, {
      include: [{
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        attributes: ['id', 'nombre', 'descripcion', 'es_sistema']
      }]
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Error al obtener permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permiso',
      error: error.message
    });
  }
};

/**
 * POST /api/permissions
 * Crear un nuevo permiso personalizado (solo Admin)
 */
exports.createPermission = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, categoria } = req.body;

    // Validar campos requeridos
    if (!codigo || !nombre || !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Código, nombre y categoría son requeridos'
      });
    }

    // Validar formato del código
    const codigoPattern = /^[a-z]+(\.[a-z_]+)+$/;
    if (!codigoPattern.test(codigo)) {
      return res.status(400).json({
        success: false,
        message: 'El código debe estar en formato categoria.accion (ej: documents.create)'
      });
    }

    // Verificar que no exista el código
    const exists = await Permission.exists(codigo);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un permiso con ese código'
      });
    }

    // Crear el permiso (es_sistema = FALSE por defecto)
    const permission = await Permission.create({
      codigo,
      nombre,
      descripcion,
      categoria,
      es_sistema: false
    });

    res.status(201).json({
      success: true,
      message: 'Permiso creado correctamente',
      data: permission
    });
  } catch (error) {
    console.error('Error al crear permiso:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear permiso',
      error: error.message
    });
  }
};

/**
 * PUT /api/permissions/:id
 * Actualizar un permiso (solo permisos personalizados, no del sistema)
 */
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoria } = req.body;

    // Buscar el permiso
    const permission = await Permission.findByPk(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Verificar que no sea un permiso del sistema
    if (permission.es_sistema) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden modificar permisos del sistema'
      });
    }

    // Actualizar campos (codigo no se puede modificar)
    if (nombre) permission.nombre = nombre;
    if (descripcion !== undefined) permission.descripcion = descripcion;
    if (categoria) permission.categoria = categoria;

    await permission.save();

    res.json({
      success: true,
      message: 'Permiso actualizado correctamente',
      data: permission
    });
  } catch (error) {
    console.error('Error al actualizar permiso:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar permiso',
      error: error.message
    });
  }
};

/**
 * DELETE /api/permissions/:id
 * Eliminar un permiso personalizado (no del sistema)
 */
exports.deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el permiso
    const permission = await Permission.findByPk(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado'
      });
    }

    // Verificar que no sea un permiso del sistema
    if (permission.es_sistema) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden eliminar permisos del sistema'
      });
    }

    // Verificar si está asignado a algún rol
    const assignmentCount = await RolePermission.count({
      where: { permission_id: id }
    });

    if (assignmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el permiso porque está asignado a ${assignmentCount} rol(es). Primero remueva las asignaciones.`
      });
    }

    // Eliminar el permiso
    await permission.destroy();

    res.json({
      success: true,
      message: 'Permiso eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar permiso',
      error: error.message
    });
  }
};

/**
 * GET /api/permissions/categories
 * Obtener lista de categorías disponibles
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { value: 'auth', label: 'Autenticación' },
      { value: 'users', label: 'Usuarios' },
      { value: 'roles', label: 'Roles' },
      { value: 'areas', label: 'Áreas' },
      { value: 'categories', label: 'Categorías' },
      { value: 'document_types', label: 'Tipos de Documento' },
      { value: 'documents', label: 'Documentos' },
      { value: 'attachments', label: 'Adjuntos' },
      { value: 'versions', label: 'Versiones' },
      { value: 'movements', label: 'Movimientos' },
      { value: 'reports', label: 'Reportes' },
      { value: 'system', label: 'Sistema' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};
