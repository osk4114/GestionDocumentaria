/**
 * Script para crear un documento de prueba
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

const TEST_USER = {
  email: 'admin@sgd.com',
  password: 'admin123'
};

async function createTestDocument() {
  try {
    // 1. Login
    console.log('🔐 Iniciando sesión...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.data.token;
    console.log('✓ Sesión iniciada\n');

    // 2. Crear documento
    console.log('📄 Creando documento de prueba...');
    const documentData = {
      senderId: 1,
      documentTypeId: 1,
      asunto: 'Documento de prueba para sistema de versiones',
      descripcion: 'Este es un documento creado para probar el sistema de versiones con sellos y firmas',
      fechaDocumento: new Date().toISOString().split('T')[0],
      numeroDocumento: 'DOC-TEST-001',
      folios: 5
    };

    const docResponse = await axios.post(
      `${API_URL}/documents`,
      documentData,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log('✓ Documento creado exitosamente:');
    console.log(`  - ID: ${docResponse.data.data.id}`);
    console.log(`  - Número: ${docResponse.data.data.numeroSeguimiento}`);
    console.log(`  - Asunto: ${docResponse.data.data.asunto}`);
    console.log(`  - Categoría ID: ${docResponse.data.data.categoriaId}`);
    console.log('');

    return docResponse.data.data;

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

createTestDocument();
