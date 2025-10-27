/**
 * Script de migración completa para solucionar problemas de documents
 * Basado en la revisión completa de la base de datos
 * 
 * PROBLEMAS IDENTIFICADOS:
 * 1. doc_type_id NO permite NULL (debe permitir NULL para mesa de partes)
 * 2. Falta campo fecha_recepcion en documents
 * 
 * SOLUCIONES:
 * 1. ALTER TABLE documents MODIFY doc_type_id INT(11) NULL
 * 2. ALTER TABLE documents ADD COLUMN fecha_recepcion TIMESTAMP NULL AFTER created_at
 */

const { sequelize } = require('./config/sequelize');

async function fixDocumentsTable() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     MIGRACIÓN: Corrección de tabla DOCUMENTS          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Modificar doc_type_id para permitir NULL
    console.log('📝 1/2: Permitiendo NULL en doc_type_id...');
    await sequelize.query(`
      ALTER TABLE documents 
      MODIFY COLUMN doc_type_id INT(11) NULL
      COMMENT 'Tipo de documento - NULL para documentos sin clasificar desde mesa de partes'
    `);
    console.log('   ✅ doc_type_id ahora permite NULL\n');

    // 2. Agregar campo fecha_recepcion
    console.log('📝 2/2: Agregando campo fecha_recepcion...');
    
    // Verificar si ya existe
    const [columns] = await sequelize.query(`
      SHOW COLUMNS FROM documents WHERE Field = 'fecha_recepcion'
    `);

    if (columns.length > 0) {
      console.log('   ⚠️  Campo fecha_recepcion ya existe, omitiendo...\n');
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
    console.log('🔍 Verificando cambios en la tabla documents...\n');
    const [result] = await sequelize.query(`
      SELECT 
        COLUMN_NAME as campo,
        COLUMN_TYPE as tipo,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as 'default',
        COLUMN_COMMENT as comentario
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db'
        AND TABLE_NAME = 'documents'
        AND COLUMN_NAME IN ('doc_type_id', 'fecha_recepcion')
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Campos actualizados:');
    console.table(result);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ MIGRACIÓN EXITOSA                      ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\nCambios realizados:');
    console.log('  ✅ doc_type_id ahora permite NULL');
    console.log('  ✅ Campo fecha_recepcion agregado');
    console.log('\n📌 SIGUIENTE PASO: Actualizar el modelo Document.js');

  } catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error.message);
    if (error.parent) {
      console.error('\nDetalles del error SQL:');
      console.error(error.parent.sqlMessage);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixDocumentsTable();
