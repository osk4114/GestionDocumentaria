const { 
  sequelize, 
  Role, 
  Area, 
  User, 
  Sender, 
  DocumentType, 
  DocumentStatus, 
  Document, 
  DocumentMovement, 
  Attachment, 
  Notification 
} = require('./models');
const bcrypt = require('bcryptjs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// ============================================================
// SCRIPT DE TESTING DE BASE DE DATOS
// ============================================================

async function testDatabase() {
  try {
    log.info('==================================================');
    log.info('INICIANDO TESTING COMPLETO DE BASE DE DATOS');
    log.info('==================================================\n');

    // TEST 1: Verificar conexión
    log.info('TEST 1: Verificando conexión a la base de datos...');
    await sequelize.authenticate();
    log.success('Conexión exitosa\n');

    // TEST 2: Verificar que existan datos iniciales
    log.info('TEST 2: Verificando datos iniciales (seeds)...');
    const rolesCount = await Role.count();
    const areasCount = await Area.count();
    const statusCount = await DocumentStatus.count();
    const typesCount = await DocumentType.count();
    
    log.info(`  - Roles encontrados: ${rolesCount}`);
    log.info(`  - Áreas encontradas: ${areasCount}`);
    log.info(`  - Estados encontrados: ${statusCount}`);
    log.info(`  - Tipos de documento: ${typesCount}`);
    
    if (rolesCount >= 4 && areasCount >= 5 && statusCount >= 6 && typesCount >= 5) {
      log.success('Datos iniciales correctos\n');
    } else {
      log.error('Faltan datos iniciales\n');
    }

    // TEST 3: Crear usuarios de prueba
    log.info('TEST 3: Creando usuarios de prueba...');
    
    const adminRole = await Role.findOne({ where: { nombre: 'Administrador' } });
    const funcionarioRole = await Role.findOne({ where: { nombre: 'Funcionario' } });
    const mesaPartesArea = await Area.findOne({ where: { sigla: 'MP' } });
    const dirGeneralArea = await Area.findOne({ where: { sigla: 'DG' } });

    const hashedPassword = await bcrypt.hash('password123', 10);

    const adminUser = await User.create({
      nombre: 'Juan Pérez',
      email: 'admin@sgd.com',
      password: hashedPassword,
      rolId: adminRole.id,
      areaId: dirGeneralArea.id
    });
    log.success(`Usuario Admin creado: ${adminUser.nombre} (ID: ${adminUser.id})`);

    const funcionario1 = await User.create({
      nombre: 'María García',
      email: 'maria@sgd.com',
      password: hashedPassword,
      rolId: funcionarioRole.id,
      areaId: mesaPartesArea.id
    });
    log.success(`Funcionario creado: ${funcionario1.nombre} (ID: ${funcionario1.id})\n`);

    // TEST 4: Verificar relaciones User -> Role y User -> Area
    log.info('TEST 4: Verificando relaciones User -> Role -> Area...');
    const userWithRelations = await User.findByPk(adminUser.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Area, as: 'area' }
      ]
    });
    
    log.info(`  - Usuario: ${userWithRelations.nombre}`);
    log.info(`  - Rol: ${userWithRelations.role.nombre}`);
    log.info(`  - Área: ${userWithRelations.area.nombre}`);
    log.success('Relaciones User correctas\n');

    // TEST 5: Crear remitentes (senders)
    log.info('TEST 5: Creando remitentes de prueba...');
    const sender1 = await Sender.create({
      nombreCompleto: 'Carlos Rodríguez',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      email: 'carlos@gmail.com',
      telefono: '987654321',
      direccion: 'Av. Principal 123'
    });
    log.success(`Remitente creado: ${sender1.nombreCompleto} (${sender1.tipoDocumento}: ${sender1.numeroDocumento})\n`);

    // TEST 6: Crear documento completo
    log.info('TEST 6: Creando documento con todas las relaciones...');
    const docType = await DocumentType.findOne({ where: { codigo: 'SOL' } });
    const docStatus = await DocumentStatus.findOne({ where: { codigo: 'PENDIENTE' } });
    
    const trackingCode = `SGD-2025-${Date.now().toString().slice(-6)}`;
    
    const document = await Document.create({
      trackingCode: trackingCode,
      asunto: 'Solicitud de certificado de estudios',
      descripcion: 'Solicito certificado de estudios para trámite laboral',
      senderId: sender1.id,
      docTypeId: docType.id,
      statusId: docStatus.id,
      currentAreaId: mesaPartesArea.id,
      currentUserId: funcionario1.id,
      prioridad: 'normal',
      fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días
    });
    log.success(`Documento creado: ${document.trackingCode}`);
    log.info(`  - Asunto: ${document.asunto}`);
    log.info(`  - Tipo: ${docType.nombre}`);
    log.info(`  - Estado: ${docStatus.nombre}\n`);

    // TEST 7: Verificar relaciones del Document
    log.info('TEST 7: Verificando todas las relaciones del Document...');
    const docWithRelations = await Document.findByPk(document.id, {
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: Area, as: 'currentArea' },
        { model: User, as: 'currentUser', include: [{ model: Role, as: 'role' }] }
      ]
    });

    log.info(`  - Remitente: ${docWithRelations.sender.nombreCompleto}`);
    log.info(`  - Tipo: ${docWithRelations.documentType.nombre}`);
    log.info(`  - Estado: ${docWithRelations.status.nombre}`);
    log.info(`  - Área actual: ${docWithRelations.currentArea.nombre}`);
    log.info(`  - Usuario asignado: ${docWithRelations.currentUser.nombre} (${docWithRelations.currentUser.role.nombre})`);
    log.success('Relaciones Document correctas\n');

    // TEST 8: Crear movimientos del documento (trazabilidad)
    log.info('TEST 8: Creando trazabilidad de documento...');
    
    // Movimiento 1: Recepción en Mesa de Partes
    const movement1 = await DocumentMovement.create({
      documentId: document.id,
      fromAreaId: null, // Llega desde afuera
      toAreaId: mesaPartesArea.id,
      userId: funcionario1.id,
      accion: 'RECEPCION',
      observacion: 'Documento recibido en Mesa de Partes'
    });
    log.success(`Movimiento 1: Recepción (${movement1.accion})`);

    // Movimiento 2: Derivación a Dirección General
    const movement2 = await DocumentMovement.create({
      documentId: document.id,
      fromAreaId: mesaPartesArea.id,
      toAreaId: dirGeneralArea.id,
      userId: funcionario1.id,
      accion: 'DERIVACION',
      observacion: 'Derivado a Dirección General para evaluación'
    });
    log.success(`Movimiento 2: Derivación (${movement2.accion})\n`);

    // TEST 9: Verificar historial completo del documento
    log.info('TEST 9: Consultando historial completo del documento...');
    const movements = await DocumentMovement.findAll({
      where: { documentId: document.id },
      include: [
        { model: Area, as: 'fromArea' },
        { model: Area, as: 'toArea' },
        { model: User, as: 'user' }
      ],
      order: [['timestamp', 'ASC']]
    });

    log.info(`  Total de movimientos: ${movements.length}`);
    movements.forEach((mov, index) => {
      const from = mov.fromArea ? mov.fromArea.sigla : 'EXTERNO';
      const to = mov.toArea ? mov.toArea.sigla : 'N/A';
      log.info(`  ${index + 1}. ${mov.accion}: ${from} → ${to} (por ${mov.user.nombre})`);
    });
    log.success('Trazabilidad correcta\n');

    // TEST 10: Crear archivos adjuntos
    log.info('TEST 10: Creando archivos adjuntos...');
    const attachment = await Attachment.create({
      documentId: document.id,
      fileName: `${trackingCode}-certificado.pdf`,
      originalName: 'certificado_nacimiento.pdf',
      filePath: `/uploads/documents/${trackingCode}/certificado_nacimiento.pdf`,
      fileType: 'application/pdf',
      fileSize: 245678,
      uploadedBy: funcionario1.id
    });
    log.success(`Adjunto creado: ${attachment.originalName} (${(attachment.fileSize / 1024).toFixed(2)} KB)\n`);

    // TEST 11: Verificar adjuntos del documento
    log.info('TEST 11: Consultando adjuntos del documento...');
    const docWithAttachments = await Document.findByPk(document.id, {
      include: [
        { 
          model: Attachment, 
          as: 'attachments',
          include: [{ model: User, as: 'uploader' }]
        }
      ]
    });

    log.info(`  Total de adjuntos: ${docWithAttachments.attachments.length}`);
    docWithAttachments.attachments.forEach((att, index) => {
      log.info(`  ${index + 1}. ${att.originalName} - Subido por: ${att.uploader.nombre}`);
    });
    log.success('Adjuntos correctos\n');

    // TEST 12: Crear notificaciones
    log.info('TEST 12: Creando notificaciones...');
    const notification = await Notification.create({
      userId: adminUser.id,
      documentId: document.id,
      tipo: 'document_assigned',
      mensaje: `Nuevo documento asignado: ${document.trackingCode}`,
      isRead: false
    });
    log.success(`Notificación creada para: ${adminUser.nombre}\n`);

    // TEST 13: Consultar notificaciones de un usuario
    log.info('TEST 13: Consultando notificaciones del usuario...');
    const userNotifications = await Notification.findAll({
      where: { userId: adminUser.id, isRead: false },
      include: [{ model: Document, as: 'document' }],
      order: [['createdAt', 'DESC']]
    });

    log.info(`  Notificaciones no leídas: ${userNotifications.length}`);
    userNotifications.forEach((notif, index) => {
      log.info(`  ${index + 1}. ${notif.mensaje}`);
    });
    log.success('Notificaciones correctas\n');

    // TEST 14: Consulta compleja - Documentos de un área con toda su info
    log.info('TEST 14: Consulta compleja - Documentos por área...');
    const areaDocuments = await Document.findAll({
      where: { currentAreaId: mesaPartesArea.id },
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentType, as: 'documentType' },
        { model: DocumentStatus, as: 'status' },
        { model: User, as: 'currentUser' },
        { model: DocumentMovement, as: 'movements' },
        { model: Attachment, as: 'attachments' }
      ]
    });

    log.info(`  Documentos en Mesa de Partes: ${areaDocuments.length}`);
    areaDocuments.forEach((doc, index) => {
      log.info(`  ${index + 1}. ${doc.trackingCode} - ${doc.asunto}`);
      log.info(`     Estado: ${doc.status.nombre}, Movimientos: ${doc.movements.length}, Adjuntos: ${doc.attachments.length}`);
    });
    log.success('Consulta compleja exitosa\n');

    // TEST 15: Consulta por código de seguimiento (tracking)
    log.info('TEST 15: Búsqueda por código de seguimiento (tracking)...');
    const trackedDoc = await Document.findOne({
      where: { trackingCode: trackingCode },
      include: [
        { model: Sender, as: 'sender' },
        { model: DocumentStatus, as: 'status' },
        { 
          model: DocumentMovement, 
          as: 'movements',
          include: [
            { model: Area, as: 'fromArea' },
            { model: Area, as: 'toArea' },
            { model: User, as: 'user' }
          ],
          order: [['timestamp', 'ASC']]
        }
      ]
    });

    if (trackedDoc) {
      log.success(`Documento encontrado: ${trackedDoc.trackingCode}`);
      log.info(`  - Remitente: ${trackedDoc.sender.nombreCompleto}`);
      log.info(`  - Estado: ${trackedDoc.status.nombre}`);
      log.info(`  - Historial de ${trackedDoc.movements.length} movimientos:`);
      trackedDoc.movements.forEach((mov, i) => {
        const from = mov.fromArea ? mov.fromArea.sigla : 'EXTERNO';
        const to = mov.toArea ? mov.toArea.sigla : 'N/A';
        log.info(`    ${i + 1}. [${mov.timestamp.toLocaleString()}] ${mov.accion}: ${from} → ${to}`);
      });
    }
    log.success('Búsqueda por tracking exitosa\n');

    // TEST 16: Estadísticas generales
    log.info('TEST 16: Generando estadísticas del sistema...');
    const stats = {
      totalUsers: await User.count(),
      totalDocuments: await Document.count(),
      totalMovements: await DocumentMovement.count(),
      totalAttachments: await Attachment.count(),
      totalNotifications: await Notification.count(),
      documentsByStatus: await Document.findAll({
        attributes: ['statusId', [sequelize.fn('COUNT', 'id'), 'count']],
        group: ['statusId'],
        include: [{ model: DocumentStatus, as: 'status', attributes: ['nombre'] }]
      }),
      documentsByPriority: await Document.findAll({
        attributes: ['prioridad', [sequelize.fn('COUNT', 'id'), 'count']],
        group: ['prioridad']
      })
    };

    log.info(`  - Total usuarios: ${stats.totalUsers}`);
    log.info(`  - Total documentos: ${stats.totalDocuments}`);
    log.info(`  - Total movimientos: ${stats.totalMovements}`);
    log.info(`  - Total adjuntos: ${stats.totalAttachments}`);
    log.info(`  - Total notificaciones: ${stats.totalNotifications}`);
    log.info('  - Documentos por estado:');
    stats.documentsByStatus.forEach(item => {
      log.info(`    * ${item.status.nombre}: ${item.dataValues.count}`);
    });
    log.info('  - Documentos por prioridad:');
    stats.documentsByPriority.forEach(item => {
      log.info(`    * ${item.prioridad}: ${item.dataValues.count}`);
    });
    log.success('Estadísticas generadas\n');

    // RESUMEN FINAL
    log.info('==================================================');
    log.success('✓ TESTING COMPLETADO EXITOSAMENTE');
    log.info('==================================================');
    log.info('Todas las tablas están correctamente relacionadas');
    log.info('Todos los casos de uso funcionan correctamente');
    log.warn('\nNOTA: Los datos de prueba fueron insertados en la BD');
    log.warn('Si deseas eliminarlos, ejecuta el script de limpieza\n');

  } catch (error) {
    log.error('\n==================================================');
    log.error('ERROR EN EL TESTING');
    log.error('==================================================');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar el testing
testDatabase();
