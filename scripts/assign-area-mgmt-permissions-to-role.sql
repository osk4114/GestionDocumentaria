-- ============================================================
-- Script: Asignar permisos area_management al rol "Encargado de Área"
-- Ejecutar: En phpMyAdmin o MySQL CLI
-- Fecha: 13 de Noviembre 2025
-- Descripción: Asigna los 23 permisos de area_management al rol
-- ============================================================

USE sgd_db;

-- Paso 1: Verificar que existe el rol "Encargado de Área"
SELECT 
    id,
    nombre,
    descripcion
FROM roles
WHERE nombre = 'Encargado de Área';

-- Paso 2: Insertar los 23 permisos al rol (ON DUPLICATE KEY previene errores)
-- Asumiendo que el rol "Encargado de Área" tiene id = 3 (ajusta si es necesario)

INSERT INTO role_permissions (rol_id, permission_id, asignado_por, asignado_en)
SELECT 
    (SELECT id FROM roles WHERE nombre = 'Encargado de Área' LIMIT 1) as rol_id,
    p.id as permission_id,
    1 as asignado_por, -- Usuario Admin que asigna
    NOW() as asignado_en
FROM permissions p
WHERE p.categoria = 'area_management'
ON DUPLICATE KEY UPDATE 
    asignado_por = VALUES(asignado_por),
    asignado_en = VALUES(asignado_en);

-- Paso 3: Verificar permisos asignados
SELECT 
    r.nombre as rol,
    COUNT(rp.id) as total_permisos_asignados
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.rol_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.nombre = 'Encargado de Área' AND p.categoria = 'area_management'
GROUP BY r.id, r.nombre;

-- Paso 4: Listar todos los permisos asignados al rol
SELECT 
    r.nombre as rol,
    p.codigo,
    p.nombre as permiso_nombre,
    p.descripcion
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.rol_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE r.nombre = 'Encargado de Área' 
  AND p.categoria = 'area_management'
ORDER BY p.codigo;

-- Paso 5: Verificar usuario Edgar Burneo
SELECT 
    u.id,
    u.nombre,
    u.email,
    r.nombre as rol,
    a.nombre as area,
    u.is_active as activo
FROM users u
LEFT JOIN roles r ON u.rol_id = r.id
LEFT JOIN areas a ON u.area_id = a.id
WHERE u.email = 'burn@gmail.com';

-- ============================================================
-- RESULTADO ESPERADO
-- ============================================================
-- Paso 2: 23 rows affected (primera vez) o 0 rows (si ya existen)
-- Paso 3: total_permisos_asignados = 23
-- Paso 4: Lista de 23 permisos area_management
-- Paso 5: Edgar Burneo | burn@gmail.com | Encargado de Área | SDT | activo=0 o 1
-- ============================================================
