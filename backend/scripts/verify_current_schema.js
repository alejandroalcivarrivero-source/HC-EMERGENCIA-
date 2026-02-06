const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuración directa para asegurar conexión a lo que hay en .env
const DB_CONFIG = {
    host: process.env.DB_HOST_TRABAJO || '172.16.1.248',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'TICS',
    password: process.env.DB_PASSWORD || 'TICS20141',
    database: process.env.DB_NAME || 'EMERGENCIA',
    dialect: 'mariadb',
    logging: false
};

// Si estamos en modo CASA, ajustar
if (process.env.DB_MODE === 'CASA') {
    DB_CONFIG.host = '127.0.0.1';
    DB_CONFIG.port = '3308';
}

console.log('Configuración cargada:', { ...DB_CONFIG, password: '****' });

const sequelize = new Sequelize(
    DB_CONFIG.database,
    DB_CONFIG.user,
    DB_CONFIG.password,
    {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        dialect: DB_CONFIG.dialect,
        logging: false
    }
);

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida.');

        const results = await sequelize.query('SELECT DATABASE() as current_db', { type: sequelize.QueryTypes.SELECT });
        const currentDb = results[0].current_db;
        console.log(`📂 Base de datos actual: ${currentDb}`);

        const databases = await sequelize.query('SHOW DATABASES', { type: sequelize.QueryTypes.SELECT });
        console.log('📚 Bases de datos disponibles:');
        databases.forEach(db => {
            console.log(` - ${db.Database}`);
        });
        
        // Verificar SISA_EC específicamente
        const sisaExists = databases.some(db => db.Database === 'SISA_EC');
        if (sisaExists) {
            console.log('✨ La base de datos SISA_EC EXISTE.');
            
            // Verificar tablas en SISA_EC
            const sisaTables = await sequelize.query('SHOW TABLES FROM SISA_EC', { type: sequelize.QueryTypes.SELECT });
            console.log(`📊 Tablas en SISA_EC: ${sisaTables.length}`);
        } else {
            console.log('⚠️ La base de datos SISA_EC NO existe aún.');
        }

        // Verificar tablas en la base conectada
        const currentTables = await sequelize.query('SHOW TABLES', { type: sequelize.QueryTypes.SELECT });
        console.log(`📊 Tablas en BD actual (${currentDb}): ${currentTables.length}`);

        // Verificar tablas en EMERGENCIA (antigua) explícitamente
        const oldTables = await sequelize.query('SHOW TABLES FROM EMERGENCIA', { type: sequelize.QueryTypes.SELECT });
        console.log(`📊 Tablas restantes en EMERGENCIA: ${oldTables.length}`);

        // --- VERIFICACIÓN DE INTEGRIDAD REFERENCIAL (Tablas Huérfanas) ---
        console.log('\n🔍 Verificando integridad de tablas críticas...');
        
        const fks = await sequelize.query(`
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('ADMISIONES', 'RECETA_MEDICA_DETALLES')
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `, { type: sequelize.QueryTypes.SELECT });

        const admisionesFKs = fks.filter(f => f.TABLE_NAME === 'ADMISIONES');
        const recetaDetallesFKs = fks.filter(f => f.TABLE_NAME === 'RECETA_MEDICA_DETALLES');

        const hasFormaLlegada = admisionesFKs.some(f => f.COLUMN_NAME === 'forma_llegada_id' && f.REFERENCED_TABLE_NAME === 'CAT_FORMAS_LLEGADA');
        const hasFuenteInfo = admisionesFKs.some(f => f.COLUMN_NAME === 'fuente_informacion_id' && f.REFERENCED_TABLE_NAME === 'CAT_FUENTES_INFORMACION');
        
        const hasRecetaLink = recetaDetallesFKs.some(f => f.COLUMN_NAME === 'receta_id' && f.REFERENCED_TABLE_NAME === 'RECETAS_MEDICAS');
        const hasMedicamentoLink = recetaDetallesFKs.some(f => f.COLUMN_NAME === 'medicamento_id' && f.REFERENCED_TABLE_NAME === 'CAT_MEDICAMENTOS');

        console.log('\nReporte de Integridad:');
        console.log('---------------------');
        console.log('ADMISIONES:');
        console.log(` - Vinculada a CAT_FORMAS_LLEGADA: ${hasFormaLlegada ? '✅ SI' : '❌ NO'}`);
        console.log(` - Vinculada a CAT_FUENTES_INFORMACION: ${hasFuenteInfo ? '✅ SI' : '❌ NO'}`);
        
        console.log('\nRECETA_MEDICA_DETALLES:');
        console.log(` - Vinculada a RECETAS_MEDICAS: ${hasRecetaLink ? '✅ SI' : '❌ NO'}`);
        console.log(` - Vinculada a CAT_MEDICAMENTOS: ${hasMedicamentoLink ? '✅ SI' : '❌ NO'}`);

        if (hasFormaLlegada && hasFuenteInfo && hasRecetaLink && hasMedicamentoLink) {
            console.log('\n✅ RESULTADO FINAL: No existen tablas aisladas en el núcleo clínico revisado.');
        } else {
            console.log('\n⚠️ ADVERTENCIA: Se detectaron tablas con referencias faltantes.');
        }

        if (currentDb === 'SISA_EC') {
            console.log('\n🚀 ÉXITO: Estamos conectados a SISA_EC');
        } else {
            console.log(`\nℹ️ Todavía conectados a ${currentDb}`);
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    } finally {
        await sequelize.close();
    }
}

verify();
