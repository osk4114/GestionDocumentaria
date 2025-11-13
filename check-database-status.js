/**
 * Script para revisar el estado actual de la base de datos
 * Verifica estructura de tablas y datos existentes
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStatus() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sgd_db'
    });

    console.log('\n✅ Conexión a la base de datos establecida\n');
    console.log('═'.repeat(70));

    // 1. Ver estructura de tabla roles
    console.log('\n📋 ESTRUCTURA DE TABLA: roles');
    console.log('─'.repeat(70));
    const [rolesStructure] = await connection.query('DESCRIBE roles');
    console.table(rolesStructure.map(col => ({
      Campo: col.Field,
      Tipo: col.Type,
      Nulo: col.Null,
      Clave: col.Key,
      Default: col.Default
    })));

    // 2. Ver roles actuales
    console.log('\n📊 ROLES ACTUALES:');
    console.log('─'.repeat(70));
    const [roles] = await connection.query('SELECT id, nombre, es_sistema, is_active FROM roles ORDER BY id');
    console.table(roles);

    // 3. Ver estructura de tabla document_types
    console.log('\n📋 ESTRUCTURA DE TABLA: document_types');
    console.log('─'.repeat(70));
    const [docTypesStructure] = await connection.query('DESCRIBE document_types');
    console.table(docTypesStructure.map(col => ({
      Campo: col.Field,
      Tipo: col.Type,
      Nulo: col.Null,
      Clave: col.Key,
      Default: col.Default
    })));

    // 4. Ver tipos de documento actuales
    console.log('\n📊 TIPOS DE DOCUMENTO ACTUALES:');
    console.log('─'.repeat(70));
    const [docTypes] = await connection.query('SELECT id, nombre, codigo, is_active FROM document_types ORDER BY id');
    console.table(docTypes);

    // 5. Ver áreas
    console.log('\n🏢 ÁREAS:');
    console.log('─'.repeat(70));
    const [areas] = await connection.query('SELECT id, nombre, sigla FROM areas ORDER BY id');
    console.table(areas);

    // 6. Ver usuarios de prueba
    console.log('\n👤 USUARIOS DE PRUEBA (test):');
    console.log('─'.repeat(70));
    const [users] = await connection.query(`
      SELECT u.id, u.nombre, u.email, u.rol_id, r.nombre as rol_nombre, u.area_id, a.nombre as area_nombre
      FROM users u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN areas a ON u.area_id = a.id
      WHERE u.nombre LIKE '%test%' OR u.email LIKE '%test%'
      ORDER BY u.id
    `);
    
    if (users.length > 0) {
      console.table(users);
    } else {
      console.log('No hay usuarios de prueba\n');
    }

    // 7. Verificar si existen las columnas area_id
    console.log('\n🔍 VERIFICACIÓN DE COLUMNAS area_id:');
    console.log('─'.repeat(70));
    
    const rolesHasAreaId = rolesStructure.some(col => col.Field === 'area_id');
    const docTypesHasAreaId = docTypesStructure.some(col => col.Field === 'area_id');
    
    console.log(`roles.area_id existe: ${rolesHasAreaId ? '✅ SÍ' : '❌ NO'}`);
    console.log(`document_types.area_id existe: ${docTypesHasAreaId ? '✅ SÍ' : '❌ NO'}`);

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ Revisión completada\n');

    // Recomendaciones
    console.log('📌 RECOMENDACIONES:');
    console.log('─'.repeat(70));
    
    if (!rolesHasAreaId) {
      console.log('⚠️  Ejecutar migración: migrations/add-area-to-roles.sql');
    }
    
    if (!docTypesHasAreaId) {
      console.log('⚠️  Ejecutar migración: migrations/add-area-to-document-types.sql');
    }
    
    if (rolesHasAreaId && docTypesHasAreaId) {
      console.log('✅ Todas las migraciones están aplicadas');
    }
    
    console.log('');

  } catch (error) {
    console.error('\n❌ Error al consultar la base de datos:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada\n');
    }
  }
}

// Ejecutar
checkDatabaseStatus();
