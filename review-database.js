const mysql = require('mysql2/promise');

async function reviewDatabase() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sgd_db'
  });

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          REVISIÓN COMPLETA DE BASE DE DATOS                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 1. TABLAS EXISTENTES
    console.log('📋 1. TABLAS EN LA BASE DE DATOS:');
    console.log('─'.repeat(60));
    const [tables] = await conn.execute('SHOW TABLES');
    tables.forEach((table, i) => {
      console.log(`  ${i + 1}. ${Object.values(table)[0]}`);
    });
    console.log('');

    // 2. ESTRUCTURA DE CADA TABLA IMPORTANTE
    const importantTables = ['senders', 'documents', 'document_statuses', 'document_types', 'areas', 'users', 'roles'];
    
    for (const tableName of importantTables) {
      console.log(`\n📊 ESTRUCTURA DE: ${tableName.toUpperCase()}`);
      console.log('─'.repeat(60));
      const [columns] = await conn.execute(`SHOW COLUMNS FROM ${tableName}`);
      console.table(columns.map(c => ({
        Campo: c.Field,
        Tipo: c.Type,
        Null: c.Null,
        Key: c.Key,
        Default: c.Default
      })));
    }

    // 3. DATOS SEED IMPORTANTES
    console.log('\n\n📦 DATOS SEED (Estados, Áreas, Tipos):');
    console.log('─'.repeat(60));
    
    console.log('\n🔹 ESTADOS DE DOCUMENTOS:');
    const [statuses] = await conn.execute('SELECT id, nombre, codigo, color FROM document_statuses ORDER BY id');
    console.table(statuses);

    console.log('\n🔹 ÁREAS:');
    const [areas] = await conn.execute('SELECT id, nombre, sigla, is_active FROM areas ORDER BY id');
    console.table(areas);

    console.log('\n🔹 TIPOS DE DOCUMENTO:');
    const [types] = await conn.execute('SELECT id, nombre, codigo, requiere_adjunto, dias_max_atencion, is_active FROM document_types ORDER BY id');
    console.table(types);

    console.log('\n🔹 ROLES:');
    const [roles] = await conn.execute('SELECT id, nombre, descripcion FROM roles ORDER BY id');
    console.table(roles);

    // 4. VERIFICAR DATOS DE PRUEBA
    console.log('\n\n📈 CONTEO DE REGISTROS:');
    console.log('─'.repeat(60));
    const [senderCount] = await conn.execute('SELECT COUNT(*) as count FROM senders');
    const [docCount] = await conn.execute('SELECT COUNT(*) as count FROM documents');
    const [userCount] = await conn.execute('SELECT COUNT(*) as count FROM users');
    
    console.log(`  • Remitentes (senders): ${senderCount[0].count}`);
    console.log(`  • Documentos (documents): ${docCount[0].count}`);
    console.log(`  • Usuarios (users): ${userCount[0].count}`);

    // 5. VERIFICAR RELACIONES (FOREIGN KEYS)
    console.log('\n\n🔗 FOREIGN KEYS DE TABLA DOCUMENTS:');
    console.log('─'.repeat(60));
    const [fks] = await conn.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'sgd_db'
        AND TABLE_NAME = 'documents'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(fks);

    // 6. PROBLEMAS POTENCIALES
    console.log('\n\n⚠️  VERIFICACIÓN DE PROBLEMAS:');
    console.log('─'.repeat(60));
    
    // Verificar si Mesa de Partes existe
    const [mp] = await conn.execute('SELECT * FROM areas WHERE nombre = "Mesa de Partes"');
    console.log(`  ${mp.length > 0 ? '✅' : '❌'} Área "Mesa de Partes" existe`);
    
    // Verificar si estado Recibido o Pendiente existe
    const [recibido] = await conn.execute('SELECT * FROM document_statuses WHERE nombre = "Recibido"');
    const [pendiente] = await conn.execute('SELECT * FROM document_statuses WHERE nombre = "Pendiente"');
    console.log(`  ${recibido.length > 0 ? '✅' : '❌'} Estado "Recibido" existe`);
    console.log(`  ${pendiente.length > 0 ? '✅' : '⚠️ '} Estado "Pendiente" existe (alternativa)`);
    
    // Verificar estructura de senders
    const [tipoPersonaCol] = await conn.execute('SHOW COLUMNS FROM senders LIKE "tipo_persona"');
    console.log(`  ${tipoPersonaCol.length > 0 ? '✅' : '❌'} Columna "tipo_persona" en senders`);
    
    // Verificar si doc_type_id permite NULL
    const [docTypeCol] = await conn.execute('SHOW COLUMNS FROM documents WHERE Field = "doc_type_id"');
    const allowsNull = docTypeCol.length > 0 && docTypeCol[0].Null === 'YES';
    console.log(`  ${allowsNull ? '✅' : '❌'} doc_type_id permite NULL (requerido para mesa de partes)`);

    // Verificar fecha_recepcion
    const [fechaRecepCol] = await conn.execute('SHOW COLUMNS FROM documents LIKE "fecha_recepcion"');
    console.log(`  ${fechaRecepCol.length > 0 ? '✅' : '❌'} Campo "fecha_recepcion" en documents`);

    console.log('\n\n═'.repeat(30));
    console.log('REVISIÓN COMPLETADA');
    console.log('═'.repeat(30) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR durante la revisión:', error.message);
  } finally {
    await conn.end();
  }
}

reviewDatabase();
