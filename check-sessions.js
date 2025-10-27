const { UserSession, User } = require('./models');

async function checkSessions() {
  try {
    const sessions = await UserSession.findAll({
      where: { isActive: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'email']
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    console.log('\n📋 Sesiones activas:');
    console.log('==================');
    
    if (sessions.length === 0) {
      console.log('❌ No hay sesiones activas');
    } else {
      sessions.forEach(s => {
        console.log(`\n🔑 Sesión ID: ${s.id}`);
        console.log(`   Usuario: ${s.user.nombre} (${s.user.email})`);
        console.log(`   JTI: ${s.jti.substring(0, 20)}...`);
        console.log(`   Expira: ${s.expiresAt}`);
        console.log(`   IP: ${s.ipAddress}`);
      });
    }
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSessions();
