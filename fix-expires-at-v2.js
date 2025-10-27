const { sequelize } = require('./models');

async function fixExpiresAt() {
  try {
    console.log('\n🔧 Reparando campo expires_at (v2)...');
    
    // Verificar estructura actual
    const [before] = await sequelize.query('SHOW CREATE TABLE user_sessions');
    console.log('\n📋 ANTES:');
    const beforeLine = before[0]['Create Table'].split('\n').find(line => line.includes('expires_at'));
    console.log(beforeLine);
    
    // Modificar la columna sin ON UPDATE
    await sequelize.query(`
      ALTER TABLE user_sessions 
      MODIFY COLUMN expires_at TIMESTAMP NOT NULL 
      DEFAULT '1970-01-01 00:00:01'
      COMMENT 'Fecha de expiración del token'
    `);
    
    console.log('\n✅ Comando ALTER TABLE ejecutado');
    
    // Verificar la nueva estructura
    const [after] = await sequelize.query('SHOW CREATE TABLE user_sessions');
    console.log('\n📋 DESPUÉS:');
    const afterLine = after[0]['Create Table'].split('\n').find(line => line.includes('expires_at'));
    console.log(afterLine);
    
    if (afterLine.includes('ON UPDATE')) {
      console.log('\n⚠️ WARNING: ON UPDATE todavía presente. Intentando método alternativo...');
      
      // Método alternativo: Recrear la columna
      await sequelize.query(`
        ALTER TABLE user_sessions 
        CHANGE COLUMN expires_at expires_at_temp TIMESTAMP NOT NULL
      `);
      
      await sequelize.query(`
        ALTER TABLE user_sessions 
        CHANGE COLUMN expires_at_temp expires_at TIMESTAMP NOT NULL
        COMMENT 'Fecha de expiración del token'
      `);
      
      const [final] = await sequelize.query('SHOW CREATE TABLE user_sessions');
      const finalLine = final[0]['Create Table'].split('\n').find(line => line.includes('expires_at'));
      console.log('\n📋 RESULTADO FINAL:');
      console.log(finalLine);
    }
    
    console.log('\n✅ Proceso completado. Reinicia el servidor backend.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixExpiresAt();
