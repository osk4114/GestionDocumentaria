# ⚠️ INFORMACIÓN IMPORTANTE - LEER PRIMERO

## 🎯 ESTADO ACTUAL DEL PROYECTO (Noviembre 2025)

### ✅ EL SISTEMA RBAC v3.0 **YA ESTÁ IMPLEMENTADO**

**NO necesitas ejecutar ninguna "migración" si:**
- ✅ Clonaste el proyecto recientemente
- ✅ El backend arranca sin errores
- ✅ Puedes hacer login con `admin@sgd.com`
- ✅ Ves tablas `permissions` y `role_permissions` en tu BD

---

## 📁 GUÍA DE ARCHIVOS

### Para Nueva Instalación (Primera vez):
```
1. Leer: README.md (documentación completa)
2. Ejecutar: config/init-database.sql (crear BD completa)
3. Verificar: config/verificar-migracion.sql (comprobar instalación)
4. Crear admin: node setup-test-user.js
5. Iniciar: npm start (backend) y cd sgd-frontend && npm start
```

### Si Ya Tienes el Proyecto Funcionando:
```
❌ NO leas "GUIA_MIGRACION.md" - es para casos especiales
✅ Continúa trabajando normalmente
✅ Usa PROGRESO_RBAC.md para ver qué falta implementar
```

### Para Actualizar Proyecto Viejo (Pre-noviembre 2025):
```
1. Leer: GUIA_MIGRACION.md > OPCIÓN 3
2. Backup de BD actual
3. Ejecutar: config/migrations/add-permissions-system.sql
4. Verificar: config/verificar-migracion.sql
```

---

## 📊 ARQUITECTURA ACTUAL (v3.0)

### Base de Datos: 16 Tablas
```
✅ roles                       (con campos RBAC: es_sistema, puede_asignar_permisos)
✅ permissions                 (77 permisos en 12 categorías)
✅ role_permissions            (117+ asignaciones)
✅ areas
✅ users
✅ user_sessions
✅ login_attempts
✅ senders
✅ document_types
✅ document_statuses
✅ area_document_categories
✅ documents
✅ document_movements
✅ attachments
✅ document_versions
✅ notifications
```

### Sistema RBAC Implementado
```
✅ 77 permisos activos
✅ 12 categorías de permisos
✅ Middleware de verificación (checkPermission, checkAnyPermission)
✅ 32 endpoints migrados con permisos (34% del total)
✅ Frontend con gestión de roles y permisos
✅ Login devuelve permisos automáticamente
```

### Progreso General
```
Backend:  85% ✅ (estructura completa, 32/93 endpoints migrados)
Frontend: 30% 🔄 (componentes públicos + dashboard básico)
Total:    57.5% del proyecto completado
```

---

## 🚀 INICIO RÁPIDO

### Primera Instalación:
```powershell
# 1. Instalar dependencias backend
npm install

# 2. Crear base de datos
# Ejecutar config/init-database.sql en phpMyAdmin

# 3. Crear usuario admin
node setup-test-user.js

# 4. Iniciar backend
npm start

# 5. Instalar y arrancar frontend (nueva terminal)
cd sgd-frontend
npm install
npm start
```

### Verificar Instalación:
```powershell
# Backend: http://localhost:3000/api/health
# Frontend: http://localhost:4200
# Login: admin@sgd.com / admin123
```

---

## 📚 DOCUMENTACIÓN PRINCIPAL

| Archivo | Propósito | Cuándo Leerlo |
|---------|-----------|---------------|
| `README.md` | Documentación completa del proyecto | Siempre primero |
| `PROGRESO_RBAC.md` | Estado de implementación RBAC | Ver qué falta |
| `RESUMEN_RBAC_IMPLEMENTACION.md` | Resumen ejecutivo RBAC | Entender el sistema |
| `MAPEO_ENDPOINTS_PERMISOS.md` | Guía técnica de endpoints | Al migrar endpoints |
| `GUIA_MIGRACION.md` | Instalación y migración | Solo si es necesario |
| `SESION_2025-11-05.md` | Últimas implementaciones | Ver cambios recientes |

---

## ⚠️ CONFUSIÓN COMÚN

### "¿Necesito migrar mi base de datos?"

**NO**, si:
- Clonaste el proyecto después de noviembre 2025
- Ya tienes el backend corriendo sin errores
- `SELECT COUNT(*) FROM permissions;` devuelve 77+

**SÍ**, solo si:
- Tienes una versión MUY ANTIGUA del proyecto (antes de noviembre)
- `SHOW TABLES LIKE 'permissions';` devuelve vacío
- El backend da error: "Table 'permissions' doesn't exist"

### "¿Qué archivo SQL ejecuto?"

```
Nueva instalación:     config/init-database.sql (727 líneas)
Actualizar BD vieja:   config/migrations/add-permissions-system.sql (407 líneas)
Verificar todo:        config/verificar-migracion.sql (344 líneas)
```

---

## 🎯 PRÓXIMOS PASOS (Si quieres contribuir)

1. **Completar migración de endpoints** (61 restantes)
   - Aplicar `checkPermission()` a rutas pendientes
   - Archivos: `areaRoutes.js`, `documentTypeRoutes.js`, etc.

2. **Completar frontend** (70% restante)
   - Módulo de administración completo
   - Directiva `*hasPermission`
   - Reportes con gráficas

3. **Testing completo**
   - Tests unitarios con Jasmine
   - Tests E2E con Playwright

Ver `PROGRESO_RBAC.md` para detalles completos.

---

## 📞 AYUDA

**Si tienes dudas:**
1. Revisa los archivos de documentación arriba
2. Ejecuta `config/verificar-migracion.sql` para ver el estado de tu BD
3. Verifica que puedes hacer login en http://localhost:4200
4. Comprueba que el endpoint GET `/api/permissions` devuelve 77 permisos

**El sistema está funcionando si:**
- ✅ Backend arranca sin errores (`npm start`)
- ✅ Frontend carga correctamente (http://localhost:4200)
- ✅ Login funciona (admin@sgd.com / admin123)
- ✅ GET `/api/permissions` devuelve 77 permisos
- ✅ GET `/api/roles/1/permissions` devuelve permisos del admin

---

**Fecha:** 6 de Noviembre 2025  
**Versión:** RBAC v3.0  
**Estado:** Sistema funcionando, listo para desarrollo continuo
