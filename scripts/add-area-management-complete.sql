-- ============================================================
-- Script: Agregar categoría "area_management" COMPLETA para Encargado de Área
-- Ejecutar: En phpMyAdmin o MySQL CLI
-- Fecha: 13 de Noviembre 2025
-- Descripción: Agrega 23 permisos para gestión completa del área
-- ============================================================

USE sgd_db;

-- Paso 1: Modificar el ENUM de la tabla permissions para agregar 'area_management'
ALTER TABLE permissions 
MODIFY COLUMN categoria ENUM(
    'auth',
    'users', 
    'roles', 
    'areas',
    'area_management',
    'categories', 
    'document_types', 
    'documents', 
    'attachments', 
    'versions', 
    'movements', 
    'reports',
    'system'
) NOT NULL COMMENT 'Categoría del permiso';

-- Paso 2: Insertar los 23 permisos de area_management
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
-- Usuarios (4 permisos)
('area_mgmt.users.view', 'Ver Usuarios de su Área', 'Ver usuarios de su propia área', 'area_management', TRUE),
('area_mgmt.users.create', 'Crear Usuarios en su Área', 'Crear usuarios solo en su área', 'area_management', TRUE),
('area_mgmt.users.edit', 'Editar Usuarios de su Área', 'Editar usuarios de su área', 'area_management', TRUE),
('area_mgmt.users.manage', 'Gestionar Usuarios de su Área', 'Activar/desactivar usuarios de su área', 'area_management', TRUE),

-- Roles (3 permisos)
('area_mgmt.roles.view', 'Ver Roles', 'Ver roles del sistema', 'area_management', TRUE),
('area_mgmt.roles.create', 'Crear Roles', 'Crear roles personalizados para su área', 'area_management', TRUE),
('area_mgmt.roles.edit', 'Editar Roles', 'Editar roles personalizados', 'area_management', TRUE),

-- Tipos de Documento (3 permisos)
('area_mgmt.document_types.view', 'Ver Tipos de Documento', 'Ver tipos de documento de su área', 'area_management', TRUE),
('area_mgmt.document_types.create', 'Crear Tipos de Documento', 'Crear tipos de documento para su área', 'area_management', TRUE),
('area_mgmt.document_types.edit', 'Editar Tipos de Documento', 'Editar tipos de documento de su área', 'area_management', TRUE),

-- Categorías (1 permiso)
('area_mgmt.categories.full', 'Gestión Completa de Categorías', 'Crear, editar y gestionar categorías de su área', 'area_management', TRUE),

-- Documentos (4 permisos)
('area_mgmt.documents.view', 'Ver Documentos de su Área', 'Ver documentos de su área', 'area_management', TRUE),
('area_mgmt.documents.create', 'Crear Documentos', 'Crear nuevos documentos en su área', 'area_management', TRUE),
('area_mgmt.documents.edit', 'Editar Documentos de su Área', 'Editar documentos de su área', 'area_management', TRUE),
('area_mgmt.documents.manage', 'Gestión Completa de Documentos', 'Derivar, finalizar, archivar documentos de su área', 'area_management', TRUE),

-- Adjuntos y Versiones (2 permisos)
('area_mgmt.attachments.full', 'Gestión Completa de Adjuntos', 'Subir, ver, descargar y eliminar adjuntos', 'area_management', TRUE),
('area_mgmt.versions.full', 'Gestión Completa de Versiones', 'Subir, ver y gestionar versiones de documentos', 'area_management', TRUE),

-- Movimientos (4 permisos)
('area_mgmt.movements.accept', 'Aceptar Documentos', 'Aceptar documentos derivados a su área', 'area_management', TRUE),
('area_mgmt.movements.reject', 'Rechazar Documentos', 'Rechazar documentos derivados', 'area_management', TRUE),
('area_mgmt.movements.complete', 'Completar Documentos', 'Marcar documentos como completados', 'area_management', TRUE),
('area_mgmt.movements.view', 'Ver Historial de Movimientos', 'Ver historial de su área', 'area_management', TRUE),

-- Reportes (2 permisos)
('area_mgmt.reports.view', 'Ver Reportes de su Área', 'Ver reportes y estadísticas de su área', 'area_management', TRUE),
('area_mgmt.reports.export', 'Exportar Reportes de su Área', 'Exportar reportes de su área', 'area_management', TRUE)

ON DUPLICATE KEY UPDATE nombre=nombre;

-- Paso 3: Verificar inserción
SELECT 
    categoria,
    COUNT(*) as total_permisos
FROM permissions
WHERE categoria = 'area_management'
GROUP BY categoria;

-- Paso 4: Mostrar todos los permisos insertados
SELECT 
    id,
    codigo,
    nombre,
    descripcion
FROM permissions
WHERE categoria = 'area_management'
ORDER BY codigo;

-- ============================================================
-- RESUMEN
-- ============================================================
-- Total de permisos area_management: 23
-- 
-- Distribución:
-- - Usuarios: 4 permisos
-- - Roles: 3 permisos
-- - Tipos de Documento: 3 permisos
-- - Categorías: 1 permiso
-- - Documentos: 4 permisos
-- - Adjuntos/Versiones: 2 permisos
-- - Movimientos: 4 permisos
-- - Reportes: 2 permisos
-- ============================================================
