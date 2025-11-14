const { sequelize } = require('./config/sequelize');

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración: Sistema de Cargos\n');
    
    // 1. Crear tabla de cargos
    console.log('📝 Creando tabla document_cargos...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS document_cargos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        area_id INT NOT NULL,
        version_id INT NOT NULL,
        custom_name VARCHAR(255) DEFAULT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
        FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla creada\n');
    
    // 2. Crear índices
    console.log('📝 Creando índices...');
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cargos_area ON document_cargos(area_id)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cargos_version ON document_cargos(version_id)`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_cargos_created_by ON document_cargos(created_by)`);
    console.log('✅ Índices creados\n');
    
    // 3. Insertar permisos
    console.log('📝 Insertando permisos de cargos...');
    await sequelize.query(`
      INSERT INTO permissions (codigo, nombre, descripcion, categoria, is_active) VALUES
      ('area_mgmt.cargos.create', 'Crear Cargos', 'Puede conservar versiones como cargos en la bandeja del área', 'area_management', TRUE),
      ('area_mgmt.cargos.view', 'Ver Cargos del Área', 'Puede ver cargos almacenados en la bandeja del área', 'area_management', TRUE),
      ('area_mgmt.cargos.edit', 'Editar Nombre de Cargos', 'Puede renombrar cargos del área', 'area_management', TRUE),
      ('area_mgmt.cargos.delete', 'Eliminar Cargos del Área', 'Puede eliminar cargos del área', 'area_management', TRUE)
      ON DUPLICATE KEY UPDATE codigo=codigo
    `);
    console.log('✅ Permisos creados\n');
    
    // 4. Asignar permisos a ENCARGADO DE ÁREA
    console.log('📝 Asignando permisos a ENCARGADO DE ÁREA...');
    await sequelize.query(`
      INSERT INTO role_permissions (rol_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.nombre = 'ENCARGADO DE ÁREA'
        AND p.codigo IN ('area_mgmt.cargos.create', 'area_mgmt.cargos.view', 'area_mgmt.cargos.edit', 'area_mgmt.cargos.delete')
      ON DUPLICATE KEY UPDATE rol_id=rol_id
    `);
    
    // 5. Asignar permisos a SECRETARIA
    console.log('📝 Asignando permisos a SECRETARIA...');
    await sequelize.query(`
      INSERT INTO role_permissions (rol_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.nombre = 'SECRETARIA'
        AND p.codigo IN ('area_mgmt.cargos.create', 'area_mgmt.cargos.view', 'area_mgmt.cargos.edit')
      ON DUPLICATE KEY UPDATE rol_id=rol_id
    `);
    
    // 6. Asignar permisos a Practicante
    console.log('📝 Asignando permisos a Practicante...');
    await sequelize.query(`
      INSERT INTO role_permissions (rol_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.nombre = 'Practicante'
        AND p.codigo IN ('area_mgmt.cargos.create', 'area_mgmt.cargos.view', 'area_mgmt.cargos.edit')
      ON DUPLICATE KEY UPDATE rol_id=rol_id
    `);
    
    // 7. Asignar permisos a Administrador
    console.log('📝 Asignando permisos a Administrador...');
    await sequelize.query(`
      INSERT INTO role_permissions (rol_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.nombre = 'Administrador'
        AND p.codigo IN ('area_mgmt.cargos.create', 'area_mgmt.cargos.view', 'area_mgmt.cargos.edit', 'area_mgmt.cargos.delete')
      ON DUPLICATE KEY UPDATE rol_id=rol_id
    `);
    console.log('✅ Permisos asignados a roles\n');
    
    // Verificar resultados
    console.log('📊 Verificando resultados...\n');
    
    const [permissions] = await sequelize.query(`
      SELECT codigo, nombre 
      FROM permissions 
      WHERE codigo LIKE 'area_mgmt.cargos%'
      ORDER BY codigo
    `);
    
    console.log('📋 Permisos de cargos creados:');
    permissions.forEach(p => {
      console.log(`  ✓ ${p.codigo} - ${p.nombre}`);
    });
    console.log('');
    
    const [rolePerms] = await sequelize.query(`
      SELECT 
        r.nombre as rol,
        COUNT(rp.permission_id) as permisos_cargos
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.rol_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.codigo LIKE 'area_mgmt.cargos%'
      WHERE r.nombre IN ('Administrador', 'ENCARGADO DE ÁREA', 'SECRETARIA', 'Practicante')
      GROUP BY r.nombre
      ORDER BY r.nombre
    `);
    
    console.log('👥 Permisos asignados a roles:');
    rolePerms.forEach(rp => {
      console.log(`  ${rp.rol}: ${rp.permisos_cargos} permisos`);
    });
    
    console.log('\n✅ ¡Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al ejecutar migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
