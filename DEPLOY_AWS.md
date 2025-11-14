# 🚀 GUÍA DE DESPLIEGUE EN AWS EC2
## Sistema de Gestión Documentaria (SGD) - DRTC Puno

![AWS](https://img.shields.io/badge/AWS-EC2-orange)
![Versión](https://img.shields.io/badge/Versión-3.5-blue)
![Dominio](https://img.shields.io/badge/Dominio-sgd--drtcpuno.me-green)

---

## 📋 TABLA DE CONTENIDOS

1. [Recursos Disponibles](#-recursos-disponibles)
2. [Paso 1: Crear Instancia EC2](#paso-1-crear-instancia-ec2-15-minutos)
3. [Paso 2: Configurar Security Group](#paso-2-configurar-security-group-5-minutos)
4. [Paso 3: Conectar por SSH](#paso-3-obtener-ip-y-conectar-10-minutos)
5. [Paso 4: Configurar DNS](#paso-4-configurar-dns-en-namecheap-10-minutos)
6. [Paso 5: Instalar Software](#paso-5-instalar-software-base-20-minutos)
7. [Paso 6: Configurar Base de Datos](#paso-6-configurar-base-de-datos-15-minutos)
8. [Paso 7: Clonar Aplicación](#paso-7-clonar-y-configurar-aplicación-20-minutos)
9. [Paso 8: Importar Base de Datos](#paso-8-importar-base-de-datos-10-minutos)
10. [Paso 9: Iniciar con PM2](#paso-9-iniciar-backend-con-pm2-10-minutos)
11. [Paso 10: Configurar Nginx](#paso-10-configurar-nginx-15-minutos)
12. [Paso 11: Instalar SSL](#paso-11-instalar-ssl-con-lets-encrypt-10-minutos)
13. [Paso 12: Desplegar Frontend](#paso-12-compilar-y-desplegar-frontend-25-minutos)
14. [Paso 13: Verificación Final](#paso-13-verificación-final-10-minutos)
15. [Troubleshooting](#-troubleshooting)
16. [Comandos Útiles](#-comandos-útiles)

---

## 💰 RECURSOS DISPONIBLES

### Tu Cuenta AWS
- **Crédito:** $100 USD disponibles
- **Duración:** 146 días (hasta Abril 2026)
- **Región:** US East (Ohio) us-east-2

### Free Tier (12 meses)
- ✅ 750 horas/mes de EC2 t2.micro
- ✅ 30 GB de almacenamiento EBS
- ✅ 5 GB de almacenamiento S3
- ✅ 15 GB de transferencia de datos

### Tu Dominio
- **Dominio:** sgd-drtcpuno.me
- **Registrador:** Namecheap
- **URLs que configuraremos:**
  - `https://sgd-drtcpuno.me` - Frontend
  - `https://www.sgd-drtcpuno.me` - Frontend (www)
  - `https://api.sgd-drtcpuno.me` - Backend API

---

## ⏱️ TIEMPO ESTIMADO TOTAL: 3 HORAS

```
Crear EC2:              15 min
Security Group:          5 min
Conectar SSH:           10 min
Configurar DNS:         10 min
Instalar software:      20 min
Configurar DB:          15 min
Clonar app:             20 min
Importar DB:            10 min
PM2:                    10 min
Nginx:                  15 min
SSL:                    10 min
Frontend:               25 min
Pruebas:                10 min
─────────────────────────────
TOTAL:                 175 min
```

---

## PASO 1: Crear Instancia EC2 (15 minutos)

### 1.1 Acceder a AWS Console

```
1. Ir a: https://console.aws.amazon.com/ec2/
2. Asegurarte de estar en región: US East (Ohio) us-east-2
   (Verificar arriba a la derecha)
3. Click en "Launch Instance" (botón naranja)
```

### 1.2 Configurar la Instancia

#### Name and Tags
```
Name: sgd-drtcpuno-production
```

#### Application and OS Images
```
Quick Start: Ubuntu
AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
Architecture: 64-bit (x86)
✓ Free tier eligible
```

#### Instance Type
```
Instance type: t2.micro
vCPUs: 1
Memory: 1 GiB
✓ Free tier eligible
```

#### Key Pair (Login)
```
1. Click "Create new key pair"
2. Key pair name: sgd-drtcpuno-key
3. Key pair type: RSA
4. Private key file format: .pem (for SSH)
5. Click "Create key pair"
6. ⚠️ IMPORTANTE: Se descargará automáticamente
   Guardar en: C:\Users\SUMMER\.ssh\sgd-drtcpuno-key.pem
```

#### Network Settings
```
1. Click "Edit"
2. Verificar/Configurar:
   ☑ Auto-assign public IP: Enable
3. Firewall (Security groups):
   ● Create security group
   Security group name: sgd-drtcpuno-sg
   Description: Security group for SGD DRTC Puno
   
   Inbound Security Group Rules:
   ☑ Allow SSH traffic from: Anywhere (0.0.0.0/0)
   ☑ Allow HTTPS traffic from the internet
   ☑ Allow HTTP traffic from the internet
```

#### Configure Storage
```
1 x 30 GiB gp3 (Default)
Root volume
✓ Free tier eligible
```

### 1.3 Lanzar Instancia

```
1. Review en el panel derecho:
   - Instance type: t2.micro
   - Number of instances: 1
   
2. Click "Launch instance"
3. Esperar mensaje: "Successfully initiated launch of instance..."
4. Click "View all instances"
5. Esperar ~2 minutos hasta que:
   - Instance state: Running (luz verde)
   - Status check: 2/2 checks passed
```

---

## PASO 2: Configurar Security Group (5 minutos)

### 2.1 Acceder al Security Group

```
1. En EC2 Dashboard → Instances
2. Click en tu instancia "sgd-drtcpuno-production"
3. Tab "Security"
4. Click en el Security Group ID (sg-xxxxx...)
5. Tab "Inbound rules"
6. Click "Edit inbound rules"
```

### 2.2 Agregar Reglas

Verificar que existan estas 4 reglas:

```
┌──────────┬──────────┬────────────┬─────────────────┬──────────────┐
│ Type     │ Protocol │ Port       │ Source          │ Description  │
├──────────┼──────────┼────────────┼─────────────────┼──────────────┤
│ SSH      │ TCP      │ 22         │ 0.0.0.0/0       │ SSH access   │
│ HTTP     │ TCP      │ 80         │ 0.0.0.0/0       │ HTTP         │
│ HTTPS    │ TCP      │ 443        │ 0.0.0.0/0       │ HTTPS        │
│ Custom   │ TCP      │ 3000       │ 0.0.0.0/0       │ Node.js API  │
└──────────┴──────────┴────────────┴─────────────────┴──────────────┘
```

Si falta el puerto 3000:
```
1. Click "Add rule"
2. Type: Custom TCP
3. Port range: 3000
4. Source: 0.0.0.0/0
5. Description: Node.js API
```

### 2.3 Guardar

```
Click "Save rules"
```

---

## PASO 3: Obtener IP y Conectar (10 minutos)

### 3.1 Obtener IP Pública

```
1. En EC2 Dashboard → Instances
2. Seleccionar tu instancia "sgd-drtcpuno-production"
3. En el panel inferior, copiar:
   Public IPv4 address: 3.135.xxx.xxx
   
⚠️ GUARDAR ESTA IP - La necesitarás varias veces
```

### 3.2 Preparar Clave SSH (Windows PowerShell)

```powershell
# Abrir PowerShell como Administrador

# Crear directorio .ssh si no existe
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh"

# Mover la clave descargada (si está en Downloads)
Move-Item "$env:USERPROFILE\Downloads\sgd-drtcpuno-key.pem" "$env:USERPROFILE\.ssh\" -Force

# Configurar permisos (IMPORTANTE en Windows)
icacls "$env:USERPROFILE\.ssh\sgd-drtcpuno-key.pem" /inheritance:r
icacls "$env:USERPROFILE\.ssh\sgd-drtcpuno-key.pem" /grant:r "$env:USERNAME:(R)"
```

### 3.3 Conectar por SSH

```powershell
# Conectar (reemplazar 3.135.xxx.xxx con tu IP real)
ssh -i "$env:USERPROFILE\.ssh\sgd-drtcpuno-key.pem" ubuntu@3.135.xxx.xxx

# Primera vez preguntará:
# "Are you sure you want to continue connecting (yes/no/[fingerprint])?"
# Escribir: yes

# Debes ver:
# Welcome to Ubuntu 22.04.x LTS
# ubuntu@ip-xxx-xxx-xxx-xxx:~$
```

### 3.4 Alternativa: Conectar desde AWS Console

Si tienes problemas con SSH:

```
1. En EC2 → Instances
2. Seleccionar tu instancia
3. Click botón "Connect" (arriba)
4. Tab "EC2 Instance Connect"
5. Username: ubuntu
6. Click "Connect"
7. Se abre terminal en el navegador
```

---

## PASO 4: Configurar DNS en Namecheap (10 minutos)

### 4.1 Acceder a Namecheap

```
1. Ir a: https://ap.www.namecheap.com
2. Iniciar sesión
3. Dashboard → Domain List
4. Click en "sgd-drtcpuno.me"
5. Click "Manage"
```

### 4.2 Configurar DNS

```
1. Tab "Advanced DNS"
2. Buscar sección "Host Records"
3. Agregar/Editar los siguientes 3 registros:
```

#### Registro 1: Dominio Principal
```
Type:  A Record
Host:  @
Value: 3.135.xxx.xxx (tu IP de AWS)
TTL:   Automatic
[Icono del checkmark verde para guardar]
```

#### Registro 2: Subdominio WWW
```
Type:  A Record
Host:  www
Value: 3.135.xxx.xxx (tu IP de AWS)
TTL:   Automatic
[Icono del checkmark verde para guardar]
```

#### Registro 3: Subdominio API
```
Type:  A Record
Host:  api
Value: 3.135.xxx.xxx (tu IP de AWS)
TTL:   Automatic
[Icono del checkmark verde para guardar]
```

### 4.3 Guardar Cambios

```
1. Click "Save All Changes" (abajo)
2. Esperar confirmación: "All host records have been saved"
```

### 4.4 Verificar Propagación DNS (Después de 10-15 minutos)

En PowerShell de tu PC:

```powershell
# Verificar dominio principal
nslookup sgd-drtcpuno.me

# Verificar subdominio www
nslookup www.sgd-drtcpuno.me

# Verificar subdominio api
nslookup api.sgd-drtcpuno.me

# Todos deben mostrar tu IP de AWS
```

⚠️ **NOTA:** La propagación DNS puede tomar de 5 a 30 minutos. Mientras tanto, puedes continuar con los siguientes pasos.

---

## PASO 5: Instalar Software Base (20 minutos)

**⚠️ IMPORTANTE:** Todos estos comandos se ejecutan en el servidor AWS (terminal SSH)

### 5.1 Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

Presionar `Y` y Enter si pregunta.

### 5.2 Instalar Node.js 18

```bash
# Agregar repositorio de NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version
# Debe mostrar: v18.x.x

npm --version
# Debe mostrar: 9.x.x o superior
```

### 5.3 Instalar MySQL

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Iniciar servicio
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar que está corriendo
sudo systemctl status mysql
# Debe mostrar: "active (running)"
# Presionar 'q' para salir
```

### 5.4 Configurar Seguridad de MySQL

```bash
sudo mysql_secure_installation
```

**Responder las preguntas:**

```
1. VALIDATE PASSWORD COMPONENT?
   → Presionar: n (No)

2. New password: 
   → Crear una contraseña FUERTE (ej: MySecurePass2024!)
   ⚠️ GUARDAR ESTA CONTRASEÑA - Es el root de MySQL

3. Re-enter new password:
   → Repetir la contraseña

4. Remove anonymous users?
   → Presionar: Y (Yes)

5. Disallow root login remotely?
   → Presionar: Y (Yes)

6. Remove test database and access to it?
   → Presionar: Y (Yes)

7. Reload privilege tables now?
   → Presionar: Y (Yes)
```

### 5.5 Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalación
pm2 --version

# Configurar PM2 para inicio automático
pm2 startup

# Copiar y ejecutar el comando que muestra (empieza con 'sudo env PATH=...')
# Ejemplo:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 5.6 Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar servicio
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
# Debe mostrar: "active (running)"
# Presionar 'q' para salir
```

**Verificar Nginx en navegador:**
```
Ir a: http://3.135.xxx.xxx (tu IP)
Debe mostrar: "Welcome to nginx!"
```

### 5.7 Instalar Git

```bash
sudo apt install -y git

# Verificar
git --version
# Debe mostrar: git version 2.x.x
```

### 5.8 Instalar Certbot (para SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Verificar
certbot --version
```

✅ **SOFTWARE BASE INSTALADO**

---

## PASO 6: Configurar Base de Datos (15 minutos)

### 6.1 Conectar a MySQL

```bash
sudo mysql -u root -p
```

Ingresar la contraseña de root que creaste en el paso 5.4.

### 6.2 Ejecutar Comandos SQL

**⚠️ IMPORTANTE:** Reemplazar `TuPasswordFuerteAqui123!` con una contraseña real y fuerte.

```sql
-- Crear usuario para la aplicación
CREATE USER 'summer4114'@'localhost' IDENTIFIED BY 'TuPasswordFuerteAqui123!';

-- Crear base de datos
CREATE DATABASE sgd_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Otorgar todos los permisos
GRANT ALL PRIVILEGES ON sgd_db.* TO 'summer4114'@'localhost';
FLUSH PRIVILEGES;

-- Verificar que se creó la base de datos
SHOW DATABASES;
```

Debe aparecer `sgd_db` en la lista.

```sql
-- Verificar que se creó el usuario
SELECT user, host FROM mysql.user WHERE user = 'summer4114';
```

Debe mostrar: `summer4114 | localhost`

```sql
-- Salir de MySQL
EXIT;
```

✅ **BASE DE DATOS CONFIGURADA**

---

## PASO 7: Clonar y Configurar Aplicación (20 minutos)

### 7.1 Crear Directorio y Clonar

```bash
# Crear directorio principal
sudo mkdir -p /var/www
cd /var/www

# Clonar el repositorio
sudo git clone https://github.com/osk4114/GestionDocumentaria.git sgd

# Cambiar propietario a ubuntu
sudo chown -R ubuntu:ubuntu sgd

# Entrar al directorio
cd sgd
```

### 7.2 Instalar Dependencias

```bash
# Instalar solo dependencias de producción
npm install --production

# Esperar ~3-5 minutos
```

### 7.3 Crear Directorios Necesarios

```bash
# Crear directorios para uploads y logs
mkdir -p uploads logs

# Dar permisos de escritura
chmod 775 uploads logs
```

### 7.4 Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo
nano .env
```

**Configuración del archivo .env:**

Buscar y modificar las siguientes líneas (usar Ctrl+W para buscar):

```env
# ============================================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================================
NODE_ENV=production
PORT=3000

# ============================================================
# CONFIGURACIÓN DE SEGURIDAD JWT
# ============================================================
# ⚠️ ESTOS SE GENERARÁN EN EL SIGUIENTE PASO
JWT_SECRET=TEMPORAL_CAMBIAR_DESPUES
JWT_REFRESH_SECRET=TEMPORAL_CAMBIAR_DESPUES

JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgd_db
DB_USER=summer4114
DB_PASSWORD=TuPasswordFuerteAqui123!

# ⚠️ CAMBIAR por la contraseña que creaste en el Paso 6.2

# ============================================================
# CONFIGURACIÓN DE CORS Y FRONTEND
# ============================================================
FRONTEND_URL=https://sgd-drtcpuno.me
CORS_ORIGIN=https://sgd-drtcpuno.me
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
# CONFIGURACIÓN DE EMAIL (Opcional - configurar después)
# ============================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASSWORD=tu_app_password_aqui
EMAIL_FROM=noreply@sgd-drtcpuno.me
EMAIL_FROM_NAME=Sistema de Gestión Documentaria - DRTC Puno

# ============================================================
# CONFIGURACIÓN DE LOGS
# ============================================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=7d
```

**Guardar archivo:**
```
Ctrl+O  (WriteOut)
Enter   (Confirmar nombre)
Ctrl+X  (Exit)
```

### 7.5 Generar JWT Secrets

```bash
# Generar JWT_SECRET (64 caracteres aleatorios)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copiar el resultado** (Ejemplo: `a7f3d9e2b...`)

```bash
# Generar JWT_REFRESH_SECRET (otro diferente)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copiar este resultado también**

### 7.6 Actualizar .env con los Secrets

```bash
# Editar .env de nuevo
nano .env
```

Buscar (Ctrl+W) `JWT_SECRET` y reemplazar:

```env
JWT_SECRET=a7f3d9e2b...   (pegar el primer secret generado)
JWT_REFRESH_SECRET=c4e8f1a3...   (pegar el segundo secret generado)
```

**Guardar:** Ctrl+O → Enter → Ctrl+X

✅ **APLICACIÓN CONFIGURADA**

---

## PASO 8: Importar Base de Datos (10 minutos)

### 8.1 Importar Estructura y Datos Iniciales

```bash
# Asegurarse de estar en /var/www/sgd
cd /var/www/sgd

# Importar el script SQL
mysql -u summer4114 -p sgd_db < config/init-database.sql
```

Ingresar la contraseña del usuario `summer4114` (del Paso 6.2).

Esperar ~10-15 segundos.

### 8.2 Verificar Importación

```bash
# Verificar que se crearon las tablas
mysql -u summer4114 -p sgd_db -e "SHOW TABLES;"
```

**Debe mostrar 16 tablas:**
```
+----------------------------+
| Tables_in_sgd_db           |
+----------------------------+
| areas                      |
| area_categories            |
| attachments                |
| document_cargos            |
| document_movements         |
| document_statuses          |
| document_types             |
| document_versions          |
| documents                  |
| login_attempts             |
| permissions                |
| priorities                 |
| role_permissions           |
| roles                      |
| user_sessions              |
| users                      |
+----------------------------+
```

```bash
# Verificar que se insertaron los permisos
mysql -u summer4114 -p sgd_db -e "SELECT COUNT(*) as total_permisos FROM permissions;"
```

**Debe mostrar:** `total_permisos: 124`

```bash
# Verificar que se creó el rol Administrador
mysql -u summer4114 -p sgd_db -e "SELECT id, nombre, descripcion FROM roles;"
```

**Debe mostrar:** `1 | Administrador | Control total del sistema...`

### 8.3 Crear Usuario Administrador

```bash
# Ejecutar script de creación de admin
node create-admin.js
```

**Debe mostrar:**
```
✓ Usuario administrador creado exitosamente

Credenciales:
  Email: admin@sgd.gob.pe
  Password: Admin123!

⚠️ IMPORTANTE: Cambiar la contraseña después del primer login
```

✅ **BASE DE DATOS IMPORTADA Y USUARIO ADMIN CREADO**

---

## PASO 9: Iniciar Backend con PM2 (10 minutos)

### 9.1 Probar Inicio Manual

```bash
# Asegurarse de estar en /var/www/sgd
cd /var/www/sgd

# Probar inicio manual
node server.js
```

**Debe mostrar:**
```
✓ Conexión a MySQL establecida correctamente
✓ Servidor HTTP corriendo en:
  - Local:   http://localhost:3000
  - Red:     http://172.x.x.x:3000
✓ WebSocket corriendo en:
  - Local:   ws://localhost:3000
```

**Detener con:** Ctrl+C

### 9.2 Iniciar con PM2

```bash
# Iniciar aplicación con PM2
pm2 start ecosystem.config.js

# Debe mostrar:
# [PM2] App [sgd-backend] launched (2 instances)
```

### 9.3 Verificar Estado

```bash
# Ver estado de la aplicación
pm2 status
```

**Debe mostrar:**
```
┌─────┬────────────────┬─────────┬─────────┬──────────┐
│ id  │ name           │ status  │ cpu     │ memory   │
├─────┼────────────────┼─────────┼─────────┼──────────┤
│ 0   │ sgd-backend    │ online  │ 0%      │ 50.0mb   │
│ 1   │ sgd-backend    │ online  │ 0%      │ 50.0mb   │
└─────┴────────────────┴─────────┴─────────┴──────────┘
```

### 9.4 Ver Logs

```bash
# Ver logs en tiempo real
pm2 logs sgd-backend --lines 30
```

**Debe mostrar logs sin errores críticos.**

Presionar Ctrl+C para salir.

### 9.5 Guardar Configuración PM2

```bash
# Guardar la configuración actual
pm2 save

# Configurar PM2 para inicio automático al reiniciar servidor
pm2 startup

# Ejecutar el comando sudo que muestra (si lo pide)
```

### 9.6 Probar API

```bash
# Probar endpoint de salud
curl http://localhost:3000/api/health
```

**Debe retornar:**
```json
{"status":"OK","message":"SGD API funcionando correctamente","timestamp":"2025-11-13T..."}
```

✅ **BACKEND CORRIENDO CON PM2**

---

## PASO 10: Configurar Nginx (15 minutos)

### 10.1 Crear Configuración de Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/sgd
```

### 10.2 Pegar la Configuración

**Copiar y pegar TODO este contenido:**

```nginx
# ============================================================
# BACKEND API - api.sgd-drtcpuno.me
# ============================================================
server {
    listen 80;
    server_name api.sgd-drtcpuno.me;

    # Logs
    access_log /var/log/nginx/sgd-api-access.log;
    error_log /var/log/nginx/sgd-api-error.log;

    # Proxy a Node.js en puerto 3000
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

    # WebSocket específico para Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Servir archivos subidos
    location /uploads/ {
        alias /var/www/sgd/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Límite de tamaño de archivo (20 MB)
    client_max_body_size 20M;
}

# ============================================================
# FRONTEND - sgd-drtcpuno.me
# ============================================================
server {
    listen 80;
    server_name sgd-drtcpuno.me www.sgd-drtcpuno.me;

    root /var/www/sgd-frontend;
    index index.html;

    # Logs
    access_log /var/log/nginx/sgd-frontend-access.log;
    error_log /var/log/nginx/sgd-frontend-error.log;

    # Comprimir archivos (mejora velocidad)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache de archivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Angular routing (todas las rutas van a index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Guardar:** Ctrl+O → Enter → Ctrl+X

### 10.3 Activar Configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/sgd /etc/nginx/sites-enabled/

# Probar que la configuración es válida
sudo nginx -t
```

**Debe mostrar:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 10.4 Reiniciar Nginx

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar que está corriendo
sudo systemctl status nginx
```

**Debe mostrar:** `active (running)`

Presionar 'q' para salir.

### 10.5 Probar Configuración

```bash
# Probar desde el servidor
curl http://localhost/api/health

# Debe retornar JSON de la API
```

✅ **NGINX CONFIGURADO COMO PROXY REVERSO**

---

## PASO 11: Instalar SSL con Let's Encrypt (10 minutos)

### 11.1 Verificar DNS (IMPORTANTE)

Antes de instalar SSL, **ASEGURARSE** que el DNS esté propagado:

```bash
# Verificar desde el servidor
nslookup sgd-drtcpuno.me
nslookup www.sgd-drtcpuno.me
nslookup api.sgd-drtcpuno.me

# Todos deben mostrar tu IP de AWS
```

⚠️ **Si el DNS no está propagado, ESPERAR antes de continuar.**

### 11.2 Obtener Certificados SSL

```bash
# Ejecutar Certbot
sudo certbot --nginx -d sgd-drtcpuno.me -d www.sgd-drtcpuno.me -d api.sgd-drtcpuno.me
```

**Responder las preguntas:**

```
1. Enter email address (used for urgent renewal and security notices):
   → Ingresar: tu_email@gmail.com

2. Please read the Terms of Service...
   (A)gree/(C)ancel:
   → Presionar: A

3. Would you be willing to share your email address...?
   (Y)es/(N)o:
   → Presionar: N

4. Please choose whether or not to redirect HTTP traffic to HTTPS...
   1: No redirect
   2: Redirect - Make all requests redirect to secure HTTPS access
   → Presionar: 2 (Redirect)
```

**Debe mostrar:**
```
Successfully deployed certificate for sgd-drtcpuno.me
Successfully deployed certificate for www.sgd-drtcpuno.me
Successfully deployed certificate for api.sgd-drtcpuno.me

Congratulations! You have successfully enabled HTTPS!
```

### 11.3 Verificar Renovación Automática

```bash
# Probar renovación (dry run - no renueva realmente)
sudo certbot renew --dry-run
```

**Debe mostrar:**
```
Congratulations, all simulated renewals succeeded:
  /etc/letsencrypt/live/sgd-drtcpuno.me/fullchain.pem (success)
```

### 11.4 Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

### 11.5 Probar HTTPS

```bash
# Probar desde el servidor
curl https://api.sgd-drtcpuno.me/api/health

# Debe retornar JSON sin errores de SSL
```

**En tu navegador (desde tu PC):**
```
https://api.sgd-drtcpuno.me/api/health

Debe mostrar:
- Candado verde (SSL válido)
- JSON de respuesta
```

✅ **SSL/HTTPS CONFIGURADO**

---

## PASO 12: Compilar y Desplegar Frontend (25 minutos)

### OPCIÓN A: Compilar en el Servidor (RECOMENDADO)

#### 12.1 Editar Configuración de Producción

```bash
# Ir al directorio del frontend
cd /var/www/sgd/sgd-frontend

# Editar environment.prod.ts
nano src/app/environments/environment.prod.ts
```

**Buscar y modificar estas líneas:**

```typescript
export const environment = {
  production: true,
  
  // ⚠️ CAMBIAR ESTAS URLs:
  apiUrl: 'https://api.sgd-drtcpuno.me/api',
  socketUrl: 'https://api.sgd-drtcpuno.me',
  
  appName: 'Sistema de Gestión Documentaria',
  appVersion: '3.5.0',
  
  // ... (resto sin cambios)
};
```

**Guardar:** Ctrl+O → Enter → Ctrl+X

#### 12.2 Instalar Dependencias

```bash
# Asegurarse de estar en /var/www/sgd/sgd-frontend
npm install

# Esperar ~5-10 minutos (muchas dependencias)
```

#### 12.3 Compilar para Producción

```bash
# Build optimizado de producción
npm run build --configuration=production

# Esperar ~3-5 minutos
# Debe terminar con: "✔ Browser application bundle generation complete."
```

#### 12.4 Desplegar Frontend

```bash
# Crear directorio para frontend
sudo mkdir -p /var/www/sgd-frontend

# Copiar archivos compilados
sudo cp -r dist/sgd-frontend/browser/* /var/www/sgd-frontend/

# Establecer propietario correcto
sudo chown -R www-data:www-data /var/www/sgd-frontend

# Establecer permisos
sudo chmod -R 755 /var/www/sgd-frontend

# Verificar que se copiaron los archivos
ls -la /var/www/sgd-frontend/
```

**Debe mostrar archivos como:**
```
index.html
main.js
styles.css
assets/
...
```

---

### OPCIÓN B: Compilar en tu PC y Subir

Si prefieres compilar en tu PC Windows:

#### En tu PC:

```powershell
# Abrir PowerShell en Windows
cd C:\Users\SUMMER\Desktop\GestionDocumentaria\sgd-frontend

# Editar src/app/environments/environment.prod.ts
# Cambiar apiUrl y socketUrl como en Opción A

# Instalar dependencias (si no lo has hecho)
npm install

# Compilar
npm run build --configuration=production

# Comprimir el resultado
Compress-Archive -Path dist\sgd-frontend\browser\* -DestinationPath frontend.zip

# Subir al servidor AWS
scp -i "$env:USERPROFILE\.ssh\sgd-drtcpuno-key.pem" frontend.zip ubuntu@3.135.xxx.xxx:/home/ubuntu/
```

#### En el servidor AWS:

```bash
# Instalar unzip
sudo apt install -y unzip

# Crear directorio para frontend
sudo mkdir -p /var/www/sgd-frontend

# Descomprimir
cd /home/ubuntu
unzip frontend.zip -d /tmp/frontend

# Copiar archivos
sudo cp -r /tmp/frontend/* /var/www/sgd-frontend/

# Permisos
sudo chown -R www-data:www-data /var/www/sgd-frontend
sudo chmod -R 755 /var/www/sgd-frontend

# Limpiar
rm frontend.zip
sudo rm -rf /tmp/frontend
```

---

✅ **FRONTEND DESPLEGADO**

---

## PASO 13: Verificación Final (10 minutos)

### 13.1 Verificar Servicios en el Servidor

```bash
# MySQL
sudo systemctl status mysql
# Debe mostrar: active (running)

# Nginx
sudo systemctl status nginx
# Debe mostrar: active (running)

# PM2
pm2 status
# Debe mostrar: sgd-backend | online (2 instancias)

# Ver logs recientes
pm2 logs sgd-backend --lines 20 --nostream
```

### 13.2 Verificar API

```bash
# Desde el servidor
curl https://api.sgd-drtcpuno.me/api/health
```

**Debe retornar:**
```json
{
  "status": "OK",
  "message": "SGD API funcionando correctamente",
  "timestamp": "2025-11-13T..."
}
```

### 13.3 Verificar en Navegador

**Abrir en tu navegador:**

#### 1. API Health Check
```
https://api.sgd-drtcpuno.me/api/health
```
- ✅ Debe mostrar JSON
- ✅ Candado verde (SSL válido)

#### 2. Frontend
```
https://sgd-drtcpuno.me
```
- ✅ Debe cargar la página de login
- ✅ Sin errores en consola (F12)
- ✅ Candado verde

#### 3. Login con Usuario Admin
```
Email: admin@sgd.gob.pe
Password: Admin123!
```
- ✅ Debe iniciar sesión
- ✅ Debe mostrar el dashboard
- ✅ Verificar menú lateral (áreas, usuarios, documentos, etc.)

#### 4. Probar Funciones Básicas
- ✅ Mesa de Partes Virtual (presentar documento)
- ✅ Consulta pública (buscar documento)
- ✅ Navegación entre módulos

### 13.4 Verificar Logs de Nginx

```bash
# Ver logs de acceso
sudo tail -f /var/log/nginx/sgd-api-access.log

# En otra terminal (o Ctrl+C primero)
sudo tail -f /var/log/nginx/sgd-frontend-access.log

# Ver errores (debe estar vacío o sin errores críticos)
sudo tail -f /var/log/nginx/sgd-api-error.log
```

### 13.5 Probar WebSocket

En el navegador (F12 → Console), debe ver:
```
🔌 Cliente conectado: xxxxx
✓ Usuario X autenticado
```

---

## 🎉 ¡DESPLIEGUE COMPLETADO!

Si todas las verificaciones pasaron, **tu sistema está en producción**.

### URLs de tu Sistema:
- **Frontend:** https://sgd-drtcpuno.me
- **API:** https://api.sgd-drtcpuno.me
- **Health Check:** https://api.sgd-drtcpuno.me/api/health

### Credenciales Iniciales:
- **Email:** admin@sgd.gob.pe
- **Password:** Admin123!

⚠️ **IMPORTANTE:** Cambiar la contraseña del admin inmediatamente.

---

## 🔧 TROUBLESHOOTING

### Problema 1: No puedo conectar por SSH

**Síntomas:**
```
Connection timed out
Permission denied
```

**Soluciones:**

```powershell
# 1. Verificar que el Security Group permite SSH (puerto 22)
# En AWS Console → EC2 → Security Groups

# 2. Verificar permisos de la clave .pem
icacls "$env:USERPROFILE\.ssh\sgd-drtcpuno-key.pem" /inheritance:r
icacls "$env:USERPROFILE\.ssh\sgd-drtcpuno-key.pem" /grant:r "$env:USERNAME:(R)"

# 3. Intentar con EC2 Instance Connect desde AWS Console
# EC2 → Instances → Connect → EC2 Instance Connect

# 4. Verificar que la instancia está corriendo
# Estado debe ser: Running (luz verde)
```

---

### Problema 2: Error de MySQL "Access denied"

**Síntomas:**
```
ERROR 1045 (28000): Access denied for user 'summer4114'@'localhost'
```

**Soluciones:**

```bash
# 1. Verificar password del usuario
sudo mysql -u root -p

# Dentro de MySQL:
SELECT user, host FROM mysql.user WHERE user = 'summer4114';
# Debe aparecer el usuario

# Si no existe, crearlo de nuevo:
CREATE USER 'summer4114'@'localhost' IDENTIFIED BY 'TuPassword';
GRANT ALL PRIVILEGES ON sgd_db.* TO 'summer4114'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. Verificar que el password en .env coincida
nano /var/www/sgd/.env
# Buscar DB_PASSWORD y verificar
```

---

### Problema 3: PM2 no inicia la aplicación

**Síntomas:**
```
pm2 status → status: errored
```

**Soluciones:**

```bash
# 1. Ver logs de error
pm2 logs sgd-backend --err --lines 50

# 2. Probar inicio manual para ver el error
cd /var/www/sgd
node server.js

# 3. Verificar .env
nano .env
# Asegurarse que DB_PASSWORD es correcto

# 4. Verificar que MySQL está corriendo
sudo systemctl status mysql

# 5. Reinstalar dependencias
cd /var/www/sgd
rm -rf node_modules
npm install --production

# 6. Reiniciar PM2
pm2 delete sgd-backend
pm2 start ecosystem.config.js
```

---

### Problema 4: Error 502 Bad Gateway (Nginx)

**Síntomas:**
```
Navegador muestra: 502 Bad Gateway
```

**Soluciones:**

```bash
# 1. Verificar que PM2 está corriendo
pm2 status
# Debe mostrar: online

# Si no:
pm2 start ecosystem.config.js

# 2. Verificar que la app escucha en puerto 3000
sudo lsof -i :3000
# Debe mostrar node escuchando

# 3. Verificar logs de Nginx
sudo tail -f /var/log/nginx/sgd-api-error.log

# 4. Probar la API directamente
curl http://localhost:3000/api/health

# 5. Reiniciar servicios
pm2 restart sgd-backend
sudo systemctl restart nginx
```

---

### Problema 5: Certbot falla al obtener SSL

**Síntomas:**
```
Failed authorization procedure
Domain not found
```

**Soluciones:**

```bash
# 1. Verificar que el DNS está propagado
nslookup sgd-drtcpuno.me
nslookup api.sgd-drtcpuno.me

# Debe mostrar tu IP de AWS
# Si no, ESPERAR más tiempo (hasta 1 hora)

# 2. Verificar que Nginx está corriendo
sudo systemctl status nginx

# 3. Verificar configuración de Nginx
sudo nginx -t

# 4. Intentar con un dominio a la vez
sudo certbot --nginx -d sgd-drtcpuno.me

# Una vez que funcione, agregar los otros:
sudo certbot --nginx -d www.sgd-drtcpuno.me
sudo certbot --nginx -d api.sgd-drtcpuno.me

# 5. Ver logs de Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

### Problema 6: Frontend no carga (404)

**Síntomas:**
```
Navegador muestra: 404 Not Found
```

**Soluciones:**

```bash
# 1. Verificar que los archivos existen
ls -la /var/www/sgd-frontend/
# Debe mostrar index.html y otros archivos

# Si está vacío:
cd /var/www/sgd/sgd-frontend
npm run build --configuration=production
sudo cp -r dist/sgd-frontend/browser/* /var/www/sgd-frontend/

# 2. Verificar permisos
sudo chown -R www-data:www-data /var/www/sgd-frontend
sudo chmod -R 755 /var/www/sgd-frontend

# 3. Verificar configuración de Nginx
sudo nano /etc/nginx/sites-available/sgd
# Verificar que root apunta a: /var/www/sgd-frontend

# 4. Reiniciar Nginx
sudo systemctl restart nginx

# 5. Ver logs de Nginx
sudo tail -f /var/log/nginx/sgd-frontend-error.log
```

---

### Problema 7: WebSocket no conecta

**Síntomas:**
```
Console del navegador: WebSocket connection failed
```

**Soluciones:**

```bash
# 1. Verificar configuración de Nginx
sudo nano /etc/nginx/sites-available/sgd

# Debe tener:
location /socket.io/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    ...
}

# 2. Verificar que PM2 está corriendo
pm2 status

# 3. Ver logs de Socket.IO
pm2 logs sgd-backend | grep socket

# 4. Verificar CORS en .env
nano /var/www/sgd/.env
# FRONTEND_URL=https://sgd-drtcpuno.me
# CORS_ORIGIN=https://sgd-drtcpuno.me

# 5. Reiniciar todo
pm2 restart sgd-backend
sudo systemctl restart nginx
```

---

### Problema 8: Upload de archivos falla

**Síntomas:**
```
Error al subir archivo
413 Request Entity Too Large
```

**Soluciones:**

```bash
# 1. Verificar permisos del directorio uploads
ls -la /var/www/sgd/uploads/
sudo chmod 775 /var/www/sgd/uploads

# 2. Verificar configuración de Nginx
sudo nano /etc/nginx/sites-available/sgd

# Debe tener:
client_max_body_size 20M;

# 3. Reiniciar Nginx
sudo systemctl restart nginx

# 4. Verificar .env
nano /var/www/sgd/.env
# MAX_FILE_SIZE=10
# MAX_FILE_SIZE_BYTES=10485760

# 5. Verificar logs
pm2 logs sgd-backend | grep upload
```

---

### Problema 9: Emails no se envían

**Síntomas:**
```
Notificaciones por email no llegan
```

**Soluciones:**

```bash
# 1. Configurar email en .env
nano /var/www/sgd/.env

# Para Gmail, usar:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASSWORD=app_password_aqui  # NO tu password normal
EMAIL_FROM=noreply@sgd-drtcpuno.me

# 2. Crear App Password en Gmail:
# Ir a: https://myaccount.google.com/apppasswords
# Generar password para "Mail"
# Copiar el password de 16 caracteres
# Pegarlo en EMAIL_PASSWORD

# 3. Reiniciar PM2
pm2 restart sgd-backend

# 4. Ver logs
pm2 logs sgd-backend | grep email
```

---

## 📝 COMANDOS ÚTILES

### Gestión de Servicios

```bash
# MySQL
sudo systemctl status mysql
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# Nginx
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo nginx -t  # Probar configuración

# PM2
pm2 status
pm2 start ecosystem.config.js
pm2 stop sgd-backend
pm2 restart sgd-backend
pm2 delete sgd-backend
pm2 logs sgd-backend
pm2 monit
pm2 save
```

### Ver Logs

```bash
# Logs de la aplicación
pm2 logs sgd-backend --lines 100
pm2 logs sgd-backend --err  # Solo errores

# Logs de Nginx
sudo tail -f /var/log/nginx/sgd-api-access.log
sudo tail -f /var/log/nginx/sgd-api-error.log
sudo tail -f /var/log/nginx/sgd-frontend-access.log
sudo tail -f /var/log/nginx/sgd-frontend-error.log

# Logs de MySQL
sudo tail -f /var/log/mysql/error.log

# Logs de la aplicación (archivo)
tail -f /var/www/sgd/logs/app.log
```

### Base de Datos

```bash
# Conectar a MySQL
mysql -u summer4114 -p sgd_db

# Backup de base de datos
mysqldump -u summer4114 -p sgd_db > backup-$(date +%Y%m%d).sql

# Restaurar base de datos
mysql -u summer4114 -p sgd_db < backup-20251113.sql

# Ver tablas
mysql -u summer4114 -p sgd_db -e "SHOW TABLES;"

# Ver usuarios
mysql -u summer4114 -p sgd_db -e "SELECT id, nombre, email, rol_id FROM users;"
```

### Gestión de Archivos

```bash
# Ver espacio en disco
df -h

# Ver tamaño de directorios
du -sh /var/www/sgd/*

# Limpiar logs antiguos
pm2 flush
sudo find /var/log/nginx -name "*.log" -mtime +7 -delete

# Limpiar uploads (CUIDADO)
# NO ejecutar sin verificar
# sudo rm -rf /var/www/sgd/uploads/*
```

### Monitoreo

```bash
# Ver procesos de Node.js
ps aux | grep node

# Ver uso de puertos
sudo lsof -i :3000
sudo lsof -i :80
sudo lsof -i :443

# Ver uso de CPU y memoria
top
htop  # (instalar con: sudo apt install htop)

# Ver conexiones activas
sudo netstat -tulpn | grep LISTEN

# Monitoreo PM2 en tiempo real
pm2 monit
```

### Actualizar Aplicación

```bash
# Hacer pull de cambios
cd /var/www/sgd
git pull origin main

# Reinstalar dependencias (si package.json cambió)
npm install --production

# Reimportar base de datos (si init-database.sql cambió)
mysql -u summer4114 -p sgd_db < config/init-database.sql

# Recompilar frontend (si cambió)
cd sgd-frontend
npm run build --configuration=production
sudo cp -r dist/sgd-frontend/browser/* /var/www/sgd-frontend/

# Reiniciar PM2
pm2 restart sgd-backend

# Recargar Nginx (si cambió configuración)
sudo nginx -t
sudo systemctl reload nginx
```

### Seguridad

```bash
# Ver intentos de login fallidos
sudo grep "Failed password" /var/log/auth.log | tail -20

# Ver conexiones SSH activas
who

# Cambiar password de usuario
sudo passwd ubuntu

# Ver reglas de firewall (si usas UFW)
sudo ufw status

# Renovar SSL manualmente
sudo certbot renew

# Ver certificados SSL
sudo certbot certificates
```

---

## 🔒 TAREAS POST-DESPLIEGUE

### Seguridad Inmediata

```bash
# 1. Cambiar password del admin
# Hacer login en https://sgd-drtcpuno.me
# Ir a Perfil → Cambiar Contraseña

# 2. Configurar Fail2Ban (protección contra ataques)
sudo apt install -y fail2ban

sudo nano /etc/fail2ban/jail.local
# Agregar:
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600

sudo systemctl restart fail2ban

# 3. Configurar firewall UFW (opcional)
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### Backups Automáticos

```bash
# 1. Crear script de backup
sudo nano /usr/local/bin/backup-sgd.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u summer4114 -pTuPassword sgd_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/sgd uploads/

# Eliminar backups mayores a 7 días
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completado: $DATE"
```

```bash
# Dar permisos
sudo chmod +x /usr/local/bin/backup-sgd.sh

# Probar
sudo /usr/local/bin/backup-sgd.sh

# 2. Programar backup diario
crontab -e
# Agregar:
0 2 * * * /usr/local/bin/backup-sgd.sh >> /home/ubuntu/backup.log 2>&1
```

### Monitoreo

```bash
# 1. Configurar alertas de PM2 (opcional)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 2. Monitorear uso de disco
# Agregar a crontab:
0 */6 * * * df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{ print $5 " " $1 }' | while read output; do echo $output; done
```

---

## 💰 COSTOS ESTIMADOS

### Primeros 12 meses (Free Tier)

```
EC2 t2.micro:          $0/mes  (750 hrs/mes gratis)
EBS 30 GB:             $0/mes  (incluido)
Transferencia datos:   $0/mes  (15 GB/mes gratis)
IP Elástica:           $0/mes  (si está en uso)
────────────────────────────────
Total:                 $0/mes
```

### Después del Free Tier (mes 13+)

```
EC2 t2.micro:          ~$8-10/mes
EBS 30 GB:             ~$3/mes
Transferencia:         ~$1-2/mes
────────────────────────────────
Total:                 ~$12-15/mes
```

### Tu crédito de $100 cubre:

```
$100 ÷ $13/mes = ~7-8 meses adicionales

Total gratis: 12 meses (Free Tier) + 7 meses (crédito)
            = ~19 meses (hasta Junio 2027)
```

---

## 📞 CONTACTO Y SOPORTE

### Documentación
- **Repositorio:** https://github.com/osk4114/GestionDocumentaria
- **Guía original:** DEPLOY.md
- **Esta guía:** DEPLOY_AWS.md

### URLs del Sistema
- **Frontend:** https://sgd-drtcpuno.me
- **API:** https://api.sgd-drtcpuno.me/api
- **Health:** https://api.sgd-drtcpuno.me/api/health

### Credenciales Iniciales
- **Email:** admin@sgd.gob.pe
- **Password:** Admin123! (⚠️ CAMBIAR INMEDIATAMENTE)

---

## ✅ CHECKLIST FINAL

- [ ] Instancia EC2 creada y corriendo
- [ ] Security Group configurado (puertos 22, 80, 443, 3000)
- [ ] SSH funcionando
- [ ] DNS propagado (sgd-drtcpuno.me → IP de AWS)
- [ ] Software instalado (Node.js, MySQL, PM2, Nginx, Certbot)
- [ ] Base de datos creada e importada
- [ ] Usuario administrador creado
- [ ] Aplicación clonada y configurada
- [ ] .env configurado con valores reales
- [ ] JWT secrets generados
- [ ] PM2 corriendo (2 instancias)
- [ ] Nginx configurado
- [ ] SSL instalado (HTTPS funcionando)
- [ ] Frontend compilado y desplegado
- [ ] Login funciona
- [ ] Dashboard accesible
- [ ] WebSocket conecta
- [ ] Password de admin cambiado
- [ ] Backups configurados (opcional)
- [ ] Monitoreo configurado (opcional)

---

**Última Actualización:** 13 de Noviembre, 2025  
**Versión del Sistema:** 3.5  
**Plataforma:** AWS EC2  
**Guía creada por:** GitHub Copilot + osk4114  

✅ **¡ÉXITO EN TU DESPLIEGUE!** 🚀
