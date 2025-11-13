const db = require('./models');
const { Op } = require('sequelize');

async function checkDerivePermissions() {
  try {
    console.log('🔍 Verificando permisos de derivación...\n');
    
    // Buscar todos los permisos relacionados con derivación
    const derivePermissions = await db.Permission.findAll({
      where: {
        [Op.or]: [
          { codigo: { [Op.like]: '%derive%' } },
          { nombre: { [Op.like]: '%derivar%' } },
          { nombre: { [Op.like]: '%Derivar%' } }
        ]
      }
    });
    
    console.log('📋 Permisos de derivación disponibles:');
    derivePermissions.forEach(p => {
      console.log(`  • ${p.codigo} - ${p.nombre}`);
    });
    
    // Verificar roles específicos
    const roles = await db.Role.findAll({
      where: {
        nombre: ['Jefe de Área', 'Practicante', 'Encargado de Área']
      },
      include: [{
        model: db.Permission,
        as: 'permissions',
        where: {
          [Op.or]: [
            { codigo: 'documents.derive' },
            { codigo: 'area_mgmt.documents.manage' },
            { codigo: 'area_mgmt.documents.derive' }
          ]
        },
        required: false
      }]
    });
    
    console.log('\n📊 Permisos por rol:\n');
    for (const role of roles) {
      console.log(`🔹 ${role.nombre} (Área: ${role.areaId || 'Global'}):`);
      if (role.permissions && role.permissions.length > 0) {
        role.permissions.forEach(p => {
          console.log(`  ✓ ${p.codigo} - ${p.nombre}`);
        });
      } else {
        console.log('  ✗ Sin permisos de derivación');
      }
      console.log('');
    }
    
    // Verificar usuarios específicos
    console.log('👥 Usuarios de prueba:\n');
    const users = await db.User.findAll({
      where: {
        email: ['edgar.burneo@unjbg.edu.pe', 'lucrecia@unjbg.edu.pe']
      },
      include: [
        {
          model: db.Role,
          as: 'role',
          include: [{
            model: db.Permission,
            as: 'permissions',
            where: {
              [Op.or]: [
                { codigo: 'documents.derive' },
                { codigo: 'area_mgmt.documents.manage' }
              ]
            },
            required: false
          }]
        }
      ]
    });
    
    for (const user of users) {
      console.log(`🔹 ${user.nombre} (@${user.username}) - ${user.role?.nombre}`);
      if (user.role?.permissions && user.role.permissions.length > 0) {
        user.role.permissions.forEach(p => {
          console.log(`  ✓ Puede derivar: ${p.codigo}`);
        });
      } else {
        console.log('  ✗ NO puede derivar documentos');
      }
      console.log('');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDerivePermissions();
