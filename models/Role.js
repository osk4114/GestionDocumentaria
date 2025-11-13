const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Modelo Role - Representa roles con permisos granulares
 * 
 * Versión 3.0: Sistema RBAC completo
 * - Solo 2 roles del sistema: Administrador y Jefe de Área
 * - Resto de roles son personalizables con permisos granulares
 * - Relación muchos a muchos con permisos a través de role_permissions
 */
const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único del rol'
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Nombre único del rol',
    validate: {
      notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
      len: {
        args: [3, 50],
        msg: 'El nombre debe tener entre 3 y 50 caracteres'
      }
    }
  },
  areaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'area_id',
    comment: 'ID del área a la que pertenece (NULL = global, NOT NULL = específico de área)'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del rol y sus responsabilidades'
  },
  es_sistema: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si TRUE, el rol no puede ser eliminado ni modificado (Admin, Jefe de Área)'
  },
  puede_asignar_permisos: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si TRUE, usuarios con este rol pueden gestionar roles y permisos (solo Admin)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si el rol está activo en el sistema'
  }
}, {
  sequelize,
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_role_nombre',
      unique: true,
      fields: ['nombre']
    },
    {
      name: 'idx_role_es_sistema',
      fields: ['es_sistema']
    },
    {
      name: 'idx_role_is_active',
      fields: ['is_active']
    }
  ],
  hooks: {
    beforeDestroy: async (role) => {
      // Evitar eliminación de roles del sistema
      if (role.es_sistema) {
        throw new Error('No se pueden eliminar roles del sistema (Administrador, Jefe de Área)');
      }
      
      // Verificar que no haya usuarios ACTIVOS con este rol
      const User = require('./User');
      const userCount = await User.count({
        where: { 
          rolId: role.id,
          isActive: true  // Solo contar usuarios activos
        }
      });
      
      if (userCount > 0) {
        throw new Error(`No se puede eliminar el rol porque ${userCount} usuario(s) activo(s) lo tienen asignado`);
      }
      
      // Contar usuarios inactivos con este rol
      const inactiveCount = await User.count({
        where: { 
          rolId: role.id,
          isActive: false
        }
      });
      
      console.log(`🔍 [ROLE HOOK] Rol ${role.id} tiene ${inactiveCount} usuario(s) inactivo(s)`);
      
      // Establecer rolId = NULL en usuarios INACTIVOS para evitar error de FK
      if (inactiveCount > 0) {
        const [updated] = await User.update(
          { rolId: null },
          { 
            where: { 
              rolId: role.id,
              isActive: false
            },
            validate: false  // Saltar validaciones (rolId tiene allowNull: false)
          }
        );
        console.log(`✅ [ROLE HOOK] ${updated} usuario(s) inactivo(s) actualizados (rolId=NULL)`);
      }
    },
    beforeUpdate: async (role) => {
      // Evitar modificación de campos críticos en roles del sistema
      if (role.es_sistema) {
        if (role.changed('nombre')) {
          throw new Error('No se puede cambiar el nombre de roles del sistema');
        }
        if (role.changed('es_sistema')) {
          throw new Error('No se puede modificar el flag es_sistema');
        }
        if (role.changed('puede_asignar_permisos')) {
          throw new Error('No se puede modificar el flag puede_asignar_permisos de roles del sistema');
        }
      }
    }
  }
});

/**
 * Método de clase para obtener roles personalizables (no del sistema)
 */
Role.getCustomRoles = async function() {
  return await this.findAll({
    where: { 
      es_sistema: false,
      is_active: true
    },
    order: [['nombre', 'ASC']]
  });
};

/**
 * Método de clase para obtener roles del sistema
 */
Role.getSystemRoles = async function() {
  return await this.findAll({
    where: { es_sistema: true },
    order: [['nombre', 'ASC']]
  });
};

/**
 * Método de clase para obtener todos los roles activos
 */
Role.getActiveRoles = async function() {
  return await this.findAll({
    where: { is_active: true },
    order: [['es_sistema', 'DESC'], ['nombre', 'ASC']]
  });
};

/**
 * Método de instancia para verificar si el rol puede ser eliminado
 */
Role.prototype.canBeDeleted = function() {
  return !this.es_sistema;
};

/**
 * Método de instancia para verificar si el rol puede ser editado
 */
Role.prototype.canBeEdited = function() {
  return !this.es_sistema;
};

/**
 * Método de instancia para verificar si es rol Administrador
 */
Role.prototype.isAdmin = function() {
  return this.nombre === 'Administrador';
};

/**
 * Método de instancia para verificar si es rol Jefe de Área
 */
Role.prototype.isJefe = function() {
  return this.nombre === 'Jefe de Área';
};

/**
 * Método de instancia para obtener permisos del rol
 */
Role.prototype.getPermissions = async function() {
  const RolePermission = require('./RolePermission');
  return await RolePermission.getPermissionsByRole(this.id);
};

/**
 * Método de instancia para verificar si tiene un permiso específico
 */
Role.prototype.hasPermission = async function(permissionCodigo) {
  const RolePermission = require('./RolePermission');
  return await RolePermission.roleHasPermission(this.id, permissionCodigo);
};

/**
 * Método de instancia para asignar permiso
 */
Role.prototype.assignPermission = async function(permissionId, userId = null) {
  const RolePermission = require('./RolePermission');
  return await RolePermission.assignPermission(this.id, permissionId, userId);
};

/**
 * Método de instancia para remover permiso
 */
Role.prototype.removePermission = async function(permissionId) {
  const RolePermission = require('./RolePermission');
  return await RolePermission.removePermission(this.id, permissionId);
};

/**
 * Método de instancia para sincronizar permisos (reemplazar todos)
 */
Role.prototype.syncPermissions = async function(permissionIds, userId = null) {
  const RolePermission = require('./RolePermission');
  return await RolePermission.syncPermissions(this.id, permissionIds, userId);
};

/**
 * Método de instancia para formatear respuesta JSON
 */
Role.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Agregar información adicional
  values.can_delete = this.canBeDeleted();
  values.can_edit = this.canBeEdited();
  values.is_admin = this.isAdmin();
  values.is_jefe = this.isJefe();
  
  return values;
};

module.exports = Role;
