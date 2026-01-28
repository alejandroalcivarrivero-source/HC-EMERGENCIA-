/**
 * Verificación directa contra la base de datos EMERGENCIA.
 * Usa la misma configuración que el backend (TRABAJO/CASA/AUTO).
 * Ejecutar desde backend: node scripts/verificar_bd_directo.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Sequelize } = require('sequelize');

const DB_CONFIG = {
  TRABAJO: {
    host: process.env.DB_HOST_TRABAJO || '172.16.1.248',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'TICS',
    password: process.env.DB_PASSWORD || 'TICS20141',
    database: process.env.DB_NAME || 'EMERGENCIA',
    dialect: 'mariadb'
  },
  CASA: {
    host: process.env.DB_HOST_CASA || '127.0.0.1',
    port: process.env.DB_PORT_CASA || '3308',
    user: process.env.DB_USER || 'TICS',
    password: process.env.DB_PASSWORD_CASA || process.env.DB_PASSWORD || 'TICS20141',
    database: process.env.DB_NAME || 'EMERGENCIA',
    dialect: 'mariadb'
  }
};

function createConn() {
  const mode = process.env.DB_MODE || 'AUTO';
  let config = mode === 'CASA' ? DB_CONFIG.CASA : DB_CONFIG.TRABAJO;
  return new Sequelize(config.database, config.user, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'mariadb',
    logging: false
  });
}

const sequelize = createConn();

function q(sql, replacements = []) {
  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    replacements
  });
}

async function run() {
  const report = { ok: true, errors: [], base: null, tables: [], checks: {} };

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la BD establecida.\n');
  } catch (e) {
    console.error('❌ No se pudo conectar a la BD:', e.message);
    if (process.env.DB_MODE === 'AUTO') {
      console.log('Intentando con CASA (túnel)...');
      Object.assign(sequelize.config, DB_CONFIG.CASA);
      try {
        await sequelize.authenticate();
        console.log('✅ Conexión vía CASA establecida.\n');
      } catch (e2) {
        console.error('❌ CASA tampoco:', e2.message);
        process.exit(1);
      }
    } else process.exit(1);
  }

  try {
    const dbRows = await sequelize.query('SELECT DATABASE() AS db', { type: sequelize.QueryTypes.SELECT });
    const dbName = (dbRows[0] && dbRows[0].db) || process.env.DB_NAME || 'EMERGENCIA';
    report.base = dbName;
    console.log(`📂 Base de datos: ${dbName}\n`);

    const schema = dbName;

    // 1) Listar tablas
    const tables = await q(`
      SELECT TABLE_NAME AS nombre
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `, [schema]);
    report.tables = tables.map(t => t.nombre);
    console.log('📋 Tablas en la BD:');
    console.log(tables.map(t => '  - ' + t.nombre).join('\n'));

    // 2) Tablas que el código espera
    const esperadas = [
      'CERTIFICADOS_FIRMA',
      'configuracion_audio_tv',
      'DETALLE_DIAGNOSTICOS',
      'LOG_REASIGNACIONES_MEDICAS',
      'ADMISIONES',
      'ATENCION_EMERGENCIA',
      'ATENCION_PACIENTE_ESTADO',
      'CUMPLIMIENTO_PROCEDIMIENTOS',
      'CAT_CIE10',
      'multimedia_tv'
    ];
    const tablasLower = report.tables.map(t => t.toLowerCase());
    report.checks.tablas_esperadas = {};
    console.log('\n📌 Tablas esperadas por el código:');
    for (const t of esperadas) {
      const existe = tablasLower.includes(t.toLowerCase());
      report.checks.tablas_esperadas[t] = existe;
      console.log(`  ${existe ? '✅' : '❌'} ${t}`);
    }

    // 3) Vista v_cie10_completo
    const vistas = await q(`
      SELECT TABLE_NAME FROM information_schema.VIEWS
      WHERE TABLE_SCHEMA = ? AND LOWER(TABLE_NAME) = 'v_cie10_completo'
    `, [schema]);
    const tieneVista = Array.isArray(vistas) && vistas.length > 0;
    report.checks.v_cie10_completo = tieneVista;
    console.log(`\n📌 Vista v_cie10_completo: ${tieneVista ? '✅ OK' : '❌ FALTA'}`);

    // 4) Columnas DETALLE_DIAGNOSTICOS
    const colDetalle = await q(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'DETALLE_DIAGNOSTICOS'
      ORDER BY ORDINAL_POSITION
    `, [schema]);
    report.checks.DETALLE_DIAGNOSTICOS = { columnas: colDetalle };
    const colsDet = (colDetalle || []).map(c => c.COLUMN_NAME);
    const tieneAtencionNueva = colsDet.some(c => /atencion_emergencia_id/i.test(c));
    const tieneAtencionVieja = colsDet.some(c => /^atencion_id$/i.test(c));
    const tieneCodigoCie10 = colsDet.some(c => /codigo_cie10/i.test(c));
    const tieneCie10Id = colsDet.some(c => /^cie10_id$/i.test(c));
    const tienePadreId = colsDet.some(c => /padre_id/i.test(c));
    const tieneEscausa = colsDet.some(c => /es_causa_externa/i.test(c));
    const tipoDiag = (colDetalle || []).find(c => /tipo_diagnostico/i.test(c.COLUMN_NAME));
    const tieneEstadistico = tipoDiag && /ESTADISTICO/i.test(String(tipoDiag.COLUMN_TYPE || ''));

    console.log('\n📌 DETALLE_DIAGNOSTICOS:');
    console.log('  Columnas:', colsDet.length ? colsDet.join(', ') : '(tabla no existe)');
    console.log('  atencion_emergencia_id:', tieneAtencionNueva ? '✅' : '❌');
    console.log('  atencion_id (viejo):', tieneAtencionVieja ? '⚠️ presente' : '-');
    console.log('  codigo_cie10:', tieneCodigoCie10 ? '✅' : '❌');
    console.log('  cie10_id (viejo):', tieneCie10Id ? '⚠️ presente' : '-');
    console.log('  padre_id:', tienePadreId ? '✅' : '❌');
    console.log('  es_causa_externa:', tieneEscausa ? '✅' : '❌');
    console.log('  tipo_diagnostico con ESTADISTICO:', tieneEstadistico ? '✅' : '❌');

    // 5) Columnas LOG_REASIGNACIONES_MEDICAS
    const colLog = await q(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'LOG_REASIGNACIONES_MEDICAS'
      ORDER BY ORDINAL_POSITION
    `, [schema]);
    report.checks.LOG_REASIGNACIONES_MEDICAS = { columnas: colLog };
    const colsLog = (colLog || []).map(c => c.COLUMN_NAME);
    const logAtencionNueva = colsLog.some(c => /atencion_emergencia_id/i.test(c));
    const logMedicoAnt = colsLog.some(c => /medico_anterior_id/i.test(c));
    const logMedicoNuevo = colsLog.some(c => /medico_nuevo_id/i.test(c));
    const logReasignador = colsLog.some(c => /usuario_reasignador_id/i.test(c));

    console.log('\n📌 LOG_REASIGNACIONES_MEDICAS:');
    console.log('  Columnas:', colsLog.length ? colsLog.join(', ') : '(tabla no existe)');
    console.log('  atencion_emergencia_id:', logAtencionNueva ? '✅' : '❌');
    console.log('  medico_anterior_id:', logMedicoAnt ? '✅' : '❌');
    console.log('  medico_nuevo_id:', logMedicoNuevo ? '✅' : '❌');
    console.log('  usuario_reasignador_id:', logReasignador ? '✅' : '❌');

    // 6) ADMISIONES: fecha_actualizacion vs fecha_ultima_actividad
    const colAdm = await q(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ADMISIONES'
      ORDER BY ORDINAL_POSITION
    `, [schema]);
    report.checks.ADMISIONES = { columnas: colAdm };
    const colsAdm = (colAdm || []).map(c => c.COLUMN_NAME);
    const admFechaActual = colsAdm.some(c => /fecha_actualizacion/i.test(c));
    const admFechaUltima = colsAdm.some(c => /fecha_ultima_actividad/i.test(c));

    console.log('\n📌 ADMISIONES:');
    console.log('  fecha_actualizacion:', admFechaActual ? '✅' : '❌');
    console.log('  fecha_ultima_actividad:', admFechaUltima ? '✅' : '❌');

    // 7) CUMPLIMIENTO_PROCEDIMIENTOS
    const colCump = await q(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'CUMPLIMIENTO_PROCEDIMIENTOS'
      ORDER BY ORDINAL_POSITION
    `, [schema]);
    report.checks.CUMPLIMIENTO_PROCEDIMIENTOS = { columnas: colCump };
    const colsCump = (colCump || []).map(c => c.COLUMN_NAME);
    const cumpLibre = colsCump.some(c => /nombre_procedimiento_libre/i.test(c));

    console.log('\n📌 CUMPLIMIENTO_PROCEDIMIENTOS:');
    console.log('  nombre_procedimiento_libre:', cumpLibre ? '✅' : '❌');

    // Resumen
    const faltan = esperadas.filter(t => !tablasLower.includes(t.toLowerCase()));
    if (faltan.length) report.errors.push('Tablas faltantes: ' + faltan.join(', '));
    if (!tieneVista) report.errors.push('Vista v_cie10_completo falta');
    if (colDetalle.length && (!tieneAtencionNueva || !tieneCodigoCie10 || !tienePadreId || !tieneEscausa || !tieneEstadistico)) {
      report.errors.push('DETALLE_DIAGNOSTICOS: faltan columnas o ESTADISTICO');
    }
    if (colLog.length && (!logAtencionNueva || !logMedicoAnt || !logMedicoNuevo || !logReasignador)) {
      report.errors.push('LOG_REASIGNACIONES_MEDICAS: estructura desfasada');
    }
    report.ok = report.errors.length === 0;

    console.log('\n' + (report.ok ? '✅ Verificación OK.' : '⚠️ Hay observaciones. Ver arriba y docs/VERIFICACION_EMERGENCIA_ACT_VS_CODIGO.md'));
    if (report.errors.length) {
      console.log('\nErrores/observaciones:');
      report.errors.forEach(e => console.log('  -', e));
    }

    return report;
  } catch (err) {
    console.error('Error durante verificación:', err);
    report.ok = false;
    report.errors.push(String(err.message));
    throw err;
  } finally {
    await sequelize.close();
  }
}

run().catch(() => process.exit(1));
