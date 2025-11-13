const { sequelize, Permission, RolePermission } = require('./models');

async function upgradAreaManagement() {
  try {
    console.log('🔄 Actualizando categoría "Jefe de Área"...\n');

    // Nuevos permisos a agregar
    const newPermissions = [
      // Documentos ampliados (9 permisos nuevos)
      { codigo: 'area_mgmt.documents.view.own', nombre: 'Ver Documentos Asignados', descripcion: 'Ver documentos asignados personalmente', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.derive', nombre: 'Derivar Documentos', descripcion: 'Derivar documentos a otras áreas o usuarios', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.finalize', nombre: 'Finalizar Documentos', descripcion: 'Finalizar/atender documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.archive', nombre: 'Archivar Documentos', descripcion: 'Archivar documentos completados', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.unarchive', nombre: 'Desarchivar Documentos', descripcion: 'Recuperar documentos archivados', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.category.assign', nombre: 'Asignar Categorías', descripcion: 'Asignar/cambiar categorías de documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.status.change', nombre: 'Cambiar Estados', descripcion: 'Cambiar estados de documentos manualmente', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.search', nombre: 'Buscar Documentos', descripcion: 'Realizar búsquedas avanzadas de documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.documents.stats.view', nombre: 'Ver Estadísticas de Documentos', descripcion: 'Ver estadísticas de documentos del área', categoria: 'area_management' },
      
      // Adjuntos específicos (4 permisos nuevos)
      { codigo: 'area_mgmt.attachments.view', nombre: 'Ver Adjuntos', descripcion: 'Ver archivos adjuntos a documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.attachments.upload', nombre: 'Subir Adjuntos', descripcion: 'Subir archivos adjuntos a documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.attachments.download', nombre: 'Descargar Adjuntos', descripcion: 'Descargar archivos adjuntos', categoria: 'area_management' },
      { codigo: 'area_mgmt.attachments.delete', nombre: 'Eliminar Adjuntos', descripcion: 'Eliminar archivos adjuntos', categoria: 'area_management' },
      
      // Versiones específicas (5 permisos nuevos)
      { codigo: 'area_mgmt.versions.view', nombre: 'Ver Versiones', descripcion: 'Ver historial de versiones de documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.versions.upload', nombre: 'Subir Versiones', descripcion: 'Subir nuevas versiones de documentos', categoria: 'area_management' },
      { codigo: 'area_mgmt.versions.download', nombre: 'Descargar Versiones', descripcion: 'Descargar versiones de documentos (con sello/firma)', categoria: 'area_management' },
      { codigo: 'area_mgmt.versions.list', nombre: 'Listar Versiones', descripcion: 'Listar todas las versiones disponibles', categoria: 'area_management' },
      { codigo: 'area_mgmt.versions.delete', nombre: 'Eliminar Versiones', descripcion: 'Eliminar versiones de documentos', categoria: 'area_management' },
      
      // Movimientos específicos (1 permiso nuevo)
      { codigo: 'area_mgmt.movements.create', nombre: 'Crear Movimientos Manuales', descripcion: 'Crear movimientos manuales (uso avanzado)', categoria: 'area_management' }
    ];

    console.log(`📝 Insertando ${newPermissions.length} nuevos permisos...\n`);

    let insertedCount = 0;
    let skippedCount = 0;
    const newPermissionIds = [];

    for (const perm of newPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { codigo: perm.codigo },
        defaults: {
          ...perm,
          es_sistema: true
        }
      });

      if (created) {
        console.log(`  ✅ ${perm.codigo}`);
        insertedCount++;
        newPermissionIds.push(permission.id);
      } else {
        console.log(`  ⏭️  ${perm.codigo} (ya existe)`);
        skippedCount++;
        newPermissionIds.push(permission.id);
      }
    }

    console.log(`\n📊 Resumen de inserción:`);
    console.log(`  ✅ Nuevos: ${insertedCount}`);
    console.log(`  ⏭️  Ya existían: ${skippedCount}`);

    // Verificar total de permisos en area_management
    const totalAreaMgmt = await Permission.count({
      where: { categoria: 'area_management' }
    });

    console.log(`\n💼 Total permisos "Jefe de Área": ${totalAreaMgmt}`);

    // Encontrar roles que tienen permisos de area_management
    const [rolesWithAreaMgmt] = await sequelize.query(`
      SELECT DISTINCT r.id, r.nombre
      FROM roles r
      INNER JOIN role_permissions rp ON r.id = rp.rol_id
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE p.categoria = 'area_management'
    `);

    if (rolesWithAreaMgmt.length > 0) {
      console.log(`\n🔄 Actualizando ${rolesWithAreaMgmt.length} rol(es) existente(s)...\n`);

      for (const role of rolesWithAreaMgmt) {
        console.log(`  📋 ${role.nombre} (ID: ${role.id})`);
        
        let addedCount = 0;
        for (const permId of newPermissionIds) {
          const [rolePermission, created] = await RolePermission.findOrCreate({
            where: {
              rol_id: role.id,
              permission_id: permId
            }
          });

          if (created) {
            addedCount++;
          }
        }

        const total = await RolePermission.count({
          where: { rol_id: role.id },
          include: [{
            model: Permission,
            as: 'permission',
            where: { categoria: 'area_management' }
          }]
        });

        console.log(`    ✅ ${addedCount} permisos agregados (total: ${total})\n`);
      }
    } else {
      console.log('\nℹ️  No hay roles existentes con permisos de "Jefe de Área"\n');
    }

    // Verificación final
    console.log('🔍 Verificación final:\n');
    
    const [categoryCounts] = await sequelize.query(`
      SELECT categoria, COUNT(*) as total
      FROM permissions
      WHERE es_sistema = TRUE
      GROUP BY categoria
      ORDER BY categoria
    `);

    console.log('📊 Permisos por categoría:');
    categoryCounts.forEach(cat => {
      const icon = cat.categoria === 'area_management' ? '💼' : '  ';
      console.log(`  ${icon} ${cat.categoria}: ${cat.total}`);
    });

    const totalPermisos = await Permission.count({ where: { es_sistema: true } });
    console.log(`\n✅ Total permisos del sistema: ${totalPermisos}`);

    await sequelize.close();
    console.log('\n🎉 Migración completada exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║     MIGRACIÓN: v3.3 → v3.4                                 ║
║     Categoría "Jefe de Área": 23 → 48 permisos            ║
╚════════════════════════════════════════════════════════════╝
`);

upgradAreaManagement();
