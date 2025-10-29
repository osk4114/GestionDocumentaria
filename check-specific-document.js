/**
 * Script para verificar un documento específico por ID
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const DOCUMENT_ID = process.argv[2] || 6; // ID por defecto: 6

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

  console.log('CAMPOS ESPERADOS:');
  for (const [campo, valor] of Object.entries(campos)) {
    const status = valor ? '✅' : '❌';
    console.log(`${status} ${campo.padEnd(25)}: ${valor || 'null/undefined'}`);
  }
  
  console.log('\n\n💡 DIAGNÓSTICO:');
  console.log('═══════════════════════════════════════\n');
  
  if (!sender.nombres && !sender.ruc) {
    console.log('❌ PROBLEMA DETECTADO:');
    console.log('   El formulario de Mesa de Partes NO está enviando los nuevos campos al backend.');
    console.log('   Necesitamos verificar el componente submit-document.component.ts\n');
  } else {
    console.log('✅ Los datos se están guardando correctamente en la base de datos.');
  }
}

async function run() {
  try {
    const token = await login();
    await getDocumentDetails(DOCUMENT_ID, token);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
  }
}

run();
