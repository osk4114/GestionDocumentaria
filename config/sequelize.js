const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de Sequelize para MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'sgd_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false, // Cambiar a console.log para debug
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión a MySQL establecida correctamente con Sequelize');
  } catch (error) {
    console.error('✗ Error al conectar a MySQL con Sequelize:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
