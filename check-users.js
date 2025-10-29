/**
 * Script para verificar usuarios en la base de datos
 */

const { pool } = require('./config/database');

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    const [users] = await pool.query(`
      SELECT * FROM users LIMIT 5
    `);

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${users.length} usuarios:\n`);
    
    users.forEach(user => {
      console.log('Usuario:', JSON.stringify(user, null, 2));
      console.log('---\n');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
