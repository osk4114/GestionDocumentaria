const mysql = require('mysql2/promise');

async function fixSendersTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sgd_db'
  });

  try {
    console.log('🔍 Verificando estructura de tabla senders...\n');

    // 1. Verificar y agregar tipo_persona
    const [rows1] = await conn.execute('SHOW COLUMNS FROM senders LIKE "tipo_persona"');
    if (rows1.length === 0) {
      console.log('❌ Columna tipo_persona NO existe. Agregando...');
      await conn.execute('ALTER TABLE senders ADD COLUMN tipo_persona ENUM("natural", "juridica") NOT NULL DEFAULT "natural" AFTER id');
      console.log('✅ Columna tipo_persona agregada\n');
    } else {
      console.log('✅ Columna tipo_persona ya existe\n');
    }

    // 2. Hacer email obligatorio
    console.log('🔧 Haciendo email obligatorio...');
    await conn.execute('ALTER TABLE senders MODIFY COLUMN email VARCHAR(100) NOT NULL');
    console.log('✅ Email ahora es obligatorio\n');

    // 3. Hacer telefono obligatorio
    console.log('🔧 Haciendo telefono obligatorio...');
    await conn.execute('ALTER TABLE senders MODIFY COLUMN telefono VARCHAR(20) NOT NULL');
    console.log('✅ Telefono ahora es obligatorio\n');

    // 4. Hacer nombre_completo opcional
    console.log('🔧 Haciendo nombre_completo opcional...');
    await conn.execute('ALTER TABLE senders MODIFY COLUMN nombre_completo VARCHAR(150) NULL');
    console.log('✅ Nombre completo ahora es opcional\n');

    // 5. Hacer tipo_documento opcional
    console.log('🔧 Haciendo tipo_documento opcional...');
    await conn.execute('ALTER TABLE senders MODIFY COLUMN tipo_documento ENUM("DNI", "RUC", "PASAPORTE", "CARNET_EXTRANJERIA") NULL');
    console.log('✅ Tipo documento ahora es opcional\n');

    // 6. Hacer numero_documento opcional y quitar UNIQUE
    console.log('🔧 Haciendo numero_documento opcional y quitando restricción UNIQUE...');
    await conn.execute('ALTER TABLE senders DROP INDEX numero_documento');
    await conn.execute('ALTER TABLE senders MODIFY COLUMN numero_documento VARCHAR(20) NULL');
    console.log('✅ Numero documento ahora es opcional sin restricción UNIQUE\n');

    // 7. Crear índice para email y telefono
    console.log('🔧 Creando índice para email + telefono...');
    const [indexRows] = await conn.execute('SHOW INDEX FROM senders WHERE Key_name = "idx_email_telefono"');
    if (indexRows.length === 0) {
      await conn.execute('ALTER TABLE senders ADD INDEX idx_email_telefono (email, telefono)');
      console.log('✅ Índice idx_email_telefono creado\n');
    } else {
      console.log('✅ Índice idx_email_telefono ya existe\n');
    }

    // Mostrar estructura final
    console.log('📊 Estructura final de la tabla senders:');
    const [columns] = await conn.execute('SHOW COLUMNS FROM senders');
    console.table(columns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    console.log('\n✅ Migración completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    if (error.message.includes('Duplicate column')) {
      console.log('ℹ️  La columna ya existe, continuando...');
    } else if (error.message.includes('DROP INDEX')) {
      console.log('ℹ️  El índice no existe o ya fue eliminado, continuando...');
    } else {
      throw error;
    }
  } finally {
    await conn.end();
  }
}

fixSendersTable().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
