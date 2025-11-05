/**
 * Script de prueba para endpoints de Permisos (RBAC v3.0)
 * 
 * Ejecutar: node test-permissions-endpoints.js
 * 
 * Requisitos:
 * - Backend corriendo en http://localhost:3000
 * - Base de datos migrada a v3.0
 * - Usuario admin@sgd.com con password admin123
 */

const BASE_URL = 'http://localhost:3000';
let accessToken = '';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log('\n' + '='.repeat(70));
  log(`📋 ${testName}`, 'cyan');
  console.log('='.repeat(70));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Función helper para hacer requests
async function request(method, endpoint, body = null, auth = true) {
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (auth && accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  log(`${method} ${endpoint}`, 'gray');
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    logError(`Error en request: ${error.message}`);
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// ============================================================
// TESTS
// ============================================================

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  logTest('TEST 1: Health Check (Sin autenticación)');
  
  const response = await request('GET', '/api/health', null, false);
  
  if (response.ok && response.data.status === 'OK') {
    logSuccess('Health check exitoso');
    logInfo(`Mensaje: ${response.data.message}`);
    return true;
  } else {
    logError('Health check falló');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 2: Login
 */
async function testLogin() {
  logTest('TEST 2: Login - Obtener Access Token');
  
  const response = await request('POST', '/api/auth/login', {
    email: 'admin@sgd.com',
    password: 'admin123'
  }, false);
  
  if (response.ok && response.data.data && response.data.data.token) {
    accessToken = response.data.data.token;
    logSuccess('Login exitoso');
    logInfo(`Usuario: ${response.data.data.user.nombre}`);
    logInfo(`Rol: ${response.data.data.user.role.nombre}`);
    logInfo(`Access Token obtenido: ${accessToken.substring(0, 30)}...`);
    return true;
  } else {
    logError('Login falló');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 3: Listar todos los permisos
 */
async function testGetAllPermissions() {
  logTest('TEST 3: GET /api/permissions - Listar todos los permisos');
  
  const response = await request('GET', '/api/permissions');
  
  if (response.ok && response.data.success) {
    const count = response.data.data.length;
    logSuccess(`Se obtuvieron ${count} permisos`);
    
    if (count >= 85) {
      logSuccess('✓ Cantidad correcta de permisos (85+)');
    } else {
      logWarning(`⚠ Se esperaban al menos 85 permisos, se obtuvieron ${count}`);
    }
    
    // Mostrar algunos permisos de ejemplo
    logInfo('\nPrimeros 5 permisos:');
    response.data.data.slice(0, 5).forEach((perm, i) => {
      console.log(`  ${i + 1}. [${perm.categoria}] ${perm.codigo} - ${perm.nombre}`);
    });
    
    return true;
  } else {
    logError('Error al obtener permisos');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 4: Permisos agrupados por categoría
 */
async function testGetGroupedPermissions() {
  logTest('TEST 4: GET /api/permissions/grouped - Permisos agrupados');
  
  const response = await request('GET', '/api/permissions/grouped');
  
  if (response.ok && response.data.success) {
    const categories = Object.keys(response.data.data);
    logSuccess(`Permisos agrupados en ${categories.length} categorías`);
    
    logInfo('\nPermisos por categoría:');
    categories.forEach(cat => {
      const count = response.data.data[cat].length;
      console.log(`  - ${cat.toUpperCase()}: ${count} permisos`);
    });
    
    return true;
  } else {
    logError('Error al obtener permisos agrupados');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 5: Permisos de una categoría específica
 */
async function testGetPermissionsByCategory() {
  logTest('TEST 5: GET /api/permissions/category/:categoria - Filtrar por categoría');
  
  const categoria = 'documents';
  const response = await request('GET', `/api/permissions/category/${categoria}`);
  
  if (response.ok && response.data.success) {
    const count = response.data.data.length;
    logSuccess(`Se obtuvieron ${count} permisos de la categoría "${categoria}"`);
    
    logInfo('\nPermisos de DOCUMENTS:');
    response.data.data.slice(0, 10).forEach((perm, i) => {
      console.log(`  ${i + 1}. ${perm.codigo} - ${perm.nombre}`);
    });
    
    if (response.data.data.length > 10) {
      console.log(`  ... y ${response.data.data.length - 10} más`);
    }
    
    return true;
  } else {
    logError('Error al obtener permisos por categoría');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 6: Lista de categorías disponibles
 */
async function testGetCategories() {
  logTest('TEST 6: GET /api/permissions/categories - Lista de categorías');
  
  const response = await request('GET', '/api/permissions/categories');
  
  if (response.ok && response.data.success) {
    const count = response.data.data.length;
    logSuccess(`Se obtuvieron ${count} categorías`);
    
    logInfo('\nCategorías disponibles:');
    response.data.data.forEach((cat, i) => {
      console.log(`  ${i + 1}. ${cat.value} - ${cat.label}`);
    });
    
    return true;
  } else {
    logError('Error al obtener categorías');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 7: Permisos del rol Administrador
 */
async function testGetRolePermissions() {
  logTest('TEST 7: GET /api/roles/:id/permissions - Permisos de Administrador');
  
  const response = await request('GET', '/api/roles/1/permissions');
  
  if (response.ok && response.data.success) {
    const count = response.data.data.length;
    logSuccess(`El rol Administrador tiene ${count} permisos`);
    
    if (count >= 85) {
      logSuccess('✓ Admin tiene todos los permisos del sistema');
    } else {
      logWarning(`⚠ Se esperaban al menos 85 permisos, tiene ${count}`);
    }
    
    // Mostrar algunos permisos
    logInfo('\nAlgunos permisos del Admin:');
    response.data.data.slice(0, 10).forEach((perm, i) => {
      console.log(`  ${i + 1}. [${perm.categoria}] ${perm.codigo}`);
    });
    
    return true;
  } else {
    logError('Error al obtener permisos del rol');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 8: Permisos del rol Jefe de Área
 */
async function testGetJefePermissions() {
  logTest('TEST 8: GET /api/roles/:id/permissions - Permisos de Jefe de Área');
  
  const response = await request('GET', '/api/roles/2/permissions');
  
  if (response.ok && response.data.success) {
    const count = response.data.data.length;
    logSuccess(`El rol Jefe de Área tiene ${count} permisos`);
    
    if (count >= 40 && count <= 50) {
      logSuccess('✓ Jefe tiene la cantidad correcta de permisos (~45)');
    } else {
      logWarning(`⚠ Se esperaban ~45 permisos, tiene ${count}`);
    }
    
    // Agrupar por categoría
    const byCategory = {};
    response.data.data.forEach(perm => {
      if (!byCategory[perm.categoria]) {
        byCategory[perm.categoria] = 0;
      }
      byCategory[perm.categoria]++;
    });
    
    logInfo('\nPermisos por categoría:');
    Object.keys(byCategory).sort().forEach(cat => {
      console.log(`  - ${cat.toUpperCase()}: ${byCategory[cat]} permisos`);
    });
    
    return true;
  } else {
    logError('Error al obtener permisos del Jefe');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 9: Permisos agrupados de un rol
 */
async function testGetRolePermissionsGrouped() {
  logTest('TEST 9: GET /api/roles/:id/permissions?grouped=true - Agrupados por categoría');
  
  const response = await request('GET', '/api/roles/1/permissions?grouped=true');
  
  if (response.ok && response.data.success) {
    const categories = Object.keys(response.data.data);
    logSuccess(`Permisos del Admin agrupados en ${categories.length} categorías`);
    
    logInfo('\nPermisos por categoría:');
    categories.forEach(cat => {
      const perms = response.data.data[cat];
      console.log(`  - ${cat.toUpperCase()}: ${perms.length} permisos`);
    });
    
    return true;
  } else {
    logError('Error al obtener permisos agrupados del rol');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 10: Permisos disponibles (no asignados) para un rol
 */
async function testGetAvailablePermissions() {
  logTest('TEST 10: GET /api/roles/:id/permissions/available - Permisos disponibles');
  
  // Probamos con el Jefe de Área que no tiene todos los permisos
  const response = await request('GET', '/api/roles/2/permissions/available');
  
  if (response.ok && response.data.success) {
    const count = response.data.data.length;
    logSuccess(`Hay ${count} permisos disponibles para asignar al Jefe de Área`);
    
    if (count >= 35) {
      logSuccess('✓ Cantidad correcta de permisos disponibles');
    }
    
    logInfo('\nAlgunos permisos disponibles:');
    response.data.data.slice(0, 10).forEach((perm, i) => {
      console.log(`  ${i + 1}. [${perm.categoria}] ${perm.codigo} - ${perm.nombre}`);
    });
    
    return true;
  } else {
    logError('Error al obtener permisos disponibles');
    console.log(response.data);
    return false;
  }
}

/**
 * Test 11: Detalle de un permiso específico
 */
async function testGetPermissionById() {
  logTest('TEST 11: GET /api/permissions/:id - Detalle de un permiso');
  
  const response = await request('GET', '/api/permissions/1');
  
  if (response.ok && response.data.success) {
    const perm = response.data.data;
    logSuccess('Detalle del permiso obtenido');
    
    logInfo('\nInformación del permiso:');
    console.log(`  ID: ${perm.id}`);
    console.log(`  Código: ${perm.codigo}`);
    console.log(`  Nombre: ${perm.nombre}`);
    console.log(`  Descripción: ${perm.descripcion}`);
    console.log(`  Categoría: ${perm.categoria}`);
    console.log(`  Es sistema: ${perm.es_sistema ? 'Sí' : 'No'}`);
    
    if (perm.roles && perm.roles.length > 0) {
      logInfo('\nRoles con este permiso:');
      perm.roles.forEach(role => {
        console.log(`  - ${role.nombre}`);
      });
    }
    
    return true;
  } else {
    logError('Error al obtener detalle del permiso');
    console.log(response.data);
    return false;
  }
}

// ============================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================

async function runAllTests() {
  console.clear();
  log('\n' + '█'.repeat(70), 'cyan');
  log('█' + ' '.repeat(68) + '█', 'cyan');
  log('█' + '  PRUEBA DE ENDPOINTS - SISTEMA RBAC v3.0'.padEnd(68) + '█', 'cyan');
  log('█' + ' '.repeat(68) + '█', 'cyan');
  log('█'.repeat(70), 'cyan');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Login', fn: testLogin },
    { name: 'Listar Permisos', fn: testGetAllPermissions },
    { name: 'Permisos Agrupados', fn: testGetGroupedPermissions },
    { name: 'Permisos por Categoría', fn: testGetPermissionsByCategory },
    { name: 'Lista de Categorías', fn: testGetCategories },
    { name: 'Permisos de Admin', fn: testGetRolePermissions },
    { name: 'Permisos de Jefe', fn: testGetJefePermissions },
    { name: 'Permisos Agrupados de Rol', fn: testGetRolePermissionsGrouped },
    { name: 'Permisos Disponibles', fn: testGetAvailablePermissions },
    { name: 'Detalle de Permiso', fn: testGetPermissionById }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      logError(`Error en ${test.name}: ${error.message}`);
      results.push({ name: test.name, success: false });
    }
  }
  
  // Resumen final
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
    log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!', 'green');
    log('✅ Sistema RBAC v3.0 funcionando correctamente', 'green');
  } else {
    log(`\n⚠️  ${failed} prueba(s) fallaron`, 'yellow');
    log('Revisa los errores arriba para más detalles', 'yellow');
  }
  
  console.log('='.repeat(70) + '\n');
}

// Ejecutar tests
runAllTests().catch(error => {
  logError(`Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});
