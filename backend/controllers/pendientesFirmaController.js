const { Op } = require('sequelize');
const sequelize = require('../config/database');
const AtencionEmergencia = require('../models/atencionEmergencia');
const Paciente = require('../models/pacientes');
const Admision = require('../models/admisiones');
const Usuario = require('../models/usuario');
const AtencionPacienteEstado = require('../models/atencionPacienteEstado');
const CatMotivoConsultaSintomas = require('../models/cat_motivo_consulta_sintomas');
const CatEstadoPaciente = require('../models/cat_estado_paciente');

/**
 * Obtener todas las atenciones pendientes de firma
 * Médicos: Solo ven sus pendientes (usuario_responsable_id O usuarioId si no hay responsable asignado)
 * Admin: Ve todos los pendientes con filtro opcional por profesional
 */
exports.getPendientesFirma = async (req, res) => {
  try {
    const { medicoId } = req.query; // Filtro opcional para admin
    const userId = req.userId;
    const rolId = req.rolId;

    // Construir condiciones de filtrado
    const whereClause = {
      estadoFirma: { [Op.in]: ['BORRADOR', 'PENDIENTE_FIRMA'] }, // No firmadas aún
      esValida: true
    };

    // Si no es admin (rol 5), solo mostrar sus propias atenciones
    // Incluir atenciones donde el usuario es responsable O donde creó la atención y no hay responsable asignado
    if (rolId !== 5) {
      whereClause[Op.or] = [
        { usuarioResponsableId: userId },
        { 
          usuarioId: userId,
          usuarioResponsableId: null // Atenciones creadas por el médico pero sin responsable asignado aún
        }
      ];
    } else if (medicoId) {
      // Si es admin y se especifica un médico, filtrar por ese médico
      whereClause[Op.or] = [
        { usuarioResponsableId: medicoId },
        { 
          usuarioId: medicoId,
          usuarioResponsableId: null
        }
      ];
    }

    const atenciones = await AtencionEmergencia.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion']
        },
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision'],
          include: [{
            model: CatMotivoConsultaSintomas,
            as: 'MotivoConsultaSintoma',
            attributes: ['Codigo', 'Motivo_Consulta_Sintoma']
          }]
        },
        {
          model: Usuario,
          as: 'Usuario',
          attributes: ['id', 'nombres', 'apellidos']
        },
        {
          model: Usuario,
          as: 'UsuarioResponsable',
          attributes: ['id', 'nombres', 'apellidos']
        }
      ],
      order: [['createdAt', 'ASC']] // Más antiguos primero
    });

    // Calcular horas pendientes y agregar alertas
    const ahora = new Date();
    const atencionesConAlertas = atenciones.map(atencion => {
      const horasPendientes = Math.floor((ahora - new Date(atencion.createdAt)) / (1000 * 60 * 60));
      const alerta24h = horasPendientes >= 24;

      return {
        ...atencion.toJSON(),
        horasPendientes,
        alerta24h
      };
    });

    res.status(200).json(atencionesConAlertas);
  } catch (error) {
    console.error('Error al obtener atenciones pendientes:', error);
    res.status(500).json({ message: 'Error al obtener atenciones pendientes.', error: error.message });
  }
};

/**
 * Obtener datos para pre-llenar el formulario 008
 * Incluye motivo_consulta desde ADMISIONES y historial de SIGNOS_VITALES
 */
exports.getDatosPrellenado = async (req, res) => {
  try {
    const { admisionId } = req.params;

    const admision = await Admision.findByPk(admisionId, {
      include: [{
        model: CatMotivoConsultaSintomas,
        as: 'MotivoConsultaSintoma',
        attributes: ['Codigo', 'Motivo_Consulta_Sintoma', 'Categoria']
      }]
    });

    if (!admision) {
      return res.status(404).json({ message: 'Admisión no encontrada.' });
    }

    // Obtener historial de signos vitales
    const SignosVitales = require('../models/signos_vitales');
    const signosVitales = await SignosVitales.findAll({
      where: { admisionId },
      order: [['fecha_hora_registro', 'DESC']],
      limit: 10 // Últimos 10 registros
    });

    const motivoConsulta = admision.MotivoConsultaSintoma 
      ? admision.MotivoConsultaSintoma.Motivo_Consulta_Sintoma 
      : null;

    res.status(200).json({
      motivoConsulta,
      signosVitales: signosVitales.map(sv => sv.toJSON())
    });
  } catch (error) {
    console.error('Error al obtener datos de pre-llenado:', error);
    res.status(500).json({ message: 'Error al obtener datos de pre-llenado.', error: error.message });
  }
};

/**
 * Obtener atenciones en curso del médico (pendientes de firma)
 * Similar a getPendientesFirma pero optimizado para el dashboard principal
 * Incluye:
 * 1. Atenciones con estadoFirma = 'PENDIENTE'
 * 2. Pacientes en EN_ATENCION asignados al médico (incluso sin atención creada)
 */
exports.getAtencionesEnCurso = async (req, res) => {
  try {
    const userId = req.userId;
    const rolId = req.rolId;

    if (!userId || !rolId) {
      return res.status(400).json({ message: 'Usuario no autenticado correctamente.' });
    }

    console.log(`[getAtencionesEnCurso] Usuario ID: ${userId}, Rol ID: ${rolId}`);

    // 1. Obtener atenciones pendientes (como antes)
    const whereClause = {
      estadoFirma: { [Op.in]: ['BORRADOR', 'PENDIENTE_FIRMA'] }, // No firmadas aún
      esValida: true
    };

    if (rolId !== 5) {
      whereClause[Op.or] = [
        { usuarioResponsableId: userId },
        { 
          usuarioId: userId,
          usuarioResponsableId: null
        }
      ];
    }

    const atencionesPendientes = await AtencionEmergencia.findAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'Paciente',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion'],
          required: true
        },
        {
          model: Admision,
          as: 'AdmisionAtencion',
          attributes: ['id', 'fecha_hora_admision'],
          required: true
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    console.log(`[getAtencionesEnCurso] Atenciones pendientes encontradas: ${atencionesPendientes.length}`);

    // 2. Si es médico (rol 1), también obtener pacientes en EN_ATENCION asignados a él
    let pacientesEnAtencion = [];
    if (rolId === 1) {
      // Obtener el ID del estado EN_ATENCION
      const estadoEnAtencion = await CatEstadoPaciente.findOne({
        where: { nombre: 'EN_ATENCION' }
      });

      if (estadoEnAtencion) {
        // Obtener admisiones con estado EN_ATENCION asignadas a este médico
        // Solo las que NO tienen una atención pendiente ya (para evitar duplicados)
        const admisionIdsConAtencion = atencionesPendientes.map(a => a.admisionId);

        const estadosEnAtencion = await AtencionPacienteEstado.findAll({
          where: {
            estado_id: estadoEnAtencion.id,
            usuarioResponsableId: userId
          },
          include: [
            {
              model: Admision,
              as: 'AdmisionEstado',
              attributes: ['id', 'fecha_hora_admision'],
              include: [{
                model: Paciente,
                as: 'Paciente',
                attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identificacion'],
                required: true
              }],
              required: true
            }
          ],
          order: [['createdAt', 'DESC']]
        });

        // Filtrar solo los estados más recientes por admisión y que no tengan atención pendiente
        const admisionesMap = new Map();
        estadosEnAtencion.forEach(estado => {
          const admisionId = estado.admisionId;
          // Solo incluir si no tiene atención pendiente y es el estado más reciente
          if (!admisionIdsConAtencion.includes(admisionId)) {
            if (!admisionesMap.has(admisionId) || 
                new Date(estado.createdAt) > new Date(admisionesMap.get(admisionId).createdAt)) {
              admisionesMap.set(admisionId, estado);
            }
          }
        });

        // Verificar que cada admisión tenga el estado más reciente (no solo el más reciente de EN_ATENCION)
        for (const [admisionId, estado] of admisionesMap.entries()) {
          const estadoMasReciente = await AtencionPacienteEstado.findOne({
            where: { admisionId },
            order: [['createdAt', 'DESC']]
          });

          // Solo incluir si el estado más reciente es EN_ATENCION y está asignado al médico
          if (estadoMasReciente && 
              estadoMasReciente.estado_id === estadoEnAtencion.id &&
              estadoMasReciente.usuarioResponsableId === userId) {
            pacientesEnAtencion.push({
              id: null, // No tiene atención creada aún
              admisionId: admisionId,
              estadoFirma: null,
              esValida: true,
              createdAt: estado.createdAt,
              updatedAt: estado.updatedAt,
              Paciente: estado.AdmisionEstado.Paciente,
              AdmisionAtencion: estado.AdmisionEstado
            });
          }
        }

        console.log(`[getAtencionesEnCurso] Pacientes en EN_ATENCION sin atención creada: ${pacientesEnAtencion.length}`);
      }
    }

    // 3. Combinar ambos resultados
    const todasLasAtenciones = [
      ...atencionesPendientes.map(a => a.toJSON()),
      ...pacientesEnAtencion
    ];

    // Ordenar por updatedAt descendente y limitar a 10
    todasLasAtenciones.sort((a, b) => {
      const fechaA = new Date(a.updatedAt || a.createdAt);
      const fechaB = new Date(b.updatedAt || b.createdAt);
      return fechaB - fechaA;
    });

    const resultadoFinal = todasLasAtenciones.slice(0, 10);

    console.log(`[getAtencionesEnCurso] Total de atenciones en curso: ${resultadoFinal.length}`);

    res.status(200).json(resultadoFinal);
  } catch (error) {
    console.error('Error al obtener atenciones en curso:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener atenciones en curso.', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = exports;
