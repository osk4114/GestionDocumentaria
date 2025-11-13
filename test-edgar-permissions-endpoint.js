/**
 * Script para verificar el endpoint /api/permissions/grouped con Edgar
 * Debe devolver solo 1 categoría (area_management) con 42 permisos
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testEdgarPermissions() {
  try {
    console.log('🔐 Iniciando sesión como Edgar Burneo...\n');

    // 1. Login como Edgar
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'burn@gmail.com',
      password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('📋 Usuario:', loginResponse.data.user.nombre);
    console.log('🏢 Área:', loginResponse.data.user.area?.nombre || 'Sin área');
    console.log('👤 Rol:', loginResponse.data.user.role?.nombre || 'Sin rol');
    console.log('🔑 Permisos del usuario:', loginResponse.data.user.permissions?.length || 0);
    console.log('');

    // 2. Obtener permisos agrupados
    console.log('📡 Consultando /api/permissions/grouped...\n');
    
    const permissionsResponse = await axios.get(`${API_URL}/permissions/grouped`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const { success, count, data, grouped } = permissionsResponse.data;

    console.log('✅ Respuesta del endpoint:');
    console.log('   - success:', success);
    console.log('   - count:', count);
    console.log('   - data (permisos array):', data?.length || 0);
    console.log('   - grouped (categorías):', Object.keys(grouped || {}).length);
    console.log('');

    if (grouped) {
      console.log('📊 CATEGORÍAS DISPONIBLES:');
      Object.entries(grouped).forEach(([categoria, permisos]) => {
        console.log(`   ✓ ${categoria}: ${permisos.length} permisos`);
      });
      console.log('');

      // Verificar que solo hay area_management
      const categorias = Object.keys(grouped);
      if (categorias.length === 1 && categorias[0] === 'area_management') {
        console.log('✅ CORRECTO: Edgar solo ve la categoría "area_management"');
        console.log(`✅ CORRECTO: Tiene acceso a ${grouped.area_management.length} permisos`);
        
        if (grouped.area_management.length === 42) {
          console.log('✅ PERFECTO: Son exactamente 42 permisos de area_management');
        } else {
          console.log(`⚠️ ADVERTENCIA: Se esperaban 42 permisos, pero hay ${grouped.area_management.length}`);
        }
      } else {
        console.log('❌ ERROR: Edgar NO debería ver estas categorías:');
        categorias.forEach(cat => {
          if (cat !== 'area_management') {
            console.log(`   ✗ ${cat}`);
          }
        });
      }
      console.log('');

      // Mostrar primeros 5 permisos como ejemplo
      if (grouped.area_management) {
        console.log('📋 PRIMEROS 5 PERMISOS (ejemplo):');
        grouped.area_management.slice(0, 5).forEach((perm, index) => {
          console.log(`   ${index + 1}. ${perm.nombre}`);
          console.log(`      Código: ${perm.codigo}`);
          console.log(`      Descripción: ${perm.descripcion}`);
          console.log('');
        });
      }
    }

    console.log('🎉 Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Mensaje:', error.response.data?.message || 'Sin mensaje');
      console.error('   Detalles:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Ejecutar prueba
testEdgarPermissions();
