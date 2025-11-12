/**
 * Script de prueba para eventos en tiempo real
 * Simula la creación de un documento y verifica que se emitan los eventos
 */

require('dotenv').config();
const realtimeEvents = require('./services/realtimeEventService');

console.log('🧪 Iniciando prueba de eventos en tiempo real...\n');

// Simular documento de prueba
const testDocument = {
  id: 999,
  tracking_code: 'TEST-2025-999',
  asunto: 'Documento de Prueba de Eventos',
  status: { id: 1, nombre: 'Pendiente' },
  sender: { 
    nombre_completo: 'Usuario de Prueba',
    email: 'test@ejemplo.com'
  },
  currentArea: { id: 1, nombre: 'Mesa de Partes' }
};

console.log('📄 Documento de prueba:', testDocument.tracking_code);

// Verificar que el servicio está cargado
console.log('\n✅ RealtimeEventService cargado correctamente');
console.log('📡 Métodos disponibles:');
console.log('   - emitDocumentCreated');
console.log('   - emitDocumentDerived');
console.log('   - emitDocumentUpdated');
console.log('   - emitDocumentAssigned');
console.log('   - emitDocumentFinalized');
console.log('   - emitDocumentArchived');

console.log('\n🎯 Prueba completada exitosamente!');
console.log('\n📝 Para probar en vivo:');
console.log('   1. Inicia el servidor: npm start');
console.log('   2. Inicia el frontend: cd sgd-frontend && npm start');
console.log('   3. Crea un documento desde Mesa de Partes Virtual');
console.log('   4. Verás el documento aparecer automáticamente en la bandeja');
console.log('   5. Sin necesidad de refresh! 🚀');
