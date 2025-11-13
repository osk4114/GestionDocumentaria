-- ============================================================
-- Script: Agregar categoría "area_management" para Jefe de Área
-- Ejecutar: En phpMyAdmin o MySQL CLI
-- Fecha: 13 de Noviembre 2025
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

-- Paso 2: Insertar los 17 permisos de area_management
INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
('area_mgmt.users.view', 'Ver Usuarios de su Área', 'Ver usuarios de su propia área', 'area_management', TRUE),
('area_mgmt.users.create', 'Crear Usuarios en su Área', 'Crear usuarios solo en su área', 'area_management', TRUE),
('area_mgmt.users.edit', 'Editar Usuarios de su Área', 'Editar usuarios de su área', 'area_management', TRUE),
('area_mgmt.users.manage', 'Gestionar Usuarios de su Área', 'Activar/desactivar usuarios de su área', 'area_management', TRUE),
('area_mgmt.categories.full', 'Gestión Completa de Categorías', 'Crear, editar y gestionar categorías de su área', 'area_management', TRUE),
('area_mgmt.documents.view', 'Ver Documentos de su Área', 'Ver documentos de su área', 'area_management', TRUE),
('area_mgmt.documents.create', 'Crear Documentos', 'Crear nuevos documentos en su área', 'area_management', TRUE),
('area_mgmt.documents.edit', 'Editar Documentos de su Área', 'Editar documentos de su área', 'area_management', TRUE),
('area_mgmt.documents.manage', 'Gestión Completa de Documentos', 'Derivar, finalizar, archivar documentos de su área', 'area_management', TRUE),
('area_mgmt.attachments.full', 'Gestión Completa de Adjuntos', 'Subir, ver, descargar y eliminar adjuntos', 'area_management', TRUE),
('area_mgmt.versions.full', 'Gestión Completa de Versiones', 'Subir, ver y gestionar versiones de documentos', 'area_management', TRUE),
('area_mgmt.movements.accept', 'Aceptar Documentos', 'Aceptar documentos derivados a su área', 'area_management', TRUE),
('area_mgmt.movements.reject', 'Rechazar Documentos', 'Rechazar documentos derivados', 'area_management', TRUE),
('area_mgmt.movements.complete', 'Completar Documentos', 'Marcar documentos como completados', 'area_management', TRUE),
('area_mgmt.movements.view', 'Ver Historial de Movimientos', 'Ver historial de su área', 'area_management', TRUE),
('area_mgmt.reports.view', 'Ver Reportes de su Área', 'Ver reportes y estadísticas de su área', 'area_management', TRUE),
('area_mgmt.reports.export', 'Exportar Reportes de su Área', 'Exportar reportes de su área', 'area_management', TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Verificación: Contar permisos por categoría
SELECT 
    categoria,
    COUNT(*) as total_permisos
FROM permissions
GROUP BY categoria
ORDER BY categoria;

-- Resultado esperado: area_management con 17 permisos
SELECT 'Script ejecutado exitosamente - 17 permisos agregados a area_management' AS mensaje;
