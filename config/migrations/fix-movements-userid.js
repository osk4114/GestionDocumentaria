/**
 * Migración: Permitir NULL en user_id de document_movements
 * Para movimientos automáticos o desde Mesa de Partes Virtual
 */

const { sequelize } = require('../sequelize');

async function applyMigration() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   MIGRACIÓN: Permitir NULL en user_id (movements)     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    console.log('📝 Modificando user_id para permitir NULL...');
    
    await sequelize.query(`
      ALTER TABLE document_movements 
      MODIFY COLUMN user_id INT NULL 
      COMMENT 'Usuario que realiza el movimiento - NULL para acciones automáticas o públicas'
    `);
    
    console.log('   ✅ user_id ahora permite NULL\n');

    // Verificar
    const [result] = await sequelize.query(`
      SELECT 
        COLUMN_NAME as campo,
        COLUMN_TYPE as tipo,
        IS_NULLABLE as nullable,
        COLUMN_COMMENT as comentario
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db'
        AND TABLE_NAME = 'document_movements'
        AND COLUMN_NAME = 'user_id'
    `);

    console.log('🔍 Verificación:');
    console.table(result);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ MIGRACIÓN COMPLETADA                   ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n📌 Ahora se pueden crear movimientos sin usuario (Mesa de Partes Virtual)');

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
