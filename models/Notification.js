const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'document_id'
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  mensaje: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'read_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;
