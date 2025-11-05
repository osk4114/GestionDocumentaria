-- ============================================================
-- SCRIPT DE VERIFICACIÓN POST-MIGRACIÓN
-- Sistema de Gestión Documentaria v3.0
-- 
-- Ejecutar este script DESPUÉS de aplicar init-database.sql
-- para verificar que todo se creó correctamente
-- ============================================================

-- Usar la base de datos
USE sgd_db;

-- ============================================================
-- 1. VERIFICAR CREACIÓN DE TABLAS
-- ============================================================

SELECT 
    'VERIFICACIÓN DE TABLAS' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' tablas creadas') AS resultado
FROM information_schema.tables 
WHERE table_schema = 'sgd_db';

-- Detalle de tablas
SELECT 
    table_name AS tabla,
    table_rows AS filas_aprox,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS tamaño_mb
FROM information_schema.tables
WHERE table_schema = 'sgd_db'
ORDER BY table_name;

-- ============================================================
-- 2. VERIFICAR PERMISOS
-- ============================================================

SELECT 
    '📋 PERMISOS' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' permisos creados') AS resultado
FROM permissions;

-- Permisos por categoría
SELECT 
    categoria,
    COUNT(*) AS total_permisos
FROM permissions
GROUP BY categoria
ORDER BY categoria;

-- ============================================================
-- 3. VERIFICAR ROLES
-- ============================================================

SELECT 
    '👥 ROLES' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' roles creados') AS resultado
FROM roles;

-- Detalle de roles
SELECT 
    id,
    nombre,
    es_sistema,
    puede_asignar_permisos,
    is_active,
    (SELECT COUNT(*) FROM role_permissions WHERE rol_id = roles.id) AS permisos_asignados
FROM roles;

-- ============================================================
-- 4. VERIFICAR ASIGNACIONES DE PERMISOS
-- ============================================================

-- Administrador debe tener TODOS los permisos
SELECT 
    '🔑 PERMISOS ADMINISTRADOR' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' permisos asignados') AS resultado
FROM role_permissions
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador');

-- Jefe de Área debe tener ~45 permisos
SELECT 
    '🔑 PERMISOS JEFE DE ÁREA' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' permisos asignados') AS resultado
FROM role_permissions
WHERE rol_id = (SELECT id FROM roles WHERE nombre = 'Jefe de Área');

-- Detalle de permisos por rol
SELECT 
    r.nombre AS rol,
    p.categoria,
    COUNT(*) AS cantidad_permisos
FROM role_permissions rp
INNER JOIN roles r ON rp.rol_id = r.id
INNER JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.nombre, p.categoria
ORDER BY r.nombre, p.categoria;

-- ============================================================
-- 5. VERIFICAR USUARIO ADMINISTRADOR
-- ============================================================

SELECT 
    '👤 USUARIO ADMIN' AS verificacion,
    CASE 
        WHEN COUNT(*) = 1 THEN CONCAT('✅ Usuario admin existe')
        ELSE '❌ Usuario admin NO existe'
    END AS resultado
FROM users
WHERE email = 'admin@sgd.com';

-- Detalle del usuario admin
SELECT 
    u.id,
    u.nombre,
    u.email,
    r.nombre AS rol,
    r.puede_asignar_permisos AS puede_gestionar_permisos,
    a.nombre AS area,
    u.is_active
FROM users u
INNER JOIN roles r ON u.rol_id = r.id
LEFT JOIN areas a ON u.area_id = a.id
WHERE u.email = 'admin@sgd.com';

-- ============================================================
-- 6. VERIFICAR ÁREAS
-- ============================================================

SELECT 
    '🏢 ÁREAS' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' áreas creadas') AS resultado
FROM areas;

-- ============================================================
-- 7. VERIFICAR TIPOS DE DOCUMENTO
-- ============================================================

SELECT 
    '📄 TIPOS DE DOCUMENTO' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' tipos creados') AS resultado
FROM document_types;

-- ============================================================
-- 8. VERIFICAR ESTADOS DE DOCUMENTO
-- ============================================================

SELECT 
    '📊 ESTADOS DE DOCUMENTO' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' estados creados') AS resultado
FROM document_statuses;

-- ============================================================
-- 9. VERIFICAR CATEGORÍAS DE ÁREA
-- ============================================================

SELECT 
    '🏷️ CATEGORÍAS DE ÁREA' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' categorías creadas') AS resultado
FROM area_document_categories;

-- ============================================================
-- 10. VERIFICAR FOREIGN KEYS
-- ============================================================

SELECT 
    'FOREIGN KEYS' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' FK configuradas') AS resultado
FROM information_schema.KEY_COLUMN_USAGE
WHERE table_schema = 'sgd_db'
AND referenced_table_name IS NOT NULL;

-- Detalle de FKs
SELECT 
    table_name AS tabla,
    column_name AS columna,
    referenced_table_name AS tabla_referenciada,
    referenced_column_name AS columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE table_schema = 'sgd_db'
AND referenced_table_name IS NOT NULL
ORDER BY table_name, column_name;

-- ============================================================
-- 11. VERIFICAR ÍNDICES
-- ============================================================

SELECT 
    'ÍNDICES' AS verificacion,
    CONCAT('✅ ', COUNT(*), ' índices creados') AS resultado
FROM information_schema.statistics
WHERE table_schema = 'sgd_db'
AND index_name != 'PRIMARY';

-- ============================================================
-- 12. RESUMEN FINAL
-- ============================================================

SELECT '=' AS separador, REPEAT('=', 60) AS linea;
SELECT '✅ RESUMEN DE VERIFICACIÓN' AS titulo;
SELECT '=' AS separador, REPEAT('=', 60) AS linea;

-- Tabla resumen
SELECT 'Tablas' AS item, COUNT(*) AS cantidad
FROM information_schema.tables WHERE table_schema = 'sgd_db'
UNION ALL
SELECT 'Permisos', COUNT(*) FROM permissions
UNION ALL
SELECT 'Roles', COUNT(*) FROM roles
UNION ALL
SELECT 'Asignaciones de permisos', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM users
UNION ALL
SELECT 'Áreas', COUNT(*) FROM areas
UNION ALL
SELECT 'Tipos de documento', COUNT(*) FROM document_types
UNION ALL
SELECT 'Estados de documento', COUNT(*) FROM document_statuses
UNION ALL
SELECT 'Categorías de área', COUNT(*) FROM area_document_categories
UNION ALL
SELECT 'Foreign Keys', COUNT(*) 
FROM information_schema.KEY_COLUMN_USAGE
WHERE table_schema = 'sgd_db' AND referenced_table_name IS NOT NULL
UNION ALL
SELECT 'Índices (no PRIMARY)', COUNT(*) 
FROM information_schema.statistics
WHERE table_schema = 'sgd_db' AND index_name != 'PRIMARY';

-- ============================================================
-- 13. PRUEBA DE LOGIN (Opcional)
-- ============================================================

-- Verificar que se puede obtener usuario con rol y permisos
SELECT 
    u.id,
    u.nombre,
    u.email,
    r.nombre AS rol,
    r.puede_asignar_permisos,
    COUNT(DISTINCT p.id) AS total_permisos
FROM users u
INNER JOIN roles r ON u.rol_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.rol_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'admin@sgd.com'
GROUP BY u.id, u.nombre, u.email, r.nombre, r.puede_asignar_permisos;

-- Listar todos los permisos del admin
SELECT 
    p.categoria,
    p.codigo,
    p.nombre
FROM users u
INNER JOIN roles r ON u.rol_id = r.id
INNER JOIN role_permissions rp ON r.id = rp.rol_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'admin@sgd.com'
ORDER BY p.categoria, p.codigo;

-- ============================================================
-- RESULTADOS ESPERADOS
-- ============================================================

/*
✅ VALORES ESPERADOS:

- Tablas: 16
- Permisos: 85+
- Roles: 2 (Administrador, Jefe de Área)
- Asignaciones Admin: 85+
- Asignaciones Jefe: ~45
- Usuarios: 1 (admin@sgd.com)
- Áreas: 1 (Recursos Humanos)
- Tipos de documento: 3
- Estados de documento: 5
- Categorías de área: 3
- Foreign Keys: ~30+
- Índices: ~40+

CATEGORÍAS DE PERMISOS:
- auth: 6
- users: 9
- roles: 5
- areas: 9
- categories: 6
- document_types: 5
- documents: 16
- attachments: 4
- versions: 5
- movements: 5
- reports: 4
- system: 3

*/

-- ============================================================
-- FIN DE LA VERIFICACIÓN
-- ============================================================
