@echo off
echo ========================================
echo   Sistema de Gestion Documentaria
echo   Iniciando servicios...
echo ========================================
echo.

REM Verificar que Node.js este instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

REM Verificar que npm este instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta instalado
    pause
    exit /b 1
)

echo [1/4] Verificando MySQL...
REM Aqui se podria agregar una verificacion de MySQL si es necesario

echo [2/4] Iniciando Backend (Node.js)...
start "SGD Backend" cmd /k "cd /d %~dp0 && node server.js"
timeout /t 3 /nobreak >nul

echo [3/4] Iniciando Frontend (Angular)...
start "SGD Frontend" cmd /k "cd /d %~dp0sgd-frontend && npm start"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Servicios iniciados correctamente!
echo ========================================
echo.
echo Backend (API):  http://localhost:3000
echo Frontend (Web): http://localhost:4200
echo.
echo Para acceder desde otros dispositivos en la red:
echo 1. Verifica tu IP local con: ipconfig
echo 2. Accede desde: http://TU_IP:4200
echo.
echo Para acceso online (DevTunnels):
echo 1. El proxy de Angular redirige automaticamente
echo 2. Solo necesitas exponer el puerto 4200
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

start http://localhost:4200

echo.
echo Para detener los servicios, cierra las ventanas de Backend y Frontend
echo.
