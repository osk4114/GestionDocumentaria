const { Sender } = require('./models');

async function checkSenders() {
  try {
    const senders = await Sender.findAll({ limit: 5 });
    console.log(`✓ Encontrados ${senders.length} remitentes:`);
    senders.forEach(s => {
      console.log(`  - ID: ${s.id}, Tipo: ${s.tipoPersona}, Email: ${s.email}`);
    });
    
    if (senders.length === 0) {
      console.log('\n⚠️ No hay remitentes. Creando uno de prueba...');
      const testSender = await Sender.create({
        tipoPersona: 'natural',
        tipoDocumento: 'DNI',
        numeroDocumento: '12345678',
        nombres: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        email: 'juan.perez@example.com',
        telefono: '999888777',
        departamento: 'Puno',
        provincia: 'Puno',
        distrito: 'Puno',
        direccion: 'Av. Principal 123'
      });
      console.log(`✓ Remitente creado: ID ${testSender.id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSenders();
