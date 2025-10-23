# 🌐 Detección Automática de IP para Red Local

**Fecha:** 23 de Octubre, 2025  
**Estado:** ✅ **IMPLEMENTADO**

---

## 🎯 **Objetivo**

Configurar el sistema para que **detecte automáticamente** la IP desde donde se accede, eliminando la necesidad de configurar manualmente las URLs del backend.

---

## ✨ **Cómo Funciona**

### **Frontend (Angular)**

El frontend ahora detecta automáticamente el hostname desde donde se accede:

```typescript
// environment.ts
const getApiUrl = (): string => {
  const hostname = window.location.hostname;
  return `http://${hostname}:3000/api`;
};
```

### **Comportamiento:**

| URL de Acceso | Backend que Usará |
|---------------|-------------------|
| `http://localhost:4200` | `http://localhost:3000/api` |
| `http://10.1.3.14:4200` | `http://10.1.3.14:3000/api` |
| `http://192.168.1.5:4200` | `http://192.168.1.5:3000/api` |
| `http://mi-dominio.com:4200` | `http://mi-dominio.com:3000/api` |

**¡Completamente automático!** No necesitas cambiar configuración.

---

## 🚀 **Ventajas**

### **1. Portabilidad Total** ✅
```bash
# Mismo código funciona en:
- Tu PC local (localhost)
- Red local de la oficina (10.1.3.x)
- Otra red WiFi (192.168.x.x)
- Servidor en internet (dominio.com)
```

### **2. Sin Configuración Manual** ✅
```
❌ Antes: Cambiar manualmente environment.ts cada vez
✅ Ahora: Funciona automáticamente en cualquier red
```

### **3. Un Solo Build** ✅
```
No necesitas builds diferentes para:
- Desarrollo local
- Red de oficina
- Producción
```

---

## 📋 **Cómo Usar**

### **Opción 1: Acceso Local (misma PC)**

```bash
# 1. Iniciar backend
npm run dev

# 2. Iniciar frontend (otra terminal)
cd sgd-frontend
npm start

# 3. Acceder en tu navegador
http://localhost:4200
```

**Backend usado:** `http://localhost:3000/api` ✅

---

### **Opción 2: Acceso en Red Local (otra PC)**

**En tu PC (servidor):**

```bash
# 1. Ver tu IP
ipconfig
# Ejemplo: 10.1.3.14

# 2. Configurar firewall (solo primera vez)
# PowerShell como Administrador:
.\setup-firewall.ps1

# 3. Iniciar backend
npm run dev

# 4. Iniciar frontend
cd sgd-frontend
npm start
```

**En otra PC (cliente):**

```bash
# Abrir navegador y acceder:
http://10.1.3.14:4200
```

**Backend usado:** `http://10.1.3.14:3000/api` ✅ (automático)

---

## 🔍 **Verificación**

### **Consola del Navegador:**

```javascript
// Abre DevTools (F12) y ejecuta:
console.log('Frontend accedido desde:', window.location.hostname);
console.log('Backend configurado en:', environment.apiUrl);

// Resultado en localhost:
// Frontend: localhost
// Backend: http://localhost:3000/api

// Resultado en red local:
// Frontend: 10.1.3.14
// Backend: http://10.1.3.14:3000/api
```

---

## 🔥 **Configuración del Firewall**

**Solo necesitas hacerlo UNA VEZ:**

### **Script Automático:**

```powershell
# PowerShell como Administrador
cd C:\Users\educacion_vial_2\Desktop\GestionDocumentaria
.\setup-firewall.ps1
```

### **Manual (alternativa):**

```powershell
# Backend (puerto 3000)
New-NetFirewallRule -DisplayName "SGD - Backend" `
  -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Frontend (puerto 4200)
New-NetFirewallRule -DisplayName "SGD - Frontend" `
  -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
```

---

## 📱 **Ejemplos de Uso**

### **Caso 1: Desarrollo en Casa (WiFi)**

```
Tu IP: 192.168.1.100

Tú accedes:
http://localhost:4200 ✅

Tu colega accede (misma red WiFi):
http://192.168.1.100:4200 ✅

Ambos funcionan sin cambiar código
```

### **Caso 2: Oficina (Red Corporativa)**

```
Tu IP: 10.1.3.14

Tú accedes:
http://localhost:4200 ✅

Compañero de oficina:
http://10.1.3.14:4200 ✅

Jefe en su PC:
http://10.1.3.14:4200 ✅

Todos sin configurar nada
```

### **Caso 3: Presentación con Proyector**

```
Tu IP: 192.168.0.50

Laptop conectado al proyector:
http://192.168.0.50:4200 ✅

Tablet de demostración:
http://192.168.0.50:4200 ✅

Celular con WiFi:
http://192.168.0.50:4200 ✅

Todo funciona automáticamente
```

---

## 🛠️ **Detalles Técnicos**

### **Frontend Detection:**

```typescript
// environment.ts
const getApiUrl = (): string => {
  // window.location.hostname contiene:
  // - "localhost" si accedes por localhost
  // - "10.1.3.14" si accedes por IP
  // - "midominio.com" si tienes un dominio
  
  const hostname = typeof window !== 'undefined' 
    ? window.location.hostname 
    : 'localhost'; // fallback para SSR
  
  // Construir URL del backend en el mismo host
  return `http://${hostname}:3000/api`;
};
```

### **Backend Detection:**

```javascript
// server.js (ya implementado)
const os = require('os');
const interfaces = os.networkInterfaces();

// Obtiene la primera IP no-localhost
const localIP = Object.values(interfaces)
  .flat()
  .find(i => i.family === 'IPv4' && !i.internal)
  ?.address || 'localhost';

console.log(`Red: http://${localIP}:${PORT}`);
```

---

## ✅ **Checklist de Configuración**

### **Primera Vez (Setup Inicial):**

- [ ] Ejecutar `setup-firewall.ps1` como Administrador
- [ ] Verificar que no haya antivirus bloqueando puertos
- [ ] Confirmar que Backend y Frontend están en la misma PC

### **Cada Vez que Inicies:**

- [ ] Iniciar Backend: `npm run dev`
- [ ] Iniciar Frontend: `cd sgd-frontend && npm start`
- [ ] Verificar IP con `ipconfig`

### **Desde Otra PC:**

- [ ] Confirmar que está en la misma red
- [ ] Abrir navegador
- [ ] Ir a `http://[IP-DEL-SERVIDOR]:4200`

---

## 🚨 **Solución de Problemas**

### **Problema 1: "No se puede conectar al servidor"**

```bash
# Verificar que el backend esté corriendo
# Deberías ver:
✓ Servidor HTTP corriendo en:
  - Red: http://10.1.3.14:3000

# Si no aparece, reinicia el backend
```

### **Problema 2: "CORS Error"**

```javascript
// El backend ya tiene CORS configurado:
app.use(cors()); // Permite todas las conexiones

// Si aún así hay error, verifica que el backend
// esté escuchando en 0.0.0.0 (todas las interfaces)
```

### **Problema 3: "Firewall bloqueando"**

```powershell
# Verificar reglas de firewall
Get-NetFirewallRule -DisplayName "SGD*"

# Si no aparecen, ejecutar de nuevo:
.\setup-firewall.ps1
```

### **Problema 4: "Funciona en localhost pero no en red"**

```bash
# 1. Confirmar IP
ipconfig

# 2. Hacer ping desde otra PC
ping 10.1.3.14

# 3. Verificar que backend muestre IP de red
# Debe decir: "Red: http://10.1.3.14:3000"
```

---

## 📊 **Comparación: Antes vs Ahora**

### **Antes (Manual):**

```typescript
// environment.ts
export const environment = {
  apiUrl: 'http://localhost:3000/api' 
  // ❌ Solo funciona en la misma PC
};

// Para red local tenías que cambiar a:
apiUrl: 'http://10.1.3.14:3000/api'
// ❌ Hay que cambiar manualmente
// ❌ Si cambias de red, hay que volver a configurar
```

### **Ahora (Automático):**

```typescript
// environment.ts
const getApiUrl = (): string => {
  const hostname = window.location.hostname;
  return `http://${hostname}:3000/api`;
};

// ✅ Funciona en localhost
// ✅ Funciona en cualquier IP
// ✅ Funciona en cualquier red
// ✅ Sin configuración manual
```

---

## 🎯 **Casos de Uso Reales**

### **1. Demostración a Jefes**

```
Tú: http://localhost:4200 (en tu laptop)
Jefe: http://10.1.3.14:4200 (en su PC)
Proyector: http://10.1.3.14:4200 (navegador en pantalla)

Todo sincronizado, sin configurar nada
```

### **2. Testing Multi-dispositivo**

```
Tu PC: http://localhost:4200
Tu Celular: http://10.1.3.14:4200
Tablet: http://10.1.3.14:4200

Pruebas responsive en tiempo real
```

### **3. Capacitación de Usuarios**

```
Instructor: http://10.1.3.14:4200
Usuario 1: http://10.1.3.14:4200
Usuario 2: http://10.1.3.14:4200
...
Usuario 10: http://10.1.3.14:4200

Todos conectados al mismo backend
```

---

## 🔐 **Seguridad**

### **Red Local (Actual):**

```
✅ Solo accesible en la misma red WiFi/LAN
✅ Firewall de Windows protegiendo
✅ No expuesto a Internet
```

### **Para Producción (Futuro):**

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://sgd.drtc-puno.gob.pe/api', // Dominio real
  // Con HTTPS
  // Con autenticación robusta
  // Con firewall de servidor
};
```

---

## 📚 **Comandos Rápidos**

### **Ver tu IP:**

```powershell
ipconfig
```

### **Configurar Firewall:**

```powershell
# Como Administrador
.\setup-firewall.ps1
```

### **Iniciar Todo:**

```powershell
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd sgd-frontend
npm start
```

### **Verificar Reglas de Firewall:**

```powershell
Get-NetFirewallRule -DisplayName "SGD*" | Format-Table DisplayName, Enabled
```

---

## ✅ **Estado Actual**

| Componente | Detección Automática | Estado |
|-----------|---------------------|--------|
| Frontend | ✅ Sí (window.location.hostname) | ✅ Activo |
| Backend | ✅ Sí (os.networkInterfaces()) | ✅ Activo |
| WebSocket | ✅ Sí (usa apiUrl) | ✅ Activo |
| Firewall | ⚠️ Manual (una sola vez) | ⚠️ Pendiente ejecutar |

---

## 🚀 **Próximos Pasos**

1. **Ejecutar Firewall Script** (si no lo has hecho)
2. **Reiniciar Frontend** (para aplicar cambios)
3. **Probar desde otra PC** en la misma red
4. **Documentar la IP** para compartir con usuarios

---

**¡El sistema ahora es completamente portable y automático!** 🎉

No importa en qué red estés, el frontend siempre encontrará el backend automáticamente.

---

**Autor:** Sistema IA Cascade  
**Versión:** 1.1.0 - Red Local Automática  
**Documentación relacionada:** `RED_LOCAL.md`, `setup-firewall.ps1`
