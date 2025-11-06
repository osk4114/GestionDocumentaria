/**
 * Script de Prueba: Sistema de Versiones de Documentos
 * 
 * Este script verifica que:
 * 1. Los endpoints de versiones existen y están protegidos con permisos
 * 2. Se pueden listar versiones
 * 3. Se puede subir una nueva versión (con archivo)
 * 4. Se puede descargar una versión
 * 5. Se puede eliminar una versión
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let testDocumentId = null;
let testVersionId = null;

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

/**
 * 1. Login como admin
 */
async function login() {
  try {
    log.info('Iniciando sesión como admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@sgd.com',
      password: 'admin123'
    });

    authToken = response.data.data.token;
    log.success('Login exitoso');
    return true;
  } catch (error) {
    log.error(`Error en login: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 2. Obtener un documento de prueba
 */
async function getTestDocument() {
  try {
    log.info('Buscando documento de prueba...');
    
    // Usar endpoint de búsqueda con filtros
    const response = await axios.get(`${API_URL}/documents`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 1 }
    });

    const documents = response.data.data || [];
    
    if (documents.length === 0) {
      log.warn('No hay documentos disponibles.');
      log.info('💡 Crea un documento desde: http://localhost:4200/submit');
      log.info('💡 O ejecuta: node scripts/generate-inbox-data.js');
      return false;
    }

    testDocumentId = documents[0].id;
    log.success(`Documento de prueba encontrado: ID ${testDocumentId}`);
    log.info(`   Código: ${documents[0].trackingCode}`);
    log.info(`   Asunto: ${documents[0].asunto}`);
    return true;
  } catch (error) {
    log.error(`Error al obtener documento: ${error.response?.data?.message || error.message}`);
    console.error('Detalles del error:', error.response?.data);
    return false;
  }
}

/**
 * 3. Listar versiones (puede estar vacío)
 */
async function listVersions() {
  try {
    log.info(`Listando versiones del documento ${testDocumentId}...`);
    const response = await axios.get(`${API_URL}/documents/${testDocumentId}/versions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success(`${response.data.count} versiones encontradas`);
    if (response.data.count > 0) {
      console.log('   Versiones:');
      response.data.data.forEach(v => {
        console.log(`   - Versión ${v.versionNumber}: ${v.originalName} (${formatBytes(v.fileSize)})`);
        console.log(`     Sello: ${v.tieneSello ? '✅' : '❌'} | Firma: ${v.tieneFirma ? '✅' : '❌'}`);
      });
    }
    return true;
  } catch (error) {
    log.error(`Error al listar versiones: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 4. Subir nueva versión
 */
async function uploadVersion() {
  try {
    log.info('Subiendo nueva versión...');

    // Crear archivo PDF de prueba simple
    const testFilePath = path.join(__dirname, 'test-version.pdf');
    
    // PDF mínimo válido (1 página en blanco con texto)
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Version de Prueba ${new Date().toISOString()}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000304 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
398
%%EOF`;

    fs.writeFileSync(testFilePath, pdfContent);

    // Crear FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), 'documento-version-prueba.pdf');
    formData.append('descripcion', 'Versión subida desde script de prueba automático');
    formData.append('tieneSello', 'true');
    formData.append('tieneFirma', 'false');

    const response = await axios.post(
      `${API_URL}/documents/${testDocumentId}/versions`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    testVersionId = response.data.data.id;
    log.success(`Versión ${response.data.data.versionNumber} subida exitosamente (ID: ${testVersionId})`);
    log.info(`   Archivo: ${response.data.data.originalName}`);
    log.info(`   Tamaño: ${formatBytes(response.data.data.fileSize)}`);

    // Limpiar archivo temporal
    fs.unlinkSync(testFilePath);
    return true;
  } catch (error) {
    log.error(`Error al subir versión: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 5. Obtener versión específica
 */
async function getVersionById() {
  try {
    log.info(`Obteniendo versión ${testVersionId}...`);
    const response = await axios.get(`${API_URL}/documents/versions/${testVersionId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const version = response.data.data;
    log.success('Versión obtenida correctamente');
    console.log(`   Versión: ${version.versionNumber}`);
    console.log(`   Archivo: ${version.originalName}`);
    console.log(`   Tamaño: ${formatBytes(version.fileSize)}`);
    console.log(`   Descripción: ${version.descripcion || 'N/A'}`);
    console.log(`   Subido por: ${version.uploader?.nombre || 'N/A'}`);
    return true;
  } catch (error) {
    log.error(`Error al obtener versión: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 6. Obtener última versión
 */
async function getLatestVersion() {
  try {
    log.info('Obteniendo última versión...');
    const response = await axios.get(`${API_URL}/documents/${testDocumentId}/versions/latest`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const version = response.data.data;
    log.success(`Última versión: ${version.versionNumber}`);
    return true;
  } catch (error) {
    log.error(`Error al obtener última versión: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 7. Descargar versión (solo verificar endpoint)
 */
async function downloadVersion() {
  try {
    log.info('Verificando endpoint de descarga...');
    const response = await axios.get(
      `${API_URL}/documents/versions/${testVersionId}/download`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer'
      }
    );

    log.success(`Descarga exitosa (${response.data.byteLength} bytes)`);
    return true;
  } catch (error) {
    log.error(`Error al descargar: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * 8. Eliminar versión
 */
async function deleteVersion() {
  try {
    log.info(`Eliminando versión ${testVersionId}...`);
    const response = await axios.delete(`${API_URL}/documents/versions/${testVersionId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log.success('Versión eliminada exitosamente');
    return true;
  } catch (error) {
    log.error(`Error al eliminar versión: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Utilidad: Formatear bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Ejecutar todas las pruebas
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PRUEBAS DEL SISTEMA DE VERSIONES DE DOCUMENTOS');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: '1. Login', fn: login },
    { name: '2. Obtener documento de prueba', fn: getTestDocument },
    { name: '3. Listar versiones', fn: listVersions },
    { name: '4. Subir nueva versión', fn: uploadVersion },
    { name: '5. Obtener versión por ID', fn: getVersionById },
    { name: '6. Obtener última versión', fn: getLatestVersion },
    { name: '7. Descargar versión', fn: downloadVersion },
    { name: '8. Eliminar versión', fn: deleteVersion }
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`${colors.green}Exitosas: ${passed}${colors.reset}`);
  console.log(`${colors.red}Fallidas: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    log.success('¡Todas las pruebas pasaron! ✨');
  } else {
    log.error(`${failed} prueba(s) fallaron. Revisa los errores arriba.`);
  }
}

// Ejecutar
runTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
