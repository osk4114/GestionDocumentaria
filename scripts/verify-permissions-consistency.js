/**
 * Script de Verificación de Consistencia de Permisos
 * 
 * Verifica que todos los permisos usados en checkPermission() y checkAnyPermission()
 * en los archivos de rutas existan en la base de datos.
 * 
 * Uso: node scripts/verify-permissions-consistency.js
 */

const fs = require('fs');
const path = require('path');

// =====================================================
// PASO 1: Extraer permisos de init-database.sql
// =====================================================

function extractPermissionsFromDatabase() {
  const sqlPath = path.join(__dirname, '../config/init-database.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  // Regex para capturar códigos de permisos: ('codigo', 'nombre', ...)
  const permissionRegex = /\('([a-z._]+)',\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*(?:TRUE|FALSE)\)/gi;
  
  const dbPermissions = new Set();
  let match;
  
  while ((match = permissionRegex.exec(sqlContent)) !== null) {
    dbPermissions.add(match[1]);
  }
  
  console.log(`\n📊 Permisos encontrados en la BD: ${dbPermissions.size}`);
  return dbPermissions;
}

// =====================================================
// PASO 2: Extraer permisos usados en archivos de rutas
// =====================================================

function extractPermissionsFromRoutes() {
  const routesDir = path.join(__dirname, '../routes');
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  
  const usedPermissions = new Map(); // Map de permiso -> [archivos donde se usa]
  
  // Regex para capturar:
  // - checkPermission('permiso')
  // - checkAnyPermission(['permiso1', 'permiso2'])
  const singlePermRegex = /checkPermission\s*\(\s*['"]([a-z._]+)['"]\s*\)/gi;
  const multiPermRegex = /checkAnyPermission\s*\(\s*\[([^\]]+)\]\s*\)/gi;
  
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Buscar checkPermission('...')
    let match;
    while ((match = singlePermRegex.exec(content)) !== null) {
      const permission = match[1];
      if (!usedPermissions.has(permission)) {
        usedPermissions.set(permission, []);
      }
      if (!usedPermissions.get(permission).includes(file)) {
        usedPermissions.get(permission).push(file);
      }
    }
    
    // Buscar checkAnyPermission([...])
    while ((match = multiPermRegex.exec(content)) !== null) {
      const permissionsBlock = match[1];
      const permRegex = /['"]([a-z._]+)['"]/g;
      let permMatch;
      
      while ((permMatch = permRegex.exec(permissionsBlock)) !== null) {
        const permission = permMatch[1];
        if (!usedPermissions.has(permission)) {
          usedPermissions.set(permission, []);
        }
        if (!usedPermissions.get(permission).includes(file)) {
          usedPermissions.get(permission).push(file);
        }
      }
    }
  });
  
  console.log(`📝 Permisos usados en rutas: ${usedPermissions.size}`);
  return usedPermissions;
}

// =====================================================
// PASO 3: Verificar consistencia
// =====================================================

function verifyConsistency() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('🔍 VERIFICACIÓN DE CONSISTENCIA DE PERMISOS');
  console.log('═══════════════════════════════════════════════════');
  
  const dbPermissions = extractPermissionsFromDatabase();
  const usedPermissions = extractPermissionsFromRoutes();
  
  // Encontrar permisos usados pero NO en BD
  const missingInDb = [];
  usedPermissions.forEach((files, permission) => {
    if (!dbPermissions.has(permission)) {
      missingInDb.push({ permission, files });
    }
  });
  
  // Encontrar permisos en BD pero NO usados (no es error, pero es info útil)
  const unusedPermissions = [];
  dbPermissions.forEach(permission => {
    if (!usedPermissions.has(permission)) {
      unusedPermissions.push(permission);
    }
  });
  
  // =====================================================
  // PASO 4: Reporte
  // =====================================================
  
  console.log('\n\n🔴 PERMISOS USADOS EN RUTAS PERO NO EN BD (ERRORES):');
  console.log('─────────────────────────────────────────────────');
  
  if (missingInDb.length === 0) {
    console.log('✅ No se encontraron inconsistencias. Todos los permisos usados existen en la BD.');
  } else {
    missingInDb.forEach(({ permission, files }) => {
      console.log(`\n❌ "${permission}"`);
      console.log(`   Usado en: ${files.join(', ')}`);
    });
    console.log(`\n\n⚠️  Total de errores: ${missingInDb.length}`);
  }
  
  console.log('\n\n🟡 PERMISOS EN BD PERO NO USADOS EN RUTAS (INFORMATIVO):');
  console.log('─────────────────────────────────────────────────');
  
  if (unusedPermissions.length === 0) {
    console.log('✅ Todos los permisos de la BD están siendo usados.');
  } else {
    console.log(`📋 ${unusedPermissions.length} permisos no usados actualmente:\n`);
    
    // Agrupar por categoría
    const byCategory = {};
    unusedPermissions.forEach(perm => {
      const category = perm.split('.')[0];
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(perm);
    });
    
    Object.keys(byCategory).sort().forEach(category => {
      console.log(`\n  ${category}:`);
      byCategory[category].forEach(perm => {
        console.log(`    - ${perm}`);
      });
    });
  }
  
  // =====================================================
  // PASO 5: Resumen y código de salida
  // =====================================================
  
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMEN:');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Permisos en BD:          ${dbPermissions.size}`);
  console.log(`  Permisos usados:         ${usedPermissions.size}`);
  console.log(`  Permisos no en BD:       ${missingInDb.length} ❌`);
  console.log(`  Permisos no usados:      ${unusedPermissions.length} ℹ️`);
  console.log('═══════════════════════════════════════════════════\n');
  
  // Retornar código de salida apropiado
  if (missingInDb.length > 0) {
    console.error('❌ FALLO: Se encontraron permisos usados que no existen en la BD.\n');
    process.exit(1);
  } else {
    console.log('✅ ÉXITO: Todos los permisos están correctamente definidos.\n');
    process.exit(0);
  }
}

// =====================================================
// EJECUTAR
// =====================================================

try {
  verifyConsistency();
} catch (error) {
  console.error('\n❌ Error durante la verificación:', error.message);
  console.error(error.stack);
  process.exit(1);
}
