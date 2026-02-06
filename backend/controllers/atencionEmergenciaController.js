// backend/controllers/atencionEmergenciaController.js

// Paso 1: Importación correcta de modelos y utilidades
// La 'a' debe ser minúscula para coincidir con el nombre del archivo en el disco
const sequelize = require('../config/database');
const AtencionEmergencia = require('../models/atencionEmergencia');
const Form008Emergencia = require('../models/Form008Emergencia');
const TemporalGuardado = require('../models/temporal_guardado');
const Admision = require('../models/admisiones');
const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const CatEstadoPaciente = require('../models/cat_estado_paciente');
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
    const t = await sequelize.transaction();
    try {
        // Unificación de Naming y Prevención de notNull Violation
        const {
            pacienteId,
            admisionId,
            usuarioId,
            usuarioResponsableId,
            fechaAtencion,
            horaAtencion,
            condicionLlegada,
            fecha_fallecimiento,
            hora_fallecimiento,
            ...restOfBody
        } = req.body;

        // Validaciones mínimas requeridas por el modelo
        if (!pacienteId || !admisionId || !fechaAtencion || !horaAtencion || !condicionLlegada) {
            await t.rollback();
            return res.status(400).json({
                message: 'Faltan campos obligatorios: pacienteId, admisionId, fechaAtencion, horaAtencion y condicionLlegada.'
            });
        }

        const dataToSave = {
            ...restOfBody,
            pacienteId,
            admisionId,
            usuarioId: usuarioId || req.user?.id, // Fallback al usuario autenticado
            usuarioResponsableId: usuarioResponsableId || req.user?.id, // Si no se especifica, el creador es responsable
            fechaAtencion: handleFecha(fechaAtencion),
            horaAtencion: (horaAtencion || '').substring(0, 5),
            condicionLlegada: (condicionLlegada || '').toUpperCase(),
            fecha_fallecimiento: handleFecha(fecha_fallecimiento), // Sanitizar fecha fallecimiento
            hora_fallecimiento: hora_fallecimiento ? hora_fallecimiento.substring(0, 5) : null
        };

        if (!dataToSave.usuarioId) {
            await t.rollback();
            return res.status(400).json({ message: 'El ID de médico/usuario es obligatorio.' });
        }

        // 1. Create Attention Record (Header)
        const atencion = await AtencionEmergencia.create(dataToSave, { transaction: t });

        // 1.1. Create Clinical Data (Form 008)
        // Extract clinical fields from restOfBody (everything not in dataToSave explícitamente ya usado)
        // Since dataToSave has restOfBody spread, we can use restOfBody for Form008 + some overlap
        
        const form008Data = {
            atencionId: atencion.id,
            motivoAtencion: restOfBody.motivoAtencion,
            antecedentesPatologicos: stringifyData(restOfBody.antecedentesPatologicos),
            enfermedadProblemaActual: restOfBody.enfermedadProblemaActual,
            examenFisico: stringifyData(restOfBody.examenFisico),
            diagnosticosPresuntivos: stringifyData(restOfBody.diagnosticosPresuntivos),
            diagnosticosDefinitivos: stringifyData(restOfBody.diagnosticosDefinitivos),
            planTratamiento: stringifyData(restOfBody.planTratamiento),
            // Mapeo de campos adicionales
            examenesComplementarios: stringifyData(restOfBody.examenesComplementarios),
            firma_digital_hash: restOfBody.firma_digital_hash,
            estado_firma: restOfBody.estadoFirma || 'BORRADOR',
            usuario_responsable_id: dataToSave.usuarioResponsableId
        };

        // Remove undefined values
        Object.keys(form008Data).forEach(key => form008Data[key] === undefined && delete form008Data[key]);

        await Form008Emergencia.create(form008Data, { transaction: t });

        // 2. Update Admission State to EN_ATENCION (if not already further along)
        // Ensure atomic persistence preventing orphan records
        const admision = await Admision.findByPk(admisionId, { transaction: t });
        if (admision) {
            const enAtencionState = await CatEstadoPaciente.findOne({ where: { nombre: 'EN_ATENCION' }, transaction: t });
            if (enAtencionState && admision.estado_paciente_id !== enAtencionState.id) {
                // Check if we should update (don't regress if already discharged etc, though unlikely on create)
                // Assuming create happens at start of consultation.
                await admision.update({
                    estado_paciente_id: enAtencionState.id,
                    fecha_ultima_actividad: new Date()
                }, { transaction: t });

                // 3. Log Patient Status Change
                await AtencionPacienteEstado.create({
                    admisionId: admisionId,
                    estado_id: enAtencionState.id,
                    usuarioId: dataToSave.usuarioId,
                    rolId: req.user?.rol_id || 1, // Default to doctor if missing
                    observaciones: 'Inicio de atención médica (Creación de Formulario 008)'
                }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json(atencion);
    } catch (error) {
        await t.rollback();
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
        const atencion = await AtencionEmergencia.findOne({
            where: { admisionId },
            include: [{
                model: Form008Emergencia,
                as: 'formulario008',
                required: false // Left join para soportar migraciones parciales
            }]
        });
        
        if (!atencion) {
            // Se requiere devolver un objeto vacío con status 200 si no hay atención previa
            return res.status(200).json({});
        }

        // Aplanar respuesta para retrocompatibilidad
        const result = atencion.toJSON();
        if (result.formulario008) {
            // Priorizar datos de la nueva tabla
            Object.assign(result, result.formulario008);
            // Mantener IDs originales
            result.id = atencion.id;
            delete result.formulario008;
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function updateAtencionEmergencia(req, res) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            pacienteId,
            admisionId,
            usuarioId,
            usuarioResponsableId,
            fechaAtencion,
            horaAtencion,
            fecha_fallecimiento,
            hora_fallecimiento,
            ...restOfBody
        } = req.body;
        
        const dataToUpdate = {
            ...restOfBody,
            ...(pacienteId && { pacienteId }),
            ...(admisionId && { admisionId }),
            ...(usuarioId && { usuarioId }),
            ...(usuarioResponsableId && { usuarioResponsableId }),
            ...(fechaAtencion && { fechaAtencion: handleFecha(fechaAtencion) }),
            ...(horaAtencion && { horaAtencion: (horaAtencion || '').substring(0, 5) }),
            // Campos de fallecimiento (permitir null explícito para limpiar)
            fecha_fallecimiento: fecha_fallecimiento ? handleFecha(fecha_fallecimiento) : (fecha_fallecimiento === null ? null : undefined),
            hora_fallecimiento: hora_fallecimiento ? hora_fallecimiento.substring(0, 5) : (hora_fallecimiento === null ? null : undefined)
        };

        // Limpiar undefined
        Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

        const [updatedRows] = await AtencionEmergencia.update(
            dataToUpdate,
            { where: { id }, transaction: t }
        );

        if (updatedRows === 0) {
            await t.rollback();
            return res.status(404).json({ message: 'Atención no encontrada para actualizar.' });
        }

        // Actualizar o crear Form008Emergencia
        // Extraer datos clínicos del body original (restOfBody ya tiene lo que no es cabecera administrativa explícita)
        const form008Data = {
            motivoAtencion: restOfBody.motivoAtencion,
            antecedentesPatologicos: stringifyData(restOfBody.antecedentesPatologicos),
            enfermedadProblemaActual: restOfBody.enfermedadProblemaActual,
            examenFisico: stringifyData(restOfBody.examenFisico),
            diagnosticosPresuntivos: stringifyData(restOfBody.diagnosticosPresuntivos),
            diagnosticosDefinitivos: stringifyData(restOfBody.diagnosticosDefinitivos),
            planTratamiento: stringifyData(restOfBody.planTratamiento),
            firma_digital_hash: restOfBody.firma_digital_hash,
            estado_firma: restOfBody.estadoFirma,
            sello_digital: restOfBody.selloDigital
        };

        // Limpiar undefined
        Object.keys(form008Data).forEach(key => form008Data[key] === undefined && delete form008Data[key]);

        if (Object.keys(form008Data).length > 0) {
            const form008 = await Form008Emergencia.findOne({ where: { atencionId: id }, transaction: t });
            if (form008) {
                await form008.update(form008Data, { transaction: t });
            } else {
                await Form008Emergencia.create({ ...form008Data, atencionId: id }, { transaction: t });
            }
        }

        await t.commit();
        res.status(200).json({ message: 'Atención actualizada exitosamente.' });
    } catch (error) {
        await t.rollback();
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