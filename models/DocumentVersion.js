const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Modelo: DocumentVersion
 * Descripción: Historial de versiones de documentos
 * Permite subir documentos actualizados con sellos y firmas
 */
const DocumentVersion = sequelize.define('DocumentVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'document_id',
    comment: 'Documento al que pertenece esta versión'
  },
  versionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'version_number',
    comment: 'Número de versión (1, 2, 3...)'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name',
    comment: 'Nombre del archivo en el servidor'
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
    comment: 'Nombre original del archivo'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
    comment: 'Ruta completa del archivo'
  },
  fileType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'file_type',
    comment: 'Tipo MIME del archivo'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
    comment: 'Tamaño del archivo en bytes'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de esta versión (ej: "Con sello y firma del jefe")'
  },
  tieneSello: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'tiene_sello',
    comment: 'Indica si tiene sello'
  },
  tieneFirma: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'tiene_firma',
    comment: 'Indica si tiene firma'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'uploaded_by',
    comment: 'Usuario que subió esta versión'
  },
  areaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'area_id',
    comment: 'Área que subió esta versión'
  },
  uploadedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'uploaded_at'
  }
}, {
  tableName: 'document_versions',
  timestamps: false,
  indexes: [
    {
      name: 'idx_document_id',
      fields: ['document_id']
    },
    {
      name: 'idx_version_number',
      fields: ['version_number']
    },
    {
      name: 'idx_uploaded_at',
      fields: ['uploaded_at']
    },
    {
      name: 'unique_document_version',
      unique: true,
      fields: ['document_id', 'version_number']
    }
  ]
});

module.exports = DocumentVersion;
