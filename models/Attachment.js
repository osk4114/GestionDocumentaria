const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Attachment = sequelize.define('Attachment', {
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
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path'
  },
  fileType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'file_type'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'uploaded_by'
  },
  uploadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'uploaded_at'
  }
}, {
  tableName: 'attachments',
  timestamps: false
});

module.exports = Attachment;
