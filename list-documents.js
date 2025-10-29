/**
 * Script para listar todos los documentos y verificar cuáles tienen datos completos
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@sgd.com',
    password: 'admin123'
  });
  return response.data.data.token;
}

async function listDocuments(token) {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     LISTA DE DOCUMENTOS EN EL SISTEMA        ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════╝${colors.reset}\n`);

  const response = await axios.get(`${API_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const documents = response.data.data;

  console.log(`Total de documentos: ${colors.yellow}${documents.length}${colors.reset}\n`);

  for (const doc of documents) {
    const tipoPersona = doc.sender?.tipoPersona || 'No especificado';
    const hasNewFields = doc.sender?.nombres || doc.sender?.ruc;
    
    console.log(`${colors.blue}ID: ${doc.id}${colors.reset}`);
    console.log(`Código: ${colors.cyan}${doc.trackingCode}${colors.reset}`);
    console.log(`Asunto: ${doc.asunto}`);
    console.log(`Tipo Persona: ${tipoPersona}`);
    console.log(`Remitente: ${doc.sender?.nombreCompleto || doc.sender?.email || 'N/A'}`);
    
    if (hasNewFields) {
      console.log(`${colors.green}✅ TIENE CAMPOS NUEVOS${colors.reset}`);
      if (doc.sender?.nombres) {
        console.log(`   → Nombres: ${doc.sender.nombres} ${doc.sender.apellidoPaterno || ''} ${doc.sender.apellidoMaterno || ''}`);
      }
      if (doc.sender?.ruc) {
        console.log(`   → RUC: ${doc.sender.ruc}`);
        console.log(`   → Empresa: ${doc.sender.nombreEmpresa || 'N/A'}`);
      }
      if (doc.sender?.departamento) {
        console.log(`   → Dirección: ${doc.sender.departamento}, ${doc.sender.provincia}, ${doc.sender.distrito}`);
      }
    } else {
      console.log(`${colors.red}❌ SIN CAMPOS NUEVOS (documento antiguo)${colors.reset}`);
    }
    
    console.log('---\n');
  }

  console.log(`\n${colors.yellow}BUSCA LOS DOCUMENTOS CON ✅ TIENE CAMPOS NUEVOS${colors.reset}`);
  console.log(`${colors.yellow}Esos son los que debes abrir para ver el modal actualizado${colors.reset}\n`);
}

async function run() {
  try {
    const token = await login();
    await listDocuments(token);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
