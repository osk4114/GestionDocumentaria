# ✅ CHECKLIST DE PRODUCCIÓN
## Sistema de Gestión Documentaria (SGD) v3.5

---

## 📋 PRE-DESPLIEGUE

### Verificación de Código
- [ ] Ejecutar script de validación: `node pre-deploy-check.js`
- [ ] Todos los tests pasan sin errores
- [ ] No hay errores en logs de desarrollo
- [ ] Código commitado y pusheado a repositorio
- [ ] Branch `main` actualizado
- [ ] Tag de versión creado: `git tag v3.5.0`

### Documentación
- [ ] README.md actualizado
- [ ] DEPLOY.md revisado y completo
- [ ] `.env.example` actualizado con todas las variables
- [ ] Comentarios de código actualizados
- [ ] Changelog documentado

### Base de Datos
- [ ] Script `init-database.sql` probado en ambiente limpio
- [ ] Versión 3.5 confirmada (16 tablas, 124 permisos)
- [ ] Migraciones de versiones anteriores documentadas
- [ ] Backup del esquema actual realizado

---

## 🖥️ SERVIDOR

### Infraestructura
- [ ] Servidor provisionado con specs mínimas
  - [ ] CPU: 2+ cores
  - [ ] RAM: 4+ GB
  - [ ] Disco: 50+ GB SSD
  - [ ] Ancho de banda: 10+ Mbps
- [ ] Sistema operativo instalado (Ubuntu 20.04+ / Windows Server 2019+)
- [ ] Acceso SSH/RDP configurado
- [ ] Permisos de administrador confirmados

### Software Base
- [ ] Node.js v18+ instalado
- [ ] MySQL 8.0+ instalado y corriendo
- [ ] Nginx instalado y corriendo
- [ ] PM2 instalado globalmente
- [ ] Git instalado
- [ ] Certbot instalado (para SSL)

### Firewall
- [ ] UFW/Windows Firewall habilitado
- [ ] Puerto 22 (SSH) abierto
- [ ] Puerto 80 (HTTP) abierto
- [ ] Puerto 443 (HTTPS) abierto
- [ ] Puerto 3000 bloqueado externamente (solo localhost)
- [ ] Puerto 3306 (MySQL) bloqueado externamente

---

## 🗄️ BASE DE DATOS

### Instalación MySQL
- [ ] MySQL Server instalado
- [ ] Servicio MySQL corriendo
- [ ] `mysql_secure_installation` ejecutado
- [ ] Password de root configurado

### Usuario y Base de Datos
- [ ] Usuario `summer4114` creado
- [ ] Password seguro configurado (16+ caracteres)
- [ ] Base de datos `sgd_db` creada
- [ ] Character set: `utf8mb4`
- [ ] Collation: `utf8mb4_unicode_ci`
- [ ] Permisos GRANT otorgados

### Estructura
- [ ] Script `init-database.sql` importado
- [ ] 16 tablas creadas correctamente
  - [ ] users, roles, role_permissions, permissions
  - [ ] areas, area_categories
  - [ ] documents, document_types, document_statuses
  - [ ] document_movements, document_versions, document_cargos
  - [ ] attachments, priorities
  - [ ] login_attempts, user_sessions
- [ ] 124 permisos insertados
- [ ] 4 roles creados
- [ ] 7 áreas iniciales creadas
- [ ] 6 estados de documento creados
- [ ] 3 prioridades creadas

### Usuario Administrador
- [ ] Script `create-admin.js` ejecutado exitosamente
- [ ] Usuario administrador creado en base de datos
- [ ] Email: `admin@sgd.gob.pe` (default)
- [ ] Password temporal: `Admin123!`
- [ ] ⚠️ **CRÍTICO:** Contraseña cambiada después del primer login
- [ ] Rol: Administrador (rol_id = 1)
- [ ] Área: NULL (acceso global confirmado)
- [ ] Login probado exitosamente en frontend
- [ ] Permisos completos verificados (124 permisos)

### Optimización
- [ ] `max_connections` configurado (200)
- [ ] `innodb_buffer_pool_size` configurado (1G)
- [ ] `innodb_log_file_size` configurado (256M)
- [ ] Logs de slow queries habilitados

---

## 🚀 BACKEND

### Código
- [ ] Código clonado en `/var/www/sgd`
- [ ] Branch correcto: `main`
- [ ] Versión correcta: v3.5
- [ ] Permisos de directorio configurados

### Dependencias
- [ ] `npm install --production` ejecutado
- [ ] `node_modules/` creado
- [ ] Sin errores de instalación
- [ ] Dependencias críticas verificadas:
  - [ ] express
  - [ ] sequelize
  - [ ] mysql2
  - [ ] jsonwebtoken
  - [ ] bcryptjs
  - [ ] socket.io
  - [ ] multer
  - [ ] dotenv
  - [ ] cors

### Configuración .env
- [ ] Archivo `.env` creado (copiado de `.env.example`)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `JWT_SECRET` generado (64+ caracteres aleatorios)
- [ ] `JWT_REFRESH_SECRET` generado (diferente de JWT_SECRET)
- [ ] `JWT_EXPIRES_IN=24h`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `DB_HOST=localhost`
- [ ] `DB_PORT=3306`
- [ ] `DB_NAME=sgd_db`
- [ ] `DB_USER=summer4114`
- [ ] `DB_PASSWORD=` (password real del usuario)
- [ ] `FRONTEND_URL=` (URL de producción)
- [ ] `CORS_ORIGIN=` (URL de producción)
- [ ] `CORS_CREDENTIALS=true`
- [ ] `UPLOAD_PATH=./uploads`
- [ ] `MAX_FILE_SIZE=10`
- [ ] `ALLOWED_FILE_TYPES=` (configurado)
- [ ] `EMAIL_HOST=` (SMTP configurado)
- [ ] `EMAIL_USER=` (email configurado)
- [ ] `EMAIL_PASSWORD=` (password de aplicación)
- [ ] `EMAIL_FROM=noreply@drtcpuno.gob.pe`
- [ ] `MAX_LOGIN_ATTEMPTS=5`
- [ ] `BCRYPT_ROUNDS=10`
- [ ] `LOG_LEVEL=info`

### Directorios
- [ ] Directorio `uploads/` creado
- [ ] Directorio `logs/` creado
- [ ] Permisos 775 en `uploads/`
- [ ] Permisos 775 en `logs/`
- [ ] Test de escritura en `uploads/` exitoso
- [ ] Test de escritura en `logs/` exitoso

### PM2
- [ ] Archivo `ecosystem.config.js` creado
- [ ] Configuración de cluster (2 instancias)
- [ ] Max memory restart: 500M
- [ ] Autorestart: true
- [ ] Error logs: `./logs/pm2-error.log`
- [ ] Out logs: `./logs/pm2-out.log`
- [ ] Aplicación iniciada: `pm2 start ecosystem.config.js`
- [ ] Status verificado: `pm2 status`
- [ ] Logs sin errores: `pm2 logs`
- [ ] Configuración guardada: `pm2 save`
- [ ] Startup configurado: `pm2 startup`

### Pruebas Backend
- [ ] Endpoint de salud responde: `/api/health`
- [ ] Login funciona: `POST /api/auth/login`
- [ ] JWT se genera correctamente
- [ ] Refresh token funciona
- [ ] Middleware de autenticación funciona
- [ ] WebSocket conecta: `socket.io`
- [ ] Base de datos conecta sin errores

---

## 🌐 FRONTEND

### Build
- [ ] Directorio `sgd-frontend/` existe
- [ ] `npm install` ejecutado en frontend
- [ ] `environment.prod.ts` configurado:
  - [ ] `production: true`
  - [ ] `apiUrl` apunta a URL real
  - [ ] `socketUrl` apunta a URL real
- [ ] Build ejecutado: `npm run build --configuration=production`
- [ ] Directorio `dist/` creado
- [ ] Sin errores de compilación
- [ ] Bundle size verificado (< 5MB recomendado)

### Despliegue
- [ ] Directorio `/var/www/sgd-frontend` creado
- [ ] Archivos copiados desde `dist/sgd-frontend/browser/`
- [ ] Permisos establecidos: `www-data:www-data`
- [ ] Permisos 755 en todos los archivos
- [ ] `index.html` accesible

---

## 🔧 NGINX

### Instalación
- [ ] Nginx instalado
- [ ] Servicio corriendo: `systemctl status nginx`
- [ ] Inicio automático habilitado
- [ ] Página de bienvenida accesible

### Configuración Backend (API)
- [ ] Archivo `/etc/nginx/sites-available/sgd` creado
- [ ] Server name: `api.tudominio.gob.pe`
- [ ] Proxy pass: `http://localhost:3000`
- [ ] Headers de proxy configurados
- [ ] WebSocket headers configurados
- [ ] Location `/socket.io/` configurado
- [ ] Location `/uploads/` configurado
- [ ] `client_max_body_size` 20M
- [ ] Rate limiting configurado
- [ ] Timeouts configurados (60s)

### Configuración Frontend
- [ ] Server name: `tudominio.gob.pe www.tudominio.gob.pe`
- [ ] Root: `/var/www/sgd-frontend`
- [ ] Index: `index.html`
- [ ] Gzip habilitado
- [ ] Cache de archivos estáticos configurado
- [ ] Angular routing configurado (`try_files`)
- [ ] Headers de seguridad agregados:
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block

### Activación
- [ ] Symlink creado: `/etc/nginx/sites-enabled/sgd`
- [ ] Configuración probada: `nginx -t`
- [ ] Sin errores de sintaxis
- [ ] Nginx reiniciado: `systemctl restart nginx`

---

## 🔒 SEGURIDAD

### SSL/HTTPS
- [ ] Dominio apuntando al servidor (DNS configurado)
- [ ] Certbot instalado
- [ ] Certificados obtenidos para:
  - [ ] `tudominio.gob.pe`
  - [ ] `www.tudominio.gob.pe`
  - [ ] `api.tudominio.gob.pe`
- [ ] HTTP redirige a HTTPS automáticamente
- [ ] Certificados válidos (verificar con navegador)
- [ ] Renovación automática configurada
- [ ] Test de renovación exitoso: `certbot renew --dry-run`

### Fail2Ban
- [ ] Fail2Ban instalado
- [ ] Configuración `/etc/fail2ban/jail.local` creada
- [ ] Jail `nginx-http-auth` habilitado
- [ ] Jail `nginx-limit-req` habilitado
- [ ] Jail `sshd` habilitado
- [ ] Ban time: 3600 segundos
- [ ] Max retry: 5
- [ ] Servicio corriendo: `systemctl status fail2ban`

### Archivos Sensibles
- [ ] Archivo `.env` con permisos 600
- [ ] `.env` en `.gitignore`
- [ ] `.env` NO en repositorio Git
- [ ] Directorio `uploads/` en `.gitignore`
- [ ] Directorio `node_modules/` en `.gitignore`
- [ ] Archivos `*.pem`, `*.key` en `.gitignore`

### Contraseñas
- [ ] Password de root MySQL cambiado
- [ ] Password de `summer4114` configurado correctamente
- [ ] Password de admin cambiado del default
- [ ] `JWT_SECRET` aleatorio (64+ caracteres)
- [ ] `JWT_REFRESH_SECRET` diferente de JWT_SECRET
- [ ] Password de email configurado (app password)

---

## 📊 MONITOREO

### Logs
- [ ] PM2 logs configurados
- [ ] Nginx access logs habilitados
- [ ] Nginx error logs habilitados
- [ ] MySQL slow query logs habilitados
- [ ] Aplicación logs en `/var/www/sgd/logs/`
- [ ] Rotación de logs configurada

### PM2 Monitoring
- [ ] `pm2 monit` funciona
- [ ] `pm2 status` muestra app corriendo
- [ ] CPU usage < 50% en idle
- [ ] Memory usage < 300MB en idle
- [ ] (Opcional) PM2 Plus configurado

### Health Checks
- [ ] Endpoint `/api/health` responde 200
- [ ] Response time < 100ms
- [ ] Base de datos responde en health check

---

## 💾 BACKUP

### Script de Backup
- [ ] Directorio `/var/backups/sgd` creado
- [ ] Script `/usr/local/bin/backup-sgd.sh` creado
- [ ] Permisos de ejecución: `chmod +x`
- [ ] Backup de base de datos funciona
- [ ] Backup de archivos `uploads/` funciona
- [ ] Backup de configuración funciona
- [ ] Test manual exitoso

### Cron Job
- [ ] Crontab configurado: `crontab -e`
- [ ] Backup diario programado (2:00 AM)
- [ ] Log de backups configurado
- [ ] Retención: 30 días
- [ ] Script de limpieza de backups antiguos funciona

### Restauración
- [ ] Proceso de restauración documentado
- [ ] Test de restauración realizado
- [ ] Restauración de DB funciona
- [ ] Restauración de archivos funciona

---

## 🧪 TESTING EN PRODUCCIÓN

### Tests Funcionales
- [ ] Landing page carga correctamente
- [ ] Login funciona con usuario admin
- [ ] Dashboard se muestra sin errores
- [ ] Mesa de Partes Virtual funciona
  - [ ] Formulario carga
  - [ ] Validaciones funcionan
  - [ ] Submit exitoso
  - [ ] Email de confirmación enviado
- [ ] Seguimiento público funciona
  - [ ] Búsqueda por código funciona
  - [ ] Información se muestra correctamente
- [ ] Derivación de documentos funciona
  - [ ] Lista de áreas carga
  - [ ] Derivación exitosa
  - [ ] Movimiento registrado
- [ ] Upload de archivos funciona
  - [ ] PDF sube correctamente
  - [ ] Word sube correctamente
  - [ ] Excel sube correctamente
  - [ ] Límite de 10MB respetado
- [ ] WebSocket funciona
  - [ ] Notificaciones en tiempo real
  - [ ] Reconexión automática
- [ ] Gestión de sesiones funciona
  - [ ] Ver sesiones activas
  - [ ] Cerrar sesión específica
  - [ ] Cerrar todas las sesiones

### Tests de Seguridad
- [ ] HTTPS funciona (candado verde)
- [ ] Certificado SSL válido
- [ ] Redirect HTTP → HTTPS funciona
- [ ] CORS configurado correctamente
- [ ] No se puede acceder sin JWT
- [ ] JWT expira correctamente
- [ ] Rate limiting funciona
- [ ] SQL injection bloqueado
- [ ] XSS bloqueado
- [ ] Headers de seguridad presentes

### Tests de Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] API response time < 200ms
- [ ] WebSocket latency < 100ms
- [ ] Upload de 10MB < 5 segundos
- [ ] 10 usuarios concurrentes sin problemas
- [ ] Uso de CPU < 70% bajo carga
- [ ] Uso de RAM < 60% bajo carga

---

## 📱 ACCESIBILIDAD Y UX

### Navegadores
- [ ] Chrome/Edge funciona
- [ ] Firefox funciona
- [ ] Safari funciona (si aplica)
- [ ] Responsive en móvil
- [ ] Responsive en tablet

### Compatibilidad
- [ ] Todas las funciones operativas
- [ ] Sin errores en consola
- [ ] Sin warnings críticos
- [ ] Diseño consistente

---

## 📞 POST-DESPLIEGUE

### Comunicación
- [ ] Equipo notificado del despliegue
- [ ] URL de producción compartida
- [ ] Credenciales de admin compartidas (de forma segura)
- [ ] Documentación compartida

### Capacitación
- [ ] Manual de usuario entregado
- [ ] Capacitación programada
- [ ] Soporte técnico disponible

### Monitoreo Inicial
- [ ] Monitoreo activo primeras 24 horas
- [ ] Logs revisados cada hora
- [ ] Errores documentados
- [ ] Issues reportados

---

## 🎯 CRITERIOS DE ÉXITO

### Técnicos
- ✅ Sistema accesible 24/7
- ✅ Uptime > 99%
- ✅ Response time < 200ms
- ✅ Sin errores críticos en logs
- ✅ Backups diarios exitosos

### Funcionales
- ✅ Usuarios pueden presentar documentos
- ✅ Usuarios pueden consultar estado
- ✅ Personal puede derivar documentos
- ✅ Notificaciones funcionan
- ✅ Reportes generan correctamente

### Seguridad
- ✅ HTTPS activo y válido
- ✅ No hay vulnerabilidades conocidas
- ✅ Acceso controlado por roles
- ✅ Datos sensibles encriptados
- ✅ Logs de auditoría activos

---

## 📝 NOTAS FINALES

**Versión del Sistema:** 3.5  
**Fecha de Despliegue:** _____________  
**Responsable:** _____________  
**Aprobado por:** _____________  

**Observaciones:**
```
_________________________________________________________
_________________________________________________________
_________________________________________________________
```

---

## 🚨 ROLLBACK PLAN

En caso de problemas críticos:

1. **Detener PM2:**
   ```bash
   pm2 stop sgd-backend
   ```

2. **Restaurar Backup:**
   ```bash
   gunzip < /var/backups/sgd/db_[fecha].sql.gz | mysql -u summer4114 -p sgd_db
   ```

3. **Revertir Nginx:**
   ```bash
   sudo rm /etc/nginx/sites-enabled/sgd
   sudo systemctl restart nginx
   ```

4. **Notificar Stakeholders**

5. **Analizar Logs:**
   ```bash
   pm2 logs sgd-backend --err --lines 500
   ```

---

**✅ CHECKLIST COMPLETO = PRODUCCIÓN EXITOSA** 🎉
