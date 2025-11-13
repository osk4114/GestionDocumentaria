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
      console.log(`  Área: ${user.areaId || 'NULL (acceso global)'}`);
      
      // Actualizar contraseña y quitar área
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await user.update({ 
        password: hashedPassword,
        areaId: null // ← Sin área asignada (acceso global)
      });
      console.log('✓ Contraseña actualizada a: admin123');
      console.log('✓ Área actualizada a: NULL (acceso global)');
    } else {
      console.log('✗ Usuario admin@sgd.com no existe');
      console.log('Creando usuario Administrador...');
      
      // Crear usuario admin SIN ÁREA (acceso global)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await User.create({
        nombre: 'Administrador Sistema',
        email: 'admin@sgd.com',
        password: hashedPassword,
        rolId: 1,
        areaId: null, // ← Sin área asignada (acceso global)
        isActive: true
      });
      
      console.log('✓ Usuario Administrador creado exitosamente');
      console.log('  - Email: admin@sgd.com');
      console.log('  - Password: admin123');
      console.log('  - Área: NULL (acceso global a todas las áreas)');
    }
    
    process.exit(0);
  } catch (error) {
    console.log('✗ Error:', error.message);
    process.exit(1);
  }
}

setupTestUser();
