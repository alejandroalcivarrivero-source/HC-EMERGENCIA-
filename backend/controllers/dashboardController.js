const { Op, fn, col, literal, Sequelize } = require('sequelize');
const { AtencionEmergencia, SignosVitales, Usuario, CatTriaje, Admision } = require('../models');

// Función para obtener la fecha de hoy en formato YYYY-MM-DD (UTC para consistencia)
const getTodayDate = () => {
    const now = new Date();
    // Calculando la fecha de hoy en la zona horaria UTC
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Función auxiliar para calcular la diferencia de tiempo en minutos (asumiendo MySQL/MariaDB syntax for simplicity)
// Nota: Si la BD es otra (e.g., Postgres), esta función debe ajustarse (ej: EXTRACT(EPOCH FROM (SV.createdAt - AE.createdAt))/60)
const calculateWaitTimeInMinutes = (svAlias, aeAlias) => {
    // Usamos TIMESTAMPDIFF(MINUTE, start_time, end_time)
    return literal("TIMESTAMPDIFF(MINUTE, " + aeAlias + ".createdAt, " + svAlias + ".createdAt)");
};


// --- Controller ---

exports.getResumenDiario = async (req, res) => {
    try {
        const today = getTodayDate();

        // 1. Conteo de atenciones por médico (agrupado por usuarioId)
        // Necesitamos asociar AtencionEmergencia (AE) con Usuario (U)
        const atencionesPorMedico = await AtencionEmergencia.findAll({
            attributes: [
                [col('Usuario.nombre_completo'), 'nombreMedico'],
                [fn('COUNT', col('AtencionEmergencia.id')), 'conteoAtenciones']
            ],
            include: [{
                model: Usuario,
                attributes: [],
                as: 'Usuario',
                where: { activo: true }
            }],
            where: {
                fechaAtencion: today // Filtra AE por la fecha de inicio de atención del día
            },
            group: ['Usuario.nombre_completo', 'Usuario.id'],
            raw: true,
        });

        // 2. Conteo de triajes por color de prioridad_triage
        // Necesitamos SignosVitales (SV) que tengan 'prioridad_triage' y que correspondan al día de la atención.
        // Asumiremos que el día de la toma de SV coincide con la fecha de atención AE.fechaAtencion para simplificar.
        const triajesPorColor = await SignosVitales.findAll({
            attributes: [
                'prioridad_triage',
                [fn('COUNT', col('SignosVitales.id')), 'conteoTriajes']
            ],
            include: [{
                model: Admision,
                attributes: [],
                required: true,
                include: [{
                    model: AtencionEmergencia,
                    attributes: [],
                    required: true,
                    where: { fechaAtencion: today } // Filtra por la atención registrada hoy
                }]
            }],
            where: {
                prioridad_triage: { [Op.ne]: null } // Solo contar si tiene un color asignado
            },
            group: ['prioridad_triage'],
            raw: true,
        });
        
        // 3. Tiempo promedio de espera: (SV.createdAt - AE.createdAt)
        // Unimos AE, Admision (como puente) y SV.
        const tiempoEsperaData = await AtencionEmergencia.findAll({
            attributes: [
                [calculateWaitTimeInMinutes('SignosVitales', 'AtencionEmergencia'), 'diferenciaEnMinutos']
            ],
            include: [{
                model: SignosVitales,
                attributes: [],
                required: true, // INNER JOIN
                on: {
                    'admisionId': col('SignosVitales.admisionId') // Usando admisionId como puente entre AE y SV, asumiendo que SV.admisionId apunta a Admision.id y AE.admisionId apunta a Admision.id
                }
            }],
            where: {
                fechaAtencion: today, // AE registrada hoy
            },
            raw: true,
        });

        let tiempoPromedioMinutos = 0;
        if (tiempoEsperaData.length > 0 && tiempoEsperaData[0].diferenciaEnMinutos !== null) {
            const totalMinutos = tiempoEsperaData.reduce((sum, item) => sum + (item.diferenciaEnMinutos || 0), 0);
            tiempoPromedioMinutos = (totalMinutos / tiempoEsperaData.length).toFixed(2);
        }

        // 4. Conteo total de atenciones (para tarjeta principal)
        const atencionesTotalesHoy = await AtencionEmergencia.count({
            where: {
                fechaAtencion: today
            }
        });

        // Consolidar resultados
        const resumenDiario = {
            fecha: today,
            conteoTotalAtenciones: atencionesTotalesHoy,
            atencionesPorMedico: atencionesPorMedico.map(item => ({
                nombreMedico: item.nombreMedico,
                conteo: item.conteoAtenciones
            })),
            triajesPorColor: triajesPorColor.map(item => ({
                color: item.prioridad_triage || 'SIN_TRIAGE',
                conteo: item.conteoTriajes
            })),
            tiempoPromedioEsperaMinutos: parseFloat(tiempoPromedioMinutos)
        };
        
        res.status(200).json(resumenDiario);

    } catch (error) {
        console.error('Error al generar resumen estadístico en dashboardController:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al calcular estadísticas.', error: error.message });
    }
};

module.exports = {
    getResumenDiario
};