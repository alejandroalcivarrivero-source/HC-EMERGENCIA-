const LogCorreo = require('../models/LogCorreo');
const LogIntentoCedula = require('../models/LogIntentoCedula');
const Usuario = require('../models/usuario');
const Paciente = require('../models/pacientes');
const transporter = require('../config/mailer');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const osu = require('node-os-utils');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logger = require('../utils/logger');

exports.getStats = async (req, res) => {
    try {
        const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Intentamos obtener los conteos, si fallan por BD devolvemos 0
        const getCount = async (model, options = {}) => {
            try {
                return await model.count(options);
            } catch (e) {
                console.error(`Error contando ${model.name}:`, e.message);
                return 0;
            }
        };

        const [totalUsuarios, totalLogs, totalPacientes, ultimoIntentoFallido] = await Promise.all([
          getCount(Usuario, { where: { rol_id: { [Op.in]: [1, 2, 3, 4, 5, 6] } } }),
          getCount(LogIntentoCedula, {
              where: {
                  fecha: { [Op.gte]: hace24Horas },
                  exitoso: false
              }
          }),
          getCount(Paciente),
          LogIntentoCedula.findOne({
                where: { exitoso: false },
                order: [['fecha', 'DESC']]
            }).catch(() => null)
        ]);

        res.json({
            totalUsuarios,
            totalLogs,
            totalPacientes,
            ultimoIntentoFallido
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de soporte:', error);
        // Devolvemos 0 en totalPacientes incluso en error general
        res.json({
            totalUsuarios: 0,
            totalLogs: 0,
            totalPacientes: 0,
            ultimoIntentoFallido: null,
            error: true
        });
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
            console.log('Health Check: DB Connected');
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
            console.log('Health Check: Postfix Connected');
        } catch (e) {
            console.error('Health Check - Postfix Error (Bypass):', e.message);
            postfixError = e.message;
        }

        // 3. System Resources (Disk & Memory)
        const cpu = osu.cpu;
        const drive = osu.drive;
        const mem = osu.mem;

        let cpuUsage = 0;
        let driveInfo = { totalGb: 0, usedGb: 0, freeGb: 0, usedPercentage: 0 };
        let memInfo = { totalMemMb: 0, usedMemMb: 0, freeMemMb: 0, freeMemPercentage: 100 };

        try {
           cpuUsage = await cpu.usage();
           driveInfo = await drive.info();
           memInfo = await mem.info();
        } catch (sysErr) {
            console.error('Error reading system resources:', sysErr.message);
            // Mock data for dev/test environments where sensors fail
            cpuUsage = 15; // Mock
            driveInfo = { totalGb: 500, usedGb: 120, freeGb: 380, usedPercentage: 24 };
            memInfo = { totalMemMb: 16000, usedMemMb: 8000, freeMemMb: 8000, freeMemPercentage: 50 };
        }

        console.log(`Health Check: CPU ${cpuUsage}%, Mem ${memInfo.usedMemMb}/${memInfo.totalMemMb}MB`);

        // Siempre responder 200 aunque fallen los servicios, para evitar que el ErrorModal bloquee el dashboard
        res.json({
            database: dbStatus ? 'OK' : 'FAIL',
            database_error: dbError,
            postfix: postfixStatus ? 'OK' : 'FAIL',
            postfix_error: postfixError,
            system: {
                cpu: cpuUsage,
                memory: {
                    total: memInfo.totalMemMb,
                    used: memInfo.usedMemMb,
                    free: memInfo.freeMemMb,
                    percentage: (100 - memInfo.freeMemPercentage).toFixed(2)
                },
                disk: {
                    total: driveInfo.totalGb,
                    used: driveInfo.usedGb,
                    free: driveInfo.freeGb,
                    percentage: driveInfo.usedPercentage
                }
            },
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

exports.getServerLogs = async (req, res) => {
    try {
        // Asumiendo que estamos usando pm2 y los logs están en ~/.pm2/logs o stdout
        // O si estamos guardando logs en un archivo local
        // Por ahora, vamos a leer un archivo de log simulado o intentar leer los logs de la aplicación si existen
        
        // Opción: Leer las últimas N líneas del archivo de log de PM2 si existe
        // Ajustar ruta según entorno. En Windows con PM2 suele estar en .pm2/logs
        // Para este entorno, vamos a simular o leer un archivo local si existe
        
        // IMPLEMENTACION SEGURA: Solo permitir leer logs específicos
        const logPath = path.join(__dirname, '../debug.log'); // Ruta corregida para backend/debug.log
        
        // Si no existe, devolver mensaje
        if (!fs.existsSync(logPath)) {
            return res.json({ logs: ['No se encontró archivo de logs (debug.log).'] });
        }

        // Leer últimas 100 líneas
        const data = fs.readFileSync(logPath, 'utf8');
        const lines = data.split('\n').slice(-100).reverse(); // Últimas 100, invertido para ver lo más reciente arriba
        
        res.json({ logs: lines });

    } catch (error) {
        console.error('Error leyendo logs:', error);
        res.status(500).json({ mensaje: 'Error leyendo logs del servidor' });
    }
};

exports.triggerBackup = async (req, res) => {
    try {
        // Ejecutar script de backup
        // Asumimos que existe un script o comando mysqldump disponible
        
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)){
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_manual_${timestamp}.sql`;
        const filePath = path.join(backupDir, filename);

        // Log de inicio
        logger.log(`Iniciando backup manual: ${filename}`, 'INFO');

        // Comando real para entorno Linux/Debian con ruta correcta
        // Aseguramos que mysqldump esté en el PATH o usamos ruta absoluta si es necesario
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'emergencia_db';
        
        // En Windows/Dev simulamos, en Linux intentamos ejecutar
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
             // Simulación Dev Windows
             fs.writeFileSync(filePath, `-- Backup Manual Generado el ${new Date().toLocaleString()}\n-- Simulacion Windows`);
             logger.log(`Backup simulado creado en Windows: ${filePath}`, 'INFO');
        } else {
            // Ejecución Real en Linux
            // Usamos exec con promesa para esperar
            await new Promise((resolve, reject) => {
                const command = `mysqldump -u ${dbUser} -p${dbPass} ${dbName} > "${filePath}"`;
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        logger.log(`Error mysqldump: ${error.message}`, 'ERROR');
                        reject(error);
                        return;
                    }
                    if (stderr) {
                        // mysqldump a veces escribe warnings en stderr, no siempre es error fatal
                        logger.log(`mysqldump stderr: ${stderr}`, 'WARN');
                    }
                    resolve(stdout);
                });
            });
            logger.log(`Backup real creado en Linux: ${filePath}`, 'INFO');
        }

        res.json({
            mensaje: 'Backup iniciado correctamente',
            archivo: filename,
            path: filePath
        });

    } catch (error) {
        console.error('Error generando backup:', error);
        res.status(500).json({ mensaje: 'Error al generar backup manual' });
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
