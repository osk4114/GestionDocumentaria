-- ============================================================
-- Script de inicialización de la base de datos SGD
-- Sistema de Gestión Documentaria
-- Ejecutar este script en phpMyAdmin o MySQL CLI
-- 
-- VERSIÓN: 2.0
-- ÚLTIMA ACTUALIZACIÓN: 27 de Octubre 2025
-- 
-- CAMBIOS EN ESTA VERSIÓN:
-- - Tabla senders: Agregado tipo_persona, email/telefono obligatorios
-- - Tabla documents: doc_type_id permite NULL, agregado fecha_recepcion
-- - Tabla document_movements: user_id permite NULL
-- ============================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE sgd_db;

-- ============================================================
-- Tabla: roles
-- Descripción: Roles de usuarios en el sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: areas
-- Descripción: Áreas/Departamentos de la organización
-- ============================================================
CREATE TABLE IF NOT EXISTS areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sigla VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: users
-- Descripción: Usuarios del sistema
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    area_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: user_sessions
-- Descripción: Gestión de sesiones de usuario (JWT refresh tokens)
-- 
-- ⚠️ IMPORTANTE: El campo expires_at NO debe tener ON UPDATE CURRENT_TIMESTAMP
-- porque debe mantener su valor fijo durante toda la vida de la sesión.
-- Si MySQL lo agrega automáticamente, ejecutar:
-- ALTER TABLE user_sessions MODIFY COLUMN expires_at TIMESTAMP NOT NULL 
-- DEFAULT '1970-01-01 00:00:01' COMMENT 'Fecha de expiración del token';
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    jti VARCHAR(36) NOT NULL UNIQUE COMMENT 'JWT ID único para identificar el token',
    refresh_token TEXT COMMENT 'Token de renovación',
    ip_address VARCHAR(45) COMMENT 'Dirección IP del cliente',
    user_agent TEXT COMMENT 'Información del navegador/dispositivo',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Si la sesión está activa',
    expires_at TIMESTAMP NOT NULL DEFAULT '1970-01-01 00:00:01' COMMENT 'Fecha de expiración del token (NO AUTO-UPDATE)',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Última actividad registrada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_jti (jti),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: login_attempts
-- Descripción: Registro de intentos de login para prevenir fuerza bruta
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_attempts (email, attempted_at),
    INDEX idx_ip_attempts (ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: senders
-- Descripción: Remitentes de documentos (ciudadanos, empresas)
-- Actualizado: 2025-10-28 - Campos completos para persona natural y jurídica
-- ============================================================
CREATE TABLE IF NOT EXISTS senders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_persona ENUM('natural', 'juridica') NOT NULL DEFAULT 'natural' COMMENT 'Tipo de persona (natural o jurídica)',
    nombre_completo VARCHAR(150) COMMENT 'Nombre completo (opcional para retrocompatibilidad)',
    
    -- Campos para persona natural
    nombres VARCHAR(100) COMMENT 'Nombres (persona natural)',
    apellido_paterno VARCHAR(100) COMMENT 'Apellido paterno (persona natural)',
    apellido_materno VARCHAR(100) COMMENT 'Apellido materno (persona natural)',
    
    -- Campos para persona jurídica
    ruc VARCHAR(11) COMMENT 'RUC (persona jurídica)',
    nombre_empresa VARCHAR(200) COMMENT 'Nombre de empresa (persona jurídica)',
    
    -- Campos para representante legal (persona jurídica)
    representante_tipo_doc ENUM('DNI', 'CE', 'PASAPORTE') COMMENT 'Tipo doc representante',
    representante_num_doc VARCHAR(20) COMMENT 'Número doc representante',
    representante_nombres VARCHAR(100) COMMENT 'Nombres representante',
    representante_apellido_paterno VARCHAR(100) COMMENT 'Apellido paterno representante',
    representante_apellido_materno VARCHAR(100) COMMENT 'Apellido materno representante',
    
    -- Campos de dirección detallada
    departamento VARCHAR(50) COMMENT 'Departamento',
    provincia VARCHAR(50) COMMENT 'Provincia',
    distrito VARCHAR(50) COMMENT 'Distrito',
    direccion_completa TEXT COMMENT 'Dirección completa',
    
    -- Campos originales
    tipo_documento ENUM('DNI', 'RUC', 'PASAPORTE', 'CARNET_EXTRANJERIA', 'CE') COMMENT 'Tipo de documento',
    numero_documento VARCHAR(20) COMMENT 'Número de documento',
    email VARCHAR(100) NOT NULL COMMENT 'Email de contacto (OBLIGATORIO)',
    telefono VARCHAR(20) NOT NULL COMMENT 'Teléfono de contacto (OBLIGATORIO)',
    direccion TEXT COMMENT 'Dirección (campo legacy)',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_telefono (email, telefono),
    INDEX idx_ruc (ruc),
    INDEX idx_numero_documento (numero_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: document_types
-- Descripción: Tipos de documentos (solicitud, reclamo, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    requiere_adjunto BOOLEAN DEFAULT FALSE,
    dias_max_atencion INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: document_statuses
-- Descripción: Estados posibles de un documento
-- ============================================================
CREATE TABLE IF NOT EXISTS document_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    color VARCHAR(20),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: documents (Tabla Central)
-- Descripción: Documentos principales del sistema
-- Actualizado: 2025-10-27 - Permitir NULL en doc_type_id para Mesa de Partes
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_code VARCHAR(20) NOT NULL UNIQUE,
    asunto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    sender_id INT NOT NULL,
    doc_type_id INT COMMENT 'Tipo de documento - NULL permitido para documentos sin clasificar desde mesa de partes',
    status_id INT NOT NULL,
    current_area_id INT,
    current_user_id INT,
    prioridad ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
    fecha_limite DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recepcion TIMESTAMP NULL COMMENT 'Fecha en que fue recepcionado el documento',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (doc_type_id) REFERENCES document_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES document_statuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (current_area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (current_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: document_movements
-- Descripción: Trazabilidad completa de movimientos de documentos
-- ============================================================
CREATE TABLE IF NOT EXISTS document_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    from_area_id INT,
    to_area_id INT,
    user_id INT COMMENT 'Usuario que realiza el movimiento - NULL para acciones automáticas o públicas',
    accion VARCHAR(50) NOT NULL,
    observacion TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (from_area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (to_area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: attachments
-- Descripción: Archivos adjuntos a documentos
-- ============================================================
CREATE TABLE IF NOT EXISTS attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: notifications
-- Descripción: Notificaciones para usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_id INT,
    tipo VARCHAR(50) NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Datos iniciales (Seeds)
-- ============================================================

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Jefe de Área', 'Responsable de un área específica'),
('Funcionario', 'Empleado que procesa documentos'),
('Mesa de Partes', 'Recepción de documentos')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Insertar áreas por defecto
INSERT INTO areas (nombre, sigla, descripcion) VALUES
('Mesa de Partes', 'MP', 'Área de recepción de documentos'),
('Dirección General', 'DG', 'Dirección general de la institución'),
('Recursos Humanos', 'RRHH', 'Gestión de personal'),
('Logística', 'LOG', 'Área de logística y abastecimiento'),
('Asesoría Legal', 'AL', 'Asesoría jurídica')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Insertar estados de documentos por defecto
INSERT INTO document_statuses (nombre, codigo, color, descripcion) VALUES
('Pendiente', 'PENDIENTE', '#FFA500', 'Documento recibido, pendiente de asignación'),
('En Proceso', 'EN_PROCESO', '#2196F3', 'Documento siendo procesado'),
('Derivado', 'DERIVADO', '#9C27B0', 'Documento derivado a otra área'),
('Atendido', 'ATENDIDO', '#4CAF50', 'Documento atendido satisfactoriamente'),
('Observado', 'OBSERVADO', '#FF5722', 'Documento con observaciones'),
('Archivado', 'ARCHIVADO', '#607D8B', 'Documento archivado')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Insertar tipos de documentos comunes
INSERT INTO document_types (nombre, codigo, descripcion, requiere_adjunto, dias_max_atencion) VALUES
('Solicitud', 'SOL', 'Solicitud general', TRUE, 15),
('Reclamo', 'REC', 'Reclamo de usuario', TRUE, 30),
('Consulta', 'CON', 'Consulta administrativa', FALSE, 10),
('Recurso', 'RES', 'Recurso de reconsideración', TRUE, 30),
('Oficio', 'OFI', 'Oficio institucional', FALSE, 7)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================================
-- Índices para optimización de consultas
-- ============================================================

CREATE INDEX idx_documents_tracking ON documents(tracking_code);
CREATE INDEX idx_documents_status ON documents(status_id);
CREATE INDEX idx_documents_current_area ON documents(current_area_id);
CREATE INDEX idx_documents_current_user ON documents(current_user_id);
CREATE INDEX idx_movements_document ON document_movements(document_id);
CREATE INDEX idx_movements_timestamp ON document_movements(timestamp);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_attachments_document ON attachments(document_id);

-- ============================================================
-- RESUMEN DE ESTRUCTURA
-- ============================================================
-- Total de tablas: 12
-- - roles (gestión de permisos)
-- - areas (departamentos de la institución)
-- - users (usuarios del sistema)
-- - user_sessions (sesiones JWT)
-- - login_attempts (seguridad anti fuerza bruta)
-- - senders (remitentes externos - Mesa de Partes Virtual)
-- - document_types (tipos de documentos)
-- - document_statuses (estados del flujo)
-- - documents (tabla principal de documentos)
-- - document_movements (trazabilidad completa)
-- - attachments (archivos adjuntos)
-- - notifications (notificaciones a usuarios)
--
-- Estados disponibles: Pendiente, En Proceso, Derivado, Atendido, Observado, Archivado
-- Áreas predefinidas: Mesa de Partes, Dirección General, RRHH, Logística, Asesoría Legal
-- Roles predefinidos: Administrador, Jefe de Área, Funcionario, Mesa de Partes
--
-- IMPORTANTE:
-- - doc_type_id en documents permite NULL (para documentos sin clasificar)
-- - user_id en document_movements permite NULL (para acciones públicas/automáticas)
-- - email y telefono en senders son OBLIGATORIOS (Mesa de Partes Virtual)
-- - nombreCompleto en senders es OPCIONAL (identificación por email/telefono)
-- ============================================================

SELECT 'Base de datos SGD v2.0 creada exitosamente - 12 tablas configuradas' AS mensaje;
