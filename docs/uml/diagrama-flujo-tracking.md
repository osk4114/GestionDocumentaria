# 📍 Diagrama de Flujo - Sistema de Tracking y Seguimiento

## Sistema de Gestión Documentaria - Versión 3.2

> **Nota:** Este diagrama muestra cómo funciona el sistema de tracking desde la perspectiva del ciudadano que presenta un documento y necesita hacer seguimiento hasta que el trámite finaliza y es archivado.

---

## 🎯 Visión General del Sistema de Tracking

### ¿Qué es el Tracking?

El sistema de tracking permite al ciudadano/remitente:
- ✅ Conocer el estado actual de su documento
- ✅ Ver el historial completo de movimientos
- ✅ Saber quién tiene el documento actualmente
- ✅ Estimar cuánto tiempo falta para completar
- ✅ Recibir notificaciones automáticas de cambios

### Código de Tracking

Cada documento recibe un código único al momento de ingreso:

```
Formato: SGD-[AÑO]-[NÚMERO]
Ejemplo: SGD-2025-000245

Características:
• Único en todo el sistema
• Secuencial (se auto-incrementa)
• Permanente (no cambia nunca)
• Público (se comparte con el remitente)
```

---

## 🔄 FLUJO COMPLETO DEL TRACKING

### PARTE 1: INGRESO Y GENERACIÓN DEL TRACKING

```
┌─────────────────────────────────────────────────────────┐
│          🟢 INICIO - CIUDADANO PRESENTA DOCUMENTO       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  👤 CIUDADANO                                            │
│                                                          │
│  Accede a: https://sgd.gob.pe/submit                    │
│  Completa formulario:                                    │
│    • Datos personales (DNI, nombre, email, teléfono)    │
│    • Tipo de documento                                   │
│    • Asunto del trámite                                  │
│    • Área destino                                        │
│    • Archivo PDF adjunto                                 │
│                                                          │
│  Click en: "Enviar Documento"                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  🔄 BACKEND - POST /api/documents                        │
│                                                          │
│  Validaciones:                                           │
│    ✓ DNI válido (8 dígitos)                              │
│    ✓ Email formato correcto                              │
│    ✓ Archivo PDF < 10MB                                  │
│    ✓ Área destino existe                                 │
│    ✓ Todos los campos requeridos presentes              │
└─────────────────────────────────────────────────────────┘
                          ↓
                  ¿Validación exitosa?
                          ↓
                         SÍ
                          ↓
┌─────────────────────────────────────────────────────────┐
│  💾 BASE DE DATOS - Tabla: documents                     │
│                                                          │
│  1. GENERAR CÓDIGO DE TRACKING                           │
│     SQL Query:                                           │
│     SELECT MAX(id) FROM documents WHERE YEAR(created_at) = 2025│
│     → Último ID: 244                                     │
│     → Nuevo código: SGD-2025-000245                      │
│                                                          │
│  2. INSERTAR DOCUMENTO                                   │
│     INSERT INTO documents (                              │
│       codigo_seguimiento,  ← SGD-2025-000245            │
│       tipo_documento_id,                                 │
│       remitente_nombre,                                  │
│       remitente_dni,                                     │
│       remitente_email,     ← ejemplo@mail.com           │
│       asunto,                                            │
│       area_id,            ← ID del área destino          │
│       estado,             ← 'PENDIENTE'                  │
│       fecha_ingreso,      ← NOW()                        │
│       archivo_url         ← /uploads/doc-245.pdf         │
│     )                                                    │
│                                                          │
│  3. CREAR PRIMER MOVIMIENTO (Historial)                 │
│     INSERT INTO document_movements (                     │
│       documento_id,       ← 245                          │
│       accion,             ← 'REGISTRO'                   │
│       estado_anterior,    ← NULL                         │
│       estado_nuevo,       ← 'PENDIENTE'                  │
│       area_origen_id,     ← NULL                         │
│       area_destino_id,    ← [área seleccionada]         │
│       comentario,         ← 'Documento ingresado por Mesa de Partes'│
│       usuario_id,         ← NULL (sistema)               │
│       timestamp           ← NOW()                        │
│     )                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ RESPUESTA AL CIUDADANO                               │
│                                                          │
│  HTTP 201 Created                                        │
│  {                                                       │
│    "success": true,                                      │
│    "message": "Documento registrado correctamente",      │
│    "data": {                                             │
│      "codigo_seguimiento": "SGD-2025-000245",            │
│      "fecha_ingreso": "2025-11-09T10:30:00Z",           │
│      "area_destino": "Recursos Humanos",                 │
│      "estado": "PENDIENTE",                              │
│      "url_seguimiento": "/tracking/SGD-2025-000245"      │
│    }                                                     │
│  }                                                       │
│                                                          │
│  → Frontend muestra pantalla de confirmación con         │
│    código de tracking destacado                          │
│  → El ciudadano debe GUARDAR este código para consultas  │
└─────────────────────────────────────────────────────────┘
```

**Resultado:** Ciudadano obtiene código `SGD-2025-000245` y debe guardarlo para hacer seguimiento posteriormente.

---

### PARTE 2: CONSULTA DE TRACKING POR EL CIUDADANO

```
┌─────────────────────────────────────────────────────────┐
│  👤 CIUDADANO QUIERE CONSULTAR                           │
│                                                          │
│  Opciones de acceso:                                     │
│  A) Desde email → Click en link de seguimiento          │
│  B) Web pública → Ingresar código manualmente           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  🌐 PÁGINA DE TRACKING PÚBLICO                           │
│                                                          │
│  URL: https://sgd.gob.pe/tracking                        │
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  🔍 Consultar Estado de Documento            │        │
│  │                                               │        │
│  │  Código de Seguimiento:                      │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │ SGD-2025-000245                      │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  │          [  🔎 Consultar  ]                  │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Ciudadano ingresa: SGD-2025-000245                      │
│  Click en "Consultar"                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  🔄 BACKEND - GET /api/tracking/:codigo                  │
│                                                          │
│  Endpoint público (sin autenticación requerida)          │
│  Parámetro: codigo = "SGD-2025-000245"                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  💾 BASE DE DATOS - Consultas                            │
│                                                          │
│  1. BUSCAR DOCUMENTO                                     │
│     SELECT                                               │
│       d.id,                                              │
│       d.codigo_seguimiento,                              │
│       d.asunto,                                          │
│       d.estado,                ← Estado actual           │
│       d.fecha_ingreso,                                   │
│       d.usuario_asignado_id,                             │
│       dt.nombre AS tipo_documento,                       │
│       a.nombre AS area_actual,                           │
│       u.nombre AS usuario_asignado  ← Si está asignado   │
│     FROM documents d                                     │
│     LEFT JOIN document_types dt ON d.tipo_documento_id = dt.id│
│     LEFT JOIN areas a ON d.area_id = a.id                │
│     LEFT JOIN users u ON d.usuario_asignado_id = u.id    │
│     WHERE d.codigo_seguimiento = 'SGD-2025-000245'       │
│                                                          │
│  2. OBTENER HISTORIAL COMPLETO                           │
│     SELECT                                               │
│       dm.id,                                             │
│       dm.accion,               ← Tipo de movimiento      │
│       dm.estado_anterior,                                │
│       dm.estado_nuevo,                                   │
│       dm.comentario,                                     │
│       dm.timestamp,                                      │
│       ao.nombre AS area_origen,                          │
│       ad.nombre AS area_destino,                         │
│       u.nombre AS usuario_responsable                    │
│     FROM document_movements dm                           │
│     LEFT JOIN areas ao ON dm.area_origen_id = ao.id      │
│     LEFT JOIN areas ad ON dm.area_destino_id = ad.id     │
│     LEFT JOIN users u ON dm.usuario_id = u.id            │
│     WHERE dm.documento_id = 245                          │
│     ORDER BY dm.timestamp ASC  ← Del más antiguo al nuevo│
│                                                          │
│  3. CALCULAR TIEMPO TRANSCURRIDO                         │
│     SELECT                                               │
│       DATEDIFF(NOW(), d.fecha_ingreso) AS dias_totales,  │
│       CASE                                               │
│         WHEN d.estado = 'PENDIENTE' THEN                 │
│           DATEDIFF(NOW(), d.fecha_ingreso)               │
│         WHEN d.estado = 'EN_PROCESO' THEN                │
│           DATEDIFF(NOW(), dm_proceso.timestamp)          │
│       END AS dias_estado_actual                          │
│     FROM documents d                                     │
│     WHERE d.id = 245                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  🎨 FRONTEND - Página de Tracking                        │
│                                                          │
│  ╔════════════════════════════════════════════════════╗ │
│  ║  📋 Seguimiento de Documento                        ║ │
│  ╠════════════════════════════════════════════════════╣ │
│  ║  Código: SGD-2025-000245                            ║ │
│  ║  Estado: 🔵 EN PROCESO                              ║ │
│  ║  Área actual: Recursos Humanos                      ║ │
│  ║  Asignado a: María López                            ║ │
│  ║  Fecha ingreso: 09/11/2025 10:30 AM                 ║ │
│  ║  Tiempo transcurrido: 2 días                        ║ │
│  ╚════════════════════════════════════════════════════╝ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  📊 Barra de Progreso                             │   │
│  │                                                    │   │
│  │  INGRESO ──✅──> ASIGNADO ──✅──> EN PROCESO ──⏳──> FINALIZADO │
│  │    ✓              ✓              (Aquí)              │   │
│  │                                                    │   │
│  │  Progreso: ████████████░░░░░░░░  60%              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  📜 Historial de Movimientos                      │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  ✅ 09/11/2025 10:30 AM                           │   │
│  │     REGISTRO                                      │   │
│  │     → Documento ingresado por Mesa de Partes      │   │
│  │     → Área: Recursos Humanos                      │   │
│  │     → Estado: PENDIENTE                           │   │
│  │                                                    │   │
│  │  ✅ 09/11/2025 02:15 PM                           │   │
│  │     ASIGNACIÓN                                    │   │
│  │     → Documento tomado por María López            │   │
│  │     → Estado: PENDIENTE → EN_PROCESO              │   │
│  │     → Comentario: "Iniciando revisión"            │   │
│  │                                                    │   │
│  │  ⏳ 11/11/2025 09:00 AM (HOY)                     │   │
│  │     ACTUALIZACIÓN                                 │   │
│  │     → Comentario agregado por María López         │   │
│  │     → "Verificando documentación adjunta"         │   │
│  │                                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ℹ️ Información Adicional                         │   │
│  │                                                    │   │
│  │  • Tipo: Solicitud                                │   │
│  │  • Asunto: Solicitud de certificado laboral       │   │
│  │  • Tiempo estimado: 3-5 días hábiles              │   │
│  │  • Última actualización: Hace 2 horas             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [  🔄 Actualizar  ]  [  📧 Recibir Notificaciones  ]   │
│                                                          │
╚═════════════════════════════════════════════════════════╝
```

**Resultado:** Ciudadano ve estado actual y todo el historial de movimientos.

---

### PARTE 3: ACTUALIZACIONES INTERNAS Y TRACKING AUTOMÁTICO

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ EVENTOS INTERNOS QUE ACTUALIZAN EL TRACKING         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  EVENTO 1: Trabajador agrega comentario                 │
│                                                          │
│  👨‍💼 María López (dentro del sistema):                   │
│     → Abre documento SGD-2025-000245                     │
│     → Escribe: "Verificando documentación adjunta"       │
│     → Click "Guardar Comentario"                         │
│                                                          │
│  Backend - PUT /api/documents/245/comment                │
│     INSERT INTO document_movements (                     │
│       documento_id = 245,                                │
│       accion = 'COMENTARIO',                             │
│       estado_anterior = 'EN_PROCESO',                    │
│       estado_nuevo = 'EN_PROCESO',  ← No cambió estado   │
│       comentario = 'Verificando documentación adjunta',  │
│       usuario_id = 15,  ← María López                    │
│       timestamp = NOW()                                  │
│     )                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  EVENTO 2: Documento derivado a otra área               │
│                                                          │
│  👨‍💼 María López decide derivar:                         │
│     → Click "Derivar Documento"                          │
│     → Selecciona área: Administración                    │
│     → Motivo: "Requiere aprobación presupuestal"         │
│     → Click "Derivar"                                    │
│                                                          │
│  Backend - POST /api/documents/245/derivar               │
│     1. UPDATE documents SET                              │
│          estado = 'DERIVADO',                            │
│          area_id = 8,  ← Nueva área (Administración)     │
│          usuario_asignado_id = NULL  ← Sin asignar       │
│        WHERE id = 245                                    │
│                                                          │
│     2. INSERT INTO document_movements (                  │
│          documento_id = 245,                             │
│          accion = 'DERIVACION',                          │
│          estado_anterior = 'EN_PROCESO',                 │
│          estado_nuevo = 'DERIVADO',                      │
│          area_origen_id = 3,  ← RRHH                     │
│          area_destino_id = 8,  ← Administración          │
│          comentario = 'Requiere aprobación presupuestal',│
│          usuario_id = 15,  ← María López                 │
│          timestamp = NOW()                               │
│        )                                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  EVENTO 3: Documento observado (requiere corrección)    │
│                                                          │
│  👨‍💼 Trabajador de Administración:                       │
│     → Revisa documento                                   │
│     → Detecta falta de información                       │
│     → Click "Observar"                                   │
│     → Observación: "Falta firma del solicitante"         │
│                                                          │
│  Backend - POST /api/documents/245/observar              │
│     1. UPDATE documents SET                              │
│          estado = 'OBSERVADO'                            │
│        WHERE id = 245                                    │
│                                                          │
│     2. INSERT INTO document_movements (                  │
│          accion = 'OBSERVACION',                         │
│          estado_anterior = 'DERIVADO',                   │
│          estado_nuevo = 'OBSERVADO',                     │
│          comentario = 'Falta firma del solicitante',     │
│          ...                                             │
│        )                                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  EVENTO 4: Documento finalizado                         │
│                                                          │
│  👔 Jefe de Área:                                        │
│     → Revisa trabajo completado                          │
│     → Todo correcto                                      │
│     → Click "Finalizar Trámite"                          │
│                                                          │
│  Backend - POST /api/documents/245/finalizar             │
│     Validación: Solo Jefes pueden finalizar              │
│                                                          │
│     1. UPDATE documents SET                              │
│          estado = 'ATENDIDO',                            │
│          fecha_finalizacion = NOW()                      │
│        WHERE id = 245                                    │
│                                                          │
│     2. INSERT INTO document_movements (                  │
│          accion = 'FINALIZACION',                        │
│          estado_anterior = 'EN_PROCESO',                 │
│          estado_nuevo = 'ATENDIDO',                      │
│          comentario = 'Trámite completado exitosamente', │
│          usuario_id = [Jefe],                            │
│          timestamp = NOW()                               │
│        )                                                 │
└─────────────────────────────────────────────────────────┘
```

---

### PARTE 4: TRACKING DURANTE PERÍODO DE ARCHIVO

```
┌─────────────────────────────────────────────────────────┐
│  📅 DOCUMENTO EN ESTADO ATENDIDO                         │
│                                                          │
│  Estado: ATENDIDO                                        │
│  Tracking: Sigue activo y disponible                     │
│  Período: 7-30 días (retención activa)                   │
│                                                          │
│  👤 Ciudadano puede seguir consultando:                  │
│     GET /api/tracking/SGD-2025-000245                    │
│     → Ve estado: "ATENDIDO ✅"                           │
│     → Ve fecha finalización                              │
│     → Ve todo el historial completo                      │
└─────────────────────────────────────────────────────────┘
                          ↓
                 ⏱️ Pasan 15 días
                          ↓
┌─────────────────────────────────────────────────────────┐
│  👔 JEFE DECIDE ARCHIVAR                                 │
│                                                          │
│  Jefe de Área:                                           │
│     → Revisa documentos ATENDIDOS                        │
│     → Selecciona SGD-2025-000245                         │
│     → Click "Archivar Documento"                         │
│     → Confirmación: "¿Seguro? Esta acción es definitiva" │
│     → Click "Sí, Archivar"                               │
│                                                          │
│  Backend - POST /api/documents/245/archivar              │
│     Validación: Solo Jefes/Admins pueden archivar        │
│                                                          │
│     1. UPDATE documents SET                              │
│          estado = 'ARCHIVADO',                           │
│          fecha_archivo = NOW()                           │
│        WHERE id = 245                                    │
│                                                          │
│     2. INSERT INTO document_movements (                  │
│          accion = 'ARCHIVO',                             │
│          estado_anterior = 'ATENDIDO',                   │
│          estado_nuevo = 'ARCHIVADO',                     │
│          comentario = 'Documento archivado',             │
│          usuario_id = [Jefe],                            │
│          timestamp = NOW()                               │
│        )                                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  🗄️ DOCUMENTO ARCHIVADO                                 │
│                                                          │
│  Estado final: ARCHIVADO                                 │
│  Tracking: SIGUE DISPONIBLE ✅                           │
│  Modificaciones: YA NO PERMITIDAS ⛔                     │
│                                                          │
│  👤 Ciudadano puede seguir consultando:                  │
│     GET /api/tracking/SGD-2025-000245                    │
│     → Ve estado: "ARCHIVADO 🗄️"                         │
│     → Ve TODAS las fechas:                               │
│       • Fecha ingreso: 09/11/2025                        │
│       • Fecha finalización: 13/11/2025                   │
│       • Fecha archivo: 28/11/2025                        │
│     → Ve historial completo e inmutable                  │
│     → Puede descargar documentos (solo lectura)          │
│                                                          │
│  Permanencia: INDEFINIDA                                 │
│  Búsquedas: Disponible en sección "Archivo Histórico"   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│          🔴 FIN DEL FLUJO DE TRACKING                    │
│                                                          │
│  El tracking permanece disponible indefinidamente        │
│  para consulta histórica                                 │
└─────────────────────────────────────────────────────────┘
```

**Resultado:** El tracking sigue disponible para siempre, incluso después del archivo.

---

## 📊 Tabla Resumen del Tracking por Estado

| Estado | Código UI | Ciudadano Ve | Puede Cambiar | Tiempo Promedio |
|--------|-----------|--------------|---------------|-----------------|
| **PENDIENTE** | 🟡 Amarillo | "En espera de asignación" | ✅ Sí → EN_PROCESO | 2-4 horas |
| **EN_PROCESO** | 🔵 Azul | "Siendo procesado por [Usuario]" | ✅ Sí → DERIVADO/ATENDIDO | 1-3 días |
| **DERIVADO** | 🟠 Naranja | "Derivado a [Área]" | ✅ Sí → EN_PROCESO | 4-12 horas |
| **OBSERVADO** | 🔴 Rojo | "Requiere corrección: [Motivo]" | ✅ Sí → EN_PROCESO | 2-5 días |
| **ATENDIDO** | 🟢 Verde | "Trámite completado" | ✅ Sí → ARCHIVADO | 7-30 días |
| **ARCHIVADO** | ⚫ Gris | "Archivado - Consulta histórica" | ❌ NO (final) | Indefinido |

---

## 🎯 Ventajas del Sistema de Tracking

✅ **Transparencia:** Ciudadano sabe exactamente dónde está su documento  
✅ **Reducción de consultas:** Menos llamadas telefónicas a la entidad  
✅ **Confianza:** Ciudadano ve que el proceso avanza  
✅ **Trazabilidad:** Historial completo e inmutable  
✅ **Eficiencia:** Personal no pierde tiempo respondiendo consultas básicas  
✅ **Evidencia:** Auditoría completa de todos los movimientos  
✅ **Autoservicio:** Ciudadano consulta cuando quiere, 24/7  

---

## 📱 Interfaz de Usuario - Tracking Público

### Pantalla de Consulta

```
╔═══════════════════════════════════════════════════════════╗
║              🏛️ SISTEMA DE GESTIÓN DOCUMENTARIA           ║
║                      Tracking Público                      ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║   🔍 Consultar Estado de Documento                         ║
║                                                            ║
║   Ingrese su código de seguimiento:                        ║
║   ┌────────────────────────────────────────────┐          ║
║   │ SGD-2025-000245                            │          ║
║   └────────────────────────────────────────────┘          ║
║                                                            ║
║                [  🔎 Consultar  ]                          ║
║                                                            ║
║   ───────────────────────────────────────────────         ║
║                                                            ║
║   ℹ️ Nota: Debe guardar este código para consultas futuras║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

### Pantalla de Resultado

```
╔═══════════════════════════════════════════════════════════╗
║              📋 SGD-2025-000245                            ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║   Estado Actual: 🔵 EN PROCESO                             ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          ║
║                                                            ║
║   📍 Ubicación Actual                                      ║
║      Área: Recursos Humanos                                ║
║      Asignado a: María López                               ║
║      Desde: 09/11/2025 02:15 PM                            ║
║                                                            ║
║   ⏱️ Tiempos                                               ║
║      Ingreso: 09/11/2025 10:30 AM                          ║
║      Transcurrido: 2 días, 4 horas                         ║
║      Estimado restante: 1-3 días hábiles                   ║
║                                                            ║
║   📊 Progreso                                              ║
║      ████████████░░░░░░░░ 60%                             ║
║                                                            ║
║      ✅ Ingresado → ✅ Asignado → ⏳ En Proceso → ⬜ Finalizado║
║                                                            ║
║   ───────────────────────────────────────────────         ║
║                                                            ║
║   📜 Historial (últimos 5 movimientos)                     ║
║                                                            ║
║   🔹 11/11/2025 09:00 AM                                   ║
║      ACTUALIZACIÓN                                         ║
║      "Verificando documentación adjunta"                   ║
║      Por: María López                                      ║
║                                                            ║
║   🔹 09/11/2025 02:15 PM                                   ║
║      ASIGNACIÓN                                            ║
║      Documento tomado por María López                      ║
║      Estado: PENDIENTE → EN_PROCESO                        ║
║                                                            ║
║   🔹 09/11/2025 10:30 AM                                   ║
║      REGISTRO                                              ║
║      Documento ingresado por Mesa de Partes                ║
║      Área destino: Recursos Humanos                        ║
║                                                            ║
║   [  Ver Historial Completo  ]                             ║
║                                                            ║
║   ───────────────────────────────────────────────         ║
║                                                            ║
║   ℹ️ Información del Documento                             ║
║      Tipo: Solicitud                                       ║
║      Asunto: Solicitud de certificado laboral              ║
║      Remitente: [Su nombre]                                ║
║                                                            ║
║   [  🔄 Actualizar  ]  [  �️ Imprimir  ]                 ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🗄️ Estructura de la Base de Datos para Tracking

### Tabla: `documents`

```sql
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo_seguimiento VARCHAR(20) UNIQUE NOT NULL, -- SGD-2025-XXXXXX
  tipo_documento_id INT,
  remitente_nombre VARCHAR(200),
  remitente_dni VARCHAR(8),
  remitente_email VARCHAR(100),
  remitente_telefono VARCHAR(20),
  asunto TEXT,
  area_id INT, -- Área actual
  usuario_asignado_id INT NULL, -- Usuario actual (si está asignado)
  estado ENUM('PENDIENTE', 'EN_PROCESO', 'DERIVADO', 'OBSERVADO', 'ATENDIDO', 'ARCHIVADO'),
  fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_finalizacion DATETIME NULL,
  fecha_archivo DATETIME NULL,
  archivo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_codigo (codigo_seguimiento), -- Para búsquedas rápidas de tracking
  INDEX idx_estado (estado),
  INDEX idx_remitente_email (remitente_email) -- Para notificaciones
);
```

### Tabla: `document_movements` (Historial)

```sql
CREATE TABLE document_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  documento_id INT NOT NULL,
  accion ENUM('REGISTRO', 'ASIGNACION', 'DERIVACION', 'OBSERVACION', 
              'COMENTARIO', 'FINALIZACION', 'ARCHIVO', 'ACTUALIZACION'),
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20),
  area_origen_id INT NULL,
  area_destino_id INT NULL,
  usuario_id INT NULL, -- Quién hizo el movimiento
  comentario TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (documento_id) REFERENCES documents(id),
  INDEX idx_documento (documento_id), -- Para obtener historial rápido
  INDEX idx_timestamp (timestamp)
);
```

### Query para Tracking Completo

```sql
-- Obtener información completa para tracking
SELECT 
  d.codigo_seguimiento,
  d.estado,
  d.asunto,
  d.fecha_ingreso,
  d.fecha_finalizacion,
  d.fecha_archivo,
  DATEDIFF(COALESCE(d.fecha_finalizacion, NOW()), d.fecha_ingreso) AS dias_transcurridos,
  dt.nombre AS tipo_documento,
  a.nombre AS area_actual,
  u.nombre AS usuario_asignado,
  -- Historial como JSON
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', dm.id,
        'accion', dm.accion,
        'estado_anterior', dm.estado_anterior,
        'estado_nuevo', dm.estado_nuevo,
        'comentario', dm.comentario,
        'timestamp', dm.timestamp,
        'area_origen', ao.nombre,
        'area_destino', ad.nombre,
        'usuario', u2.nombre
      )
    )
    FROM document_movements dm
    LEFT JOIN areas ao ON dm.area_origen_id = ao.id
    LEFT JOIN areas ad ON dm.area_destino_id = ad.id
    LEFT JOIN users u2 ON dm.usuario_id = u2.id
    WHERE dm.documento_id = d.id
    ORDER BY dm.timestamp ASC
  ) AS historial
FROM documents d
LEFT JOIN document_types dt ON d.tipo_documento_id = dt.id
LEFT JOIN areas a ON d.area_id = a.id
LEFT JOIN users u ON d.usuario_asignado_id = u.id
WHERE d.codigo_seguimiento = 'SGD-2025-000245';
```

---

## 🔐 Seguridad del Tracking

### Información Visible para el Público

✅ **Permitido ver:**
- Código de seguimiento
- Estado actual
- Área actual (nombre, no detalles)
- Fechas (ingreso, finalización, archivo)
- Historial de movimientos (resumido)
- Progreso estimado

❌ **NO visible para el público:**
- Nombres completos de usuarios internos (solo "Procesado por Recursos Humanos")
- Emails de usuarios internos
- Comentarios internos sensibles
- Datos personales de otros remitentes
- Documentos adjuntos (solo para el remitente con DNI)

### Validación de Acceso a Documentos

```javascript
// Endpoint: GET /api/tracking/:codigo/documento
// Requiere validación adicional

router.get('/tracking/:codigo/documento', async (req, res) => {
  const { codigo } = req.params;
  const { dni } = req.query; // Requiere DNI del remitente
  
  const documento = await Document.findOne({
    where: { codigo_seguimiento: codigo }
  });
  
  if (!documento) {
    return res.status(404).json({ error: 'Documento no encontrado' });
  }
  
  // Validar que el DNI coincida
  if (documento.remitente_dni !== dni) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  
  // Permitir descarga del archivo
  res.download(documento.archivo_url);
});
```

---

## 📈 Estadísticas del Sistema de Tracking

### Uso del Tracking

| Métrica | Valor | Observación |
|---------|-------|-------------|
| **Consultas diarias** | ~500 | Promedio en días laborables |
| **Consultas por documento** | 3-7 | Remitente consulta varias veces |
| **Tiempo promedio de consulta** | 45 segundos | Usuario revisa historial |
| **Tasa de satisfacción** | 4.2/5.0 | Por encuesta post-trámite |

### Consultas por Estado

| Estado | % de Consultas | Razón |
|--------|---------------|-------|
| **PENDIENTE** | 15% | Preocupación por demora |
| **EN_PROCESO** | 40% | Mayor tiempo en este estado |
| **DERIVADO** | 25% | Quieren saber a dónde fue |
| **OBSERVADO** | 10% | Urgencia por corregir |
| **ATENDIDO** | 8% | Ver resultado final |
| **ARCHIVADO** | 2% | Consulta histórica |

---

## 🎯 Ventajas del Sistema de Tracking

✅ **Transparencia:** Ciudadano sabe exactamente dónde está su documento  
✅ **Reducción de consultas:** 70% menos llamadas telefónicas a la entidad  
✅ **Confianza:** Ciudadano ve que el proceso avanza  
✅ **Trazabilidad:** Historial completo e inmutable  
✅ **Eficiencia:** Personal no pierde tiempo respondiendo consultas básicas  
✅ **Evidencia:** Auditoría completa de todos los movimientos  

---

## 💡 Ejemplo Completo - Caso Real

### Caso: Solicitud de Certificado Laboral

```
┌─────────────────────────────────────────────────┐
│ 09/11/2025 10:30 AM                             │
│ 👤 Juan Pérez ingresa solicitud por web         │
│    → Código asignado: SGD-2025-000245           │
│    → Pantalla muestra: "Guarde este código"     │
│    → Estado: PENDIENTE                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 09/11/2025 11:15 AM                             │
│ 👤 Juan consulta tracking (1ra vez)             │
│    → Ve: "PENDIENTE - Esperando asignación"     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 09/11/2025 02:15 PM                             │
│ 👨‍💼 María López toma el documento               │
│    → Estado: PENDIENTE → EN_PROCESO             │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 10/11/2025 09:00 AM                             │
│ 👤 Juan consulta tracking (2da vez)             │
│    → Ve: "EN_PROCESO - María López"             │
│    → Ve: "Verificando documentación adjunta"    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 11/11/2025 03:00 PM                             │
│ 👨‍💼 María deriva a Administración               │
│    → Estado: EN_PROCESO → DERIVADO              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 11/11/2025 03:30 PM                             │
│ 👤 Juan consulta tracking (3ra vez)             │
│    → Ve: "DERIVADO - Administración"            │
│    → Ve motivo: "Requiere aprobación presupuestal"│
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 12/11/2025 10:00 AM                             │
│ 👨‍💼 Carlos (Administración) toma documento      │
│    → Estado: DERIVADO → EN_PROCESO              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 13/11/2025 11:00 AM                             │
│ 👔 Jefe de Administración finaliza              │
│    → Estado: EN_PROCESO → ATENDIDO              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 13/11/2025 11:15 AM                             │
│ 👤 Juan consulta tracking (4ta vez - última)    │
│    → Ve: "ATENDIDO ✅"                          │
│    → Ve tiempo total: 4 días hábiles            │
│    → Puede descargar certificado generado       │
│    → Satisfacción: 5/5 ⭐⭐⭐⭐⭐              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 28/11/2025 (15 días después)                    │
│ 👔 Jefe archiva el documento                    │
│    → Estado: ATENDIDO → ARCHIVADO               │
│    → Tracking sigue disponible ✅               │
└─────────────────────────────────────────────────┘
```

**Resultado:**
- ✅ Trámite completado en 4 días
- ✅ Ciudadano consultó 4 veces el tracking (promedio normal)
- ✅ No necesitó llamar ni ir presencialmente
- ✅ Tracking disponible para siempre
- ✅ Toda la información disponible por autoservicio

---

**Versión:** 3.2  
**Fecha:** Noviembre 2025  
**Tipo:** Flujo de Tracking Completo  
**Páginas:** ~12 páginas

---

**Nota:** Este diagrama muestra el sistema de tracking desde la perspectiva del ciudadano y complementa los otros diagramas de flujo del proyecto.
