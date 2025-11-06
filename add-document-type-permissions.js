const { sequelize } = require('./config/sequelize');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');
const Role = require('./models/Role');

async function addDocumentTypePermissions() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    // Permisos a agregar
    const permissions = [
      {
        codigo: 'document_types.deactivate',
        nombre: 'Desactivar Tipos de Documento',
        descripcion: 'Permite desactivar tipos de documento existentes',
        categoria: 'document_types',
        es_sistema: true
      },
      {
        codigo: 'document_types.activate',
        nombre: 'Activar Tipos de Documento',
        descripcion: 'Permite activar tipos de documento previamente desactivados',
        categoria: 'document_types',
        es_sistema: true
      }
    ];

    console.log('\n📋 Agregando permisos de tipos de documento...');

    for (const perm of permissions) {
      // Verificar si el permiso ya existe
      const existingPerm = await Permission.findOne({
        where: { codigo: perm.codigo }
      });

      if (existingPerm) {
        console.log(`⚠️  Permiso ${perm.codigo} ya existe (ID: ${existingPerm.id})`);
        continue;
      }

      // Crear el permiso
      const newPerm = await Permission.create(perm);
      console.log(`✅ Permiso creado: ${newPerm.codigo} (ID: ${newPerm.id})`);

      // Asignar automáticamente al rol Administrador
      const adminRole = await Role.findOne({ where: { nombre: 'Administrador' } });
      
      if (adminRole) {
        await RolePermission.create({
          roleId: adminRole.id,
          permissionId: newPerm.id
        });
        console.log(`   ✓ Asignado al rol Administrador`);
      }
    }

    console.log('\n✅ Proceso completado exitosamente');
    console.log('\n📌 Permisos agregados:');
    console.log('   - document_types.deactivate');
    console.log('   - document_types.activate');
    console.log('\n💡 Recarga la sesión en el frontend para que los permisos tomen efecto');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

addDocumentTypePermissions();
