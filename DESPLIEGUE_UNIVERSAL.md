# 🚀 Solución Universal de Despliegue

## ✨ Características

Este proyecto está configurado para funcionar **automáticamente** en cualquier escenario:

- ✅ **Localhost** - Desarrollo local
- ✅ **Red LAN** - Acceso desde otros dispositivos (incluso con DHCP/IP dinámica)
- ✅ **DevTunnels** - Acceso online sin configurar dominios o IPs
- ✅ **Sin hardcodear URLs** - Todo es detectado automáticamente

---

## 🎯 Cómo Funciona

### Arquitectura con Proxy

```
┌─────────────────────────────────────────────────────────┐
│  Cliente (Navegador)                                     │
│  - http://localhost:4200                                 │
│  - http://192.168.x.x:4200  (LAN con DHCP)              │
│  - https://xxx.devtunnels.ms  (Online)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Angular Dev Server   │
         │  Puerto 4200          │
         │  Host: 0.0.0.0        │
         └───────┬───────────────┘
                 │
                 │ Proxy: /api → localhost:3000
                 │
                 ▼
         ┌───────────────────────┐
         │  Node.js Backend      │
         │  Puerto 3000          │
         │  Host: 0.0.0.0        │
         └───────────────────────┘
```

### ¿Por qué funciona en todos los escenarios?

1. **Frontend usa rutas relativas** (`/api` en lugar de `http://...`)
2. **Angular proxy** redirige `/api` → `localhost:3000` internamente
3. **Ambos servidores** escuchan en `0.0.0.0` (todas las interfaces)
4. **No importa la IP/dominio** desde donde accedas, el proxy siempre redirige correctamente

---

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Windows (CMD):**
```cmd
start.bat
```

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd sgd-frontend
npm start
```

---

## 🌐 Acceso en Diferentes Escenarios

### 1️⃣ Localhost (Desarrollo Local)

```
Frontend: http://localhost:4200
Backend:  http://localhost:3000 (automático vía proxy)
```

### 2️⃣ Red LAN (DHCP/IP Dinámica)

1. Obtén tu IP local:
   ```powershell
   ipconfig
   # Busca: IPv4 Address... 192.168.x.x
   ```

2. Accede desde cualquier dispositivo en la red:
   ```
   http://192.168.x.x:4200
   ```
   
3. ✅ **El backend se accede automáticamente** vía proxy, sin importar la IP

### 3️⃣ DevTunnels (Acceso Online)

1. **Solo expón el puerto 4200:**
   ```bash
   # En VS Code, usa el panel de Ports y haz público el puerto 4200
   # O con CLI:
   devtunnel create
   devtunnel port create 4200 -p http
   devtunnel host
   ```

2. Accede desde la URL proporcionada:
   ```
   https://xxx-4200.brs.devtunnels.ms
   ```

3. ✅ **El proxy maneja automáticamente** las peticiones al backend

---

## 📁 Archivos de Configuración

### `sgd-frontend/proxy.conf.json`
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### `sgd-frontend/src/app/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: '/api', // Ruta relativa - funciona siempre
  appName: 'Sistema de Gestión Documentaria',
  appVersion: '1.0.0'
};
```

### `sgd-frontend/angular.json`
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"  // Proxy activado
  }
}
```

### `server.js`
```javascript
// CORS configurado para aceptar:
// - localhost
// - IPs locales (192.168.x.x, 10.x.x.x)
// - DevTunnels (*.devtunnels.ms)

server.listen(PORT, '0.0.0.0', () => {
  // Escucha en todas las interfaces
});
```

---

## ✅ Ventajas de Esta Solución

| Escenario | Sin Proxy | Con Proxy |
|-----------|-----------|-----------|
| Localhost | ✅ Funciona | ✅ Funciona |
| LAN (IP Estática) | ✅ Funciona | ✅ Funciona |
| LAN (DHCP/IP Dinámica) | ❌ Requiere reconfigurar | ✅ Funciona automáticamente |
| DevTunnels HTTPS | ❌ Mixed Content / CORS | ✅ Funciona automáticamente |
| Múltiples puertos | ❌ Debe exponer 3000 y 4200 | ✅ Solo expone 4200 |

---

## 🔧 Troubleshooting

### El frontend no carga
- Verifica que Angular esté corriendo: `http://localhost:4200`
- Revisa la consola del terminal de Angular

### Error de API/Backend
- Verifica que Node.js esté corriendo en puerto 3000
- Prueba: `http://localhost:3000/api/health`
- Revisa la consola del terminal de Node.js

### No funciona en LAN
- Verifica el firewall de Windows
- Asegúrate de que ambos servidores usen `0.0.0.0` como host
- Verifica que Angular use `--host 0.0.0.0` en package.json

### DevTunnels con error CORS
- Reinicia Angular para que el proxy funcione
- Verifica que solo expongas el puerto 4200
- El puerto 3000 NO debe estar expuesto en DevTunnels

---

## 📊 Resumen

✅ **No requiere configurar IPs manualmente**
✅ **Funciona con DHCP (IPs dinámicas)**
✅ **Compatible con DevTunnels out-of-the-box**
✅ **Sin problemas de CORS o Mixed Content**
✅ **Solo necesitas exponer 1 puerto (4200)**

🎉 **¡Listo para usar en cualquier escenario!**
