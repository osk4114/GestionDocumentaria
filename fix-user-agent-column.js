/**
 * Script para agregar la columna user_agent a las tablas que la necesitan
 */
const { sequelize } = require('./models');

async function fixUserAgentColumn() {
  console.log('🔧 Iniciando corrección de columnas...\n');

  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión establecida\n');

    // Verificar y agregar columna user_agent a user_sessions
    console.log('📝 Verificando columna user_agent en user_sessions...');
    try {
      await sequelize.query(`
        ALTER TABLE user_sessions 
        ADD COLUMN user_agent TEXT 
        COMMENT 'Información del navegador/dispositivo'
      `);
      console.log('✓ Columna user_agent agregada a user_sessions\n');
    } catch (error) {
      if (error.original?.errno === 1060) {
        console.log('⚠️  Columna user_agent ya existe en user_sessions\n');
      } else {
        throw error;
      }
    }

    // Verificar y agregar columna user_agent a login_attempts
    console.log('📝 Verificando columna user_agent en login_attempts...');
    try {
      await sequelize.query(`
        ALTER TABLE login_attempts 
        ADD COLUMN user_agent TEXT
      `);
      console.log('✓ Columna user_agent agregada a login_attempts\n');
    } catch (error) {
      if (error.original?.errno === 1060) {
        console.log('⚠️  Columna user_agent ya existe en login_attempts\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Corrección completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error al corregir columnas:', error.message);
    process.exit(1);
  }
}

fixUserAgentColumn();
