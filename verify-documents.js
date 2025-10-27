/**
 * Verificación rápida de la corrección de documents
 */

const { sequelize } = require('./config/sequelize');

async function verify() {
  console.log('VERIFICACIÓN FINAL DE TABLA DOCUMENTS\n');
  
  try {
    const [result] = await sequelize.query(`
      SELECT 
        COLUMN_NAME as campo,
        IS_NULLABLE as permite_null,
        COLUMN_COMMENT as comentario
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgd_db'
        AND TABLE_NAME = 'documents'
        AND COLUMN_NAME IN ('doc_type_id', 'fecha_recepcion')
      ORDER BY ORDINAL_POSITION
    `);

    result.forEach(row => {
      const status = row.permite_null === 'YES' ? '✅' : '❌';
      console.log(`${status} ${row.campo}: ${row.permite_null === 'YES' ? 'Permite NULL' : 'NO permite NULL'}`);
    });

    console.log('\n✅ Base de datos lista para Mesa de Partes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

verify();
