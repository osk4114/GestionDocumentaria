const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Sender = sequelize.define('Sender', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipoPersona: {
    type: DataTypes.ENUM('natural', 'juridica'),
    allowNull: false,
    defaultValue: 'natural',
    field: 'tipo_persona'
  },
  nombreCompleto: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'nombre_completo'
  },
  tipoDocumento: {
    type: DataTypes.ENUM('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA'),
    allowNull: true,
    field: 'tipo_documento'
  },
  numeroDocumento: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'numero_documento'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
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
