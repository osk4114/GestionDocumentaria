const { sequelize } = require('./models');

async function updateEnumCategory() {
  try {
    console.log('🔄 Actualizando ENUM de categoria...');
    
    await sequelize.query(`
      ALTER TABLE permissions 
      MODIFY COLUMN categoria ENUM(
        'auth',
        'users',
        'roles',
        'areas',
        'area_management',
        'categories',
        'document_types',
        'documents',
        'attachments',
        'versions',
        'movements',
        'reports',
        'system'
      ) NOT NULL
    `);
    
    console.log('✅ ENUM actualizado exitosamente');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateEnumCategory();
