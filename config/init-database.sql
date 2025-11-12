-- ============================================================
-- Script de inicialización de la base de datos SGD
-- Sistema de Gestión Documentaria
-- Ejecutar este script en phpMyAdmin o MySQL CLI
-- 
-- VERSIÓN: 3.2
-- ÚLTIMA ACTUALIZACIÓN: 08 de Noviembre 2025
-- 
-- CAMBIOS EN ESTA VERSIÓN (v3.2):
-- 🗑️ ELIMINACIÓN DEL SISTEMA DE NOTIFICACIONES
-- - Eliminada tabla: notifications
-- - Eliminado índice: idx_notifications_user
-- - Removidas relaciones con users y documents
-- - Sistema WebSocket se mantiene para futuras funcionalidades
-- - Total de tablas: 15 (era 16)
--
-- CAMBIOS EN VERSIÓN ANTERIOR (v3.1):
-- ✨ TIPOS DE DOCUMENTO - SEPARACIÓN DELETE Y DEACTIVATE
-- - Nuevo permiso: document_types.deactivate (soft delete)
-- - Modificado permiso: document_types.delete (hard delete permanente)
-- - Endpoint PATCH /api/document-types/:id/deactivate (nuevo)
-- - Endpoint DELETE /api/document-types/:id ahora elimina permanentemente
-- - Frontend: Botones separados para desactivar (toggle) y eliminar
-- - Total de permisos: 86 (era 85)
--
-- CAMBIOS EN VERSIÓN ANTERIOR (v3.0):
-- ✨ SISTEMA DE PERMISOS GRANULARES IMPLEMENTADO
-- - Nueva tabla: permissions (permisos del sistema)
-- - Nueva tabla: role_permissions (relación muchos a muchos)
-- - Modificada tabla: roles (campos es_sistema, puede_asignar_permisos, is_active)
-- - Roles predefinidos: Solo Administrador y Jefe de Área
-- - Sistema RBAC completo con permisos configurables
-- - Los demás roles se crean personalizados con permisos específicos
--
-- CAMBIOS PREVIOS (v2.3):
-- - Tabla area_document_categories: Eliminados campos 'icono' y 'requiere_adjunto'
-- - Sistema de archivos adjuntos: Ahora obligatorio en todos los documentos
-- - Formatos permitidos: Solo PDF e imágenes (JPG, JPEG, PNG)
-- - Categorías simplificadas: Solo nombre, código, color, descripción
-- ============================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE sgd_db;

-- ============================================================
-- Tabla: roles
-- Descripción: Roles de usuarios en el sistema
-- Actualizado: v3.0 - Sistema de permisos granulares
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    es_sistema BOOLEAN DEFAULT FALSE COMMENT 'Rol del sistema (Admin, Jefe) - no editable',
    puede_asignar_permisos BOOLEAN DEFAULT FALSE COMMENT 'Puede gestionar permisos de otros roles',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Si el rol está activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_es_sistema (es_sistema),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: permissions
-- Descripción: Permisos del sistema (RBAC)
-- Agregado: v3.0 - Sistema de permisos granulares
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE COMMENT 'Código único del permiso (ej: documents.view.all)',
    nombre VARCHAR(150) NOT NULL COMMENT 'Nombre descriptivo del permiso',
    descripcion TEXT COMMENT 'Descripción detallada del permiso',
    categoria ENUM(
        'auth',
        'users', 
        'roles', 
        'areas', 
        'categories', 
        'document_types', 
        'documents', 
        'attachments', 
        'versions', 
        'movements', 
        'reports',
        'system'
    ) NOT NULL COMMENT 'Categoría del permiso',
    es_sistema BOOLEAN DEFAULT TRUE COMMENT 'Permiso del sistema (no se puede eliminar)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Si el permiso está activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_codigo (codigo),
    INDEX idx_is_active (is_active),
    INDEX idx_categoria_active (categoria, is_active)
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
-- Tabla: role_permissions
-- Descripción: Relación muchos a muchos entre roles y permisos
-- Agregado: v3.0 - Sistema de permisos granulares
-- NOTA: Debe ir DESPUÉS de users porque tiene FK a users(id)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    permission_id INT NOT NULL,
    asignado_por INT COMMENT 'Usuario que asignó el permiso',
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de asignación',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (asignado_por) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY unique_role_permission (rol_id, permission_id),
    INDEX idx_rol_id (rol_id),
    INDEX idx_permission_id (permission_id),
    INDEX idx_asignado_por (asignado_por)
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
-- Tabla: area_document_categories
-- Descripción: Categorías de documentos personalizables por área
-- Agregado: 2025-10-29 - Permite que cada área cree sus categorías
-- Actualizado: 2025-01-04 - Eliminados campos 'icono' y 'requiere_adjunto' (innecesarios)
-- ============================================================
CREATE TABLE IF NOT EXISTS area_document_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_id INT NOT NULL COMMENT 'Área a la que pertenece esta categoría',
    nombre VARCHAR(100) NOT NULL COMMENT 'Nombre de la categoría (ej: Oficio, Solicitud, Memo)',
    codigo VARCHAR(20) NOT NULL COMMENT 'Código corto para la categoría (ej: OFI, SOL, MEM)',
    descripcion TEXT COMMENT 'Descripción de la categoría',
    color VARCHAR(20) DEFAULT '#0066CC' COMMENT 'Color para identificación visual (hex)',
    orden INT DEFAULT 0 COMMENT 'Orden de visualización',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabla: documents (Tabla Central)
-- Descripción: Documentos principales del sistema
-- Actualizado: 2025-10-27 - Permitir NULL en doc_type_id para Mesa de Partes
-- Actualizado: 2025-10-29 - Agregado categoria_id para categorías por área
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_code VARCHAR(20) NOT NULL UNIQUE,
    asunto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    sender_id INT NOT NULL,
    doc_type_id INT COMMENT 'Tipo de documento - NULL permitido para documentos sin clasificar desde mesa de partes',
    categoria_id INT COMMENT 'Categoría personalizada del área',
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
    FOREIGN KEY (categoria_id) REFERENCES area_document_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (status_id) REFERENCES document_statuses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (current_area_id) REFERENCES areas(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (current_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_categoria_id (categoria_id)
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
-- Tabla: document_versions
-- Descripción: Historial de versiones de documentos
-- Agregado: 2025-10-29 - Permite subir documentos con sellos y firmas
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
    INDEX idx_document_id (document_id),
    INDEX idx_version_number (version_number),
    INDEX idx_uploaded_at (uploaded_at),
    UNIQUE KEY unique_document_version (document_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Datos iniciales (Seeds)
-- ============================================================

-- Insertar roles por defecto (SOLO Admin y Jefe de Área)
-- Los demás roles se crean personalizados desde el sistema
INSERT INTO roles (nombre, descripcion, es_sistema, puede_asignar_permisos, is_active) VALUES
('Administrador', 'Control total del sistema - Puede gestionar todo y asignar permisos', TRUE, TRUE, TRUE),
('Jefe de Área', 'Gestión completa de su área - Usuarios, documentos y reportes de su área', TRUE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE 
    descripcion = VALUES(descripcion),
    es_sistema = VALUES(es_sistema),
    puede_asignar_permisos = VALUES(puede_asignar_permisos),
    is_active = VALUES(is_active);

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

-- Insertar categorías de ejemplo para áreas
INSERT INTO area_document_categories (area_id, nombre, codigo, descripcion, color, orden) VALUES
-- Categorías para Mesa de Partes (área 1)
(1, 'Oficio', 'OFI', 'Oficios recibidos', '#0066CC', 1),
(1, 'Memorándum', 'MEM', 'Memorándums internos', '#28a745', 2),
(1, 'Solicitud', 'SOL', 'Solicitudes diversas', '#ffc107', 3),
(1, 'Informe', 'INF', 'Informes técnicos', '#dc3545', 4),
(1, 'Carta', 'CAR', 'Cartas formales', '#6c757d', 5),
-- Categorías para Recursos Humanos (área 3)
(3, 'Renuncia', 'REN', 'Cartas de renuncia', '#dc3545', 1),
(3, 'Permiso', 'PER', 'Solicitudes de permiso', '#ffc107', 2),
(3, 'Vacaciones', 'VAC', 'Solicitudes de vacaciones', '#28a745', 3),
(3, 'Licencia', 'LIC', 'Solicitudes de licencia', '#17a2b8', 4),
(3, 'Contrato', 'CON', 'Contratos laborales', '#6610f2', 5)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================================
-- Insertar PERMISOS del sistema (85 permisos)
-- ============================================================

-- CATEGORÍA: AUTH (6 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('auth.register', 'Registrar Usuarios', 'Puede registrar nuevos usuarios en el sistema', 'auth', TRUE),
('auth.profile.view', 'Ver Perfil Propio', 'Puede ver su propio perfil', 'auth', TRUE),
('auth.profile.edit', 'Editar Perfil Propio', 'Puede editar su propio perfil y cambiar contraseña', 'auth', TRUE),
('auth.sessions.view', 'Ver Sesiones Propias', 'Puede ver sus sesiones activas', 'auth', TRUE),
('auth.sessions.manage', 'Gestionar Sesiones Propias', 'Puede cerrar sus sesiones activas', 'auth', TRUE),
('auth.sessions.view.all', 'Ver Todas las Sesiones', 'Puede ver sesiones de todos los usuarios (Admin)', 'auth', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: USERS (9 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('users.view.all', 'Ver Todos los Usuarios', 'Puede ver lista completa de usuarios del sistema', 'users', TRUE),
('users.view.area', 'Ver Usuarios de su Área', 'Puede ver usuarios de su propia área', 'users', TRUE),
('users.view.own', 'Ver Perfil de Usuario', 'Puede ver detalles de un usuario específico', 'users', TRUE),
('users.create.all', 'Crear Cualquier Usuario', 'Puede crear usuarios con cualquier rol', 'users', TRUE),
('users.create.area', 'Crear Usuarios en su Área', 'Puede crear usuarios solo en su área', 'users', TRUE),
('users.edit.all', 'Editar Cualquier Usuario', 'Puede editar cualquier usuario del sistema', 'users', TRUE),
('users.edit.area', 'Editar Usuarios de su Área', 'Puede editar usuarios de su área', 'users', TRUE),
('users.delete', 'Desactivar Usuarios', 'Puede desactivar usuarios', 'users', TRUE),
('users.activate', 'Activar Usuarios', 'Puede activar usuarios desactivados', 'users', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: ROLES (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('roles.view', 'Ver Roles', 'Puede ver lista de roles del sistema', 'roles', TRUE),
('roles.create', 'Crear Roles', 'Puede crear nuevos roles personalizados', 'roles', TRUE),
('roles.edit', 'Editar Roles', 'Puede editar roles personalizados', 'roles', TRUE),
('roles.delete', 'Eliminar Roles', 'Puede eliminar roles personalizados', 'roles', TRUE),
('roles.permissions.manage', 'Gestionar Permisos de Roles', 'Puede asignar/quitar permisos a roles', 'roles', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: AREAS (9 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('areas.view.all', 'Ver Todas las Áreas', 'Puede ver lista completa de áreas', 'areas', TRUE),
('areas.view.stats.all', 'Ver Estadísticas de Todas las Áreas', 'Puede ver estadísticas globales', 'areas', TRUE),
('areas.view.stats.own', 'Ver Estadísticas de su Área', 'Puede ver estadísticas de su propia área', 'areas', TRUE),
('areas.create', 'Crear Áreas', 'Puede crear nuevas áreas/departamentos', 'areas', TRUE),
('areas.edit.all', 'Editar Cualquier Área', 'Puede editar cualquier área del sistema', 'areas', TRUE),
('areas.edit.own', 'Editar su Propia Área', 'Puede editar información de su área', 'areas', TRUE),
('areas.delete', 'Eliminar Áreas', 'Puede eliminar áreas del sistema', 'areas', TRUE),
('areas.activate', 'Activar Áreas', 'Puede activar áreas desactivadas', 'areas', TRUE),
('areas.deactivate', 'Desactivar Áreas', 'Puede desactivar áreas', 'areas', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: CATEGORIES (6 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('categories.view', 'Ver Categorías', 'Puede ver categorías de su área', 'categories', TRUE),
('categories.create', 'Crear Categorías', 'Puede crear categorías en su área', 'categories', TRUE),
('categories.edit', 'Editar Categorías', 'Puede editar categorías de su área', 'categories', TRUE),
('categories.delete', 'Eliminar Categorías', 'Puede eliminar categorías', 'categories', TRUE),
('categories.reorder', 'Reordenar Categorías', 'Puede cambiar el orden de categorías', 'categories', TRUE),
('categories.toggle', 'Activar/Desactivar Categorías', 'Puede activar o desactivar categorías', 'categories', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: DOCUMENT_TYPES (6 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('document_types.view', 'Ver Tipos de Documento', 'Puede ver tipos de documento del sistema', 'document_types', TRUE),
('document_types.create', 'Crear Tipos de Documento', 'Puede crear nuevos tipos de documento', 'document_types', TRUE),
('document_types.edit', 'Editar Tipos de Documento', 'Puede editar tipos de documento', 'document_types', TRUE),
('document_types.delete', 'Eliminar Tipos de Documento', 'Puede eliminar permanentemente tipos de documento', 'document_types', TRUE),
('document_types.activate', 'Activar Tipos de Documento', 'Puede activar tipos desactivados', 'document_types', TRUE),
('document_types.deactivate', 'Desactivar Tipos de Documento', 'Puede desactivar tipos de documento existentes', 'document_types', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: DOCUMENTS (16 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('documents.view.all', 'Ver Todos los Documentos', 'Puede ver documentos de todas las áreas', 'documents', TRUE),
('documents.view.area', 'Ver Documentos de su Área', 'Puede ver documentos de su área', 'documents', TRUE),
('documents.view.own', 'Ver Documentos Asignados', 'Puede ver solo documentos asignados a él', 'documents', TRUE),
('documents.create', 'Crear Documentos', 'Puede crear nuevos documentos', 'documents', TRUE),
('documents.edit.all', 'Editar Cualquier Documento', 'Puede editar cualquier documento del sistema', 'documents', TRUE),
('documents.edit.area', 'Editar Documentos de su Área', 'Puede editar documentos de su área', 'documents', TRUE),
('documents.derive', 'Derivar Documentos', 'Puede derivar documentos a otras áreas', 'documents', TRUE),
('documents.finalize', 'Finalizar Documentos', 'Puede finalizar/atender documentos', 'documents', TRUE),
('documents.archive', 'Archivar Documentos', 'Puede archivar documentos', 'documents', TRUE),
('documents.unarchive', 'Desarchivar Documentos', 'Puede desarchivar documentos', 'documents', TRUE),
('documents.category.assign', 'Asignar Categorías', 'Puede asignar categorías a documentos', 'documents', TRUE),
('documents.status.change', 'Cambiar Estados', 'Puede cambiar estados de documentos manualmente', 'documents', TRUE),
('documents.tracking.public', 'Rastreo Público', 'Acceso público a rastreo de documentos', 'documents', TRUE),
('documents.search', 'Buscar Documentos', 'Puede realizar búsquedas avanzadas', 'documents', TRUE),
('documents.stats.view', 'Ver Estadísticas de Documentos', 'Puede ver estadísticas generales', 'documents', TRUE),
('documents.submit.public', 'Presentar Documentos (Público)', 'Mesa de Partes Virtual pública', 'documents', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: ATTACHMENTS (4 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('attachments.view', 'Ver Adjuntos', 'Puede ver archivos adjuntos', 'attachments', TRUE),
('attachments.upload', 'Subir Adjuntos', 'Puede subir archivos adjuntos', 'attachments', TRUE),
('attachments.download', 'Descargar Adjuntos', 'Puede descargar archivos adjuntos', 'attachments', TRUE),
('attachments.delete', 'Eliminar Adjuntos', 'Puede eliminar archivos adjuntos', 'attachments', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: VERSIONS (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('versions.view', 'Ver Versiones', 'Puede ver historial de versiones de documentos', 'versions', TRUE),
('versions.upload', 'Subir Versiones', 'Puede subir nuevas versiones de documentos', 'versions', TRUE),
('versions.download', 'Descargar Versiones', 'Puede descargar versiones de documentos', 'versions', TRUE),
('versions.delete', 'Eliminar Versiones', 'Puede eliminar versiones de documentos', 'versions', TRUE),
('versions.list', 'Listar Versiones', 'Puede listar todas las versiones disponibles', 'versions', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: MOVEMENTS (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('movements.view', 'Ver Historial de Movimientos', 'Puede ver historial de movimientos', 'movements', TRUE),
('movements.create', 'Crear Movimientos Manuales', 'Puede crear movimientos manuales (Admin)', 'movements', TRUE),
('movements.accept', 'Aceptar Documentos', 'Puede aceptar documentos derivados', 'movements', TRUE),
('movements.reject', 'Rechazar Documentos', 'Puede rechazar documentos derivados', 'movements', TRUE),
('movements.complete', 'Completar Documentos', 'Puede marcar documentos como completados', 'movements', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: REPORTS (4 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('reports.view.all', 'Ver Reportes Globales', 'Puede ver reportes de todo el sistema', 'reports', TRUE),
('reports.view.area', 'Ver Reportes de su Área', 'Puede ver reportes de su área', 'reports', TRUE),
('reports.export.all', 'Exportar Reportes Globales', 'Puede exportar reportes globales', 'reports', TRUE),
('reports.export.area', 'Exportar Reportes de su Área', 'Puede exportar reportes de su área', 'reports', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: SYSTEM (3 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('system.audit.view', 'Ver Auditoría del Sistema', 'Puede ver logs de auditoría', 'system', TRUE),
('system.settings.view', 'Ver Configuración del Sistema', 'Puede ver configuración general', 'system', TRUE),
('system.settings.edit', 'Editar Configuración del Sistema', 'Puede modificar configuración del sistema', 'system', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================================
-- Asignar TODOS los permisos al rol Administrador
-- ============================================================
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    id
FROM permissions
WHERE es_sistema = TRUE
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================
-- Asignar permisos específicos al rol Jefe de Área
-- ============================================================

-- AUTH
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('auth.profile.view', 'auth.profile.edit', 'auth.sessions.view', 'auth.sessions.manage')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- USERS (Solo su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('users.view.area', 'users.view.own', 'users.create.area', 'users.edit.area')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ROLES (Solo ver)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('roles.view')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- AREAS (Solo su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('areas.view.all', 'areas.view.stats.own', 'areas.edit.own')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- CATEGORIES (Su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('categories.view', 'categories.create', 'categories.edit', 'categories.reorder', 'categories.toggle')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- DOCUMENT_TYPES (Solo ver)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('document_types.view')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- DOCUMENTS (Su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('documents.view.area', 'documents.create', 'documents.edit.area', 'documents.derive', 'documents.finalize', 'documents.archive', 'documents.category.assign', 'documents.search', 'documents.stats.view')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ATTACHMENTS
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('attachments.view', 'attachments.upload', 'attachments.download')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- VERSIONS
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('versions.view', 'versions.upload', 'versions.download', 'versions.list')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- MOVEMENTS
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('movements.view', 'movements.accept', 'movements.reject', 'movements.complete')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- REPORTS (Solo su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT (SELECT id FROM roles WHERE nombre = 'Jefe de Área'), id
FROM permissions
WHERE codigo IN ('reports.view.area', 'reports.export.area')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================
-- Índices para optimización de consultas
-- ============================================================

CREATE INDEX idx_documents_tracking ON documents(tracking_code);
CREATE INDEX idx_documents_status ON documents(status_id);
CREATE INDEX idx_documents_current_area ON documents(current_area_id);
CREATE INDEX idx_documents_current_user ON documents(current_user_id);
CREATE INDEX idx_movements_document ON document_movements(document_id);
CREATE INDEX idx_movements_timestamp ON document_movements(timestamp);
CREATE INDEX idx_attachments_document ON attachments(document_id);

-- ============================================================
-- RESUMEN DE ESTRUCTURA (v3.2)
-- ============================================================
-- Total de tablas: 15
-- Total de permisos: 86 (12 categorías)
-- Total de roles predefinidos: 2 (Administrador, Jefe de Área)
--
-- TABLAS DEL SISTEMA:
-- 1. roles (gestión de roles y permisos)
-- 2. permissions (permisos granulares del sistema - 86 permisos)
-- 3. role_permissions (relación muchos a muchos roles-permisos)
-- 4. areas (departamentos de la institución)
-- 5. users (usuarios del sistema)
-- 6. user_sessions (sesiones JWT con refresh tokens)
-- 7. login_attempts (seguridad anti fuerza bruta)
-- 8. senders (remitentes externos - Mesa de Partes Virtual)
-- 9. document_types (tipos de documentos globales)
-- 10. document_statuses (estados del flujo de documentos)
-- 11. area_document_categories (categorías personalizables por área)
-- 12. documents (tabla principal de documentos)
-- 13. document_movements (trazabilidad completa de movimientos)
-- 14. document_versions (historial de versiones con sello/firma)
-- 15. attachments (archivos adjuntos - OBLIGATORIOS)
--
-- CATEGORÍAS DE PERMISOS (86 total):
-- - auth: 6 permisos (registro, perfil, sesiones)
-- - users: 9 permisos (gestión de usuarios)
-- - roles: 5 permisos (gestión de roles)
-- - areas: 9 permisos (gestión de áreas)
-- - categories: 6 permisos (categorías por área)
-- - document_types: 6 permisos (tipos globales) ← ACTUALIZADO en v3.1
-- - documents: 16 permisos (gestión documental)
-- - attachments: 4 permisos (archivos adjuntos)
-- - versions: 5 permisos (versionado)
-- - movements: 5 permisos (derivaciones)
-- - reports: 4 permisos (reportes)
-- - system: 3 permisos (configuración)
--
-- DATOS INICIALES (SEEDS):
-- - Estados: Pendiente, En Proceso, Derivado, Atendido, Observado, Archivado
-- - Áreas: Mesa de Partes, Dirección General, RRHH, Logística, Asesoría Legal
-- - Roles: Administrador (TODOS los permisos), Jefe de Área (permisos de su área)
-- - Tipos de documento: Solicitud, Reclamo, Consulta, Recurso, Oficio
-- - Categorías de ejemplo: Por área (Mesa de Partes: 5 categorías, RRHH: 5 categorías)
--
-- REGLAS IMPORTANTES:
-- ✅ doc_type_id en documents permite NULL (documentos sin tipo desde mesa de partes)
-- ✅ categoria_id en documents permite NULL (categoría personalizada opcional)
-- ✅ user_id en document_movements permite NULL (acciones públicas/automáticas)
-- ✅ email y telefono en senders son OBLIGATORIOS (Mesa de Partes Virtual)
-- ✅ Cada área puede crear categorías ilimitadas (area_document_categories)
-- ✅ Versiones mantienen historial completo con flags tiene_sello/tiene_firma
-- ✅ ARCHIVOS ADJUNTOS OBLIGATORIOS: Mínimo 1 archivo PDF o imagen por documento
-- ✅ FORMATOS PERMITIDOS: Solo PDF, JPG, JPEG, PNG (validación frontend y backend)
-- ⚠️ TIPOS DE DOCUMENTO: DELETE elimina permanente, DEACTIVATE es soft delete
-- ⚠️ expires_at en user_sessions NO debe tener ON UPDATE CURRENT_TIMESTAMP
-- 
-- FLUJO DE TRABAJO:
-- 1. Mesa de Partes Virtual → Ciudadano presenta documento (doc_type_id puede ser NULL)
-- 2. Mesa de Partes Interna → Asigna tipo y deriva a área correspondiente
-- 3. Área Receptora → Asigna categoría propia y procesa documento
-- 4. Derivaciones → Movimientos entre áreas con trazabilidad completa
-- 5. Versiones → Cada área puede subir versión con sello/firma
-- 6. Finalización → Atendido/Archivado con historial completo
-- ============================================================

SELECT 'Base de datos SGD v3.1 creada exitosamente - 16 tablas, 86 permisos' AS mensaje;
