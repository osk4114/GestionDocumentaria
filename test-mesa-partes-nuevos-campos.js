/**
 * Script de prueba para el formulario de Mesa de Partes con nuevos campos
 * Prueba tanto persona natural como persona jurídica
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/documents/submit';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test 1: Persona Natural
async function testPersonaNatural() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   TEST 1: PERSONA NATURAL${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}\n`);

  const form = new FormData();
  
  // Tipo de persona
  form.append('tipoPersona', 'natural');
  
  // Datos persona natural
  form.append('tipoDocumentoNatural', 'DNI');
  form.append('numeroDocumentoNatural', '12345678');
  form.append('nombres', 'Juan Carlos');
  form.append('apellidoPaterno', 'García');
  form.append('apellidoMaterno', 'López');
  
  // Dirección
  form.append('departamento', 'Lima');
  form.append('provincia', 'Lima');
  form.append('distrito', 'Miraflores');
  form.append('direccion', 'Av. Larco 1234');
  
  // Contacto
  form.append('email', 'juan.garcia@example.com');
  form.append('telefono', '987654321');
  
  // Documento
  form.append('asunto', 'Solicitud de información pública');
  form.append('descripcion', 'Solicito información sobre proyectos en desarrollo');

  try {
    const response = await axios.post(API_URL, form, {
      headers: form.getHeaders()
    });

    if (response.data.success) {
      console.log(`${colors.green}✅ Persona Natural registrada exitosamente${colors.reset}`);
      console.log(`Código de seguimiento: ${colors.yellow}${response.data.data.trackingCode}${colors.reset}`);
      console.log(`ID Documento: ${response.data.data.document.id}`);
      console.log(`\nDatos del remitente capturados:`);
      const sender = response.data.data.document.sender;
      console.log(`  - Nombres: ${sender.nombres} ${sender.apellidoPaterno} ${sender.apellidoMaterno}`);
      console.log(`  - Documento: ${sender.tipoDocumento} ${sender.numeroDocumento}`);
      console.log(`  - Dirección: ${sender.departamento}, ${sender.provincia}, ${sender.distrito}`);
      console.log(`  - Dirección completa: ${sender.direccionCompleta}`);
      console.log(`  - Email: ${sender.email}`);
      console.log(`  - Teléfono: ${sender.telefono}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.response?.data?.message || error.message}${colors.reset}`);
    if (error.response?.data) {
      console.log('Detalles:', error.response.data);
    }
  }
}

// Test 2: Persona Jurídica
async function testPersonaJuridica() {
  console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   TEST 2: PERSONA JURÍDICA${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════${colors.reset}\n`);

  const form = new FormData();
  
  // Tipo de persona
  form.append('tipoPersona', 'juridica');
  
  // Datos empresa
  form.append('ruc', '20123456789');
  form.append('nombreEmpresa', 'Empresa de Servicios SAC');
  
  // Dirección empresa
  form.append('departamento', 'Lima');
  form.append('provincia', 'Lima');
  form.append('distrito', 'San Isidro');
  form.append('direccion', 'Av. Javier Prado 2500');
  
  // Datos representante legal
  form.append('tipoDocumentoRepresentante', 'DNI');
  form.append('numeroDocumentoRepresentante', '87654321');
  form.append('nombresRepresentante', 'María Elena');
  form.append('apellidoPaternoRepresentante', 'Rodríguez');
  form.append('apellidoMaternoRepresentante', 'Sánchez');
  
  // Contacto
  form.append('email', 'contacto@empresa.com');
  form.append('telefono', '012345678');
  
  // Documento
  form.append('asunto', 'Solicitud de licencia de funcionamiento');
  form.append('descripcion', 'Solicito licencia para nuevo local comercial');

  try {
    const response = await axios.post(API_URL, form, {
      headers: form.getHeaders()
    });

    if (response.data.success) {
      console.log(`${colors.green}✅ Persona Jurídica registrada exitosamente${colors.reset}`);
      console.log(`Código de seguimiento: ${colors.yellow}${response.data.data.trackingCode}${colors.reset}`);
      console.log(`ID Documento: ${response.data.data.document.id}`);
      console.log(`\nDatos del remitente capturados:`);
      const sender = response.data.data.document.sender;
      console.log(`  - RUC: ${sender.ruc}`);
      console.log(`  - Empresa: ${sender.nombreEmpresa}`);
      console.log(`  - Dirección: ${sender.departamento}, ${sender.provincia}, ${sender.distrito}`);
      console.log(`  - Dirección completa: ${sender.direccionCompleta}`);
      console.log(`  - Representante: ${sender.representanteNombres} ${sender.representanteApellidoPaterno} ${sender.representanteApellidoMaterno}`);
      console.log(`  - Doc. Representante: ${sender.representanteTipoDoc} ${sender.representanteNumDoc}`);
      console.log(`  - Email: ${sender.email}`);
      console.log(`  - Teléfono: ${sender.telefono}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.response?.data?.message || error.message}${colors.reset}`);
    if (error.response?.data) {
      console.log('Detalles:', error.response.data);
    }
  }
}

// Ejecutar tests
async function runTests() {
  console.log(`\n${colors.green}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.green}║  PRUEBAS DE MESA DE PARTES - NUEVOS CAMPOS        ║${colors.reset}`);
  console.log(`${colors.green}╚════════════════════════════════════════════════════╝${colors.reset}`);

  await testPersonaNatural();
  await testPersonaJuridica();

  console.log(`\n${colors.green}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}   PRUEBAS COMPLETADAS${colors.reset}`);
  console.log(`${colors.green}════════════════════════════════════════${colors.reset}\n`);
}

runTests();
