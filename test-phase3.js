// Script para probar la Fase 3: CRUD de documentos
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let senderId = null;
let documentId = null;

// Función auxiliar para hacer requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function runTests() {
  try {
    console.log('🧪 Iniciando pruebas de Fase 3...\n');

    // 1. Login
    console.log('1️⃣  Login como admin...');
    const loginRes = await api.post('/auth/login', {
      email: 'admin@sgd.com',
      password: 'password123'
    });
    authToken = loginRes.data.data.token;
    console.log('✅ Login exitoso\n');

    // 2. Crear remitente (sender)
    console.log('2️⃣  Creando/verificando remitente...');
    const { Sender } = require('./models');
    let sender = await Sender.findOne({ where: { numeroDocumento: '87654321' } });
    if (!sender) {
      sender = await Sender.create({
        tipoDocumento: 'DNI',
        numeroDocumento: '87654321',
        nombreCompleto: 'María González',
        email: 'maria@example.com',
        telefono: '987654321'
      });
      console.log(`✅ Remitente creado - ID: ${sender.id}\n`);
    } else {
      console.log(`✅ Remitente existente - ID: ${sender.id}\n`);
    }
    senderId = sender.id;

    // 3. Crear documento
    console.log('3️⃣  Creando documento...');
    const docRes = await api.post('/documents', {
      senderId: senderId,
      documentTypeId: 1, // Oficio
      asunto: 'Solicitud de información pública',
      descripcion: 'Solicito información sobre...',
      prioridad: 'alta',
      fechaDocumento: '2025-01-15',
      numeroDocumento: 'OF-2025-001',
      folios: 3
    });
    documentId = docRes.data.data.id;
    console.log(`✅ Documento creado - ID: ${documentId}`);
    console.log(`   Tracking Code: ${docRes.data.data.trackingCode}\n`);

    // 4. Listar documentos
    console.log('4️⃣  Listando documentos...');
    const listRes = await api.get('/documents');
    console.log(`✅ Total documentos: ${listRes.data.count}\n`);

    // 5. Obtener detalle del documento
    console.log('5️⃣  Obteniendo detalle del documento...');
    const detailRes = await api.get(`/documents/${documentId}`);
    console.log(`✅ Documento: ${detailRes.data.data.asunto}`);
    console.log(`   Estado: ${detailRes.data.data.status.nombre}`);
    console.log(`   Área actual: ${detailRes.data.data.currentArea.nombre}\n`);

    // 6. Derivar documento
    console.log('6️⃣  Derivando documento a otra área...');
    const deriveRes = await api.post(`/documents/${documentId}/derive`, {
      toAreaId: 3, // Área de Logística
      observacion: 'Se deriva para gestión correspondiente',
      prioridad: 'urgente'
    });
    console.log(`✅ Documento derivado a: ${deriveRes.data.data.currentArea.nombre}\n`);

    // 7. Ver historial de movimientos
    console.log('7️⃣  Consultando historial de movimientos...');
    const historyRes = await api.get(`/movements/document/${documentId}`);
    console.log(`✅ Total movimientos: ${historyRes.data.count}`);
    historyRes.data.data.forEach((mov, idx) => {
      console.log(`   ${idx + 1}. ${mov.accion} - ${mov.observacion}`);
    });
    console.log('');

    // 8. Aceptar documento (requiere estar en el área destino)
    console.log('8️⃣  Aceptando documento (omitido - requiere usuario del área destino)...');
    console.log(`⏭️  Saltando prueba de aceptación\n`);

    // 9. Obtener estadísticas
    console.log('9️⃣  Obteniendo estadísticas...');
    const statsRes = await api.get('/documents/stats');
    console.log(`✅ Total documentos: ${statsRes.data.data.total}`);
    console.log('   Por estado:');
    statsRes.data.data.byStatus.forEach(stat => {
      console.log(`   - ${stat.status.nombre}: ${stat.count}`);
    });
    console.log('');

    // 10. Actualizar documento (debe estar en el área del usuario)
    console.log('🔟 Finalizando documento...');
    const completeRes = await api.post(`/movements/complete/${documentId}`, {
      observacion: 'Trámite completado satisfactoriamente'
    });
    console.log(`✅ Documento finalizado - Estado: ${completeRes.data.data.status.nombre}\n`);

    console.log('✅ ¡Todas las pruebas completadas exitosamente! 🎉');

  } catch (error) {
    console.error('❌ Error en las pruebas:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensaje: ${error.response.data.message}`);
      console.error(`   Error: ${error.response.data.error || 'N/A'}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests();
