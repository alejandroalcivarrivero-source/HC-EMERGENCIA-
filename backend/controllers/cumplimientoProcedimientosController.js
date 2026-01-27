const { Op } = require('sequelize');
const sequelize = require('../config/database');
const CumplimientoProcedimientos = require('../models/cumplimientoProcedimientos');
const Admision = require('../models/admisiones');
const CatProcedimientosEmergencia = require('../models/cat_procedimientos_emergencia');
const Usuario = require('../models/usuario');
const Paciente = require('../models/pacientes');
const SignosVitales = require('../models/signos_vitales');
const CatTriaje = require('../models/cat_triaje');
const CatEstadoPaciente = require('../models/cat_estado_paciente');
const moment = require('moment-timezone'); // Importar moment-timezone para manejo correcto de zona horaria
const { createOrUpdateAtencionPacienteEstado } = require('./atencionPacienteEstadoController'); // Importar función para gestionar estados

/**
 * Crear un nuevo registro de cumplimiento de procedimiento
 * Si requiere valoración médica, actualiza prioridad_enfermeria en ADMISIONES
 */
exports.createCumplimientoProcedimiento = async (req, res) => {
  const { 
    admisionId, 
    procedimientoCatId, 
    fechaHora, // Nueva: fecha/hora del procedimiento desde el frontend
    observacionHallazgo, 
    alertaMedica, 
    observacionEscalamiento,
    justificacionRegistroTardio, // Nueva: justificación si el registro es tardío (>6 horas)
    confirmarGuardarSinSignosVitales // Nueva: flag para indicar que el usuario confirma guardar sin signos vitales
  } = req.body;
  const usuarioEnfermeriaId = req.userId;

  console.log('[createCumplimientoProcedimiento] Datos recibidos:', {
    admisionId, procedimientoCatId, fechaHora, observacionHallazgo, alertaMedica, observacionEscalamiento, justificacionRegistroTardio, confirmarGuardarSinSignosVitales, usuarioEnfermeriaId
  });

  // Validación: Si tiene alerta médica, la observación es obligatoria
  if (alertaMedica && (!observacionEscalamiento || observacionEscalamiento.trim() === '')) {
    return res.status(400).json({ 
      message: 'La observación del escalamiento es obligatoria cuando se requiere valoración médica.' 
    });
  }

  const t = await sequelize.transaction();

  try {
    // Verificar que la admisión existe y obtener su triaje y fecha de admisión
    const admision = await Admision.findByPk(admisionId, { 
      include: [
        { model: CatTriaje, as: 'TriajeDefinitivo', attributes: ['id', 'nombre', 'color'] },
        { model: CatEstadoPaciente, as: 'EstadoPaciente', attributes: ['id', 'nombre'] }
      ],
      attributes: ['id', 'fecha_hora_admision', 'estado_paciente_id', 'triajeDefinitivoId', 'pacienteId'],
      transaction: t 
    });
    
    if (!admision) {
      await t.rollback();
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // ============================================
    // VALIDACIONES DE SEGURIDAD CLÍNICA DE TIEMPO
    // ============================================
    if (fechaHora) {
      // Validar que la fecha de admisión existe
      if (!admision.fecha_hora_admision) {
        await t.rollback();
        return res.status(400).json({
          code: 'SIN_FECHA_ADMISION',
          message: '⚠️ No se puede validar el tiempo del procedimiento porque la admisión no tiene fecha/hora de admisión registrada. Por favor, contacte al administrador del sistema.'
        });
      }
      
      const fechaHoraProcedimientoMoment = moment.tz(fechaHora, 'YYYY-MM-DDTHH:mm', 'America/Guayaquil');
      const fechaHoraActualMoment = moment.tz('America/Guayaquil');
      const fechaHoraAdmisionMoment = moment.utc(admision.fecha_hora_admision).tz('America/Guayaquil');
      
      // LÍMITE SUPERIOR: La hora no puede ser mayor a la Hora Actual
      if (fechaHoraProcedimientoMoment.isAfter(fechaHoraActualMoment)) {
        await t.rollback();
        return res.status(400).json({
          code: 'HORA_FUTURA',
          message: '⚠️ No se puede registrar un procedimiento con hora futura. La hora del procedimiento debe ser igual o anterior a la hora actual.',
          horaActual: fechaHoraActualMoment.format('DD/MM/YYYY HH:mm'),
          horaSeleccionada: fechaHoraProcedimientoMoment.format('DD/MM/YYYY HH:mm')
        });
      }
      
      // LÍMITE INFERIOR: La hora del procedimiento no puede ser anterior a la Hora de Admisión
      if (fechaHoraProcedimientoMoment.isBefore(fechaHoraAdmisionMoment)) {
        await t.rollback();
        return res.status(400).json({
          code: 'HORA_ANTERIOR_ADMISION',
          message: `⚠️ No se puede registrar un procedimiento con hora anterior a la hora de admisión del paciente (${fechaHoraAdmisionMoment.format('DD/MM/YYYY HH:mm')}). Nada puede ocurrir antes de que el paciente entre al sistema.`,
          horaAdmision: fechaHoraAdmisionMoment.format('DD/MM/YYYY HH:mm'),
          horaSeleccionada: fechaHoraProcedimientoMoment.format('DD/MM/YYYY HH:mm')
        });
      }
      
      // LÍMITE DE RETRASO (6 horas): Calcular tiempo desde admisión
      const horasDesdeAdmision = fechaHoraActualMoment.diff(fechaHoraAdmisionMoment, 'hours', true);
      const horasDesdeProcedimiento = fechaHoraActualMoment.diff(fechaHoraProcedimientoMoment, 'hours', true);
      
      // Si el paciente lleva más de 6 horas admitido
      if (horasDesdeAdmision > 6) {
        // Solo permitir procedimientos de las últimas 6 horas respecto a la hora actual
        if (horasDesdeProcedimiento > 6) {
          // EXCEPCIÓN: Si intenta registrar algo de hace más de 6 horas, requiere justificación
          if (!justificacionRegistroTardio || justificacionRegistroTardio.trim() === '') {
            await t.rollback();
            return res.status(400).json({
              code: 'REQUIRE_JUSTIFICACION_TARDIO',
              message: `⚠️ Registro tardío detectado. El procedimiento tiene ${horasDesdeProcedimiento.toFixed(1)} horas de antigüedad respecto a la hora actual. Se requiere justificación obligatoria del registro tardío en las observaciones.`,
              horasAntiguedad: horasDesdeProcedimiento.toFixed(1),
              requiereJustificacion: true
            });
          }
          // Si tiene justificación, permitir el registro pero agregarla a las observaciones
          console.log(`[createCumplimientoProcedimiento] ⚠️ Registro tardío con justificación: ${justificacionRegistroTardio}`);
        }
      } else {
        // Si el paciente lleva menos de 6 horas admitido, aplicar la regla normal de 6 horas
        if (horasDesdeProcedimiento > 6) {
          await t.rollback();
          return res.status(400).json({
            code: 'PROCEDIMIENTO_MUY_ANTIGUO',
            message: `⚠️ No se puede registrar un procedimiento con más de 6 horas de antigüedad respecto a la hora actual. El procedimiento tiene ${horasDesdeProcedimiento.toFixed(1)} horas de antigüedad.`,
            horasAntiguedad: horasDesdeProcedimiento.toFixed(1)
          });
        }
      }
      
      console.log(`[createCumplimientoProcedimiento] ✅ Validaciones de tiempo pasadas:`);
      console.log(`  - Hora admisión: ${fechaHoraAdmisionMoment.format('DD/MM/YYYY HH:mm')}`);
      console.log(`  - Hora procedimiento: ${fechaHoraProcedimientoMoment.format('DD/MM/YYYY HH:mm')}`);
      console.log(`  - Hora actual: ${fechaHoraActualMoment.format('DD/MM/YYYY HH:mm')}`);
      console.log(`  - Horas desde admisión: ${horasDesdeAdmision.toFixed(1)}`);
      console.log(`  - Horas desde procedimiento: ${horasDesdeProcedimiento.toFixed(1)}`);
    }

    // Verificar que el paciente no esté fallecido
    if (admision.estado_paciente_id === 8) { // 8 = FALLECIDO según el esquema
      await t.rollback();
      return res.status(400).json({ message: 'No se pueden registrar procedimientos para un paciente fallecido.' });
    }

    // VALIDACIÓN DE SIGNOS VITALES: Solo cuando hay alerta médica
    // Si NO hay alerta médica, permitir registro automático sin validar signos vitales
    const triajeNombre = admision.TriajeDefinitivo?.nombre;
    const triajeColor = admision.TriajeDefinitivo?.color;
    const triajeDefinitivoId = admision.triajeDefinitivoId;
    
    console.log(`[createCumplimientoProcedimiento] Validando signos vitales:`);
    console.log(`  - Alerta Médica: ${alertaMedica ? 'SÍ' : 'NO'}`);
    console.log(`  - Triaje Definitivo ID: ${triajeDefinitivoId}`);
    console.log(`  - Triaje Nombre: ${triajeNombre || 'NO ASIGNADO'}`);
    console.log(`  - Triaje Color: ${triajeColor || 'NO ASIGNADO'}`);
    console.log(`  - Confirmar Guardar Sin Signos Vitales: ${confirmarGuardarSinSignosVitales ? 'SÍ' : 'NO'}`);
    
    // CASO ESPECIAL: Triaje ROJO (RESUCITACIÓN) - NO requiere signos vitales previos
    const esTriajeRojo = triajeDefinitivoId && (triajeNombre === 'RESUCITACIÓN' || triajeColor?.toLowerCase() === 'rojo');
    
    console.log(`  - ¿Es triaje ROJO?: ${esTriajeRojo}`);
    
    // Verificar si hay signos vitales (para informar al frontend)
    // NUEVA LÓGICA: Informar si requiere signos vitales, pero NO guardar todavía si los requiere
    // EXCEPCIÓN: Si confirmarGuardarSinSignosVitales es true, guardar sin validar signos vitales
    let requiereSignosVitalesDespues = false;
    
    if (alertaMedica && !esTriajeRojo && !confirmarGuardarSinSignosVitales) {
      const signosVitales = await SignosVitales.findOne({
        where: { admisionId: admisionId },
        order: [['fecha_hora_registro', 'DESC']],
        transaction: t
      });
      
      console.log(`  - Signos vitales encontrados: ${signosVitales ? 'SÍ' : 'NO'}`);
      
      if (!signosVitales) {
        // NO guardar todavía - informar al frontend que requiere signos vitales primero
        requiereSignosVitalesDespues = true;
        console.log(`[createCumplimientoProcedimiento] ⚠️ Alerta médica activa pero no hay signos vitales - NO se guardará hasta que el usuario confirme ir a tomar signos vitales`);
        await t.rollback();
        return res.status(200).json({
          message: 'Para completar el registro del procedimiento con alerta médica, debe tomar signos vitales primero.',
          code: 'REQUIRE_SIGNOS_VITALES',
          requiereSignosVitales: true,
          admisionId: admisionId,
          triaje: triajeNombre || 'Sin triaje asignado',
          // NO devolver cumplimiento porque NO se guardó todavía
          cumplimiento: null
        });
      } else {
        console.log(`[createCumplimientoProcedimiento] ✅ Signos vitales encontrados. Procedimiento con alerta médica permitido.`);
      }
    } else if (!alertaMedica) {
      console.log(`[createCumplimientoProcedimiento] ✅ Sin alerta médica - Procedimiento permitido automáticamente sin validar signos vitales.`);
    } else if (confirmarGuardarSinSignosVitales) {
      console.log(`[createCumplimientoProcedimiento] ✅ Usuario confirmó guardar sin signos vitales - Procedimiento permitido.`);
    } else {
      console.log(`[createCumplimientoProcedimiento] ✅ Triaje ROJO detectado. Procedimiento permitido sin signos vitales (emergencia vital).`);
    }

    // Verificar que el procedimiento existe en el catálogo
    const procedimiento = await CatProcedimientosEmergencia.findByPk(procedimientoCatId, { transaction: t });
    if (!procedimiento) {
      await t.rollback();
      return res.status(404).json({ message: 'Procedimiento no encontrado en el catálogo.' });
    }

    // Crear el registro de cumplimiento
    // SOLUCIÓN: Guardar explícitamente como UTC para evitar problemas de interpretación
    // El frontend envía formato datetime-local (formato: "YYYY-MM-DDTHH:mm") que representa hora local de Ecuador
    // Necesitamos convertirla a UTC antes de guardar para que se guarde correctamente
    let fechaHoraProcedimiento;
    if (fechaHora) {
      // El frontend envía formato datetime-local: "YYYY-MM-DDTHH:mm" (ej: "2026-01-25T15:00")
      // Interpretar como hora local de Ecuador (America/Guayaquil)
      const fechaHoraMoment = moment.tz(fechaHora, 'YYYY-MM-DDTHH:mm', 'America/Guayaquil');
      
      if (!fechaHoraMoment.isValid()) {
        throw new Error('Formato de fecha/hora inválido');
      }
      
      // IMPORTANTE: Convertir explícitamente a UTC antes de guardar
      // Esto asegura que la fecha se guarde correctamente en UTC en la BD
      // Ecuador está en UTC-5, así que 15:00 Ecuador = 20:00 UTC
      fechaHoraProcedimiento = fechaHoraMoment.utc().toDate();
      
      console.log(`[createCumplimientoProcedimiento] Fecha/hora recibida del frontend: ${fechaHora}`);
      console.log(`[createCumplimientoProcedimiento] Fecha/hora interpretada (Ecuador local): ${fechaHoraMoment.format('DD/MM/YYYY HH:mm')}`);
      console.log(`[createCumplimientoProcedimiento] Fecha/hora convertida a UTC: ${fechaHoraMoment.utc().format('DD/MM/YYYY HH:mm')} UTC`);
      console.log(`[createCumplimientoProcedimiento] Fecha/hora que se guardará (Date object ISO): ${fechaHoraProcedimiento.toISOString()}`);
      console.log(`[createCumplimientoProcedimiento] Verificación - Fecha guardada convertida de vuelta a Ecuador: ${moment.utc(fechaHoraProcedimiento).tz('America/Guayaquil').format('DD/MM/YYYY HH:mm')}`);
    } else {
      // Si no hay fechaHora, usar la hora actual en zona horaria de Ecuador y convertir a UTC
      const ahoraEcuador = moment.tz('America/Guayaquil');
      fechaHoraProcedimiento = ahoraEcuador.utc().toDate();
      console.log(`[createCumplimientoProcedimiento] Usando hora actual de Ecuador: ${ahoraEcuador.format('DD/MM/YYYY HH:mm')}`);
      console.log(`[createCumplimientoProcedimiento] Convertida a UTC: ${ahoraEcuador.utc().format('DD/MM/YYYY HH:mm')} UTC`);
    }
    
    // Combinar observaciones: si hay justificación de registro tardío, agregarla
    let observacionFinal = observacionHallazgo || '';
    if (justificacionRegistroTardio && justificacionRegistroTardio.trim() !== '') {
      const justificacionFormateada = `\n\n[REGISTRO TARDÍO - ${moment.tz('America/Guayaquil').format('DD/MM/YYYY HH:mm')}]: ${justificacionRegistroTardio}`;
      observacionFinal = observacionFinal ? observacionFinal + justificacionFormateada : justificacionRegistroTardio;
    }
    
    const cumplimiento = await CumplimientoProcedimientos.create({
      admision_id: admisionId,
      procedimiento_cat_id: procedimientoCatId,
      usuario_enfermeria_id: usuarioEnfermeriaId,
      fecha_hora: fechaHoraProcedimiento, // Guardar como Date object (Sequelize/MariaDB lo manejará como UTC internamente)
      observacion_hallazgo: observacionFinal || null,
      alerta_medica: alertaMedica ? 1 : 0,
      observacion_escalamiento: alertaMedica ? observacionEscalamiento : null
    }, { transaction: t });

    // Si tiene alerta médica, actualizar la admisión y cambiar estado a PROCEDIMIENTOS
    if (alertaMedica) {
      // Obtener el ID del estado PROCEDIMIENTOS
      const estadoProcedimientos = await CatEstadoPaciente.findOne({ 
        where: { nombre: 'PROCEDIMIENTOS' },
        transaction: t 
      });
      
      if (estadoProcedimientos) {
        // Actualizar estado_paciente_id en la admisión
        await admision.update({
          estado_paciente_id: estadoProcedimientos.id,
          prioridad_enfermeria: 1,
          observacion_escalamiento: observacionEscalamiento,
          fecha_ultima_actividad: new Date()
        }, { transaction: t });
        
        // Crear registro en ATENCION_PACIENTE_ESTADO
        const usuarioEnfermeria = await Usuario.findByPk(usuarioEnfermeriaId, {
          include: [{ model: require('../models/rol'), as: 'Rol' }],
          transaction: t
        });
        
        if (usuarioEnfermeria && usuarioEnfermeria.Rol) {
          await createOrUpdateAtencionPacienteEstado(
            admision,
            'PROCEDIMIENTOS',
            usuarioEnfermeriaId,
            usuarioEnfermeria.Rol.id,
            null,
            `Procedimiento registrado con sugerencia de revisión médica: ${observacionEscalamiento || 'Sin observación'}`,
            t
          );
        }
        
        console.log(`[createCumplimientoProcedimiento] Admisión ${admisionId} actualizada a estado PROCEDIMIENTOS.`);
      } else {
        console.warn(`[createCumplimientoProcedimiento] Estado PROCEDIMIENTOS no encontrado en catálogo.`);
      }
    } else {
      // Actualizar solo fecha de última actividad
      await admision.update({
        fecha_ultima_actividad: new Date()
      }, { transaction: t });
    }

    await t.commit();

    // Verificar qué se guardó exactamente en la BD usando SQL raw
    const verificacionBD = await sequelize.query(`
      SELECT 
        id,
        DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') as fecha_hora_bd_string,
        fecha_hora as fecha_hora_bd_raw,
        UNIX_TIMESTAMP(fecha_hora) as fecha_hora_unix
      FROM CUMPLIMIENTO_PROCEDIMIENTOS
      WHERE id = :cumplimientoId
    `, {
      replacements: { cumplimientoId: cumplimiento.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`[createCumplimientoProcedimiento] Verificación BD - Fecha guardada (string): ${verificacionBD[0]?.fecha_hora_bd_string}`);
    console.log(`[createCumplimientoProcedimiento] Verificación BD - Fecha guardada (raw): ${verificacionBD[0]?.fecha_hora_bd_raw}`);
    console.log(`[createCumplimientoProcedimiento] Verificación BD - Unix timestamp: ${verificacionBD[0]?.fecha_hora_unix}`);

    // SOLUCIÓN: Leer la fecha directamente desde la BD usando SQL raw con CONVERT_TZ
    const cumplimientoRaw = await sequelize.query(`
      SELECT 
        cp.id,
        cp.admision_id,
        cp.procedimiento_cat_id,
        cp.usuario_enfermeria_id,
        cp.observacion_hallazgo,
        cp.alerta_medica,
        cp.observacion_escalamiento,
        cp.estado,
        cp.anulado_por_usuario_id,
        cp.fecha_anulacion,
        cp.razon_anulacion,
        cp.createdAt,
        cp.updatedAt,
        -- Convertir directamente de UTC a zona horaria de Ecuador usando CONVERT_TZ
        DATE_FORMAT(
          IFNULL(
            CONVERT_TZ(cp.fecha_hora, '+00:00', '-05:00'),
            TIMESTAMPADD(HOUR, -5, cp.fecha_hora)
          ),
          '%d/%m/%Y %H:%i'
        ) as fecha_hora_formateada,
        DATE_FORMAT(cp.fecha_hora, '%Y-%m-%d %H:%i:%s') as fecha_hora_raw_string
      FROM CUMPLIMIENTO_PROCEDIMIENTOS cp
      WHERE cp.id = :cumplimientoId
    `, {
      replacements: { cumplimientoId: cumplimiento.id },
      type: sequelize.QueryTypes.SELECT
    });

    const cumplimientoRawData = cumplimientoRaw[0];
    console.log(`[createCumplimientoProcedimiento] Fecha formateada desde SQL: ${cumplimientoRawData?.fecha_hora_formateada}`);
    console.log(`[createCumplimientoProcedimiento] Fecha raw desde BD (string): ${cumplimientoRawData?.fecha_hora_raw_string}`);

    // Obtener el cumplimiento completo con sus relaciones
    const cumplimientoCompleto = await CumplimientoProcedimientos.findByPk(cumplimiento.id, {
      include: [
        { model: CatProcedimientosEmergencia, as: 'Procedimiento', attributes: ['nombre'] },
        { model: Usuario, as: 'UsuarioEnfermeria', attributes: ['nombres', 'apellidos'] }
      ],
      raw: false
    });

    const cumplimientoResponse = cumplimientoCompleto.toJSON();
    cumplimientoResponse.admision_id = admisionId; // Agregar explícitamente el admision_id
    
    // Usar la fecha ya formateada directamente desde SQL
    if (cumplimientoRawData?.fecha_hora_formateada) {
      cumplimientoResponse.fecha_hora_formateada = cumplimientoRawData.fecha_hora_formateada;
      cumplimientoResponse.fecha_hora = cumplimientoRawData.fecha_hora_formateada; // También mantener fecha_hora para compatibilidad
    }

    // Determinar si se requiere redirigir a signos vitales
    // Solo si hay alerta médica Y NO es triaje ROJO Y NO hay signos vitales previos
    const requiereRedirigirSignosVitales = requiereSignosVitalesDespues;

    // Mensaje adaptado según si requiere signos vitales después
    let mensajeRespuesta;
    if (alertaMedica && requiereSignosVitalesDespues) {
      mensajeRespuesta = '✅ Procedimiento registrado exitosamente. ⚠️ El paciente ha sido escalado a valoración médica. Debe tomar signos vitales antes de continuar.';
    } else if (alertaMedica) {
      mensajeRespuesta = 'Procedimiento registrado y paciente escalado a valoración médica.';
    } else {
      mensajeRespuesta = 'Procedimiento registrado exitosamente.';
    }

    res.status(201).json({
      message: mensajeRespuesta,
      cumplimiento: cumplimientoResponse,
      escalado: alertaMedica,
      requiereSignosVitales: requiereRedirigirSignosVitales, // Solo si hay alerta médica Y NO es ROJO Y NO hay signos vitales
      esTriajeRojo: esTriajeRojo, // Informar si es triaje ROJO
      triaje: triajeNombre || 'Sin triaje asignado' // Informar triaje actual para el frontend
    });
  } catch (error) {
    await t.rollback();
    console.error('[createCumplimientoProcedimiento] Error:', error);
    res.status(500).json({ 
      message: 'Error al registrar el cumplimiento del procedimiento.', 
      error: error.message 
    });
  }
};

/**
 * Obtener todos los cumplimientos de procedimientos por admisión
 * OPTIMIZADO: Una sola consulta con JOINs y índices optimizados
 */
exports.getCumplimientosByAdmision = async (req, res) => {
  const { admisionId } = req.params;

  try {
    // OPTIMIZACIÓN: Consulta SQL optimizada con índices y solo campos necesarios
    const cumplimientosRaw = await sequelize.query(`
      SELECT 
        cp.id,
        cp.admision_id,
        cp.procedimiento_cat_id,
        cp.usuario_enfermeria_id,
        cp.observacion_hallazgo,
        cp.alerta_medica,
        cp.observacion_escalamiento,
        cp.estado,
        cp.anulado_por_usuario_id,
        cp.fecha_anulacion,
        cp.razon_anulacion,
        cp.createdAt,
        cp.updatedAt,
        -- Convertir directamente de UTC a zona horaria de Ecuador
        DATE_FORMAT(
          IFNULL(
            CONVERT_TZ(cp.fecha_hora, '+00:00', '-05:00'),
            TIMESTAMPADD(HOUR, -5, cp.fecha_hora)
          ),
          '%d/%m/%Y %H:%i'
        ) as fecha_hora_formateada,
        -- Datos del procedimiento (solo campos necesarios)
        cpe.nombre as procedimiento_nombre,
        -- Datos del usuario (solo campos necesarios)
        u.nombres as usuario_nombres,
        u.apellidos as usuario_apellidos
      FROM CUMPLIMIENTO_PROCEDIMIENTOS cp
      LEFT JOIN CAT_PROCEDIMIENTOS_EMERGENCIA cpe ON cp.procedimiento_cat_id = cpe.id
      LEFT JOIN USUARIOS_SISTEMA u ON cp.usuario_enfermeria_id = u.id
      WHERE cp.admision_id = :admisionId 
        AND cp.estado = 'ACTIVO'
      ORDER BY cp.fecha_hora DESC
      LIMIT 100
    `, {
      replacements: { admisionId: admisionId },
      type: sequelize.QueryTypes.SELECT
    });

    // Formatear la respuesta directamente sin consultas adicionales
    const cumplimientosFormateados = cumplimientosRaw.map(c => ({
      id: c.id,
      admision_id: c.admision_id,
      procedimiento_cat_id: c.procedimiento_cat_id,
      usuario_enfermeria_id: c.usuario_enfermeria_id,
      observacion_hallazgo: c.observacion_hallazgo,
      alerta_medica: c.alerta_medica,
      observacion_escalamiento: c.observacion_escalamiento,
      estado: c.estado,
      anulado_por_usuario_id: c.anulado_por_usuario_id,
      fecha_anulacion: c.fecha_anulacion,
      razon_anulacion: c.razon_anulacion,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      fecha_hora: c.fecha_hora_formateada,
      fecha_hora_formateada: c.fecha_hora_formateada,
      Procedimiento: c.procedimiento_nombre ? {
        id: c.procedimiento_cat_id,
        nombre: c.procedimiento_nombre
      } : null,
      UsuarioEnfermeria: c.usuario_nombres ? {
        id: c.usuario_enfermeria_id,
        nombres: c.usuario_nombres,
        apellidos: c.usuario_apellidos
      } : null
    }));

    res.status(200).json(cumplimientosFormateados);
  } catch (error) {
    console.error('[getCumplimientosByAdmision] Error:', error);
    res.status(500).json({ 
      message: 'Error al obtener los cumplimientos de procedimientos.', 
      error: error.message 
    });
  }
};

/**
 * Obtener todos los cumplimientos por paciente (historial completo)
 */
exports.getCumplimientosByPaciente = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    const cumplimientos = await CumplimientoProcedimientos.findAll({
      include: [
        { 
          model: Admision, 
          as: 'Admision',
          where: { pacienteId: pacienteId },
          attributes: ['id', 'fecha_hora_admision'],
          include: [
            {
              model: Paciente,
              as: 'Paciente',
              attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion']
            }
          ]
        },
        { 
          model: CatProcedimientosEmergencia, 
          as: 'Procedimiento', 
          attributes: ['id', 'nombre'] 
        },
        { 
          model: Usuario, 
          as: 'UsuarioEnfermeria', 
          attributes: ['nombres', 'apellidos'] 
        }
      ],
      order: [['fecha_hora', 'DESC']]
    });

    res.status(200).json(cumplimientos);
  } catch (error) {
    console.error('[getCumplimientosByPaciente] Error:', error);
    res.status(500).json({ 
      message: 'Error al obtener el historial de cumplimientos.', 
      error: error.message 
    });
  }
};

/**
 * Anular un cumplimiento de procedimiento
 * No se elimina físicamente, se marca como ANULADO
 */
exports.anularCumplimientoProcedimiento = async (req, res) => {
  const { id } = req.params;
  const { razonAnulacion } = req.body;
  const usuarioId = req.userId;

  console.log('[anularCumplimientoProcedimiento] ID:', id, 'Usuario:', usuarioId, 'Razón:', razonAnulacion);

  // Validación: Razón es obligatoria
  if (!razonAnulacion || razonAnulacion.trim() === '') {
    return res.status(400).json({ 
      message: 'La razón de la anulación es obligatoria.' 
    });
  }

  try {
    const cumplimiento = await CumplimientoProcedimientos.findByPk(id, {
      include: [
        { model: Admision, as: 'Admision', attributes: ['id', 'prioridad_enfermeria'] }
      ]
    });

    if (!cumplimiento) {
      return res.status(404).json({ message: 'Cumplimiento de procedimiento no encontrado.' });
    }

    // Verificar que no esté ya anulado
    if (cumplimiento.estado === 'ANULADO') {
      return res.status(400).json({ message: 'Este procedimiento ya ha sido anulado.' });
    }

    // Anular el registro (NO eliminar)
    await cumplimiento.update({
      estado: 'ANULADO',
      anulado_por_usuario_id: usuarioId,
      fecha_anulacion: new Date(),
      razon_anulacion: razonAnulacion
    });

    // Si el procedimiento tenía alerta médica activa, resetear la prioridad en la admisión
    if (cumplimiento.alerta_medica === 1 && cumplimiento.Admision) {
      await cumplimiento.Admision.update({
        prioridad_enfermeria: 0,
        observacion_escalamiento: null
      });
      console.log('[anularCumplimientoProcedimiento] Prioridad de enfermería reseteada por anulación.');
    }

    console.log(`[anularCumplimientoProcedimiento] Procedimiento ${id} anulado exitosamente.`);

    res.status(200).json({
      message: 'Procedimiento anulado exitosamente.',
      cumplimiento: cumplimiento
    });
  } catch (error) {
    console.error('[anularCumplimientoProcedimiento] Error:', error);
    res.status(500).json({ 
      message: 'Error al anular el cumplimiento del procedimiento.', 
      error: error.message 
    });
  }
};

module.exports = {
  createCumplimientoProcedimiento: exports.createCumplimientoProcedimiento,
  getCumplimientosByAdmision: exports.getCumplimientosByAdmision,
  getCumplimientosByPaciente: exports.getCumplimientosByPaciente,
  anularCumplimientoProcedimiento: exports.anularCumplimientoProcedimiento
};
