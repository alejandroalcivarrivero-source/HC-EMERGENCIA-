# Guía de solución para el error EPERM con esbuild en Windows

El error "spawn EPERM" con esbuild es común en Windows y generalmente se debe a:

1. **Antivirus bloqueando el ejecutable**
2. **Permisos insuficientes**
3. **Archivo bloqueado por Windows**

## Soluciones (en orden de prioridad):

### Solución 1: Ejecutar PowerShell como Administrador
1. Cierra todas las ventanas de PowerShell/Cursor
2. Abre PowerShell como Administrador (clic derecho > Ejecutar como administrador)
3. Navega a la carpeta del frontend:
   ```powershell
   cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
   ```
4. Ejecuta:
   ```powershell
   .\fix-esbuild-permissions.ps1
   npm run dev
   ```

### Solución 2: Agregar excepción en el Antivirus
1. Abre tu antivirus (Windows Defender u otro)
2. Agrega una excepción para la carpeta:
   `D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend\node_modules\esbuild`

### Solución 3: Desbloquear el archivo manualmente
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
Unblock-File -Path "node_modules\esbuild\esbuild.exe"
npm run dev
```

### Solución 4: Reinstalar esbuild con permisos elevados
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
Remove-Item -Recurse -Force node_modules\esbuild
npm install esbuild --save-dev
npm run dev
```

## Verificar que el túnel SSH esté activo

Antes de iniciar el backend, asegúrate de que el túnel SSH esté corriendo:
- `localhost:3307` → `172.16.1.248:3306` (MariaDB)

## Comandos para iniciar los servidores:

**Backend:**
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\backend"
npm start
```

**Frontend (después de resolver el problema de permisos):**
```powershell
cd "D:\HC EMERGENCIA_act\HC EMERGENCIA\frontend"
npm run dev
```
