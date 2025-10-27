const { sequelize } = require('./models');

async function checkSchema() {
  try {
    const [results] = await sequelize.query(`
      SHOW CREATE TABLE user_sessions
    `);
    
    console.log('\n📋 ESTRUCTURA DE LA TABLA user_sessions:');
    console.log('='.repeat(80));
    console.log(results[0]['Create Table']);
    console.log('='.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
