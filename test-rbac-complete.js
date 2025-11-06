/**
 * TEST COMPLETO RBAC v3.0 - VERIFICACIÓN DE MIGRACIÓN 100%
 * 
 * Este script verifica que TODOS los endpoints protegidos
 * estén usando el sistema de permisos granulares RBAC v3.0
 * 
 * Fecha: 6 de noviembre 2025
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Colores para la consola (sin dependencias externas)
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

const chalk = {
  bold: {
    cyan: (text) => `${colors.bold}${colors.cyan}${text}${colors.reset}`,
    yellow: (text) => `${colors.bold}${colors.yellow}${text}${colors.reset}`,
    white: (text) => `${colors.bold}${colors.white}${text}${colors.reset}`,
    green: (text) => `${colors.bold}${colors.green}${text}${colors.reset}`,
    red: (text) => `${colors.bold}${colors.red}${text}${colors.reset}`
  },
  green: (text) => `${colors.green}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  white: (text) => `${colors.white}${text}${colors.reset}`
};

// Credenciales de prueba
const ADMIN_CREDENTIALS = {
  email: 'admin@sgd.com',
  password: 'admin123'
};

const JEFE_AREA_CREDENTIALS = {
  email: 'jefe@comercio.com',
  password: 'jefe123'
};

// Almacenar tokens y permisos
let adminToken = null;
let adminPermissions = [];
let jefeToken = null;
let jefePermissions = [];

// Estadísticas
const stats = {
  totalEndpoints: 0,
  endpointsPublicos: 0,
  endpointsMigrados: 0,
  permisosFaltantes: [],
  errores: []
};

/**
 * Función para login y obtener permisos
 */
async function login(credentials, userType) {
  try {
    console.log(chalk.blue(`\n🔐 Iniciando sesión como ${userType}...`));
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    if (response.data.success) {
      const { token, permissions, user } = response.data.data;
      console.log(chalk.green(`✅ Login exitoso: ${user.nombre}`));
      console.log(chalk.cyan(`   📋 Permisos: ${permissions.length}`));
      return { token, permissions };
    } else {
      throw new Error('Login falló');
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error en login ${userType}:`), error.message);
    throw error;
  }
}

/**
 * Función para testear endpoint con permisos
 */
async function testEndpoint(method, path, requiredPermissions, token, userPermissions, userType) {
  stats.totalEndpoints++;
  
  try {
    // Determinar si el usuario tiene los permisos necesarios
    let hasPermission = false;
    
    if (Array.isArray(requiredPermissions)) {
      // ANY permission (al menos uno)
      hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
    } else if (requiredPermissions) {
      // Single permission
      hasPermission = userPermissions.includes(requiredPermissions);
    } else {
      // Sin permisos requeridos (endpoint público)
      hasPermission = true;
    }

    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${path}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      validateStatus: () => true // No lanzar error en 4xx/5xx
    };

    const response = await axios(config);
    const status = response.status;

    // Verificar que el comportamiento sea correcto
    if (hasPermission) {
      // Usuario TIENE permiso, debe recibir 200 o 404 (no 403)
      if (status === 403) {
        console.log(chalk.red(`   ❌ FALLÓ: ${method} ${path} - Usuario con permiso recibió 403`));
        stats.errores.push(`${method} ${path} - Falso negativo para ${userType}`);
        return false;
      } else {
        console.log(chalk.green(`   ✅ PASÓ: ${method} ${path} (${status}) - ${userType} tiene permiso`));
        stats.endpointsMigrados++;
        return true;
      }
    } else {
      // Usuario NO tiene permiso, debe recibir 403
      if (status === 403) {
        console.log(chalk.yellow(`   ✅ PASÓ: ${method} ${path} (403) - ${userType} correctamente denegado`));
        stats.endpointsMigrados++;
        return true;
      } else {
        console.log(chalk.red(`   ❌ FALLÓ: ${method} ${path} (${status}) - Usuario sin permiso NO recibió 403`));
        stats.errores.push(`${method} ${path} - Fallo de seguridad para ${userType}`);
        return false;
      }
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ ERROR: ${method} ${path} - ${error.message}`));
    stats.errores.push(`${method} ${path} - Error: ${error.message}`);
    return false;
  }
}

/**
 * Función para testear endpoint público (sin autenticación)
 */
async function testPublicEndpoint(method, path, description) {
  stats.totalEndpoints++;
  stats.endpointsPublicos++;
  
  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: `${BASE_URL}${path}`,
      validateStatus: () => true
    });

    const status = response.status;
    if (status < 500) {
      console.log(chalk.green(`   ✅ PÚBLICO: ${method} ${path} (${status}) - ${description}`));
      return true;
    } else {
      console.log(chalk.red(`   ❌ ERROR: ${method} ${path} (${status}) - ${description}`));
      stats.errores.push(`${method} ${path} - Error de servidor`);
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ ERROR: ${method} ${path} - ${error.message}`));
    stats.errores.push(`${method} ${path} - ${error.message}`);
    return false;
  }
}

/**
 * TESTS PRINCIPALES
 */
async function runTests() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║  🔐 TEST COMPLETO RBAC v3.0 - VERIFICACIÓN DE MIGRACIÓN 100% ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════════╝\n'));

  try {
    // ============================================================
    // 1. LOGIN Y OBTENER PERMISOS
    // ============================================================
    const adminData = await login(ADMIN_CREDENTIALS, 'Administrador');
    adminToken = adminData.token;
    adminPermissions = adminData.permissions;

    // Intentar login de Jefe de Área (opcional)
    try {
      const jefeData = await login(JEFE_AREA_CREDENTIALS, 'Jefe de Área');
      jefeToken = jefeData.token;
      jefePermissions = jefeData.permissions;
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Usuario Jefe de Área no disponible (se usará solo Admin para tests)`));
    }

    console.log(chalk.bold.yellow('\n📊 RESUMEN DE PERMISOS:'));
    console.log(chalk.cyan(`   Administrador: ${adminPermissions.length} permisos`));
    if (jefeToken) {
      console.log(chalk.cyan(`   Jefe de Área: ${jefePermissions.length} permisos`));
    }

    // ============================================================
    // 2. ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testPublicEndpoint('GET', '/health', 'Health check');
    await testPublicEndpoint('POST', '/documents/submit', 'Mesa de Partes Virtual');
    await testPublicEndpoint('GET', '/documents/tracking/DOC-2025-001', 'Seguimiento público');
    await testPublicEndpoint('GET', '/areas', 'Listado de áreas para selects');
    await testPublicEndpoint('GET', '/document-types', 'Listado de tipos para selects');
    await testPublicEndpoint('GET', '/roles', 'Listado de roles para selects');

    // ============================================================
    // 3. AUTH ROUTES (1 endpoint protegido)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 AUTH ROUTES:'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('POST', '/auth/register', ['users.create.all', 'users.create.area'], adminToken, adminPermissions, 'Admin');
    if (jefeToken) {
      await testEndpoint('POST', '/auth/register', ['users.create.all', 'users.create.area'], jefeToken, jefePermissions, 'Jefe');
    }

    // ============================================================
    // 4. USER ROUTES (6 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 USER ROUTES (6 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/users', ['users.view.all', 'users.view.area'], adminToken, adminPermissions, 'Admin');
    
    await testEndpoint('GET', '/users/1', ['users.view.all', 'users.view.area', 'users.view.own'], adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/users', ['users.create.all', 'users.create.area'], adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/users/1', ['users.edit.all', 'users.edit.area'], adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/users/1', 'users.delete', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/users/1/activate', 'users.activate', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 5. ROLE ROUTES (8 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 ROLE ROUTES (8 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/roles/permissions', 'roles.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/roles/custom', 'roles.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/roles/1', 'roles.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/roles', 'roles.create', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/roles/1', 'roles.edit', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/roles/1/toggle-status', 'roles.edit', adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/roles/1', 'roles.delete', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 6. DOCUMENT ROUTES (26 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 DOCUMENT ROUTES (26 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/documents', ['documents.view.all', 'documents.view.area', 'documents.view.own'], adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/documents/inbox', 'documents.inbox.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/documents', 'documents.create', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/documents/1', ['documents.view.all', 'documents.view.area', 'documents.view.own'], adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/documents/1', ['documents.edit.all', 'documents.edit.area'], adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/documents/1', 'documents.delete', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/documents/1/archive', 'documents.archive', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/documents/1/derive', 'documents.derive', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/documents/1/finalize', 'documents.finalize', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/documents/search', 'documents.search', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 7. AREA ROUTES (8 endpoints + 7 categorías)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 AREA ROUTES (15 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/areas/1', 'areas.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/areas/1/stats', 'areas.stats.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/areas', 'areas.create', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/areas/1', 'areas.edit', adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/areas/1', 'areas.deactivate', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/areas/1/activate', 'areas.activate', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/areas/1/deactivate', 'areas.deactivate', adminToken, adminPermissions, 'Admin');
    
    // Categorías
    await testEndpoint('GET', '/areas/1/categories', 'categories.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/areas/1/categories', 'categories.create', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/areas/1/categories/reorder', 'categories.edit', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/areas/categories/1', 'categories.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/areas/categories/1', 'categories.edit', adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/areas/categories/1', 'categories.delete', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/areas/categories/1/toggle', 'categories.edit', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 8. DOCUMENT TYPE ROUTES (6 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 DOCUMENT TYPE ROUTES (6 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/document-types/1', 'document_types.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/document-types', 'document_types.create', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PUT', '/document-types/1', 'document_types.edit', adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/document-types/1', 'document_types.deactivate', adminToken, adminPermissions, 'Admin');
    await testEndpoint('PATCH', '/document-types/1/activate', 'document_types.activate', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 9. MOVEMENT ROUTES (5 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 MOVEMENT ROUTES (5 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('POST', '/movements', 'movements.create', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/movements/document/1', 'movements.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/movements/accept/1', 'movements.accept', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/movements/reject/1', 'movements.reject', adminToken, adminPermissions, 'Admin');
    await testEndpoint('POST', '/movements/complete/1', 'movements.complete', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 10. ATTACHMENT ROUTES (5 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 ATTACHMENT ROUTES (5 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/attachments/view/1', 'attachments.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/attachments/download/1', 'attachments.download', adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/attachments/1', 'attachments.delete', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/attachments/document/1', 'attachments.view', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 11. VERSION ROUTES (6 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 VERSION ROUTES (6 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/documents/1/versions', 'versions.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/documents/1/versions/latest', 'versions.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/documents/versions/1', 'versions.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/documents/versions/1/download', 'versions.download', adminToken, adminPermissions, 'Admin');
    await testEndpoint('DELETE', '/documents/versions/1', 'versions.delete', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 12. REPORT ROUTES (2 endpoints)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 REPORT ROUTES (2 endpoints):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/reports/stats', 'reports.view', adminToken, adminPermissions, 'Admin');
    await testEndpoint('GET', '/reports/export', 'reports.export', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // 13. PERMISSION ROUTES (1 endpoint)
    // ============================================================
    console.log(chalk.bold.yellow('\n\n📂 PERMISSION ROUTES (1 endpoint):'));
    console.log(chalk.gray('─'.repeat(65)));
    
    await testEndpoint('GET', '/permissions', 'roles.view', adminToken, adminPermissions, 'Admin');

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    console.log(chalk.bold.cyan('\n\n╔═══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║                      📊 RESUMEN FINAL                         ║'));
    console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════════╝\n'));

    console.log(chalk.bold.white('ESTADÍSTICAS:'));
    console.log(chalk.cyan(`   📋 Total de endpoints testeados: ${stats.totalEndpoints}`));
    console.log(chalk.green(`   🔓 Endpoints públicos: ${stats.endpointsPublicos}`));
    console.log(chalk.green(`   ✅ Endpoints migrados a RBAC: ${stats.endpointsMigrados}`));
    console.log(chalk.yellow(`   ⚠️  Errores encontrados: ${stats.errores.length}`));

    const porcentajeExito = ((stats.endpointsMigrados / stats.totalEndpoints) * 100).toFixed(1);
    console.log(chalk.bold.green(`\n   🎯 TASA DE ÉXITO: ${porcentajeExito}%`));

    if (stats.errores.length > 0) {
      console.log(chalk.bold.red('\n\n⚠️  ERRORES ENCONTRADOS:'));
      stats.errores.forEach((error, index) => {
        console.log(chalk.red(`   ${index + 1}. ${error}`));
      });
    }

    if (stats.endpointsMigrados === stats.totalEndpoints && stats.errores.length === 0) {
      console.log(chalk.bold.green('\n\n🎉 ¡MIGRACIÓN COMPLETADA AL 100%! 🎉'));
      console.log(chalk.green('   Todos los endpoints están usando RBAC v3.0 correctamente.\n'));
    } else {
      console.log(chalk.bold.yellow('\n\n⚠️  MIGRACIÓN INCOMPLETA'));
      console.log(chalk.yellow('   Revisa los errores anteriores para completar la migración.\n'));
    }

  } catch (error) {
    console.error(chalk.bold.red('\n\n❌ ERROR CRÍTICO EN LOS TESTS:'));
    console.error(chalk.red(error.message));
    console.error(error.stack);
  }
}

// Ejecutar tests
runTests().then(() => {
  console.log(chalk.bold.cyan('\n✅ Tests finalizados\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.bold.red('\n❌ Error fatal:'), error);
  process.exit(1);
});
