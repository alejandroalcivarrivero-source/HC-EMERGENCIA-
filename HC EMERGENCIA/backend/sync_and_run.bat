@echo off
REM ============================================
REM Script de Sincronización y Arranque Automático
REM ============================================
REM Este script automatiza todo el flujo de llegada a la oficina:
REM 1. Git Pull - Trae cambios desde casa
REM 2. npm install - Instala dependencias nuevas
REM 3. Verifica túnel SSH - Si no está activo, intenta levantarlo
REM 4. Inicia Backend en nueva ventana (npm run dev:work)
REM 5. Inicia Frontend en nueva ventana (npm run dev)
REM 6. Abre navegador en http://localhost:5173
REM ============================================

echo.
echo ========================================
echo   SINCRONIZACION Y ARRANQUE AUTOMATICO
echo ========================================
echo.

REM Cambiar al directorio del backend (por si se ejecuta desde otro lugar)
cd /d "%~dp0"

REM ============================================
REM CONFIGURACION SSH
REM ============================================
REM Arquitectura: PC puente (26.223.87.142) -> Servidor Debian (172.16.1.248:3306)
REM El túnel mapea localhost:3307 -> 172.16.1.248:3306 a través del PC puente
set SSH_USER=TICS
set SSH_HOST=26.223.87.142
set SSH_PORT_LOCAL=3307
set SSH_PORT_REMOTE=3306
set SSH_DEST_HOST=172.16.1.248

REM ============================================
REM PASO 1: Git Pull
REM ============================================
echo [1/6] Sincronizando con repositorio remoto...
echo.
git pull origin main
if errorlevel 1 (
    echo.
    echo ⚠️  Advertencia: Error al ejecutar git pull
    echo    Continuando de todas formas...
    echo.
) else (
    echo.
    echo ✅ Git pull completado
    echo.
)
timeout /t 2 /nobreak >nul

REM ============================================
REM PASO 2: Instalación de Dependencias
REM ============================================
echo [2/6] Instalando dependencias...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ❌ Error: Fallo la instalacion de dependencias
    echo    Revisa los errores anteriores
    pause
    exit /b 1
)
echo.
echo ✅ Dependencias instaladas correctamente
echo.
timeout /t 2 /nobreak >nul

REM ============================================
REM PASO 3: Verificación y Activación de Túnel SSH
REM ============================================
echo [3/6] Verificando tunel SSH...
echo.

REM Verificar si el puerto 3307 está en uso
netstat -an | findstr ":%SSH_PORT_LOCAL%" >nul
if errorlevel 1 (
    echo    Puerto %SSH_PORT_LOCAL% no esta en uso
    echo    Intentando levantar tunel SSH...
    echo.
    
    REM Verificar que SSH esté disponible
    where ssh >nul 2>&1
    if errorlevel 1 (
        echo    ⚠️  Advertencia: SSH no encontrado en PATH
        echo    No se puede levantar el tunel automaticamente
        echo    Levanta el tunel manualmente antes de continuar:
        echo    ssh -N -L %SSH_PORT_LOCAL%:%SSH_DEST_HOST%:%SSH_PORT_REMOTE% %SSH_USER%@%SSH_HOST%
        echo.
        echo    Presiona cualquier tecla para continuar sin tunel...
        pause >nul
    ) else (
        REM Intentar levantar el túnel SSH en una ventana visible para autenticación
        echo    Ejecutando: ssh -N -L %SSH_PORT_LOCAL%:%SSH_DEST_HOST%:%SSH_PORT_REMOTE% %SSH_USER%@%SSH_HOST%
        echo.
        echo    ⚠️  IMPORTANTE: Se abrira una ventana para el tunel SSH
        echo    ⚠️  Si es la primera vez, puede pedir confirmacion de host (escribe: yes)
        echo    ⚠️  Puede pedir contraseña o clave SSH
        echo    ⚠️  NO CIERRES esa ventana mientras trabajes
        echo.
        
        REM Abrir SSH en una ventana visible para que el usuario pueda ingresar contraseña
        start "TUNEL SSH - HC EMERGENCIA" cmd /k "echo ======================================== && echo   TUNEL SSH - HC EMERGENCIA && echo ======================================== && echo. && echo Conectando a %SSH_USER%@%SSH_HOST%... && echo Mapeando localhost:%SSH_PORT_LOCAL% -^> %SSH_DEST_HOST%:%SSH_PORT_REMOTE% && echo. && echo Si pide contraseña, ingresala ahora. && echo NO CIERRES esta ventana mientras trabajes. && echo. && ssh -N -L %SSH_PORT_LOCAL%:%SSH_DEST_HOST%:%SSH_PORT_REMOTE% %SSH_USER%@%SSH_HOST%"
        
        REM Esperar más tiempo para que el túnel se establezca (especialmente si requiere contraseña)
        echo    Esperando 8 segundos para que el tunel se establezca...
        timeout /t 8 /nobreak >nul
        
        REM Verificar nuevamente si el puerto está en uso
        netstat -an | findstr ":%SSH_PORT_LOCAL%" >nul
        if errorlevel 1 (
            echo    ⚠️  Advertencia: No se pudo verificar el tunel SSH
            echo    Verifica la ventana "TUNEL SSH - HC EMERGENCIA"
            echo    Si pide contraseña, ingresala en esa ventana
            echo    El sistema intentara conectar a la oficina primero, luego a casa
            echo.
        ) else (
            echo    ✅ Tunel SSH detectado en puerto %SSH_PORT_LOCAL%
            echo    La ventana "TUNEL SSH - HC EMERGENCIA" debe estar activa
            echo.
        )
    )
) else (
    echo    ✅ Tunel SSH ya esta activo en puerto %SSH_PORT_LOCAL%
    echo.
)
timeout /t 2 /nobreak >nul

REM ============================================
REM PASO 4: Iniciar Backend en Nueva Ventana
REM ============================================
echo [4/6] Iniciando Backend en nueva ventana...
echo.

REM Guardar ruta del backend
set BACKEND_DIR=%~dp0
set FRONTEND_DIR=%BACKEND_DIR%..\frontend

REM Abrir Backend en nueva ventana con título claro
start "BACKEND - HC EMERGENCIA" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev:work"

echo    ✅ Ventana de Backend abierta
echo    Puerto: http://localhost:3001
echo.
timeout /t 3 /nobreak >nul

REM ============================================
REM PASO 5: Iniciar Frontend en Nueva Ventana
REM ============================================
echo [5/6] Iniciando Frontend en nueva ventana...
echo.

REM Verificar que existe la carpeta frontend
if not exist "%FRONTEND_DIR%" (
    echo    ⚠️  Advertencia: No se encontro la carpeta frontend
    echo    Ruta esperada: %FRONTEND_DIR%
    echo    Continuando sin frontend...
    echo.
) else (
    REM Abrir Frontend en nueva ventana con título claro
    start "FRONTEND - HC EMERGENCIA" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"
    
    echo    ✅ Ventana de Frontend abierta
    echo    Puerto: http://localhost:5173
    echo.
    timeout /t 3 /nobreak >nul
)

REM ============================================
REM PASO 6: Abrir Navegador
REM ============================================
echo [6/6] Abriendo navegador...
echo.

REM Esperar un momento para que los servidores inicien
timeout /t 5 /nobreak >nul

REM Abrir navegador en la URL del frontend
start "" "http://localhost:5173"

echo    ✅ Navegador abierto en http://localhost:5173
echo.

REM ============================================
REM RESUMEN FINAL
REM ============================================
echo ========================================
echo   ENTORNO COMPLETO INICIADO
echo ========================================
echo.
echo ✅ Backend: http://localhost:3001
echo ✅ Frontend: http://localhost:5173
echo ✅ Navegador: Abierto automaticamente
echo.
echo Ventanas abiertas:
echo   - BACKEND - HC EMERGENCIA
echo   - FRONTEND - HC EMERGENCIA
echo   - TUNEL SSH - HC EMERGENCIA (si estas en casa)
echo.
echo ⚠️  IMPORTANTE: NO cierres la ventana del tunel SSH mientras trabajes
echo.
echo Puedes cerrar esta ventana cuando desees.
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
