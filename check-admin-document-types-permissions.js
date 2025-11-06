const { RolePermission, Role, Permission } = require('./models');

async function checkAdminPermissions() {
  try {
    console.log('\n🔍 Verificando permisos del rol Administrador...\n');

    // Buscar rol Administrador
    const adminRole = await Role.findOne({
      where: { nombre: 'Administrador' }
    });

    if (!adminRole) {
      console.log('❌ No se encontró el rol Administrador');
      process.exit(1);
    }

    console.log(`✅ Rol Administrador encontrado (ID: ${adminRole.id})\n`);

    // Buscar permisos de document_types
    const permissions = await Permission.findAll({
      where: {
        codigo: {
          [require('sequelize').Op.like]: 'document_types.%'
        }
      },
      order: [['codigo', 'ASC']]
    });

    console.log('📋 Verificando asignaciones:\n');

    for (const perm of permissions) {
      const assignment = await RolePermission.findOne({
        where: {
          rol_id: adminRole.id,
          permission_id: perm.id
        }
      });

      const status = assignment ? '✅ ASIGNADO' : '❌ NO ASIGNADO';
      console.log(`  ${status} - ${perm.codigo} (ID: ${perm.id})`);
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdminPermissions();
