const LogCorreo = require('../models/LogCorreo');
const LogIntentoCedula = require('../models/LogIntentoCedula');
const Usuario = require('../models/usuario');
const transporter = require('../config/mailer');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
    try {
        const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [totalUsuarios, totalLogs] = await Promise.all([
            Usuario.count(),
            LogIntentoCedula.count({
                where: {
                    fecha: { [Op.gte]: hace24Horas },
                    exitoso: false
                }
            })
        ]);

        res.json({
            totalUsuarios,
            totalLogs
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de soporte:', error);
        res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
    }
};

exports.getHealthCheck = async (req, res) => {
    try {
        // 1. Check MariaDB (Tunnel/Local)
        let dbStatus = false;
        let dbError = null;
        try {
            await sequelize.authenticate();
            dbStatus = true;
        } catch (e) {
            console.error('Health Check - DB Error:', e.message);
            dbError = e.message;
        }

        // 2. Check Postfix (transporter) - Bypass si falla
        let postfixStatus = false;
        let postfixError = null;
        try {
            // timeout para no bloquear la respuesta si el socket está colgado
            const verifyPromise = transporter.verify();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout verificando servidor de correo')), 3000)
            );
            
            await Promise.race([verifyPromise, timeoutPromise]);
            postfixStatus = true;
        } catch (e) {
            console.error('Health Check - Postfix Error (Bypass):', e.message);
            postfixError = e.message;
        }

        // Siempre responder 200 aunque fallen los servicios, para evitar que el ErrorModal bloquee el dashboard
        res.json({
            database: dbStatus ? 'OK' : 'FAIL',
            database_error: dbError,
            postfix: postfixStatus ? 'OK' : 'FAIL',
            postfix_error: postfixError,
            timestamp: new Date(),
            status: (dbStatus && postfixStatus) ? 'HEALTHY' : 'DEGRADED'
        });
    } catch (error) {
        // Fallback extremo: reportar error pero no lanzar 500 si es posible
        console.error('Critical Error in Health Check:', error);
        res.json({
            status: 'CRITICAL',
            mensaje: 'Error interno en Health Check',
            error: error.message,
            timestamp: new Date()
        });
    }
};

exports.getLogsCorreos = async (req, res) => {
    try {
        const logs = await LogCorreo.findAll({
            order: [['fecha', 'DESC']],
            limit: 100
        });
        res.json(logs);
    } catch (error) {
        console.error('Error al obtener logs de correos:', error);
        res.status(500).json({ mensaje: 'Error al obtener logs de correos' });
    }
};

exports.getIntentosCedula = async (req, res) => {
    try {
        // Agrupar por cédula y contar intentos fallidos en las últimas 24 horas
        const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const intentos = await LogIntentoCedula.findAll({
            where: {
                fecha: { [Op.gte]: hace24Horas },
                exitoso: false
            },
            attributes: [
                'cedula',
                [LogIntentoCedula.sequelize.fn('COUNT', LogIntentoCedula.sequelize.col('id')), 'total_intentos'],
                [LogIntentoCedula.sequelize.fn('MAX', LogIntentoCedula.sequelize.col('fecha')), 'ultima_fecha']
            ],
            group: ['cedula'],
            order: [[LogIntentoCedula.sequelize.literal('total_intentos'), 'DESC']]
        });
        
        res.json(intentos);
    } catch (error) {
        console.error('Error al obtener intentos por cédula:', error);
        res.status(500).json({ mensaje: 'Error al obtener intentos por cédula' });
    }
};

exports.testCorreo = async (req, res) => {
    const { correo } = req.body;
    
    if (!correo) {
        return res.status(400).json({ mensaje: 'El correo de destino es requerido' });
    }

    try {
        await transporter.sendMail({
            from: `"Test Soporte SIGEMECH" <sistema@sigemech.local>`,
            to: correo,
            subject: 'Prueba de Servicio Postfix',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #2563eb; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Prueba de Conexión Postfix</h2>
                    <p>Este es un correo de prueba generado por el equipo de Soporte Técnico.</p>
                    <p>Fecha y Hora: <b>${new Date().toLocaleString()}</b></p>
                    <p>Si recibiste este correo, el servicio de correo interno está operativo.</p>
                </div>
            `
        });

        // Registrar el log del test
        await LogCorreo.create({
            correo_destino: correo,
            tipo: 'TEST',
            estado: 'ENVIADO'
        });

        res.json({ mensaje: 'Correo de prueba enviado correctamente' });
    } catch (error) {
        console.error('Error en test de correo:', error);
        
        // Registrar el fallo
        await LogCorreo.create({
            correo_destino: correo,
            tipo: 'TEST',
            estado: 'FALLIDO',
            error_mensaje: error.message
        });

        res.status(500).json({ mensaje: 'Error al enviar correo de prueba: ' + error.message });
    }
};
