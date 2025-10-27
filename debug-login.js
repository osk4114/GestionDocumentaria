const { User, Role, Area, UserSession } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'sgd_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

async function debugLogin() {
  try {
    console.log('\n🔍 DEBUG LOGIN');
    console.log('='.repeat(60));
    
    // Buscar usuario admin
    const user = await User.findOne({
      where: { email: 'admin@sgd.com' },
      include: [
        { model: Role, as: 'role' },
        { model: Area, as: 'area' }
      ]
    });
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }
    
    console.log(`✅ Usuario encontrado: ${user.nombre} (ID: ${user.id})`);
    console.log(`   Rol: ${user.role.nombre}`);
    console.log(`   Área: ${user.area.nombre}`);
    
    // Simular creación de sesión
    const jti = uuidv4();
    const ipAddress = '127.0.0.1';
    const userAgent = 'Debug Script';
    
    console.log('\n📅 Calculando fecha de expiración:');
    console.log(`   JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}`);
    
    const now = new Date();
    console.log(`   Fecha actual (now): ${now}`);
    console.log(`   Fecha actual (ISO): ${now.toISOString()}`);
    console.log(`   Fecha actual (timestamp): ${now.getTime()}`);
    
    const expiresAt = new Date();
    const hours = parseInt(JWT_EXPIRES_IN.replace('h', ''));
    console.log(`   Horas a agregar: ${hours}`);
    
    expiresAt.setHours(expiresAt.getHours() + hours);
    console.log(`   Expira en (expiresAt): ${expiresAt}`);
    console.log(`   Expira en (ISO): ${expiresAt.toISOString()}`);
    console.log(`   Expira en (timestamp): ${expiresAt.getTime()}`);
    console.log(`   Diferencia: ${(expiresAt.getTime() - now.getTime()) / 1000 / 60 / 60} horas`);
    
    // Generar tokens
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role.nombre,
        jti
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id, jti, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    
    console.log('\n💾 Creando sesión en BD...');
    
    // Crear sesión
    const session = await UserSession.create({
      userId: user.id,
      token,
      jti,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt,
      isActive: true
    });
    
    console.log(`✅ Sesión creada (ID: ${session.id})`);
    console.log(`   JTI: ${session.jti}`);
    console.log(`   Activa: ${session.isActive}`);
    console.log(`   Expira en BD: ${session.expiresAt}`);
    console.log(`   Expira en BD (ISO): ${new Date(session.expiresAt).toISOString()}`);
    
    // Verificar comparación de fechas
    console.log('\n🔍 Verificando comparación de fechas:');
    const nowCheck = new Date();
    console.log(`   Fecha actual: ${nowCheck}`);
    console.log(`   Fecha expiración: ${session.expiresAt}`);
    console.log(`   ¿Expiró? ${nowCheck > session.expiresAt ? 'SÍ ❌' : 'NO ✅'}`);
    
    // Buscar sesión como lo hace el middleware
    console.log('\n🔍 Buscando sesión como el middleware:');
    const foundSession = await UserSession.findOne({
      where: {
        jti: session.jti,
        isActive: true
      }
    });
    
    if (!foundSession) {
      console.error('❌ Sesión no encontrada');
    } else {
      console.log('✅ Sesión encontrada');
      console.log(`   Expira en: ${foundSession.expiresAt}`);
      console.log(`   ¿Expiró? ${new Date() > foundSession.expiresAt ? 'SÍ ❌' : 'NO ✅'}`);
    }
    
    // Cleanup
    console.log('\n🧹 Limpiando sesión de prueba...');
    await session.destroy();
    console.log('✅ Sesión eliminada');
    
    console.log('\n' + '='.repeat(60));
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugLogin();
