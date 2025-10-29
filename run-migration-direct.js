/**
 * Ejecutar migración usando Node.js y mysql2
 */

const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Conectando a la base de datos...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sgd_db',
      multipleStatements: true
    });

    console.log('✓ Conectado a sgd_db\n');

    // Crear tabla area_document_categories
    console.log('📝 Creando tabla area_document_categories...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS area_document_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        area_id INT NOT NULL COMMENT 'Área a la que pertenece esta categoría',
        nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de la categoría',
        codigo VARCHAR(20) NOT NULL COMMENT 'Código corto para la categoría',
        descripcion TEXT COMMENT 'Descripción de la categoría',
        color VARCHAR(20) DEFAULT '#0066CC' COMMENT 'Color para identificación visual',
        icono VARCHAR(50) DEFAULT 'file' COMMENT 'Icono Font Awesome',
        orden INT DEFAULT 0 COMMENT 'Orden de visualización',
        requiere_adjunto BOOLEAN DEFAULT FALSE COMMENT 'Si requiere archivos adjuntos',
        is_active BOOLEAN DEFAULT TRUE COMMENT 'Si la categoría está activa',
        created_by INT COMMENT 'Usuario que creó la categoría',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_area_id (area_id),
        INDEX idx_is_active (is_active),
        INDEX idx_orden (orden),
        UNIQUE KEY unique_area_codigo (area_id, codigo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabla area_document_categories creada\n');

    // Crear tabla document_versions
    console.log('📝 Creando tabla document_versions...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS document_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL COMMENT 'Documento al que pertenece esta versión',
        version_number INT NOT NULL COMMENT 'Número de versión',
        file_name VARCHAR(255) NOT NULL COMMENT 'Nombre del archivo en el servidor',
        original_name VARCHAR(255) NOT NULL COMMENT 'Nombre original del archivo',
        file_path VARCHAR(500) NOT NULL COMMENT 'Ruta completa del archivo',
        file_type VARCHAR(100) COMMENT 'Tipo MIME del archivo',
        file_size INT COMMENT 'Tamaño del archivo en bytes',
        descripcion TEXT COMMENT 'Descripción de esta versión',
        tiene_sello BOOLEAN DEFAULT FALSE COMMENT 'Indica si tiene sello',
        tiene_firma BOOLEAN DEFAULT FALSE COMMENT 'Indica si tiene firma',
        uploaded_by INT NOT NULL COMMENT 'Usuario que subió esta versión',
        area_id INT COMMENT 'Área que subió esta versión',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_document_id (document_id),
        INDEX idx_version_number (version_number),
        INDEX idx_uploaded_at (uploaded_at),
        UNIQUE KEY unique_document_version (document_id, version_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Tabla document_versions creada\n');

    // Agregar columna categoria_id a documents
    console.log('📝 Agregando columna categoria_id a tabla documents...');
    try {
      await connection.execute(`
        ALTER TABLE documents 
        ADD COLUMN categoria_id INT COMMENT 'Categoría personalizada del área' AFTER doc_type_id
      `);
      console.log('✓ Columna categoria_id agregada\n');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('⚠ Columna categoria_id ya existe\n');
      } else {
        throw error;
      }
    }

    // Agregar foreign key
    console.log('📝 Agregando foreign key para categoria_id...');
    try {
      await connection.execute(`
        ALTER TABLE documents 
        ADD FOREIGN KEY (categoria_id) REFERENCES area_document_categories(id) ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✓ Foreign key agregada\n');
    } catch (error) {
      if (error.message.includes('Duplicate')) {
        console.log('⚠ Foreign key ya existe\n');
      } else {
        throw error;
      }
    }

    // Agregar índice
    console.log('📝 Agregando índice para categoria_id...');
    try {
      await connection.execute(`
        ALTER TABLE documents ADD INDEX idx_categoria_id (categoria_id)
      `);
      console.log('✓ Índice agregado\n');
    } catch (error) {
      if (error.message.includes('Duplicate')) {
        console.log('⚠ Índice ya existe\n');
      } else {
        throw error;
      }
    }

    // Insertar datos de ejemplo para área 1 y 2
    console.log('📝 Insertando datos de ejemplo...');
    await connection.execute(`
      INSERT IGNORE INTO area_document_categories (area_id, nombre, codigo, descripcion, color, icono, orden, requiere_adjunto) VALUES
      (1, 'Oficio', 'OFI', 'Oficios recibidos', '#0066CC', 'file-text', 1, TRUE),
      (1, 'Memorándum', 'MEM', 'Memorándums internos', '#28a745', 'file-alt', 2, FALSE),
      (1, 'Solicitud', 'SOL', 'Solicitudes diversas', '#ffc107', 'file-invoice', 3, TRUE),
      (1, 'Informe', 'INF', 'Informes técnicos', '#dc3545', 'file-contract', 4, TRUE),
      (1, 'Carta', 'CAR', 'Cartas formales', '#6c757d', 'envelope', 5, FALSE),
      (3, 'Renuncia', 'REN', 'Cartas de renuncia', '#dc3545', 'user-times', 1, TRUE),
      (3, 'Permiso', 'PER', 'Solicitudes de permiso', '#ffc107', 'calendar-check', 2, TRUE),
      (3, 'Vacaciones', 'VAC', 'Solicitudes de vacaciones', '#28a745', 'umbrella-beach', 3, TRUE),
      (3, 'Licencia', 'LIC', 'Solicitudes de licencia', '#17a2b8', 'hospital', 4, TRUE),
      (3, 'Contrato', 'CON', 'Contratos laborales', '#6610f2', 'file-signature', 5, TRUE)
    `);
    console.log('✓ Datos de ejemplo insertados\n');

    // Verificar
    console.log('🔍 Verificando creación...\n');
    
    const [count1] = await connection.execute('SELECT COUNT(*) as total FROM area_document_categories');
    console.log(`✓ area_document_categories: ${count1[0].total} registros`);

    const [count2] = await connection.execute('SELECT COUNT(*) as total FROM document_versions');
    console.log(`✓ document_versions: ${count2[0].total} registros`);

    const [columns] = await connection.execute('DESCRIBE documents');
    const hasCategoria = columns.some(col => col.Field === 'categoria_id');
    console.log(`✓ documents.categoria_id: ${hasCategoria ? 'Existe' : 'No existe'}`);

    console.log('\n✅ Migración completada exitosamente!\n');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runMigration();
