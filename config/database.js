const mysql = require('mysql2');

// Configuración de conexión a MySQL (XAMPP)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // XAMPP por defecto no tiene contraseña
  database: 'sgd_db',
  port: 3306
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
