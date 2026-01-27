@echo off
REM Libera el puerto 3001 (evita EADDRINUSE al levantar el backend)
echo Buscando proceso que usa el puerto 3001...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3001') do (
  echo Cerrando PID %%a
  taskkill /PID %%a /F 2>nul
  goto :done
)
echo No se encontro ningun proceso en el puerto 3001.
:done
pause
