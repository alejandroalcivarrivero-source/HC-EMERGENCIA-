const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST_TRABAJO || '172.16.1.248',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'TICS',
    password: process.env.DB_PASSWORD || 'TICS20141',
    database: 'SISA_EC', // Forzamos SISA_EC para la auditoría
    dialect: 'mariadb',
    logging: false
};

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

async function audit() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión establecida a SISA_EC.');

        // 1. Obtener todas las tablas
        const tables = await sequelize.query('SHOW TABLES', { type: sequelize.QueryTypes.SELECT });
        const tableNames = tables.map(t => Object.values(t)[0]).sort();
        
        console.log('\n=== LISTADO DE TABLAS EN SISA_EC ===');
        console.log(JSON.stringify(tableNames, null, 2));

        // 2. Obtener Claves Foráneas (Relaciones)
        const fksQuery = `
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                TABLE_SCHEMA = 'SISA_EC' 
                AND REFERENCED_TABLE_NAME IS NOT NULL;
        `;
        
        const fks = await sequelize.query(fksQuery, { type: sequelize.QueryTypes.SELECT });
        
        console.log('\n=== RELACIONES (FOREIGN KEYS) DETECTADAS ===');
        const relations = fks.map(fk => ({
            from: `${fk.TABLE_NAME}.${fk.COLUMN_NAME}`,
            to: `${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`,
            constraint: fk.CONSTRAINT_NAME
        }));
        console.log(JSON.stringify(relations, null, 2));

        // 3. Verificaciones Específicas Solicitadas
        console.log('\n=== VERIFICACIÓN DE RELACIONES CRÍTICAS ===');
        
        const checkRelation = (fromTable, toTable) => {
            const rel = fks.find(fk => 
                fk.TABLE_NAME.toUpperCase() === fromTable.toUpperCase() && 
                fk.REFERENCED_TABLE_NAME.toUpperCase() === toTable.toUpperCase()
            );
            
            // También revisar al revés por si acaso
            const relReverse = fks.find(fk => 
                fk.TABLE_NAME.toUpperCase() === toTable.toUpperCase() && 
                fk.REFERENCED_TABLE_NAME.toUpperCase() === fromTable.toUpperCase()
            );

            if (rel) return `✅ ${fromTable} -> ${toTable} (FK: ${rel.COLUMN_NAME})`;
            if (relReverse) return `✅ ${toTable} -> ${fromTable} (FK: ${relReverse.COLUMN_NAME} [Inversa])`;
            return `❌ NO SE ENCONTRÓ RELACIÓN ENTRE ${fromTable} Y ${toTable}`;
        };

        // PACIENTES -> ADMISIONES (Probablemente ADMISIONES tiene FK a PACIENTES)
        console.log(checkRelation('ADMISIONES', 'PACIENTES'));

        // ADMISIONES -> FORM_008_EMERGENCIA (Probablemente FORM_008 tiene FK a ADMISIONES)
        console.log(checkRelation('FORM_008_EMERGENCIA', 'ADMISIONES'));
        // Verificar nombre alternativo
        console.log(checkRelation('ATENCION_EMERGENCIA', 'ADMISIONES'));

        // ADMISIONES -> DETALLE_DIAGNOSTICOS -> CAT_CIE10
        // Verificar ADMISIONES <-> DETALLE_DIAGNOSTICOS
        console.log(checkRelation('DETALLE_DIAGNOSTICOS', 'ADMISIONES'));
        // Verificar DETALLE_DIAGNOSTICOS <-> CAT_CIE10
        console.log(checkRelation('DETALLE_DIAGNOSTICOS', 'CAT_CIE10'));


        // 4. Verificación de Nombres (Consolidación)
        console.log('\n=== VERIFICACIÓN DE NOMBRES DE TABLAS ===');
        const checkTableExists = (name) => {
            const found = tableNames.find(t => t.toUpperCase() === name.toUpperCase());
            return found ? `✅ Tabla '${name}' EXISTE` : `❓ Tabla '${name}' NO ENCONTRADA`;
        };

        console.log(checkTableExists('MEDICAMENTOS'));
        console.log(checkTableExists('CAT_MEDICAMENTOS'));
        console.log(checkTableExists('ADMISIONES'));
        console.log(checkTableExists('PACIENTES'));
        console.log(checkTableExists('FORM_008_EMERGENCIA'));
        console.log(checkTableExists('ATENCION_EMERGENCIA')); // Posible nombre real de FORM_008

        // 5. Tablas Huérfanas (Heurística simple: no tiene FKs salientes ni entrantes)
        console.log('\n=== DETECCIÓN DE TABLAS AISLADAS (POSIBLES HUÉRFANAS) ===');
        const tablesWithFks = new Set([
            ...fks.map(fk => fk.TABLE_NAME),
            ...fks.map(fk => fk.REFERENCED_TABLE_NAME)
        ]);
        
        const isolatedTables = tableNames.filter(t => !tablesWithFks.has(t));
        console.log('Tablas sin relaciones explícitas (FKs) detectadas en la BD:');
        console.log(JSON.stringify(isolatedTables, null, 2));

    } catch (error) {
        console.error('❌ Error durante la auditoría:', error);
    } finally {
        await sequelize.close();
    }
}

audit();
