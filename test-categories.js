/**
 * Script para probar endpoints de categorías y versiones
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Credenciales de prueba (usa las del usuario de prueba)
const TEST_USER = {
  email: 'admin@sgd.com',
  password: 'admin123'
};

let authToken = null;

// Login
async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    console.log('✓ Sesión iniciada\n');
    return authToken;
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Obtener categorías de un área
async function getCategoriesByArea(areaId) {
  try {
    console.log(`📋 Obteniendo categorías del área ${areaId}...`);
    const response = await axios.get(`${API_URL}/areas/${areaId}/categories`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(`✓ ${response.data.count} categorías encontradas:`);
    response.data.data.forEach(cat => {
      console.log(`  - ${cat.nombre} (${cat.codigo}) - ${cat.color} - Orden: ${cat.orden}`);
    });
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Crear nueva categoría
async function createCategory(areaId, categoryData) {
  try {
    console.log(`➕ Creando categoría "${categoryData.nombre}" en área ${areaId}...`);
    const response = await axios.post(
      `${API_URL}/areas/${areaId}/categories`,
      categoryData,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    console.log('✓ Categoría creada:', response.data.data);
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Actualizar categoría
async function updateCategory(categoryId, updates) {
  try {
    console.log(`✏️ Actualizando categoría ${categoryId}...`);
    const response = await axios.put(
      `${API_URL}/areas/categories/${categoryId}`,
      updates,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    console.log('✓ Categoría actualizada:', response.data.data);
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Toggle activo/inactivo
async function toggleCategory(categoryId) {
  try {
    console.log(`🔄 Cambiando estado de categoría ${categoryId}...`);
    const response = await axios.patch(
      `${API_URL}/areas/categories/${categoryId}/toggle`,
      {},
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    console.log('✓', response.data.message);
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Reordenar categorías
async function reorderCategories(areaId, categoriesOrder) {
  try {
    console.log(`🔢 Reordenando categorías del área ${areaId}...`);
    const response = await axios.put(
      `${API_URL}/areas/${areaId}/categories/reorder`,
      { categories: categoriesOrder },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    console.log('✓', response.data.message);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Obtener todas las áreas
async function getAreas() {
  try {
    console.log('🏢 Obteniendo áreas...');
    const response = await axios.get(`${API_URL}/areas`);
    console.log(`✓ ${response.data.count} áreas encontradas:`);
    response.data.data.forEach(area => {
      console.log(`  - ${area.nombre} (${area.sigla}) - ID: ${area.id}`);
    });
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  try {
    console.log('🧪 PRUEBAS DE CATEGORÍAS Y VERSIONES\n');
    console.log('='.repeat(60) + '\n');

    // 1. Login
    await login();

    // 2. Obtener áreas
    await getAreas();

    // 3. Obtener categorías de Mesa de Partes (área 1)
    const categoriesArea1 = await getCategoriesByArea(1);

    // 4. Obtener categorías de RRHH (área 3)
    const categoriesArea3 = await getCategoriesByArea(3);

    // 5. Crear nueva categoría en área 1
    const newCategory = await createCategory(1, {
      nombre: 'Resolución',
      codigo: 'RES',
      descripcion: 'Resoluciones administrativas',
      color: '#9C27B0',
      icono: 'gavel',
      orden: 6,
      requiereAdjunto: true
    });

    // 6. Actualizar la categoría recién creada
    if (newCategory) {
      await updateCategory(newCategory.id, {
        descripcion: 'Resoluciones administrativas y directorales',
        color: '#673AB7'
      });
    }

    // 7. Toggle estado
    if (newCategory) {
      await toggleCategory(newCategory.id);
      await toggleCategory(newCategory.id); // Volver a activar
    }

    // 8. Reordenar categorías del área 1
    if (categoriesArea1.length > 0) {
      const reorder = categoriesArea1.map((cat, index) => ({
        id: cat.id,
        orden: categoriesArea1.length - index // Invertir orden
      }));
      await reorderCategories(1, reorder);
    }

    // 9. Ver categorías actualizadas
    console.log('📋 CATEGORÍAS FINALES:\n');
    await getCategoriesByArea(1);
    await getCategoriesByArea(3);

    console.log('='.repeat(60));
    console.log('✅ Pruebas completadas exitosamente!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

runTests();
