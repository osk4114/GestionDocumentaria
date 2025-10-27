/**
 * Migración: Corrección de tabla documents
 * - Permitir NULL en doc_type_id
 * - Agregar campo fecha_recepcion
 */

const { sequelize } = require('../sequelize');

async function applyMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     MIGRACIÓN: Corrección de tabla DOCUMENTS          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Modificar doc_type_id para permitir NULL
    console.log('📝 1/2: Permitiendo NULL en doc_type_id...');
    await sequelize.query(`
      ALTER TABLE documents 
      MODIFY COLUMN doc_type_id INT NULL 
      COMMENT 'Tipo de documento - NULL permitido para documentos sin clasificar desde mesa de partes'
    `);
    console.log('   ✅ doc_type_id ahora permite NULL\n');

    // 2. Verificar si fecha_recepcion ya existe
    console.log('📝 2/2: Verificando campo fecha_recepcion...');
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db'
        AND TABLE_NAME = 'documents'
        AND COLUMN_NAME = 'fecha_recepcion'
    `);

    if (columns.length > 0) {
      console.log('   ⚠️  Campo fecha_recepcion ya existe\n');
    } else {
      await sequelize.query(`
        ALTER TABLE documents 
        ADD COLUMN fecha_recepcion TIMESTAMP NULL 
        COMMENT 'Fecha en que fue recepcionado el documento'
        AFTER created_at
      `);
      console.log('   ✅ Campo fecha_recepcion agregado\n');
    }

    // 3. Verificar cambios
    console.log('🔍 Verificando cambios:\n');
    const [result] = await sequelize.query(`
      SELECT 
        COLUMN_NAME as campo,
        COLUMN_TYPE as tipo,
        IS_NULLABLE as nullable,
        COLUMN_COMMENT as comentario
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db'
        AND TABLE_NAME = 'documents'
        AND COLUMN_NAME IN ('doc_type_id', 'fecha_recepcion')
      ORDER BY ORDINAL_POSITION
    `);

    console.table(result);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ MIGRACIÓN COMPLETADA                   ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\nCambios aplicados:');
    console.log('  ✅ doc_type_id permite NULL');
    console.log('  ✅ Campo fecha_recepcion agregado');
    console.log('  ✅ Modelo Document.js actualizado');
    console.log('  ✅ init-database.sql actualizado');
    console.log('\n📌 La base de datos está lista para recibir documentos desde Mesa de Partes');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error.message);
    if (error.parent) {
      console.error('\nDetalles SQL:');
      console.error(error.parent.sqlMessage);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

applyMigration();
