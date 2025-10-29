const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Modelo: AreaDocumentCategory
 * Descripción: Categorías de documentos personalizables por área
 * Cada área puede crear sus propias categorías (Oficio, Solicitud, Memo, etc.)
 */
const AreaDocumentCategory = sequelize.define('AreaDocumentCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  areaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'area_id',
    comment: 'Área a la que pertenece esta categoría'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nombre de la categoría (ej: Oficio, Solicitud, Memo)'
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Código corto para la categoría (ej: OFI, SOL, MEM)'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de la categoría'
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#0066CC',
    field: 'color',
    comment: 'Color para identificación visual (hex)'
  },
  icono: {
    type: DataTypes.STRING(50),
    defaultValue: 'file',
    field: 'icono',
    comment: 'Icono Font Awesome'
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'orden',
    comment: 'Orden de visualización'
  },
  requiereAdjunto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'requiere_adjunto',
    comment: 'Si esta categoría requiere archivos adjuntos'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Si la categoría está activa'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    comment: 'Usuario que creó la categoría'
  }
}, {
  tableName: 'area_document_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_area_id',
      fields: ['area_id']
    },
    {
      name: 'idx_is_active',
      fields: ['is_active']
    },
    {
      name: 'idx_orden',
      fields: ['orden']
    },
    {
      name: 'unique_area_codigo',
      unique: true,
      fields: ['area_id', 'codigo']
    }
  ]
});

module.exports = AreaDocumentCategory;
