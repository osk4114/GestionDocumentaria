/**
 * Script de prueba: Login y verificación de permisos
 * Simula el flujo completo de autenticación y carga de permisos
 */

const testLogin = async () => {
  const apiUrl = 'http://localhost:3000/api';
  
  // Credenciales de prueba
  const credentials = {
    email: 'admin@sgd.com',
    password: 'admin123'
  };

  console.log('🔐 Iniciando prueba de login con permisos...\n');
  console.log('📧 Email:', credentials.email);
  console.log('🔑 Password:', credentials.password);
  console.log('');

  try {
    // 1. Login
    console.log('1️⃣ Enviando solicitud de login...');
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Error en login:', error.message);
      return;
    }

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login fallido:', loginData.message);
      return;
    }

    console.log('✅ Login exitoso\n');

    // 2. Verificar estructura de respuesta
    const { token, user, permissions } = loginData.data;
    
    console.log('👤 Usuario:', user.nombre);
    console.log('📧 Email:', user.email);
    console.log('🏢 Área:', user.area?.nombre || 'Sin área');
    console.log('👥 Rol:', user.role?.nombre || 'Sin rol');
    console.log('');

    // 3. Verificar permisos
    console.log('🔒 PERMISOS DEL USUARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (permissions && permissions.length > 0) {
      console.log(`✅ Se encontraron ${permissions.length} permisos\n`);
      
      // Agrupar por categoría
      const permisosPorCategoria = {};
      
      user.role.permissions.forEach(p => {
        if (!permisosPorCategoria[p.categoria]) {
          permisosPorCategoria[p.categoria] = [];
        }
        permisosPorCategoria[p.categoria].push(p);
      });

      // Mostrar por categoría
      Object.keys(permisosPorCategoria).sort().forEach(categoria => {
        console.log(`\n📁 ${categoria.toUpperCase()}`);
        permisosPorCategoria[categoria].forEach(p => {
          console.log(`   ✓ ${p.codigo.padEnd(30)} - ${p.nombre}`);
        });
      });

      console.log('\n');
      console.log('📋 Array de códigos de permisos:');
      console.log(JSON.stringify(permissions, null, 2));
    } else {
      console.log('⚠️  No se encontraron permisos');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 4. Probar endpoint de perfil
    console.log('\n2️⃣ Probando endpoint /auth/me...');
    const profileResponse = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileResponse.ok) {
      console.error('❌ Error al obtener perfil');
      return;
    }

    const profileData = await profileResponse.json();
    
    if (profileData.success) {
      console.log('✅ Perfil obtenido correctamente');
      console.log('📊 Permisos desde perfil:', profileData.data.permissions?.length || 0);
    }

    // 5. Resumen para el frontend
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 INTEGRACIÓN CON ANGULAR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nEn AuthService.login():');
    console.log('  ✓ loginData.data.permissions contiene:', permissions ? `${permissions.length} permisos` : 'undefined');
    console.log('  ✓ permissionService.setPermissions(permissions)');
    console.log('\nEn componentes:');
    console.log('  ✓ *hasPermission="\'documents.view.all\'"');
    console.log('  ✓ *hasAnyPermission="[\'users.view.all\', \'users.view.area\']"');
    console.log('\nEn routes:');
    console.log('  ✓ canActivate: [permissionGuard]');
    console.log('  ✓ data: { requiredPermission: \'users.view.all\' }');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    console.error(error);
  }
};

// Ejecutar prueba
testLogin();