/**
 * Script de prueba simplificado para autenticación mejorada
 * Usa usuario admin@sgd.com existente
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth';
const TEST_USER = {
  email: 'admin@sgd.com',
  password: 'admin123'
};

let authToken = '';
let refreshToken = '';
let sessionId = '';

// Colores
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function test1_Login() {
  log.info('TEST 1: Login inicial');
  try {
    const response = await axios.post(`${API_URL}/login`, TEST_USER);
    
    log.success('Login exitoso');
    log.info(`  Token: ${response.data.data.token.substring(0, 30)}...`);
    log.info(`  Refresh Token: ${response.data.data.refreshToken.substring(0, 30)}...`);
    log.info(`  Session ID: ${response.data.data.sessionId}`);
    
    authToken = response.data.data.token;
    refreshToken = response.data.data.refreshToken;
    sessionId = response.data.data.sessionId;
    return true;
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test2_GetProfile() {
  log.info('TEST 2: Obtener perfil con token');
  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`Perfil obtenido: ${response.data.data.username}`);
    log.info(`  Email: ${response.data.data.email}`);
    log.info(`  Rol: ${response.data.data.Role?.name || response.data.data.role?.name || 'N/A'}`);
    return true;
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test3_ListSessions() {
  log.info('TEST 3: Listar sesiones activas');
  try {
    const response = await axios.get(`${API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const sessions = response.data.data || response.data.sessions || [];
    log.success(`Sesiones activas: ${sessions.length}`);
    sessions.forEach((session, i) => {
      log.info(`  Sesión ${i + 1}: ID ${session.id}, IP ${session.ipAddress}`);
    });
    return true;
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function test4_RefreshToken() {
  log.info('TEST 4: Refrescar token');
  try {
    const oldToken = authToken;
    const response = await axios.post(`${API_URL}/refresh`, {
      refreshToken: refreshToken
    });
    
    log.success('Token refrescado');
    log.info(`  Nuevo token: ${response.data.data.token.substring(0, 30)}...`);
    
    authToken = response.data.data.token;
    refreshToken = response.data.data.refreshToken;
    sessionId = response.data.data.sessionId;
    
    // Verificar que el token antiguo no funcione
    try {
      await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${oldToken}` }
      });
      log.error('ERROR: Token antiguo aún funciona');
      return false;
    } catch (err) {
      log.success('Token antiguo correctamente invalidado');
      return true;
    }
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test5_MultipleSessions() {
  log.info('TEST 5: Crear múltiples sesiones');
  try {
    const sessions = [];
    
    for (let i = 1; i <= 3; i++) {
      const response = await axios.post(`${API_URL}/login`, TEST_USER);
      sessions.push(response.data.data);
      log.info(`  Sesión ${i} creada: ID ${response.data.data.sessionId}`);
      await sleep(300);
    }
    
    log.success(`${sessions.length} sesiones creadas`);
    
    // Listar todas
    const listResponse = await axios.get(`${API_URL}/sessions`, {
      headers: { Authorization: `Bearer ${sessions[0].token}` }
    });
    
    const allSessions = listResponse.data.data || listResponse.data.sessions || [];
    log.info(`  Total sesiones activas: ${allSessions.length}`);
    
    // Guardar para siguiente test
    global.extraSessions = sessions;
    return true;
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test6_RevokeSession() {
  log.info('TEST 6: Revocar sesión específica');
  try {
    const sessions = global.extraSessions;
    if (!sessions || sessions.length < 2) {
      log.warning('No hay sesiones extra para revocar');
      return true;
    }
    
    // Revocar la segunda sesión
    const sessionToRevoke = sessions[1].sessionId;
    await axios.delete(`${API_URL}/sessions/${sessionToRevoke}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`Sesión ${sessionToRevoke} revocada`);
    
    // Verificar que el token de esa sesión no funcione
    try {
      await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${sessions[1].token}` }
      });
      log.error('ERROR: Token revocado aún funciona');
      return false;
    } catch (err) {
      log.success('Token revocado correctamente invalidado');
      return true;
    }
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test7_LogoutAll() {
  log.info('TEST 7: Cerrar todas las sesiones excepto actual');
  try {
    const response = await axios.post(`${API_URL}/logout-all`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success(`${response.data.sessionsClosed} sesiones cerradas`);
    
    // Verificar que el token actual siga funcionando
    await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success('Sesión actual sigue activa');
    return true;
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test8_Logout() {
  log.info('TEST 8: Cerrar sesión actual');
  try {
    await axios.post(`${API_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log.success('Logout exitoso');
    
    // Verificar que el token no funcione
    try {
      await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.error('ERROR: Token aún funciona después del logout');
      return false;
    } catch (err) {
      log.success('Token correctamente invalidado');
      return true;
    }
  } catch (error) {
    log.error(`${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function test9_RateLimiting() {
  log.info('TEST 9: Rate limiting en login');
  try {
    log.warning('Realizando 6 intentos con contraseña incorrecta...');
    
    for (let i = 1; i <= 6; i++) {
      try {
        await axios.post(`${API_URL}/login`, {
          email: TEST_USER.email,
          password: 'wrongpassword'
        });
      } catch (error) {
        if (error.response?.status === 429) {
          log.success(`Rate limiting activado en intento ${i}`);
          return true;
        }
        log.info(`  Intento ${i}: bloqueado (${error.response?.status})`);
      }
      await sleep(100);
    }
    
    log.warning('Rate limiting no se activó');
    return false;
  } catch (error) {
    log.error(`${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('TESTS DE AUTENTICACIÓN MEJORADA - SIMPLIFICADO');
  console.log('='.repeat(50) + '\n');
  
  const results = [];
  
  results.push({ name: 'Login', passed: await test1_Login() });
  await sleep(800);
  
  results.push({ name: 'Obtener perfil', passed: await test2_GetProfile() });
  await sleep(800);
  
  results.push({ name: 'Listar sesiones', passed: await test3_ListSessions() });
  await sleep(800);
  
  results.push({ name: 'Refresh token', passed: await test4_RefreshToken() });
  await sleep(800);
  
  results.push({ name: 'Múltiples sesiones', passed: await test5_MultipleSessions() });
  await sleep(800);
  
  results.push({ name: 'Revocar sesión', passed: await test6_RevokeSession() });
  await sleep(800);
  
  results.push({ name: 'Logout todas', passed: await test7_LogoutAll() });
  await sleep(800);
  
  results.push({ name: 'Logout final', passed: await test8_Logout() });
  await sleep(2000);
  
  results.push({ name: 'Rate limiting', passed: await test9_RateLimiting() });
  
  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('RESUMEN');
  console.log('='.repeat(50) + '\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    if (result.passed) {
      log.success(result.name);
    } else {
      log.error(result.name);
    }
  });
  
  console.log(`\n${colors.blue}Total:${colors.reset} ${results.length}`);
  console.log(`${colors.green}Pasaron:${colors.reset} ${passed}`);
  console.log(`${colors.red}Fallaron:${colors.reset} ${failed}`);
  console.log(`${colors.yellow}Porcentaje:${colors.reset} ${((passed / results.length) * 100).toFixed(1)}%\n`);
  
  if (passed === results.length) {
    console.log(`${colors.green}✓ ¡TODOS LOS TESTS PASARON!${colors.reset}\n`);
  }
}

runTests().catch(error => {
  log.error('Error fatal: ' + error.message);
  process.exit(1);
});
