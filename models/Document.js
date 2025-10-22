const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  trackingCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'tracking_code'
  },
  asunto: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id'
  },
  docTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'doc_type_id'
  },
  statusId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'status_id'
  },
  currentAreaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'current_area_id'
  },
  currentUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'current_user_id'
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'normal', 'alta', 'urgente'),
    defaultValue: 'normal',
    allowNull: false
  },
  fechaLimite: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fecha_limite'
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Document;
