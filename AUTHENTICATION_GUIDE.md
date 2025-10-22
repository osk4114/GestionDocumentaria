# 🔒 Sistema de Autenticación Mejorado - SGD

## Resumen de Mejoras Implementadas

Se ha implementado un sistema de autenticación robusto y de nivel producción con las siguientes características:

---

## ✨ Características Principales

### 1. **Gestión de Sesiones Persistentes**
- ✅ Sesiones almacenadas en base de datos (tabla `user_sessions`)
- ✅ Cada token JWT tiene un identificador único (`jti` - JWT ID)
- ✅ Seguimiento de IP y User-Agent por sesión
- ✅ Registro de última actividad en cada request
- ✅ Expiración automática de sesiones

### 2. **Refresh Tokens**
- ✅ Tokens de acceso (24 horas)
- ✅ Refresh tokens (7 días)
- ✅ Rotación de tokens al refrescar
- ✅ Invalidación automática del token anterior

### 3. **Protección contra Ataques**
- ✅ Rate limiting en endpoints críticos:
  - Login: 5 intentos cada 15 minutos
  - Registro: 3 intentos por hora
  - API general: 100 requests cada 15 minutos
- ✅ Registro de intentos de login fallidos (tabla `login_attempts`)
- ✅ Bloqueo temporal después de 5 intentos fallidos
- ✅ Limpieza automática de sesiones expiradas cada hora

### 4. **Gestión Avanzada de Sesiones**
- ✅ Listar todas las sesiones activas del usuario
- ✅ Revocar sesiones específicas remotamente
- ✅ Cerrar todas las sesiones excepto la actual
- ✅ Límite de sesiones activas por usuario (configurable)

### 5. **Variables de Entorno**
- ✅ Archivo `.env` para configuración sensible
- ✅ Archivo `.env.example` como plantilla documentada
- ✅ `.env` excluido del repositorio git

### 6. **Auditoría y Seguridad**
- ✅ Registro de IP y User-Agent en cada login
- ✅ Historial de intentos de login (éxitos y fallos)
- ✅ Timestamps en todas las operaciones
- ✅ Limpieza automática de datos antiguos

---

## 📦 Nuevos Modelos de Base de Datos

### Tabla: `user_sessions`
```sql
- id (PK)
- user_id (FK → users)
- token (TEXT)
- jti (UUID, UNIQUE)
- refresh_token (TEXT)
- ip_address (VARCHAR 45)
- user_agent (TEXT)
- is_active (BOOLEAN)
- expires_at (DATE)
- last_activity (DATE)
- created_at
- updated_at
```

### Tabla: `login_attempts`
```sql
- id (PK)
- email (VARCHAR 100)
- ip_address (VARCHAR 45)
- user_agent (TEXT)
- success (BOOLEAN)
- attempted_at (DATE)
```

---

## 🔌 Nuevos Endpoints

### Autenticación Mejorada

#### `POST /api/auth/logout`
Cierra la sesión actual.
```javascript
Headers: { Authorization: 'Bearer <token>' }
Response: { message: 'Sesión cerrada correctamente' }
```

#### `POST /api/auth/refresh`
Renueva el token usando el refresh token.
```javascript
Body: { refreshToken: '<refresh_token>' }
Response: { 
  token: '<new_token>',
  refreshToken: '<new_refresh_token>',
  sessionId: '<session_id>'
}
```

#### `GET /api/auth/sessions`
Lista todas las sesiones activas del usuario.
```javascript
Headers: { Authorization: 'Bearer <token>' }
Response: { 
  sessions: [
    {
      id, ipAddress, userAgent, isActive,
      expiresAt, lastActivity, createdAt
    }
  ]
}
```

#### `DELETE /api/auth/sessions/:sessionId`
Revoca una sesión específica.
```javascript
Headers: { Authorization: 'Bearer <token>' }
Response: { message: 'Sesión revocada exitosamente' }
```

#### `POST /api/auth/logout-all`
Cierra todas las sesiones excepto la actual.
```javascript
Headers: { Authorization: 'Bearer <token>' }
Response: { 
  message: 'Sesiones cerradas exitosamente',
  sessionsClosed: <number>
}
```

---

## 🔧 Cambios en Endpoints Existentes

### `POST /api/auth/login`
Ahora retorna información adicional:
```javascript
Response: {
  message: 'Login exitoso',
  token: '<access_token>',
  refreshToken: '<refresh_token>',    // ← NUEVO
  sessionId: '<session_id>',           // ← NUEVO
  user: { ... }
}
```

### `POST /api/auth/register`
Ahora también incluye refresh token:
```javascript
Response: {
  message: 'Usuario registrado exitosamente',
  token: '<access_token>',
  refreshToken: '<refresh_token>',    // ← NUEVO
  sessionId: '<session_id>',          // ← NUEVO
  user: { ... }
}
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# JWT
JWT_SECRET=your_super_secret_key          # Cambiar en producción
JWT_EXPIRES_IN=24h                        # Duración token acceso
JWT_REFRESH_EXPIRES_IN=7d                 # Duración refresh token

# Seguridad
MAX_LOGIN_ATTEMPTS=5                      # Intentos antes de bloqueo
LOGIN_ATTEMPT_WINDOW=15                   # Ventana en minutos
MAX_SESSIONS_PER_USER=3                   # Sesiones máximas por usuario

# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgd_db
DB_USER=root
DB_PASSWORD=

# Servidor
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

---

## 🧪 Pruebas

### Ejecutar el Suite de Tests
```bash
# En terminal separada, asegurarse que el servidor esté corriendo
cd sgd-api
node server.js

# En otra terminal, ejecutar tests
node test-auth-enhanced.js
```

### Tests Incluidos
1. ✅ Registro de usuario
2. ✅ Login exitoso
3. ✅ Obtener perfil autenticado
4. ✅ Listar sesiones activas
5. ✅ Refresh token (renovar token)
6. ✅ Múltiples sesiones simultáneas
7. ✅ Revocar sesión específica
8. ✅ Logout de todas las sesiones excepto actual
9. ✅ Logout final
10. ✅ Rate limiting (protección brute force)

---

## 🚀 Uso en Frontend (Angular)

### Servicio de Autenticación

```typescript
// auth.service.ts
export class AuthService {
  private token$ = new BehaviorSubject<string | null>(null);
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  login(credentials: LoginData) {
    return this.http.post<LoginResponse>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          this.token$.next(response.token);
          this.refreshToken$.next(response.refreshToken);
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<RefreshResponse>('/api/auth/refresh', { refreshToken })
      .pipe(
        tap(response => {
          this.token$.next(response.token);
          this.refreshToken$.next(response.refreshToken);
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  getSessions() {
    return this.http.get<SessionsResponse>('/api/auth/sessions');
  }

  revokeSession(sessionId: number) {
    return this.http.delete(`/api/auth/sessions/${sessionId}`);
  }

  logout() {
    return this.http.post('/api/auth/logout', {})
      .pipe(
        tap(() => {
          this.token$.next(null);
          this.refreshToken$.next(null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        })
      );
  }

  logoutAll() {
    return this.http.post('/api/auth/logout-all', {});
  }
}
```

### HTTP Interceptor para Refresh Automático

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/refresh')) {
        // Token expirado, intentar refresh
        return authService.refreshAccessToken().pipe(
          switchMap(() => {
            // Reintentar request con nuevo token
            const newToken = authService.getToken();
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(clonedReq);
          }),
          catchError(refreshError => {
            // Refresh falló, redirigir a login
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

## 📊 Flujo de Autenticación

```
1. Usuario hace login
   ↓
2. Backend valida credenciales
   ↓
3. Backend crea sesión en DB con jti único
   ↓
4. Backend genera:
   - Access Token (24h) con jti en payload
   - Refresh Token (7d)
   ↓
5. Frontend almacena ambos tokens
   ↓
6. Cada request incluye Access Token
   ↓
7. Middleware valida:
   - Firma del JWT
   - Sesión activa en DB (usando jti)
   - Fecha de expiración
   - Usuario activo
   ↓
8. Actualiza last_activity en sesión
   ↓
9. Si token expira (401):
   - Frontend usa Refresh Token
   - Backend invalida sesión anterior
   - Backend crea nueva sesión
   - Frontend obtiene nuevos tokens
   ↓
10. Usuario hace logout:
    - Backend marca sesión como inactiva
    - Token ya no funciona aunque no haya expirado
```

---

## 🔐 Mejores Prácticas Implementadas

1. ✅ **Nunca exponer secrets en el código**
   - Usar `.env` para configuración sensible
   - Generar JWT_SECRET con `crypto.randomBytes(64)`

2. ✅ **Tokens con expiración corta**
   - Access token: 24 horas
   - Refresh token: 7 días
   - Balance entre seguridad y experiencia de usuario

3. ✅ **Sesiones revocables**
   - No confiar solo en JWT (stateless)
   - Validar sesión en BD en cada request
   - Permitir logout remoto

4. ✅ **Protección contra brute force**
   - Rate limiting en endpoints críticos
   - Registro de intentos fallidos
   - Bloqueo temporal por IP

5. ✅ **Auditoría completa**
   - Registrar IP y User-Agent
   - Historial de intentos de login
   - Timestamps en todas las operaciones

6. ✅ **Limpieza automática**
   - Sesiones expiradas se desactivan cada hora
   - Intentos de login antiguos se eliminan
   - Evita crecimiento indefinido de tablas

7. ✅ **Información contextual**
   - Usuario puede ver sus sesiones activas
   - Identificar dispositivos/ubicaciones
   - Revocar sesiones sospechosas

---

## 🛡️ Seguridad Adicional Recomendada

### Para Producción:

1. **HTTPS Obligatorio**
   ```javascript
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https') {
       res.redirect(`https://${req.header('host')}${req.url}`);
     } else {
       next();
     }
   });
   ```

2. **Helmet.js para Headers de Seguridad**
   ```bash
   npm install helmet
   ```
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

3. **CORS Restrictivo**
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE']
   }));
   ```

4. **Logging y Monitoreo**
   - Implementar Winston o Bunyan para logs
   - Monitorear intentos de login fallidos
   - Alertas en patrones sospechosos

5. **2FA (Autenticación de Dos Factores)**
   - Implementar TOTP (speakeasy + qrcode)
   - SMS o email como segundo factor
   - Backup codes para recuperación

---

## 📈 Métricas y Monitoreo

### Consultas SQL Útiles

```sql
-- Sesiones activas por usuario
SELECT u.username, COUNT(*) as active_sessions
FROM user_sessions us
JOIN users u ON u.id = us.user_id
WHERE us.is_active = true
GROUP BY u.id;

-- Intentos de login fallidos en la última hora
SELECT email, ip_address, COUNT(*) as attempts
FROM login_attempts
WHERE success = false 
  AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY email, ip_address
HAVING attempts >= 3;

-- Usuarios con múltiples sesiones activas
SELECT user_id, COUNT(*) as session_count
FROM user_sessions
WHERE is_active = true
  AND expires_at > NOW()
GROUP BY user_id
HAVING session_count > 2;

-- Sesiones expiradas pero aún marcadas como activas
SELECT COUNT(*) as expired_sessions
FROM user_sessions
WHERE is_active = true
  AND expires_at < NOW();
```

---

## 🚨 Troubleshooting

### Problema: "Token inválido" después de logout
**Solución:** El token fue correctamente invalidado. El usuario debe hacer login nuevamente.

### Problema: "Demasiados intentos de login"
**Solución:** Esperar 15 minutos o limpiar la tabla `login_attempts` manualmente.

### Problema: Sesiones no se limpian automáticamente
**Solución:** Verificar que el servicio `sessionCleanupService` esté iniciado en `server.js`.

### Problema: Refresh token no funciona
**Solución:** Verificar que:
1. El refresh token no haya expirado (7 días por defecto)
2. La sesión asociada esté activa en la base de datos
3. El usuario esté activo

---

## 📝 Próximos Pasos

### Funcionalidades Pendientes:

1. **Recuperación de Contraseña**
   - Endpoint `POST /api/auth/forgot-password`
   - Endpoint `POST /api/auth/reset-password`
   - Modelo `PasswordReset`
   - Integración con servicio de email

2. **Notificaciones por Email**
   - Email de bienvenida al registrarse
   - Email al crear nueva sesión
   - Email al cambiar contraseña
   - Email al cerrar todas las sesiones

3. **Dashboard de Administración**
   - Ver sesiones activas de todos los usuarios
   - Revocar sesiones administrativamente
   - Ver estadísticas de intentos de login
   - Bloquear/desbloquear usuarios

4. **2FA (Autenticación de Dos Factores)**
   - Configurar TOTP
   - Generar QR code
   - Verificar código de 6 dígitos
   - Backup codes

---

## 📚 Documentación Adicional

- [JWT Best Practices](https://auth0.com/blog/jwt-handbook/)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)

---

## 👨‍💻 Mantenimiento

### Actualizar Dependencias
```bash
npm outdated
npm update
npm audit fix
```

### Backup de Base de Datos
```bash
mysqldump -u root sgd_db > backup_sgd_$(date +%Y%m%d).sql
```

### Rotar JWT_SECRET
1. Generar nuevo secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Actualizar `.env`
3. Reiniciar servidor
4. **NOTA:** Esto invalidará todos los tokens existentes

---

## ✅ Checklist de Producción

- [ ] Cambiar `JWT_SECRET` a valor único y seguro
- [ ] Configurar `DB_PASSWORD` de producción
- [ ] Habilitar HTTPS
- [ ] Instalar y configurar Helmet.js
- [ ] Configurar CORS con dominio específico
- [ ] Implementar logging robusto (Winston/Bunyan)
- [ ] Configurar backup automático de BD
- [ ] Monitorear intentos de login fallidos
- [ ] Configurar alertas de seguridad
- [ ] Documentar procedimientos de incidentes
- [ ] Revisar y actualizar dependencias
- [ ] Ejecutar `npm audit` y resolver vulnerabilidades
- [ ] Configurar variables de entorno en servidor
- [ ] Probar recuperación ante fallos
- [ ] Implementar health checks
- [ ] Configurar rate limiting a nivel de infraestructura (nginx/cloudflare)

---

**Sistema de Autenticación Robusto ✅**  
**Listo para Producción 🚀**

