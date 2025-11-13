/**
 * Script: Verificar cantidad de permisos en la base de datos
 * Ejecutar: node scripts/check-permissions-count.js
 */

const db = require('../models');
const { Permission } = db;

async function checkPermissionsCount() {
  try {
    console.log('🔍 Verificando permisos en la base de datos...\n');

    // Contar permisos totales
    const totalCount = await Permission.count();
    console.log(`📊 Total de permisos: ${totalCount}`);

    // Contar por categoría
    const categories = await Permission.findAll({
      attributes: [
        'categoria',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
      raw: true
    });

    console.log('\n📋 Permisos por categoría:\n');
    let totalExpected = 0;
    categories.forEach(cat => {
      const count = parseInt(cat.count);
      totalExpected += count;
      console.log(`   ${cat.categoria.padEnd(20)} : ${count} permisos`);
    });

    console.log('\n' + '─'.repeat(50));
    console.log(`   ${'TOTAL'.padEnd(20)} : ${totalCount} permisos`);
    console.log('─'.repeat(50));

    // Comparar con lo esperado (86 según init-database.sql)
    const expected = 86;
    if (totalCount === expected) {
      console.log(`\n✅ CORRECTO: Se encontraron los ${expected} permisos esperados`);
    } else {
      console.log(`\n⚠️  DIFERENCIA: Se esperaban ${expected} permisos, pero hay ${totalCount}`);
      console.log(`   Diferencia: ${totalCount - expected > 0 ? '+' : ''}${totalCount - expected} permisos`);
    }

    // Listar permisos faltantes o extras (comparar con init-database.sql)
    const expectedCategories = {
      'auth': 6,
      'users': 9,
      'roles': 5,
      'areas': 9,
      'categories': 6,
      'document_types': 6,
      'documents': 16,
      'attachments': 4,
      'versions': 5,
      'movements': 5,
      'reports': 4,
      'system': 3
    };

    console.log('\n📊 Comparación con init-database.sql:\n');
    let hasDiscrepancies = false;
    
    Object.entries(expectedCategories).forEach(([cat, expectedCount]) => {
      const actual = categories.find(c => c.categoria === cat);
      const actualCount = actual ? parseInt(actual.count) : 0;
      
      if (actualCount !== expectedCount) {
        hasDiscrepancies = true;
        const diff = actualCount - expectedCount;
        console.log(`   ⚠️  ${cat.padEnd(20)} : ${actualCount} (esperados: ${expectedCount}, ${diff > 0 ? '+' : ''}${diff})`);
      } else {
        console.log(`   ✅ ${cat.padEnd(20)} : ${actualCount}`);
      }
    });

    if (!hasDiscrepancies) {
      console.log('\n✨ Todas las categorías tienen la cantidad correcta de permisos\n');
    } else {
      console.log('\n⚠️  Se encontraron discrepancias. Ejecuta init-database.sql para corregir\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkPermissionsCount();
