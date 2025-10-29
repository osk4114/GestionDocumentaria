/**
 * Script para verificar la estructura actual de la base de datos
 * Muestra todas las tablas existentes y sus columnas
 */

const { pool } = require('./config/database');

async function checkDatabaseStructure() {
  try {
    console.log('🔍 REVISANDO ESTRUCTURA DE LA BASE DE DATOS sgd_db\n');
    console.log('='.repeat(80));

    // Verificar conexión
    const [connection] = await pool.execute('SELECT DATABASE() as db');
    console.log(`✓ Conectado a la base de datos: ${connection[0].db}\n`);

    // Obtener lista de tablas
    const [tables] = await pool.execute('SHOW TABLES');
    const tableList = tables.map(row => Object.values(row)[0]);

    console.log(`📊 TABLAS EXISTENTES (${tableList.length}):\n`);
    
    for (let i = 0; i < tableList.length; i++) {
      const tableName = tableList[i];
      console.log(`\n${i + 1}. ${tableName.toUpperCase()}`);
      console.log('-'.repeat(80));

      // Obtener columnas de cada tabla
      const [columns] = await pool.execute(`DESCRIBE ${tableName}`);
      
      console.log('Columnas:');
      columns.forEach(col => {
        const nullable = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
        const key = col.Key ? `[${col.Key}]` : '';
        const extra = col.Extra ? `(${col.Extra})` : '';
        console.log(`  - ${col.Field.padEnd(30)} ${col.Type.padEnd(25)} ${nullable.padEnd(10)} ${key} ${extra}`);
      });

      // Contar registros
      const [count] = await pool.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
      console.log(`\n  📦 Registros: ${count[0].total}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ REVISIÓN COMPLETADA\n');

    // Verificar si existen las nuevas tablas
    console.log('🔍 VERIFICANDO NUEVAS TABLAS:\n');
    
    const newTables = [
      'area_document_categories',
      'document_versions'
    ];

    for (const table of newTables) {
      const exists = tableList.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table} ${exists ? '(EXISTE)' : '(NO EXISTE - NECESITA MIGRACIÓN)'}`);
    }

    // Verificar si la columna categoria_id existe en documents
    console.log('\n🔍 VERIFICANDO COLUMNA categoria_id EN documents:\n');
    const [docColumns] = await pool.execute('DESCRIBE documents');
    const hasCategoriaId = docColumns.some(col => col.Field === 'categoria_id');
    console.log(`  ${hasCategoriaId ? '✓' : '✗'} categoria_id ${hasCategoriaId ? '(EXISTE)' : '(NO EXISTE - NECESITA MIGRACIÓN)'}`);

    console.log('\n' + '='.repeat(80));

    process.exit(0);

  } catch (error) {
    console.error('❌ Error al revisar la base de datos:', error.message);
    process.exit(1);
  }
}

checkDatabaseStructure();
