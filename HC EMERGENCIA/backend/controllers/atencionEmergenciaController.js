const { Op } = require('sequelize'); // Importar Op
const sequelize = require('../config/database'); // Importar sequelize para usar sequelize.literal
const AtencionEmergencia = require('../models/atencionEmergencia');
const Paciente = require('../models/pacientes');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const AtencionPacienteEstado = require('../models/atencionPacienteEstado'); // Importar el modelo
const CatEstadoPaciente = require('../models/cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const CatTriaje = require('../models/cat_triaje'); // Importar el modelo CatTriaje
const { createOrUpdateAtencionPacienteEstado } = require('./atencionPacienteEstadoController'); // Importar la función

exports.createAtencionEmergencia = async (req, res) => {
  console.log('[createAtencionEmergencia] Recibiendo solicitud para crear atención de emergencia. Body:', req.body);
  const {
    pacienteId,
    admisionId,
    fechaAtencion,
    horaAtencion,
    condicionLlegada,
    motivoAtencion,
    fechaEvento,
    horaEvento,
    lugarEvento,
    direccionEvento,
    custodiaPolicial,
    notificacion,
    tipoAccidenteViolenciaIntoxicacion,
    observacionesAccidente,
    sugestivoAlientoAlcoholico,
    antecedentesPatologicos,
    enfermedadProblemaActual,
    examenFisico,
    examenFisicoTraumaCritico,
    embarazoParto,
    examenesComplementarios,
    diagnosticosPresuntivos,
    diagnosticosDefinitivos,
    planTratamiento,
    observacionesPlanTratamiento,
    condicionEgreso,
    referenciaEgreso,
    establecimientoEgreso
  } = req.body;
  const usuarioId = req.userId; // El ID del usuario se adjunta a req.userId en el middleware validarToken

  try {
    // Verificar si el paciente existe
    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }

    // Verificar si la admisión existe y pertenece al paciente
    const admision = await Admision.findByPk(admisionId);
    if (!admision || admision.pacienteId !== pacienteId) {
      return res.status(400).json({ message: 'ID de admisión no válido para este paciente.' });
    }

    // Verificar si ya existe un registro de atención de emergencia para esta admisión
    const existingAtencion = await AtencionEmergencia.findOne({ where: { admisionId } });
    if (existingAtencion) {
      return res.status(409).json({ message: 'Ya existe un registro de atención de emergencia para esta admisión. Por favor, actualice el existente.' });
    }

    // Validación: La fecha y hora de atención no pueden ser mayores a la fecha y hora actual del servidor
    if (fechaAtencion && horaAtencion) {
      const fechaHoraAtencion = new Date(`${fechaAtencion}T${horaAtencion}`);
      const ahora = new Date();
      
      if (fechaHoraAtencion > ahora) {
        return res.status(400).json({ 
          message: 'La fecha y hora de atención no pueden ser mayores a la fecha y hora actual del servidor.',
          error: 'VALIDACION_FECHA_HORA_FUTURA'
        });
      }
    }

    const atencionEmergencia = await AtencionEmergencia.create({
      pacienteId,
      admisionId,
      usuarioId,
      usuarioResponsableId: usuarioId, // Asignar el médico creador como responsable por defecto
      fechaAtencion,
      horaAtencion,
      condicionLlegada,
      motivoAtencion,
      fechaEvento,
      horaEvento,
      lugarEvento,
      direccionEvento,
      custodiaPolicial,
      notificacion,
      tipoAccidenteViolenciaIntoxicacion: JSON.stringify(tipoAccidenteViolenciaIntoxicacion),
      observacionesAccidente,
      sugestivoAlientoAlcoholico,
      antecedentesPatologicos: JSON.stringify(antecedentesPatologicos),
      enfermedadProblemaActual,
      examenFisico: JSON.stringify(examenFisico),
      examenFisicoTraumaCritico,
      embarazoParto: JSON.stringify(embarazoParto),
      examenesComplementarios: JSON.stringify(examenesComplementarios),
      diagnosticosPresuntivos: JSON.stringify(diagnosticosPresuntivos),
      diagnosticosDefinitivos: JSON.stringify(diagnosticosDefinitivos),
      planTratamiento: JSON.stringify(planTratamiento),
      observacionesPlanTratamiento,
      condicionEgreso,
      referenciaEgreso,
      establecimientoEgreso,
      estadoFirma: 'PENDIENTE' // Establecer como pendiente por defecto
    });

    console.log('Atención de emergencia creada exitosamente:', atencionEmergencia.toJSON());
    
    // Actualizar el estado de atención del paciente a 'EN_ATENCION'
    // Se asume que req.rolId está disponible desde el middleware de autenticación
    await createOrUpdateAtencionPacienteEstado(admision, 'EN_ATENCION', usuarioId, req.rolId, usuarioId, null, null);
    console.log(`Estado de atención del paciente ${admision.id} actualizado a EN_ATENCION.`);

    // Actualizar fecha_ultima_actividad en la admisión
    await admision.update({ fecha_ultima_actividad: new Date() });
    console.log(`Fecha de última actividad para admisión ${admisionId} actualizada.`);

    res.status(201).json(atencionEmergencia);
    console.log('[createAtencionEmergencia] Atención de emergencia guardada en DB:', atencionEmergencia.id);

  } catch (error) {
    console.error('Error al crear la atención de emergencia:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error al crear la atención de emergencia.', error: error.message });
  }
};

exports.getAtencionEmergenciaByAdmision = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const atencionEmergencia = await AtencionEmergencia.findOne({
      where: { admisionId },
      include: [
        { model: Paciente, as: 'Paciente', attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion'] },
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision'], // Eliminar estado_paciente de aquí
          include: [{
            model: CatEstadoPaciente,
            as: 'EstadoPaciente',
            attributes: ['nombre'] // Incluir el nombre real del estado del paciente
          }]
        },
        { model: Usuario, as: 'Usuario', attributes: ['nombres', 'apellidos', 'cedula', 'rol_id'] }
      ]
    });

    if (!atencionEmergencia) {
      // Si no se encuentra una atención de emergencia, crear una nueva instancia
      // con los datos básicos de paciente y admisión.
      // El usuarioId se obtiene del token, que es el médico asignado
      const admision = await Admision.findByPk(admisionId);
      if (!admision) {
        return res.status(404).json({ message: 'Admisión no encontrada.' });
      }

      const paciente = await Paciente.findByPk(admision.pacienteId);
      if (!paciente) {
        return res.status(404).json({ message: 'Paciente no encontrado para la admisión.' });
      }

      // Crear una atención de emergencia "vacía" o inicial
      const nuevaAtencionEmergencia = AtencionEmergencia.build({
        pacienteId: admision.pacienteId,
        admisionId: admisionId,
        usuarioId: req.userId, // El usuario logueado es el médico que está atendiendo
        fechaAtencion: new Date(),
        horaAtencion: new Date().toTimeString().slice(0, 5),
        // Otros campos se inicializarán a null o valores por defecto del modelo
      });

      // Devolver la nueva instancia (no la guardamos en la DB aquí, solo la preparamos para el frontend)
      // El frontend se encargará de guardar cuando el usuario envíe el formulario.
      // Incluir los datos del paciente y admisión para que el frontend los tenga
      const finalNuevaAtencion = {
        ...nuevaAtencionEmergencia.toJSON(),
        Paciente: paciente.toJSON(),
        AdmisionAtencion: admision.toJSON(),
        Usuario: { id: req.userId } // Solo el ID del usuario, los nombres se pueden obtener en el frontend si es necesario
      };
      console.log('Creando nueva atención de emergencia para el formulario:', finalNuevaAtencion);
      return res.status(200).json(finalNuevaAtencion);
    }

    // Parsear los campos JSON antes de enviar la respuesta
    const parsedAtencion = atencionEmergencia.toJSON();
    // No es necesario construir el nombre completo del usuario aquí, ya que el atributo virtual 'nombre_completo' se encarga de ello.

    const finalAtencion = {
      ...parsedAtencion,
      tipoAccidenteViolenciaIntoxicacion: parsedAtencion.tipoAccidenteViolenciaIntoxicacion ? JSON.parse(parsedAtencion.tipoAccidenteViolenciaIntoxicacion) : null,
      antecedentesPatologicos: parsedAtencion.antecedentesPatologicos ? JSON.parse(parsedAtencion.antecedentesPatologicos) : null,
      examenFisico: parsedAtencion.examenFisico ? JSON.parse(parsedAtencion.examenFisico) : null,
      embarazoParto: parsedAtencion.embarazoParto ? JSON.parse(parsedAtencion.embarazoParto) : null,
      examenesComplementarios: parsedAtencion.examenesComplementarios ? JSON.parse(parsedAtencion.examenesComplementarios) : null,
      diagnosticosPresuntivos: parsedAtencion.diagnosticosPresuntivos ? JSON.parse(parsedAtencion.diagnosticosPresuntivos) : null,
      diagnosticosDefinitivos: parsedAtencion.diagnosticosDefinitivos ? JSON.parse(parsedAtencion.diagnosticosDefinitivos) : null,
      planTratamiento: parsedAtencion.planTratamiento ? JSON.parse(parsedAtencion.planTratamiento) : null
    };

    res.status(200).json(finalAtencion); // Enviar finalAtencion en lugar de parsedAtencion
  } catch (error) {
    console.error('Error al obtener la atención de emergencia:', error);
    res.status(500).json({ message: 'Error al obtener la atención de emergencia.', error: error.message });
  }
};

exports.getAtencionEmergenciaById = async (req, res) => {
  const { id } = req.params;

  try {
    const atencionEmergencia = await AtencionEmergencia.findByPk(id, {
      include: [
        { 
          model: Paciente, 
          as: 'Paciente', 
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion', 'fecha_nacimiento', 'sexo'] 
        },
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision']
        },
        { 
          model: Usuario, 
          as: 'Usuario', 
          attributes: ['id', 'nombres', 'apellidos', 'cedula', 'rol_id'] 
        }
      ]
    });

    if (!atencionEmergencia) {
      return res.status(404).json({ message: 'Atención de emergencia no encontrada.' });
    }

    // Parsear los campos JSON antes de enviar la respuesta
    const parsedAtencion = atencionEmergencia.toJSON();

    const finalAtencion = {
      ...parsedAtencion,
      tipoAccidenteViolenciaIntoxicacion: parsedAtencion.tipoAccidenteViolenciaIntoxicacion ? JSON.parse(parsedAtencion.tipoAccidenteViolenciaIntoxicacion) : null,
      antecedentesPatologicos: parsedAtencion.antecedentesPatologicos ? JSON.parse(parsedAtencion.antecedentesPatologicos) : null,
      examenFisico: parsedAtencion.examenFisico ? JSON.parse(parsedAtencion.examenFisico) : null,
      embarazoParto: parsedAtencion.embarazoParto ? JSON.parse(parsedAtencion.embarazoParto) : null,
      examenesComplementarios: parsedAtencion.examenesComplementarios ? JSON.parse(parsedAtencion.examenesComplementarios) : null,
      diagnosticosPresuntivos: parsedAtencion.diagnosticosPresuntivos ? JSON.parse(parsedAtencion.diagnosticosPresuntivos) : null,
      diagnosticosDefinitivos: parsedAtencion.diagnosticosDefinitivos ? JSON.parse(parsedAtencion.diagnosticosDefinitivos) : null,
      planTratamiento: parsedAtencion.planTratamiento ? JSON.parse(parsedAtencion.planTratamiento) : null
    };

    res.status(200).json(finalAtencion);
  } catch (error) {
    console.error('Error al obtener la atención de emergencia por ID:', error);
    res.status(500).json({ message: 'Error al obtener la atención de emergencia.', error: error.message });
  }
};

exports.getAllAtencionesEmergencia = async (req, res) => {
  try {
    console.log('[getAllAtencionesEmergencia] Iniciando búsqueda de atenciones...');
    
    // Extraer parámetros de ordenamiento de la query
    const sortField = req.query.sortField || 'fechaAtencion';
    const sortOrder = req.query.sortOrder || 'DESC';
    
    // Validar que sortField sea un campo válido
    const camposValidos = ['fechaAtencion', 'horaAtencion', 'createdAt', 'id'];
    const campoOrdenamiento = camposValidos.includes(sortField) ? sortField : 'fechaAtencion';
    const ordenValido = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    console.log('[getAllAtencionesEmergencia] Parámetros de ordenamiento:', { campoOrdenamiento, ordenValido });
    
    const atenciones = await AtencionEmergencia.findAll({
      include: [
        { model: Paciente, as: 'Paciente', attributes: ['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion'] },
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision'], // Eliminar 'triaje' de aquí
          include: [
            {
              model: AtencionPacienteEstado,
              as: 'EstadosAtencion',
              attributes: ['estado_id', 'fechaFinAtencion', 'createdAt', 'usuarioResponsableId'], // Incluir usuarioResponsableId
              include: [{
                model: CatEstadoPaciente,
                as: 'Estado',
                attributes: ['nombre']
              }],
              where: {
                createdAt: {
                  [Op.eq]: sequelize.literal(`(
                    SELECT MAX(T2.createdAt)
                    FROM ATENCION_PACIENTE_ESTADO AS T2
                    WHERE T2.admisionId = AdmisionAtencion.id
                  )`)
                }
              },
              required: true, // Asegurar que solo se traigan admisiones con un estado de atención
            },
            {
              model: CatEstadoPaciente,
              as: 'EstadoPaciente',
              attributes: ['nombre'] // Incluir el nombre real del estado del paciente
            },
            {
              model: CatTriaje,
              as: 'TriajePreliminar', // Incluir la asociación para triaje preliminar
              attributes: ['nombre'] // Seleccionar el nombre del triaje
            },
            {
              model: CatTriaje,
              as: 'TriajeDefinitivo', // Incluir la asociación para triaje definitivo
              attributes: ['nombre'] // Seleccionar el nombre del triaje
            }
          ]
        },
        { model: Usuario, as: 'Usuario', attributes: ['nombres', 'apellidos', 'rol_id'] }
      ],
      where: {
        '$AdmisionAtencion.EstadosAtencion.Estado.nombre$': { // Acceder al nombre del estado a través de la asociación del último estado
          [Op.notIn]: ['ALTA_VOLUNTARIA', 'DADO_ALTA', 'FALLECIDO'] // Excluir estados finalizados
        }
      },
      order: [
        [campoOrdenamiento, ordenValido], // Aplicar ordenamiento dinámico
        ['fechaAtencion', 'DESC'],
        ['horaAtencion', 'DESC']
      ]
    });
    console.log('[getAllAtencionesEmergencia] Atenciones recuperadas (raw):', JSON.stringify(atenciones, null, 2));

    // Parsear los campos JSON para cada atención
    const parsedAtenciones = atenciones.map(atencion => {
      const atencionJson = atencion.toJSON();
      const ultimoEstadoAtencion = atencionJson.AdmisionAtencion.EstadosAtencion[0]; // Ya es el último por la subconsulta
      const estadoActualNombre = ultimoEstadoAtencion && ultimoEstadoAtencion.Estado ? ultimoEstadoAtencion.Estado.nombre : null;

      // Añadir el estado_paciente directamente al objeto de atención desde la asociación
      atencionJson.estado_paciente = atencionJson.AdmisionAtencion?.EstadoPaciente?.nombre || null;

      // Añadir el estado_atencion y fechaFinAtencion directamente al objeto de atención
      atencionJson.estado_atencion = estadoActualNombre;
      atencionJson.fechaFinAtencion = ultimoEstadoAtencion?.fechaFinAtencion || null;

      return {
        ...atencionJson,
        tipoAccidenteViolenciaIntoxicacion: atencionJson.tipoAccidenteViolenciaIntoxicacion ? JSON.parse(atencionJson.tipoAccidenteViolenciaIntoxicacion) : null,
        antecedentesPatologicos: atencionJson.antecedentesPatologicos ? JSON.parse(atencionJson.antecedentesPatologicos) : null,
        examenFisico: atencionJson.examenFisico ? JSON.parse(atencionJson.examenFisico) : null,
        embarazoParto: atencionJson.embarazoParto ? JSON.parse(atencionJson.embarazoParto) : null,
        examenesComplementarios: atencionJson.examenesComplementarios ? JSON.parse(atencionJson.examenesComplementarios) : null,
        diagnosticosPresuntivos: atencionJson.diagnosticosPresuntivos ? JSON.parse(atencionJson.diagnosticosPresuntivos) : null,
        diagnosticosDefinitivos: atencionJson.diagnosticosDefinitivos ? JSON.parse(atencionJson.diagnosticosDefinitivos) : null,
        planTratamiento: atencionJson.planTratamiento ? JSON.parse(atencionJson.planTratamiento) : null
      };
    });
    console.log('[getAllAtencionesEmergencia] Atenciones recuperadas (parsed):', JSON.stringify(parsedAtenciones, null, 2));

    res.status(200).json(parsedAtenciones);
  } catch (error) {
    console.error('Error al obtener todas las atenciones de emergencia:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error al obtener todas las atenciones de emergencia.', error: error.message });
  }
};

exports.updateAtencionEmergencia = async (req, res) => {
  const { id } = req.params;
  const {
    fechaAtencion,
    horaAtencion,
    condicionLlegada,
    motivoAtencion,
    fechaEvento,
    horaEvento,
    lugarEvento,
    direccionEvento,
    custodiaPolicial,
    notificacion,
    tipoAccidenteViolenciaIntoxicacion,
    observacionesAccidente,
    sugestivoAlientoAlcoholico,
    antecedentesPatologicos,
    enfermedadProblemaActual,
    examenFisico,
    examenFisicoTraumaCritico,
    embarazoParto,
    examenesComplementarios,
    diagnosticosPresuntivos,
    diagnosticosDefinitivos,
    planTratamiento,
    observacionesPlanTratamiento,
    condicionEgreso,
    referenciaEgreso,
    establecimientoEgreso
  } = req.body;

  try {
    const atencionEmergencia = await AtencionEmergencia.findByPk(id);
    if (!atencionEmergencia) {
      return res.status(404).json({ message: 'Registro de atención de emergencia no encontrado.' });
    }

    // Validación: Si se proporciona fechaAtencion y horaAtencion, validar que no sean mayores a la fecha/hora actual
    if (fechaAtencion && horaAtencion) {
      const fechaHoraAtencion = new Date(`${fechaAtencion}T${horaAtencion}`);
      const ahora = new Date();
      
      if (fechaHoraAtencion > ahora) {
        return res.status(400).json({ 
          message: 'La fecha y hora de atención no pueden ser mayores a la fecha y hora actual del servidor.',
          error: 'VALIDACION_FECHA_HORA_FUTURA'
        });
      }
    }

    // Actualizar solo los campos que se proporcionan en el body
    atencionEmergencia.fechaAtencion = fechaAtencion || atencionEmergencia.fechaAtencion;
    atencionEmergencia.horaAtencion = horaAtencion || atencionEmergencia.horaAtencion;
    atencionEmergencia.condicionLlegada = condicionLlegada || atencionEmergencia.condicionLlegada;
    atencionEmergencia.motivoAtencion = motivoAtencion !== undefined ? motivoAtencion : atencionEmergencia.motivoAtencion;
    atencionEmergencia.fechaEvento = fechaEvento !== undefined ? fechaEvento : atencionEmergencia.fechaEvento;
    atencionEmergencia.horaEvento = horaEvento !== undefined ? horaEvento : atencionEmergencia.horaEvento;
    atencionEmergencia.lugarEvento = lugarEvento !== undefined ? lugarEvento : atencionEmergencia.lugarEvento;
    atencionEmergencia.direccionEvento = direccionEvento !== undefined ? direccionEvento : atencionEmergencia.direccionEvento;
    atencionEmergencia.custodiaPolicial = custodiaPolicial !== undefined ? custodiaPolicial : atencionEmergencia.custodiaPolicial;
    atencionEmergencia.notificacion = notificacion !== undefined ? notificacion : atencionEmergencia.notificacion;
    atencionEmergencia.tipoAccidenteViolenciaIntoxicacion = tipoAccidenteViolenciaIntoxicacion !== undefined ? JSON.stringify(tipoAccidenteViolenciaIntoxicacion) : atencionEmergencia.tipoAccidenteViolenciaIntoxicacion;
    atencionEmergencia.observacionesAccidente = observacionesAccidente !== undefined ? observacionesAccidente : atencionEmergencia.observacionesAccidente;
    atencionEmergencia.sugestivoAlientoAlcoholico = sugestivoAlientoAlcoholico !== undefined ? sugestivoAlientoAlcoholico : atencionEmergencia.sugestivoAlientoAlcoholico;
    atencionEmergencia.antecedentesPatologicos = antecedentesPatologicos !== undefined ? JSON.stringify(antecedentesPatologicos) : atencionEmergencia.antecedentesPatologicos;
    atencionEmergencia.enfermedadProblemaActual = enfermedadProblemaActual !== undefined ? enfermedadProblemaActual : atencionEmergencia.enfermedadProblemaActual;
    atencionEmergencia.examenFisico = examenFisico !== undefined ? JSON.stringify(examenFisico) : atencionEmergencia.examenFisico;
    atencionEmergencia.examenFisicoTraumaCritico = examenFisicoTraumaCritico !== undefined ? examenFisicoTraumaCritico : atencionEmergencia.examenFisicoTraumaCritico;
    atencionEmergencia.embarazoParto = embarazoParto !== undefined ? JSON.stringify(embarazoParto) : atencionEmergencia.embarazoParto;
    atencionEmergencia.examenesComplementarios = examenesComplementarios !== undefined ? JSON.stringify(examenesComplementarios) : atencionEmergencia.examenesComplementarios;
    atencionEmergencia.diagnosticosPresuntivos = diagnosticosPresuntivos !== undefined ? JSON.stringify(diagnosticosPresuntivos) : atencionEmergencia.diagnosticosPresuntivos;
    atencionEmergencia.diagnosticosDefinitivos = diagnosticosDefinitivos !== undefined ? JSON.stringify(diagnosticosDefinitivos) : atencionEmergencia.diagnosticosDefinitivos;
    atencionEmergencia.planTratamiento = planTratamiento !== undefined ? JSON.stringify(planTratamiento) : atencionEmergencia.planTratamiento;
    atencionEmergencia.observacionesPlanTratamiento = observacionesPlanTratamiento !== undefined ? observacionesPlanTratamiento : atencionEmergencia.observacionesPlanTratamiento;
    atencionEmergencia.condicionEgreso = condicionEgreso !== undefined ? condicionEgreso : atencionEmergencia.condicionEgreso;
    atencionEmergencia.referenciaEgreso = referenciaEgreso !== undefined ? referenciaEgreso : atencionEmergencia.referenciaEgreso;
    atencionEmergencia.establecimientoEgreso = establecimientoEgreso !== undefined ? establecimientoEgreso : atencionEmergencia.establecimientoEgreso;

    await atencionEmergencia.save();

    // Si se proporciona una condición de egreso, significa que la atención ha finalizado
    if (condicionEgreso !== undefined && atencionEmergencia.admisionId) {
      // Se asume que req.rolId está disponible desde el middleware de autenticación
      const admisionParaEstado = await Admision.findByPk(atencionEmergencia.admisionId);
      if (admisionParaEstado) {
        await createOrUpdateAtencionPacienteEstado(admisionParaEstado, 'ATENDIDO', atencionEmergencia.usuarioId, req.rolId, atencionEmergencia.usuarioId, null, t);
        console.log(`Estado de atención del paciente ${atencionEmergencia.admisionId} actualizado a ATENDIDO.`);
      }
    }

    // Actualizar fecha_ultima_actividad en la admisión
    const admision = await Admision.findByPk(atencionEmergencia.admisionId);
    if (admision) {
      await admision.update({ fecha_ultima_actividad: new Date() });
      console.log(`Fecha de última actividad para admisión ${atencionEmergencia.admisionId} actualizada.`);
    }

    res.status(200).json(atencionEmergencia);
  } catch (error) {
    console.error('Error al actualizar la atención de emergencia:', error);
    res.status(500).json({ message: 'Error al actualizar la atención de emergencia.', error: error.message });
  }
};

exports.getHistorialAtencionesByPaciente = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    const historialAtenciones = await AtencionEmergencia.findAll({
      where: { pacienteId },
      include: [
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision'], // Eliminar 'triaje' de aquí
          include: [
            {
              model: CatEstadoPaciente,
              as: 'EstadoPaciente',
              attributes: ['nombre']
            },
            {
              model: CatTriaje,
              as: 'TriajePreliminar', // Incluir la asociación para triaje preliminar
              attributes: ['nombre'] // Seleccionar el nombre del triaje
            },
            {
              model: CatTriaje,
              as: 'TriajeDefinitivo', // Incluir la asociación para triaje definitivo
              attributes: ['nombre'] // Seleccionar el nombre del triaje
            }
          ]
        },
        { model: Usuario, as: 'Usuario', attributes: ['nombres', 'apellidos', 'rol_id'] }
      ],
      order: [['fechaAtencion', 'DESC'], ['horaAtencion', 'DESC']]
    });

    const parsedHistorial = historialAtenciones.map(atencion => {
      const atencionJson = atencion.toJSON();
      // No es necesario construir el nombre completo del usuario aquí, ya que el atributo virtual 'nombre_completo' se encarga de ello.

      return {
        ...atencionJson,
        tipoAccidenteViolenciaIntoxicacion: atencionJson.tipoAccidenteViolenciaIntoxicacion ? JSON.parse(atencionJson.tipoAccidenteViolenciaIntoxicacion) : null,
        antecedentesPatologicos: atencionJson.antecedentesPatologicos ? JSON.parse(atencionJson.antecedentesPatologicos) : null,
        examenFisico: atencionJson.examenFisico ? JSON.parse(atencionJson.examenFisico) : null,
        embarazoParto: atencionJson.embarazoParto ? JSON.parse(atencionJson.embarazoParto) : null,
        examenesComplementarios: atencionJson.examenesComplementarios ? JSON.parse(atencionJson.examenesComplementarios) : null,
        diagnosticosPresuntivos: atencionJson.diagnosticosPresuntivos ? JSON.parse(atencionJson.diagnosticosPresuntivos) : null,
        diagnosticosDefinitivos: atencionJson.diagnosticosDefinitivos ? JSON.parse(atencionJson.diagnosticosDefinitivos) : null,
        planTratamiento: atencionJson.planTratamiento ? JSON.parse(atencionJson.planTratamiento) : null
      };
    });

    res.status(200).json(parsedHistorial);
  } catch (error) {
    console.error('Error al obtener el historial de atenciones de emergencia por paciente:', error);
    res.status(500).json({ message: 'Error al obtener el historial de atenciones de emergencia.', error: error.message });
  }
};

exports.deleteAtencionEmergencia = async (req, res) => {
  const { id } = req.params;

  try {
    const atencionEmergencia = await AtencionEmergencia.findByPk(id);
    if (!atencionEmergencia) {
      return res.status(404).json({ message: 'Registro de atención de emergencia no encontrado.' });
    }

    await atencionEmergencia.destroy();
    res.status(204).json({ message: 'Registro de atención de emergencia eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar el registro de atención de emergencia:', error);
    res.status(500).json({ message: 'Error al eliminar el registro de atención de emergencia.' });
  }
};

exports.getAtencionEstados = async (req, res) => {
  try {
    const estados = await CatEstadoPaciente.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    const formattedEstados = estados.map(estado => ({
      id: estado.id,
      nombre: estado.nombre
    }));

    res.status(200).json(formattedEstados);
  } catch (error) {
    console.error('Error al obtener los estados de atención:', error);
    res.status(500).json({ message: 'Error al obtener los estados de atención.', error: error.message });
  }
};