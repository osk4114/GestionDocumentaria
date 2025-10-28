/**
 * Test de carga de archivos adjuntos
 * Prueba la funcionalidad completa de subida de archivos en Mesa de Partes
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';

// Crear archivos de prueba temporales
function createTestFiles() {
  const testDir = path.join(__dirname, 'test-files-temp');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  // Crear archivo de texto
  const textFile = path.join(testDir, 'documento-prueba.txt');
  fs.writeFileSync(textFile, 'Este es un documento de prueba para el sistema de gestión documentaria.\nContiene información importante.');

  // Crear archivo PDF simulado (realmente será txt pero con extensión .pdf para testing)
  const pdfFile = path.join(testDir, 'solicitud.pdf');
  fs.writeFileSync(pdfFile, '%PDF-1.4\n%Archivo PDF de prueba\nEste sería un PDF real en producción.');

  // Crear imagen simulada
  const imgFile = path.join(testDir, 'adjunto.jpg');
  fs.writeFileSync(imgFile, 'JPEG simulado - En producción sería una imagen real');

  return { textFile, pdfFile, imgFile, testDir };
}

// Test 1: Enviar documento SIN archivos adjuntos
async function testSubmitWithoutFiles() {
  console.log('\n📝 TEST 1: Enviar documento SIN archivos adjuntos');
  console.log('='.repeat(60));

  try {
    const response = await axios.post(`${API_URL}/documents/submit`, {
      // Nuevo formato simplificado
      tipoPersona: 'natural',
      email: 'juan.perez@email.com',
      telefono: '987654321',
      asunto: 'Solicitud de información - SIN adjuntos',
      descripcion: 'Documento de prueba sin archivos adjuntos',
      linkDescarga: 'https://drive.google.com/file/example'
    });

    if (response.data.success) {
      console.log('✅ Documento registrado exitosamente');
      console.log(`   Código de seguimiento: ${response.data.data.trackingCode}`);
      console.log(`   Archivos adjuntos: ${response.data.data.attachmentsCount || 0}`);
      return response.data.data;
    } else {
      console.log('❌ Error:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test 2: Enviar documento CON archivos adjuntos
async function testSubmitWithFiles() {
  console.log('\n📎 TEST 2: Enviar documento CON archivos adjuntos (3 archivos)');
  console.log('='.repeat(60));

  const { textFile, pdfFile, imgFile, testDir } = createTestFiles();

  try {
    const formData = new FormData();
    
    // Nuevo formato simplificado
    formData.append('tipoPersona', 'natural');
    formData.append('email', 'maria.gonzalez@email.com');
    formData.append('telefono', '999888777');
    formData.append('asunto', 'Solicitud con adjuntos - PRUEBA DE CARGA');
    formData.append('descripcion', 'Documento de prueba CON 3 archivos adjuntos');
    
    // Adjuntar archivos
    formData.append('archivos', fs.createReadStream(textFile));
    formData.append('archivos', fs.createReadStream(pdfFile));
    formData.append('archivos', fs.createReadStream(imgFile));

    const response = await axios.post(`${API_URL}/documents/submit`, formData, {
      headers: formData.getHeaders()
    });

    if (response.data.success) {
      console.log('✅ Documento con archivos registrado exitosamente');
      console.log(`   Código de seguimiento: ${response.data.data.trackingCode}`);
      console.log(`   Archivos adjuntos: ${response.data.data.attachmentsCount}`);
      console.log(`   Documento ID: ${response.data.data.id}`);
      
      // Limpiar archivos temporales
      fs.unlinkSync(textFile);
      fs.unlinkSync(pdfFile);
      fs.unlinkSync(imgFile);
      fs.rmdirSync(testDir);
      
      return response.data.data;
    } else {
      console.log('❌ Error:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error en la petición:', error.response?.data?.message || error.message);
    
    // Limpiar archivos temporales en caso de error
    try {
      fs.unlinkSync(textFile);
      fs.unlinkSync(pdfFile);
      fs.unlinkSync(imgFile);
      fs.rmdirSync(testDir);
    } catch (e) {}
    
    return null;
  }
}

// Test 3: Verificar que los archivos se guardaron correctamente
async function verifyUploadedFiles(documentId) {
  console.log('\n🔍 TEST 3: Verificar archivos guardados en el servidor');
  console.log('='.repeat(60));

  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`✅ Directorio uploads/ existe`);
    console.log(`   Archivos totales: ${files.length}`);
    
    if (files.length > 0) {
      console.log('\n   Últimos archivos:');
      files.slice(-5).forEach(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        console.log(`   - ${file} (${stats.size} bytes)`);
      });
    }
  } else {
    console.log('❌ Directorio uploads/ NO existe');
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('\n🚀 INICIANDO PRUEBAS DE CARGA DE ARCHIVOS');
  console.log('='.repeat(60));
  console.log('Servidor: ' + API_URL);
  console.log('Fecha: ' + new Date().toLocaleString());
  
  // Test 1: Sin archivos
  const doc1 = await testSubmitWithoutFiles();
  
  // Esperar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Con archivos
  const doc2 = await testSubmitWithFiles();
  
  // Test 3: Verificar archivos
  if (doc2) {
    await verifyUploadedFiles(doc2.id);
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`✅ Documento sin archivos: ${doc1 ? 'OK' : 'FALLÓ'}`);
  console.log(`✅ Documento con 3 archivos: ${doc2 ? 'OK' : 'FALLÓ'}`);
  
  if (doc1 && doc2) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('\n📋 Códigos de seguimiento generados:');
    console.log(`   - ${doc1.trackingCode} (sin archivos)`);
    console.log(`   - ${doc2.trackingCode} (con 3 archivos)`);
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON - Revisar logs arriba');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Ejecutar
runAllTests().catch(console.error);
