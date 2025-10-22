/**
 * Script de prueba para el sistema de autenticación mejorado
 * Prueba: sesiones, refresh tokens, rate limiting, logout
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth';
let authToken = '';
let refreshToken = '';
let sessionId = '';

// Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// Función para esperar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. Registrar usuario de prueba
async function testRegister() {
  log.info('TEST 1: Registro de usuario');
  try {
    const testEmail = `test_${Date.now()}@test.com`;
    const response = await axios.post(`${API_URL}/register`, {
      username: `testuser_${Date.now()}`,
      email: testEmail,
      password: 'Test1234!',
      fullName: 'Usuario de Prueba',
      areaId: 1,
      roleId: 3
    });
    
    log.success(`Usuario registrado: ${response.data.user.username}`);
    log.info(`Email: ${testEmail}`);
    authToken = response.data.token;
    refreshToken = response.data.refreshToken;
    sessionId = response.data.sessionId;
    
    // Guardar credenciales para usar en otros tests
    global.testCredentials = {
      email: testEmail,
      password: 'Test1234!'
    };
    
    return true;
  } catch (error) {
    log.error(`Error en registro: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 2. Login con usuario existente
async function testLogin() {
  log.info('TEST 2: Login de usuario');
  try {
    // Usar las credenciales del usuario registrado
    const credentials = global.testCredentials || {
      email: 'admin@sgd.com',
      password: 'admin123'
    };
    
    const response = await axios.post(`${API_URL}/login`, credentials);
    
    log.success('Login exitoso');
    log.info(`Token recibido: ${response.data.token.substring(0, 20)}...`);
    log.info(`Refresh token recibido: ${response.data.refreshToken.substring(0, 20)}...`);
    log.info(`Session ID: ${response.data.sessionId}`);
    
    authToken = response.data.token;
    refreshToken = response.data.refreshToken;
    sessionId = response.data.sessionId;
    return true;
  } catch (error) {
    log.error(`Error en login: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 3. Obtener perfil con token
async function testGetProfile() {
  log.info('TEST 3: Obtener perfil del usuario');
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`Perfil obtenido: ${response.data.user.username}`);
    log.info(`Email: ${response.data.user.email}`);
    log.info(`Rol: ${response.data.user.Role.name}`);
    return true;
  } catch (error) {
    log.error(`Error al obtener perfil: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 4. Listar sesiones activas
async function testGetSessions() {
  log.info('TEST 4: Listar sesiones activas');
  try {
    const response = await axios.get(`${API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`Sesiones activas: ${response.data.sessions.length}`);
    response.data.sessions.forEach((session, i) => {
      log.info(`  Sesión ${i + 1}: IP ${session.ipAddress}, Activa: ${session.isActive}`);
    });
    return true;
  } catch (error) {
    log.error(`Error al listar sesiones: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 5. Refrescar token
async function testRefreshToken() {
  log.info('TEST 5: Refrescar token con refresh token');
  try {
    const oldToken = authToken;
    const response = await axios.post(`${API_URL}/refresh`, {
      refreshToken: refreshToken
    });
    
    log.success('Token refrescado exitosamente');
    log.info(`Nuevo token: ${response.data.token.substring(0, 20)}...`);
    log.info(`Nuevo refresh token: ${response.data.refreshToken.substring(0, 20)}...`);
    log.warning('El token anterior fue invalidado');
    
    authToken = response.data.token;
    refreshToken = response.data.refreshToken;
    sessionId = response.data.sessionId;
    
    // Intentar usar el token antiguo (debe fallar)
    try {
      await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${oldToken}` }
      });
      log.error('ERROR: El token antiguo aún funciona (debería estar invalidado)');
      return false;
    } catch (err) {
      log.success('El token antiguo fue correctamente invalidado');
      return true;
    }
  } catch (error) {
    log.error(`Error al refrescar token: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 6. Test de rate limiting en login
async function testRateLimiting() {
  log.info('TEST 6: Rate limiting (intentos fallidos de login)');
  try {
    log.warning('Realizando 6 intentos de login con contraseña incorrecta...');
    
    const testEmail = global.testCredentials?.email || 'test@test.com';
    
    for (let i = 1; i <= 6; i++) {
      try {
        await axios.post(`${API_URL}/login`, {
          email: testEmail,
          password: 'wrongpassword'
        });
      } catch (error) {
        if (error.response?.status === 429) {
          log.success(`Rate limiting activado en el intento ${i}`);
          log.info('Mensaje: ' + error.response.data.message);
          return true;
        }
        log.info(`Intento ${i} bloqueado correctamente`);
      }
      await sleep(100); // Pequeña pausa entre intentos
    }
    
    log.warning('No se activó el rate limiting después de 6 intentos');
    return false;
  } catch (error) {
    log.error(`Error en test de rate limiting: ${error.message}`);
    return false;
  }
}

// 7. Crear múltiples sesiones
async function testMultipleSessions() {
  log.info('TEST 7: Múltiples sesiones del mismo usuario');
  try {
    const sessions = [];
    const credentials = global.testCredentials || {
      email: 'admin@sgd.com',
      password: 'admin123'
    };
    
    // Crear 3 sesiones
    for (let i = 1; i <= 3; i++) {
      const response = await axios.post(`${API_URL}/login`, credentials);
      sessions.push(response.data);
      log.info(`Sesión ${i} creada: ${response.data.sessionId}`);
      await sleep(500);
    }
    
    log.success(`${sessions.length} sesiones creadas correctamente`);
    
    // Usar el token de la primera sesión para listar todas
    const listResponse = await axios.get(`${API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${sessions[0].token}` }
    });
    
    log.info(`Total de sesiones activas: ${listResponse.data.sessions.length}`);
    return true;
  } catch (error) {
    log.error(`Error en múltiples sesiones: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 8. Revocar sesión específica
async function testRevokeSession() {
  log.info('TEST 8: Revocar sesión específica');
  try {
    // Listar sesiones
    const listResponse = await axios.get(`${API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (listResponse.data.sessions.length < 2) {
      log.warning('No hay suficientes sesiones para probar la revocación');
      return true;
    }
    
    // Revocar la primera sesión (que no sea la actual)
    const sessionToRevoke = listResponse.data.sessions.find(s => s.id !== sessionId);
    
    if (!sessionToRevoke) {
      log.warning('No se encontró otra sesión para revocar');
      return true;
    }
    
    const response = await axios.delete(`${API_URL}/sessions/${sessionToRevoke.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`Sesión ${sessionToRevoke.id} revocada correctamente`);
    return true;
  } catch (error) {
    log.error(`Error al revocar sesión: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 9. Logout de todas las sesiones excepto la actual
async function testLogoutAll() {
  log.info('TEST 9: Logout de todas las sesiones excepto la actual');
  try {
    const response = await axios.post(`${API_URL}/logout-all`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`${response.data.sessionsClosed} sesiones cerradas`);
    log.info('La sesión actual sigue activa');
    
    // Verificar que la sesión actual aún funciona
    await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    log.success('La sesión actual sigue funcionando correctamente');
    
    return true;
  } catch (error) {
    log.error(`Error en logout-all: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 10. Logout final
async function testLogout() {
  log.info('TEST 10: Logout (cerrar sesión actual)');
  try {
    const response = await axios.post(`${API_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success('Logout exitoso');
    
    // Intentar usar el token después del logout (debe fallar)
    try {
      await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.error('ERROR: El token sigue funcionando después del logout');
      return false;
    } catch (err) {
      log.success('El token fue correctamente invalidado después del logout');
      return true;
    }
  } catch (error) {
    log.error(`Error en logout: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n=================================');
  console.log('TESTS DE AUTENTICACIÓN MEJORADA');
  console.log('=================================\n');
  
  const results = [];
  
  // Ejecutar tests en secuencia
  results.push({ name: 'Registro', passed: await testRegister() });
  await sleep(1000);
  
  results.push({ name: 'Login', passed: await testLogin() });
  await sleep(1000);
  
  results.push({ name: 'Obtener perfil', passed: await testGetProfile() });
  await sleep(1000);
  
  results.push({ name: 'Listar sesiones', passed: await testGetSessions() });
  await sleep(1000);
  
  results.push({ name: 'Refresh token', passed: await testRefreshToken() });
  await sleep(1000);
  
  results.push({ name: 'Múltiples sesiones', passed: await testMultipleSessions() });
  await sleep(1000);
  
  results.push({ name: 'Revocar sesión', passed: await testRevokeSession() });
  await sleep(1000);
  
  results.push({ name: 'Logout todas', passed: await testLogoutAll() });
  await sleep(1000);
  
  results.push({ name: 'Logout final', passed: await testLogout() });
  await sleep(2000);
  
  // Rate limiting al final porque bloquea temporalmente
  results.push({ name: 'Rate limiting', passed: await testRateLimiting() });
  
  // Resumen
  console.log('\n=================================');
  console.log('RESUMEN DE TESTS');
  console.log('=================================\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    if (result.passed) {
      log.success(result.name);
    } else {
      log.error(result.name);
    }
  });
  
  console.log(`\n${colors.blue}Total:${colors.reset} ${results.length} tests`);
  console.log(`${colors.green}Pasaron:${colors.reset} ${passed}`);
  console.log(`${colors.red}Fallaron:${colors.reset} ${failed}`);
  console.log(`${colors.yellow}Porcentaje:${colors.reset} ${((passed / results.length) * 100).toFixed(1)}%\n`);
}

// Ejecutar tests
runAllTests().catch(error => {
  log.error('Error fatal en la ejecución de tests: ' + error.message);
  process.exit(1);
});
