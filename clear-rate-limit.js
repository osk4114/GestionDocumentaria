/**
 * Script para limpiar intentos de login y permitir nuevas pruebas
 */
const { LoginAttempt, UserSession } = require('./models');

async function clearRateLimit() {
  try {
    console.log('🧹 Limpiando intentos de login...');
    
    const deleted = await LoginAttempt.destroy({
      where: {},
      truncate: true
    });
    
    console.log(`✓ ${deleted} intentos de login eliminados`);
    
    console.log('\n🧹 Limpiando sesiones antiguas...');
    const sessionsDeleted = await UserSession.destroy({
      where: {},
      truncate: true
    });
    
    console.log(`✓ ${sessionsDeleted} sesiones eliminadas`);
    
    console.log('\n✅ Base de datos limpia. Puedes ejecutar los tests ahora.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearRateLimit();
