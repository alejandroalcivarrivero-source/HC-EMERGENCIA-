const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Admision = require('../models/admisiones');
const CatTriaje = require('../models/cat_triaje');
const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnostico = require('../models/DetalleDiagnostico');
const CatCIE10 = require('../models/catCie10');

// 1. getTriajeStats
// Debe contar cuántos pacientes hay en cada nivel de triaje (Resucitación, Emergencia, Urgencia, etc.) en las últimas 24 horas usando la tabla ADMISIONES.
exports.getTriajeStats = async (req, res) => {
    try {
        const last24Hours = new Date(new Date() - 24 * 60 * 60 * 1000);

        // Usamos triajeDefinitivoId preferentemente, si no existe, podríamos considerar triajePreliminarId,
        // pero la estadística suele basarse en el definitivo.
        // Se asume que init-associations.js ha establecido la relación 'TriajeDefinitivo'
        
        const stats = await Admision.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('Admision.id')), 'count'],
                'triajeDefinitivoId'
            ],
            where: {
                fecha_hora_admision: {
                    [Op.gte]: last24Hours
                },
                triajeDefinitivoId: {
                    [Op.not]: null
                }
            },
            include: [{
                model: CatTriaje,
                as: 'TriajeDefinitivo',
                attributes: ['nombre', 'color']
            }],
            group: ['triajeDefinitivoId', 'TriajeDefinitivo.id', 'TriajeDefinitivo.nombre', 'TriajeDefinitivo.color']
        });

        const formattedStats = stats.map(stat => ({
            nivel: stat.TriajeDefinitivo ? stat.TriajeDefinitivo.nombre : 'Desconocido',
            color: stat.TriajeDefinitivo ? stat.TriajeDefinitivo.color : '#000000',
            cantidad: parseInt(stat.get('count'), 10)
        }));

        res.json(formattedStats);
    } catch (error) {
        console.error('Error en getTriajeStats:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas de triaje' });
    }
};

// 2. getWaitingTimes
// Calcula el promedio de tiempo transcurrido entre fecha_admision y el inicio de la atención médica.
exports.getWaitingTimes = async (req, res) => {
    try {
        // Cálculo: Promedio de (FechaHoraAtencion - FechaHoraAdmision)
        // ATENCION_EMERGENCIA tiene fechaAtencion (DATEONLY) y horaAtencion (STRING)
        // ADMISIONES tiene fecha_hora_admision (DATETIME)
        
        // Consideramos los últimos 30 días para que la estadística sea relevante y no cargue toda la historia
        const last30Days = new Date(new Date() - 30 * 24 * 60 * 60 * 1000);

        // Nota: Asegúrate de que tu motor de BD (MySQL/MariaDB) soporte TIMESTAMPDIFF y CONCAT correctamente.
        const query = `
            SELECT
                AVG(TIMESTAMPDIFF(MINUTE, A.fecha_hora_admision, CONCAT(AE.fechaAtencion, ' ', AE.horaAtencion))) as promedio_minutos
            FROM ADMISIONES A
            JOIN ATENCION_EMERGENCIA AE ON A.id = AE.admisionId
            WHERE A.fecha_hora_admision >= :startDate
            AND AE.fechaAtencion IS NOT NULL
            AND AE.horaAtencion IS NOT NULL
        `;

        const result = await sequelize.query(query, {
            replacements: { startDate: last30Days },
            type: sequelize.QueryTypes.SELECT
        });

        const promedioMinutos = result[0] ? result[0].promedio_minutos : 0;
        
        // Convertimos a horas y minutos para una visualización más amigable si fuera necesario,
        // pero devolvemos minutos como base numérica.
        
        res.json({
            promedioMinutos: parseFloat(promedioMinutos || 0).toFixed(2),
            descripcion: 'Tiempo promedio de espera (minutos)',
            periodo: 'Últimos 30 días'
        });

    } catch (error) {
        console.error('Error en getWaitingTimes:', error);
        res.status(500).json({ message: 'Error al calcular tiempos de espera' });
    }
};

// 3. getTopDiagnosticos
// Haz un conteo de los códigos CIE-10 más utilizados en la tabla ATENCION_EMERGENCIA haciendo un JOIN con CAT_CIE10 para traer las descripciones.
// Nota: Usamos DETALLE_DIAGNOSTICOS que es donde se guardan los códigos CIE10 asociados a la atención.
exports.getTopDiagnosticos = async (req, res) => {
    try {
        const topDiagnosticos = await DetalleDiagnostico.findAll({
            attributes: [
                'codigoCIE10',
                [Sequelize.fn('COUNT', Sequelize.col('DetalleDiagnostico.id')), 'count']
            ],
            include: [{
                model: CatCIE10,
                as: 'CIE10',
                attributes: ['descripcion']
            }],
            group: ['codigoCIE10', 'CIE10.id', 'CIE10.descripcion'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 10
        });

        const formattedTop = topDiagnosticos.map(item => ({
            codigo: item.codigoCIE10,
            descripcion: item.CIE10 ? item.CIE10.descripcion : 'Sin descripción',
            cantidad: parseInt(item.get('count'), 10)
        }));

        res.json(formattedTop);

    } catch (error) {
        console.error('Error en getTopDiagnosticos:', error);
        res.status(500).json({ message: 'Error al obtener top diagnósticos' });
    }
};
