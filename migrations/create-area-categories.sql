-- ============================================================
-- MIGRACIÓN: Categorías de Documentos Personalizables por Área
-- Fecha: 29 de Octubre 2025
-- Descripción: Permite que cada área cree y gestione sus propias
--              categorías de documentos (Oficio, Solicitud, Memo, etc.)
-- ============================================================

USE sgd_db;

-- ============================================================
-- Tabla: area_document_categories
-- Descripción: Categorías de documentos personalizables por área
-- ============================================================
CREATE TABLE IF NOT EXISTS area_document_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL COMMENT 'Área a la que pertenece esta categoría',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de la categoría (ej: Oficio, Solicitud, Memo)',
    codigo VARCHAR(20) NOT NULL COMMENT 'Código corto para la categoría (ej: OFI, SOL, MEM)',
    descripcion TEXT COMMENT 'Descripción de la categoría',
    color VARCHAR(20) DEFAULT '#0066CC' COMMENT 'Color para identificación visual (hex)',
    icono VARCHAR(50) DEFAULT 'file' COMMENT 'Icono Font Awesome',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
    requiere_adjunto BOOLEAN DEFAULT FALSE COMMENT 'Si esta categoría requiere archivos adjuntos',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Si la categoría está activa',
    created_by INT COMMENT 'Usuario que creó la categoría',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices para optimización
    INDEX idx_area_id (area_id),
    INDEX idx_is_active (is_active),
    INDEX idx_orden (orden),
    
    -- Constraint: No permitir códigos duplicados dentro de la misma área
    UNIQUE KEY unique_area_codigo (area_id, codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: document_versions
-- Descripción: Historial de versiones de documentos
--              Permite subir documentos actualizados con sellos y firmas
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL COMMENT 'Documento al que pertenece esta versión',
    version_number INT NOT NULL COMMENT 'Número de versión (1, 2, 3...)',
    file_name VARCHAR(255) NOT NULL COMMENT 'Nombre del archivo en el servidor',
    original_name VARCHAR(255) NOT NULL COMMENT 'Nombre original del archivo',
    file_path VARCHAR(500) NOT NULL COMMENT 'Ruta completa del archivo',
    file_type VARCHAR(100) COMMENT 'Tipo MIME del archivo',
    file_size INT COMMENT 'Tamaño del archivo en bytes',
    descripcion TEXT COMMENT 'Descripción de esta versión (ej: "Con sello y firma del jefe")',
    tiene_sello BOOLEAN DEFAULT FALSE COMMENT 'Indica si tiene sello',
    tiene_firma BOOLEAN DEFAULT FALSE COMMENT 'Indica si tiene firma',
    uploaded_by INT NOT NULL COMMENT 'Usuario que subió esta versión',
    area_id INT COMMENT 'Área que subió esta versión',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_document_id (document_id),
    INDEX idx_version_number (version_number),
    INDEX idx_uploaded_at (uploaded_at),
    
    -- Constraint: No permitir versiones duplicadas para el mismo documento
    UNIQUE KEY unique_document_version (document_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Modificar tabla documents para agregar categoria_id
-- ============================================================
ALTER TABLE documents 
ADD COLUMN categoria_id INT COMMENT 'Categoría personalizada del área' AFTER doc_type_id,
ADD FOREIGN KEY (categoria_id) REFERENCES area_document_categories(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Agregar índice para optimización
ALTER TABLE documents ADD INDEX idx_categoria_id (categoria_id);

-- ============================================================
-- Datos de ejemplo para testing (opcional)
-- ============================================================

-- Categorías para área 1 (ejemplo: Dirección)
INSERT INTO area_document_categories (area_id, nombre, codigo, descripcion, color, icono, orden, requiere_adjunto) VALUES
(1, 'Oficio', 'OFI', 'Oficios recibidos', '#0066CC', 'file-text', 1, TRUE),
(1, 'Memorándum', 'MEM', 'Memorándums internos', '#28a745', 'file-alt', 2, FALSE),
(1, 'Solicitud', 'SOL', 'Solicitudes diversas', '#ffc107', 'file-invoice', 3, TRUE),
(1, 'Informe', 'INF', 'Informes técnicos', '#dc3545', 'file-contract', 4, TRUE),
(1, 'Carta', 'CAR', 'Cartas formales', '#6c757d', 'envelope', 5, FALSE);

-- Categorías para área 2 (ejemplo: Recursos Humanos)
INSERT INTO area_document_categories (area_id, nombre, codigo, descripcion, color, icono, orden, requiere_adjunto) VALUES
(2, 'Renuncia', 'REN', 'Cartas de renuncia', '#dc3545', 'user-times', 1, TRUE),
(2, 'Permiso', 'PER', 'Solicitudes de permiso', '#ffc107', 'calendar-check', 2, TRUE),
(2, 'Vacaciones', 'VAC', 'Solicitudes de vacaciones', '#28a745', 'umbrella-beach', 3, TRUE),
(2, 'Licencia', 'LIC', 'Solicitudes de licencia', '#17a2b8', 'hospital', 4, TRUE),
(2, 'Contrato', 'CON', 'Contratos laborales', '#6610f2', 'file-signature', 5, TRUE);

-- ============================================================
-- Comentarios
-- ============================================================

-- NOTAS:
-- 1. Cada área puede crear sus propias categorías sin límite
-- 2. Las categorías tienen códigos únicos dentro de cada área
-- 3. Los documentos pueden tener tanto doc_type_id (global) como categoria_id (específica del área)
-- 4. document_versions permite mantener historial completo de versiones del documento
-- 5. La versión 1 sería el documento original, versión 2 con sellos, etc.

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
