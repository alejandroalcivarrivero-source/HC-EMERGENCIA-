// backend/controllers/atencionEmergenciaController.js

// Paso 1: Importación correcta de modelos y utilidades
// La 'a' debe ser minúscula para coincidir con el nombre del archivo en el disco
const AtencionEmergencia = require('../models/atencionEmergencia');
const TemporalGuardado = require('../models/temporal_guardado');
const { limpiarDatosAtencion } = require('../utils/utils');

/**
 * Valida y limpia fechas para evitar errores de "Invalid date" en MariaDB (Puerto 3308)
 */
function handleFecha(fecha) {
    const fechaLimpia = limpiarDatosAtencion(fecha);
    if (isNaN(new Date(fechaLimpia)) || !fechaLimpia) {
        return null;
    }
    return fechaLimpia;
}

/**
 * Serializa objetos para almacenamiento en columnas de texto (BI Ready)
 */
function stringifyData(data) {
    if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data);
    }
    return data;
}

// --- FUNCIONES DEL CONTROLADOR ---

/**
 * Guarda o actualiza un borrador de atención de emergencia.
 * Usa upsert para idempotencia.
 */
async function guardarBorrador(req, res) {
    try {
        // Obtenemos idAtencion y datos. Si datos no viene explícito, asumimos que el body contiene los datos (excepto idAtencion)
        let { idAtencion, datos } = req.body;

        // Si no se envía 'datos' explícitamente pero hay otros campos, intentamos empaquetarlos
        if (!datos && req.body) {
            const { idAtencion: id, ...rest } = req.body;
            if (Object.keys(rest).length > 0) {
                datos = rest;
            }
        }
        
        if (!idAtencion) {
            // Intento final de obtener idAtencion si vino en el body principal
            idAtencion = req.body.idAtencion;
        }

        if (!idAtencion) {
            return res.status(400).json({ message: 'idAtencion es requerido para el autosave.' });
        }
        
        // Aseguramos que datos sea un string JSON válido
        const datosString = typeof datos === 'string' ? datos : JSON.stringify(datos || {});

        // El modelo de TemporalGuardado usa TEXT('long') para los datos.
        const [borrador, created] = await TemporalGuardado.upsert({
            idAtencion: idAtencion,
            datos: datosString // Guardamos el JSON como string en la BD
        }, {
            where: { idAtencion },
            updateOnDuplicate: ['datos', 'updatedAt']
        });

        res.status(200).json({ message: 'Borrador guardado exitosamente.', created, idAtencion: borrador.idAtencion });
    } catch (error) {
        console.error('Error al guardar borrador:', error);
        res.status(500).json({ error: error.message, message: 'Fallo al guardar borrador' });
    }
}

/**
 * Carga el borrador más reciente para una atención de emergencia.
 */
async function cargarBorrador(req, res) {
    try {
        const { idAtencion } = req.params;

        const borrador = await TemporalGuardado.findOne({
            where: { idAtencion },
            order: [['createdAt', 'DESC']]
        });

        if (!borrador) {
            // No es un error, simplemente no hay borrador.
            return res.status(200).json({ message: 'No se encontró borrador.', datos: null });
        }
        
        // Devolvemos los datos parseados para que el frontend pueda cargarlos directamente
        let datosParsed;
        try {
            datosParsed = typeof borrador.datos === 'string' ? JSON.parse(borrador.datos) : borrador.datos;
        } catch (e) {
            console.warn('Error al parsear datos del borrador, devolviendo raw o vacío:', e);
            datosParsed = {};
        }

        res.status(200).json({ idAtencion: borrador.idAtencion, datos: datosParsed });
    } catch (error) {
        console.error('Error al cargar borrador:', error);
        res.status(500).json({ error: error.message, message: 'Fallo al cargar borrador' });
    }
}

async function createAtencionEmergencia(req, res) {
    try {
        // Unificación de Naming y Prevención de notNull Violation
        const {
            pacienteId,
            admisionId,
            usuarioId,
            fechaAtencion,
            horaAtencion,
            condicionLlegada,
            ...restOfBody
        } = req.body;

        // Validaciones mínimas requeridas por el modelo
        if (!pacienteId || !admisionId || !fechaAtencion || !horaAtencion || !condicionLlegada) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios: pacienteId, admisionId, fechaAtencion, horaAtencion y condicionLlegada.'
            });
        }

        const dataToSave = {
            ...restOfBody,
            pacienteId,
            admisionId,
            usuarioId: usuarioId || req.user?.id, // Fallback al usuario autenticado
            fechaAtencion: handleFecha(fechaAtencion),
            horaAtencion: (horaAtencion || '').substring(0, 5),
            condicionLlegada: (condicionLlegada || '').toUpperCase()
        };

        if (!dataToSave.usuarioId) {
            return res.status(400).json({ message: 'El ID de médico/usuario es obligatorio.' });
        }

        const atencion = await AtencionEmergencia.create(dataToSave);
        res.status(201).json(atencion);
    } catch (error) {
        console.error('Error al crear atención:', error);
        res.status(500).json({ error: error.message, message: 'Error interno al crear la atención.' });
    }
}

async function getAllAtencionesEmergencia(req, res) {
    try {
        const atenciones = await AtencionEmergencia.findAll();
        res.status(200).json(atenciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

function getAtencionEstados(req, res) {
    const estados = ['Pendiente', 'En Proceso', 'Finalizada'];
    res.status(200).json(estados);
}

async function getAtencionEmergenciaByAdmision(req, res) {
    try {
        const { admisionId } = req.params;
        // El uso de await aquí es clave para manejar la latencia del túnel SSH
        const atencion = await AtencionEmergencia.findOne({ where: { admisionId } });
        
        if (!atencion) {
            // Se requiere devolver un objeto vacío con status 200 si no hay atención previa
            return res.status(200).json({});
        }
        res.status(200).json(atencion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function updateAtencionEmergencia(req, res) {
    try {
        const { id } = req.params;
        const {
            pacienteId,
            admisionId,
            usuarioId,
            fechaAtencion,
            horaAtencion,
            ...restOfBody
        } = req.body;
        
        const dataToUpdate = {
            ...restOfBody,
            ...(pacienteId && { pacienteId }),
            ...(admisionId && { admisionId }),
            ...(usuarioId && { usuarioId }),
            ...(fechaAtencion && { fechaAtencion: handleFecha(fechaAtencion) }),
            ...(horaAtencion && { horaAtencion: (horaAtencion || '').substring(0, 5) })
        };

        const [updatedRows] = await AtencionEmergencia.update(
            dataToUpdate,
            { where: { id } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Atención no encontrada para actualizar.' });
        }

        res.status(200).json({ message: 'Atención actualizada exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar atención:', error);
        res.status(500).json({ error: error.message, message: 'Error interno al actualizar la atención.' });
    }
}

async function getHistorialAtencionesByPaciente(req, res) {
    try {
        const { pacienteId } = req.params;
        const atenciones = await AtencionEmergencia.findAll({ where: { pacienteId } });
        res.status(200).json(atenciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function deleteAtencionEmergencia(req, res) {
    try {
        const { id } = req.params;
        await AtencionEmergencia.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createAtencionEmergencia,
    getAllAtencionesEmergencia,
    getAtencionEstados,
    getAtencionEmergenciaByAdmision,
    updateAtencionEmergencia,
    getHistorialAtencionesByPaciente,
    deleteAtencionEmergencia,
    // Nuevas funciones de Autosave
    guardarBorrador,
    cargarBorrador
};