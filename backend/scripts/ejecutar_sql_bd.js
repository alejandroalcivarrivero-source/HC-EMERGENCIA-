/**
 * Ejecuta scripts SQL contra la BD EMERGENCIA.
 * Usa la misma configuración que el backend.
 * Uso: node scripts/ejecutar_sql_bd.js [ruta1] [ruta2] ...
 * Sin argumentos: ejecuta los scripts por defecto (configuracion_audio, diagnósticos).
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sequelize = require('../config/database');

function stripComments(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitStatements(sql) {
  const cleaned = stripComments(sql);
  const parts = cleaned.split(';').map(s => s.trim()).filter(Boolean);
  return parts.map(p => p + ';');
}

async function runFile(filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ No existe: ${fullPath}`);
    return { ok: false, file: filePath, errors: ['Archivo no encontrado'] };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const statements = splitStatements(content);
  const errors = [];
  let run = 0;
  for (const stmt of statements) {
    if (!stmt || stmt === ';') continue;
    try {
      await sequelize.query(stmt);
      run++;
    } catch (e) {
      const msg = e.message || String(e);
      const skip = /duplicate|already exists|Duplicate column|Duplicate key|exists|1060|1061|1062/i.test(msg);
      if (skip) {
        console.log(`  ⏭️ Omitido (ya existe o duplicado): ${msg.slice(0, 80)}...`);
      } else {
        console.error(`  ❌ Error: ${msg}`);
        errors.push(msg);
      }
    }
  }
  return { ok: errors.length === 0, file: filePath, run, errors };
}

async function run() {
  const defaultScripts = [
    'scripts/crear_tabla_configuracion_audio.sql',
    'scripts/diagnosticos_form008_seccion_lm.sql'
  ];
  const scripts = process.argv.slice(2).length ? process.argv.slice(2) : defaultScripts;

  try {
    if (sequelize.connectWithFallback) {
        await sequelize.connectWithFallback();
    } else {
        await sequelize.authenticate();
    }
    console.log('✅ Conexión a la BD establecida.\n');
  } catch (e) {
    console.error('❌ No se pudo conectar a la BD:', e.message);
    process.exit(1);
  }

  const results = [];
  for (const script of scripts) {
    console.log(`\n📄 Ejecutando: ${script}`);
    const r = await runFile(script);
    results.push(r);
    console.log(`   ${r.run} sentencia(s) ejecutada(s)${r.errors.length ? `, ${r.errors.length} error(es)` : ''}.`);
  }

  await sequelize.close();
  const fail = results.some(r => !r.ok);
  if (fail) {
    console.log('\n⚠️ Algunos scripts reportaron errores (revisar arriba).');
    process.exit(1);
  }
  console.log('\n✅ Scripts ejecutados correctamente.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
