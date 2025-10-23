// Script para crear datos de prueba
const { sequelize } = require('./config/sequelize');
const { Sender, Document, DocumentMovement, Area, DocumentType, DocumentStatus } = require('./models');

async function seedTestData() {
  try {
    console.log('🌱 Iniciando creación de datos de prueba...\n');

    // 1. Crear remitentes de prueba (ignorar duplicados)
    console.log('[1/4] Creando/verificando remitentes...');
    const remitentes = await Sender.bulkCreate([
      {
        nombreCompleto: 'María García Quispe',
        tipoDocumento: 'DNI',
        numeroDocumento: '12345678',
        email: 'maria.garcia@email.com',
        telefono: '987654321',
        direccion: 'Av. El Sol 123, Puno'
      },
      {
        nombreCompleto: 'Juan Pérez Mamani',
        tipoDocumento: 'DNI',
        numeroDocumento: '87654321',
        email: 'juan.perez@email.com',
        telefono: '987654322',
        direccion: 'Jr. Lima 456, Puno'
      },
      {
        nombreCompleto: 'Ana López Condori',
        tipoDocumento: 'DNI',
        numeroDocumento: '45678912',
        email: 'ana.lopez@email.com',
        telefono: '987654323',
        direccion: 'Av. Titicaca 789, Puno'
      },
      {
        nombreCompleto: 'Carlos Huanca Flores',
        tipoDocumento: 'DNI',
        numeroDocumento: '78912345',
        email: 'carlos.huanca@email.com',
        telefono: '987654324',
        direccion: 'Jr. Puno 321, Puno'
      },
      {
        nombreCompleto: 'Rosa Ticona Apaza',
        tipoDocumento: 'DNI',
        numeroDocumento: '32165498',
        email: 'rosa.ticona@email.com',
        telefono: '987654325',
        direccion: 'Av. Costanera 654, Puno'
      }
    ], { 
      ignoreDuplicates: true,
      updateOnDuplicate: ['nombre_completo', 'email', 'telefono', 'direccion']
    });
    
    // Si no se crearon, obtenerlos de la BD
    const allRemitentes = await Sender.findAll({
      where: {
        numeroDocumento: ['12345678', '87654321', '45678912', '78912345', '32165498']
      }
    });
    console.log(`✓ ${allRemitentes.length} remitentes disponibles\n`);

    // 2. Obtener áreas, tipos y estados
    const areas = await Area.findAll();
    const tipos = await DocumentType.findAll();
    const estados = await DocumentStatus.findAll();

    console.log(`[2/4] Creando documentos de prueba...`);
    const documentosData = [
      {
        trackingCode: 'SGD-2024-000101',
        senderId: allRemitentes[0].id,
        docTypeId: tipos[0].id, // Solicitud
        statusId: estados[1].id, // En Proceso
        currentAreaId: areas[1].id, // Dirección General
        asunto: 'Solicitud de prácticas pre-profesionales en el área de transportes',
        descripcion: 'Solicitud para realizar prácticas en el área de regulación de transportes',
        prioridad: 'normal',
        fechaRecepcion: new Date('2024-10-01')
      },
      {
        trackingCode: 'SGD-2024-000102',
        senderId: allRemitentes[1].id,
        docTypeId: tipos[4].id, // Oficio
        statusId: estados[0].id, // Pendiente
        currentAreaId: areas[0].id, // Mesa de Partes
        asunto: 'Oficio solicitando reunión de coordinación interinstitucional',
        descripcion: 'Reunión para coordinar operativo de fiscalización vehicular',
        prioridad: 'alta',
        fechaRecepcion: new Date('2024-10-15')
      },
      {
        trackingCode: 'SGD-2024-000103',
        senderId: allRemitentes[2].id,
        docTypeId: tipos[1].id, // Reclamo
        statusId: estados[2].id, // Derivado
        currentAreaId: areas[3].id, // Logística
        asunto: 'Reclamo por demora en atención de trámite de licencia',
        descripcion: 'Reclamo formal por exceso de tiempo en trámite de licencia de conducir',
        prioridad: 'urgente',
        fechaRecepcion: new Date('2024-09-20')
      },
      {
        trackingCode: 'SGD-2024-000104',
        senderId: allRemitentes[3].id,
        docTypeId: tipos[2].id, // Consulta
        statusId: estados[3].id, // Atendido
        currentAreaId: areas[2].id, // Recursos Humanos
        asunto: 'Consulta sobre requisitos para certificado de antecedentes',
        descripcion: 'Consulta administrativa sobre documentación requerida',
        prioridad: 'baja',
        fechaRecepcion: new Date('2024-09-05')
      },
      {
        trackingCode: 'SGD-2024-000105',
        senderId: allRemitentes[4].id,
        docTypeId: tipos[0].id, // Solicitud
        statusId: estados[5].id, // Archivado
        currentAreaId: areas[4].id, // Asesoría Legal
        asunto: 'Solicitud de información pública sobre concesiones',
        descripcion: 'Solicitud de acceso a información sobre concesiones de transporte',
        prioridad: 'normal',
        fechaRecepcion: new Date('2024-08-10')
      },
      {
        trackingCode: 'SGD-2024-000106',
        senderId: allRemitentes[0].id,
        docTypeId: tipos[4].id, // Oficio
        statusId: estados[1].id, // En Proceso
        currentAreaId: areas[1].id,
        asunto: 'Oficio múltiple - Convocatoria a taller de capacitación',
        descripcion: 'Convocatoria para taller de actualización normativa en transporte',
        prioridad: 'alta',
        fechaRecepcion: new Date('2024-10-10')
      },
      {
        trackingCode: 'SGD-2024-000107',
        senderId: allRemitentes[1].id,
        docTypeId: tipos[0].id,
        statusId: estados[0].id,
        currentAreaId: areas[0].id,
        asunto: 'Solicitud de permiso especial de circulación',
        descripcion: 'Permiso para transporte de carga pesada en horario restringido',
        prioridad: 'urgente',
        fechaRecepcion: new Date('2024-10-20')
      },
      {
        trackingCode: 'SGD-2024-000108',
        senderId: allRemitentes[2].id,
        docTypeId: tipos[1].id,
        statusId: estados[2].id,
        currentAreaId: areas[2].id,
        asunto: 'Reclamo por maltrato en área de atención al usuario',
        descripcion: 'Reclamo formal por trato inadecuado del personal',
        prioridad: 'alta',
        fechaRecepcion: new Date('2024-10-08')
      },
      {
        trackingCode: 'SGD-2024-000109',
        senderId: allRemitentes[3].id,
        docTypeId: tipos[3].id, // Recurso
        statusId: estados[1].id,
        currentAreaId: areas[4].id,
        asunto: 'Recurso de reconsideración contra resolución de sanción',
        descripcion: 'Recurso impugnando multa por infracción de tránsito',
        prioridad: 'alta',
        fechaRecepcion: new Date('2024-09-25')
      },
      {
        trackingCode: 'SGD-2024-000110',
        senderId: allRemitentes[4].id,
        docTypeId: tipos[0].id,
        statusId: estados[5].id,
        currentAreaId: areas[3].id,
        asunto: 'Solicitud de duplicado de licencia de conducir',
        descripcion: 'Solicitud por pérdida de licencia de conducir',
        prioridad: 'normal',
        fechaRecepcion: new Date('2024-08-15')
      }
    ];

    const documentos = await Document.bulkCreate(documentosData, { ignoreDuplicates: true });
    console.log(`✓ ${documentos.length} documentos creados\n`);

    // 3. Crear movimientos para algunos documentos
    console.log('[3/4] Creando movimientos de documentos...');
    const movimientos = [];

    // Doc 1: Prácticas - Flujo completo
    movimientos.push(
      {
        documentId: documentos[0].id,
        toAreaId: areas[0].id, // Mesa de Partes
        accion: 'Recepción',
        observacion: 'Documento recibido en mesa de partes',
        timestamp: new Date('2024-10-01 09:00:00')
      },
      {
        documentId: documentos[0].id,
        fromAreaId: areas[0].id,
        toAreaId: areas[1].id, // Dirección General
        accion: 'Derivación',
        observacion: 'Derivado a Dirección para evaluación',
        timestamp: new Date('2024-10-02 10:30:00')
      },
      {
        documentId: documentos[0].id,
        fromAreaId: areas[1].id,
        toAreaId: areas[2].id, // RRHH
        accion: 'Derivación',
        observacion: 'Derivado a RRHH para gestión de prácticas',
        timestamp: new Date('2024-10-05 14:00:00')
      }
    );

    // Doc 3: Reclamo - Con varios movimientos
    movimientos.push(
      {
        documentId: documentos[2].id,
        toAreaId: areas[0].id,
        accion: 'Recepción',
        observacion: 'Reclamo recibido',
        timestamp: new Date('2024-09-20 08:00:00')
      },
      {
        documentId: documentos[2].id,
        fromAreaId: areas[0].id,
        toAreaId: areas[1].id,
        accion: 'Derivación',
        observacion: 'Derivado a Dirección por ser reclamo urgente',
        timestamp: new Date('2024-09-21 09:00:00')
      },
      {
        documentId: documentos[2].id,
        fromAreaId: areas[1].id,
        toAreaId: areas[3].id, // Logística
        accion: 'Derivación',
        observacion: 'Derivado a Logística para verificación',
        timestamp: new Date('2024-09-25 11:00:00')
      }
    );

    // Doc 5: Archivado - Flujo completo hasta archivo
    movimientos.push(
      {
        documentId: documentos[4].id,
        toAreaId: areas[0].id,
        accion: 'Recepción',
        observacion: 'Solicitud de información recibida',
        timestamp: new Date('2024-08-10 10:00:00')
      },
      {
        documentId: documentos[4].id,
        fromAreaId: areas[0].id,
        toAreaId: areas[4].id, // Asesoría Legal
        accion: 'Derivación',
        observacion: 'Derivado a Asesoría Legal para evaluación',
        timestamp: new Date('2024-08-12 11:00:00')
      },
      {
        documentId: documentos[4].id,
        fromAreaId: areas[4].id,
        toAreaId: areas[4].id,
        accion: 'Atención',
        observacion: 'Información proporcionada y enviada al solicitante',
        timestamp: new Date('2024-08-20 15:00:00')
      },
      {
        documentId: documentos[4].id,
        fromAreaId: areas[4].id,
        toAreaId: areas[4].id,
        accion: 'Archivo',
        observacion: 'Documento archivado tras completar atención',
        timestamp: new Date('2024-08-25 16:00:00')
      }
    );

    await DocumentMovement.bulkCreate(movimientos, { ignoreDuplicates: true });
    console.log(`✓ ${movimientos.length} movimientos creados\n`);

    console.log('[4/4] Resumen de datos creados:');
    console.log(`  • Remitentes: ${allRemitentes.length}`);
    console.log(`  • Documentos: ${documentos.length}`);
    console.log(`  • Movimientos: ${movimientos.length}`);
    console.log(`  • Áreas disponibles: ${areas.length}`);
    console.log(`  • Tipos de documento: ${tipos.length}`);
    console.log(`  • Estados: ${estados.length}`);
    
    console.log('\n✅ Datos de prueba creados exitosamente!');
    console.log('\nCódigos de seguimiento generados:');
    documentos.forEach(doc => {
      console.log(`  • ${doc.trackingCode} - ${doc.asunto.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
seedTestData();
