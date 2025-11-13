const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Modelo Permission - Representa permisos granulares del sistema
 * 
 * Estructura:
 * - codigo: Identificador único del permiso (ej: 'documents.create')
 * - nombre: Nombre legible del permiso
 * - descripcion: Descripción detallada de qué permite hacer
 * - categoria: Categoría del permiso (auth, users, documents, etc.)
 * - es_sistema: Si es un permiso del sistema (no editable/eliminable)
 */
const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único del permiso'
  },
  codigo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Código único del permiso (ej: documents.create, area_mgmt.users.view)',
    validate: {
      notEmpty: { msg: 'El código del permiso no puede estar vacío' },
      is: {
        args: /^[a-z_]+(\.[a-z_]+)+$/,
        msg: 'El código debe estar en formato categoría.acción (ej: documents.create)'
      }
    }
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre legible del permiso',
    validate: {
      notEmpty: { msg: 'El nombre del permiso no puede estar vacío' },
      len: {
        args: [3, 100],
        msg: 'El nombre debe tener entre 3 y 100 caracteres'
      }
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada de qué permite hacer este permiso'
  },
  categoria: {
    type: DataTypes.ENUM(
      'auth',
      'users',
      'roles',
      'areas',
      'area_management',
      'categories',
      'document_types',
      'documents',
      'attachments',
      'versions',
      'movements',
      'reports',
      'system'
    ),
    allowNull: false,
    defaultValue: 'documents',
    comment: 'Categoría del permiso para agrupación en UI',
    validate: {
      isIn: {
        args: [[
          'auth', 'users', 'roles', 'areas', 'area_management', 'categories', 
          'document_types', 'documents', 'attachments', 'versions', 
          'movements', 'reports', 'system'
        ]],
        msg: 'Categoría inválida'
      }
    }
  },
  es_sistema: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si TRUE, el permiso no puede ser eliminado (permisos predefinidos)'
  }
}, {
  sequelize,
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_permission_codigo',
      fields: ['codigo']
    },
    {
      name: 'idx_permission_categoria',
      fields: ['categoria']
    },
    {
      name: 'idx_permission_es_sistema',
      fields: ['es_sistema']
    }
  ],
  hooks: {
    beforeDestroy: async (permission) => {
      // Evitar eliminación de permisos del sistema
      if (permission.es_sistema) {
        throw new Error('No se pueden eliminar permisos del sistema');
      }
    },
    beforeUpdate: async (permission) => {
      // Evitar modificación del código en permisos del sistema
      if (permission.es_sistema && permission.changed('codigo')) {
        throw new Error('No se puede modificar el código de permisos del sistema');
      }
    }
  }
});

/**
 * Método de clase para obtener permisos por categoría
 */
Permission.getByCategory = async function(categoria) {
  return await this.findAll({
    where: { categoria },
    order: [['nombre', 'ASC']]
  });
};

/**
 * Método de clase para obtener todos los permisos agrupados por categoría
 */
Permission.getAllGroupedByCategory = async function() {
  const permissions = await this.findAll({
    order: [['categoria', 'ASC'], ['nombre', 'ASC']]
  });
  
  // Agrupar por categoría
  const grouped = {};
  permissions.forEach(perm => {
    if (!grouped[perm.categoria]) {
      grouped[perm.categoria] = [];
    }
    grouped[perm.categoria].push(perm);
  });
  
  return grouped;
};

/**
 * Método de clase para buscar permiso por código
 */
Permission.findByCodigo = async function(codigo) {
  return await this.findOne({
    where: { codigo }
  });
};

/**
 * Método de clase para validar si un código de permiso existe
 */
Permission.exists = async function(codigo) {
  const count = await this.count({
    where: { codigo }
  });
  return count > 0;
};

/**
 * Método de instancia para verificar si el permiso puede ser eliminado
 */
Permission.prototype.canBeDeleted = function() {
  return !this.es_sistema;
};

/**
 * Método de instancia para verificar si el permiso puede ser editado
 */
Permission.prototype.canBeEdited = function() {
  return !this.es_sistema;
};

/**
 * Método de instancia para formatear respuesta JSON
 */
Permission.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Agregar información adicional
  values.can_delete = this.canBeDeleted();
  values.can_edit = this.canBeEdited();
  
  return values;
};

module.exports = Permission;
