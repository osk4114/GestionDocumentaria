/**
 * Script para probar filtros de categorías en bandeja
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const TEST_USER = {
  email: 'admin@sgd.com',
  password: 'admin123'
};

async function testCategoryFilters() {
  try {
    console.log('🧪 PRUEBAS DE FILTROS POR CATEGORÍA\n');
    console.log('='.repeat(60) + '\n');

    // 1. Login
    console.log('🔐 Iniciando sesión...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    const areaId = loginResponse.data.data.user.areaId;
    console.log(`✓ Sesión iniciada - Usuario: ${loginResponse.data.data.user.nombre}`);
    console.log(`  Área: ${loginResponse.data.data.user.area.nombre} (ID: ${areaId})\n`);

    // 2. Obtener categorías del área
    console.log(`📋 Obteniendo categorías del área ${areaId}...`);
    const categoriesResponse = await axios.get(
      `${API_URL}/areas/${areaId}/categories`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const categories = categoriesResponse.data.data;
    console.log(`✓ ${categories.length} categorías encontradas:`);
    categories.forEach(cat => {
      console.log(`  - [${cat.id}] ${cat.nombre} (${cat.codigo}) - ${cat.color}`);
    });
    console.log('');

    // 3. Actualizar documento de prueba con categoría
    if (categories.length > 0) {
      const testCategoryId = categories[0].id;
      console.log(`📝 Asignando categoría "${categories[0].nombre}" al documento de prueba...`);
      
      // Primero obtener el documento de prueba
      const docsResponse = await axios.get(
        `${API_URL}/documents/area/${areaId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (docsResponse.data.data && docsResponse.data.data.length > 0) {
        const testDoc = docsResponse.data.data[0];
        console.log(`  Documento encontrado: ${testDoc.trackingCode}`);
        
        // Actualizar con categoría
        await axios.put(
          `${API_URL}/documents/${testDoc.id}`,
          { categoriaId: testCategoryId },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log(`✓ Categoría asignada exitosamente\n`);
      }
    }

    // 4. Probar filtro sin categoría (todos)
    console.log('🔍 Probando filtro: TODOS los documentos...');
    const allDocsResponse = await axios.get(
      `${API_URL}/documents/area/${areaId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log(`✓ ${allDocsResponse.data.count} documentos encontrados\n`);

    // 5. Probar filtro con categoría específica
    if (categories.length > 0) {
      const filterCategoryId = categories[0].id;
      console.log(`🔍 Probando filtro: Categoría "${categories[0].nombre}"...`);
      const filteredResponse = await axios.get(
        `${API_URL}/documents/area/${areaId}?category=${filterCategoryId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log(`✓ ${filteredResponse.data.count} documentos con esta categoría:`);
      filteredResponse.data.data.forEach(doc => {
        const catName = doc.categoria ? doc.categoria.nombre : 'Sin categoría';
        const catColor = doc.categoria ? doc.categoria.color : '#gray';
        console.log(`  - ${doc.trackingCode}: ${doc.asunto}`);
        console.log(`    Categoría: ${catName} (${catColor})`);
      });
      console.log('');
    }

    // 6. Probar filtro combinado: categoría + tipo de documento
    if (categories.length > 0) {
      console.log('🔍 Probando filtro combinado: Categoría + Tipo...');
      const combinedResponse = await axios.get(
        `${API_URL}/documents/area/${areaId}?category=${categories[0].id}&documentType=1`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log(`✓ ${combinedResponse.data.count} documentos encontrados con filtros combinados\n`);
    }

    // 7. Probar filtro combinado: categoría + búsqueda
    if (categories.length > 0) {
      console.log('🔍 Probando filtro combinado: Categoría + Búsqueda...');
      const searchResponse = await axios.get(
        `${API_URL}/documents/area/${areaId}?category=${categories[0].id}&search=prueba`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log(`✓ ${searchResponse.data.count} documentos encontrados\n`);
    }

    console.log('='.repeat(60));
    console.log('✅ Todas las pruebas de filtros completadas exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCategoryFilters();
