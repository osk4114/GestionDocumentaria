const { sequelize } = require('./config/sequelize');

async function addDeactivatePermission() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    // Insertar directamente con SQL para evitar la validación de Sequelize
    const [results] = await sequelize.query(`
      INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema, created_at, updated_at)
      VALUES ('document_types.deactivate', 'Desactivar Tipos de Documento', 'Permite desactivar tipos de documento existentes', 'document_types', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE updated_at = NOW()
    `);

    console.log('✅ Permiso document_types.deactivate creado/actualizado');

    // Obtener el ID del permiso recién creado
    const [[permission]] = await sequelize.query(`
      SELECT id FROM permissions WHERE codigo = 'document_types.deactivate' LIMIT 1
    `);

    console.log(`   ID del permiso: ${permission.id}`);

    // Asignar al rol Administrador
    const [[adminRole]] = await sequelize.query(`
      SELECT id FROM roles WHERE nombre = 'Administrador' LIMIT 1
    `);

    if (adminRole) {
      await sequelize.query(`
        INSERT INTO role_permissions (rol_id, permission_id, fecha_asignacion, created_at, updated_at)
        VALUES (${adminRole.id}, ${permission.id}, NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `);
      console.log(`✅ Permiso asignado al rol Administrador (roleId: ${adminRole.id})`);
    }

    console.log('\n✅ Proceso completado exitosamente');
    console.log('💡 Recarga la sesión en el frontend para que los permisos tomen efecto');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

addDeactivatePermission();
