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
  // Campos para persona natural
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  apellidoPaterno: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'apellido_paterno'
  },
  apellidoMaterno: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'apellido_materno'
  },
  // Campos para persona jurídica
  ruc: {
    type: DataTypes.STRING(11),
    allowNull: true
  },
  nombreEmpresa: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'nombre_empresa'
  },
  // Campos para representante legal (persona jurídica)
  representanteTipoDoc: {
    type: DataTypes.ENUM('DNI', 'CE', 'PASAPORTE'),
    allowNull: true,
    field: 'representante_tipo_doc'
  },
  representanteNumDoc: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'representante_num_doc'
  },
  representanteNombres: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'representante_nombres'
  },
  representanteApellidoPaterno: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'representante_apellido_paterno'
  },
  representanteApellidoMaterno: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'representante_apellido_materno'
  },
  // Campos de dirección detallada
  departamento: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  provincia: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  distrito: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  direccionCompleta: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'direccion_completa'
  },
  // Campos originales
  tipoDocumento: {
    type: DataTypes.ENUM('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA', 'CE'),
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
