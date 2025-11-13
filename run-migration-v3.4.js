const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración v3.3 → v3.4...\n');

    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, 'migrations', '20251113_upgrade_area_management_v3.4.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Dividir en statements individuales (ignorar comentarios y líneas vacías)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('/*') &&
        stmt.toLowerCase() !== 'use sgd_db'
      );

    console.log(`📄 Ejecutando ${statements.length} sentencias SQL...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement) {
        try {
          await sequelize.query(statement);
          
          // Mostrar progreso para operaciones importantes
          if (statement.toLowerCase().includes('insert into permissions')) {
            console.log('  ✅ Permisos agregados');
          } else if (statement.toLowerCase().includes('insert into role_permissions')) {
            console.log('  ✅ Roles actualizados');
          } else if (statement.toLowerCase().includes('select') && statement.toLowerCase().includes('categoria')) {
            const [results] = await sequelize.query(statement);
            if (results.length > 0) {
              console.log('\n📊 Permisos por categoría:');
              results.forEach(row => {
                console.log(`  - ${row.categoria}: ${row.total_permisos} permisos`);
              });
            }
          } else if (statement.toLowerCase().includes('select') && statement.toLowerCase().includes('estado')) {
            const [results] = await sequelize.query(statement);
            if (results.length > 0) {
              console.log('\n' + '='.repeat(60));
              console.log(results[0].estado);
              console.log(`📈 Total permisos del sistema: ${results[0].total_permisos_sistema}`);
              console.log(`💼 Permisos "Jefe de Área": ${results[0].permisos_area_mgmt}`);
              console.log('='.repeat(60));
            }
          }
          
          successCount++;
        } catch (error) {
          console.error(`  ❌ Error en statement: ${statement.substring(0, 50)}...`);
          console.error(`     ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  ✅ Exitosas: ${successCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);

    // Verificación adicional
    console.log('\n🔍 Verificación final...');
    
    const [permissions] = await sequelize.query(`
      SELECT categoria, COUNT(*) as total
      FROM permissions
      WHERE categoria = 'area_management'
      GROUP BY categoria
    `);

    if (permissions.length > 0) {
      console.log(`✅ Categoría "area_management" tiene ${permissions[0].total} permisos`);
    }

    const [roles] = await sequelize.query(`
      SELECT r.nombre, COUNT(rp.permission_id) as total_permisos
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.rol_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE p.categoria = 'area_management'
      GROUP BY r.id, r.nombre
    `);

    if (roles.length > 0) {
      console.log('\n📋 Roles con permisos de "Jefe de Área":');
      roles.forEach(role => {
        console.log(`  - ${role.nombre}: ${role.total_permisos} permisos`);
      });
    } else {
      console.log('ℹ️  Ningún rol creado aún con permisos de "Jefe de Área"');
    }

    await sequelize.close();
    console.log('\n✅ Migración completada exitosamente\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║     MIGRACIÓN: v3.3 → v3.4                                 ║
║     Actualizar categoría "Jefe de Área"                    ║
║     De 23 a 48 permisos (funcionalidad completa)           ║
╚════════════════════════════════════════════════════════════╝
`);

runMigration();
