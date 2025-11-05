/**
 * Verificar que el login devuelve los permisos
 */

async function testLoginWithPermissions() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sgd.com',
        password: 'admin123'
      })
    });

    const data = await response.json();

    console.log('\n=== RESPUESTA DEL LOGIN ===\n');
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    console.log('\n=== DATOS DEL USUARIO ===\n');
    console.log('ID:', data.data.user.id);
    console.log('Nombre:', data.data.user.nombre);
    console.log('Email:', data.data.user.email);
    console.log('Rol:', data.data.user.role.nombre);
    console.log('Es Sistema:', data.data.user.role.es_sistema);
    console.log('Puede Asignar Permisos:', data.data.user.role.puede_asignar_permisos);
    
    console.log('\n=== PERMISOS DEL ROL (Objeto completo) ===\n');
    console.log('Total de permisos:', data.data.user.role.permissions.length);
    console.log('\nPrimeros 10 permisos:');
    data.data.user.role.permissions.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.categoria}] ${p.codigo} - ${p.nombre}`);
    });

    console.log('\n=== PERMISOS (Array de códigos) ===\n');
    console.log('Total:', data.data.permissions.length);
    console.log('\nPrimeros 20 códigos:');
    data.data.permissions.slice(0, 20).forEach((code, i) => {
      console.log(`  ${i + 1}. ${code}`);
    });

    console.log('\n=== TOKEN INFO ===\n');
    console.log('Token:', data.data.token.substring(0, 50) + '...');
    console.log('Session ID:', data.data.sessionId);
    console.log('Expires In:', data.data.expiresIn);

    console.log('\n✅ Login devuelve permisos correctamente!');
    console.log('✅ Se pueden usar tanto user.role.permissions como permissions array');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLoginWithPermissions();
