const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const AtencionEmergencia = require('../models/atencionEmergencia'); // Importar modelo de Atención Emergencia
const Admision = require('../models/admisiones');
const Paciente = require('../models/pacientes');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol'); // Importar el modelo Rol
const CatEstadoPaciente = require('../models/cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const CatTriaje = require('../models/cat_triaje'); // Importar el modelo CatTriaje
const SignosVitales = require('../models/signos_vitales'); // Importar el modelo SignosVitales para optimización
const { Op } = require('sequelize');
const moment = require('moment-timezone'); // Importar moment para manejo de fechas
const { emitEstadoCambiado } = require('../socket/socketEvents'); // Importar función de eventos Socket.io

exports.getPacientesPorEstadoMedico = async (req, res) => {
  try {
    const { estados } = req.query; // Recibir los estados como un array de strings (ej. "SIGNOS_VITALES,EN_ATENCION,ATENDIDO")
    let estadosArray = [];

    if (estados) {
      estadosArray = estados.split(',');
    } else {
      // Si no se especifican estados, por defecto mostrar SIGNOS_VITALES, EN_ATENCION, ATENDIDO
      estadosArray = ['SIGNOS_VITALES', 'EN_ATENCION', 'ATENDIDO']; // Excluir FALLECIDO y RETIRADO por defecto
    }

    // Obtener momento actual en zona horaria de Ecuador
    const ahora = moment().tz('America/Guayaquil');
    const hace24Horas = ahora.clone().subtract(24, 'hours').toDate();

    // Obtener los IDs de los estados solicitados desde CatEstadoPaciente
    const estadosCat = await CatEstadoPaciente.findAll({
      where: {
        nombre: {
          [Op.in]: estadosArray
        }
      },
      attributes: ['id', 'nombre']
    });
    
    const estadosIds = estadosCat.map(e => e.id);
    const mapaEstados = {};
    estadosCat.forEach(e => mapaEstados[e.id] = e.nombre);

    // [MEJORA] Obtener ID de estado ADMITIDO y IDs de Triaje de Alta Prioridad
    const estadoAdmitido = await CatEstadoPaciente.findOne({ where: { nombre: 'ADMITIDO' } });
    const triajesAltaPrioridad = await CatTriaje.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.in]: ['Rojo', 'Naranja', 'RESUCITACIÓN', 'EMERGENCIA'] } },
          { color: { [Op.in]: ['Rojo', 'Naranja'] } } // Por si acaso se usa la columna color
        ]
      },
      attributes: ['id']
    });
    const triajeAltaIds = triajesAltaPrioridad.map(t => t.id);

    // Construir cláusula WHERE dinámica
    const whereClause = {
      [Op.or]: [
        {
          estado_paciente_id: {
            [Op.in]: estadosIds
          }
        }
      ]
    };

    // Si tenemos el estado ADMITIDO y triajes de alta prioridad, agregamos la condición OR
    if (estadoAdmitido && triajeAltaIds.length > 0) {
      whereClause[Op.or].push({
        estado_paciente_id: estadoAdmitido.id,
        triajeDefinitivoId: {
          [Op.in]: triajeAltaIds
        }
      });
      // Agregar ADMITIDO al mapa de estados para que se muestre correctamente el nombre
      mapaEstados[estadoAdmitido.id] = estadoAdmitido.nombre;
    }

    const admisionesEncontradas = await Admision.findAll({
      where: whereClause,
      attributes: ['id', 'fecha_hora_admision', 'triajeDefinitivoId', 'estado_paciente_id', 'prioridad_enfermeria', 'observacion_escalamiento', 'intentos_llamado', 'fecha_ultima_actividad', 'fecha_actualizacion'], // Usar columnas reales
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion']
        },
        {
          model: CatEstadoPaciente,
          as: 'EstadoPaciente',
          attributes: ['id', 'nombre']
        },
        {
          model: CatTriaje,
          as: 'TriajeDefinitivo',
          attributes: ['nombre', 'color']
        },
        {
          model: SignosVitales,
          as: 'DatosSignosVitales',
          attributes: ['id', 'temperatura', 'presion_arterial', 'frecuencia_cardiaca', 'frecuencia_respiratoria', 'saturacion_oxigeno', 'fecha_hora_registro'],
          required: false,
          order: [['fecha_hora_registro', 'DESC']],
          limit: 1
        }
      ],
      order: [
        ['fecha_hora_admision', 'DESC']
      ]
    });

    // Transformar los resultados para mantener compatibilidad con el frontend
    // El frontend espera una estructura basada en AtencionPacienteEstado
    let finalPacientes = await Promise.all(admisionesEncontradas.map(async (admision) => {
      // Buscar el último registro de AtencionPacienteEstado para obtener usuarioResponsableId y observaciones
      const ultimoEstado = await AtencionPacienteEstado.findOne({
        where: { admisionId: admision.id },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Usuario,
            as: 'UsuarioResponsableAtencion',
            attributes: ['id']
          }
        ]
      });

      const admisionJson = admision.toJSON();
      const nombreEstado = admision.EstadoPaciente ? admision.EstadoPaciente.nombre : (mapaEstados[admision.estado_paciente_id] || 'DESCONOCIDO');
      
      // Estructura simulada de AtencionPacienteEstado para compatibilidad con Frontend
      return {
        id: ultimoEstado ? ultimoEstado.id : null, // ID del registro de estado (puede ser null si no hay historial)
        admisionId: admision.id,
        estado_id: admision.estado_paciente_id, // ID numérico real
        estadoNombre: nombreEstado, // Nombre del estado para facilitar uso en frontend
        usuarioResponsableId: ultimoEstado && ultimoEstado.UsuarioResponsableAtencion ? ultimoEstado.UsuarioResponsableAtencion.id : null,
        observaciones: ultimoEstado ? ultimoEstado.observaciones : null,
        createdAt: ultimoEstado ? ultimoEstado.createdAt : admision.fecha_ultima_actividad || admision.fecha_hora_admision, // Fecha del estado
        Admision: admisionJson, // El frontend espera 'Admision' o 'AdmisionEstado'
        AdmisionEstado: admisionJson, // Mantener compatibilidad con ambos nombres
        Estado: { nombre: nombreEstado, id: admision.estado_paciente_id } // Objeto Estado real
      };
    }));

    // Filtrar pacientes según la regla de 24 horas para ATENDIDOS
    finalPacientes = finalPacientes.filter(paciente => {
      const estadoActual = paciente.estadoNombre;
      
      if (estadoActual === 'ATENDIDO' && paciente.Admision && paciente.Admision.fecha_hora_admision) {
        const fechaAdmision = moment(paciente.Admision.fecha_hora_admision).tz('America/Guayaquil');
        const horasPasadas = ahora.diff(fechaAdmision, 'hours');
        return horasPasadas < 24;
      }
      return true;
    });

    // Lógica para ordenar con PRIORIDAD DE ENFERMERÍA primero, luego por triaje
    const ordenTriaje = { 'Rojo': 1, 'Naranja': 2, 'Amarillo': 3, 'Verde': 4, 'Azul': 5, 'Gris': 6 };
    finalPacientes.sort((a, b) => {
      // PRIMERO: Ordenar por prioridad de enfermería (los escalados van primero)
      const prioridadA = a.Admision ? a.Admision.prioridad_enfermeria : 0;
      const prioridadB = b.Admision ? b.Admision.prioridad_enfermeria : 0;
      
      if (prioridadB !== prioridadA) {
        return prioridadB - prioridadA; // Los de prioridad 1 van primero (orden descendente)
      }
      
      // SEGUNDO: Ordenar por triaje definitivo
      const triajeA = a.Admision && a.Admision.TriajeDefinitivo ? a.Admision.TriajeDefinitivo.nombre : 'Azul';
      const triajeB = b.Admision && b.Admision.TriajeDefinitivo ? b.Admision.TriajeDefinitivo.nombre : 'Azul';
      
      const triajeOrder = ordenTriaje[triajeA] - ordenTriaje[triajeB];
      if (triajeOrder !== 0) {
        return triajeOrder;
      }
      
      // TERCERO: Por hora de llegada (fecha_hora_admision)
      return new Date(a.Admision.fecha_hora_admision) - new Date(b.Admision.fecha_hora_admision);
    });

    console.log(`[getPacientesPorEstadoMedico] Estados buscados: ${estadosArray.join(', ')}`);
    console.log(`[getPacientesPorEstadoMedico] IDs de estados encontrados: ${estadosIds.join(', ')}`);
    console.log(`[getPacientesPorEstadoMedico] Número de pacientes encontrados: ${finalPacientes.length}`);
    
    res.status(200).json(finalPacientes);
  } catch (error) {
    console.error('Error al obtener pacientes por estado para médicos:', error);
    res.status(500).json({ message: 'Error al obtener pacientes por estado para médicos.', error: error.message });
  }
};

exports.asignarMedicoAPaciente = async (req, res) => {
  console.log('[atencionPacienteEstadoController] Intentando asignar médico a paciente.');
  const { admisionId } = req.params;
  const usuarioResponsableId = req.userId; // El ID del usuario que se asigna

  console.log(`[asignarMedicoAPaciente] admisionId: ${admisionId}, usuarioResponsableId (req.userId): ${usuarioResponsableId}`);

  try {
    // Obtener el último estado de atención para la admisión
    const ultimoAtencionEstado = await AtencionPacienteEstado.findOne({
      where: { admisionId },
      order: [['createdAt', 'DESC']]
    });
    console.log('[asignarMedicoAPaciente] ultimoAtencionEstado encontrado:', ultimoAtencionEstado ? ultimoAtencionEstado.toJSON() : 'null');
    console.log(`[asignarMedicoAPaciente] ultimoAtencionEstado.usuarioResponsableId: ${ultimoAtencionEstado ? ultimoAtencionEstado.usuarioResponsableId : 'N/A'}`);

    if (!ultimoAtencionEstado) {
      return res.status(404).json({ message: 'Estado de atención del paciente no encontrado.' });
    }

    // Obtener la instancia de Admision con TriajeDefinitivo para validar emergencias
    const admision = await Admision.findByPk(admisionId, {
      include: [{ model: CatTriaje, as: 'TriajeDefinitivo' }]
    });
    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // Obtener el nombre del estado actual de la atención
    const ultimoEstadoNombre = ultimoAtencionEstado.Estado ? ultimoAtencionEstado.Estado.nombre : null;

    // Obtener el ID del estado 'EN_ATENCION'
    const enAtencionEstado = await CatEstadoPaciente.findOne({ where: { nombre: 'EN_ATENCION' } });
    if (!enAtencionEstado) {
      return res.status(500).json({ message: 'Estado "EN_ATENCION" no encontrado en el catálogo.' });
    }

    // Si el paciente ya está en atención y asignado a este médico, simplemente devolver éxito
    if (ultimoEstadoNombre === 'EN_ATENCION' && ultimoAtencionEstado.usuarioResponsableId === usuarioResponsableId) {
      console.log('[asignarMedicoAPaciente] Paciente ya está en atención y asignado a este médico. No se requiere acción.');
      return res.status(200).json({ message: 'Paciente ya está en atención y asignado a este médico.', atencionEstado: ultimoAtencionEstado });
    }

    // Obtener el ID del estado 'SIGNOS_VITALES' y 'ADMITIDO'
    const signosVitalesEstado = await CatEstadoPaciente.findOne({ where: { nombre: 'SIGNOS_VITALES' } });
    const admitidoEstado = await CatEstadoPaciente.findOne({ where: { nombre: 'ADMITIDO' } });
    
    if (!signosVitalesEstado) {
      return res.status(500).json({ message: 'Estado "SIGNOS_VITALES" no encontrado en el catálogo.' });
    }

    // Verificar si es una emergencia crítica (RESUCITACIÓN)
    const esResucitacion = admision.TriajeDefinitivo && admision.TriajeDefinitivo.nombre === 'RESUCITACIÓN';
    const esAdmitidoCritico = esResucitacion && admitidoEstado && ultimoAtencionEstado.estado_id === admitidoEstado.id;

    // Si el paciente está en estado SIGNOS_VITALES, o en EN_ATENCION pero no asignado a este médico,
    // o asignado a otro médico, o es ADMITIDO con RESUCITACIÓN, se procede a actualizar el estado.
    if (ultimoAtencionEstado.estado_id === signosVitalesEstado.id ||
        esAdmitidoCritico ||
        (ultimoEstadoNombre === 'EN_ATENCION' && ultimoAtencionEstado.usuarioResponsableId !== usuarioResponsableId)) {
      // Si está asignado a otro médico, devolver conflicto
      if (ultimoAtencionEstado.usuarioResponsableId && ultimoAtencionEstado.usuarioResponsableId !== usuarioResponsableId) {
        console.log('[asignarMedicoAPaciente] Paciente ya ha sido asignado a otro médico.');
        return res.status(409).json({ message: 'Este paciente ya ha sido asignado a otro médico.' });
      }

      // Usar la función createOrUpdateAtencionPacienteEstado para actualizar el estado
      const atencionEstadoActualizado = await exports.createOrUpdateAtencionPacienteEstado(
        admision, // Pasar la instancia de Admision
        'EN_ATENCION', // Pasar el nombre del estado
        req.userId, // El usuario que realiza la acción
        req.rolId, // El rol del usuario que realiza la acción
        usuarioResponsableId, // El usuario que se asigna
        ultimoAtencionEstado.observaciones // Mantener observaciones anteriores si existen
      );
      
      // Resetear prioridad de enfermería al asignar médico (el médico ya está atendiendo el caso escalado)
      if (admision.prioridad_enfermeria === 1) {
        await admision.update({ 
          prioridad_enfermeria: 0,
          // NO limpiar observacion_escalamiento para mantener historial
          fecha_ultima_actividad: new Date()
        });
        console.log('[asignarMedicoAPaciente] Prioridad de enfermería reseteada a 0 (médico asignado).');
      }
      
      console.log('[asignarMedicoAPaciente] Estado de atención del paciente actualizado a EN_ATENCION.');
      return res.status(200).json({ message: 'Paciente asignado exitosamente.', atencionEstado: atencionEstadoActualizado });
    }

    // Si el estado no es SIGNOS_VITALES ni EN_ATENCION, o si ya está en EN_ATENCION y asignado a otro médico
    return res.status(400).json({ message: 'El paciente no está en estado SIGNOS_VITALES (o ADMITIDO/RESUCITACIÓN) o ya ha sido asignado a otro médico.' });
  } catch (error) {
    console.error('Error al asignar médico al paciente:', error);
    res.status(500).json({ message: 'Error al asignar médico al paciente.', error: error.message });
  }
};

exports.actualizarEstadoAtencion = async (req, res) => {
  const { admisionId } = req.params;
  const { estado, observaciones } = req.body;
  const usuarioId = req.userId; // Usuario que realiza la actualización
  const rolId = req.rolId; // Rol del usuario que realiza la actualización

  try {
    // Obtener el último estado de atención para la admisión
    const ultimoAtencionEstado = await AtencionPacienteEstado.findOne({
      where: { admisionId },
      order: [['createdAt', 'DESC']]
    });

    if (!ultimoAtencionEstado) {
      return res.status(404).json({ message: 'Estado de atención del paciente no encontrado.' });
    }

    // Validar que solo el usuario responsable o un admin pueda cambiar el estado
    const usuario = await Usuario.findByPk(usuarioId);
    if (ultimoAtencionEstado.usuarioResponsableId !== usuarioId && usuario.rolId !== 1) { // Asumiendo rolId 1 es admin
      return res.status(403).json({ message: 'No tiene permisos para actualizar el estado de este paciente.' });
    }

    // Obtener el ID del nuevo estado
    const nuevoEstadoCat = await CatEstadoPaciente.findOne({ where: { nombre: estado } });
    if (!nuevoEstadoCat) {
      return res.status(400).json({ message: `El estado "${estado}" no es válido.` });
    }

    // Crear un nuevo registro de estado en lugar de actualizar el existente
    const nuevoEstadoRegistro = await AtencionPacienteEstado.create({
      admisionId,
      estado_id: nuevoEstadoCat.id, // Usar el ID del estado
      usuarioResponsableId: ultimoAtencionEstado.usuarioResponsableId, // Mantener el usuario responsable
      observaciones: observaciones !== undefined ? observaciones : null,
      fechaAsignacion: ultimoAtencionEstado.fechaAsignacion, // Mantener la fecha de asignación original
      fechaFinAtencion: ['ATENDIDO', 'ALTA', 'ALTA_PETICION', 'FALLECIDO', 'ALTA_VOLUNTARIA'].includes(estado) ? new Date() : null,
      usuarioId: usuarioId, // Registrar el ID del usuario que realiza el cambio
      rolId: rolId // Registrar el ID del rol del usuario que realiza el cambio
    });

    res.status(200).json({ message: 'Estado de atención actualizado exitosamente.', atencionEstado: nuevoEstadoRegistro });
  } catch (error) {
    console.error('Error al actualizar el estado de atención:', error);
    res.status(500).json({ message: 'Error al actualizar el estado de atención.', error: error.message });
  }
};

exports.getAtencionPacienteEstado = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const atencionEstado = await AtencionPacienteEstado.findOne({
      where: { admisionId },
      include: [
        {
          model: Admision,
          as: 'AdmisionEstado',
          attributes: ['id', 'fecha_hora_admision', 'triajeDefinitivoId'], // Incluir triajeDefinitivoId
          include: [{
            model: CatTriaje,
            as: 'TriajeDefinitivo',
            attributes: ['nombre', 'color']
          }]
        },
        { model: Usuario, as: 'UsuarioResponsableAtencion', attributes: ['id', 'nombres', 'apellidos'] },
        { model: CatEstadoPaciente, as: 'Estado', attributes: ['nombre'] } // Incluir el nombre del estado
      ]
    });

    if (!atencionEstado) {
      return res.status(404).json({ message: 'Estado de atención del paciente no encontrado.' });
    }

    res.status(200).json(atencionEstado);
  } catch (error) {
    console.error('Error al obtener el estado de atención del paciente:', error);
    res.status(500).json({ message: 'Error al obtener el estado de atención del paciente.' });
  }
};

exports.getHistorialAtencionPaciente = async (req, res) => {
  const { admisionId } = req.params;

  try {
    const historial = await AtencionPacienteEstado.findAll({
      where: { admisionId },
      include: [
        { model: Usuario, as: 'UsuarioResponsableAtencion', attributes: ['id', 'nombres', 'apellidos'] },
        { model: Usuario, as: 'Usuario', attributes: ['id', 'nombres', 'apellidos'] }, // Usuario que realizó el cambio
        { model: Rol, as: 'Rol', attributes: ['nombre'] } // Rol del usuario que realizó el cambio
      ],
      order: [['createdAt', 'ASC']] // Ordenar por fecha de creación ascendente para el historial
    });

    if (!historial || historial.length === 0) {
      return res.status(404).json({ message: 'Historial de atención del paciente no encontrado.' });
    }

    res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener el historial de atención del paciente:', error);
    res.status(500).json({ message: 'Error al obtener el historial de atención del paciente.' });
  }
};

exports.getUltimosLlamados = async (req, res) => {
  try {
    // Buscar estados 'EN_ATENCION' y 'SIGNOS_VITALES'
    const estados = await CatEstadoPaciente.findAll({
      where: { nombre: ['EN_ATENCION', 'SIGNOS_VITALES'] },
      attributes: ['id', 'nombre']
    });
    const estadosIds = estados.map(e => e.id);

    const ultimos = await AtencionPacienteEstado.findAll({
      where: { estado_id: { [Op.in]: estadosIds } },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        {
           model: Admision,
           as: 'AdmisionEstado',
           include: [{ model: Paciente, as: 'Paciente' }]
        },
        { model: CatEstadoPaciente, as: 'Estado' },
        {
           model: Usuario,
           as: 'UsuarioResponsableAtencion',
           include: [{ model: Rol, as: 'Rol' }]
        }
      ]
    });

    const respuesta = ultimos.map(u => {
      const paciente = u.AdmisionEstado?.Paciente;
      const nombrePaciente = paciente
        ? `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim()
        : 'Desconocido';
      
      const area = u.UsuarioResponsableAtencion?.Rol?.nombre || 'Emergencia';
      
      return {
        admisionId: u.admisionId,
        nombrePaciente,
        areaConsultorio: area,
        estadoNuevo: u.Estado?.nombre,
        updatedAt: u.createdAt
      };
    });

    res.status(200).json(respuesta);
  } catch (error) {
    console.error('Error al obtener últimos llamados:', error);
    res.status(500).json({ error: error.message });
  }
};

// Nueva función para crear o actualizar el estado de atención del paciente
exports.createOrUpdateAtencionPacienteEstado = async (admision, estadoNombre, usuarioId, rolId, usuarioResponsableId = undefined, observaciones = undefined, transaction = undefined) => {
  try {
    if (!admision) {
      throw new Error(`Instancia de Admisión no proporcionada.`);
    }

    // Obtener el ID del estado a partir de su nombre
    const estadoCat = await CatEstadoPaciente.findOne({ where: { nombre: estadoNombre }, transaction });
    if (!estadoCat) {
      throw new Error(`Estado "${estadoNombre}" no encontrado en el catálogo.`);
    }

    let rolUsuarioResponsableId = null;
    if (usuarioResponsableId) {
      const usuario = await Usuario.findByPk(usuarioResponsableId, {
        include: [{ model: Rol, as: 'Rol' }],
        transaction
      });
      if (usuario && usuario.Rol) {
        rolUsuarioResponsableId = usuario.Rol.id;
      }
    }

    console.log(`[createOrUpdateAtencionPacienteEstado] Creando nuevo estado para admisionId: ${admision.id}, estado: ${estadoNombre} (ID: ${estadoCat.id})`);
    let finalUsuarioResponsableId = usuarioResponsableId;
    let finalFechaAsignacion = usuarioResponsableId ? new Date() : null;

    if (estadoNombre === 'SIGNOS_VITALES' || estadoNombre === 'ADMITIDO') {
      finalUsuarioResponsableId = null;
      finalFechaAsignacion = null;
      console.log(`[createOrUpdateAtencionPacienteEstado] Creando estado ${estadoNombre}. usuarioResponsableId y fechaAsignacion establecidos a null.`);
    }

    const nuevoEstado = await AtencionPacienteEstado.create({
      admisionId: admision.id,
      estado_id: estadoCat.id, // Usar el ID del estado
      usuarioResponsableId: finalUsuarioResponsableId,
      fechaAsignacion: finalFechaAsignacion,
      observaciones,
      fechaFinAtencion: ['ATENDIDO', 'ALTA', 'ALTA_PETICION', 'FALLECIDO', 'ALTA_VOLUNTARIA'].includes(estadoNombre) ? new Date() : null,
      usuarioId: usuarioId, // Registrar el ID del usuario que realiza el cambio
      rolId: rolId // Registrar el ID del rol del usuario que realiza el cambio
    }, { transaction });
    console.log(`[createOrUpdateAtencionPacienteEstado] Nuevo estado creado. usuarioResponsableId: ${nuevoEstado.usuarioResponsableId}, usuarioId: ${nuevoEstado.usuarioId}, rolId: ${nuevoEstado.rolId}`);

    // Actualizar el estado_paciente_id en la tabla Admision
    admision.estado_paciente_id = estadoCat.id;
    admision.fecha_ultima_actividad = new Date();
    await admision.save({ transaction });
    console.log(`[createOrUpdateAtencionPacienteEstado] Estado de la admisión ${admision.id} actualizado a: ${estadoNombre} (ID: ${estadoCat.id}). Fecha de última actividad actualizada.`);
    
    // Emitir evento Socket.io si el estado es EN_ATENCION o SIGNOS_VITALES
    if (estadoNombre === 'EN_ATENCION' || estadoNombre === 'SIGNOS_VITALES') {
      
      // LOGICA DE CAPTURA DE TIEMPO DE ORO (Golden Hour)
      if (estadoNombre === 'EN_ATENCION') {
        try {
          // Verificar si ya existe registro de atención
          const atencionExistente = await AtencionEmergencia.findOne({
            where: { admisionId: admision.id },
            transaction
          });

          if (!atencionExistente) {
            const ahoraEcuador = moment().tz('America/Guayaquil');
            const fechaAtencion = ahoraEcuador.format('YYYY-MM-DD');
            const horaAtencion = ahoraEcuador.format('HH:mm');

            console.log(`[createOrUpdateAtencionPacienteEstado] Creando registro de Atención Emergencia (Tiempo de Oro): ${fechaAtencion} ${horaAtencion}`);

            await AtencionEmergencia.create({
              admisionId: admision.id,
              pacienteId: admision.pacienteId,
              usuarioId: finalUsuarioResponsableId || usuarioId, // El médico responsable o quien ejecuta la acción
              fechaAtencion: fechaAtencion,
              horaAtencion: horaAtencion,
              condicionLlegada: 'ESTABLE', // Valor por defecto, médico puede cambiarlo
              estadoFirma: 'BORRADOR',
              esValida: true
            }, { transaction });
          } else {
             console.log(`[createOrUpdateAtencionPacienteEstado] Registro de Atención ya existe para admisión ${admision.id}, no se sobrescribe tiempo.`);
          }
        } catch (atencionError) {
          console.error('[createOrUpdateAtencionPacienteEstado] Error al crear registro automático de AtencionEmergencia:', atencionError);
          // No bloqueamos el flujo principal si falla esto, pero es crítico loguearlo
        }
      }

      try {
        // Obtener datos del paciente para el evento
        const paciente = await Paciente.findByPk(admision.pacienteId, { transaction });
        if (paciente) {
          const nombrePaciente = `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim();
          
          // Obtener estado anterior
          const estadoAnterior = await AtencionPacienteEstado.findOne({
            where: { admisionId: admision.id },
            order: [['createdAt', 'DESC']],
            offset: 1, // Obtener el penúltimo estado
            include: [{ model: CatEstadoPaciente, as: 'Estado', attributes: ['nombre'] }],
            transaction
          });
          
          // Obtener área/consultorio (puede venir del usuario responsable o ser "Emergencia" por defecto)
          let areaConsultorio = 'Emergencia';
          if (finalUsuarioResponsableId) {
            const usuarioResponsable = await Usuario.findByPk(finalUsuarioResponsableId, {
              include: [{ model: Rol, as: 'Rol' }],
              transaction
            });
            if (usuarioResponsable && usuarioResponsable.Rol) {
              areaConsultorio = usuarioResponsable.Rol.nombre || 'Emergencia';
            }
          }
          
          emitEstadoCambiado({
            admisionId: admision.id,
            pacienteId: admision.pacienteId,
            nombrePaciente: nombrePaciente,
            estadoAnterior: estadoAnterior?.Estado?.nombre || 'ADMITIDO',
            estadoNuevo: estadoNombre,
            areaConsultorio: areaConsultorio
          });
        }
      } catch (socketError) {
        console.error('[createOrUpdateAtencionPacienteEstado] Error al emitir evento Socket.io:', socketError);
        // No lanzar error, solo loguear para no interrumpir el flujo principal
      }
    }
    
    return nuevoEstado;
  } catch (error) {
    console.error('Error en createOrUpdateAtencionPacienteEstado:', error);
    throw error; // Re-lanzar el error para que sea manejado por el llamador
  }
};