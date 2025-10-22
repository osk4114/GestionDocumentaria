const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Sender = sequelize.define('Sender', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombreCompleto: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'nombre_completo'
  },
  tipoDocumento: {
    type: DataTypes.ENUM('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'),
    allowNull: false,
    field: 'tipo_documento'
  },
  numeroDocumento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'numero_documento'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'senders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Sender;
