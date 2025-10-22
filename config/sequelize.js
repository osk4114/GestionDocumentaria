const { Sequelize } = require('sequelize');

// Configuración de Sequelize para MySQL (XAMPP)
const sequelize = new Sequelize('sgd_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  logging: false, // Cambiar a console.log para debug
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

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
