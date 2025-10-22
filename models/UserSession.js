const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
const UserSession = sequelize.define('UserSession', {
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
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  jti: {
    type: DataTypes.STRING(36), // UUID
    allowNull: false,
    unique: true,
    comment: 'JWT ID único para identificar el token'
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token',
    comment: 'Token de renovación'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'Dirección IP del cliente'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
    comment: 'Información del navegador/dispositivo'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'Si la sesión está activa'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
    comment: 'Fecha de expiración del token'
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_activity',
    comment: 'Última actividad registrada'
  }
}, {
  tableName: 'user_sessions',
  timestamps: true,
  underscored: true, // Usar snake_case para todas las columnas
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['jti'] },
    { fields: ['token'], unique: true },
    { fields: ['expires_at'] },
    { fields: ['is_active'] }
  ]
});

return UserSession;
};
