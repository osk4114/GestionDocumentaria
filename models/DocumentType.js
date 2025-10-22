const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requiereAdjunto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'requiere_adjunto'
  },
  diasMaxAtencion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'dias_max_atencion'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'document_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DocumentType;
