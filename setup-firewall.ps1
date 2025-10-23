# Script para configurar el Firewall de Windows para SGD
# Ejecutar como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuracion de Firewall - SGD     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Yellow
    Write-Host "1. Click derecho en PowerShell" -ForegroundColor White
    Write-Host "2. Seleccionar 'Ejecutar como administrador'" -ForegroundColor White
    Write-Host "3. Ejecutar el script de nuevo" -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "OK - Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# Eliminar reglas existentes si existen
Write-Host "Buscando reglas existentes..." -ForegroundColor Yellow
$existingRules = Get-NetFirewallRule -DisplayName "SGD*" -ErrorAction SilentlyContinue

if ($existingRules) {
    Write-Host "Eliminando reglas antiguas..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "SGD*" -ErrorAction SilentlyContinue
    Write-Host "OK - Reglas antiguas eliminadas" -ForegroundColor Green
}

Write-Host ""

# Crear regla para Backend (Puerto 3000)
Write-Host "Creando regla para Backend (puerto 3000)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "SGD - Backend API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Domain,Private,Public -Description "Permite conexiones al backend del Sistema de Gestion Documentaria" -ErrorAction Stop | Out-Null
    Write-Host "OK - Regla para Backend creada correctamente" -ForegroundColor Green
}
catch {
    Write-Host "ERROR al crear regla de Backend" -ForegroundColor Red
}

Write-Host ""

# Crear regla para Frontend (Puerto 4200)
Write-Host "Creando regla para Frontend (puerto 4200)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "SGD - Frontend Angular" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow -Profile Domain,Private,Public -Description "Permite conexiones al frontend del Sistema de Gestion Documentaria" -ErrorAction Stop | Out-Null
    Write-Host "OK - Regla para Frontend creada correctamente" -ForegroundColor Green
}
catch {
    Write-Host "ERROR al crear regla de Frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuracion Completada            " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar IP local
Write-Host "Tu direccion IP en la red local:" -ForegroundColor Cyan
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"}).IPAddress | Select-Object -First 1

if ($ipAddress) {
    Write-Host "   $ipAddress" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs de acceso desde otros dispositivos:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://${ipAddress}:4200" -ForegroundColor White
    Write-Host "   Backend:  http://${ipAddress}:3000/api" -ForegroundColor White
}
else {
    Write-Host "   No se pudo detectar la IP automaticamente" -ForegroundColor Yellow
    Write-Host "   Ejecuta 'ipconfig' para ver tu IP" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Firewall configurado correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "1. Inicia el backend:  npm run dev" -ForegroundColor White
Write-Host "2. Inicia el frontend: npm start (en otra terminal)" -ForegroundColor White
Write-Host "3. Accede desde otro dispositivo usando la IP mostrada arriba" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter para salir"
