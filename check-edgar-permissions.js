const { sequelize, User, Role, Permission } = require('./models');

async function checkEdgarPermissions() {
  try {
    console.log('🔍 Verificando permisos de Edgar Burneo...\n');

    const edgar = await User.findOne({
      where: { email: 'burn@gmail.com' },
      include: [{
        model: Role,
        as: 'role',
        include: [{
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      }]
    });

    if (!edgar) {
      console.log('❌ Usuario no encontrado');
      await sequelize.close();
      return;
    }

    console.log(`✅ Usuario: ${edgar.nombre} (${edgar.email})`);
    console.log(`   Rol: ${edgar.role.nombre}`);
    console.log(`   Total permisos: ${edgar.role.permissions.length}\n`);

    // Agrupar por categoría
    const byCategory = edgar.role.permissions.reduce((acc, perm) => {
      if (!acc[perm.categoria]) {
        acc[perm.categoria] = [];
      }
      acc[perm.categoria].push(perm.codigo);
      return acc;
    }, {});

    console.log('📊 PERMISOS POR CATEGORÍA:\n');
    Object.keys(byCategory).sort().forEach(cat => {
      console.log(`\n📁 ${cat.toUpperCase()} (${byCategory[cat].length})`);
      byCategory[cat].forEach(codigo => {
        console.log(`  - ${codigo}`);
      });
    });

    // Verificar permisos críticos para la bandeja
    console.log('\n\n🔍 PERMISOS CRÍTICOS PARA BANDEJA:\n');

    const criticalPermissions = [
      { codigo: 'area_mgmt.documents.view', desc: 'Ver documentos en bandeja' },
      { codigo: 'area_mgmt.documents.derive', desc: 'Botón DERIVAR' },
      { codigo: 'area_mgmt.documents.archive', desc: 'Botón ARCHIVAR' },
      { codigo: 'area_mgmt.documents.status.change', desc: 'Cambiar estados' },
      { codigo: 'area_mgmt.documents.category.assign', desc: 'Asignar categoría' },
      { codigo: 'area_mgmt.attachments.view', desc: 'Ver adjuntos' },
      { codigo: 'area_mgmt.attachments.download', desc: 'Descargar adjuntos' },
      { codigo: 'area_mgmt.versions.view', desc: 'Ver versiones' },
      { codigo: 'area_mgmt.movements.view', desc: 'Ver historial' }
    ];

    const allCodes = edgar.role.permissions.map(p => p.codigo);

    criticalPermissions.forEach(({ codigo, desc }) => {
      const has = allCodes.includes(codigo);
      console.log(`  ${has ? '✅' : '❌'} ${codigo.padEnd(40)} → ${desc}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkEdgarPermissions();
