# 🔒 CONFIGURACIÓN DE SEGURIDAD - SGD v3.5

## 🛡️ PROTECCIÓN CONTRA INYECCIÓN SQL

**Estado:** ✅ **COMPLETAMENTE PROTEGIDO**

El sistema utiliza **Sequelize ORM** que automáticamente protege contra inyección SQL mediante **prepared statements**.

📖 **Para detalles técnicos completos, ver:** [`SQL_INJECTION_PROTECTION.md`](./SQL_INJECTION_PROTECTION.md)

**Resumen de protecciones:**
- ✅ Sequelize ORM con prepared statements
- ✅ Zero concatenación de SQL
- ✅ Validación en 4 capas (Frontend, Backend, ORM, Database)
- ✅ Operadores seguros (Op.like, Op.in, Op.or)
- ✅ Auditoría completa de accesos

---

## 📋 CREDENCIALES DE PRODUCCIÓN

### Base de Datos MySQL
```
Usuario:     summer4114
Contraseña:  screamer-1
Base de datos: sgd_db
Host:        localhost
Puerto:      3306
```

### Usuario Administrador (Sistema)
```
Email:       admin@sgd.gob.pe
Contraseña:  Admin123!
⚠️ CAMBIAR INMEDIATAMENTE después del primer login
```

---

## 🚀 ORDEN DE EJECUCIÓN

### 1. Configurar Usuario MySQL
```bash
# Como root de MySQL
sudo mysql -u root -p < config/setup-mysql-user.sql
```

Esto crea:
- Usuario `summer4114` con permisos completos
- Base de datos `sgd_db` con charset utf8mb4

### 2. Importar Estructura de Base de Datos
```bash
# Con el usuario creado
mysql -u summer4114 -p sgd_db < config/init-database.sql
```

Esto crea:
- 16 tablas del sistema
- 124 permisos granulares
- 1 rol (Administrador)
- 5 áreas por defecto
- Estados y tipos de documento

### 3. Crear Usuario Administrador
```bash
# Instalar dependencias si no lo hiciste
npm install

# Ejecutar script de creación
node create-admin.js
```

Esto crea:
- Usuario administrador con email `admin@sgd.gob.pe`
- Contraseña temporal `Admin123!`
- Acceso global (sin área asignada)
- Todos los permisos del sistema

### 4. Configurar Variables de Entorno
```bash
# Editar archivo .env
nano .env

# Verificar que tenga:
DB_USER=summer4114
DB_PASSWORD=screamer-1
JWT_SECRET=<secret_generado>
JWT_REFRESH_SECRET=<secret_generado>
```

---

## ⚠️ CHECKLIST DE SEGURIDAD

### Antes del Despliegue
- [ ] Password de MySQL configurado (`screamer-1`)
- [ ] Usuario MySQL creado (`summer4114`)
- [ ] Base de datos importada correctamente
- [ ] Usuario administrador creado
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] JWT secrets generados (mínimo 64 caracteres)
- [ ] CORS configurado con dominios correctos
- [ ] `NODE_ENV=production` en .env

### Después del Despliegue
- [ ] Cambiar contraseña de administrador (Perfil > Cambiar Contraseña)
- [ ] Crear usuarios adicionales desde el panel
- [ ] Configurar roles personalizados
- [ ] Verificar permisos de archivos en `/uploads`
- [ ] Configurar backups automáticos
- [ ] Activar logs de auditoría
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall (puertos 3000, 80, 443, 3306)

---

## 🔐 CAMBIO DE CONTRASEÑAS

### Cambiar Contraseña de MySQL
```sql
-- Como root
ALTER USER 'summer4114'@'localhost' IDENTIFIED BY 'NUEVA_PASSWORD_AQUI';
FLUSH PRIVILEGES;
```

⚠️ **IMPORTANTE:** Actualizar también en `.env`:
```bash
DB_PASSWORD=NUEVA_PASSWORD_AQUI
```

### Cambiar Contraseña de Administrador
1. Iniciar sesión con `admin@sgd.gob.pe`
2. Ir a **Perfil** (esquina superior derecha)
3. Seleccionar **Cambiar Contraseña**
4. Ingresar contraseña actual: `Admin123!`
5. Ingresar nueva contraseña (mínimo 8 caracteres)
6. Confirmar nueva contraseña
7. Guardar cambios

---

## 🛡️ MEJORES PRÁCTICAS

### 1. Contraseñas Seguras
- **Mínimo 12 caracteres**
- Combinar mayúsculas, minúsculas, números y símbolos
- No usar palabras del diccionario
- No reutilizar contraseñas
- Cambiar periódicamente (cada 90 días)

### 2. JWT Secrets
- Usar mínimo 64 caracteres aleatorios
- Generar con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Nunca** compartir o subir a Git
- Diferentes para `JWT_SECRET` y `JWT_REFRESH_SECRET`

### 3. Base de Datos
- Usuario con permisos mínimos necesarios
- No usar usuario `root` en producción
- Conexión solo desde localhost
- Backups diarios automáticos
- Logs de slow queries habilitados

### 4. Archivos y Directorios
```bash
# Permisos recomendados
chmod 600 .env                    # Solo owner puede leer
chmod 755 uploads/                # Directorio de uploads
chmod 644 uploads/*               # Archivos subidos
chmod 700 logs/                   # Directorio de logs
```

### 5. Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp             # SSH
sudo ufw allow 80/tcp             # HTTP
sudo ufw allow 443/tcp            # HTTPS
sudo ufw enable

# MySQL solo localhost (por defecto)
# No abrir puerto 3306 externamente
```

### 6. SSL/TLS
- Usar Let's Encrypt para certificados gratuitos
- Forzar HTTPS (redirección automática)
- HTTP/2 habilitado
- Headers de seguridad configurados

---

## 📊 AUDITORÍA Y MONITOREO

### Logs Importantes
```bash
# Logs de aplicación
tail -f logs/app.log

# Logs de PM2
pm2 logs sgd-backend

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de MySQL
tail -f /var/log/mysql/error.log
tail -f /var/log/mysql/slow-query.log
```

### Comandos de Verificación
```bash
# Estado de la aplicación
pm2 status
pm2 monit

# Conexiones a base de datos
mysql -u summer4114 -p -e "SHOW PROCESSLIST;"

# Usuarios activos
mysql -u summer4114 -p sgd_db -e "SELECT COUNT(*) FROM user_sessions WHERE is_active = 1;"

# Intentos de login fallidos
mysql -u summer4114 -p sgd_db -e "SELECT email, COUNT(*) as intentos FROM login_attempts WHERE success = 0 GROUP BY email HAVING intentos >= 3;"
```

---

## 🚨 INCIDENTES DE SEGURIDAD

### Si se compromete una cuenta
1. Desactivar usuario inmediatamente
2. Revisar logs de acceso
3. Cambiar contraseñas de todos los usuarios
4. Regenerar JWT secrets
5. Cerrar todas las sesiones activas
6. Analizar actividad sospechosa en `login_attempts`

### Si se compromete la base de datos
1. Cambiar contraseña de MySQL inmediatamente
2. Revisar usuarios con acceso a la base de datos
3. Restaurar desde backup más reciente
4. Analizar logs de MySQL para accesos no autorizados
5. Actualizar credenciales en todos los servidores

### Si se compromete el servidor
1. Aislar servidor de la red
2. Analizar logs del sistema
3. Cambiar todas las credenciales
4. Restaurar desde backup limpio
5. Actualizar sistema operativo y paquetes
6. Revisar configuración de firewall

---

## 📞 CONTACTO DE EMERGENCIA

En caso de incidente de seguridad crítico:
- Reportar inmediatamente al administrador del sistema
- Documentar el incidente con capturas de pantalla
- No intentar "arreglar" sin consultar
- Preservar logs para análisis forense

---

## ✅ VERIFICACIÓN POST-DESPLIEGUE

```bash
# 1. Verificar conexión a base de datos
node -e "require('./config/database').testConnection()"

# 2. Verificar usuario administrador
mysql -u summer4114 -p sgd_db -e "SELECT id, nombre, email, is_active FROM users WHERE email = 'admin@sgd.gob.pe';"

# 3. Verificar permisos
mysql -u summer4114 -p sgd_db -e "SELECT COUNT(*) as total_permisos FROM permissions;"

# 4. Verificar roles
mysql -u summer4114 -p sgd_db -e "SELECT * FROM roles;"

# 5. Test de login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sgd.gob.pe","password":"Admin123!"}'
```

---

## 📚 REFERENCIAS

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MySQL Security Best Practices](https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [GDPR Compliance](https://gdpr.eu/)

---

**Última actualización:** 13 de Noviembre 2025  
**Versión del sistema:** 3.5.0  
**Estado:** Production Ready ✅
