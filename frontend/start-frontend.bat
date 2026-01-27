@echo off
REM Script para iniciar el frontend con solución al error EPERM
REM Ejecutar este script como Administrador si es necesario

echo Verificando permisos de esbuild...
cd /d "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"

REM Intentar desbloquear el archivo esbuild.exe
powershell -Command "Unblock-File -Path 'node_modules\esbuild\esbuild.exe' -ErrorAction SilentlyContinue"

echo Iniciando servidor de desarrollo...
npm run dev

pause
