const { sequelize } = require('./models');

async function fixExpiresAt() {
  try {
    console.log('\n🔧 Reparando campo expires_at...');
    
    // Modificar la columna para quitar ON UPDATE current_timestamp()
    await sequelize.query(`
      ALTER TABLE user_sessions 
      MODIFY COLUMN expires_at TIMESTAMP NOT NULL 
      COMMENT 'Fecha de expiración del token'
    `);
    
    console.log('✅ Campo expires_at reparado exitosamente');
    console.log('   - Removido: ON UPDATE current_timestamp()');
    console.log('   - Ahora expires_at NO se modificará automáticamente');
    
    // Verificar la nueva estructura
    const [results] = await sequelize.query('SHOW CREATE TABLE user_sessions');
    console.log('\n📋 Nueva estructura de expires_at:');
    const createTable = results[0]['Create Table'];
    const expiresAtLine = createTable.split('\n').find(line => line.includes('expires_at'));
    console.log(expiresAtLine);
    
    console.log('\n✅ Reparación completada. Reinicia el servidor backend.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixExpiresAt();
