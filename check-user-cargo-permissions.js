const { pool } = require('./config/database');

async function checkUserCargoPermissions() {
  try {
    // Verificar rol y permisos del usuario 9
    const [users] = await pool.query(`
      SELECT u.id, u.nombre, u.email, r.nombre as rol, r.id as roleId
      FROM users u 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.id = 9
    `);
    
    console.log('\n👤 Usuario:');
    console.log(JSON.stringify(users[0], null, 2));
    
    // Verificar permisos de cargo
    const [cargoPerms] = await pool.query(`
      SELECT p.id, p.codigo, p.nombre
      FROM permissions p
      WHERE p.codigo LIKE '%cargo%'
      ORDER BY p.codigo
    `);
    
    console.log('\n📋 Permisos de Cargo disponibles:');
    cargoPerms.forEach(p => {
      console.log(`  ${p.codigo}: ${p.nombre}`);
    });
    
    // Verificar permisos asignados al rol del usuario
    const roleId = users[0].roleId;
    const [rolePerms] = await pool.query(`
      SELECT p.codigo, p.nombre
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.rol_id = ? AND p.codigo LIKE '%cargo%'
      ORDER BY p.codigo
    `, [roleId]);
    
    console.log(`\n✅ Permisos de Cargo asignados al rol "${users[0].rol}":`);
    if (rolePerms.length === 0) {
      console.log('  ❌ NINGUNO - Este es el problema!');
    } else {
      rolePerms.forEach(p => {
        console.log(`  ${p.codigo}: ${p.nombre}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserCargoPermissions();
