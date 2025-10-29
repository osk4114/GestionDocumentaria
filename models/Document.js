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
    allowNull: true, // Permitir NULL para documentos sin clasificar desde mesa de partes
    field: 'doc_type_id'
  },
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Categoría personalizada del área
    field: 'categoria_id'
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
  fechaLimite: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'fecha_limite'
  },
  fechaRecepcion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_recepcion'
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Document;
