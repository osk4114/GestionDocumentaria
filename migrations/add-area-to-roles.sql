-- ================================================================
-- MIGRACIÓN: Agregar areaId a roles
-- Fecha: 2025-11-13
-- Descripción: Permite que roles sean globales (areaId NULL) 
--              o específicos de un área (areaId NOT NULL)
-- ================================================================

-- 1. Agregar columna area_id a roles
ALTER TABLE roles
ADD COLUMN area_id INT NULL AFTER nombre,
ADD CONSTRAINT fk_roles_area 
  FOREIGN KEY (area_id) REFERENCES areas(id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

-- 2. Crear índice para mejorar performance en búsquedas por área
CREATE INDEX idx_roles_area_id ON roles(area_id);

-- 3. Comentar la columna
ALTER TABLE roles 
MODIFY COLUMN area_id INT NULL 
COMMENT 'ID del área a la que pertenece el rol (NULL = global, NOT NULL = específico de área)';

-- 4. Actualizar roles existentes según su naturaleza
-- Rol "Administrador" es GLOBAL (area_id = NULL)
UPDATE roles SET area_id = NULL WHERE nombre = 'Administrador';

-- Rol "Subdirección de Transportes" es específico del área SDT (id = 6)
UPDATE roles SET area_id = 6 WHERE nombre = 'Subdirección de Transportes';

-- Si existe rol "testing", necesitas asignarlo manualmente al área correspondiente
-- UPDATE roles SET area_id = [ID_DEL_AREA] WHERE nombre = 'testing';

-- ================================================================
-- VALIDACIÓN
-- ================================================================
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_KEY,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'gestion_documentaria'
  AND TABLE_NAME = 'roles'
  AND COLUMN_NAME = 'area_id';

-- Verificar roles actuales con sus áreas
SELECT 
  r.id, 
  r.nombre, 
  r.area_id,
  a.nombre as area_nombre,
  r.es_sistema,
  r.is_active
FROM roles r
LEFT JOIN areas a ON r.area_id = a.id
ORDER BY r.area_id, r.nombre;

-- ================================================================
-- NOTAS:
-- - Rol "Administrador" queda como GLOBAL (area_id = NULL)
-- - Cuando un Encargado de Área crea un rol, se asigna automáticamente su área
-- - Solo Administradores pueden crear roles globales (area_id = NULL)
-- - Cada área solo ve: roles globales + roles de su propia área
-- ================================================================
