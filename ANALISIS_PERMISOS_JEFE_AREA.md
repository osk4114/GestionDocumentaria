# 📋 ANÁLISIS COMPLETO: Permisos para Jefe de Área

## 🎯 Objetivo
Determinar TODOS los permisos necesarios para que un "Jefe de Área" tenga funcionalidad completa en el sistema.

---

## 📊 FUNCIONALIDADES DEL SISTEMA

### 1️⃣ Panel de Administración (23 permisos) ✅
**Categoría: `area_management`**

| Permiso | Descripción |
|---------|-------------|
| `area_mgmt.users.view` | Ver usuarios de su área |
| `area_mgmt.users.create` | Crear usuarios en su área |
| `area_mgmt.users.edit` | Editar usuarios de su área |
| `area_mgmt.users.manage` | Activar/desactivar usuarios |
| `area_mgmt.roles.view` | Ver roles |
| `area_mgmt.roles.create` | Crear roles personalizados |
| `area_mgmt.roles.edit` | Editar roles |
| `area_mgmt.document_types.view` | Ver tipos de documento |
| `area_mgmt.document_types.create` | Crear tipos de documento |
| `area_mgmt.document_types.edit` | Editar tipos de documento |
| `area_mgmt.categories.full` | Gestión completa de categorías |
| `area_mgmt.documents.view` | Ver documentos de su área |
| `area_mgmt.documents.create` | Crear documentos |
| `area_mgmt.documents.edit` | Editar documentos |
| `area_mgmt.documents.manage` | Derivar, finalizar, archivar |
| `area_mgmt.attachments.full` | Gestión de adjuntos |
| `area_mgmt.versions.full` | Gestión de versiones |
| `area_mgmt.movements.accept` | Aceptar documentos |
| `area_mgmt.movements.reject` | Rechazar documentos |
| `area_mgmt.movements.complete` | Completar documentos |
| `area_mgmt.movements.view` | Ver historial |
| `area_mgmt.reports.view` | Ver reportes de su área |
| `area_mgmt.reports.export` | Exportar reportes |

---

### 2️⃣ Bandeja de Entrada (16 permisos) ❌ FALTANTES
**Categoría: `documents`**

| Permiso | Descripción | Uso en Bandeja |
|---------|-------------|----------------|
| `documents.view.area` | Ver documentos de su área | **Ver listado de documentos** |
| `documents.view.own` | Ver documentos asignados | **Ver docs propios** |
| `documents.create` | Crear documentos | Botón "Nuevo Documento" |
| `documents.edit.area` | Editar docs de su área | Editar datos generales |
| `documents.derive` | Derivar documentos | **Botón "Derivar" (CRÍTICO)** |
| `documents.finalize` | Finalizar documentos | Marcar como atendido |
| `documents.archive` | Archivar documentos | **Botón "Archivar"** |
| `documents.unarchive` | Desarchivar documentos | Recuperar archivados |
| `documents.category.assign` | Asignar categorías | **Dropdown categoría** |
| `documents.status.change` | Cambiar estados | **Modal detalles - cambiar estado** |
| `documents.search` | Buscar documentos | Filtros avanzados |
| `documents.stats.view` | Ver estadísticas | Cards de stats |

**Permisos NO necesarios para Jefe de Área:**
- `documents.view.all` → Solo admin (ve todas las áreas)
- `documents.edit.all` → Solo admin (edita cualquier doc)
- `documents.tracking.public` → Público (no autenticado)
- `documents.submit.public` → Público (mesa de partes)

---

### 3️⃣ Modal de Detalles (Permisos compartidos)
**Usa permisos de otras categorías**

| Funcionalidad | Permiso Requerido |
|---------------|-------------------|
| Ver documento | `documents.view.area` o `documents.view.own` |
| Cambiar estado | `documents.status.change` |
| Ver historial | `movements.view` |
| Ver adjuntos | `attachments.view` |
| Descargar adjuntos | `attachments.download` |
| Ver versiones | `versions.view` |
| Descargar versiones | `versions.download` |
| Previsualizar PDF | `attachments.view` + `attachments.download` |

---

### 4️⃣ Adjuntos (4 permisos) ❌ FALTANTES
**Categoría: `attachments`**

| Permiso | Descripción | Uso |
|---------|-------------|-----|
| `attachments.view` | Ver adjuntos | **Listar archivos adjuntos** |
| `attachments.upload` | Subir adjuntos | Botón "Subir archivo" |
| `attachments.download` | Descargar adjuntos | **Botón "Descargar" (CRÍTICO)** |
| `attachments.delete` | Eliminar adjuntos | Botón "Eliminar archivo" |

---

### 5️⃣ Versiones (5 permisos) ❌ FALTANTES
**Categoría: `versions`**

| Permiso | Descripción | Uso |
|---------|-------------|-----|
| `versions.view` | Ver versiones | **Modal de versiones** |
| `versions.upload` | Subir versiones | Botón "Nueva versión" |
| `versions.download` | Descargar versiones | **Descargar PDF con sello/firma** |
| `versions.list` | Listar versiones | Tabla de versiones |
| `versions.delete` | Eliminar versiones | Botón "Eliminar versión" |

---

### 6️⃣ Movimientos (5 permisos) ❌ FALTANTES
**Categoría: `movements`**

| Permiso | Descripción | Uso |
|---------|-------------|-----|
| `movements.view` | Ver historial | **Tab "Historial" en detalles** |
| `movements.accept` | Aceptar documentos | Botón "Aceptar derivación" |
| `movements.reject` | Rechazar documentos | Botón "Rechazar" |
| `movements.complete` | Completar documentos | Botón "Completar" |
| `movements.create` | Crear movimientos manuales | Solo admin (no necesario) |

---

### 7️⃣ Archivados (Permisos compartidos)
**Usa permisos de `documents`**

| Funcionalidad | Permiso Requerido |
|---------------|-------------------|
| Ver archivados | `documents.view.area` |
| Desarchivar | `documents.unarchive` |
| Ver detalles | `documents.view.area` |

---

## 📈 RESUMEN: Permisos Totales para Jefe de Área

### ✅ Ya tiene (23 permisos)
- `area_management` (23) → Panel de administración de su área

### ❌ Le faltan (40 permisos)
- `documents` (12 de 16) → Bandeja, derivar, archivar, estados
- `attachments` (4) → Ver, subir, descargar, eliminar archivos
- `versions` (5) → Gestión de versiones con sello/firma
- `movements` (4 de 5) → Historial, aceptar, rechazar, completar

### 🎯 Total recomendado: 63 permisos
- `area_management` (23)
- `documents` (12)
- `attachments` (4)
- `versions` (5)
- `movements` (4)

---

## 🔧 SOLUCIÓN RECOMENDADA

### Opción 1: Selección Manual (ACTUAL)
Al crear rol "Jefe de Área", seleccionar:
1. ✅ **Jefe de Área** (23 permisos)
2. ✅ **Documentos** (16 permisos) - seleccionar solo los necesarios
3. ✅ **Adjuntos** (4 permisos)
4. ✅ **Versiones** (5 permisos)
5. ✅ **Movimientos** (5 permisos) - seleccionar solo los necesarios

### Opción 2: Perfil Preconfigurado (PROPUESTA)
Crear un perfil/plantilla "Jefe de Área Completo" con los 63 permisos ya seleccionados.

---

## ⚠️ PERMISOS QUE **NO** DEBE TENER

| Permiso | Razón |
|---------|-------|
| `users.view.all` | Solo ve usuarios de SU área |
| `users.edit.all` | Solo edita usuarios de SU área |
| `documents.view.all` | Solo ve docs de SU área |
| `documents.edit.all` | Solo edita docs de SU área |
| `areas.view.all` | No gestiona áreas globales |
| `areas.create` | No crea áreas nuevas |
| `areas.delete` | No elimina áreas |
| `system.*` | No tiene acceso a config del sistema |
| `movements.create` | No crea movimientos manuales |

---

## 📝 NOTAS IMPORTANTES

1. **`area_management` permisos son restrictivos por área** → Solo afectan SU área asignada
2. **`documents` permisos son necesarios para la bandeja** → Sin ellos no puede ver documentos
3. **`attachments` y `versions` son CRÍTICOS** → Sin ellos no puede descargar PDFs ni ver versiones
4. **`movements` es necesario para el historial** → Sin `movements.view` no ve la trazabilidad

---

**Autor:** Sistema de Gestión Documental v3.3  
**Fecha:** 2025-11-13
