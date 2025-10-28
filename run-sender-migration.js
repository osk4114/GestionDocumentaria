const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // XAMPP sin contraseña
    multipleStatements: true
  });

  try {
    console.log('🔌 Conectado a MySQL');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add-sender-fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Ejecutando migración...');
    
    // Ejecutar la migración
    const [results] = await connection.query(sql);
    
    console.log('✅ Migración completada exitosamente');
    
    // Verificar los nuevos campos
    const [fields] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db' 
        AND TABLE_NAME = 'senders'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📊 Campos en tabla senders:');
    fields.forEach(field => {
      console.log(`  - ${field.COLUMN_NAME} (${field.DATA_TYPE}) ${field.COLUMN_COMMENT ? '- ' + field.COLUMN_COMMENT : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
