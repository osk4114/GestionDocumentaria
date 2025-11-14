# 🚀 GUÍA DE DESPLIEGUE A PRODUCCIÓN
## Sistema de Gestión Documentaria (SGD) - DRTC Puno

![Versión](https://img.shields.io/badge/Versión-3.5-blue)
![Estado](https://img.shields.io/badge/Estado-Production%20Ready-green)

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#-requisitos-previos)
2. [Preparación del Servidor](#-preparación-del-servidor)
3. [Configuración de Base de Datos](#-configuración-de-base-de-datos)
4. [Despliegue del Backend](#-despliegue-del-backend)
5. [Despliegue del Frontend](#-despliegue-del-frontend)
6. [Configuración de Seguridad](#-configuración-de-seguridad)
7. [Configuración de Dominio y SSL](#-configuración-de-dominio-y-ssl)
8. [Monitoreo y Logs](#-monitoreo-y-logs)
9. [Backup y Recuperación](#-backup-y-recuperación)
10. [Troubleshooting](#-troubleshooting)

---

## 📌 REQUISITOS PREVIOS

### Hardware Mínimo Recomendado
- **CPU:** 2 cores (4 cores recomendado)
- **RAM:** 4 GB (8 GB recomendado)
- **Almacenamiento:** 50 GB SSD
- **Ancho de banda:** 10 Mbps

### Software Requerido
- **Sistema Operativo:** Ubuntu 20.04 LTS o superior / Windows Server 2019+
- **Node.js:** v18.x o superior
- **MySQL:** 8.0 o superior
- **Nginx:** 1.18 o superior (para proxy reverso)
- **PM2:** Para gestión de procesos Node.js
- **Git:** Para control de versiones

### Accesos Necesarios
- [ ] Servidor con acceso SSH/RDP
- [ ] Permisos de administrador/root
- [ ] Dominio configurado (opcional pero recomendado)
- [ ] Cuenta de correo SMTP para notificaciones
- [ ] Certificado SSL (Let's Encrypt recomendado)

---

## 🖥️ PREPARACIÓN DEL SERVIDOR

### 1. Actualizar el Sistema (Ubuntu/Debian)

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js 18.x

```bash
# Agregar repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x
npm --version
```

### 3. Instalar MySQL 8.0

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Iniciar servicio
sudo systemctl start mysql
sudo systemctl enable mysql

# Configuración inicial de seguridad
sudo mysql_secure_installation
```

**Opciones recomendadas:**
- Set root password: **SÍ** (usar contraseña fuerte)
- Remove anonymous users: **SÍ**
- Disallow root login remotely: **SÍ**
- Remove test database: **SÍ**
- Reload privilege tables: **SÍ**

### 4. Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Configurar PM2 para inicio automático
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

### 5. Instalar Nginx

```bash
sudo apt install -y nginx

# Iniciar servicio
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar
sudo systemctl status nginx
```

### 6. Instalar Git

```bash
sudo apt install -y git
git --version
```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### 1. Crear Usuario de Base de Datos

```bash
# Conectar a MySQL como root
sudo mysql -u root -p
```

```sql
-- Crear usuario para la aplicación
CREATE USER 'summer4114'@'localhost' IDENTIFIED BY 'screamer-1';

-- Crear base de datos
CREATE DATABASE sgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Otorgar permisos
GRANT ALL PRIVILEGES ON sgd_db.* TO 'summer4114'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'summer4114';

-- Salir
EXIT;
```

### 2. Importar Estructura de Base de Datos

```bash
# Clonar el repositorio (o subir archivos por FTP/SCP)
cd /var/www
sudo git clone https://github.com/osk4114/GestionDocumentaria.git sgd
cd sgd

# Importar estructura
mysql -u summer4114 -p sgd_db < config/init-database.sql
```

### 3. Crear Usuario Administrador

⚠️ **PASO CRÍTICO**: Después de importar la base de datos, debes crear el usuario administrador.

**Opción 1: Script Node.js (RECOMENDADO)**

```bash
# Instalar dependencias primero
npm install

# Ejecutar script de creación de admin
node create-admin.js
```

Esto creará el usuario con:
- **Email:** `admin@sgd.gob.pe`
- **Password:** `Admin123!`

⚠️ **CAMBIAR LA CONTRASEÑA INMEDIATAMENTE** después del primer login.

**Opción 2: SQL directo**

```bash
mysql -u summer4114 -p sgd_db < config/create-admin.sql
```

### 4. Verificar Importación

```bash
mysql -u summer4114 -p sgd_db
```

```sql
-- Verificar tablas
SHOW TABLES;

-- Debe mostrar 16 tablas:
-- areas, area_categories, roles, role_permissions, permissions,
-- users, document_types, document_statuses, priorities,
-- documents, document_movements, document_versions, document_cargos,
-- attachments, login_attempts, user_sessions

-- Verificar datos iniciales
SELECT COUNT(*) FROM permissions;  -- Debe ser 124
SELECT COUNT(*) FROM roles;        -- Debe ser 1 (solo Administrador)
SELECT COUNT(*) FROM areas;        -- Debe ser 5
SELECT COUNT(*) FROM users;        -- Debe ser 1 (administrador)

-- Verificar usuario administrador
SELECT id, nombre, email, is_active FROM users;

EXIT;
```

### 4. Optimizar MySQL para Producción

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Agregar/modificar:

```ini
[mysqld]
# Optimizaciones
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 0
query_cache_type = 0

# Logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

```bash
# Reiniciar MySQL
sudo systemctl restart mysql
```

---

## 🚀 DESPLIEGUE DEL BACKEND

### 1. Preparar Aplicación

```bash
cd /var/www/sgd

# Instalar dependencias de producción
npm install --production

# Crear directorios necesarios
mkdir -p uploads logs

# Establecer permisos
sudo chown -R $USER:$USER /var/www/sgd
chmod -R 755 /var/www/sgd
chmod -R 775 uploads logs
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con valores de producción
nano .env
```

**Contenido del .env (COMPLETAR TODOS LOS VALORES):**

```env
# ============================================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================================
NODE_ENV=production
PORT=3000

# ============================================================
# CONFIGURACIÓN DE SEGURIDAD JWT
# ============================================================
# Generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=PEGAR_SECRETO_GENERADO_AQUI
JWT_REFRESH_SECRET=PEGAR_OTRO_SECRETO_DIFERENTE_AQUI
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgd_db
DB_USER=summer4114
DB_PASSWORD=screamer-1

# ============================================================
# CONFIGURACIÓN DE CORS Y FRONTEND
# ============================================================
FRONTEND_URL=https://tudominio.gob.pe
CORS_ORIGIN=https://tudominio.gob.pe
CORS_CREDENTIALS=true

# ============================================================
# CONFIGURACIÓN DE ARCHIVOS
# ============================================================
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10
MAX_FILE_SIZE_BYTES=10485760
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/jpg,image/png

# ============================================================
# CONFIGURACIÓN DE SEGURIDAD
# ============================================================
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW=15
MAX_SESSIONS_PER_USER=3
BCRYPT_ROUNDS=10

# ============================================================
# CONFIGURACIÓN DE EMAIL
# ============================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASSWORD=password_aplicacion_gmail
EMAIL_FROM=noreply@drtcpuno.gob.pe
EMAIL_FROM_NAME=Sistema de Gestión Documentaria - DRTC Puno

# ============================================================
# CONFIGURACIÓN DE LOGS
# ============================================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=7d
```

### 3. Generar Secretos JWT

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar JWT_REFRESH_SECRET (ejecutar de nuevo)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copiar los valores generados y pegarlos en .env
```

### 4. Crear Usuario Administrador

```bash
node setup-test-user.js
```

O crear manualmente en MySQL:

```sql
USE sgd_db;

-- Hash de "Admin2025!" generado con bcrypt (10 rounds)
-- Cambiarlo con: node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"
INSERT INTO users (nombre, apellido, email, password, rol_id, area_id, dni, telefono, is_active, created_at, updated_at) 
VALUES (
  'Administrador',
  'Sistema',
  'admin@drtcpuno.gob.pe',
  '$2a$10$ejemplo...', -- CAMBIAR por hash real
  1, -- rol_id = 1 (Administrador)
  1, -- area_id = 1 (Dirección Regional)
  '99999999',
  '999999999',
  1,
  NOW(),
  NOW()
);
```

### 5. Probar Aplicación Localmente

```bash
# Probar inicio
node server.js

# Verificar en otro terminal
curl http://localhost:3000/api/health

# Si funciona, detener con Ctrl+C
```

### 6. Configurar PM2

```bash
# Crear archivo de configuración PM2
nano ecosystem.config.js
```

**Contenido:**

```javascript
module.exports = {
  apps: [{
    name: 'sgd-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 7. Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs en tiempo real
pm2 logs sgd-backend

# Guardar configuración
pm2 save

# Verificar inicio automático
pm2 startup
```

---

## 🌐 DESPLIEGUE DEL FRONTEND

### 1. Preparar Frontend Angular

```bash
cd /var/www/sgd/sgd-frontend

# Instalar dependencias
npm install

# Configurar API URL para producción
nano src/environments/environment.prod.ts
```

**Contenido:**

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.gob.pe/api',
  socketUrl: 'https://api.tudominio.gob.pe'
};
```

### 2. Compilar para Producción

```bash
# Build optimizado
npm run build --configuration=production

# El output estará en: dist/sgd-frontend/browser/
```

### 3. Copiar a Directorio Web

```bash
# Crear directorio para frontend
sudo mkdir -p /var/www/sgd-frontend

# Copiar archivos compilados
sudo cp -r dist/sgd-frontend/browser/* /var/www/sgd-frontend/

# Establecer permisos
sudo chown -R www-data:www-data /var/www/sgd-frontend
sudo chmod -R 755 /var/www/sgd-frontend
```

---

## 🔒 CONFIGURACIÓN DE SEGURIDAD

### 1. Configurar Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar reglas
sudo ufw status
```

### 2. Configurar Nginx como Proxy Reverso

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/sgd
```

**Contenido:**

```nginx
# Backend API
server {
    listen 80;
    server_name api.tudominio.gob.pe;

    # Logs
    access_log /var/log/nginx/sgd-api-access.log;
    error_log /var/log/nginx/sgd-api-error.log;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Proxy a Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket específico
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Archivos subidos
    location /uploads/ {
        alias /var/www/sgd/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Límites de tamaño
    client_max_body_size 20M;
}

# Frontend
server {
    listen 80;
    server_name tudominio.gob.pe www.tudominio.gob.pe;

    root /var/www/sgd-frontend;
    index index.html;

    # Logs
    access_log /var/log/nginx/sgd-frontend-access.log;
    error_log /var/log/nginx/sgd-frontend-error.log;

    # Comprimir archivos
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache de archivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Angular routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3. Activar Configuración Nginx

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/sgd /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4. Fail2Ban (Protección contra ataques)

```bash
# Instalar Fail2Ban
sudo apt install -y fail2ban

# Crear configuración para Nginx
sudo nano /etc/fail2ban/jail.local
```

**Contenido:**

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log
maxretry = 10

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
```

```bash
# Reiniciar Fail2Ban
sudo systemctl restart fail2ban

# Ver status
sudo fail2ban-client status
```

---

## 🔐 CONFIGURACIÓN DE DOMINIO Y SSL

### 1. Configurar DNS

En tu proveedor de dominio (ej: NIC.PE), crear registros:

```
A     @                 192.168.1.100   # IP del servidor
A     www               192.168.1.100
A     api               192.168.1.100
CNAME www               tudominio.gob.pe
```

### 2. Instalar Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificados SSL
sudo certbot --nginx -d tudominio.gob.pe -d www.tudominio.gob.pe -d api.tudominio.gob.pe

# Seguir las instrucciones:
# - Ingresar email
# - Aceptar términos
# - Elegir: Redirect HTTP to HTTPS (opción 2)
```

### 3. Renovación Automática

```bash
# Probar renovación
sudo certbot renew --dry-run

# Certbot crea un cron job automático, verificar:
sudo systemctl status certbot.timer
```

---

## 📊 MONITOREO Y LOGS

### 1. Ver Logs de la Aplicación

```bash
# Logs de PM2
pm2 logs sgd-backend

# Logs específicos
pm2 logs sgd-backend --lines 100

# Logs de errores solamente
pm2 logs sgd-backend --err

# Logs de aplicación
tail -f /var/www/sgd/logs/app.log
```

### 2. Ver Logs de Nginx

```bash
# Access log
tail -f /var/log/nginx/sgd-api-access.log

# Error log
tail -f /var/log/nginx/sgd-api-error.log
```

### 3. Ver Logs de MySQL

```bash
# Error log
sudo tail -f /var/log/mysql/error.log

# Slow query log
sudo tail -f /var/log/mysql/slow-query.log
```

### 4. Monitoreo con PM2

```bash
# Dashboard interactivo
pm2 monit

# Información detallada
pm2 show sgd-backend

# Uso de recursos
pm2 list
```

### 5. Configurar PM2 Plus (Opcional)

```bash
# Crear cuenta en https://pm2.io
# Conectar servidor
pm2 link [SECRET_KEY] [PUBLIC_KEY]

# Ahora puedes monitorear desde https://app.pm2.io
```

---

## 💾 BACKUP Y RECUPERACIÓN

### 1. Script de Backup Automático

```bash
# Crear directorio de backups
sudo mkdir -p /var/backups/sgd

# Crear script de backup
sudo nano /usr/local/bin/backup-sgd.sh
```

**Contenido:**

```bash
#!/bin/bash

# Configuración
BACKUP_DIR="/var/backups/sgd"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sgd_db"
DB_USER="summer4114"
DB_PASS="screamer-1"

# Crear backup de base de datos
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos subidos
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/sgd uploads/

# Backup de configuración
tar -czf $BACKUP_DIR/config_$DATE.tar.gz -C /var/www/sgd .env ecosystem.config.js

# Eliminar backups mayores a 30 días
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

```bash
# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/backup-sgd.sh

# Probar script
sudo /usr/local/bin/backup-sgd.sh
```

### 2. Programar Backup Automático (Cron)

```bash
# Editar crontab
sudo crontab -e
```

**Agregar línea:**

```cron
# Backup diario a las 2:00 AM
0 2 * * * /usr/local/bin/backup-sgd.sh >> /var/log/sgd-backup.log 2>&1
```

### 3. Restaurar desde Backup

```bash
# Restaurar base de datos
gunzip < /var/backups/sgd/db_20250113_020000.sql.gz | mysql -u summer4114 -p sgd_db

# Restaurar archivos
cd /var/www/sgd
tar -xzf /var/backups/sgd/uploads_20250113_020000.tar.gz

# Restaurar configuración
tar -xzf /var/backups/sgd/config_20250113_020000.tar.gz

# Reiniciar aplicación
pm2 restart sgd-backend
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: La aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs sgd-backend --err

# Verificar puerto en uso
sudo lsof -i :3000

# Verificar variables de entorno
cd /var/www/sgd
cat .env

# Probar inicio manual
node server.js
```

### Problema 2: Error de conexión a base de datos

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Probar conexión
mysql -u sgd_user -p sgd_db

# Verificar credenciales en .env
grep DB_ /var/www/sgd/.env

# Ver logs de MySQL
sudo tail -f /var/log/mysql/error.log
```

### Problema 3: 502 Bad Gateway (Nginx)

```bash
# Verificar que la app esté corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/sgd-api-error.log

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar servicios
pm2 restart sgd-backend
sudo systemctl restart nginx
```

### Problema 4: Uploads no funcionan

```bash
# Verificar permisos
ls -la /var/www/sgd/uploads

# Corregir permisos
sudo chown -R $USER:$USER /var/www/sgd/uploads
chmod -R 775 /var/www/sgd/uploads

# Verificar configuración en .env
grep UPLOAD /var/www/sgd/.env

# Verificar límite en Nginx
grep client_max_body_size /etc/nginx/sites-available/sgd
```

### Problema 5: WebSocket no conecta

```bash
# Verificar logs de Socket.IO
pm2 logs sgd-backend | grep socket

# Verificar configuración CORS en .env
grep CORS /var/www/sgd/.env

# Verificar configuración de Nginx
grep "location /socket.io/" /etc/nginx/sites-available/sgd

# Probar conexión directa (sin proxy)
curl http://localhost:3000/socket.io/
```

### Problema 6: Aplicación consume mucha memoria

```bash
# Ver uso de recursos
pm2 monit

# Ver procesos
top

# Reiniciar con límite de memoria
pm2 restart sgd-backend --max-memory-restart 500M

# Limpiar caché de PM2
pm2 flush
```

---

## ✅ CHECKLIST FINAL DE PRODUCCIÓN

### Pre-Despliegue

- [ ] Servidor configurado con specs mínimas
- [ ] Node.js v18+ instalado
- [ ] MySQL 8.0+ instalado y configurado
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] Firewall (UFW) activado
- [ ] Fail2Ban configurado

### Base de Datos

- [ ] Usuario de base de datos creado
- [ ] Base de datos `sgd_db` creada
- [ ] Script `init-database.sql` ejecutado
- [ ] 16 tablas creadas correctamente
- [ ] 124 permisos insertados
- [ ] Usuario administrador creado
- [ ] Backup automático configurado

### Backend

- [ ] Código clonado en `/var/www/sgd`
- [ ] Dependencias instaladas (`npm install --production`)
- [ ] Archivo `.env` configurado con valores reales
- [ ] JWT_SECRET y JWT_REFRESH_SECRET generados (64+ caracteres)
- [ ] Directorios `uploads/` y `logs/` creados con permisos
- [ ] Aplicación inicia correctamente con `node server.js`
- [ ] PM2 configurado y aplicación corriendo
- [ ] PM2 configurado para inicio automático

### Frontend

- [ ] Build de producción generado
- [ ] `environment.prod.ts` configurado con URL correcta
- [ ] Archivos copiados a `/var/www/sgd-frontend`
- [ ] Permisos configurados (www-data)

### Nginx

- [ ] Configuración creada en `/etc/nginx/sites-available/sgd`
- [ ] Symlink creado en `/etc/nginx/sites-enabled/`
- [ ] Proxy reverso configurado para backend
- [ ] Configuración de frontend con routing Angular
- [ ] Límites de upload configurados (20MB)
- [ ] Comprensión gzip habilitada
- [ ] Cache de archivos estáticos configurado
- [ ] Configuración probada (`nginx -t`)
- [ ] Nginx reiniciado

### Seguridad

- [ ] Firewall UFW configurado (SSH, HTTP, HTTPS)
- [ ] Fail2Ban configurado y activo
- [ ] JWT secrets generados aleatoriamente
- [ ] Contraseñas de base de datos fuertes
- [ ] `.env` con permisos restrictivos (600)
- [ ] `.gitignore` actualizado
- [ ] Headers de seguridad en Nginx

### SSL/HTTPS

- [ ] Dominio apuntando al servidor (DNS)
- [ ] Certbot instalado
- [ ] Certificados SSL obtenidos
- [ ] HTTP redirige a HTTPS
- [ ] Renovación automática configurada

### Monitoreo

- [ ] Logs de PM2 funcionando
- [ ] Logs de Nginx configurados
- [ ] Logs de aplicación funcionando
- [ ] PM2 monit accesible
- [ ] (Opcional) PM2 Plus configurado

### Backup

- [ ] Script de backup creado
- [ ] Cron job de backup configurado
- [ ] Backup manual probado
- [ ] Restauración probada

### Testing Final

- [ ] Endpoint de salud responde: `curl https://api.tudominio.gob.pe/api/health`
- [ ] Login funciona desde frontend
- [ ] Presentación de documentos funciona
- [ ] Consulta pública funciona
- [ ] Derivación de documentos funciona
- [ ] Upload de archivos funciona
- [ ] WebSocket conecta correctamente
- [ ] Notificaciones en tiempo real funcionan
- [ ] Emails de notificación se envían

---

## 📞 SOPORTE POST-DESPLIEGUE

### Comandos Útiles Rápidos

```bash
# Reiniciar aplicación
pm2 restart sgd-backend

# Ver logs en tiempo real
pm2 logs sgd-backend --lines 100

# Estado de servicios
sudo systemctl status nginx mysql
pm2 status

# Backup manual
sudo /usr/local/bin/backup-sgd.sh

# Limpiar logs viejos
pm2 flush

# Ver uso de disco
df -h

# Ver uso de memoria
free -h

# Ver procesos que más consumen
top
```

### Contactos

- **Desarrollador:** [Tu email]
- **Cliente:** DRTC Puno
- **Repositorio:** https://github.com/osk4114/GestionDocumentaria

---

**Última Actualización:** 13 de Noviembre, 2025  
**Versión del Sistema:** 3.5  
**Guía por:** GitHub Copilot + osk4114  

✅ **Sistema listo para producción**
