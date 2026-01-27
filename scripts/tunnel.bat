@echo off
REM Script para crear túnel SSH a la base de datos desde casa
REM Redirige puerto local 3308 -> 172.16.1.248:3306 en el puente

echo ========================================
echo   TUNEL SSH - Base de Datos HC Emergencia
echo ========================================
echo.
echo Creando túnel SSH...
echo Puerto local: 3308 - Destino: 172.16.1.248:3306
echo Servidor SSH (puente): 26.223.87.142
echo Usuario: TICS
echo.
echo NOTA: Este script mantendrá la ventana abierta mientras el túnel esté activo.
echo       Para cerrar el túnel, presiona Ctrl+C
echo.
echo ========================================
echo.

REM Verificar si SSH está disponible
where ssh >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: SSH no está disponible en tu sistema.
    echo Por favor, instala OpenSSH o Git Bash.
    pause
    exit /b 1
)

REM Crear el túnel SSH: 3308 local -> 172.16.1.248:3306
REM ssh -L [puerto_local]:[host_remoto]:[puerto_remoto] [usuario]@[servidor_ssh]
ssh -L 3308:172.16.1.248:3306 TICS@26.223.87.142

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: No se pudo establecer el túnel SSH.
    echo Verifica:
    echo   1. Que tengas conexión a internet
    echo   2. Que el servidor 26.223.87.142 esté accesible
    echo   3. Que tengas las credenciales SSH correctas
    echo.
    pause
    exit /b 1
)
