const { sequelize, Permission } = require('./models');

async function checkPermissionIds() {
  try {
    const selectedIds = [83, 84, 82, 81, 87, 88, 89, 86, 85, 73, 75, 78, 76, 68, 71, 74, 69, 70, 72, 80, 77, 67, 66, 79, 65, 63, 60, 64, 61, 62, 59, 58, 54, 55, 56, 57, 53, 92, 94, 91, 93, 90];

    console.log('🔍 Consultando permisos asignados al rol SECRETARIA...\n');

    const permissions = await Permission.findAll({
      where: {
        id: selectedIds
      },
      order: [['categoria', 'ASC'], ['id', 'ASC']],
      raw: true
    });

    // Agrupar por categoría
    const byCategory = permissions.reduce((acc, perm) => {
      if (!acc[perm.categoria]) {
        acc[perm.categoria] = [];
      }
      acc[perm.categoria].push(perm);
      return acc;
    }, {});

    console.log(`📊 Total de permisos: ${permissions.length}\n`);

    // Mostrar por categoría
    Object.keys(byCategory).sort().forEach(categoria => {
      console.log(`\n📁 ${categoria.toUpperCase()} (${byCategory[categoria].length} permisos)`);
      console.log('─'.repeat(80));
      byCategory[categoria].forEach(p => {
        console.log(`  [${p.id}] ${p.codigo}`);
        console.log(`      → ${p.nombre}`);
      });
    });

    // Verificar qué opciones del menú verá
    console.log('\n\n🎯 OPCIONES DEL MENÚ ADMIN QUE VERÁ:\n');

    const menuPermissions = {
      'Dashboard': { required: null, visible: true },
      'Áreas': { required: ['areas.view.all'], visible: false },
      'Roles': { required: ['roles.view', 'area_mgmt.roles.view'], visible: false },
      'Usuarios': { required: ['users.view.all', 'users.view.area', 'area_mgmt.users.view'], visible: false },
      'Tipos de Documento': { required: ['document_types.view', 'area_mgmt.document_types.view'], visible: false },
      'Categorías': { required: ['categories.view', 'area_mgmt.categories.full'], visible: false },
      'Reportes': { required: ['reports.view.all', 'reports.view.area', 'area_mgmt.reports.view'], visible: false }
    };

    const permissionCodes = permissions.map(p => p.codigo);

    Object.keys(menuPermissions).forEach(menu => {
      const config = menuPermissions[menu];
      if (!config.required) {
        console.log(`  ✅ ${menu} → Siempre visible`);
      } else {
        const hasAny = config.required.some(code => permissionCodes.includes(code));
        if (hasAny) {
          const matchedCodes = config.required.filter(code => permissionCodes.includes(code));
          console.log(`  ✅ ${menu} → Visible (tiene: ${matchedCodes.join(', ')})`);
        } else {
          console.log(`  ❌ ${menu} → NO visible (requiere al menos uno de: ${config.required.join(', ')})`);
        }
      }
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPermissionIds();
