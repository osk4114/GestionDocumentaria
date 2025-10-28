const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Crear conexión
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // XAMPP sin contraseña
      database: 'sgd_db'
    });

    console.log('✓ Conectado a la base de datos');

    // Verificar que la columna existe antes de eliminarla
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM documents WHERE Field = 'prioridad'
    `);

    if (columns.length === 0) {
      console.log('⚠ La columna prioridad no existe en la tabla documents');
      return;
    }

    console.log('✓ Columna prioridad encontrada');

    // Ejecutar migración
    await connection.query('ALTER TABLE documents DROP COLUMN prioridad');
    console.log('✓ Columna prioridad eliminada exitosamente');

    // Verificar que se eliminó
    const [verifyColumns] = await connection.query(`
      SHOW COLUMNS FROM documents WHERE Field = 'prioridad'
    `);

    if (verifyColumns.length === 0) {
      console.log('✓ Migración verificada: columna prioridad eliminada correctamente');
    } else {
      console.log('✗ Error: la columna todavía existe');
    }

    // Mostrar estructura actual de la tabla
    const [tableColumns] = await connection.query('DESCRIBE documents');
    console.log('\n📋 Estructura actual de la tabla documents:');
    console.log('Columnas:', tableColumns.map(col => col.Field).join(', '));

  } catch (error) {
    console.error('✗ Error durante la migración:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexión cerrada');
    }
  }
}

// Ejecutar migración
runMigration()
  .then(() => {
    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migración fallida:', error);
    process.exit(1);
  });
