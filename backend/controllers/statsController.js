const { AtencionEmergencia } = require('../models');
const sequelize = require('../config/database'); // Assumed path to sequelize instance
const { Op } = require('sequelize');

// Helper function to determine the date boundaries for "today" in UTC, for safer DB comparison
const getTodayBoundaries = () => {
    const now = new Date();
    // Set time to 00:00:00.000 in local time
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Set time to 00:00:00.000 of the next day
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    // Return ISO strings for safer SQL query replacement if needed, but raw Date objects often work with sequelize.query
    return { startOfDay, endOfDay };
};

const getKPIs = async (req, res) => {
    try {
        const { startOfDay, endOfDay } = getTodayBoundaries();
        const { id: usuarioId, rolId } = req.user;

        // Base where clause for production query
        const whereClauseProduccion = {
            createdAt: {
                [Op.gte]: startOfDay,
                [Op.lt]: endOfDay,
            },
        };

        // If the user is a Doctor (rolId = 1), filter by their user ID
        if (rolId === 1) {
            whereClauseProduccion.usuarioId = usuarioId;
        }
        // For Administrators (rolId = 5) or other roles, the query remains global (no extra user filter)

        const produccionMedica = await AtencionEmergencia.findAll({
            attributes: ['usuarioId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
            where: whereClauseProduccion,
            group: ['usuarioId'],
            raw: true,
        });

        // Consulta 2: Count de SignosVitales por prioridad_triage (hoy).
        // Using raw query to easily group by prioridad_triage across the date range.
        // Assumes table name is 'signos_vitales' and column names are 'prioridad_triage' and 'createdAt'.
        const query2 = `
            SELECT prioridad_triage, COUNT(*) as count
            FROM signos_vitales
            WHERE createdAt >= :startOfDay AND createdAt < :endOfDay
            GROUP BY prioridad_triage;
        `;
        const [distribucionTriage] = await sequelize.query(query2, {
            replacements: { startOfDay, endOfDay },
            type: sequelize.QueryTypes.SELECT
        });

        // Consulta 3: findAll de SignosVitales donde presion_sistolica > 140.
        // Using raw query as requested, assuming table name is 'signos_vitales'.
        const [alertas_hipertension] = await sequelize.query(
            `SELECT COUNT(*) as total FROM signos_vitales WHERE presion_sistolica > 140;`,
            { type: sequelize.QueryTypes.SELECT }
        );

        res.status(200).json({
            data: {
                produccionMedica,
                distribucionTriage,
                alertas_hipertension: alertas_hipertension.total
            }
        });

    } catch (error) {
        console.error("Error fetching KPIs:", error);
        // Send back a detailed error message, including error.name/message if available
        res.status(500).json({
            message: "Error al recuperar los KPIs solicitados.",
            error: error.message || String(error)
        });
    }
};

const getProduccionDiaria = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        let start, end;

        if (fechaInicio && fechaFin) {
            start = new Date(fechaInicio);
            end = new Date(fechaFin);
            end.setHours(23, 59, 59, 999);
        } else {
            const boundaries = getTodayBoundaries();
            start = boundaries.startOfDay;
            end = boundaries.endOfDay;
        }

        // 1. KPIs Generales (Estado actual)
        // Se asume que existe una tabla o lógica para determinar el estado actual.
        // Si usamos 'atenciones_emergencia', el estado podría ser inferido o existir una columna 'estado'.
        // Si no existe columna estado, simularemos conteo por ahora o usaremos lógica de negocio.
        // Revisando modelos, AtencionEmergencia es central.
        // Supongamos que queremos contar cuantos entraron en ese rango.
        
        const totalAtenciones = await AtencionEmergencia.count({
            where: {
                fecha_atencion: { // Usando fecha_atencion que es más preciso para la atención médica
                    [Op.gte]: start,
                    [Op.lte]: end
                }
            }
        });

        // 2. Flujo por Hora (Admissions per hour)
        const hourlyFlowQuery = `
            SELECT
                DATE_FORMAT(createdAt, '%H:00') as hora,
                COUNT(*) as cantidad
            FROM admisiones
            WHERE createdAt BETWEEN :start AND :end
            GROUP BY DATE_FORMAT(createdAt, '%H:00')
            ORDER BY hora ASC;
        `;

        const [hourlyFlow] = await sequelize.query(hourlyFlowQuery, {
            replacements: { start, end },
            type: sequelize.QueryTypes.SELECT
        });

        // 3. Producción por Usuario (Médico/Admins)
        // Se cuenta atenciones creadas/firmadas por usuario en ese rango
        const produccionUsuarioQuery = `
            SELECT
                u.nombre_completo as usuario,
                COUNT(ae.id) as total_atenciones
            FROM atenciones_emergencia ae
            JOIN usuarios u ON ae.usuarioId = u.id
            WHERE ae.fecha_atencion BETWEEN :start AND :end
            GROUP BY u.id, u.nombre_completo
            ORDER BY total_atenciones DESC;
        `;

         const [produccionPorUsuario] = await sequelize.query(produccionUsuarioQuery, {
            replacements: { start, end },
            type: sequelize.QueryTypes.SELECT
        });

        // 4. Indicadores de Estado (Simulado/Real dependiendo de estructura)
        // Si no hay tabla de histórico de estados, tomamos el estado actual de los pacientes admitidos hoy?
        // O buscamos en tabla 'admisiones' si tiene estado.
        // Asumamos que queremos saber cuántos están en 'Observación', 'Alta', etc.
        // Esto suele ser una foto del momento, no necesariamente un histórico por fechas,
        // pero si filtramos por fecha, serían "Pacientes ingresados en fecha X que terminaron en estado Y"
        // O "Estado actual de pacientes ingresados en fecha X".
        
        // Vamos a intentar contar por 'destino_alta' o similar si existe en AtencionEmergencia,
        // o si hay una tabla de 'admisiones' con estado.
        // Revisando modelos, no vi 'estado' explicito en AtencionEmergencia que no sea booleanos o strings.
        // Vamos a contar por 'destino' si existe, o placeholder.
        
        // Revisión rápida de estructura sugerida:
        // admisiones -> estado (Ingresado, Alta, etc)?
        
        res.json({
            rango: { start, end },
            kpis: {
                totalAtenciones
            },
            graficos: {
                flujoPorHora: hourlyFlow,
                produccionPorUsuario
            }
        });

    } catch (error) {
        console.error("Error en getProduccionDiaria:", error);
        res.status(500).json({ message: "Error al obtener estadísticas", error: error.message });
    }
};

module.exports = {
    getKPIs,
    getProduccionDiaria
};