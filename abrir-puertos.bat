@echo off
echo ========================================
echo   Configurando Firewall para SGD
echo ========================================
echo.
echo Solicitando permisos de administrador...
echo.

:: Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo OK - Ejecutando como Administrador
    echo.
) else (
    echo ERROR: Este script necesita permisos de Administrador
    echo.
    echo Pasos:
    echo 1. Click derecho en este archivo
    echo 2. Seleccionar "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

:: Eliminar reglas antiguas
echo Eliminando reglas antiguas...
netsh advfirewall firewall delete rule name="SGD - Backend API" >nul 2>&1
netsh advfirewall firewall delete rule name="SGD - Frontend Angular" >nul 2>&1
echo OK - Reglas antiguas eliminadas
echo.

:: Crear regla para Backend (Puerto 3000)
echo Abriendo puerto 3000 (Backend)...
netsh advfirewall firewall add rule name="SGD - Backend API" dir=in action=allow protocol=TCP localport=3000 profile=any description="Backend del Sistema de Gestion Documentaria"
if %errorLevel% == 0 (
    echo OK - Puerto 3000 abierto correctamente
) else (
    echo ERROR al abrir puerto 3000
)
echo.

:: Crear regla para Frontend (Puerto 4200)
echo Abriendo puerto 4200 (Frontend)...
netsh advfirewall firewall add rule name="SGD - Frontend Angular" dir=in action=allow protocol=TCP localport=4200 profile=any description="Frontend del Sistema de Gestion Documentaria"
if %errorLevel% == 0 (
    echo OK - Puerto 4200 abierto correctamente
) else (
    echo ERROR al abrir puerto 4200
)
echo.

:: Mostrar IP local
echo ========================================
echo   Configuracion Completada
echo ========================================
echo.
echo Tu direccion IP en la red local:
ipconfig | findstr /C:"IPv4" | findstr /V "127.0.0.1"
echo.
echo URLs de acceso desde otros dispositivos:
echo   Frontend: http://192.168.42.10:4200
echo   Backend:  http://192.168.42.10:3000/api
echo.
echo Firewall configurado correctamente!
echo.
echo Proximos pasos:
echo 1. Inicia el backend:  npm run dev
echo 2. Inicia el frontend: cd sgd-frontend ^&^& npm start
echo 3. Accede desde otro dispositivo usando tu IP
echo.
pause
