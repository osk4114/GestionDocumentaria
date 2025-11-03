const { pool } = require('./config/database');

async function generateInboxData() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Probar conexión
    await pool.query('SELECT 1');
    console.log('✅ Conexión establecida correctamente.\n');

    // Obtener usuarios
    const [users] = await pool.query('SELECT id, nombre FROM Users WHERE is_active = 1 LIMIT 5');
    console.log(`📋 Usuarios encontrados: ${users.length}`);

    // Obtener tipos de documento
    const [docTypes] = await pool.query('SELECT id, name FROM DocumentTypes');
    console.log(`📄 Tipos de documento encontrados: ${docTypes.length}`);

    // Obtener áreas
    const [areas] = await pool.query('SELECT id, name FROM Areas');
    console.log(`🏢 Áreas encontradas: ${areas.length}`);

    // Obtener categorías
    const [categories] = await pool.query('SELECT id, name FROM AreaCategories');
    console.log(`📁 Categorías encontradas: ${categories.length}\n`);

    if (users.length === 0 || docTypes.length === 0 || areas.length === 0) {
      console.log('❌ No hay datos suficientes para generar documentos de bandeja');
      return;
    }

    // Generar documentos de entrada
    const asuntos = [
      'Solicitud de información sobre expediente',
      'Reclamo por demora en trámite',
      'Consulta sobre estado de documento',
      'Petición de revisión de caso',
      'Solicitud de copia certificada',
      'Recurso de reconsideración',
      'Apelación administrativa',
      'Solicitud de audiencia',
      'Consulta legal',
      'Petición de acceso a información'
    ];

    const remitentes = [
      'Juan Pérez García',
      'María López Rodríguez',
      'Carlos Sánchez Martínez',
      'Ana Torres Flores',
      'Luis Ramírez Vargas',
      'Carmen Díaz Silva',
      'Roberto Morales Castro',
      'Patricia Núñez Ruiz',
      'Miguel Ángel Fernández',
      'Laura Jiménez Vega'
    ];

    const prioridades = ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'];
    const estados = ['PENDIENTE', 'EN_PROCESO', 'DERIVADO'];

    console.log('📝 Generando documentos de bandeja de entrada...\n');

    const documentsToInsert = [];
    const movementsToInsert = [];

    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];
      const category = categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)] : null;
      
      const asunto = asuntos[Math.floor(Math.random() * asuntos.length)];
      const remitente = remitentes[Math.floor(Math.random() * remitentes.length)];
      const prioridad = prioridades[Math.floor(Math.random() * prioridades.length)];
      const estado = estados[Math.floor(Math.random() * estados.length)];

      // Generar fecha aleatoria en los últimos 30 días
      const daysAgo = Math.floor(Math.random() * 30);
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - daysAgo);

      const documentNumber = `DOC-${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(1000 + i).slice(-4)}`;

      documentsToInsert.push({
        documentNumber,
        documentTypeId: docType.id,
        subject: asunto,
        sender: remitente,
        priority: prioridad,
        status: estado,
        assignedTo: user.id,
        currentAreaId: area.id,
        areaCategoryId: category ? category.id : null,
        receivedDate: fecha.toISOString(),
        createdBy: user.id
      });
    }

    // Insertar documentos
    for (const doc of documentsToInsert) {
      try {
        const [result] = await pool.query(
          `INSERT INTO Documents 
          (documentNumber, documentTypeId, subject, sender, priority, status, 
           assignedTo, currentAreaId, areaCategoryId, receivedDate, createdBy, 
           createdAt, updatedAt)
          VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            doc.documentNumber,
            doc.documentTypeId,
            doc.subject,
            doc.sender,
            doc.priority,
            doc.status,
            doc.assignedTo,
            doc.currentAreaId,
            doc.areaCategoryId,
            doc.receivedDate,
            doc.createdBy
          ]
        );

        const documentId = result.insertId;

        // Crear movimiento de recepción
        await pool.query(
          `INSERT INTO Movements 
          (documentId, fromAreaId, toAreaId, userId, movementType, observations, createdAt, updatedAt)
          VALUES 
          (?, NULL, ?, ?, 'RECEPCION', 'Documento recibido en bandeja de entrada', NOW(), NOW())`,
          [documentId, doc.currentAreaId, doc.createdBy]
        );

        console.log(`✅ Documento creado: ${doc.documentNumber} - ${doc.subject}`);
      } catch (error) {
        console.error(`❌ Error al crear documento ${doc.documentNumber}:`, error.message);
      }
    }

    console.log('\n✅ Generación de datos completada!');
    console.log(`📊 Total de documentos generados: ${documentsToInsert.length}`);

    // Mostrar resumen
    const [summary] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as total,
        SUM(CASE WHEN priority = 'URGENTE' THEN 1 ELSE 0 END) as urgentes,
        SUM(CASE WHEN priority = 'ALTA' THEN 1 ELSE 0 END) as altas
      FROM Documents
      GROUP BY status
    `);

    console.log('\n📊 Resumen por estado:');
    summary.forEach(s => {
      console.log(`   ${s.status}: ${s.total} documentos (${s.urgentes} urgentes, ${s.altas} alta prioridad)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

// Ejecutar
generateInboxData();
