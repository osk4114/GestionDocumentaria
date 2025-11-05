-- ============================================================
-- MIGRACIÓN: Sistema de Permisos Granulares
-- Fecha: 5 de Noviembre 2025
-- Versión: 3.0
-- 
-- DESCRIPCIÓN:
-- Implementa sistema RBAC (Role-Based Access Control) avanzado
-- con permisos configurables por rol.
-- 
-- CAMBIOS:
-- 1. Nueva tabla: permissions (85+ permisos del sistema)
-- 2. Nueva tabla: role_permissions (relación muchos a muchos)
-- 3. Modificar tabla: roles (agregar campos es_sistema, puede_asignar_permisos)
-- 4. Actualizar roles predefinidos (solo Admin y Jefe de Área)
-- 5. Insertar permisos del sistema
-- 6. Asignar permisos a roles predefinidos
-- ============================================================

USE sgd_db;

-- ============================================================
-- PASO 1: Crear tabla de permisos
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
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASO 2: Crear tabla de relación rol-permisos
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_by INT COMMENT 'Usuario que otorgó el permiso',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY unique_role_permission (rol_id, permission_id),
    INDEX idx_rol_id (rol_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASO 3: Modificar tabla roles
-- ============================================================
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS es_sistema BOOLEAN DEFAULT FALSE COMMENT 'Rol del sistema (Admin, Jefe) - no editable';

ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS puede_asignar_permisos BOOLEAN DEFAULT FALSE COMMENT 'Puede gestionar permisos de otros roles';

ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE COMMENT 'Si el rol está activo';

-- ============================================================
-- PASO 4: Actualizar roles predefinidos (solo Admin y Jefe)
-- ============================================================

-- Eliminar roles que ya no son necesarios (se crearán personalizados)
DELETE FROM roles WHERE nombre IN ('Funcionario', 'Mesa de Partes');

-- Actualizar rol Administrador
UPDATE roles 
SET es_sistema = TRUE, 
    puede_asignar_permisos = TRUE,
    is_active = TRUE,
    descripcion = 'Control total del sistema - Puede gestionar todo y asignar permisos'
WHERE nombre = 'Administrador';

-- Actualizar rol Jefe de Área
UPDATE roles 
SET es_sistema = TRUE, 
    puede_asignar_permisos = FALSE,
    is_active = TRUE,
    descripcion = 'Gestión completa de su área - Usuarios, documentos y reportes de su área'
WHERE nombre = 'Jefe de Área';

-- ============================================================
-- PASO 5: Insertar permisos del sistema (85 permisos)
-- ============================================================

-- CATEGORÍA: AUTH (6 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('auth.register', 'Registrar Usuarios', 'Puede registrar nuevos usuarios en el sistema', 'auth'),
('auth.profile.view', 'Ver Perfil Propio', 'Puede ver su propio perfil', 'auth'),
('auth.profile.edit', 'Editar Perfil Propio', 'Puede editar su propio perfil y cambiar contraseña', 'auth'),
('auth.sessions.view', 'Ver Sesiones Propias', 'Puede ver sus sesiones activas', 'auth'),
('auth.sessions.manage', 'Gestionar Sesiones Propias', 'Puede cerrar sus sesiones activas', 'auth'),
('auth.sessions.view.all', 'Ver Todas las Sesiones', 'Puede ver sesiones de todos los usuarios (Admin)', 'auth')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: USERS (9 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('users.view.all', 'Ver Todos los Usuarios', 'Puede ver lista completa de usuarios del sistema', 'users'),
('users.view.area', 'Ver Usuarios de su Área', 'Puede ver usuarios de su propia área', 'users'),
('users.view.own', 'Ver Perfil de Usuario', 'Puede ver detalles de un usuario específico', 'users'),
('users.create.all', 'Crear Cualquier Usuario', 'Puede crear usuarios con cualquier rol', 'users'),
('users.create.area', 'Crear Usuarios en su Área', 'Puede crear usuarios solo en su área', 'users'),
('users.edit.all', 'Editar Cualquier Usuario', 'Puede editar cualquier usuario del sistema', 'users'),
('users.edit.area', 'Editar Usuarios de su Área', 'Puede editar usuarios de su área', 'users'),
('users.delete', 'Desactivar Usuarios', 'Puede desactivar usuarios', 'users'),
('users.activate', 'Activar Usuarios', 'Puede activar usuarios desactivados', 'users')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: ROLES (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('roles.view', 'Ver Roles', 'Puede ver lista de roles del sistema', 'roles'),
('roles.create', 'Crear Roles', 'Puede crear nuevos roles personalizados', 'roles'),
('roles.edit', 'Editar Roles', 'Puede editar roles personalizados', 'roles'),
('roles.delete', 'Eliminar Roles', 'Puede eliminar roles personalizados', 'roles'),
('roles.permissions.manage', 'Gestionar Permisos de Roles', 'Puede asignar/quitar permisos a roles', 'roles')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: AREAS (9 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('areas.view.all', 'Ver Todas las Áreas', 'Puede ver lista completa de áreas', 'areas'),
('areas.view.stats.all', 'Ver Estadísticas de Todas las Áreas', 'Puede ver estadísticas globales', 'areas'),
('areas.view.stats.own', 'Ver Estadísticas de su Área', 'Puede ver estadísticas de su propia área', 'areas'),
('areas.create', 'Crear Áreas', 'Puede crear nuevas áreas/departamentos', 'areas'),
('areas.edit.all', 'Editar Cualquier Área', 'Puede editar cualquier área del sistema', 'areas'),
('areas.edit.own', 'Editar su Propia Área', 'Puede editar información de su área', 'areas'),
('areas.delete', 'Eliminar Áreas', 'Puede eliminar áreas del sistema', 'areas'),
('areas.activate', 'Activar Áreas', 'Puede activar áreas desactivadas', 'areas'),
('areas.deactivate', 'Desactivar Áreas', 'Puede desactivar áreas', 'areas')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: CATEGORIES (6 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('categories.view', 'Ver Categorías', 'Puede ver categorías de su área', 'categories'),
('categories.create', 'Crear Categorías', 'Puede crear categorías en su área', 'categories'),
('categories.edit', 'Editar Categorías', 'Puede editar categorías de su área', 'categories'),
('categories.delete', 'Eliminar Categorías', 'Puede eliminar categorías', 'categories'),
('categories.reorder', 'Reordenar Categorías', 'Puede cambiar el orden de categorías', 'categories'),
('categories.toggle', 'Activar/Desactivar Categorías', 'Puede activar o desactivar categorías', 'categories')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: DOCUMENT_TYPES (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('document_types.view', 'Ver Tipos de Documento', 'Puede ver tipos de documento del sistema', 'document_types'),
('document_types.create', 'Crear Tipos de Documento', 'Puede crear nuevos tipos de documento', 'document_types'),
('document_types.edit', 'Editar Tipos de Documento', 'Puede editar tipos de documento', 'document_types'),
('document_types.delete', 'Eliminar Tipos de Documento', 'Puede eliminar tipos de documento', 'document_types'),
('document_types.activate', 'Activar Tipos de Documento', 'Puede activar/desactivar tipos', 'document_types')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: DOCUMENTS (16 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('documents.view.all', 'Ver Todos los Documentos', 'Puede ver documentos de todas las áreas', 'documents'),
('documents.view.area', 'Ver Documentos de su Área', 'Puede ver documentos de su área', 'documents'),
('documents.view.own', 'Ver Documentos Asignados', 'Puede ver solo documentos asignados a él', 'documents'),
('documents.create', 'Crear Documentos', 'Puede crear nuevos documentos', 'documents'),
('documents.edit.all', 'Editar Cualquier Documento', 'Puede editar cualquier documento del sistema', 'documents'),
('documents.edit.area', 'Editar Documentos de su Área', 'Puede editar documentos de su área', 'documents'),
('documents.derive', 'Derivar Documentos', 'Puede derivar documentos a otras áreas', 'documents'),
('documents.finalize', 'Finalizar Documentos', 'Puede finalizar/atender documentos', 'documents'),
('documents.archive', 'Archivar Documentos', 'Puede archivar documentos', 'documents'),
('documents.unarchive', 'Desarchivar Documentos', 'Puede desarchivar documentos', 'documents'),
('documents.category.assign', 'Asignar Categorías', 'Puede asignar categorías a documentos', 'documents'),
('documents.status.change', 'Cambiar Estados', 'Puede cambiar estados de documentos manualmente', 'documents'),
('documents.tracking.public', 'Rastreo Público', 'Acceso público a rastreo de documentos', 'documents'),
('documents.search', 'Buscar Documentos', 'Puede realizar búsquedas avanzadas', 'documents'),
('documents.stats.view', 'Ver Estadísticas de Documentos', 'Puede ver estadísticas generales', 'documents'),
('documents.submit.public', 'Presentar Documentos (Público)', 'Mesa de Partes Virtual pública', 'documents')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: ATTACHMENTS (4 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('attachments.view', 'Ver Adjuntos', 'Puede ver archivos adjuntos', 'attachments'),
('attachments.upload', 'Subir Adjuntos', 'Puede subir archivos adjuntos', 'attachments'),
('attachments.download', 'Descargar Adjuntos', 'Puede descargar archivos adjuntos', 'attachments'),
('attachments.delete', 'Eliminar Adjuntos', 'Puede eliminar archivos adjuntos', 'attachments')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: VERSIONS (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('versions.view', 'Ver Versiones', 'Puede ver historial de versiones de documentos', 'versions'),
('versions.upload', 'Subir Versiones', 'Puede subir nuevas versiones de documentos', 'versions'),
('versions.download', 'Descargar Versiones', 'Puede descargar versiones de documentos', 'versions'),
('versions.delete', 'Eliminar Versiones', 'Puede eliminar versiones de documentos', 'versions'),
('versions.list', 'Listar Versiones', 'Puede listar todas las versiones disponibles', 'versions')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: MOVEMENTS (5 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('movements.view', 'Ver Historial de Movimientos', 'Puede ver historial de movimientos', 'movements'),
('movements.create', 'Crear Movimientos Manuales', 'Puede crear movimientos manuales (Admin)', 'movements'),
('movements.accept', 'Aceptar Documentos', 'Puede aceptar documentos derivados', 'movements'),
('movements.reject', 'Rechazar Documentos', 'Puede rechazar documentos derivados', 'movements'),
('movements.complete', 'Completar Documentos', 'Puede marcar documentos como completados', 'movements')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: REPORTS (4 permisos)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('reports.view.all', 'Ver Reportes Globales', 'Puede ver reportes de todo el sistema', 'reports'),
('reports.view.area', 'Ver Reportes de su Área', 'Puede ver reportes de su área', 'reports'),
('reports.export.all', 'Exportar Reportes Globales', 'Puede exportar reportes globales', 'reports'),
('reports.export.area', 'Exportar Reportes de su Área', 'Puede exportar reportes de su área', 'reports')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- CATEGORÍA: SYSTEM (3 permisos adicionales)
INSERT INTO permissions (codigo, nombre, descripcion, categoria) VALUES
('system.audit.view', 'Ver Auditoría del Sistema', 'Puede ver logs de auditoría', 'system'),
('system.settings.view', 'Ver Configuración del Sistema', 'Puede ver configuración general', 'system'),
('system.settings.edit', 'Editar Configuración del Sistema', 'Puede modificar configuración del sistema', 'system')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- ============================================================
-- PASO 6: Asignar TODOS los permisos al rol Administrador
-- ============================================================
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Administrador'),
    id
FROM permissions
WHERE es_sistema = TRUE
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================
-- PASO 7: Asignar permisos al rol Jefe de Área
-- ============================================================

-- AUTH
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'auth.profile.view',
    'auth.profile.edit',
    'auth.sessions.view',
    'auth.sessions.manage'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- USERS (Solo su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'users.view.area',
    'users.view.own',
    'users.create.area',
    'users.edit.area'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ROLES (Solo ver)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN ('roles.view')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- AREAS (Solo su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'areas.view.all',
    'areas.view.stats.own',
    'areas.edit.own'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- CATEGORIES (Su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'categories.view',
    'categories.create',
    'categories.edit',
    'categories.reorder',
    'categories.toggle'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- DOCUMENT_TYPES (Solo ver)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN ('document_types.view')
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- DOCUMENTS (Su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'documents.view.area',
    'documents.create',
    'documents.edit.area',
    'documents.derive',
    'documents.finalize',
    'documents.archive',
    'documents.category.assign',
    'documents.search',
    'documents.stats.view'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ATTACHMENTS
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'attachments.view',
    'attachments.upload',
    'attachments.download'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- VERSIONS
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'versions.view',
    'versions.upload',
    'versions.download',
    'versions.list'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- MOVEMENTS
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'movements.view',
    'movements.accept',
    'movements.reject',
    'movements.complete'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- REPORTS (Solo su área)
INSERT INTO role_permissions (rol_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Jefe de Área'),
    id
FROM permissions
WHERE codigo IN (
    'reports.view.area',
    'reports.export.area'
)
ON DUPLICATE KEY UPDATE rol_id = rol_id;

-- ============================================================
-- PASO 8: Crear índices adicionales para optimización
-- ============================================================
CREATE INDEX idx_role_active ON roles(is_active);
CREATE INDEX idx_permission_categoria_active ON permissions(categoria, is_active);

-- ============================================================
-- RESUMEN DE LA MIGRACIÓN
-- ============================================================
SELECT 'Sistema de permisos implementado exitosamente' AS status,
       (SELECT COUNT(*) FROM permissions) AS total_permisos,
       (SELECT COUNT(*) FROM role_permissions WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador')) AS permisos_admin,
       (SELECT COUNT(*) FROM role_permissions WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Jefe de Área')) AS permisos_jefe;
