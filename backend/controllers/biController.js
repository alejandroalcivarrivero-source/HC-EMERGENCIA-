const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const Admision = require('../models/admisiones');
const CatTriaje = require('../models/cat_triaje');
const AtencionEmergencia = require('../models/atencionEmergencia');
const DetalleDiagnostico = require('../models/DetalleDiagnostico');
const CatCIE10 = require('../models/catCie10');
const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const CatEstadoPaciente = require('../models/cat_estado_paciente');
const Usuario = require('../models/usuario');
const ExcelJS = require('exceljs');

// 1. getTriajeStats
// Debe contar cuántos pacientes hay en cada nivel de triaje (Resucitación, Emergencia, Urgencia, etc.) en las últimas 24 horas usando la tabla ADMISIONES.
exports.getTriajeStats = async (req, res) => {
    try {
        const last24Hours = new Date(new Date() - 24 * 60 * 60 * 1000);

        // Usamos triajeDefinitivoId preferentemente, si no existe, podríamos considerar triajePreliminarId,
        // pero la estadística suele basarse en el definitivo.
        
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

// 4. getGlobalReportData
// Obtiene datos completos para el reporte de gestión global, incluyendo tiempos, estados y usuarios.
exports.getGlobalReportData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const whereClause = {};
        if (startDate) {
            whereClause.fecha_hora_admision = { [Op.gte]: new Date(startDate) };
        }
        if (endDate) {
            whereClause.fecha_hora_admision = { ...whereClause.fecha_hora_admision, [Op.lte]: new Date(endDate) };
        }

        const admissions = await Admision.findAll({
            where: whereClause,
            include: [
                { model: AtencionEmergencia, as: 'AtencionEmergencia' },
                { model: AtencionPacienteEstado, as: 'EstadosPaciente', include: [{ model: CatEstadoPaciente, as: 'Estado' }] },
                { model: Usuario, as: 'UsuarioAdmision', attributes: ['nombres', 'apellidos'] }
            ],
            order: [['fecha_hora_admision', 'ASC']]
        });

        const formattedReportData = admissions.map(admision => {
            // Módulo de Tiempos: Tiempo entre admisión y primera atención
            let tiempoPrimeraAtencionMinutos = null;
            if (admision.AtencionEmergencia && admision.AtencionEmergencia.fechaAtencion && admision.AtencionEmergencia.horaAtencion) {
                const fechaAdmision = new Date(admision.fecha_hora_admision);
                const fechaPrimeraAtencion = new Date(`${admision.AtencionEmergencia.fechaAtencion} ${admision.AtencionEmergencia.horaAtencion}`);
                tiempoPrimeraAtencionMinutos = Math.abs(fechaPrimeraAtencion.getTime() - fechaAdmision.getTime()) / (1000 * 60);
            }

            // Módulo de Estados: Todos los estados de esta admisión
            const estados = admision.EstadosPaciente.map(estado => ({
                nombre: estado.Estado ? estado.Estado.nombre : 'Desconocido',
                fechaAsignacion: estado.fechaAsignacion,
                usuarioResponsable: estado.UsuarioResponsableEstado ? `${estado.UsuarioResponsableEstado.nombres} ${estado.UsuarioResponsableEstado.apellidos}` : 'N/A'
            }));

            // Módulo de Usuarios: Usuario que realizó la admisión
            const usuarioAdmision = admision.UsuarioAdmision ? `${admision.UsuarioAdmision.nombres} ${admision.UsuarioAdmision.apellidos}` : 'Desconocido';

            return {
                admisionId: admision.id,
                fechaHoraAdmision: admision.fecha_hora_admision,
                pacienteId: admision.pacienteId,
                usuarioAdmision: usuarioAdmision,
                tiempoPrimeraAtencionMinutos: tiempoPrimeraAtencionMinutos ? parseFloat(tiempoPrimeraAtencionMinutos).toFixed(2) : null,
                estadosPaciente: estados,
                // Otros datos relevantes de la admisión si se necesitan en el detalle
            };
        });

        res.json(formattedReportData);

    } catch (error) {
        console.error('Error en getGlobalReportData:', error);
        res.status(500).json({ message: 'Error al obtener datos del reporte global' });
    }
};

// 5. generateGlobalReportExcel
// Genera un reporte Excel con los datos del reporte global.
exports.generateGlobalReportExcel = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const { startDate, endDate } = req.query;

        // Reutilizamos la lógica de getGlobalReportData para obtener los datos
        const admissions = await Admision.findAll({
            where: {
                fecha_hora_admision: {
                    ...(startDate && { [Op.gte]: new Date(startDate) }),
                    ...(endDate && { [Op.lte]: new Date(endDate) })
                }
            },
            include: [
                { model: AtencionEmergencia, as: 'AtencionEmergencia' },
                { model: AtencionPacienteEstado, as: 'EstadosPaciente', include: [{ model: CatEstadoPaciente, as: 'Estado' }] },
                { model: Usuario, as: 'UsuarioAdmision', attributes: ['nombres', 'apellidos'] }
            ],
            order: [['fecha_hora_admision', 'ASC']]
        });

        const formattedReportData = admissions.map(admision => {
            let tiempoPrimeraAtencionMinutos = null;
            if (admision.AtencionEmergencia && admision.AtencionEmergencia.fechaAtencion && admision.AtencionEmergencia.horaAtencion) {
                const fechaAdmision = new Date(admision.fecha_hora_admision);
                const fechaPrimeraAtencion = new Date(`${admision.AtencionEmergencia.fechaAtencion} ${admision.AtencionEmergencia.horaAtencion}`);
                tiempoPrimeraAtencionMinutos = Math.abs(fechaPrimeraAtencion.getTime() - fechaAdmision.getTime()) / (1000 * 60);
            }

            const estados = admision.EstadosPaciente.map(estado => ({
                nombre: estado.Estado ? estado.Estado.nombre : 'Desconocido',
                fechaAsignacion: estado.fechaAsignacion,
                usuarioResponsable: estado.UsuarioResponsableEstado ? `${estado.UsuarioResponsableEstado.nombres} ${estado.UsuarioResponsableEstado.apellidos}` : 'N/A'
            }));

            const usuarioAdmision = admision.UsuarioAdmision ? `${admision.UsuarioAdmision.nombres} ${admision.UsuarioAdmision.apellidos}` : 'Desconocido';

            return {
                admisionId: admision.id,
                fechaHoraAdmision: admision.fecha_hora_admision,
                pacienteId: admision.pacienteId,
                usuarioAdmision: usuarioAdmision,
                tiempoPrimeraAtencionMinutos: tiempoPrimeraAtencionMinutos ? parseFloat(tiempoPrimeraAtencionMinutos).toFixed(2) : null,
                estadosPaciente: estados.map(e => `${e.nombre} (${new Date(e.fechaAsignacion).toLocaleString()})`).join('; '),
            };
        });

        const workbook = new ExcelJS.Workbook();

        // Pestaña 1: Detalle de Atenciones
        const detailSheet = workbook.addWorksheet('Detalle de Atenciones');
        detailSheet.columns = [
            { header: 'ID Admisión', key: 'admisionId', width: 15 },
            { header: 'Fecha/Hora Admisión', key: 'fechaHoraAdmision', width: 25 },
            { header: 'ID Paciente', key: 'pacienteId', width: 15 },
            { header: 'Usuario Admisión', key: 'usuarioAdmision', width: 30 },
            { header: 'Tiempo Primera Atención (min)', key: 'tiempoPrimeraAtencionMinutos', width: 30 },
            { header: 'Estados del Paciente', key: 'estadosPaciente', width: 50 },
        ];
        detailSheet.addRows(formattedReportData);

        // Estilos para el encabezado de la pestaña de detalle
        detailSheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } }; // Azul oscuro
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Pestaña 2: Resumen Ejecutivo (Ejemplo simple)
        const summarySheet = workbook.addWorksheet('Resumen Ejecutivo');
        summarySheet.mergeCells('A1:B1');
        summarySheet.getCell('A1').value = 'Reporte de Gestión Global';
        summarySheet.getCell('A1').font = { bold: true, size: 16 };
        summarySheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

        summarySheet.addRow([]); // Espacio
        summarySheet.addRow(['Periodo del Reporte:', startDate && endDate ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` : 'Todo el historial']);
        summarySheet.addRow(['Total de Admisiones:', formattedReportData.length]);

        // Calculando el tiempo promedio de primera atención para el resumen
        const totalTiempoAtencion = formattedReportData.reduce((sum, item) => sum + (parseFloat(item.tiempoPrimeraAtencionMinutos) || 0), 0);
        const promedioGeneralMinutos = formattedReportData.length > 0 ? (totalTiempoAtencion / formattedReportData.length) : 0;
        summarySheet.addRow(['Tiempo Promedio Primera Atención (min):', promedioGeneralMinutos.toFixed(2)]);

        // Contar admisiones por estado
        const estadosCount = formattedReportData.flatMap(d => d.estadosPaciente.split('; ').map(s => s.split(' (')[0]))
            .reduce((acc, estado) => {
                acc[estado] = (acc[estado] || 0) + 1;
                return acc;
            }, {});
        summarySheet.addRow([]);
        summarySheet.addRow(['Conteo de Admisiones por Estado:']);
        Object.keys(estadosCount).forEach(estado => {
            summarySheet.addRow([estado, estadosCount[estado]]);
        });

        // Ranking de usuarios por admisiones
        const usuarioAdmisionCount = formattedReportData.reduce((acc, item) => {
            acc[item.usuarioAdmision] = (acc[item.usuarioAdmision] || 0) + 1;
            return acc;
        }, {});
        const sortedUsers = Object.entries(usuarioAdmisionCount).sort(([, countA], [, countB]) => countB - countA);
        summarySheet.addRow([]);
        summarySheet.addRow(['Ranking de Usuarios por Admisiones:']);
        sortedUsers.forEach(([usuario, count]) => {
            summarySheet.addRow([usuario, count]);
        });
        
        // Preparar el archivo para descarga
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + `Reporte_Gestion_Global_${new Date().toISOString().slice(0, 10)}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar reporte Excel:', error);
        res.status(500).json({ message: 'Error al generar reporte Excel' });
    }
};
