# 📄 Sistema de Gestión Documentaria (SGD)
## Dirección Regional de Transportes y Comunicaciones - Puno

![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)
![Node](https://img.shields.io/badge/Node.js-v18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)

Sistema integral para la gestión, seguimiento y trazabilidad de documentos administrativos en la DRTC Puno.

---

## 📑 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Estado Actual del Proyecto](#-estado-actual-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Problemas Conocidos](#-problemas-conocidos)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Descripción General

El Sistema de Gestión Documentaria (SGD) es una plataforma web desarrollada para modernizar y optimizar el flujo de documentos en la Dirección Regional de Transportes y Comunicaciones de Puno.

### Objetivos Principales:
- ✅ Digitalizar el proceso de recepción y seguimiento de documentos
- ✅ Implementar trazabilidad completa de documentos
- ✅ Reducir tiempos de atención
- ✅ Facilitar consultas y reportes
- ✅ Mejorar transparencia en la gestión pública

### Módulos del Sistema:
1. **Mesa de Partes Virtual** - Recepción de documentos ciudadanos
2. **Gestión de Trámites** - Seguimiento interno de documentos
3. **Bandeja de Entrada** - Documentos asignados por área/usuario
4. **Reportes y Estadísticas** - Dashboards y análisis
5. **Administración** - Gestión de usuarios, áreas, tipos de documento

---

## 📊 Estado Actual del Proyecto

### ✅ FASE 1: Backend Core - COMPLETADO (100%)
**Fecha:** 15-23 de Octubre, 2025

#### Implementado:
- ✅ Arquitectura REST API con Express.js
- ✅ Base de datos MySQL (12 tablas)
- ✅ Sistema de autenticación JWT avanzado
- ✅ Gestión de sesiones y refresh tokens
- ✅ Middleware de autorización por roles
- ✅ WebSocket para notificaciones en tiempo real
- ✅ Sistema de archivos adjuntos
- ✅ CRUD completo de entidades principales
- ✅ Validaciones y manejo de errores robusto

#### Endpoints Implementados: **50+**

**Autenticación (7):**
- `POST /api/auth/login` - Login con JWT
- `POST /api/auth/logout` - Logout y limpieza de sesión
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Datos del usuario actual
- `GET /api/auth/sessions` - Sesiones activas
- `DELETE /api/auth/sessions/:id` - Cerrar sesión específica
- `DELETE /api/auth/sessions/all` - Cerrar todas las sesiones

**Áreas (8):**
- `GET /api/areas` - Listar áreas
- `GET /api/areas/:id` - Obtener área
- `POST /api/areas` - Crear área
- `PUT /api/areas/:id` - Actualizar área
- `DELETE /api/areas/:id` - Eliminar área
- `PATCH /api/areas/:id/deactivate` - Desactivar área
- `PATCH /api/areas/:id/activate` - Activar área
- `GET /api/areas/:id/stats` - Estadísticas de área

**Roles (5):**
- `GET /api/roles` - Listar roles
- `GET /api/roles/:id` - Obtener rol
- `POST /api/roles` - Crear rol
- `PUT /api/roles/:id` - Actualizar rol
- `DELETE /api/roles/:id` - Eliminar rol

**Usuarios (6):**
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `PATCH /api/users/:id/deactivate` - Desactivar usuario
- `PATCH /api/users/:id/activate` - Activar usuario

**Tipos de Documento (6):**
- `GET /api/document-types` - Listar tipos
- `GET /api/document-types/:id` - Obtener tipo
- `POST /api/document-types` - Crear tipo
- `PUT /api/document-types/:id` - Actualizar tipo
- `PATCH /api/document-types/:id/deactivate` - Desactivar tipo
- `PATCH /api/document-types/:id/activate` - Activar tipo

**Documentos (10+):**
- `POST /api/documents/submit` - Presentar documento (público)
- `GET /api/documents/tracking/:code` - Buscar por código (público)
- `GET /api/documents` - Listar con filtros
- `GET /api/documents/:id` - Obtener documento completo
- `POST /api/documents` - Crear documento interno
- `PUT /api/documents/:id` - Actualizar documento
- `DELETE /api/documents/:id` - Archivar documento
- `POST /api/documents/:id/derive` - Derivar a otra área
- `POST /api/documents/:id/finalize` - Finalizar/Atender
- `GET /api/documents/stats` - Estadísticas generales
- `GET /api/documents/area/:id` - Documentos por área

---

### ✅ FASE 2: Filtros y Consultas Avanzadas - COMPLETADO (100%)
**Fecha:** 23 de Octubre, 2025

#### Implementado:
- ✅ Filtros avanzados en endpoint principal (`/api/documents`)
  - `archived` - Filtrar archivados
  - `dateFrom/dateTo` - Rango de fechas
  - `sender` - Por nombre de remitente
  - `type` - Por tipo de documento
  - `limit/offset` - Paginación
  - Búsqueda mejorada (código, asunto, descripción)

- ✅ **4 Nuevos Endpoints:**
  - `GET /api/documents/search` - Búsqueda avanzada con paginación
  - `GET /api/documents/by-status` - Documentos agrupados por estado
  - `GET /api/documents/area/:id/archived` - Documentos archivados por área
  - `GET /api/documents/:id/history` - Historial completo con timeline

#### Características Especiales:
- ✅ Timeline de movimientos con días de permanencia
- ✅ Estadísticas agregadas por documento
- ✅ Paginación automática en búsquedas
- ✅ Agrupación de documentos por estado con contadores

#### Testing:
- ✅ Scripts PowerShell para testing automatizado
- ✅ 10 documentos de prueba creados
- ✅ 5 remitentes de prueba
- ✅ Movimientos completos para flujos de prueba

---

## 🛠 Tecnologías

### Backend
- **Node.js** v18+
- **Express.js** 4.18 - Framework web
- **MySQL** 8.0 - Base de datos
- **Sequelize** 6.35 - ORM
- **JWT** (jsonwebtoken) - Autenticación
- **bcryptjs** - Hash de contraseñas
- **Socket.io** - WebSocket en tiempo real
- **multer** - Manejo de archivos
- **express-validator** - Validaciones
- **dotenv** - Variables de entorno
- **morgan** - Logging HTTP
- **cors** - CORS habilitado

### Frontend (IMPLEMENTADO - FASE 4)
- **Angular** 20.1 - Framework web
- **Tailwind CSS** v3 - Styling institucional
- **RxJS** 7.8 - Programación reactiva
- **Socket.IO Client** 4.8 - WebSocket en tiempo real
- **Signals** - Estado reactivo de Angular

### Herramientas de Desarrollo
- **nodemon** - Hot reload
- **PowerShell** - Scripts de testing
- **Git** - Control de versiones

---

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **MySQL** >= 8.0
- **npm** >= 9.0.0
- **Git**

---

## ⚙️ Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/osk4114/GestionDocumentaria.git
cd GestionDocumentaria
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgd_db
DB_USER=root
DB_PASSWORD=tu_password

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui
JWT_REFRESH_SECRET=otra_clave_secreta_para_refresh
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# URL Frontend (para CORS)
FRONTEND_URL=http://localhost:4200
```

### 4. Crear Base de Datos

Ejecutar el script SQL de inicialización:

```bash
# Opción 1: MySQL CLI
mysql -u root -p < config/init-database.sql

# Opción 2: phpMyAdmin
# Copiar y ejecutar el contenido de config/init-database.sql
```

Esto creará:
- ✅ Base de datos `sgd_db`
- ✅ 12 tablas con relaciones
- ✅ Datos iniciales (roles, áreas, estados, tipos)
- ✅ Índices optimizados

### 5. Crear Usuario Administrador

```bash
node setup-test-user.js
```

Credenciales por defecto:
- **Email:** admin@sgd.com
- **Password:** admin123

### 6. Iniciar el Servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

### 7. Verificar Instalación

```bash
# Health check
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "message": "SGD API funcionando correctamente",
  "timestamp": "2025-10-23T..."
}
```

---

## 📁 Estructura del Proyecto

```
GestionDocumentaria/
│
├── config/                      # Configuraciones
│   ├── database.js             # Config MySQL
│   ├── sequelize.js            # Config Sequelize ORM
│   └── init-database.sql       # Script SQL inicial
│
├── controllers/                 # Controladores (lógica de endpoints)
│   ├── authController.js       # Autenticación
│   ├── areaController.js       # Gestión de áreas
│   ├── roleController.js       # Gestión de roles
│   ├── userController.js       # Gestión de usuarios
│   ├── documentTypeController.js
│   └── documentController.js   # Gestión de documentos
│
├── middleware/                  # Middlewares
│   ├── authMiddleware.js       # Verificación JWT
│   ├── roleMiddleware.js       # Control de roles
│   ├── uploadMiddleware.js     # Manejo de archivos
│   └── errorHandler.js         # Manejo de errores
│
├── models/                      # Modelos Sequelize
│   ├── index.js                # Relaciones entre modelos
│   ├── User.js
│   ├── Role.js
│   ├── Area.js
│   ├── Document.js
│   ├── DocumentType.js
│   ├── DocumentStatus.js
│   ├── Sender.js
│   ├── DocumentMovement.js
│   ├── Attachment.js
│   ├── Notification.js
│   ├── UserSession.js
│   └── LoginAttempt.js
│
├── routes/                      # Rutas de la API
│   ├── index.js                # Enrutador principal
│   ├── authRoutes.js
│   ├── areaRoutes.js
│   ├── roleRoutes.js
│   ├── userRoutes.js
│   ├── documentTypeRoutes.js
│   └── documentRoutes.js
│
├── services/                    # Lógica de negocio
│   ├── documentService.js      # Servicios de documentos
│   ├── authService.js          # Servicios de autenticación
│   └── notificationService.js  # Servicios de notificaciones
│
├── utils/                       # Utilidades
│   ├── validators.js           # Validadores personalizados
│   └── helpers.js              # Funciones auxiliares
│
├── uploads/                     # Archivos subidos (git ignored)
│
├── tests/                       # Scripts de testing
│   ├── test-simple.ps1         # Test básico endpoints
│   ├── test-fase2.ps1          # Test filtros avanzados
│   └── seed-test-data.js       # Crear datos de prueba
│
├── docs/                        # Documentación
│   ├── ADMIN_CRUDS.md          # Guía CRUDs administrativos
│   ├── TESTING_ADMIN_CRUDS.md  # Guía de testing
│   └── FASE2_FILTROS_CONSULTAS.md
│
├── .env.example                 # Ejemplo variables de entorno
├── .gitignore
├── package.json
├── server.js                    # Punto de entrada
├── setup-test-user.js          # Script crear usuario admin
└── README.md
```

---

## 🚀 Funcionalidades Implementadas

### Autenticación y Seguridad
- ✅ Login con JWT (access + refresh tokens)
- ✅ Gestión de sesiones múltiples
- ✅ Protección contra fuerza bruta
- ✅ Logout y cierre de sesiones
- ✅ Middleware de autorización por roles
- ✅ Hash seguro de contraseñas (bcrypt)

### Gestión Administrativa
- ✅ CRUD completo de Áreas
- ✅ CRUD completo de Roles
- ✅ CRUD completo de Usuarios
- ✅ CRUD completo de Tipos de Documento
- ✅ Activar/Desactivar entidades
- ✅ Estadísticas por área

### Gestión de Documentos
- ✅ Presentación de documentos (Mesa de Partes Virtual)
- ✅ Consulta pública por código de seguimiento
- ✅ Registro de remitentes automático
- ✅ Derivación de documentos entre áreas
- ✅ Asignación a usuarios específicos
- ✅ Cambio de estados
- ✅ Archivos adjuntos
- ✅ Historial completo de movimientos
- ✅ Notificaciones en tiempo real (WebSocket)

### Consultas y Reportes
- ✅ Filtros avanzados (10+ criterios)
- ✅ Búsqueda con paginación
- ✅ Documentos agrupados por estado
- ✅ Documentos archivados por área
- ✅ Timeline de movimientos
- ✅ Estadísticas de documentos
- ✅ Reportes por área

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api`

### Autenticación
```http
POST   /auth/login              # Login
POST   /auth/logout             # Logout
POST   /auth/refresh            # Renovar token
GET    /auth/me                 # Usuario actual
GET    /auth/sessions           # Sesiones activas
DELETE /auth/sessions/:id       # Cerrar sesión específica
```

### Áreas
```http
GET    /areas                   # Listar áreas
GET    /areas/:id               # Obtener área
POST   /areas                   # Crear área (Admin)
PUT    /areas/:id               # Actualizar área (Admin)
DELETE /areas/:id               # Eliminar área (Admin)
PATCH  /areas/:id/deactivate    # Desactivar (Admin)
PATCH  /areas/:id/activate      # Activar (Admin)
GET    /areas/:id/stats         # Estadísticas
```

### Roles
```http
GET    /roles                   # Listar roles
GET    /roles/:id               # Obtener rol
POST   /roles                   # Crear rol (Admin)
PUT    /roles/:id               # Actualizar rol (Admin)
DELETE /roles/:id               # Eliminar rol (Admin)
```

### Usuarios
```http
GET    /users                   # Listar usuarios (Admin)
GET    /users/:id               # Obtener usuario (Admin)
POST   /users                   # Crear usuario (Admin)
PUT    /users/:id               # Actualizar usuario (Admin)
PATCH  /users/:id/deactivate    # Desactivar (Admin)
PATCH  /users/:id/activate      # Activar (Admin)
```

### Tipos de Documento
```http
GET    /document-types          # Listar tipos
GET    /document-types/:id      # Obtener tipo
POST   /document-types          # Crear tipo (Admin)
PUT    /document-types/:id      # Actualizar tipo (Admin)
PATCH  /document-types/:id/deactivate
PATCH  /document-types/:id/activate
```

### Documentos
```http
# Públicos
POST   /documents/submit        # Presentar documento
GET    /documents/tracking/:code # Buscar por código

# Autenticados
GET    /documents               # Listar con filtros
GET    /documents/:id           # Obtener documento
POST   /documents               # Crear documento
PUT    /documents/:id           # Actualizar
DELETE /documents/:id           # Archivar
POST   /documents/:id/derive    # Derivar
POST   /documents/:id/finalize  # Finalizar
GET    /documents/stats         # Estadísticas
GET    /documents/area/:id      # Por área

# Consultas Avanzadas (FASE 2)
GET    /documents/search        # Búsqueda avanzada
GET    /documents/by-status     # Agrupados por estado
GET    /documents/area/:id/archived  # Archivados
GET    /documents/:id/history   # Historial completo
```

### Parámetros de Query Disponibles

**GET /documents:**
```
?status=1               # Por estado
&area=2                 # Por área
&priority=alta          # Por prioridad
&type=3                 # Por tipo
&archived=false         # Excluir archivados
&dateFrom=2024-01-01    # Desde fecha
&dateTo=2024-12-31      # Hasta fecha
&sender=Juan            # Por remitente
&search=licencia        # Búsqueda general
&limit=20               # Limitar resultados
&offset=0               # Offset paginación
```

**GET /documents/search:**
```
?trackingCode=SGD       # Por código
&asunto=solicitud       # Por asunto
&remitente=Garcia       # Por remitente
&area=2                 # Por área
&status=1               # Por estado
&priority=alta          # Por prioridad
&type=1                 # Por tipo
&dateFrom=2024-01-01    # Desde fecha
&dateTo=2024-12-31      # Hasta fecha
&page=1                 # Página
&pageSize=20            # Tamaño página
```

---

## 🧪 Testing

### Scripts de Testing Incluidos

#### 1. Test Básico de CRUDs
```powershell
.\test-simple.ps1
```
Prueba:
- Login
- CRUD de Áreas
- CRUD de Roles
- CRUD de Tipos de Documento
- CRUD de Usuarios

#### 2. Test de Filtros Avanzados (FASE 2)
```powershell
.\test-fase2.ps1
```
Prueba:
- Filtros avanzados
- Búsqueda con paginación
- Documentos por estado
- Documentos archivados
- Historial completo
- Rango de fechas

#### 3. Crear Datos de Prueba
```powershell
node seed-test-data.js
```
Crea:
- 5 remitentes
- 10 documentos con diferentes estados
- 10 movimientos de documentos

### Testing Manual con cURL/PowerShell

**Login:**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body '{"email":"admin@sgd.com","password":"admin123"}' -ContentType "application/json"
$token = $response.data.token
```

**Obtener Documentos:**
```powershell
$headers = @{"Authorization" = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:3000/api/documents" -Headers $headers
```

---

### ✅ FASE 3: Arquitectura de Servicios - COMPLETADO (100%)
**Fecha:** Octubre 2025

#### Implementado:
- ✅ Arquitectura de servicios (Service Layer)
- ✅ DocumentService con lógica de negocio centralizada
- ✅ EmailService con templates HTML profesionales
- ✅ SessionCleanupService automático
- ✅ Controllers refactorizados a "delgados" (reducción 33-67%)
- ✅ Transacciones con rollback automático
- ✅ Sistema de notificaciones dual (WebSocket + Email)
- ✅ Código duplicado eliminado completamente

#### Archivos Creados:
- `services/documentService.js` (1000+ líneas)
- `services/emailService.js` (400 líneas)
- `services/sessionCleanupService.js`

---

### ✅ FASE 4: Frontend Angular - COMPLETADO (85%)
**Fecha:** Octubre 2025

#### Componentes Implementados:
- ✅ **Landing Page** - Diseño institucional gob.pe
- ✅ **Mesa de Partes Virtual** - Formulario público 2 pasos
- ✅ **Seguimiento de Documentos** - Búsqueda pública por código
- ✅ **Login y Autenticación** - JWT con refresh tokens
- ✅ **Dashboard Administrativo** - Estadísticas y gestión
- ✅ **Gestión de Sesiones** - Ver y cerrar sesiones activas
- ✅ **Integración completa** con backend REST API
- ✅ **Diseño responsive** con Tailwind CSS v3

#### Tecnologías Frontend:
- Angular 20.1 (Standalone components)
- TypeScript 5.8
- Tailwind CSS v3
- RxJS 7.8
- Signals (Estado reactivo)
- Socket.IO Client 4.8

#### Pendiente:
- ⚠️ Módulo de administración completo (CRUDs)
- ⚠️ Módulo de derivación avanzado
- ⚠️ Reportes y gráficas
- ⚠️ Notificaciones tiempo real completas

---

## ⚠️ Problemas Conocidos

### 🐛 Bugs Resueltos

#### ~~1. Error 500 en Búsqueda Avanzada~~
**Endpoint:** `GET /api/documents/search`
**Estado:** ✅ RESUELTO (23/Oct/2025)
**Descripción:** El endpoint generaba error SQL con parámetros de paginación.
**Causa:** Los parámetros `page` y `pageSize` se recibían como strings en lugar de números.
**Solución Implementada:**
```javascript
// En documentService.js - advancedSearch()
const pageNum = parseInt(page) || 1;
const pageSizeNum = parseInt(pageSize) || 20;
```
**Resultado:** ✅ Todos los tests de FASE 2 pasan al 100%

---

### 🐛 Bugs Activos

#### 1. Datos de Prueba con Fechas en el Pasado
**Script:** `seed-test-data.js`
**Estado:** 🟢 Cosmético
**Descripción:** Los documentos de prueba se crean con fechas de 2024, pero estamos en 2025.
**Impacto:** Los filtros por rango de fechas devuelven 0 resultados.

**Solución:**
```javascript
// En seed-test-data.js
// Cambiar todas las fechas de 2024 a 2025
fechaRecepcion: new Date('2025-10-01')  // ← Actualizar año
```

**Prioridad:** Baja
**Estimado:** 5 minutos

---

### 📝 Mejoras Pendientes

1. **Validaciones de Frontend**
   - Agregar validaciones más específicas para campos
   - Mensajes de error más descriptivos

2. **Performance**
   - Implementar cache Redis para consultas frecuentes
   - Optimizar queries con eager loading

3. **Documentación**
   - Agregar ejemplos de uso en Postman
   - Documentar códigos de error
   - Crear diagramas de flujo

4. **Testing**
   - Implementar tests unitarios con Jest
   - Tests de integración automatizados
   - Coverage mínimo 80%

---

## 🗺️ Roadmap

### ✅ FASE 1: Backend Core (COMPLETADA)
- Arquitectura base
- Autenticación y autorización
- CRUDs administrativos
- Gestión básica de documentos

### ✅ FASE 2: Filtros y Consultas Avanzadas (COMPLETADA 100%)
- Filtros múltiples
- Búsqueda avanzada con paginación
- Historial de documentos
- Consultas especializadas
- ✅ Bug de búsqueda corregido

### ✅ FASE 3: Arquitectura de Servicios (COMPLETADA 100%)
- Service Layer implementado
- Controllers refactorizados
- Sistema de notificaciones
- Transacciones y rollback

### ✅ FASE 4: Frontend Angular (COMPLETADA 85%)
**Fecha:** Octubre 2025

#### Componentes Completados:
- ✅ Landing Page institucional
- ✅ Mesa de Partes Virtual
- ✅ Seguimiento público
- ✅ Login y autenticación
- ✅ Dashboard básico
- ✅ Gestión de sesiones

#### Pendiente:
- ⚠️ Módulo de administración completo
  - CRUD de usuarios
  - CRUD de áreas
  - CRUD de roles
  - CRUD de tipos de documento
- ⚠️ Módulo de derivación avanzado
- ⚠️ Bandeja de entrada por usuario
- ⚠️ Reportes con gráficas
- ⚠️ Exportación PDF/Excel

### 🔄 FASE 5: Frontend Avanzado (EN PROGRESO)
**Estimado:** 2-3 semanas

- Completar módulo de administración
- Módulo de derivación completo
- Notificaciones en tiempo real
- Reportes y dashboards
- Exportación de datos

### 📅 FASE 6: Optimización y Despliegue (FUTURO)
**Estimado:** 2 semanas

- Optimización de performance
- Implementación de cache
- Tests automatizados completos
- Documentación API completa
- Configuración CI/CD
- Despliegue en producción
- Capacitación usuarios

### 🚀 FASE 7: Funcionalidades Avanzadas (FUTURO)
**Estimado:** 4-6 semanas

- Firma digital de documentos
- Generación automática de oficios
- Integración con RENIEC
- App móvil (React Native)
- Inteligencia artificial para clasificación
- Reconocimiento OCR de documentos escaneados
- Auditoría completa de acciones

---

## 🤝 Contribución

### Guía de Contribución

1. **Fork** el repositorio
2. Crear una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un **Pull Request**

### Convenciones de Código

- **ESLint** para linting
- **Prettier** para formato
- Nombres de variables en **camelCase**
- Nombres de archivos en **camelCase**
- Comentarios en español
- Commits descriptivos en español

### Commits Semánticos

```
Add: Nueva funcionalidad
Fix: Corrección de bug
Update: Actualización de funcionalidad
Remove: Eliminación de código
Docs: Cambios en documentación
Style: Cambios de formato
Refactor: Refactorización de código
Test: Agregar o modificar tests
```

---

## 📄 Licencia

Este proyecto es **privado** y está siendo desarrollado para la Dirección Regional de Transportes y Comunicaciones de Puno.

**© 2025 DRTC Puno. Todos los derechos reservados.**

---

## 👥 Equipo de Desarrollo

- **Desarrollador Principal:** [Tu Nombre]
- **Cliente:** DRTC Puno
- **Soporte:** AI Assistant (Cascade)

---

## 📞 Contacto

Para consultas sobre el proyecto:
- **Email:** [tu-email]
- **GitHub:** [@osk4114](https://github.com/osk4114)
- **Repositorio:** [GestionDocumentaria](https://github.com/osk4114/GestionDocumentaria)

---

## 🙏 Agradecimientos

- Dirección Regional de Transportes y Comunicaciones de Puno
- Equipo de desarrollo
- Usuarios beta testers

---

**Última Actualización:** 23 de Octubre, 2025  
**Versión:** 0.4.0-beta  
**Estado:** Frontend en Desarrollo - Backend Completo ✅
