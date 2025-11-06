const { sequelize } = require('./config/sequelize');
const Permission = require('./models/Permission');
const { Op } = require('sequelize');

async function checkPermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    const permissions = await Permission.findAll({
      where: {
        codigo: {
          [Op.like]: 'document_types.%'
        }
      },
      order: [['codigo', 'ASC']]
    });

    console.log('📋 Permisos de document_types encontrados:\n');
    permissions.forEach(p => {
      console.log(`   - ${p.codigo} (ID: ${p.id})`);
      console.log(`     Nombre: ${p.nombre}`);
      console.log(`     Descripción: ${p.descripcion}`);
      console.log(`     Sistema: ${p.es_sistema ? 'Sí' : 'No'}\n`);
    });

    console.log(`Total: ${permissions.length} permisos`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPermissions();
