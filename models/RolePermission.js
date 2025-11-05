const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Modelo RolePermission - Tabla de unión entre Roles y Permisos
 * 
 * Representa la relación muchos a muchos entre roles y permisos.
 * Define qué permisos tiene asignado cada rol del sistema.
 */
const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'ID único de la asignación'
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID del rol'
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID del permiso'
  },
  asignado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'SET NULL',
    onDelete: 'SET NULL',
    comment: 'ID del usuario que asignó este permiso al rol'
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha en que se asignó el permiso'
  }
}, {
  sequelize,
  tableName: 'role_permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_role_permission',
      unique: true,
      fields: ['rol_id', 'permission_id']
    },
    {
      name: 'idx_role_id',
      fields: ['rol_id']
    },
    {
      name: 'idx_permission_id',
      fields: ['permission_id']
    },
    {
      name: 'idx_asignado_por',
      fields: ['asignado_por']
    }
  ],
  hooks: {
    beforeCreate: async (rolePermission) => {
      // Validar que el rol y el permiso existan
      const Role = require('./Role');
      const Permission = require('./Permission');
      
      const role = await Role.findByPk(rolePermission.rol_id);
      if (!role) {
        throw new Error('El rol especificado no existe');
      }
      
      const permission = await Permission.findByPk(rolePermission.permission_id);
      if (!permission) {
        throw new Error('El permiso especificado no existe');
      }
    }
  }
});

/**
 * Método de clase para asignar permiso a un rol
 */
RolePermission.assignPermission = async function(rolId, permissionId, userId = null) {
  // Verificar si ya existe la asignación
  const existing = await this.findOne({
    where: {
      rol_id: rolId,
      permission_id: permissionId
    }
  });
  
  if (existing) {
    return { success: false, message: 'El permiso ya está asignado a este rol' };
  }
  
  // Crear la asignación
  const assignment = await this.create({
    rol_id: rolId,
    permission_id: permissionId,
    asignado_por: userId,
    fecha_asignacion: new Date()
  });
  
  return { success: true, data: assignment };
};

/**
 * Método de clase para remover permiso de un rol
 */
RolePermission.removePermission = async function(rolId, permissionId) {
  const deleted = await this.destroy({
    where: {
      rol_id: rolId,
      permission_id: permissionId
    }
  });
  
  if (deleted === 0) {
    return { success: false, message: 'La asignación no existe' };
  }
  
  return { success: true, message: 'Permiso removido del rol correctamente' };
};

/**
 * Método de clase para asignar múltiples permisos a un rol
 */
RolePermission.assignMultiplePermissions = async function(rolId, permissionIds, userId = null) {
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  for (const permissionId of permissionIds) {
    try {
      const result = await this.assignPermission(rolId, permissionId, userId);
      
      if (result.success) {
        results.success.push(permissionId);
      } else {
        results.skipped.push({ permissionId, reason: result.message });
      }
    } catch (error) {
      results.failed.push({ permissionId, error: error.message });
    }
  }
  
  return results;
};

/**
 * Método de clase para sincronizar permisos de un rol (reemplazar todos)
 */
RolePermission.syncPermissions = async function(rolId, permissionIds, userId = null) {
  const transaction = await sequelize.transaction();
  
  try {
    // Eliminar todas las asignaciones actuales
    await this.destroy({
      where: { rol_id: rolId },
      transaction
    });
    
    // Crear las nuevas asignaciones
    const assignments = permissionIds.map(permissionId => ({
      rol_id: rolId,
      permission_id: permissionId,
      asignado_por: userId,
      fecha_asignacion: new Date()
    }));
    
    await this.bulkCreate(assignments, { transaction });
    
    await transaction.commit();
    
    return { success: true, count: assignments.length };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Método de clase para obtener todos los permisos de un rol
 */
RolePermission.getPermissionsByRole = async function(rolId) {
  const Permission = require('./Permission');
  
  const assignments = await this.findAll({
    where: { rol_id: rolId },
    include: [{
      model: Permission,
      as: 'permission'
    }]
  });
  
  return assignments.map(a => a.permission);
};

/**
 * Método de clase para obtener todos los roles que tienen un permiso
 */
RolePermission.getRolesByPermission = async function(permissionId) {
  const Role = require('./Role');
  
  const assignments = await this.findAll({
    where: { permission_id: permissionId },
    include: [{
      model: Role,
      as: 'role'
    }]
  });
  
  return assignments.map(a => a.role);
};

/**
 * Método de clase para verificar si un rol tiene un permiso específico
 */
RolePermission.roleHasPermission = async function(rolId, permissionCodigo) {
  const Permission = require('./Permission');
  
  const permission = await Permission.findOne({
    where: { codigo: permissionCodigo }
  });
  
  if (!permission) {
    return false;
  }
  
  const count = await this.count({
    where: {
      rol_id: rolId,
      permission_id: permission.id
    }
  });
  
  return count > 0;
};

module.exports = RolePermission;
