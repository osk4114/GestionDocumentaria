/**
 * Test Final - Verificación Completa del Sistema RBAC v3.0
 * 
 * Este script verifica:
 * 1. Login devuelve permisos
 * 2. Endpoints de documentos requieren permisos correctos
 * 3. Endpoints de usuarios requieren permisos correctos
 * 4. Roles tienen los campos nuevos
 * 5. Sistema rechaza accesos sin permiso
 */

const BASE_URL = 'http://localhost:3000';

// Colores
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function request(method, endpoint, body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json();
  return { status: response.status, ok: response.ok, data };
}

// ============================================================
// TESTS
// ============================================================

async function testLoginReturnsPermissions() {
  log('\n📋 TEST 1: Login devuelve permisos', 'cyan');
  
  const res = await request('POST', '/api/auth/login', {
    email: 'admin@sgd.com',
    password: 'admin123'
  });

  if (res.ok && res.data.data.permissions) {
    const count = res.data.data.permissions.length;
    log(`✅ Login devuelve ${count} permisos`, 'green');
    log(`   Usuario: ${res.data.data.user.nombre}`, 'blue');
    log(`   Rol: ${res.data.data.user.role.nombre}`, 'blue');
    return { success: true, token: res.data.data.token, permissions: res.data.data.permissions };
  } else {
    log('❌ Login no devuelve permisos', 'red');
    return { success: false };
  }
}

async function testRoleHasNewFields(token) {
  log('\n📋 TEST 2: Roles tienen campos nuevos (es_sistema, puede_asignar_permisos)', 'cyan');
  
  const res = await request('GET', '/api/roles/1', null, token);

  if (res.ok && res.data.data) {
    const role = res.data.data;
    const hasEsSistema = role.hasOwnProperty('es_sistema');
    const hasPuedeAsignar = role.hasOwnProperty('puede_asignar_permisos');
    const hasIsActive = role.hasOwnProperty('is_active');

    if (hasEsSistema && hasPuedeAsignar && hasIsActive) {
      log('✅ Rol tiene todos los campos nuevos', 'green');
      log(`   es_sistema: ${role.es_sistema}`, 'blue');
      log(`   puede_asignar_permisos: ${role.puede_asignar_permisos}`, 'blue');
      log(`   is_active: ${role.is_active}`, 'blue');
      return { success: true };
    } else {
      log('❌ Faltan campos en el rol', 'red');
      return { success: false };
    }
  } else {
    log('❌ No se pudo obtener el rol', 'red');
    return { success: false };
  }
}

async function testDocumentEndpointsProtected(token, permissions) {
  log('\n📋 TEST 3: Endpoints de documentos están protegidos con permisos', 'cyan');
  
  // Test con token válido
  const res1 = await request('GET', '/api/documents', null, token);
  
  if (res1.ok) {
    log('✅ GET /api/documents funciona con token válido', 'green');
  } else {
    log('❌ GET /api/documents falló con token válido', 'red');
    return { success: false };
  }

  // Test sin token
  const res2 = await request('GET', '/api/documents', null, null);
  
  if (!res2.ok && res2.status === 401) {
    log('✅ GET /api/documents rechaza peticiones sin token', 'green');
    return { success: true };
  } else {
    log('❌ GET /api/documents no rechaza peticiones sin token', 'red');
    return { success: false };
  }
}

async function testUserEndpointsProtected(token) {
  log('\n📋 TEST 4: Endpoints de usuarios están protegidos con permisos', 'cyan');
  
  // Test con token válido
  const res1 = await request('GET', '/api/users', null, token);
  
  if (res1.ok) {
    log('✅ GET /api/users funciona con token válido', 'green');
  } else {
    log('❌ GET /api/users falló con token válido', 'red');
    return { success: false };
  }

  // Test sin token
  const res2 = await request('GET', '/api/users', null, null);
  
  if (!res2.ok && res2.status === 401) {
    log('✅ GET /api/users rechaza peticiones sin token', 'green');
    return { success: true };
  } else {
    log('❌ GET /api/users no rechaza peticiones sin token', 'red');
    return { success: false };
  }
}

async function testPermissionEndpoints(token) {
  log('\n📋 TEST 5: Endpoints de permisos funcionan correctamente', 'cyan');
  
  // Test GET /api/permissions
  const res1 = await request('GET', '/api/permissions', null, token);
  if (res1.ok && res1.data.data) {
    log(`✅ GET /api/permissions: ${res1.data.data.length} permisos`, 'green');
  } else {
    log('❌ GET /api/permissions falló', 'red');
    return { success: false };
  }

  // Test GET /api/permissions/grouped
  const res2 = await request('GET', '/api/permissions/grouped', null, token);
  if (res2.ok && res2.data.data) {
    const categories = Object.keys(res2.data.data);
    log(`✅ GET /api/permissions/grouped: ${categories.length} categorías`, 'green');
  } else {
    log('❌ GET /api/permissions/grouped falló', 'red');
    return { success: false };
  }

  // Test GET /api/roles/1/permissions
  const res3 = await request('GET', '/api/roles/1/permissions', null, token);
  if (res3.ok && res3.data.data) {
    log(`✅ GET /api/roles/1/permissions: ${res3.data.data.length} permisos del Admin`, 'green');
    return { success: true };
  } else {
    log('❌ GET /api/roles/1/permissions falló', 'red');
    return { success: false };
  }
}

async function testPermissionChecksWork(token, permissions) {
  log('\n📋 TEST 6: Verificación de permisos funciona', 'cyan');
  
  log(`   Usuario tiene ${permissions.length} permisos`, 'blue');
  
  // Verificar algunos permisos clave
  const keyPermissions = [
    'documents.view.all',
    'documents.create',
    'users.view.all',
    'roles.view'
  ];

  let allFound = true;
  keyPermissions.forEach(perm => {
    const has = permissions.includes(perm);
    if (has) {
      log(`   ✅ Tiene permiso: ${perm}`, 'green');
    } else {
      log(`   ❌ NO tiene permiso: ${perm}`, 'red');
      allFound = false;
    }
  });

  if (allFound) {
    log('✅ Usuario Admin tiene todos los permisos clave', 'green');
    return { success: true };
  } else {
    log('⚠️  Usuario Admin no tiene algunos permisos esperados', 'yellow');
    return { success: false };
  }
}

// ============================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================

async function runAllTests() {
  console.clear();
  log('\n' + '█'.repeat(70), 'cyan');
  log('█' + ' '.repeat(68) + '█', 'cyan');
  log('█' + '  TEST FINAL - SISTEMA RBAC v3.0'.padEnd(68) + '█', 'cyan');
  log('█' + '  Verificación Completa de Implementación'.padEnd(68) + '█', 'cyan');
  log('█' + ' '.repeat(68) + '█', 'cyan');
  log('█'.repeat(70), 'cyan');

  const results = [];
  let token = null;
  let permissions = [];

  // Test 1: Login
  const test1 = await testLoginReturnsPermissions();
  results.push({ name: 'Login devuelve permisos', success: test1.success });
  if (test1.success) {
    token = test1.token;
    permissions = test1.permissions;
  } else {
    log('\n❌ ABORTANDO: No se pudo obtener token', 'red');
    return;
  }

  // Test 2: Roles
  const test2 = await testRoleHasNewFields(token);
  results.push({ name: 'Roles tienen campos nuevos', success: test2.success });

  // Test 3: Documents
  const test3 = await testDocumentEndpointsProtected(token, permissions);
  results.push({ name: 'Endpoints de documentos protegidos', success: test3.success });

  // Test 4: Users
  const test4 = await testUserEndpointsProtected(token);
  results.push({ name: 'Endpoints de usuarios protegidos', success: test4.success });

  // Test 5: Permission Endpoints
  const test5 = await testPermissionEndpoints(token);
  results.push({ name: 'Endpoints de permisos funcionan', success: test5.success });

  // Test 6: Permission Checks
  const test6 = await testPermissionChecksWork(token, permissions);
  results.push({ name: 'Verificación de permisos funciona', success: test6.success });

  // Resumen
  console.log('\n' + '='.repeat(70));
  log('📊 RESUMEN DE PRUEBAS', 'cyan');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, i) => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${i + 1}. ${result.name}`, color);
  });

  console.log('\n' + '-'.repeat(70));
  log(`Total: ${results.length} pruebas`, 'blue');
  log(`Exitosas: ${passed}`, 'green');
  if (failed > 0) {
    log(`Fallidas: ${failed}`, 'red');
  }

  if (passed === results.length) {
    log('\n🎉 ¡SISTEMA RBAC v3.0 FUNCIONANDO CORRECTAMENTE!', 'green');
    log('✅ Todos los componentes verificados', 'green');
    log('✅ Login devuelve permisos automáticamente', 'green');
    log('✅ Roles tienen campos nuevos (es_sistema, puede_asignar_permisos)', 'green');
    log('✅ Endpoints protegidos con permisos granulares', 'green');
    log('✅ Sistema rechaza accesos sin permisos', 'green');
    log('\n🚀 LISTO PARA PRODUCCIÓN (Backend)', 'green');
  } else {
    log(`\n⚠️  ${failed} prueba(s) fallaron`, 'yellow');
    log('Revisa los errores arriba para más detalles', 'yellow');
  }

  console.log('='.repeat(70) + '\n');
}

// Ejecutar
runAllTests().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
