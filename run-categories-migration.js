/**
 * Script para ejecutar la migración de categorías y versiones
 */

const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Ejecutando migración de categorías y versiones...\n');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'migrations', 'create-area-categories.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Dividir en statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📄 Ejecutando ${statements.length} statements SQL...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Ignorar comentarios y líneas vacías
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim() === '') {
        continue;
      }

      try {
        await pool.execute(statement + ';');
        
        // Mostrar qué tabla se está creando
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE[^`]*`?(\w+)`?/i)?.[1] || 'desconocida';
          console.log(`✓ Tabla '${tableName}' creada`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE[^`]*`?(\w+)`?/i)?.[1] || 'desconocida';
          console.log(`✓ Tabla '${tableName}' modificada`);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO[^`]*`?(\w+)`?/i)?.[1] || 'desconocida';
          console.log(`✓ Datos insertados en '${tableName}'`);
        }
      } catch (error) {
        // Ignorar errores de "ya existe"
        if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
          console.log(`⚠ Ya existe (ignorado)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migración completada exitosamente!\n');

    // Verificar las nuevas tablas
    console.log('🔍 Verificando nuevas tablas...\n');
    
    const [tables] = await pool.execute("SHOW TABLES LIKE 'area_document_categories'");
    if (tables.length > 0) {
      console.log('✓ area_document_categories creada');
      const [count1] = await pool.execute('SELECT COUNT(*) as total FROM area_document_categories');
      console.log(`  Registros: ${count1[0].total}`);
    }

    const [tables2] = await pool.execute("SHOW TABLES LIKE 'document_versions'");
    if (tables2.length > 0) {
      console.log('✓ document_versions creada');
      const [count2] = await pool.execute('SELECT COUNT(*) as total FROM document_versions');
      console.log(`  Registros: ${count2[0].total}`);
    }

    // Verificar columna categoria_id
    const [columns] = await pool.execute('DESCRIBE documents');
    const hasCategoria = columns.some(col => col.Field === 'categoria_id');
    console.log(`${hasCategoria ? '✓' : '✗'} Columna categoria_id en documents ${hasCategoria ? 'agregada' : 'no encontrada'}`);

    console.log('\n🎉 Todo listo para usar las nuevas funcionalidades!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
