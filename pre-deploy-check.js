#!/usr/bin/env node

/**
 * ============================================================
 * SCRIPT DE VALIDACIÓN PRE-DESPLIEGUE
 * Sistema de Gestión Documentaria (SGD) v3.5
 * ============================================================
 * 
 * Este script verifica que el sistema esté correctamente
 * configurado antes del despliegue a producción.
 * 
 * USO:
 *   node pre-deploy-check.js
 * 
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

let errors = 0;
let warnings = 0;
let passed = 0;

console.log('\n' + '='.repeat(60));
console.log('🚀 VALIDACIÓN PRE-DESPLIEGUE - SGD v3.5');
console.log('='.repeat(60) + '\n');

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function checkPassed(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
  passed++;
}

function checkWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
  warnings++;
}

function checkError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  errors++;
}

function sectionHeader(title) {
  console.log(`\n${colors.blue}▶ ${title}${colors.reset}`);
  console.log(colors.gray + '-'.repeat(60) + colors.reset);
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function checkCommand(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// ============================================================
// 1. VERIFICAR ARCHIVOS ESENCIALES
// ============================================================

sectionHeader('1. Archivos Esenciales');

const essentialFiles = [
  'package.json',
  'server.js',
  '.env.example',
  '.gitignore',
  'config/database.js',
  'config/init-database.sql',
  'controllers/authController.js',
  'middleware/authMiddleware.js',
  'models/index.js',
  'routes/index.js'
];

essentialFiles.forEach(file => {
  if (fileExists(file)) {
    checkPassed(`Archivo encontrado: ${file}`);
  } else {
    checkError(`Archivo faltante: ${file}`);
  }
});

// ============================================================
// 2. VERIFICAR ARCHIVO .env
// ============================================================

sectionHeader('2. Configuración de Entorno (.env)');

if (fileExists('.env')) {
  checkPassed('Archivo .env encontrado');
  
  const envContent = readFile('.env');
  
  // Variables críticas
  const criticalVars = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'FRONTEND_URL'
  ];
  
  criticalVars.forEach(varName => {
    if (envContent.includes(`${varName}=`)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1].trim() && !match[1].includes('CAMBIAR') && !match[1].includes('example')) {
        checkPassed(`Variable configurada: ${varName}`);
      } else {
        checkError(`Variable sin configurar o con valor de ejemplo: ${varName}`);
      }
    } else {
      checkError(`Variable faltante: ${varName}`);
    }
  });
  
  // Verificar que JWT_SECRET tenga al menos 32 caracteres
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch && jwtSecretMatch[1].length < 32) {
    checkWarning('JWT_SECRET es muy corto (mínimo 32 caracteres recomendado)');
  }
  
  // Verificar NODE_ENV
  if (envContent.includes('NODE_ENV=production')) {
    checkPassed('NODE_ENV configurado como production');
  } else {
    checkWarning('NODE_ENV no está configurado como production');
  }
  
} else {
  checkError('Archivo .env NO encontrado (copiar desde .env.example)');
}

// ============================================================
// 3. VERIFICAR DEPENDENCIAS
// ============================================================

sectionHeader('3. Dependencias de Node.js');

if (fileExists('node_modules')) {
  checkPassed('Directorio node_modules encontrado');
} else {
  checkError('Directorio node_modules NO encontrado (ejecutar: npm install)');
}

const packageJson = JSON.parse(readFile('package.json'));
const requiredDeps = [
  'express',
  'sequelize',
  'mysql2',
  'jsonwebtoken',
  'bcryptjs',
  'dotenv',
  'cors',
  'socket.io',
  'multer'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    checkPassed(`Dependencia encontrada: ${dep}`);
  } else {
    checkError(`Dependencia faltante: ${dep}`);
  }
});

// ============================================================
// 4. VERIFICAR ESTRUCTURA DE DIRECTORIOS
// ============================================================

sectionHeader('4. Estructura de Directorios');

const requiredDirs = [
  'config',
  'controllers',
  'middleware',
  'models',
  'routes',
  'services',
  'uploads',
  'logs'
];

requiredDirs.forEach(dir => {
  if (fileExists(dir)) {
    checkPassed(`Directorio encontrado: ${dir}`);
  } else {
    if (dir === 'uploads' || dir === 'logs') {
      checkWarning(`Directorio faltante (se creará automáticamente): ${dir}`);
    } else {
      checkError(`Directorio faltante: ${dir}`);
    }
  }
});

// Verificar permisos de escritura en uploads y logs
if (fileExists('uploads')) {
  try {
    const testFile = path.join(__dirname, 'uploads', '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    checkPassed('Permisos de escritura en /uploads: OK');
  } catch (error) {
    checkError('Sin permisos de escritura en /uploads');
  }
}

if (fileExists('logs')) {
  try {
    const testFile = path.join(__dirname, 'logs', '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    checkPassed('Permisos de escritura en /logs: OK');
  } catch (error) {
    checkError('Sin permisos de escritura en /logs');
  }
}

// ============================================================
// 5. VERIFICAR BASE DE DATOS
// ============================================================

sectionHeader('5. Configuración de Base de Datos');

const initSql = readFile('config/init-database.sql');
if (initSql) {
  checkPassed('Script init-database.sql encontrado');
  
  // Verificar que sea versión 3.5
  if (initSql.includes('VERSIÓN: 3.5')) {
    checkPassed('Script de base de datos es versión 3.5');
  } else {
    checkWarning('Script de base de datos NO es versión 3.5');
  }
  
  // Verificar tablas críticas
  const criticalTables = [
    'users',
    'roles',
    'permissions',
    'areas',
    'documents',
    'document_types',
    'document_cargos'
  ];
  
  criticalTables.forEach(table => {
    if (initSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      checkPassed(`Tabla definida: ${table}`);
    } else {
      checkError(`Tabla faltante en script: ${table}`);
    }
  });
  
  // Verificar que tenga 124 permisos
  const permissionMatches = initSql.match(/INSERT INTO permissions/g);
  if (permissionMatches) {
    checkPassed('Script incluye INSERT de permisos');
  } else {
    checkError('Script NO incluye INSERT de permisos');
  }
  
} else {
  checkError('Script init-database.sql NO encontrado');
}

// ============================================================
// 6. VERIFICAR SEGURIDAD
// ============================================================

sectionHeader('6. Configuración de Seguridad');

// Verificar .gitignore
const gitignore = readFile('.gitignore');
if (gitignore) {
  if (gitignore.includes('.env')) {
    checkPassed('.gitignore incluye .env');
  } else {
    checkError('.gitignore NO incluye .env (¡CRÍTICO!)');
  }
  
  if (gitignore.includes('uploads/')) {
    checkPassed('.gitignore incluye uploads/');
  } else {
    checkWarning('.gitignore NO incluye uploads/');
  }
  
  if (gitignore.includes('node_modules')) {
    checkPassed('.gitignore incluye node_modules');
  } else {
    checkError('.gitignore NO incluye node_modules');
  }
}

// Verificar que no existan archivos sensibles en el repositorio
const sensitiveFiles = ['.env', 'uploads/', '*.pem', '*.key'];
console.log(`\n${colors.gray}  Verificando archivos sensibles en Git...${colors.reset}`);

try {
  const gitFiles = execSync('git ls-files', { encoding: 'utf8' });
  
  if (gitFiles.includes('.env')) {
    checkError('¡CRÍTICO! Archivo .env está en el repositorio Git');
  } else {
    checkPassed('Archivo .env NO está en Git');
  }
  
  if (gitFiles.split('\n').some(f => f.startsWith('uploads/'))) {
    checkWarning('Archivos de /uploads están en Git');
  } else {
    checkPassed('Directorio /uploads NO está en Git');
  }
} catch (error) {
  checkWarning('No se pudo verificar archivos en Git (repositorio no inicializado)');
}

// ============================================================
// 7. VERIFICAR HERRAMIENTAS DEL SISTEMA
// ============================================================

sectionHeader('7. Herramientas del Sistema');

// Verificar Node.js
if (checkCommand('node --version')) {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  
  if (majorVersion >= 18) {
    checkPassed(`Node.js instalado: ${nodeVersion}`);
  } else {
    checkWarning(`Node.js ${nodeVersion} (se recomienda v18+)`);
  }
} else {
  checkError('Node.js NO instalado');
}

// Verificar npm
if (checkCommand('npm --version')) {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  checkPassed(`npm instalado: v${npmVersion}`);
} else {
  checkError('npm NO instalado');
}

// Verificar MySQL
if (checkCommand('mysql --version')) {
  const mysqlVersion = execSync('mysql --version', { encoding: 'utf8' }).trim();
  checkPassed(`MySQL instalado: ${mysqlVersion.split('\n')[0]}`);
} else {
  checkWarning('MySQL NO instalado o no accesible desde CLI');
}

// Verificar PM2 (para producción)
if (checkCommand('pm2 --version')) {
  const pm2Version = execSync('pm2 --version', { encoding: 'utf8' }).trim();
  checkPassed(`PM2 instalado: v${pm2Version}`);
} else {
  checkWarning('PM2 NO instalado (recomendado para producción)');
}

// Verificar Git
if (checkCommand('git --version')) {
  const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
  checkPassed(`Git instalado: ${gitVersion}`);
} else {
  checkWarning('Git NO instalado');
}

// ============================================================
// 8. VERIFICAR FRONTEND
// ============================================================

sectionHeader('8. Frontend Angular');

if (fileExists('sgd-frontend')) {
  checkPassed('Directorio sgd-frontend encontrado');
  
  if (fileExists('sgd-frontend/package.json')) {
    checkPassed('package.json del frontend encontrado');
  } else {
    checkError('package.json del frontend NO encontrado');
  }
  
  if (fileExists('sgd-frontend/src/environments/environment.prod.ts')) {
    checkPassed('environment.prod.ts encontrado');
    
    const envProd = readFile('sgd-frontend/src/environments/environment.prod.ts');
    if (envProd && envProd.includes('production: true')) {
      checkPassed('environment.prod.ts configurado para producción');
    } else {
      checkWarning('environment.prod.ts NO configurado correctamente');
    }
  } else {
    checkError('environment.prod.ts NO encontrado');
  }
  
  if (fileExists('sgd-frontend/dist')) {
    checkPassed('Build de producción encontrado (/dist)');
  } else {
    checkWarning('Build de producción NO encontrado (ejecutar: npm run build)');
  }
  
} else {
  checkError('Directorio sgd-frontend NO encontrado');
}

// ============================================================
// 9. VERIFICAR DOCUMENTACIÓN
// ============================================================

sectionHeader('9. Documentación');

const docFiles = [
  'README.md',
  'DEPLOY.md',
  '.env.example'
];

docFiles.forEach(file => {
  if (fileExists(file)) {
    checkPassed(`Documentación encontrada: ${file}`);
  } else {
    checkWarning(`Documentación faltante: ${file}`);
  }
});

// ============================================================
// RESUMEN FINAL
// ============================================================

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VALIDACIÓN');
console.log('='.repeat(60));

console.log(`\n${colors.green}✓ Pruebas Pasadas:${colors.reset}    ${passed}`);
console.log(`${colors.yellow}⚠ Advertencias:${colors.reset}       ${warnings}`);
console.log(`${colors.red}✗ Errores:${colors.reset}            ${errors}`);

console.log('\n' + '='.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log(`${colors.green}✅ SISTEMA LISTO PARA PRODUCCIÓN${colors.reset}`);
  console.log('\nPróximos pasos:');
  console.log('  1. Revisar archivo .env con valores de producción');
  console.log('  2. Ejecutar backup de base de datos');
  console.log('  3. Seguir guía en DEPLOY.md');
  console.log('  4. Probar en ambiente de staging primero');
  process.exit(0);
  
} else if (errors === 0 && warnings > 0) {
  console.log(`${colors.yellow}⚠️  SISTEMA CASI LISTO (con advertencias)${colors.reset}`);
  console.log('\nRevisar advertencias antes de desplegar:');
  console.log('  - Algunas configuraciones opcionales faltantes');
  console.log('  - Revisar lista de advertencias arriba');
  console.log('  - Consultar DEPLOY.md para más detalles');
  process.exit(0);
  
} else {
  console.log(`${colors.red}❌ SISTEMA NO LISTO PARA PRODUCCIÓN${colors.reset}`);
  console.log('\nCorregir errores antes de desplegar:');
  console.log(`  - ${errors} error(es) crítico(s) encontrado(s)`);
  console.log('  - Revisar lista de errores arriba');
  console.log('  - Consultar DEPLOY.md para soluciones');
  process.exit(1);
}
