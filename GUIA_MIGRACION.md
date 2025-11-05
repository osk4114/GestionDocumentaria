# 🚀 GUÍA DE MIGRACIÓN - Sistema RBAC v3.0

## 📋 PRE-REQUISITOS

Antes de comenzar, asegúrate de tener:
- ✅ Acceso a phpMyAdmin o MySQL CLI
- ✅ Permisos de administrador de base de datos
- ✅ Backup actual de la base de datos
- ✅ Sistema en modo mantenimiento (backend y frontend detenidos)

---

## 🔄 OPCIÓN 1: INSTALACIÓN LIMPIA (Nueva Base de Datos)

### Paso 1: Preparación
```bash
# Detener el backend
# En la terminal node:
# Ctrl+C

# Detener el frontend
# En la terminal esbuild:
# Ctrl+C
```

### Paso 2: Ejecutar Script
1. Abrir **phpMyAdmin** en el navegador
2. Ir a la pestaña **SQL**
3. Abrir el archivo `config/init-database.sql`
4. **Copiar TODO el contenido** del archivo
5. **Pegar** en el editor SQL de phpMyAdmin
6. Click en **Ejecutar** (botón "Go" o "Continuar")

### Paso 3: Verificación Inmediata
En phpMyAdmin, ejecutar:
```sql
USE sgd_db;
SHOW TABLES;
```

**Resultado esperado:** 16 tablas

```
areas
area_document_categories
attachments
documents
document_movements
document_statuses
document_types
document_versions
login_attempts
notifications
permissions          ← NUEVA
roles
role_permissions     ← NUEVA
senders
users
user_sessions
```

### Paso 4: Verificación Completa
1. En phpMyAdmin, ir a pestaña **SQL**
2. Abrir el archivo `config/verificar-migracion.sql`
3. Copiar y pegar el contenido completo
4. Ejecutar

**Revisar resultados:**
- ✅ Permisos: 85+
- ✅ Roles: 2
- ✅ Admin con 85+ permisos
- ✅ Jefe con ~45 permisos

### Paso 5: Iniciar Sistema
```bash
# Terminal 1 - Backend
cd GestionDocumentaria
npm start

# Terminal 2 - Frontend
cd sgd-frontend
npm start
```

### Paso 6: Probar Login
- URL: http://localhost:4200
- Email: `admin@sgd.com`
- Password: `admin123`

**Si login funciona:** ✅ Migración exitosa

---

## 🔄 OPCIÓN 2: MIGRACIÓN DE BASE EXISTENTE (Producción)

### Paso 1: BACKUP OBLIGATORIO
```bash
# Opción 1: Desde phpMyAdmin
# 1. Seleccionar base de datos sgd_db
# 2. Click en "Exportar"
# 3. Formato: SQL
# 4. Guardar archivo: sgd_db_backup_2025-11-05.sql

# Opción 2: Desde terminal (MySQL CLI)
mysqldump -u root -p sgd_db > sgd_db_backup_2025-11-05.sql
```

### Paso 2: Detener Sistema
```bash
# Detener backend
# Ctrl+C en terminal node

# Detener frontend  
# Ctrl+C en terminal esbuild
```

### Paso 3: Ejecutar Migración
1. Abrir **phpMyAdmin**
2. Seleccionar base de datos **sgd_db**
3. Ir a pestaña **SQL**
4. Abrir archivo `config/migrations/add-permissions-system.sql`
5. Copiar TODO el contenido
6. Pegar y ejecutar

### Paso 4: Verificar Errores
**Si hay errores:**
- ❌ NO continuar
- 🔙 Restaurar backup inmediatamente
- 📝 Guardar el mensaje de error
- 💬 Solicitar ayuda

**Si NO hay errores:**
- ✅ Continuar con Paso 5

### Paso 5: Verificar Datos
Ejecutar en SQL:
```sql
-- Verificar que roles antiguos siguen existiendo
SELECT * FROM roles;

-- Verificar que usuarios mantienen sus roles
SELECT u.nombre, r.nombre AS rol 
FROM users u 
INNER JOIN roles r ON u.rol_id = r.id;

-- Verificar permisos creados
SELECT COUNT(*) FROM permissions;
-- Debe retornar 85+

-- Verificar asignaciones
SELECT r.nombre, COUNT(*) AS permisos
FROM role_permissions rp
INNER JOIN roles r ON rp.rol_id = r.id
GROUP BY r.nombre;
```

### Paso 6: Actualizar Backend
```bash
# Verificar que los modelos están actualizados
ls models/Permission.js
ls models/RolePermission.js

# Si existen, reiniciar backend
npm start
```

### Paso 7: Verificar Endpoints
Probar en Postman o navegador:
```bash
# 1. Login
POST http://localhost:3000/api/auth/login
{
  "email": "admin@sgd.com",
  "password": "admin123"
}

# Guardar el accessToken de la respuesta

# 2. Listar permisos
GET http://localhost:3000/api/permissions
Authorization: Bearer {accessToken}

# Debe retornar 85+ permisos

# 3. Permisos del admin
GET http://localhost:3000/api/roles/1/permissions
Authorization: Bearer {accessToken}

# Debe retornar 85+ permisos
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Cannot add foreign key constraint"
**Causa:** Orden incorrecto de tablas
**Solución:** Asegúrate de usar el archivo `init-database.sql` actualizado (v3.0)

### Error: "Table 'permissions' already exists"
**Causa:** Migración ya fue ejecutada
**Solución:** Verificar si los datos están correctos:
```sql
SELECT COUNT(*) FROM permissions;
```
Si retorna 0, ejecutar solo los INSERTs de permisos.

### Error: "Duplicate entry '1' for key 'PRIMARY'"
**Causa:** La base de datos ya tiene datos con esos IDs
**Solución:** En migración, los INSERTs usan `ON DUPLICATE KEY UPDATE`, debería funcionar.

### Backend no arranca - Error en modelos
**Error:**
```
SequelizeDatabaseError: Table 'sgd_db.role_permissions' doesn't exist
```
**Solución:**
1. Verificar que la migración se ejecutó correctamente
2. Ejecutar `SHOW TABLES;` en MySQL
3. Si falta la tabla, ejecutar la migración nuevamente

### Login no incluye permisos
**Problema:** El usuario loguea pero no tiene permisos
**Causa:** authController no actualizado
**Solución:** 
```javascript
// Verificar que authController.js incluye permisos en la respuesta
// (Esta actualización viene en la siguiente fase)
```

---

## 🧪 PLAN DE PRUEBAS POST-MIGRACIÓN

### 1. Pruebas de Base de Datos ✅
```sql
-- Ejecutar config/verificar-migracion.sql
-- Revisar que todos los conteos coincidan
```

### 2. Pruebas de Backend ✅
```bash
# Arrancar backend
npm start

# Verificar logs:
✓ Modelos de Sequelize sincronizados con la base de datos
✓ Servidor corriendo en puerto 3000
```

### 3. Pruebas de API ✅
```bash
# En Postman o navegador:

# GET /api/health
# Debe retornar: { status: "OK" }

# POST /api/auth/login
# Debe retornar accessToken

# GET /api/permissions
# Debe retornar array de 85+ permisos

# GET /api/roles
# Debe retornar 2 roles (Admin, Jefe)

# GET /api/roles/1/permissions
# Debe retornar 85+ permisos del Admin
```

### 4. Pruebas de Frontend ✅
```bash
# Arrancar frontend
cd sgd-frontend
npm start

# Probar:
1. Login con admin@sgd.com
2. Verificar que carga el dashboard
3. Verificar que puede acceder a todas las opciones
4. Probar crear un documento
5. Probar derivar un documento
```

---

## 🔙 ROLLBACK (Si algo sale mal)

### En Nueva Instalación:
```sql
DROP DATABASE sgd_db;
-- Luego ejecutar el backup anterior
```

### En Migración de Producción:
```bash
# Opción 1: Desde phpMyAdmin
# 1. Seleccionar sgd_db
# 2. Click en "Importar"
# 3. Seleccionar archivo backup: sgd_db_backup_2025-11-05.sql
# 4. Click en "Continuar"

# Opción 2: Desde terminal
mysql -u root -p sgd_db < sgd_db_backup_2025-11-05.sql
```

---

## ✅ CHECKLIST DE MIGRACIÓN

### Antes de Migrar:
- [ ] Backup completo realizado y guardado
- [ ] Backend detenido (npm)
- [ ] Frontend detenido (Angular)
- [ ] Usuarios notificados del mantenimiento
- [ ] Archivo init-database.sql v3.0 verificado
- [ ] phpMyAdmin abierto y conectado

### Durante la Migración:
- [ ] Script ejecutado sin errores
- [ ] 16 tablas creadas/actualizadas
- [ ] 85+ permisos insertados
- [ ] Asignaciones de permisos correctas
- [ ] Usuario admin funcional

### Después de la Migración:
- [ ] Script verificar-migracion.sql ejecutado
- [ ] Todos los conteos correctos
- [ ] Backend arranca sin errores
- [ ] Login funcional
- [ ] API responde correctamente
- [ ] Frontend carga correctamente
- [ ] Documento funcional
- [ ] Backup post-migración realizado

---

## 📊 RESULTADOS ESPERADOS

### Base de Datos:
```
✅ 16 tablas
✅ 85+ permisos en 11 categorías
✅ 2 roles del sistema
✅ ~130 asignaciones de permisos
✅ 1 usuario admin operativo
✅ Todas las FK configuradas correctamente
```

### Backend:
```
✅ Servidor arranca sin errores
✅ Modelos Sequelize sincronizados
✅ Endpoints de permisos funcionando:
   - GET /api/permissions
   - GET /api/permissions/grouped
   - GET /api/roles/:id/permissions
   - POST /api/roles/:id/permissions
   - DELETE /api/roles/:id/permissions/:permId
```

### Frontend:
```
✅ Login funcional
✅ Dashboard carga
✅ Todas las vistas accesibles
✅ Sin errores en consola
```

---

## 📝 NOTAS IMPORTANTES

1. **Tiempo estimado**: 10-15 minutos (completo)
2. **Downtime**: ~5 minutos (solo ejecución SQL)
3. **Riesgo**: Bajo (con backup)
4. **Reversible**: Sí (con backup)

5. **Nueva Base de Datos:**
   - Más rápido y limpio
   - Recomendado para testing
   - Se pierden datos actuales

6. **Migración de Existente:**
   - Mantiene datos actuales
   - Requiere más cuidado
   - Recomendado para producción

---

## 🆘 SOPORTE

Si encuentras problemas durante la migración:

1. **NO** entrar en pánico
2. **NO** ejecutar comandos adicionales sin verificar
3. **SÍ** guardar mensajes de error
4. **SÍ** verificar logs del backend
5. **SÍ** tener a mano el backup

---

**Última actualización:** 5 de Noviembre 2025  
**Versión:** 3.0  
**Archivos involucrados:**
- `config/init-database.sql` (nueva instalación)
- `config/migrations/add-permissions-system.sql` (migración)
- `config/verificar-migracion.sql` (verificación)
