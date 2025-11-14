/**
 * Script para crear el usuario Administrador en producción
 * Ejecutar UNA SOLA VEZ después del despliegue inicial
 * 
 * Uso:
 *   node create-admin.js
 * 
 * IMPORTANTE: 
 * - Solo ejecutar si no existe ningún administrador
 * - Cambiar la contraseña después del primer login
 * - El script es idempotente (no crea duplicados)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/sequelize');
const User = require('./models/User');
const Role = require('./models/Role');

const ADMIN_CONFIG = {
  nombre: 'Administrador del Sistema',
  email: 'admin@sgd.gob.pe',
  password: 'admin123',  // CAMBIAR INMEDIATAMENTE después del primer login
  is_active: true
};

async function createAdminUser() {
  try {
    console.log('\n===========================================');
    console.log('   CREACIÓN DE USUARIO ADMINISTRADOR');
    console.log('===========================================\n');

    // Verificar conexión a base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos exitosa\n');

    // Buscar rol de Administrador
    const adminRole = await Role.findOne({
      where: { nombre: 'Administrador' }
    });

    if (!adminRole) {
      console.error('❌ ERROR: Rol "Administrador" no encontrado en la base de datos');
      console.error('   Por favor, ejecuta primero el script init-database.sql\n');
      process.exit(1);
    }

    console.log(`✅ Rol Administrador encontrado (ID: ${adminRole.id})\n`);

    // Verificar si ya existe un administrador
    const existingAdmin = await User.findOne({
      where: { email: ADMIN_CONFIG.email }
    });

    if (existingAdmin) {
      console.log('⚠️  Usuario administrador ya existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.nombre}`);
      console.log(`   Estado: ${existingAdmin.is_active ? 'Activo' : 'Inactivo'}\n`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('¿Deseas restablecer la contraseña? (s/n): ', async (answer) => {
        if (answer.toLowerCase() === 's') {
          const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);
          await existingAdmin.update({ password: hashedPassword });
          console.log('\n✅ Contraseña restablecida exitosamente');
          console.log(`   Nueva contraseña temporal: ${ADMIN_CONFIG.password}`);
          console.log('   ⚠️  CAMBIAR INMEDIATAMENTE después del primer login\n');
        } else {
          console.log('\n✅ No se realizaron cambios\n');
        }
        readline.close();
        process.exit(0);
      });

      return;
    }

    // Hashear contraseña
    console.log('🔐 Generando hash de contraseña...');
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);

    // Crear usuario administrador
    console.log('👤 Creando usuario administrador...\n');
    const admin = await User.create({
      nombre: ADMIN_CONFIG.nombre,
      email: ADMIN_CONFIG.email,
      password: hashedPassword,
      rol_id: adminRole.id,
      area_id: null, // Administrador tiene acceso global
      is_active: true
    });

    console.log('===========================================');
    console.log('   ✅ ADMINISTRADOR CREADO EXITOSAMENTE');
    console.log('===========================================\n');
    console.log('Credenciales de acceso:');
    console.log(`  Email:    ${ADMIN_CONFIG.email}`);
    console.log(`  Password: ${ADMIN_CONFIG.password}`);
    console.log('\n⚠️  SEGURIDAD IMPORTANTE:');
    console.log('  1. Cambia la contraseña INMEDIATAMENTE después del primer login');
    console.log('  2. Usa una contraseña segura (mínimo 8 caracteres)');
    console.log('  3. No compartas estas credenciales');
    console.log('  4. Elimina este script después de usarlo\n');
    console.log('Próximos pasos:');
    console.log('  1. Accede al sistema: http://localhost:3000');
    console.log('  2. Inicia sesión con las credenciales de arriba');
    console.log('  3. Ve a Perfil > Cambiar Contraseña');
    console.log('  4. Crea otros usuarios desde el panel de administración\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR al crear usuario administrador:');
    console.error(error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Ejecutar
createAdminUser();
