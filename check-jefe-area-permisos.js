const { sequelize, Role, Permission, RolePermission } = require('./models');

async function checkJefeAreaRole() {
  try {
    console.log('🔍 Buscando rol "Jefe de Área"...\n');

    const jefeAreaRole = await Role.findOne({
      where: { nombre: 'Jefe de Área' },
      include: [{
        model: Permission,
        as: 'permissions',
        through: { attributes: [] }
      }]
    });

    if (!jefeAreaRole) {
      console.log('❌ No se encontró el rol "Jefe de Área"');
      await sequelize.close();
      return;
    }

    console.log(`✅ Rol encontrado: ${jefeAreaRole.nombre}`);
    console.log(`   ID: ${jefeAreaRole.id}`);
    console.log(`   Descripción: ${jefeAreaRole.descripcion}`);
    console.log(`   Total permisos: ${jefeAreaRole.permissions.length}\n`);

    // Agrupar por categoría
    const byCategory = jefeAreaRole.permissions.reduce((acc, perm) => {
      if (!acc[perm.categoria]) {
        acc[perm.categoria] = [];
      }
      acc[perm.categoria].push(perm);
      return acc;
    }, {});

    console.log('📊 PERMISOS ASIGNADOS POR CATEGORÍA:\n');

    Object.keys(byCategory).sort().forEach(categoria => {
      console.log(`\n📁 ${categoria.toUpperCase()} (${byCategory[categoria].length} permisos)`);
      console.log('─'.repeat(80));
      byCategory[categoria].forEach(p => {
        console.log(`  [${p.id}] ${p.codigo}`);
      });
    });

    // Verificar permisos faltantes para funcionalidad completa
    console.log('\n\n🔍 ANÁLISIS DE PERMISOS PARA FUNCIONALIDAD COMPLETA:\n');

    const requiredForDocuments = [
      'documents.view.area',
      'documents.view.own',
      'documents.create',
      'documents.edit.area',
      'documents.derive',
      'documents.finalize',
      'documents.archive',
      'documents.category.assign',
      'documents.search',
      'movements.view',
      'movements.accept',
      'movements.reject',
      'movements.complete',
      'attachments.view',
      'attachments.upload',
      'attachments.download',
      'versions.view',
      'versions.upload'
    ];

    const currentCodes = jefeAreaRole.permissions.map(p => p.codigo);
    
    console.log('✅ Permisos que SÍ tiene:');
    requiredForDocuments.forEach(code => {
      if (currentCodes.includes(code)) {
        console.log(`   ✓ ${code}`);
      }
    });

    console.log('\n❌ Permisos que NO tiene (pero debería):');
    requiredForDocuments.forEach(code => {
      if (!currentCodes.includes(code)) {
        console.log(`   ✗ ${code}`);
      }
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkJefeAreaRole();
