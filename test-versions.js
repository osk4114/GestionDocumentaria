/**
 * Script para probar endpoints de versiones de documentos
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';

// Credenciales de prueba
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

// Obtener documentos (para usar uno de prueba)
async function getDocuments() {
  try {
    console.log('📄 Obteniendo documentos...');
    const response = await axios.get(`${API_URL}/documents`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      params: { limit: 5 }
    });
    console.log(`✓ ${response.data.count} documentos encontrados:`);
    response.data.data.forEach(doc => {
      console.log(`  - ${doc.numeroSeguimiento} - ${doc.asunto} (ID: ${doc.id})`);
    });
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return [];
  }
}

// Crear archivo de prueba temporal
function createTestFile() {
  const testContent = `
===========================================
DOCUMENTO DE PRUEBA CON SELLO Y FIRMA
===========================================

Fecha: ${new Date().toLocaleDateString('es-PE')}
Hora: ${new Date().toLocaleTimeString('es-PE')}

Este es un documento de prueba para el sistema
de versiones de documentos.

CONTENIDO:
Este documento ha sido sellado y firmado por
la autoridad competente.

[SELLO INSTITUCIONAL]
[FIRMA DIGITAL]

===========================================
`;
  
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const filePath = path.join(tempDir, 'documento_v1.txt');
  fs.writeFileSync(filePath, testContent, 'utf8');
  console.log(`📝 Archivo de prueba creado: ${filePath}\n`);
  return filePath;
}

// Crear archivo de prueba v2
function createTestFileV2() {
  const testContent = `
===========================================
DOCUMENTO DE PRUEBA CON SELLO Y FIRMA - V2
===========================================

Fecha: ${new Date().toLocaleDateString('es-PE')}
Hora: ${new Date().toLocaleTimeString('es-PE')}

DOCUMENTO ACTUALIZADO - VERSIÓN 2

Este documento ha sido actualizado con nuevo
contenido y firma adicional.

ACTUALIZACIONES:
- Correcciones menores
- Firma adicional del director
- Nuevo sello institucional

[SELLO INSTITUCIONAL ACTUALIZADO]
[FIRMA DIGITAL - JEFE DE ÁREA]
[FIRMA DIGITAL - DIRECTOR GENERAL]

===========================================
`;
  
  const filePath = path.join(__dirname, 'temp', 'documento_v2.txt');
  fs.writeFileSync(filePath, testContent, 'utf8');
  console.log(`📝 Archivo de prueba V2 creado: ${filePath}\n`);
  return filePath;
}

// Subir versión de documento
async function uploadVersion(documentId, filePath, versionData) {
  try {
    console.log(`⬆️ Subiendo versión para documento ${documentId}...`);
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    
    formData.append('file', fileStream, {
      filename: fileName,
      contentType: 'text/plain'
    });
    formData.append('descripcion', versionData.descripcion);
    formData.append('tieneSello', String(versionData.tieneSello));
    formData.append('tieneFirma', String(versionData.tieneFirma));
    
    const response = await axios.post(
      `${API_URL}/documents/${documentId}/versions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log('✓ Versión subida exitosamente:');
    console.log(`  - Versión: ${response.data.data.versionNumber}`);
    console.log(`  - Archivo: ${response.data.data.originalName}`);
    console.log(`  - Tamaño: ${(response.data.data.fileSize / 1024).toFixed(2)} KB`);
    console.log(`  - Sello: ${response.data.data.tieneSello ? 'Sí' : 'No'}`);
    console.log(`  - Firma: ${response.data.data.tieneFirma ? 'Sí' : 'No'}`);
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Obtener versiones de un documento
async function getVersions(documentId) {
  try {
    console.log(`📋 Obteniendo versiones del documento ${documentId}...`);
    const response = await axios.get(
      `${API_URL}/documents/${documentId}/versions`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    console.log(`✓ ${response.data.count} versiones encontradas:`);
    response.data.data.forEach(ver => {
      console.log(`  - V${ver.versionNumber}: ${ver.originalName} - ${ver.descripcion}`);
      console.log(`    Subida: ${new Date(ver.uploadedAt).toLocaleString('es-PE')}`);
      console.log(`    Sello: ${ver.tieneSello ? '✓' : '✗'} | Firma: ${ver.tieneFirma ? '✓' : '✗'}`);
    });
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Obtener última versión
async function getLatestVersion(documentId) {
  try {
    console.log(`🔍 Obteniendo última versión del documento ${documentId}...`);
    const response = await axios.get(
      `${API_URL}/documents/${documentId}/versions/latest`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    console.log('✓ Última versión:');
    console.log(`  - V${response.data.data.versionNumber}: ${response.data.data.originalName}`);
    console.log(`  - ${response.data.data.descripcion}`);
    console.log('');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Limpiar archivos temporales
function cleanupTempFiles() {
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.readdirSync(tempDir).forEach(file => {
      fs.unlinkSync(path.join(tempDir, file));
    });
    fs.rmdirSync(tempDir);
    console.log('🗑️ Archivos temporales eliminados\n');
  }
}

// Ejecutar pruebas
async function runTests() {
  try {
    console.log('🧪 PRUEBAS DE VERSIONES DE DOCUMENTOS\n');
    console.log('='.repeat(60) + '\n');

    // 1. Login
    await login();

    // 2. Obtener documentos disponibles
    const documents = await getDocuments();
    
    if (documents.length === 0) {
      console.log('⚠️ No hay documentos disponibles para probar');
      return;
    }

    const testDocument = documents[0];
    console.log(`📌 Usando documento: ${testDocument.numeroSeguimiento}\n`);

    // 3. Crear archivos de prueba
    const testFile1 = createTestFile();
    const testFile2 = createTestFileV2();

    // 4. Subir primera versión
    await uploadVersion(testDocument.id, testFile1, {
      descripcion: 'Versión inicial con sello y firma',
      tieneSello: true,
      tieneFirma: true
    });

    // 5. Subir segunda versión
    await uploadVersion(testDocument.id, testFile2, {
      descripcion: 'Versión actualizada con firma adicional',
      tieneSello: true,
      tieneFirma: true
    });

    // 6. Subir tercera versión (solo con sello)
    await uploadVersion(testDocument.id, testFile1, {
      descripcion: 'Versión con correcciones menores - solo sello',
      tieneSello: true,
      tieneFirma: false
    });

    // 7. Obtener todas las versiones
    await getVersions(testDocument.id);

    // 8. Obtener la última versión
    await getLatestVersion(testDocument.id);

    // 9. Limpiar
    cleanupTempFiles();

    console.log('='.repeat(60));
    console.log('✅ Pruebas de versiones completadas exitosamente!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    cleanupTempFiles();
    process.exit(1);
  }
}

runTests();
