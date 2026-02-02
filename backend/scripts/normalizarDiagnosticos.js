const path = require('path');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('EMERGENCIA', 'TICS', 'TICS20141', {
    host: '127.0.0.1',
    port: 3308,
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
        connectTimeout: 60000,
        // Forzamos al driver a no cerrar el socket prematuramente
        socketTimeout: 60000 
    }
});

const Atencion = require(path.join(__dirname, '../models/atencionEmergencia'));
const Detalle = require(path.join(__dirname, '../models/detalleDiagnosticos'));

async function normalizar() {
    try {
        console.log("⏳ Iniciando normalización por lotes para evitar timeout...");
        await sequelize.authenticate();
        
        // 1. Solo traemos los IDs primero para no saturar el túnel
        const ids = await Atencion.findAll({ attributes: ['id'], raw: true });
        console.log(`🚀 Se detectaron ${ids.length} registros. Procesando uno por uno...`);

        let total = 0;
        for (const item of ids) {
            // 2. Traemos el registro completo de forma individual
            const atencion = await Atencion.findByPk(item.id, { raw: true });
            
            const presuntivos = JSON.parse(atencion.diagnosticosPresuntivos || '[]');
            const definitivos = JSON.parse(atencion.diagnosticosDefinitivos || '[]');

            const guardar = async (lista, tipo) => {
                for (const d of lista) {
                    const cod = (d.codigo || '').replace(/\./g, '').trim().toUpperCase();
                    if (!cod) continue;
                    const esExterna = /^[VWXY]/.test(cod) ? 1 : 0;

                    await Detalle.create({
                        atencion_emergencia_id: atencion.id,
                        codigo_cie10: cod,
                        tipo_diagnostico: tipo,
                        descripcion: d.descripcion || d.nombre || 'Sin descripción',
                        es_causa_externa: esExterna,
                        usuario_id: 1 
                    });
                    total++;
                }
            };

            await guardar(presuntivos, 'PRESUNTIVO');
            await guardar(definitivos, 'DEFINITIVO');
            process.stdout.write(`.`); // Progreso visual
        }

        console.log(`\n✅ ÉXITO: ${total} diagnósticos normalizados para el BI.`);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

normalizar();