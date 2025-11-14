const mysql = require('mysql2');
require('dotenv').config();

// Configuración de conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sgd_db',
  port: process.env.DB_PORT || 3306
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Promisificar para usar async/await
const promisePool = pool.promise();

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✓ Conexión exitosa a MySQL');
    connection.release();
  } catch (error) {
    console.error('✗ Error al conectar a MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
  dbConfig
};
