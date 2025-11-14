const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentCargo = sequelize.define('DocumentCargo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  areaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'area_id'
  },
  versionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'version_id'
  },
  customName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'custom_name'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  }
}, {
  tableName: 'document_cargos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DocumentCargo;
