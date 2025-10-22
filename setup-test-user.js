const { User, Role } = require('./models');
const bcrypt = require('bcryptjs');

async function setupTestUser() {
  try {
    // Buscar si existe el usuario
    let user = await User.findOne({ 
      where: { email: 'admin@sgd.com' },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (user) {
      console.log('✓ Usuario admin@sgd.com existe');
      console.log(`  Nombre: ${user.nombre}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Rol: ${user.role ? user.role.nombre : 'No asignado'}`);
      
      // Actualizar contraseña a admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await user.update({ password: hashedPassword });
      console.log('✓ Contraseña actualizada a: admin123');
    } else {
      console.log('✗ Usuario admin@sgd.com no existe');
      console.log('Creando usuario de prueba...');
      
      // Crear usuario admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await User.create({
        nombre: 'Administrador Sistema',
        email: 'admin@sgd.com',
        password: hashedPassword,
        rolId: 1,
        areaId: 1,
        isActive: true
      });
      
      console.log('✓ Usuario admin creado exitosamente');
    }
    
    process.exit(0);
  } catch (error) {
    console.log('✗ Error:', error.message);
    process.exit(1);
  }
}

setupTestUser();
