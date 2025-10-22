const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
const LoginAttempt = sequelize.define('LoginAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si el intento fue exitoso'
  },
  attemptedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'attempted_at'
  }
}, {
  tableName: 'login_attempts',
  timestamps: false,
  indexes: [
    { fields: ['email'] },
    { fields: ['ip_address'] },
    { fields: ['attempted_at'] }
  ]
});

return LoginAttempt;
};
