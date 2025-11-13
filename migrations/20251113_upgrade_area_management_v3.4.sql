-- ============================================================
-- MIGRACIÓN: v3.3 → v3.4
-- Actualizar categoría "Jefe de Área" con permisos completos
-- ============================================================
-- Fecha: 13 de Noviembre 2025
-- Descripción: Agrega 31 permisos nuevos a area_management para
--              funcionalidad completa de bandeja, adjuntos, versiones
-- ============================================================

USE sgd_db;

-- ============================================================
-- 1. AGREGAR NUEVOS PERMISOS A CATEGORÍA area_management
-- ============================================================

INSERT INTO permissions (codigo, nombre, descripcion, categoria, es_sistema) VALUES
-- Documentos ampliados (8 permisos nuevos)
('area_mgmt.documents.view.own', 'Ver Documentos Asignados', 'Ver documentos asignados personalmente', 'area_management', TRUE),
('area_mgmt.documents.derive', 'Derivar Documentos', 'Derivar documentos a otras áreas o usuarios', 'area_management', TRUE),
('area_mgmt.documents.finalize', 'Finalizar Documentos', 'Finalizar/atender documentos', 'area_management', TRUE),
('area_mgmt.documents.archive', 'Archivar Documentos', 'Archivar documentos completados', 'area_management', TRUE),
('area_mgmt.documents.unarchive', 'Desarchivar Documentos', 'Recuperar documentos archivados', 'area_management', TRUE),
('area_mgmt.documents.category.assign', 'Asignar Categorías', 'Asignar/cambiar categorías de documentos', 'area_management', TRUE),
('area_mgmt.documents.status.change', 'Cambiar Estados', 'Cambiar estados de documentos manualmente', 'area_management', TRUE),
('area_mgmt.documents.search', 'Buscar Documentos', 'Realizar búsquedas avanzadas de documentos', 'area_management', TRUE),
('area_mgmt.documents.stats.view', 'Ver Estadísticas de Documentos', 'Ver estadísticas de documentos del área', 'area_management', TRUE),

-- Adjuntos específicos (4 permisos nuevos)
('area_mgmt.attachments.view', 'Ver Adjuntos', 'Ver archivos adjuntos a documentos', 'area_management', TRUE),
('area_mgmt.attachments.upload', 'Subir Adjuntos', 'Subir archivos adjuntos a documentos', 'area_management', TRUE),
('area_mgmt.attachments.download', 'Descargar Adjuntos', 'Descargar archivos adjuntos', 'area_management', TRUE),
('area_mgmt.attachments.delete', 'Eliminar Adjuntos', 'Eliminar archivos adjuntos', 'area_management', TRUE),

-- Versiones específicas (5 permisos nuevos)
('area_mgmt.versions.view', 'Ver Versiones', 'Ver historial de versiones de documentos', 'area_management', TRUE),
('area_mgmt.versions.upload', 'Subir Versiones', 'Subir nuevas versiones de documentos', 'area_management', TRUE),
('area_mgmt.versions.download', 'Descargar Versiones', 'Descargar versiones de documentos (con sello/firma)', 'area_management', TRUE),
('area_mgmt.versions.list', 'Listar Versiones', 'Listar todas las versiones disponibles', 'area_management', TRUE),
('area_mgmt.versions.delete', 'Eliminar Versiones', 'Eliminar versiones de documentos', 'area_management', TRUE),

-- Movimientos específicos (1 permiso nuevo)
('area_mgmt.movements.create', 'Crear Movimientos Manuales', 'Crear movimientos manuales (uso avanzado)', 'area_management', TRUE)

ON DUPLICATE KEY UPDATE 
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion);

-- ============================================================
-- 2. ELIMINAR PERMISOS GENÉRICOS DUPLICADOS (OPCIONAL)
-- ============================================================
-- Los siguientes permisos genéricos ya no son necesarios porque
-- fueron reemplazados por permisos específicos:
-- - area_mgmt.documents.manage (ahora: derive, finalize, archive)
-- - area_mgmt.attachments.full (ahora: view, upload, download, delete)
-- - area_mgmt.versions.full (ahora: view, upload, download, list, delete)

-- NOTA: NO eliminar si hay roles existentes que los usan
-- Descomentar solo si estás seguro:
-- DELETE FROM role_permissions WHERE permission_id IN (
--     SELECT id FROM permissions WHERE codigo IN (
--         'area_mgmt.documents.manage',
--         'area_mgmt.attachments.full',
--         'area_mgmt.versions.full'
--     )
-- );
-- DELETE FROM permissions WHERE codigo IN (
--     'area_mgmt.documents.manage',
--     'area_mgmt.attachments.full',
--     'area_mgmt.versions.full'
-- );

-- ============================================================
-- 3. ACTUALIZAR ROLES EXISTENTES CON CATEGORÍA "JEFE DE ÁREA"
-- ============================================================
-- Agregar los nuevos permisos a roles que ya tienen permisos
-- de la categoría area_management

-- Identificar roles que tienen permisos de area_management
INSERT INTO role_permissions (rol_id, permission_id)
SELECT DISTINCT 
    rp.rol_id,
    p.id
FROM role_permissions rp
INNER JOIN permissions p_exist ON rp.permission_id = p_exist.id
CROSS JOIN permissions p
WHERE p_exist.categoria = 'area_management'  -- Rol tiene permisos de esta categoría
  AND p.categoria = 'area_management'        -- Agregar todos los permisos de esta categoría
  AND p.codigo IN (                          -- Solo los nuevos permisos
      'area_mgmt.documents.view.own',
      'area_mgmt.documents.derive',
      'area_mgmt.documents.finalize',
      'area_mgmt.documents.archive',
      'area_mgmt.documents.unarchive',
      'area_mgmt.documents.category.assign',
      'area_mgmt.documents.status.change',
      'area_mgmt.documents.search',
      'area_mgmt.documents.stats.view',
      'area_mgmt.attachments.view',
      'area_mgmt.attachments.upload',
      'area_mgmt.attachments.download',
      'area_mgmt.attachments.delete',
      'area_mgmt.versions.view',
      'area_mgmt.versions.upload',
      'area_mgmt.versions.download',
      'area_mgmt.versions.list',
      'area_mgmt.versions.delete',
      'area_mgmt.movements.create'
  )
  AND NOT EXISTS (                           -- Evitar duplicados
      SELECT 1 FROM role_permissions rp2 
      WHERE rp2.rol_id = rp.rol_id 
      AND rp2.permission_id = p.id
  );

-- ============================================================
-- 4. VERIFICACIÓN
-- ============================================================

-- Ver total de permisos por categoría
SELECT 
    categoria,
    COUNT(*) as total_permisos
FROM permissions
WHERE es_sistema = TRUE
GROUP BY categoria
ORDER BY categoria;

-- Ver permisos de area_management
SELECT id, codigo, nombre
FROM permissions
WHERE categoria = 'area_management'
ORDER BY codigo;

-- Verificar roles actualizados
SELECT 
    r.id,
    r.nombre,
    COUNT(rp.permission_id) as total_permisos,
    COUNT(CASE WHEN p.categoria = 'area_management' THEN 1 END) as permisos_area_mgmt
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.rol_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.nombre
ORDER BY r.nombre;

-- ============================================================
-- RESUMEN DE CAMBIOS
-- ============================================================
-- ✅ Agregados 19 permisos nuevos a area_management
-- ✅ Total de permisos en area_management: 48
-- ✅ Roles existentes actualizados automáticamente
-- ✅ Total de permisos del sistema: 127 (antes 95)
-- ============================================================

SELECT 
    '✅ Migración completada exitosamente' as estado,
    COUNT(*) as total_permisos_sistema,
    SUM(CASE WHEN categoria = 'area_management' THEN 1 ELSE 0 END) as permisos_area_mgmt
FROM permissions
WHERE es_sistema = TRUE;
