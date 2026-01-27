# Script para resolver problemas de permisos con esbuild en Windows
# Ejecutar este script como Administrador si es necesario

Write-Host "Verificando y resolviendo problemas de permisos con esbuild..." -ForegroundColor Yellow

$esbuildPath = "node_modules\esbuild\esbuild.exe"
if (Test-Path $esbuildPath) {
    Write-Host "Encontrado esbuild.exe" -ForegroundColor Green
    
    # Intentar desbloquear el archivo (si está bloqueado por Windows)
    try {
        Unblock-File -Path $esbuildPath -ErrorAction SilentlyContinue
        Write-Host "Archivo desbloqueado" -ForegroundColor Green
    } catch {
        Write-Host "No se pudo desbloquear el archivo (puede requerir permisos de administrador)" -ForegroundColor Yellow
    }
    
    # Verificar permisos
    $acl = Get-Acl $esbuildPath
    Write-Host "Permisos actuales:" -ForegroundColor Cyan
    $acl | Format-List
    
} else {
    Write-Host "No se encontró esbuild.exe. Ejecutando npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host "`nSi el problema persiste:" -ForegroundColor Yellow
Write-Host "1. Agrega una excepción en tu antivirus para la carpeta node_modules" -ForegroundColor White
Write-Host "2. Ejecuta PowerShell como Administrador" -ForegroundColor White
Write-Host "3. Ejecuta este script nuevamente" -ForegroundColor White
