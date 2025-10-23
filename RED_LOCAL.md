# 🌐 Configuración para Red Local

## ✅ **Configuración Completada**

El sistema está configurado para ser accesible desde otros dispositivos en tu red local.

---

## 🚀 **Cómo Iniciar los Servidores**

### **1. Backend (Terminal 1)**
```bash
cd GestionDocumentaria
npm run dev
```

El backend mostrará:
```
✓ Servidor HTTP corriendo en:
  - Local:   http://localhost:3000
  - Red:     http://192.168.X.X:3000    <--- Usar esta IP
✓ WebSocket corriendo en:
  - Local:   ws://localhost:3000
  - Red:     ws://192.168.X.X:3000
```

### **2. Frontend (Terminal 2)**
```bash
cd sgd-frontend
npm start
```

El frontend mostrará:
```
** Angular Live Development Server is listening on:
  - Local:   http://localhost:4200
  - Network: http://192.168.X.X:4200    <--- Usar esta IP
```

---

## 📱 **Acceder desde Otros Dispositivos**

### **Paso 1: Obtener tu IP Local**

**En Windows (PowerShell):**
```powershell
ipconfig
```
Busca "Dirección IPv4" en tu adaptador de red activo (Wi-Fi o Ethernet)
Ejemplo: `192.168.1.100`

**Desde el servidor Node.js:**
El backend ya muestra automáticamente tu IP al iniciar.

---

### **Paso 2: Configurar Firewall de Windows**

Para permitir conexiones entrantes en los puertos 3000 y 4200:

```powershell
# Permitir puerto 3000 (Backend)
New-NetFirewallRule -DisplayName "SGD Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Permitir puerto 4200 (Frontend)
New-NetFirewallRule -DisplayName "SGD Frontend" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow
```

O manualmente:
1. Panel de Control → Sistema y Seguridad → Firewall de Windows
2. Configuración avanzada → Reglas de entrada → Nueva regla
3. Tipo: Puerto → TCP → Puertos específicos: `3000, 4200`
4. Acción: Permitir conexión
5. Aplicar a: Dominio, Privado, Público
6. Nombre: "SGD - Sistema Gestión Documentaria"

---

### **Paso 3: Actualizar Environment del Frontend (si es necesario)**

Si quieres que el frontend se conecte automáticamente usando la IP de red:

**Editar:** `sgd-frontend/src/app/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://TU_IP_LOCAL:3000/api',  // Ejemplo: http://192.168.1.100:3000/api
  wsUrl: 'ws://TU_IP_LOCAL:3000'           // Ejemplo: ws://192.168.1.100:3000
};
```

---

## 🔗 **URLs de Acceso**

Reemplaza `192.168.X.X` con tu IP real:

### **Desde el mismo PC:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

### **Desde otros dispositivos en la red:**
- Frontend: http://192.168.X.X:4200
- Backend API: http://192.168.X.X:3000/api
- Health Check: http://192.168.X.X:3000/api/health

---

## 📱 **Probar desde Móvil/Tablet**

1. Conecta el dispositivo a la **misma red WiFi**
2. Abre el navegador
3. Ve a: `http://TU_IP_LOCAL:4200`
4. Ejemplo: `http://192.168.1.100:4200`

---

## 🔧 **Solución de Problemas**

### **No puedo acceder desde otro dispositivo:**

1. **Verificar que ambos estén en la misma red**
   ```powershell
   # Ver tu IP
   ipconfig
   ```

2. **Verificar que el firewall permita las conexiones**
   ```powershell
   # Listar reglas de firewall
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*SGD*"}
   ```

3. **Probar conectividad**
   ```powershell
   # Desde otro dispositivo, hacer ping
   ping 192.168.X.X
   ```

4. **Verificar que los puertos estén escuchando**
   ```powershell
   # Ver puertos en uso
   netstat -an | findstr "3000 4200"
   ```

### **El backend funciona pero no el frontend:**
- Verifica que el archivo `environment.ts` apunte a la IP correcta
- Reinicia el servidor frontend después de cambiar configuración

### **CORS errors:**
- El CORS ya está configurado para aceptar todas las conexiones
- Si hay problemas, verifica en el navegador (F12 → Console)

---

## 🔒 **Notas de Seguridad**

### **⚠️ IMPORTANTE:**

Esta configuración es para **DESARROLLO/TESTING EN RED LOCAL**.

**NO usar en producción sin:**
1. Configurar CORS restrictivo (solo dominios permitidos)
2. Habilitar HTTPS/SSL
3. Configurar firewall más estricto
4. Usar variables de entorno para IPs
5. Implementar rate limiting
6. Configurar autenticación adicional

### **Para producción:**

```javascript
// server.js - Ejemplo configuración CORS producción
const corsOptions = {
  origin: ['https://sgd.tupagina.com'],
  credentials: true
};
app.use(cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: 'https://sgd.tupagina.com',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 📊 **Características Habilitadas**

- ✅ Backend escuchando en `0.0.0.0:3000`
- ✅ Frontend escuchando en `0.0.0.0:4200`
- ✅ CORS configurado para red local
- ✅ WebSocket accesible desde red
- ✅ IP de red detectada automáticamente
- ✅ Múltiples clientes simultáneos

---

## 🎯 **Casos de Uso**

### **1. Desarrollo Colaborativo:**
- Varios desarrolladores probando en sus dispositivos
- QA testing desde móviles/tablets

### **2. Demostración:**
- Mostrar el sistema en reuniones
- Acceso desde proyector/pantalla

### **3. Testing de Red:**
- Probar latencia
- Verificar comportamiento con múltiples usuarios
- Testing de WebSocket en red real

---

## 📝 **Checklist Rápido**

Antes de acceder desde otro dispositivo:

- [ ] Backend corriendo (`npm run dev`)
- [ ] Frontend corriendo (`npm start`)
- [ ] Firewall configurado (puertos 3000, 4200)
- [ ] IP local identificada
- [ ] Dispositivo en la misma red WiFi
- [ ] URL correcta en navegador: `http://TU_IP:4200`

---

**¿Todo listo?** 🚀

Ahora puedes acceder al sistema desde cualquier dispositivo en tu red local.

**Próximos pasos:**
1. Reiniciar backend y frontend
2. Copiar la IP que muestra el backend
3. Acceder desde otro dispositivo usando esa IP

---

**Fecha:** 23 de Octubre, 2025  
**Versión:** 0.5.0-beta  
**Configuración:** Red Local / Desarrollo
