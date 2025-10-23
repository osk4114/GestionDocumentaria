# Script de Testing para CRUDs Administrativos
# Sistema de Gestión Documentaria - DRTC Puno

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTING CRUDs ADMINISTRATIVOS - SGD  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASO 1: LOGIN Y OBTENER TOKEN
# ============================================
Write-Host "[1/8] Obteniendo token de administrador..." -ForegroundColor Yellow

try {
    $loginData = '{"email":"admin@sgd.com","password":"admin123"}'
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $response.data.accessToken
    $userName = $response.data.user.nombre
    
    Write-Host "OK Login exitoso - Usuario: $userName" -ForegroundColor Green
    Write-Host "OK Token obtenido" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR en login" -ForegroundColor Red
    exit
}

# Headers para requests autenticados
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# ============================================
# PASO 2: LISTAR ÁREAS EXISTENTES
# ============================================
Write-Host "[2/8] Listando áreas existentes..." -ForegroundColor Yellow

try {
    $areas = Invoke-RestMethod -Uri "http://localhost:3000/api/areas"
    Write-Host "✓ Total de áreas: $($areas.count)" -ForegroundColor Green
    $areas.data | Format-Table -Property id, nombre, sigla, isActive -AutoSize
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# PASO 3: CREAR NUEVAS ÁREAS
# ============================================
Write-Host "[3/8] Creando nuevas áreas..." -ForegroundColor Yellow

$nuevasAreas = @(
    @{
        nombre = "Oficina de Imagen Institucional"
        sigla = "OII"
        descripcion = "Responsable de la imagen institucional"
    },
    @{
        nombre = "Sub Dirección de Transportes"
        sigla = "SDT"
        descripcion = "Gestión y supervisión del transporte terrestre"
    },
    @{
        nombre = "Oficina de Planeamiento"
        sigla = "OPL"
        descripcion = "Planificación estratégica institucional"
    }
)

foreach ($area in $nuevasAreas) {
    try {
        $body = $area | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/areas" -Method Post -Headers $headers -Body $body
        Write-Host "  ✓ Creada: $($area.nombre) ($($area.sigla))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -like "*ya está registrada*" -or $_.Exception.Message -like "*ya existe*") {
            Write-Host "  ⚠ Ya existe: $($area.nombre)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Error: $($area.nombre) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host ""

# ============================================
# PASO 4: CREAR ROLES PERSONALIZADOS
# ============================================
Write-Host "[4/8] Creando roles personalizados..." -ForegroundColor Yellow

$nuevosRoles = @(
    @{
        nombre = "Jefe de Área"
        descripcion = "Jefe responsable de un área específica"
    },
    @{
        nombre = "Asistente Administrativo"
        descripcion = "Asistente de apoyo administrativo"
    },
    @{
        nombre = "Técnico Especialista"
        descripcion = "Técnico especializado en su área"
    }
)

foreach ($rol in $nuevosRoles) {
    try {
        $body = $rol | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/roles" -Method Post -Headers $headers -Body $body
        Write-Host "  ✓ Creado: $($rol.nombre)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -like "*ya existe*") {
            Write-Host "  ⚠ Ya existe: $($rol.nombre)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Error: $($rol.nombre) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host ""

# ============================================
# PASO 5: CREAR TIPOS DE DOCUMENTO
# ============================================
Write-Host "[5/8] Creando tipos de documento..." -ForegroundColor Yellow

$nuevosTipos = @(
    @{
        nombre = "Oficio Múltiple"
        codigo = "OFM"
        descripcion = "Oficio dirigido a múltiples destinatarios"
        diasMaxAtencion = 10
        requiereAdjunto = $true
    },
    @{
        nombre = "Memorándum"
        codigo = "MEM"
        descripcion = "Memorándum interno"
        diasMaxAtencion = 5
        requiereAdjunto = $false
    },
    @{
        nombre = "Informe"
        codigo = "INF"
        descripcion = "Informe técnico o administrativo"
        diasMaxAtencion = 15
        requiereAdjunto = $true
    },
    @{
        nombre = "Carta"
        codigo = "CAR"
        descripcion = "Carta institucional"
        diasMaxAtencion = 7
        requiereAdjunto = $false
    },
    @{
        nombre = "Resolución Directoral"
        codigo = "RD"
        descripcion = "Resolución emitida por la dirección"
        diasMaxAtencion = 30
        requiereAdjunto = $true
    }
)

foreach ($tipo in $nuevosTipos) {
    try {
        $body = $tipo | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/document-types" -Method Post -Headers $headers -Body $body
        Write-Host "  ✓ Creado: $($tipo.nombre) ($($tipo.codigo))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -like "*ya está registrad*" -or $_.Exception.Message -like "*ya existe*") {
            Write-Host "  ⚠ Ya existe: $($tipo.nombre)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Error: $($tipo.nombre) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host ""

# ============================================
# PASO 6: CREAR USUARIOS DE PRUEBA
# ============================================
Write-Host "[6/8] Creando usuarios de prueba..." -ForegroundColor Yellow

$nuevosUsuarios = @(
    @{
        nombre = "Juan Pérez Mamani"
        email = "juan.perez@drtc.gob.pe"
        password = "Password123!"
        rolId = 3
        areaId = 1
    },
    @{
        nombre = "María García López"
        email = "maria.garcia@drtc.gob.pe"
        password = "Password123!"
        rolId = 3
        areaId = 2
    }
)

foreach ($usuario in $nuevosUsuarios) {
    try {
        $body = $usuario | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method Post -Headers $headers -Body $body
        Write-Host "  ✓ Creado: $($usuario.nombre) - $($usuario.email)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -like "*ya está registrado*") {
            Write-Host "  ⚠ Ya existe: $($usuario.email)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Error: $($usuario.nombre) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host ""

# ============================================
# PASO 7: VERIFICAR DATOS CREADOS
# ============================================
Write-Host "[7/8] Verificando datos creados..." -ForegroundColor Yellow

# Áreas
$areas = Invoke-RestMethod -Uri "http://localhost:3000/api/areas"
Write-Host "  Total Áreas: $($areas.count)" -ForegroundColor Cyan

# Roles
$roles = Invoke-RestMethod -Uri "http://localhost:3000/api/roles"
Write-Host "  Total Roles: $($roles.count)" -ForegroundColor Cyan

# Tipos de Documento
$tipos = Invoke-RestMethod -Uri "http://localhost:3000/api/document-types"
Write-Host "  Total Tipos de Documento: $($tipos.count)" -ForegroundColor Cyan

# Usuarios
try {
    $usuarios = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Headers $headers
    Write-Host "  Total Usuarios: $($usuarios.count)" -ForegroundColor Cyan
} catch {
    Write-Host "  ⚠ No se pudo obtener usuarios" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# PASO 8: MOSTRAR RESUMEN
# ============================================
Write-Host "[8/8] Resumen de Áreas Activas:" -ForegroundColor Yellow
$areas.data | Where-Object { $_.isActive -eq $true } | Format-Table -Property id, nombre, sigla -AutoSize

Write-Host "Resumen de Tipos de Documento:" -ForegroundColor Yellow
$tipos.data | Format-Table -Property id, nombre, codigo, diasMaxAtencion -AutoSize

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ TESTING COMPLETADO EXITOSAMENTE   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoints disponibles:" -ForegroundColor Yellow
Write-Host "  - GET    http://localhost:3000/api/areas" -ForegroundColor White
Write-Host "  - GET    http://localhost:3000/api/roles" -ForegroundColor White
Write-Host "  - GET    http://localhost:3000/api/document-types" -ForegroundColor White
Write-Host "  - GET    http://localhost:3000/api/users (requiere auth)" -ForegroundColor White
Write-Host ""
