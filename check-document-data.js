/**
 * Script para verificar qué datos está retornando el backend para un documento específico
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@sgd.com',
    password: 'admin123'
  });
  return response.data.data.token;
}

async function getDocumentDetails(documentId, token) {
  console.log(`\n🔍 Obteniendo detalles del documento ID: ${documentId}...\n`);
  
  const response = await axios.get(`${API_URL}/documents/${documentId}/history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = response.data.data;
  const sender = data.document.sender;

  console.log('📄 DATOS DEL DOCUMENTO:');
  console.log('═══════════════════════════════════════\n');
  
  console.log(`ID: ${data.document.id}`);
  console.log(`Código: ${data.document.trackingCode}`);
  console.log(`Asunto: ${data.document.asunto}\n`);

  console.log('👤 DATOS DEL SENDER (REMITENTE):');
  console.log('═══════════════════════════════════════\n');
  
  console.log('ESTRUCTURA COMPLETA DEL SENDER:');
  console.log(JSON.stringify(sender, null, 2));
  
  console.log('\n\n📊 VERIFICACIÓN DE CAMPOS:');
  console.log('═══════════════════════════════════════\n');
  
  const campos = {
    'tipoPersona': sender.tipoPersona,
    'nombres': sender.nombres,
    'apellidoPaterno': sender.apellidoPaterno,
    'apellidoMaterno': sender.apellidoMaterno,
    'tipoDocumento': sender.tipoDocumento,
    'numeroDocumento': sender.numeroDocumento,
    'email': sender.email,
    'telefono': sender.telefono,
    'departamento': sender.departamento,
    'provincia': sender.provincia,
    'distrito': sender.distrito,
    'direccionCompleta': sender.direccionCompleta,
    'ruc': sender.ruc,
    'nombreEmpresa': sender.nombreEmpresa,
  };

  for (const [campo, valor] of Object.entries(campos)) {
    const status = valor ? '✅' : '❌';
    console.log(`${status} ${campo.padEnd(25)}: ${valor || 'null/undefined'}`);
  }
}

async function run() {
  try {
    const token = await login();
    
    // Primero obtener la lista de documentos
    const response = await axios.get(`${API_URL}/documents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const documents = response.data.data;
    console.log(`\n📋 DOCUMENTOS DISPONIBLES:\n`);
    
    documents.forEach(doc => {
      console.log(`ID: ${doc.id} | ${doc.trackingCode} | ${doc.asunto.substring(0, 40)}...`);
    });
    
    console.log('\n\n❓ ¿Cuál es el ID del documento que acabas de crear?');
    console.log('   Ejecuta: node check-specific-document.js <ID>\n');
    
    // Por defecto, mostrar el último documento (probablemente el más reciente)
    if (documents.length > 0) {
      const lastDoc = documents[documents.length - 1];
      console.log(`\n📌 Mostrando detalles del ÚLTIMO documento (ID: ${lastDoc.id}):\n`);
      await getDocumentDetails(lastDoc.id, token);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

run();
