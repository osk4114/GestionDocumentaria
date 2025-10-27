const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSessionsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sgd_db'
  });

  try {
    console.log('🔧 Reparando tabla user_sessions...');
    
    // Limpiar sesiones antiguas primero
    await connection.execute('DELETE FROM user_sessions WHERE is_active = false OR expires_at < NOW()');
    console.log('✓ Sesiones antiguas eliminadas');
    
    // Resetear auto-increment
    await connection.execute('ALTER TABLE user_sessions AUTO_INCREMENT = 1');
    console.log('✓ Auto-increment reseteado');
    
    // Verificar
    const [rows] = await connection.execute('SHOW TABLE STATUS LIKE "user_sessions"');
    console.log('✓ Auto_increment actual:', rows[0].Auto_increment);
    
    console.log('✅ Tabla reparada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixSessionsTable();
