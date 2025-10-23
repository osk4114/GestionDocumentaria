# 📤 Guía para Subir el Proyecto al Repositorio

## ✅ Pre-requisitos Verificados

- ✅ README.md creado
- ✅ .gitignore configurado
- ✅ Código funcional
- ✅ Bugs documentados

---

## 🚀 Comandos para Push al Repositorio

### Paso 1: Inicializar Git (si no está inicializado)

```powershell
cd C:\Users\educacion_vial_2\Desktop\GestionDocumentaria
git init
```

### Paso 2: Configurar el Remoto

```powershell
git remote add origin https://github.com/osk4114/GestionDocumentaria.git
```

**Verificar remoto:**
```powershell
git remote -v
```

### Paso 3: Agregar Archivos al Staging

```powershell
# Agregar todos los archivos
git add .

# O agregar específicos si prefieres:
git add README.md
git add package.json
git add server.js
git add config/
git add controllers/
git add models/
git add routes/
git add services/
git add middleware/
git add utils/
git add docs/
git add .gitignore
```

### Paso 4: Verificar lo que se va a Commitear

```powershell
git status
```

**Asegúrate que NO aparezcan:**
- ❌ node_modules/
- ❌ .env
- ❌ uploads/
- ❌ *.log

### Paso 5: Hacer Commit

```powershell
git commit -m "Add: Sistema completo FASE 1 y FASE 2 - Backend SGD DRTC Puno

- Implementación completa de autenticación JWT
- CRUDs administrativos (Áreas, Roles, Usuarios, Tipos Doc)
- Gestión de documentos con trazabilidad
- Filtros y consultas avanzadas (FASE 2)
- 50+ endpoints REST API
- WebSocket para notificaciones
- Testing scripts incluidos
- Documentación completa

Estado: FASE 1 (100%), FASE 2 (95%)
Bugs conocidos documentados en README
"
```

### Paso 6: Push al Repositorio

```powershell
# Primera vez (crear rama main y push)
git branch -M main
git push -u origin main

# Si ya existe el repo y quieres forzar (¡CUIDADO!)
# git push -f origin main
```

### Paso 7: Verificar en GitHub

Abrir en navegador:
```
https://github.com/osk4114/GestionDocumentaria
```

Verificar que aparezcan:
- ✅ README.md formateado correctamente
- ✅ Estructura de carpetas
- ✅ Archivos de código
- ✅ Documentación en docs/

---

## 🔄 Comandos para Actualizaciones Futuras

### Después de hacer cambios:

```powershell
# Ver cambios
git status

# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "Fix: Corregir bug en búsqueda avanzada

- Arreglar validación de parámetros vacíos
- Corregir join con tabla senders
- Agregar tests para edge cases
"

# Push
git push origin main
```

---

## 🌿 Trabajar con Ramas (Recomendado)

### Para nuevas features:

```powershell
# Crear y cambiar a nueva rama
git checkout -b feature/fase3-frontend

# Hacer cambios y commits
git add .
git commit -m "Add: Componente de login en Angular"

# Push de la rama
git push origin feature/fase3-frontend

# Luego crear Pull Request en GitHub
```

### Para hotfixes:

```powershell
# Crear rama de hotfix
git checkout -b hotfix/search-endpoint

# Hacer el fix y commit
git add .
git commit -m "Fix: Corregir error 500 en /api/documents/search"

# Push y merge rápido
git push origin hotfix/search-endpoint
```

---

## 📋 Checklist Pre-Push

Antes de hacer push, verificar:

- [ ] El servidor arranca sin errores (`npm run dev`)
- [ ] Los tests pasan (`.\test-simple.ps1`)
- [ ] No hay archivos sensibles (.env, passwords)
- [ ] El README está actualizado
- [ ] Los bugs están documentados
- [ ] El .gitignore funciona correctamente
- [ ] No hay `node_modules/` en el staging

---

## 🆘 Solución de Problemas

### Error: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/osk4114/GestionDocumentaria.git
```

### Error: "failed to push some refs"

```powershell
# Hacer pull primero
git pull origin main --allow-unrelated-histories

# Resolver conflictos si hay
# Luego push
git push origin main
```

### Error: "Permission denied"

Verificar autenticación GitHub:
```powershell
# Usar Personal Access Token en lugar de password
# O configurar SSH keys
```

### Quiero deshacer el último commit (SIN push aún)

```powershell
# Mantener cambios en archivos
git reset --soft HEAD~1

# Descartar cambios también
git reset --hard HEAD~1
```

---

## 📊 Resumen del Proyecto a Subir

### Archivos y Carpetas Principales:

```
GestionDocumentaria/
├── 📄 README.md                 ← Documentación completa
├── 📄 package.json              ← Dependencias
├── 📄 server.js                 ← Entry point
├── 📄 .gitignore                ← Archivos ignorados
├── 📄 .env.example              ← Ejemplo de configuración
│
├── 📁 config/                   ← Configuraciones (SQL incluido)
├── 📁 controllers/              ← 6 controladores
├── 📁 models/                   ← 12 modelos Sequelize
├── 📁 routes/                   ← 6 archivos de rutas
├── 📁 services/                 ← Lógica de negocio
├── 📁 middleware/               ← 4 middlewares
├── 📁 utils/                    ← Utilidades
│
├── 📁 docs/                     ← Documentación adicional
│   ├── ADMIN_CRUDS.md
│   ├── TESTING_ADMIN_CRUDS.md
│   └── FASE2_FILTROS_CONSULTAS.md
│
└── 📁 tests/                    ← Scripts de testing
    ├── test-simple.ps1
    ├── test-fase2.ps1
    └── seed-test-data.js
```

### Estadísticas del Proyecto:

- **Líneas de código:** ~15,000+
- **Archivos:** 50+
- **Endpoints:** 50+
- **Modelos:** 12
- **Tablas BD:** 12
- **Fase completada:** FASE 1 (100%), FASE 2 (95%)

---

## 🎉 ¡Listo para Subir!

Ejecuta los comandos del **Paso 1 al 6** y tu proyecto estará en GitHub.

---

**Fecha:** 23 de Octubre, 2025  
**Repositorio:** https://github.com/osk4114/GestionDocumentaria  
**Estado:** Listo para Push 🚀
