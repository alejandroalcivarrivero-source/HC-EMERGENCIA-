const { Op } = require('sequelize'); // Importar Op para operadores de Sequelize
const sequelize = require('../config/database'); // Importar la instancia de sequelize
const SignosVitales = require('../models/signos_vitales');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol'); // Importar el modelo Rol
const Admision = require('../models/admisiones');
const Paciente = require('../models/pacientes');
const ProcedimientoEmergencia = require('../models/procedimientoEmergencia'); // Importar el modelo de ProcedimientoEmergencia (legacy)
const CumplimientoProcedimientos = require('../models/cumplimientoProcedimientos'); // Importar el modelo CumplimientoProcedimientos
const CatProcedimientosEmergencia = require('../models/cat_procedimientos_emergencia'); // Importar el catálogo de procedimientos
const AtencionPacienteEstado = require('../models/atencionPacienteEstado'); // Importar el modelo AtencionPacienteEstado
const CatEstadoPaciente = require('../models/cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const CatTriaje = require('../models/cat_triaje'); // Importar el modelo CatTriaje
const { createOrUpdateAtencionPacienteEstado } = require('./atencionPacienteEstadoController'); // Importar la función para gestionar el estado de atención
const CatMotivoConsultaSintomas = require('../models/cat_motivo_consulta_sintomas'); // Importar el modelo CatMotivoConsultaSintomas
const moment = require('moment-timezone'); // Importar moment-timezone para manejo de fechas

console.log('Cargando signosVitalesController.js'); // Log para depuración

// Función auxiliar para calcular la edad en años, meses y días
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  let dias = hoy.getDate() - nacimiento.getDate();

  if (dias < 0) {
    meses--;
    dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate(); // Días en el mes anterior
  }
  if (meses < 0) {
    años--;
    meses += 12;
  }
  return { años, meses, dias };
};

exports.calculateTriaje = async (signosVitales, motivoConsultaCodigoTriaje = null, pacienteFechaNacimiento = null) => {
  const { temperatura, presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno } = signosVitales;

  // Convertir valores a números para comparaciones
  const tempVal = parseFloat(temperatura);
  const fcVal = parseInt(frecuencia_cardiaca);
  const frVal = parseInt(frecuencia_respiratoria);
  const satOxVal = parseFloat(saturacion_oxigeno);
  const [sistolica, diastolica] = presion_arterial ? presion_arterial.split('/').map(Number) : [null, null];

  let triajeNombreCalculado = 'SIN URGENCIA'; // Valor por defecto

  const edad = calcularEdad(pacienteFechaNacimiento);
  let categoriaEdad = 'ADULTO'; // Por defecto
  if (edad) {
    if (edad.años < 1) { // Menor de 1 año
      categoriaEdad = 'PEDIATRICO_LACTANTE';
    } else if (edad.años >= 1 && edad.años < 5) { // De 1 a 4 años
      categoriaEdad = 'PEDIATRICO_PREESCOLAR';
    }
  }

  // Criterios para RESUCITACIÓN (Prioridad I - ROJO)
  let isRojo = false;
  if (categoriaEdad === 'ADULTO') {
    if (
      (fcVal !== null && (fcVal < 50 || fcVal > 150)) ||
      (sistolica !== null && (sistolica < 90 || sistolica > 220)) ||
      (diastolica !== null && diastolica > 110) ||
      (frVal !== null && (frVal > 35 || frVal < 10)) ||
      (satOxVal !== null && satOxVal <= 85)
    ) {
      isRojo = true;
    }
  } else if (categoriaEdad === 'PEDIATRICO_LACTANTE') { // Hasta 1 año (0-11 meses)
    if (
      (fcVal !== null && (fcVal <= 60 || fcVal >= 200)) ||
      (sistolica !== null && sistolica < 60) ||
      (satOxVal !== null && satOxVal <= 85) ||
      (frVal !== null && ((edad.meses <= 2 && frVal >= 60) || (edad.meses > 2 && edad.meses <= 11 && frVal >= 50)))
    ) {
      isRojo = true;
    }
  } else if (categoriaEdad === 'PEDIATRICO_PREESCOLAR') { // 1 a 4 años (12 meses - 59 meses)
    if (
      (fcVal !== null && (fcVal <= 60 || fcVal >= 180)) ||
      (sistolica !== null && sistolica < 80) ||
      (satOxVal !== null && satOxVal <= 85) ||
      (frVal !== null && frVal > 40)
    ) {
      isRojo = true;
    }
  }

  if (isRojo) {
    triajeNombreCalculado = 'RESUCITACIÓN';
  }
  // Criterios para EMERGENCIA (Prioridad II - NARANJA)
  let isNaranja = false;
  if (categoriaEdad === 'ADULTO') {
    if (
      (frVal !== null && frVal >= 24) ||
      (tempVal !== null && (tempVal >= 38.5 || tempVal <= 36)) ||
      (fcVal !== null && (fcVal >= 100 || fcVal <= 60)) ||
      (satOxVal !== null && satOxVal > 85 && satOxVal < 92) ||
      (sistolica !== null && (sistolica >= 180 && sistolica <= 220)) ||
      (diastolica !== null && (diastolica >= 90 && diastolica <= 110))
    ) {
      isNaranja = true;
    }
  }
  // No se especifican rangos de signos vitales diferentes para NARANJA en pediátricos,
  // por lo que se usarán los mismos criterios generales si no son ROJO.
  // Si se necesitan criterios específicos para pediátricos NARANJA, se añadirían aquí.

  if (isNaranja) {
    triajeNombreCalculado = 'EMERGENCIA';
  }
  // Criterios para URGENCIA (Prioridad III - AMARILLO)
  let isAmarillo = false;
  if (categoriaEdad === 'ADULTO') {
    if (
      (tempVal !== null && (tempVal > 38 && tempVal < 38.5)) ||
      (fcVal !== null && ((fcVal > 100 && fcVal <= 120) || (fcVal < 60 && fcVal >= 40))) ||
      (sistolica !== null && (sistolica > 140 && sistolica <= 180)) ||
      (diastolica !== null && (diastolica > 90 && diastolica <= 100)) ||
      (satOxVal !== null && satOxVal > 90 && satOxVal <= 92)
    ) {
      isAmarillo = true;
    }
  }
  // No se especifican rangos de signos vitales diferentes para AMARILLO en pediátricos.

  if (isAmarillo) {
    triajeNombreCalculado = 'URGENCIA';
  }
  // Criterios para URGENCIA MENOR (Prioridad IV - VERDE)
  let isVerde = false;
  if (categoriaEdad === 'ADULTO') {
    if (
      (tempVal !== null && (tempVal >= 36 && tempVal <= 38)) &&
      (fcVal !== null && (fcVal >= 60 && fcVal <= 100)) &&
      (frVal !== null && (frVal >= 10 && frVal <= 23)) &&
      (satOxVal !== null && satOxVal >= 93) &&
      (sistolica !== null && sistolica >= 90 && sistolica <= 140) &&
      (diastolica !== null && diastolica >= 60 && diastolica <= 90)
    ) {
      isVerde = true;
    }
  }
  // No se especifican rangos de signos vitales diferentes para VERDE en pediátricos.

  if (isVerde) {
    triajeNombreCalculado = 'URGENCIA MENOR';
  }
  // Criterios para SIN URGENCIA (Prioridad V - AZUL)
  // Si no cumple con ninguno de los criterios anteriores, se considera SIN URGENCIA.
  else {
    triajeNombreCalculado = 'SIN URGENCIA';
  }

  // Obtener el triaje del motivo de consulta si existe
  let triajeMotivoConsulta = null;
  if (motivoConsultaCodigoTriaje !== null) {
    triajeMotivoConsulta = await CatTriaje.findOne({
      where: { id: motivoConsultaCodigoTriaje },
      attributes: ['nombre', 'color', 'id']
    });
  }

  // Obtener el triaje calculado por signos vitales
  const triajeSignosVitales = await CatTriaje.findOne({
    where: { nombre: triajeNombreCalculado },
    attributes: ['nombre', 'color', 'id']
  });

  let triajeFinal = triajeSignosVitales; // Por defecto, el triaje de signos vitales

  console.log(`[calculateTriaje] Triaje calculado por signos vitales: ${triajeSignosVitales.nombre} (ID: ${triajeSignosVitales.id})`);
  if (triajeMotivoConsulta) {
    console.log(`[calculateTriaje] Triaje del motivo de consulta: ${triajeMotivoConsulta.nombre} (ID: ${triajeMotivoConsulta.id})`);
  }

  // Si hay un triaje por motivo de consulta y es más crítico, usarlo
  if (triajeMotivoConsulta && triajeMotivoConsulta.id < triajeSignosVitales.id) {
    triajeFinal = triajeMotivoConsulta;
    console.log(`[calculateTriaje] Se seleccionó el triaje del motivo de consulta por ser más crítico.`);
  } else {
    console.log(`[calculateTriaje] Se seleccionó el triaje de signos vitales.`);
  }

  return triajeFinal; // Devuelve el objeto completo del triaje (nombre, color, id)
};

exports.calculateTriajeOnly = async (req, res) => {
  const { signosVitales, admisionId } = req.body;
  console.log('[signosVitalesController] Datos recibidos para calcular triaje:', signosVitales, 'Admision ID:', admisionId);

  try {
    const admision = await Admision.findByPk(admisionId, {
      include: [
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Codigo_Triaje'],
          required: false
        },
        {
          model: CatTriaje,
          as: 'TriajePreliminar',
          attributes: ['id', 'nombre', 'color'],
          required: false
        },
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['fecha_nacimiento'],
          required: true // Asegurarse de que el paciente esté presente
        }
      ]
    });

    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    const motivoConsultaCodigoTriaje = admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Codigo_Triaje : null;
    const pacienteFechaNacimiento = admision.Paciente ? admision.Paciente.fecha_nacimiento : null;
    const triajeCalculadoObj = await exports.calculateTriaje(signosVitales, motivoConsultaCodigoTriaje, pacienteFechaNacimiento);

    res.status(200).json({
      message: 'Triaje calculado exitosamente.',
      triajeCalculado: {
        id: triajeCalculadoObj.id,
        nombre: triajeCalculadoObj.nombre,
        color: triajeCalculadoObj.color
      }
    });

  } catch (error) {
    console.error('Error al calcular el triaje:', error);
    res.status(500).json({ message: 'Error al calcular el triaje.' });
  }
};

/**
 * Asignar solo el triaje definitivo sin signos vitales
 * Útil cuando el profesional necesita asignar un triaje (especialmente ROJO) antes de tomar signos vitales
 */
exports.asignarTriajeSolo = async (req, res) => {
  const { admisionId, triajeDefinitivoId, observacion } = req.body;

  console.log('[signosVitalesController] Asignando solo triaje - AdmisionId:', admisionId, 'TriajeId:', triajeDefinitivoId, 'Observación:', observacion);

  // Validar que la observación esté presente
  if (!observacion || observacion.trim() === '') {
    return res.status(400).json({ message: 'La observación es obligatoria al asignar triaje ROJO sin signos vitales.' });
  }

  const t = await sequelize.transaction();

  try {
    const admision = await Admision.findByPk(admisionId, {
      include: [
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo',
          attributes: ['id', 'nombre', 'color'],
          required: false
        }
      ],
      transaction: t
    });

    if (!admision) {
      await t.rollback();
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    if (admision.estado_paciente === 'FALLECIDO') {
      await t.rollback();
      return res.status(400).json({ message: 'No se puede asignar triaje a un paciente fallecido.' });
    }

    if (!triajeDefinitivoId) {
      await t.rollback();
      return res.status(400).json({ message: 'El ID del triaje es obligatorio.' });
    }

    // Verificar que el triaje existe
    const triaje = await CatTriaje.findByPk(triajeDefinitivoId, { transaction: t });
    if (!triaje) {
      await t.rollback();
      return res.status(404).json({ message: 'Triaje no encontrado.' });
    }

    // Validar que solo se permita triaje ROJO (RESUCITACIÓN)
    if (triaje.nombre !== 'RESUCITACIÓN' && triaje.color?.toLowerCase() !== 'rojo') {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Solo se puede asignar triaje ROJO (RESUCITACIÓN) sin signos vitales. Para otros triajes, debe tomar signos vitales primero.' 
      });
    }

    // Asignar el triaje definitivo y guardar la observación
    admision.triajeDefinitivoId = triajeDefinitivoId;
    admision.observacion_escalamiento = observacion.trim(); // Guardar observación en el campo de escalamiento
    await admision.save({ transaction: t });

    await t.commit();

    console.log(`[signosVitalesController] Triaje ${triaje.nombre} (${triaje.color}) asignado a admisión ${admisionId} sin signos vitales con observación.`);

    res.status(200).json({
      message: 'Triaje ROJO asignado exitosamente. El paciente puede proceder directamente al médico.',
      triaje: {
        id: triaje.id,
        nombre: triaje.nombre,
        color: triaje.color
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('[signosVitalesController] Error al asignar triaje:', error);
    res.status(500).json({ 
      message: 'Error al asignar el triaje.', 
      error: error.message 
    });
  }
};

exports.saveSignosVitalesAndTriaje = async (req, res) => {
  const { admisionId, sin_constantes_vitales, temperatura, presion_arterial, frecuencia_cardiaca,
    frecuencia_respiratoria, saturacion_oxigeno, perimetro_cefalico, peso, talla,
    glicemia_capilar, glasgow_ocular, glasgow_verbal, glasgow_motora, observaciones, triajeDefinitivoId } = req.body;

  console.log('[signosVitalesController] Datos recibidos para guardar signos vitales y triaje:', req.body);

  const t = await sequelize.transaction(); // Iniciar transacción

  try {
    const admision = await Admision.findByPk(admisionId, {
      include: [
        {
          model: CatMotivoConsultaSintomas,
          as: 'MotivoConsultaSintoma',
          attributes: ['Codigo_Triaje'],
          required: false
        },
        {
          model: CatTriaje,
          as: 'TriajePreliminar',
          attributes: ['id', 'nombre', 'color'],
          required: false
        },
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['fecha_nacimiento'],
          required: true // Asegurarse de que el paciente esté presente
        }
      ],
      transaction: t
    });

    if (!admision) {
      await t.rollback(); // Revertir la transacción
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    if (admision.estado_paciente === 'FALLECIDO') {
      await t.rollback(); // Revertir la transacción
      return res.status(400).json({ message: 'No se pueden registrar signos vitales para un paciente fallecido.' });
    }

    // Parse blood pressure for segmentation
    let sistolica = null;
    let diastolica = null;
    if (!sin_constantes_vitales && presion_arterial) {
      const parts = presion_arterial.split('/').map(p => parseInt(p.trim(), 10));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        sistolica = parts[0];
        diastolica = parts[1];
      }
    }

    let dataToCreate = {
      admisionId,
      sin_constantes_vitales,
      temperatura: sin_constantes_vitales ? null : temperatura,
      presion_arterial: sin_constantes_vitales ? null : presion_arterial,
      presion_sistolica: sistolica,
      presion_diastolica: diastolica,
      frecuencia_cardiaca: sin_constantes_vitales ? null : frecuencia_cardiaca,
      frecuencia_respiratoria: sin_constantes_vitales ? null : frecuencia_respiratoria,
      saturacion_oxigeno: sin_constantes_vitales ? null : saturacion_oxigeno,
      perimetro_cefalico: sin_constantes_vitales ? null : perimetro_cefalico,
      peso: sin_constantes_vitales ? null : peso,
      talla: sin_constantes_vitales ? null : talla,
      glicemia_capilar: sin_constantes_vitales ? null : glicemia_capilar,
      glasgow_ocular: sin_constantes_vitales ? null : glasgow_ocular,
      glasgow_verbal: sin_constantes_vitales ? null : glasgow_verbal,
      glasgow_motora: sin_constantes_vitales ? null : glasgow_motora,
      observaciones: sin_constantes_vitales ? 'Paciente llegó sin constantes vitales / Fallecido' : observaciones,
      usuarioId: req.userId
    };

    const signosVitales = await SignosVitales.create(dataToCreate, { transaction: t });

    // Automatic Alert Trigger
    if (sistolica && sistolica > 140) {
      console.warn(`[ALERTA CLÍNICA] Paciente con admisión ${admisionId} presenta presión sistólica elevada: ${sistolica} mmHg`);
      // Here you could integrate with a notification service or create a specialized alert record
    }

    // Si no se proporciona un triajeDefinitivoId, calcularlo
    let finalTriajeId = triajeDefinitivoId;
    if (!finalTriajeId && !sin_constantes_vitales) {
      const motivoConsultaCodigoTriaje = admision.MotivoConsultaSintoma ? admision.MotivoConsultaSintoma.Codigo_Triaje : null;
      const pacienteFechaNacimiento = admision.Paciente ? admision.Paciente.fecha_nacimiento : null;
      const triajeCalculadoObj = await exports.calculateTriaje(dataToCreate, motivoConsultaCodigoTriaje, pacienteFechaNacimiento);
      finalTriajeId = triajeCalculadoObj.id;
    }

    admision.triajeDefinitivoId = finalTriajeId;
    // NO marcar automáticamente como FALLECIDO cuando se marca "Sin Constantes Vitales"
    // El médico debe confirmar el fallecimiento desde su formulario
    // if (sin_constantes_vitales) {
    //   admision.estado_paciente_id = (await CatEstadoPaciente.findOne({ where: { nombre: 'FALLECIDO' }, transaction: t })).id;
    //   admision.fecha_hora_fallecimiento = new Date();
    // }
    await admision.save({ transaction: t });

    await admision.update({ fecha_ultima_actividad: new Date() }, { transaction: t });
    console.log(`Fecha de última actividad para admisión ${admisionId} actualizada.`);

    // Crear registro de procedimiento "Toma de Signos Vitales" en CumplimientoProcedimientos
    if (!sin_constantes_vitales) {
      try {
        const usuarioId = req.userId;
        
        // Buscar o crear el procedimiento "Toma de Signos Vitales" en el catálogo
        let procedimientoSignosVitales = await CatProcedimientosEmergencia.findOne({
          where: { nombre: 'Toma de Signos Vitales' },
          transaction: t
        });
        
        if (!procedimientoSignosVitales) {
          // Si no existe, crearlo
          procedimientoSignosVitales = await CatProcedimientosEmergencia.create({
            nombre: 'Toma de Signos Vitales'
          }, { transaction: t });
          console.log('Procedimiento "Toma de Signos Vitales" creado en el catálogo.');
        }
        
        // Crear el cumplimiento de procedimiento
        const ahoraEcuador = moment.tz('America/Guayaquil');
        const fechaHoraProcedimiento = ahoraEcuador.utc().toDate();
        
        await CumplimientoProcedimientos.create({
          admision_id: admision.id,
          procedimiento_cat_id: procedimientoSignosVitales.id,
          usuario_enfermeria_id: usuarioId,
          fecha_hora: fechaHoraProcedimiento,
          observacion_hallazgo: observaciones || 'Registro automático por toma de signos vitales.',
          alerta_medica: 0,
          observacion_escalamiento: null,
          estado: 'ACTIVO'
        }, { transaction: t });
        
        console.log('Procedimiento "Toma de Signos Vitales" registrado automáticamente en CumplimientoProcedimientos.');
      } catch (procError) {
        console.error('Error al registrar el procedimiento "Toma de Signos Vitales":', procError);
        // No revertir la transacción aquí, ya que el error es solo en el procedimiento, no en los signos vitales o admisión
      }
    }
 
    if (sin_constantes_vitales) {
      // Mantener en SIGNOS_VITALES para que el médico pueda llenar el formulario
      // El médico confirmará el fallecimiento desde su formulario
      const ultimoAtencionEstado = await AtencionPacienteEstado.findOne({
        where: { admisionId: admision.id },
        order: [['createdAt', 'DESC']],
        transaction: t
      });

      if (ultimoAtencionEstado && ultimoAtencionEstado.estado_id === (await CatEstadoPaciente.findOne({ where: { nombre: 'ADMITIDO' }, transaction: t })).id) {
        await ultimoAtencionEstado.update({
          estado_id: (await CatEstadoPaciente.findOne({ where: { nombre: 'SIGNOS_VITALES' }, transaction: t })).id,
          usuarioId: req.userId,
          rolId: req.rolId,
          observaciones: 'Paciente llegó sin constantes vitales. Pendiente confirmación médica.'
        }, { transaction: t });
        console.log('Estado de atención del paciente actualizado de ADMITIDO a SIGNOS_VITALES (sin constantes vitales).');
      } else {
        await createOrUpdateAtencionPacienteEstado(admision, 'SIGNOS_VITALES', req.userId, req.rolId, null, 'Paciente llegó sin constantes vitales. Pendiente confirmación médica.', t);
        console.log('Estado de atención del paciente creado como SIGNOS_VITALES (sin constantes vitales).');
      }
    } else {
      const ultimoAtencionEstado = await AtencionPacienteEstado.findOne({
        where: { admisionId: admision.id },
        order: [['createdAt', 'DESC']],
        transaction: t
      });

      // Obtener el ID del estado SIGNOS_VITALES
      const estadoSignosVitales = await CatEstadoPaciente.findOne({ 
        where: { nombre: 'SIGNOS_VITALES' }, 
        transaction: t 
      });

      if (estadoSignosVitales) {
        // Actualizar estado_paciente_id en la admisión
        await admision.update({
          estado_paciente_id: estadoSignosVitales.id,
          fecha_ultima_actividad: new Date()
        }, { transaction: t });
      }

      if (ultimoAtencionEstado && ultimoAtencionEstado.estado_id === (await CatEstadoPaciente.findOne({ where: { nombre: 'ADMITIDO' }, transaction: t })).id) {
        // Si el último estado es ADMITIDO, actualizamos ese registro con el nuevo estado SIGNOS_VITALES
        // y el usuario/rol que realiza la acción.
        await ultimoAtencionEstado.update({
          estado_id: estadoSignosVitales ? estadoSignosVitales.id : (await CatEstadoPaciente.findOne({ where: { nombre: 'SIGNOS_VITALES' }, transaction: t })).id,
          usuarioId: req.userId,
          rolId: req.rolId
        }, { transaction: t });
        console.log('Estado de atención del paciente actualizado de ADMITIDO a SIGNOS_VITALES.');
      } else {
        // Si no hay un último estado o no es ADMITIDO, creamos un nuevo registro SIGNOS_VITALES.
        await createOrUpdateAtencionPacienteEstado(admision, 'SIGNOS_VITALES', req.userId, req.rolId, null, null, t);
        console.log('Estado de atención del paciente creado como SIGNOS_VITALES.');
      }
    }

    const triajeDefinitivo = await CatTriaje.findByPk(finalTriajeId, { transaction: t });
    await t.commit(); // Confirmar la transacción

    res.status(201).json({
      message: 'Signos vitales y triaje guardados exitosamente.',
      signosVitales: signosVitales,
      triajeDefinitivo: {
        id: finalTriajeId,
        nombre: triajeDefinitivo.nombre,
        color: triajeDefinitivo.color
      }
    });
  } catch (error) {
    await t.rollback(); // Revertir la transacción en caso de error
    console.error('Error detallado al guardar los signos vitales y triaje:', error);
    res.status(500).json({ message: 'Error al guardar los signos vitales y triaje.', error: error.message, stack: error.stack });
  }
};


exports.getSignosVitalesByAdmision = async (req, res) => {
  const { admisionId } = req.params;
  const { historial } = req.query; // Nuevo parámetro para ver el historial completo

  try {
    let whereClause = { admisionId };

    // Si 'historial' no es true, filtrar por las últimas 24 horas
    if (historial !== 'true') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      whereClause.fecha_hora_registro = {
        [Op.gte]: twentyFourHoursAgo
      };
    }

    const signosVitales = await SignosVitales.findAll({
      where: whereClause,
      order: [['fecha_hora_registro', 'DESC']], // Ordenar por fecha de registro descendente
      include: [
        {
          model: Admision,
          as: 'AdmisionSignosVitales',
          attributes: ['id', 'fecha_hora_admision', 'triajePreliminarId', 'triajeDefinitivoId'],
          include: [
            {
              model: Paciente,
              as: 'Paciente',
              attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion']
            },
            {
              model: CatTriaje,
              as: 'TriajePreliminar',
              attributes: ['nombre', 'color']
            },
            {
              model: CatTriaje,
              as: 'TriajeDefinitivo',
              attributes: ['nombre', 'color']
            },
            {
              model: CatMotivoConsultaSintomas,
              as: 'MotivoConsultaSintoma',
              attributes: ['Motivo_Consulta_Sintoma', 'Codigo_Triaje'],
              required: false
            }
          ]
        },
        {
          model: Usuario,
          as: 'UsuarioRegistro', // Usar el alias definido en init-associations.js
          attributes: ['id', 'nombres', 'apellidos'], // Incluir el ID del usuario
          required: false, // LEFT JOIN para incluir signos vitales con o sin usuario de registro
          include: [{
            model: Rol,
            as: 'Rol', // El alias de la asociación de Usuario con Rol
            attributes: ['id', 'nombre'], // Incluir el ID y nombre del rol
            required: false
          }]
        }
      ]
    });

    // Formatear la respuesta para omitir glasgow y mostrar el nombre del usuario
    const signosVitalesFormateados = signosVitales.map(sv => {
      const usuarioNombreCompleto = sv.UsuarioRegistro ? `${sv.UsuarioRegistro.nombres || ''} ${sv.UsuarioRegistro.apellidos || ''}`.trim() : 'N/A';
      const rolNombre = sv.RolUsuarioRegistro ? sv.RolUsuarioRegistro.nombre : 'N/A';
      return {
        id: sv.id,
        sin_constantes_vitales: sv.sin_constantes_vitales,
        temperatura: sv.temperatura,
        presion_arterial: sv.presion_arterial,
        frecuencia_cardiaca: sv.frecuencia_cardiaca,
        frecuencia_respiratoria: sv.frecuencia_respiratoria,
        saturacion_oxigeno: sv.saturacion_oxigeno,
        perimetro_cefalico: sv.perimetro_cefalico,
        peso: sv.peso,
        talla: sv.talla,
        glicemia_capilar: sv.glicemia_capilar,
        observaciones: sv.observaciones,
        fecha_hora_registro: sv.fecha_hora_registro,
        admisionId: sv.admisionId,
        usuarioId: sv.usuarioId, // Incluir el ID del usuario
        rolId: sv.rolId, // Incluir el ID del rol
        usuarioRegistro: usuarioNombreCompleto,
        rolUsuarioRegistro: rolNombre,
        AdmisionSignosVitales: sv.AdmisionSignosVitales // Mantener la información de la admisión si es necesaria
      };
    });

    res.status(200).json(signosVitalesFormateados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los signos vitales por admisión.' });
  }
};

exports.updateSignosVitales = async (req, res) => {
  const { id } = req.params;
  const { sin_constantes_vitales, temperatura, presion_arterial, frecuencia_cardiaca,
    frecuencia_respiratoria, saturacion_oxigeno, perimetro_cefalico, peso, talla,
    glicemia_capilar, glasgow_ocular, glasgow_verbal, glasgow_motora, observaciones } = req.body;

  try {
    const signosVitales = await SignosVitales.findByPk(id);
    if (!signosVitales) {
      return res.status(404).json({ message: 'Registro de signos vitales no encontrado.' });
    }

    signosVitales.sin_constantes_vitales = sin_constantes_vitales !== undefined ? sin_constantes_vitales : signosVitales.sin_constantes_vitales;
    signosVitales.temperatura = temperatura !== undefined ? temperatura : signosVitales.temperatura;
    signosVitales.presion_arterial = presion_arterial !== undefined ? presion_arterial : signosVitales.presion_arterial;
    signosVitales.frecuencia_cardiaca = frecuencia_cardiaca !== undefined ? frecuencia_cardiaca : signosVitales.frecuencia_cardiaca;
    signosVitales.frecuencia_respiratoria = frecuencia_respiratoria !== undefined ? frecuencia_respiratoria : signosVitales.frecuencia_respiratoria;
    signosVitales.saturacion_oxigeno = saturacion_oxigeno !== undefined ? saturacion_oxigeno : signosVitales.saturacion_oxigeno;
    signosVitales.perimetro_cefalico = perimetro_cefalico !== undefined ? perimetro_cefalico : signosVitales.perimetro_cefalico;
    signosVitales.peso = peso !== undefined ? peso : signosVitales.peso;
    signosVitales.talla = talla !== undefined ? talla : signosVitales.talla;
    signosVitales.glicemia_capilar = glicemia_capilar !== undefined ? glicemia_capilar : signosVitales.glicemia_capilar;
    signosVitales.glasgow_ocular = glasgow_ocular !== undefined ? glasgow_ocular : signosVitales.glasgow_ocular;
    signosVitales.glasgow_verbal = glasgow_verbal !== undefined ? glasgow_verbal : signosVitales.glasgow_verbal;
    signosVitales.glasgow_motora = glasgow_motora !== undefined ? glasgow_motora : signosVitales.glasgow_motora;
    signosVitales.observaciones = observaciones !== undefined ? observaciones : signosVitales.observaciones;

    await signosVitales.save();

    // Actualizar fecha_ultima_actividad en la admisión
    const admision = await Admision.findByPk(signosVitales.admisionId);
    if (admision) {
      await admision.update({ fecha_ultima_actividad: new Date() });
      console.log(`Fecha de última actividad para admisión ${signosVitales.admisionId} actualizada.`);
    }

    res.status(200).json(signosVitales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el registro de signos vitales.' });
  }
};

exports.deleteSignosVitales = async (req, res) => {
  const { id } = req.params;

  try {
    const signosVitales = await SignosVitales.findByPk(id);
    if (!signosVitales) {
      return res.status(404).json({ message: 'Registro de signos vitales no encontrado.' });
    }

    await signosVitales.destroy();
    res.status(204).json({ message: 'Registro de signos vitales eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el registro de signos vitales.' });
  }
};