const { Permission } = require('./models');
const { Op } = require('sequelize');

async function checkDeletePermission() {
  try {
    console.log('\n🔍 Buscando permisos de document_types...\n');

    const permissions = await Permission.findAll({
      where: {
        codigo: {
          [Op.like]: 'document_types.%'
        }
      },
      order: [['codigo', 'ASC']]
    });

    console.log(`✅ Se encontraron ${permissions.length} permisos:\n`);
    
    permissions.forEach(perm => {
      console.log(`  ID: ${perm.id}`);
      console.log(`  Código: ${perm.codigo}`);
      console.log(`  Nombre: ${perm.nombre}`);
      console.log(`  Categoría: ${perm.categoria}`);
      console.log(`  Es sistema: ${perm.es_sistema ? 'Sí' : 'No'}`);
      console.log('  ---');
    });

    const deletePermission = permissions.find(p => p.codigo === 'document_types.delete');
    
    if (deletePermission) {
      console.log('✅ El permiso document_types.delete YA EXISTE\n');
    } else {
      console.log('⚠️  El permiso document_types.delete NO EXISTE\n');
      console.log('Necesitamos crearlo para usar el endpoint DELETE...\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDeletePermission();
