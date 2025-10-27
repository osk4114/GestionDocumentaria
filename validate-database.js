/**
 * Script de validación de inicialización de base de datos
 * Verifica que todas las tablas y configuraciones estén correctas
 * Fecha: 27 de Octubre 2025
 */

const { sequelize } = require('./config/sequelize');

async function validateDatabase() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   VALIDACIÓN DE INICIALIZACIÓN DE BASE DE DATOS SGD       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const checks = [];
  let passedChecks = 0;
  let failedChecks = 0;

  try {
    // 1. Verificar que existan todas las tablas
    console.log('📋 1. Verificando tablas...');
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'sgd_db'
      ORDER BY TABLE_NAME
    `);

    const expectedTables = [
      'areas', 'attachments', 'document_movements', 'document_statuses',
      'document_types', 'documents', 'login_attempts', 'notifications',
      'roles', 'senders', 'user_sessions', 'users'
    ];

    const existingTables = tables.map(t => t.TABLE_NAME);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('   ✅ Todas las 12 tablas existen\n');
      checks.push({ check: 'Tablas existentes', status: '✅', detail: '12/12 tablas' });
      passedChecks++;
    } else {
      console.log(`   ❌ Faltan tablas: ${missingTables.join(', ')}\n`);
      checks.push({ check: 'Tablas existentes', status: '❌', detail: `Faltan: ${missingTables.join(', ')}` });
      failedChecks++;
    }

    // 2. Verificar estructura de tabla senders
    console.log('📋 2. Verificando tabla senders...');
    const [senderColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db' AND TABLE_NAME = 'senders'
      AND COLUMN_NAME IN ('tipo_persona', 'email', 'telefono', 'nombre_completo')
    `);

    const hasTipoPersona = senderColumns.find(c => c.COLUMN_NAME === 'tipo_persona');
    const emailNotNull = senderColumns.find(c => c.COLUMN_NAME === 'email' && c.IS_NULLABLE === 'NO');
    const telefonoNotNull = senderColumns.find(c => c.COLUMN_NAME === 'telefono' && c.IS_NULLABLE === 'NO');
    const nombreNull = senderColumns.find(c => c.COLUMN_NAME === 'nombre_completo' && c.IS_NULLABLE === 'YES');

    if (hasTipoPersona && emailNotNull && telefonoNotNull && nombreNull) {
      console.log('   ✅ Tabla senders correcta (tipo_persona, email NOT NULL, telefono NOT NULL, nombre NULL)\n');
      checks.push({ check: 'Estructura senders', status: '✅', detail: 'Todos los campos correctos' });
      passedChecks++;
    } else {
      console.log('   ❌ Tabla senders tiene problemas de estructura\n');
      checks.push({ check: 'Estructura senders', status: '❌', detail: 'Revisar campos' });
      failedChecks++;
    }

    // 3. Verificar estructura de tabla documents
    console.log('📋 3. Verificando tabla documents...');
    const [docColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db' AND TABLE_NAME = 'documents'
      AND COLUMN_NAME IN ('doc_type_id', 'fecha_recepcion')
    `);

    const docTypeNullable = docColumns.find(c => c.COLUMN_NAME === 'doc_type_id' && c.IS_NULLABLE === 'YES');
    const hasFechaRecepcion = docColumns.find(c => c.COLUMN_NAME === 'fecha_recepcion');

    if (docTypeNullable && hasFechaRecepcion) {
      console.log('   ✅ Tabla documents correcta (doc_type_id NULL, fecha_recepcion presente)\n');
      checks.push({ check: 'Estructura documents', status: '✅', detail: 'doc_type_id NULL, fecha_recepcion OK' });
      passedChecks++;
    } else {
      console.log('   ❌ Tabla documents tiene problemas de estructura\n');
      checks.push({ check: 'Estructura documents', status: '❌', detail: 'Revisar doc_type_id y fecha_recepcion' });
      failedChecks++;
    }

    // 4. Verificar estructura de tabla document_movements
    console.log('📋 4. Verificando tabla document_movements...');
    const [movColumns] = await sequelize.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db' AND TABLE_NAME = 'document_movements'
      AND COLUMN_NAME = 'user_id'
    `);

    const userIdNullable = movColumns.find(c => c.COLUMN_NAME === 'user_id' && c.IS_NULLABLE === 'YES');

    if (userIdNullable) {
      console.log('   ✅ Tabla document_movements correcta (user_id permite NULL)\n');
      checks.push({ check: 'Estructura movements', status: '✅', detail: 'user_id NULL permitido' });
      passedChecks++;
    } else {
      console.log('   ❌ Tabla document_movements: user_id debe permitir NULL\n');
      checks.push({ check: 'Estructura movements', status: '❌', detail: 'user_id debe permitir NULL' });
      failedChecks++;
    }

    // 5. Verificar datos iniciales (seeds)
    console.log('📋 5. Verificando datos iniciales...');
    
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM roles');
    const [areas] = await sequelize.query('SELECT COUNT(*) as count FROM areas');
    const [statuses] = await sequelize.query('SELECT COUNT(*) as count FROM document_statuses');
    const [types] = await sequelize.query('SELECT COUNT(*) as count FROM document_types');

    const hasSeeds = roles[0].count >= 4 && areas[0].count >= 5 && 
                     statuses[0].count >= 6 && types[0].count >= 5;

    if (hasSeeds) {
      console.log('   ✅ Datos iniciales cargados correctamente\n');
      console.log(`      - Roles: ${roles[0].count}`);
      console.log(`      - Áreas: ${areas[0].count}`);
      console.log(`      - Estados: ${statuses[0].count}`);
      console.log(`      - Tipos: ${types[0].count}\n`);
      checks.push({ check: 'Datos iniciales (seeds)', status: '✅', detail: `${roles[0].count} roles, ${areas[0].count} áreas, ${statuses[0].count} estados, ${types[0].count} tipos` });
      passedChecks++;
    } else {
      console.log('   ❌ Faltan datos iniciales\n');
      checks.push({ check: 'Datos iniciales (seeds)', status: '❌', detail: 'Ejecutar INSERT de seeds' });
      failedChecks++;
    }

    // 6. Verificar estados específicos
    console.log('📋 6. Verificando estados requeridos...');
    const [pendiente] = await sequelize.query("SELECT * FROM document_statuses WHERE nombre = 'Pendiente'");
    const [archivado] = await sequelize.query("SELECT * FROM document_statuses WHERE nombre = 'Archivado'");

    if (pendiente.length > 0 && archivado.length > 0) {
      console.log('   ✅ Estados "Pendiente" y "Archivado" existen\n');
      checks.push({ check: 'Estados críticos', status: '✅', detail: 'Pendiente y Archivado presentes' });
      passedChecks++;
    } else {
      console.log('   ❌ Faltan estados críticos\n');
      checks.push({ check: 'Estados críticos', status: '❌', detail: 'Faltan Pendiente o Archivado' });
      failedChecks++;
    }

    // 7. Verificar área Mesa de Partes
    console.log('📋 7. Verificando área Mesa de Partes...');
    const [mesaPartes] = await sequelize.query("SELECT * FROM areas WHERE nombre = 'Mesa de Partes'");

    if (mesaPartes.length > 0) {
      console.log('   ✅ Área "Mesa de Partes" existe\n');
      checks.push({ check: 'Área Mesa de Partes', status: '✅', detail: `ID: ${mesaPartes[0].id}` });
      passedChecks++;
    } else {
      console.log('   ❌ Falta área "Mesa de Partes"\n');
      checks.push({ check: 'Área Mesa de Partes', status: '❌', detail: 'Área crítica faltante' });
      failedChecks++;
    }

    // Resumen
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    RESUMEN DE VALIDACIÓN                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.table(checks);

    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   ✅ Checks aprobados: ${passedChecks}`);
    console.log(`   ❌ Checks fallidos: ${failedChecks}`);
    console.log(`   📈 Porcentaje de éxito: ${Math.round((passedChecks / (passedChecks + failedChecks)) * 100)}%\n`);

    if (failedChecks === 0) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ BASE DE DATOS COMPLETAMENTE INICIALIZADA Y VALIDADA   ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log('🚀 El sistema está listo para operar.\n');
    } else {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║  ⚠️  SE ENCONTRARON PROBLEMAS EN LA BASE DE DATOS         ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log('📋 Por favor, ejecute el script init-database.sql completo.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error durante la validación:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

validateDatabase();
