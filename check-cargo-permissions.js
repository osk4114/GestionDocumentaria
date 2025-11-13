const db = require('./models');
const { Op } = require('sequelize');

async function checkCargoPermissions() {
  try {
    console.log('🔍 ANÁLISIS DE PERMISOS PARA SISTEMA DE CARGOS\n');
    console.log('='.repeat(60));
    
    // 1. Permisos existentes relevantes
    console.log('\n📋 PERMISOS EXISTENTES RELEVANTES:\n');
    
    const relevantPermissions = await db.Permission.findAll({
      where: {
        codigo: {
          [Op.in]: [
            'documents.edit.all',
            'documents.edit.area',
            'area_mgmt.documents.edit',
            'area_mgmt.versions.view',
            'area_mgmt.versions.upload',
            'area_mgmt.versions.download',
            'area_mgmt.versions.delete'
          ]
        }
      },
      order: [['codigo', 'ASC']]
    });
    
    relevantPermissions.forEach(p => {
      console.log(`  ✓ ${p.codigo}`);
      console.log(`    └─ ${p.nombre}`);
      console.log(`    └─ ${p.descripcion}`);
      console.log('');
    });
    
    // 2. Verificar qué roles tienen permisos de edición
    console.log('\n👥 ROLES CON PERMISOS DE EDICIÓN:\n');
    
    const rolesWithEdit = await db.Role.findAll({
      include: [{
        model: db.Permission,
        as: 'permissions',
        where: {
          codigo: {
            [Op.in]: ['documents.edit.all', 'documents.edit.area', 'area_mgmt.documents.edit']
          }
        }
      }]
    });
    
    for (const role of rolesWithEdit) {
      console.log(`  🔹 ${role.nombre} (Área: ${role.areaId || 'Global'})`);
      role.permissions.forEach(p => {
        console.log(`     ├─ ${p.codigo}`);
      });
      console.log('');
    }
    
    // 3. Verificar qué roles tienen permisos de versiones
    console.log('\n📄 ROLES CON PERMISOS DE VERSIONES:\n');
    
    const rolesWithVersions = await db.Role.findAll({
      include: [{
        model: db.Permission,
        as: 'permissions',
        where: {
          codigo: {
            [Op.like]: '%versions%'
          }
        }
      }]
    });
    
    for (const role of rolesWithVersions) {
      console.log(`  🔹 ${role.nombre}`);
      const versionPerms = role.permissions.filter(p => p.codigo.includes('versions'));
      versionPerms.forEach(p => {
        console.log(`     ├─ ${p.codigo}`);
      });
      console.log('');
    }
    
    // 4. Propuesta de nuevos permisos para cargos
    console.log('\n💡 PROPUESTA DE NUEVOS PERMISOS PARA CARGOS:\n');
    
    const newPermissions = [
      {
        codigo: 'area_mgmt.cargos.create',
        nombre: 'Crear Cargos',
        descripcion: 'Puede conservar versiones como cargos en su bandeja'
      },
      {
        codigo: 'area_mgmt.cargos.view',
        nombre: 'Ver Cargos del Área',
        descripcion: 'Puede ver cargos almacenados en la bandeja del área'
      },
      {
        codigo: 'area_mgmt.cargos.edit',
        nombre: 'Editar Nombre de Cargos del Área',
        descripcion: 'Puede renombrar cargos del área'
      },
      {
        codigo: 'area_mgmt.cargos.delete',
        nombre: 'Eliminar Cargos del Área',
        descripcion: 'Puede eliminar cargos del área'
      }
    ];
    
    newPermissions.forEach(p => {
      console.log(`  ➕ ${p.codigo}`);
      console.log(`     ├─ Nombre: ${p.nombre}`);
      console.log(`     └─ Descripción: ${p.descripcion}`);
      console.log('');
    });
    
    // 5. Análisis de seguridad
    console.log('\n🔒 ANÁLISIS DE SEGURIDAD:\n');
    
    console.log('  ✅ EDITAR DOCUMENTO COMPLETO (PUT /api/documents/:id)');
    console.log('     ├─ Permite cambiar: asunto, descripcion, tipo, remitente, etc.');
    console.log('     ├─ Requiere: documents.edit.all | documents.edit.area | area_mgmt.documents.edit');
    console.log('     └─ Riesgo: ALTO - Puede modificar datos críticos del documento original');
    console.log('');
    
    console.log('  ✅ EDITAR NOMBRE DE CARGO (Propuesta)');
    console.log('     ├─ Solo permite cambiar: nombre personalizado del cargo');
    console.log('     ├─ Requiere: area_mgmt.cargos.edit (NUEVO)');
    console.log('     ├─ NO afecta: documento original, versiones, metadatos');
    console.log('     └─ Riesgo: BAJO - Solo afecta etiqueta de visualización personal');
    console.log('');
    
    console.log('  ✅ CONSERVAR CARGO');
    console.log('     ├─ Crea cargo compartido para toda el área');
    console.log('     ├─ Requiere: area_mgmt.cargos.create (NUEVO)');
    console.log('     ├─ Todos del área pueden ver el cargo conservado');
    console.log('     └─ Riesgo: BAJO - Solo crea referencia compartida, no modifica original');
    console.log('');
    
    // 6. Recomendaciones
    console.log('\n📌 RECOMENDACIONES:\n');
    
    console.log('  1️⃣  Crear permisos específicos para cargos (area_mgmt.cargos.*)');
    console.log('     └─ Separa lógica de edición de documentos vs edición de cargos');
    console.log('');
    
    console.log('  2️⃣  Tabla separada "document_cargos"');
    console.log('     ├─ id, area_id, version_id, custom_name, created_by, created_at');
    console.log('     └─ Permite auditoría completa + acceso compartido por área');
    console.log('');
    
    console.log('  3️⃣  Validaciones de seguridad:');
    console.log('     ├─ Todos los usuarios del ÁREA pueden ver los cargos del área');
    console.log('     ├─ Solo usuarios con area_mgmt.cargos.edit pueden renombrar');
    console.log('     ├─ Verificar que usuario pertenezca al área del cargo');
    console.log('     └─ No permitir acceso a cargos de otras áreas');
    console.log('');
    
    console.log('  4️⃣  Asignar nuevos permisos a roles existentes:');
    console.log('     ├─ ENCARGADO DE ÁREA: Todos los permisos de cargos');
    console.log('     ├─ Practicante: Crear, ver y editar cargos propios');
    console.log('     └─ Secretaria: Crear y ver cargos propios');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCargoPermissions();
