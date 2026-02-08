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

module.exports = {
    getKPIs,
};