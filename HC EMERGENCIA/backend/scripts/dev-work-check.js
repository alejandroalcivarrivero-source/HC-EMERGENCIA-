#!/usr/bin/env node

/**
 * Script de verificación previa para dev:work
 * Verifica dependencias y configuración antes de iniciar el servidor
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

console.log('🔍 Verificando entorno de desarrollo...\n');

let hasErrors = false;
let hasWarnings = false;

// 1. Verificar que node_modules existe
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ Error: node_modules no encontrado. Ejecuta: npm install');
  hasErrors = true;
} else {
  console.log('✅ node_modules encontrado');
}

// 2. Verificar package.json vs package-lock.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');

if (!fs.existsSync(packageLockPath)) {
  console.warn('⚠️  Advertencia: package-lock.json no encontrado. Ejecuta: npm install');
  hasWarnings = true;
} else {
  try {
    // Verificar si hay diferencias entre package.json y lo instalado
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Verificar dependencias críticas
    const criticalDeps = ['dotenv', 'sequelize', 'mariadb', 'express', 'nodemon'];
    const missingDeps = [];
    
    for (const dep of criticalDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!fs.existsSync(depPath)) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.warn(`⚠️  Advertencia: Dependencias críticas faltantes: ${missingDeps.join(', ')}`);
      console.warn('   Ejecuta: npm install');
      hasWarnings = true;
    } else {
      console.log('✅ Dependencias críticas verificadas');
    }
  } catch (error) {
    console.warn('⚠️  No se pudo verificar dependencias:', error.message);
    hasWarnings = true;
  }
}

// 3. Verificar archivo .env
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: Archivo .env no encontrado');
  hasErrors = true;
} else {
  console.log('✅ Archivo .env encontrado');
  
  // Verificar variables críticas
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DB_WORK_HOST', 'DB_HOME_HOST', 'JWT_SECRET'];
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Advertencia: Variables de entorno faltantes: ${missingVars.join(', ')}`);
    hasWarnings = true;
  }
}

// 4. Verificar túnel SSH (puerto 3307)
console.log('\n🔌 Verificando túnel SSH...');
const checkPort = (port, host = '127.0.0.1') => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
};

(async () => {
  const sshTunnelOpen = await checkPort(3307);
  
  if (sshTunnelOpen) {
    console.log('✅ Túnel SSH detectado en localhost:3307');
    console.log('   El túnel conecta a: 172.16.1.248:3306 (Servidor Debian)');
  } else {
    console.warn('⚠️  Advertencia: No se detecta túnel SSH en localhost:3307');
    console.warn('   Si estás en casa, asegúrate de tener el túnel SSH activo:');
    console.warn('   ssh -N -L 3307:172.16.1.248:3306 TICS@26.223.87.142');
    console.warn('   Arquitectura: Casa -> PC Puente (26.223.87.142) -> Servidor Debian (172.16.1.248:3306)');
    console.warn('   El sistema intentará conectar a la oficina primero (172.16.1.248:3306), luego a casa (localhost:3307).');
    hasWarnings = true;
  }
  
  // 5. Resumen final
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.error('❌ Se encontraron errores. Por favor, corrígelos antes de continuar.');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('⚠️  Se encontraron advertencias, pero puedes continuar.');
    console.log('🚀 Iniciando servidor en modo desarrollo...\n');
    process.exit(0);
  } else {
    console.log('✅ Todas las verificaciones pasaron correctamente.');
    console.log('🚀 Iniciando servidor en modo desarrollo...\n');
    process.exit(0);
  }
})();
