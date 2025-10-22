const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const DocumentMovement = sequelize.define('DocumentMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'document_id'
  },
  fromAreaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'from_area_id'
  },
  toAreaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'to_area_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  accion: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  observacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'document_movements',
  timestamps: false
});

module.exports = DocumentMovement;
