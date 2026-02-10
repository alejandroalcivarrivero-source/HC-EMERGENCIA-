const Admision = require('../models/admisiones');
const Paciente = require('../models/pacientes');
const CatSexos = require('../models/cat_sexos');
const Usuario = require('../models/usuario');
const CatEstadoPaciente = require('../models/cat_estado_paciente');
const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const CatMotivoConsultaSintomas = require('../models/cat_motivo_consulta_sintomas');
const CatTriaje = require('../models/cat_triaje');
const { emitPacienteLlamado } = require('../socket/socketEvents'); // Importar función de eventos Socket.io

const getAdmisionById = async (req, res) => {
  try {
    const { id } = req.params;
    const admision = await Admision.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion', 'fecha_nacimiento'],
          include: [{ model: CatSexos, as: 'Sexo', attributes: ['nombre'], required: false }]
        },
        {
          model: CatTriaje,
          as: 'TriajePreliminar',
          attributes: ['nombre', 'color'],
          required: false
        },
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo', // Incluir el triaje definitivo
          attributes: ['nombre', 'color'],
          required: false
        },
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Motivo_Consulta_Sintoma', 'Categoria', 'Codigo_Triaje'],
          required: false
        },
        {
          model: CatEstadoPaciente,
          as: 'EstadoPaciente',
          attributes: ['nombre'],
          required: false
        }
      ]
    });

    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // Construir los nombres y apellidos completos y sexo si existen
    const pacienteData = admision.Paciente ? {
      ...admision.Paciente.toJSON(),
      nombres: `${admision.Paciente.primer_nombre || ''} ${admision.Paciente.segundo_nombre || ''}`.trim(),
      apellidos: `${admision.Paciente.primer_apellido || ''} ${admision.Paciente.segundo_apellido || ''}`.trim(),
      cedula: admision.Paciente.numero_identificacion,
      sexo: admision.Paciente.Sexo ? admision.Paciente.Sexo.nombre : null
    } : null;

    const estadoPacienteNombre = admision.EstadoPaciente ? admision.EstadoPaciente.nombre : null;
    const triajePreliminarNombre = admision.TriajePreliminar ? admision.TriajePreliminar.nombre : 'N/A';
    const triajeDefinitivoNombre = admision.TriajeDefinitivo ? admision.TriajeDefinitivo.nombre : 'N/A';
    const triajeDefinitivoColor = admision.TriajeDefinitivo ? admision.TriajeDefinitivo.color : null;

    res.status(200).json({
      ...admision.toJSON(),
      Paciente: pacienteData,
      estadoPaciente: estadoPacienteNombre,
      triaje: triajePreliminarNombre,
      triajeDefinitivo: triajeDefinitivoNombre, // Nombre del triaje definitivo (para compatibilidad)
      TriajeDefinitivo: admision.TriajeDefinitivo ? {
        nombre: admision.TriajeDefinitivo.nombre,
        color: admision.TriajeDefinitivo.color
      } : null // Objeto completo con nombre y color para usar en el frontend
    });

  } catch (error) {
    console.error('Error al obtener admisión por ID:', error);
    res.status(500).json({ message: 'Error al obtener admisión.', error: error.message });
  }
};

const createAdmision = async (req, res) => {
  try {
    const {
      fecha_hora_admision,
      forma_llegada_id,
      fuenteInformacionId,
      institucion_persona_entrega,
      telefono_entrega,
      pacienteId,
      motivo_consulta_sintoma_id // Añadir este campo
    } = req.body;
    const usuarioAdmisionId = req.userId; // Obtener el ID del usuario autenticado

    let triajePreliminarId = null;
    let prioridadEnfermeria = 0;
    let observacionEscalamientoAuto = null;
    
    if (motivo_consulta_sintoma_id) {
      const motivoConsulta = await CatMotivoConsultaSintomas.findOne({
        where: { Codigo: motivo_consulta_sintoma_id },
        attributes: ['Codigo', 'Motivo_Consulta_Sintoma', 'Categoria', 'Codigo_Triaje']
      });
      if (motivoConsulta && motivoConsulta.Codigo_Triaje) {
        triajePreliminarId = motivoConsulta.Codigo_Triaje;
        console.log(`[crearRegistroAdmision] Codigo_Triaje del motivo de consulta (${motivo_consulta_sintoma_id}): ${motivoConsulta.Codigo_Triaje}`);
        
        // ESCALAMIENTO AUTOMÁTICO: Si el motivo tiene Codigo_Triaje = 1 (ROJO - RESUCITACIÓN)
        if (motivoConsulta.Codigo_Triaje === 1) {
          prioridadEnfermeria = 1;
          observacionEscalamientoAuto = `⚠️ ESCALAMIENTO AUTOMÁTICO: Motivo de consulta crítico - "${motivoConsulta.Motivo_Consulta_Sintoma}" (Categoría: ${motivoConsulta.Categoria}). Requiere valoración médica inmediata.`;
          console.log(`[createAdmision] ⚠️ ESCALAMIENTO AUTOMÁTICO activado - Motivo: ${motivoConsulta.Motivo_Consulta_Sintoma}, Triaje ID: ${motivoConsulta.Codigo_Triaje}`);
        }
      } else {
        console.log(`[crearRegistroAdmision] No se encontró Codigo_Triaje para el motivo de consulta (${motivo_consulta_sintoma_id}) o es nulo.`);
      }
    } else {
      console.log(`[crearRegistroAdmision] motivo_consulta_sintoma_id no proporcionado.`);
    }

    const nuevaAdmision = await Admision.create({
      fecha_hora_admision,
      forma_llegada_id,
      usuarioAdmisionId,
      fuenteInformacionId,
      institucion_persona_entrega,
      telefono_entrega,
      pacienteId,
      motivo_consulta_sintoma_id, // Guardar el motivo de consulta
      triajePreliminarId, // Asignar el triaje preliminar
      alerta_triaje_activa: false, // Por defecto
      fecha_hora_ultima_alerta_triaje: null, // Por defecto
      prioridad_enfermeria: prioridadEnfermeria, // Escalamiento automático si triaje es ROJO
      observacion_escalamiento: observacionEscalamientoAuto, // Observación automática del escalamiento
      // fecha_creacion y fecha_actualizacion son manejados automaticamente por Sequelize si timestamps: true,
      // pero en el modelo timestamps: false, asi que los manejamos nosotros o dejamos que la BD use default values
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date()
    });

    // Crear el estado inicial en ATENCION_PACIENTE_ESTADO
    await AtencionPacienteEstado.create({
      admisionId: nuevaAdmision.id,
      estado: 'ADMITIDO' // Estado inicial
    });

    res.status(201).json(nuevaAdmision);
  } catch (error) {
    console.error('Error al crear admisión:', error);
    res.status(500).json({ message: 'Error al crear admisión.', error: error.message });
  }
};

const getHistorialAdmisionesByPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const historialAdmisiones = await Admision.findAll({
      where: { pacienteId },
      order: [['fecha_hora_admision', 'DESC']],
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['id', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'],
          required: true // Asegurar que solo se muestren admisiones con paciente asociado
        },
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Motivo_Consulta_Sintoma'],
          required: false
        },
        {
          model: CatTriaje,
          as: 'TriajePreliminar',
          attributes: ['nombre', 'color'],
          required: false
        },
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo',
          attributes: ['nombre', 'color'],
          required: false
        },
        {
          model: CatEstadoPaciente,
          as: 'EstadoPaciente',
          attributes: ['nombre'],
          required: false
        },
        {
          model: Usuario,
          as: 'UsuarioAdmision', // Usar el alias definido en init-associations.js
          attributes: ['nombres', 'apellidos'],
          required: false // LEFT JOIN para incluir admisiones con o sin usuario de admisión
        }
      ]
    });

    // Formatear la respuesta para incluir los datos del paciente y el usuario
    const historialFormateado = historialAdmisiones.map(admision => {
      const pacienteNombreCompleto = `${admision.Paciente.primer_nombre || ''} ${admision.Paciente.segundo_nombre || ''} ${admision.Paciente.primer_apellido || ''} ${admision.Paciente.segundo_apellido || ''}`.trim();
      const usuarioNombreCompleto = admision.UsuarioAdmision ? `${admision.UsuarioAdmision.nombres || ''} ${admision.UsuarioAdmision.apellidos || ''}`.trim() : 'N/A';

      return {
        admisionId: admision.id,
        pacienteId: admision.pacienteId,
        fechaHoraAdmision: admision.fecha_hora_admision,
        cedula: admision.Paciente.numero_identificacion,
        nombrePaciente: pacienteNombreCompleto,
        motivoConsulta: admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Motivo_Consulta_Sintoma : 'N/A',
        triajePreliminarNombre: admision.TriajePreliminar ? admision.TriajePreliminar.nombre : 'Sin Triaje',
        triajePreliminarColor: admision.TriajePreliminar ? admision.TriajePreliminar.color : 'gray', // Color por defecto
        triajeDefinitivoNombre: admision.TriajeDefinitivo ? admision.TriajeDefinitivo.nombre : 'Sin Triaje',
        triajeDefinitivoColor: admision.TriajeDefinitivo ? admision.TriajeDefinitivo.color : 'gray', // Color por defecto
        estadoPaciente: admision.EstadoPaciente ? admision.EstadoPaciente.nombre : 'N/A',
        usuarioRegistro: usuarioNombreCompleto
      };
    });

    res.status(200).json(historialFormateado);
  } catch (error) {
    console.error('Error al obtener el historial de admisiones por paciente:', error);
    res.status(500).json({ message: 'Error al obtener el historial de admisiones.', error: error.message });
  }
};

const updateTriajePreliminarAdmision = async (req, res) => {
  try {
    const { id } = req.params;
    const { triajePreliminarId } = req.body;

    const admision = await Admision.findByPk(id);

    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    admision.triajePreliminarId = triajePreliminarId;
    await admision.save();

    await admision.update({ fecha_ultima_actividad: new Date() });
    console.log(`Fecha de última actividad para admisión ${id} actualizada.`);

    res.status(200).json({ message: 'Triaje preliminar de admisión actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar el triaje preliminar de la admisión:', error);
    res.status(500).json({ message: 'Error al actualizar el triaje preliminar de la admisión.' });
  }
};

const updateTriajeDefinitivoAdmision = async (req, res) => {
  try {
    const { id } = req.params;
    const { triajeDefinitivoId } = req.body;

    const admision = await Admision.findByPk(id);

    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    admision.triajeDefinitivoId = triajeDefinitivoId;
    await admision.save();

    await admision.update({ fecha_ultima_actividad: new Date() });
    console.log(`Fecha de última actividad para admisión ${id} actualizada.`);

    res.status(200).json({ message: 'Triaje definitivo de admisión actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar el triaje definitivo de la admisión:', error);
    res.status(500).json({ message: 'Error al actualizar el triaje definitivo de la admisión.' });
  }
};

const sequelize = require('../config/database'); // Importar la instancia de sequelize

const reasignarPaciente = async (req, res) => {
  const { admisionId } = req.params;
  const { nuevoMedicoId, observacion } = req.body; // El ID del nuevo médico y la observación
  const usuarioReasignaId = req.userId; // El ID del usuario que realiza la reasignación (puede ser el mismo médico o un administrador)

  try {
    await sequelize.transaction(async (t) => {
      const admision = await Admision.findByPk(admisionId, { transaction: t });
      if (!admision) {
        return res.status(404).json({ message: 'Admisión no encontrada.' });
      }

      // Verificar que el nuevoMedicoId sea un usuario válido
      const nuevoMedico = await Usuario.findByPk(nuevoMedicoId, { transaction: t });
      if (!nuevoMedico) {
        return res.status(404).json({ message: 'El nuevo médico asignado no existe.' });
      }

      // Obtener el último estado de atención del paciente
      const ultimoEstadoAtencion = await AtencionPacienteEstado.findOne({
        where: { admisionId: admision.id },
        order: [['createdAt', 'DESC']],
        transaction: t
      });

      if (!ultimoEstadoAtencion) {
        return res.status(400).json({ message: 'No se encontró un estado de atención previo para esta admisión.' });
      }

      // Crear un nuevo registro en ATENCION_PACIENTE_ESTADO con el mismo estado actual
      // pero con el nuevo usuarioId (médico asignado)
      await AtencionPacienteEstado.create({
        admisionId: admision.id,
        estado_id: ultimoEstadoAtencion.estado_id, // Mantener el mismo estado (ej. 'ATENDIDO' o 'EN_ATENCION')
        usuarioId: nuevoMedicoId, // Asignar el nuevo médico
        observaciones: observacion || `Paciente reasignado de médico ${ultimoEstadoAtencion.usuarioId || 'N/A'} a ${nuevoMedicoId} por usuario ${usuarioReasignaId}.`, // Usar la observación proporcionada o un mensaje por defecto
      }, { transaction: t });

      res.status(200).json({ message: 'Paciente reasignado exitosamente.' });
    });
  } catch (error) {
    console.error('Error al reasignar paciente:', error.message);
    res.status(500).json({ message: 'Error interno del servidor al reasignar paciente.', error: error.message });
  }
};

const { Op } = require('sequelize'); // Importar Op para operadores de Sequelize
const moment = require('moment-timezone'); // Importar moment-timezone

const getAllAdmisiones = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, estadoPaciente, sortField, sortOrder, cedula } = req.query;
    let whereClause = {};
    let orderClause = [];

    // Mapeo de campos del frontend a campos del modelo de Sequelize
    const sortableFields = {
      fechaAdmision: 'fecha_hora_admision',
      estadoPaciente: 'estadoPaciente.nombre', // Para ordenar por el nombre del estado
      cedula: 'Paciente.numero_identificacion',
      nombre: 'Paciente.primer_nombre', // O se podría combinar primer_nombre y primer_apellido
      motivoConsulta: 'MotivoConsultaSintoma.Motivo_Consulta_Sintoma',
      triajeDefinitivoNombre: 'TriajeDefinitivo.nombre',
    };

    if (sortField && sortableFields[sortField]) {
      const field = sortableFields[sortField];
      const order = (sortOrder && sortOrder.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

      // Para campos relacionados, necesitamos especificar el modelo
      if (field.includes('.')) {
        const [modelAlias, fieldName] = field.split('.');
        if (modelAlias === 'estadoPaciente') {
          orderClause.push([{ model: CatEstadoPaciente, as: 'EstadoPaciente' }, fieldName, order]);
        } else if (modelAlias === 'Paciente') {
          orderClause.push([{ model: Paciente, as: 'Paciente' }, fieldName, order]);
        } else if (modelAlias === 'MotivoConsultaSintoma') {
          orderClause.push([{ model: CatMotivoConsultaSintomas, as: 'MotivoConsultaSintoma' }, fieldName, order]);
        } else if (modelAlias === 'TriajeDefinitivo') {
          orderClause.push([{ model: CatTriaje, as: 'TriajeDefinitivo' }, fieldName, order]);
        }
      } else {
        orderClause.push([field, order]);
      }
    } else {
      // Orden por defecto si no se especifica o el campo no es válido
      orderClause.push(['fecha_hora_admision', 'DESC']);
    }

    if (fechaInicio && fechaFin) {
      const startOfDay = moment.tz(fechaInicio, 'YYYY-MM-DD', 'America/Guayaquil').startOf('day').toDate();
      const endOfDay = moment.tz(fechaFin, 'YYYY-MM-DD', 'America/Guayaquil').endOf('day').toDate();

      whereClause.fecha_hora_admision = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }

    let includeEstadoPaciente = {
      model: CatEstadoPaciente,
      as: 'EstadoPaciente',
      attributes: ['nombre'],
      required: false,
    };

    if (estadoPaciente) {
      includeEstadoPaciente.where = {
        nombre: estadoPaciente,
      };
      includeEstadoPaciente.required = true; // Hacer que el join sea INNER JOIN si se filtra por estado
    }

    const includePaciente = {
      model: Paciente,
      as: 'Paciente',
      attributes: ['id', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido'],
      where: {},
      required: true
    };

    if (cedula) {
      includePaciente.where.numero_identificacion = { [Op.like]: `${cedula}%` };
    }


    const admisiones = await Admision.findAll({
      include: [
        includePaciente,
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Motivo_Consulta_Sintoma', 'Categoria', 'Codigo_Triaje'],
          required: false,
        },
        {
          model: CatTriaje,
          as: 'TriajePreliminar',
          attributes: ['nombre', 'color'],
          required: false,
        },
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo',
          attributes: ['nombre', 'color'],
          required: false,
        },
        includeEstadoPaciente, // Usar el objeto de inclusión modificado
        {
          model: Usuario,
          as: 'UsuarioAdmision',
          attributes: ['nombres', 'apellidos'],
          required: false,
        }
      ],
      where: whereClause,
      order: orderClause, // Usar la cláusula de ordenamiento construida
    });

    const admisionesFormateadas = admisiones.map(admision => {
      const pacienteNombreCompleto = `${admision.Paciente.primer_nombre || ''} ${admision.Paciente.segundo_nombre || ''} ${admision.Paciente.primer_apellido || ''} ${admision.Paciente.segundo_apellido || ''}`.trim();
      const usuarioNombreCompleto = admision.UsuarioAdmision ? `${admision.UsuarioAdmision.nombres || ''} ${admision.UsuarioAdmision.apellidos || ''}`.trim() : 'N/A';

      let triajeNombre = 'N/A';
      let triajeColor = 'gray';

      if (admision.TriajeDefinitivo) {
        triajeNombre = admision.TriajeDefinitivo.nombre;
        triajeColor = admision.TriajeDefinitivo.color;
      } else if (admision.TriajePreliminar) {
        triajeNombre = admision.TriajePreliminar.nombre;
        triajeColor = admision.TriajePreliminar.color;
      }

      return {
        id: admision.Paciente.id,
        admisionId: admision.id,
        cedula: admision.Paciente.numero_identificacion,
        nombre: pacienteNombreCompleto,
        fechaAdmision: admision.fecha_hora_admision ? moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('DD/MM/YYYY') : 'N/A',
        horaAdmision: admision.fecha_hora_admision ? moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil').format('HH:mm') : 'N/A',
        estadoPaciente: admision.EstadoPaciente ? admision.EstadoPaciente.nombre : 'N/A',
        triajeDefinitivoNombre: triajeNombre,
        triajeDefinitivoColor: triajeColor,
        motivoConsulta: admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Motivo_Consulta_Sintoma : 'N/A',
        usuarioRegistro: usuarioNombreCompleto,
        intentos_llamado: admision.intentos_llamado || 0,
        fecha_ultima_actividad: admision.fecha_ultima_actividad || admision.fecha_actualizacion || null,
      };
    });

    res.json(admisionesFormateadas);
  } catch (error) {
    console.error('Error al obtener todas las admisiones:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener todas las admisiones.', error: error.message });
  }
};

const getAllEstadosPaciente = async (req, res) => {
  try {
    const estados = await CatEstadoPaciente.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });
    res.json(estados);
  } catch (error) {
    console.error('Error al obtener todos los estados de paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener estados de paciente.', error: error.message });
  }
};

/**
 * Incrementar intentos de llamado para una admisión
 * Después de 3 intentos, el paciente se marca como "No responde" visualmente
 */
const incrementarIntentosLlamado = async (req, res) => {
  try {
    const { id } = req.params; // ID de la admisión
    
    const admision = await Admision.findByPk(id);
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }
    
    // Incrementar intentos_llamado
    const nuevosIntentos = (admision.intentos_llamado || 0) + 1;
    await admision.update({ 
      intentos_llamado: nuevosIntentos,
      fecha_ultima_actividad: new Date()
    });
    
    // Si alcanza 3 intentos, marcar visualmente (el frontend lo manejará)
    const requiereAtencion = nuevosIntentos >= 3;
    
    console.log(`[incrementarIntentosLlamado] Admisión ${id}: Intentos de llamado incrementados a ${nuevosIntentos}`);
    
    // Emitir evento Socket.io para el turnero digital
    try {
      const paciente = await Paciente.findByPk(admision.pacienteId);
      if (paciente) {
        const nombrePaciente = `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim();
        
        // Obtener área/consultorio (por defecto "Emergencia")
        let areaConsultorio = 'Emergencia';
        
        emitPacienteLlamado({
          admisionId: admision.id,
          pacienteId: admision.pacienteId,
          nombrePaciente: nombrePaciente,
          intentosLlamado: nuevosIntentos,
          areaConsultorio: areaConsultorio
        });
      }
    } catch (socketError) {
      console.error('[incrementarIntentosLlamado] Error al emitir evento Socket.io:', socketError);
      // No lanzar error, solo loguear para no interrumpir el flujo principal
    }
    
    res.status(200).json({
      message: `Intentos de llamado actualizados: ${nuevosIntentos}`,
      intentos_llamado: nuevosIntentos,
      requiereAtencion: requiereAtencion // Flag para el frontend
    });
  } catch (error) {
    console.error('Error al incrementar intentos de llamado:', error);
    res.status(500).json({ message: 'Error al incrementar intentos de llamado.', error: error.message });
  }
};

module.exports = {
  getAdmisionById,
  getHistorialAdmisionesByPaciente,
  updateTriajePreliminarAdmision,
  updateTriajeDefinitivoAdmision,
  createAdmision,
  reasignarPaciente,
  getAllAdmisiones,
  getAllEstadosPaciente, // Exportar la nueva función
  incrementarIntentosLlamado, // Nueva función para incrementar intentos de llamado
};