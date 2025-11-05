/**
 * Script para probar el endpoint de permisos
 */

const testPermissions = async () => {
  const apiUrl = 'http://localhost:3000/api';
  
  console.log('🔐 Probando endpoint de permisos...\n');

  try {
    // 1. Login para obtener token
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sgd.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    // 2. Obtener permisos disponibles
    console.log('📋 Obteniendo permisos disponibles...');
    const permissionsResponse = await fetch(`${apiUrl}/roles/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const permissionsData = await permissionsResponse.json();
    
    if (permissionsData.success) {
      console.log(`✅ ${permissionsData.count} permisos obtenidos`);
      console.log('\n📁 CATEGORÍAS DISPONIBLES:');
      
      Object.keys(permissionsData.grouped).forEach(categoria => {
        const permisos = permissionsData.grouped[categoria];
        console.log(`\n${categoria.toUpperCase()} (${permisos.length} permisos):`);
        permisos.slice(0, 3).forEach(p => {
          console.log(`  ✓ ${p.codigo} - ${p.nombre}`);
        });
        if (permisos.length > 3) {
          console.log(`  ... y ${permisos.length - 3} más`);
        }
      });

      // 3. Probar creación de rol con permisos
      console.log('\n🆕 Creando rol de prueba con permisos...');
      const roleResponse = await fetch(`${apiUrl}/roles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          nombre: 'Editor de Documentos',
          descripcion: 'Puede ver y editar documentos de su área',
          puede_asignar_permisos: false,
          permisos: [1, 2, 3, 41, 42, 43] // IDs de ejemplo
        })
      });

      const roleData = await roleResponse.json();
      
      if (roleData.success) {
        console.log('✅ Rol creado exitosamente');
        console.log(`📝 Nombre: ${roleData.data.nombre}`);
        console.log(`🔒 Permisos asignados: ${roleData.data.permissions?.length || 0}`);
        
        if (roleData.data.permissions && roleData.data.permissions.length > 0) {
          console.log('\nPermisos del rol:');
          roleData.data.permissions.forEach(p => {
            console.log(`  ✓ [${p.categoria}] ${p.codigo} - ${p.nombre}`);
          });
        }
      } else {
        console.error('❌ Error creando rol:', roleData.message);
      }
    } else {
      console.error('❌ Error obteniendo permisos:', permissionsData.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testPermissions();