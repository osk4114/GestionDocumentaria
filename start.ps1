# Script de inicio para Sistema de Gestión Documentaria
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Gestión Documentaria" -ForegroundColor Cyan
Write-Host "  Iniciando servicios..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/4] Verificando Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js no está instalado" -ForegroundColor Red
    Write-Host "Por favor instala Node.js desde https://nodejs.org" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

$nodeVersion = node --version
Write-Host "✓ Node.js detectado: $nodeVersion" -ForegroundColor Green

# Verificar MySQL
Write-Host "[2/4] Verificando MySQL..." -ForegroundColor Yellow
Write-Host "✓ Asegúrate de que MySQL (XAMPP) esté corriendo" -ForegroundColor Green

# Iniciar Backend
Write-Host "[3/4] Iniciando Backend (Node.js)..." -ForegroundColor Yellow
$backendPath = $PSScriptRoot
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$backendPath`" && node server.js" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "✓ Backend iniciado en puerto 3000" -ForegroundColor Green

# Iniciar Frontend
Write-Host "[4/4] Iniciando Frontend (Angular)..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "sgd-frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$frontendPath`" && npm start" -WindowStyle Normal
Start-Sleep -Seconds 5
Write-Host "✓ Frontend iniciado en puerto 4200" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servicios iniciados correctamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener IP local
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress

Write-Host "📡 Acceso Local:" -ForegroundColor Cyan
Write-Host "   Backend (API):  http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend (Web): http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Acceso desde Red LAN:" -ForegroundColor Cyan
if ($localIP) {
    Write-Host "   Frontend: http://$localIP:4200" -ForegroundColor White
    Write-Host "   (El proxy redirige automáticamente al backend)" -ForegroundColor Gray
} else {
    Write-Host "   Ejecuta 'ipconfig' para ver tu IP local" -ForegroundColor White
}
Write-Host ""
Write-Host "☁️  Acceso Online (DevTunnels):" -ForegroundColor Cyan
Write-Host "   1. Expón solo el puerto 4200 con DevTunnels" -ForegroundColor White
Write-Host "   2. El proxy Angular redirige automáticamente a localhost:3000" -ForegroundColor Gray
Write-Host "   3. ¡Funciona sin configuración adicional!" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️  Cómo funciona:" -ForegroundColor Cyan
Write-Host "   • Localhost: http://localhost:4200 → /api → localhost:3000" -ForegroundColor White
Write-Host "   • LAN:       http://$localIP:4200 → /api → localhost:3000" -ForegroundColor White
Write-Host "   • DevTunnel: https://xxx.devtunnels.ms → /api → localhost:3000" -ForegroundColor White
Write-Host ""

# Abrir navegador
Write-Host "Abriendo navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:4200"

Write-Host ""
Write-Host "Para detener los servicios, cierra las ventanas de Backend y Frontend" -ForegroundColor Yellow
Write-Host ""
