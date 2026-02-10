const cron = require('node-cron');
const { Op } = require('sequelize');
const Admision = require('../models/admisiones');
const SignosVitales = require('../models/signos_vitales');
const CumplimientoProcedimientos = require('../models/cumplimientoProcedimientos'); // Reemplazar ProcedimientoEmergencia por CumplimientoProcedimientos
const AtencionPacienteEstado = require('../models/atencionPacienteEstado'); // Importar el modelo AtencionPacienteEstado
const CatEstadoPaciente = require('../models/cat_estado_paciente'); // Importar el modelo CatEstadoPaciente
const moment = require('moment-timezone'); // Importar moment-timezone
const CatTriaje = require('../models/cat_triaje'); // Importar el modelo CatTriaje
const Usuario = require('../models/usuario'); // Importar el modelo Usuario
const Rol = require('../models/rol'); // Importar el modelo Rol
const { createOrUpdateAtencionPacienteEstado } = require('../controllers/atencionPacienteEstadoController'); // Importar la función unificada

const startPatientStatusCheck = () => {
  console.log('DEBUG: startPatientStatusCheck() ha sido llamada.'); // Nuevo log para confirmar la llamada

  let systemUserId = null;
  let systemRoleId = null;

  const initializeSystemUser = async () => {
    try {
      const adminRole = await Rol.findOne({ where: { nombre: 'Administrador' } }); // Cambiado de 'ADMIN' a 'Administrador'
      if (adminRole) {
        const systemUser = await Usuario.findOne({ where: { rol_id: adminRole.id } }); // Corregido a rol_id
        if (systemUser) {
          systemUserId = systemUser.id;
          systemRoleId = adminRole.id;
          console.log(`[checkPatientStatus] Usuario de sistema encontrado: ID ${systemUserId}, Rol ID ${systemRoleId}`);
        } else {
          console.warn('[checkPatientStatus] No se encontró ningún usuario con el rol Administrador. Las acciones automáticas del sistema podrían fallar.');
        }
      } else {
        console.warn('[checkPatientStatus] Rol "Administrador" no encontrado en la base de datos. Las acciones automáticas del sistema podrían fallar.');
      }
    } catch (error) {
      console.error('Error al inicializar el usuario de sistema:', error);
    }
  };

  // Inicializar el usuario de sistema al inicio
  initializeSystemUser();

  // Definir los tiempos de espera en milisegundos
  const TIEMPOS_ESPERA_TRIAJE = {
    'Rojo': 0, // Atención inmediata
    'Naranja': 15 * 60 * 1000, // 15 minutos
    'Amarillo': 60 * 60 * 1000, // 60 minutos
    'Verde': 2 * 60 * 60 * 1000, // 2 horas
    'Azul': 4 * 60 * 60 * 1000, // 4 horas
  };

  // Función principal de la tarea cron
  cron.schedule('*/5 * * * *', async () => { // Programar cada 5 minutos, ajustar según necesidad
    console.log('--- INICIANDO TAREA CRON: Verificación de estado de pacientes y alertas de triaje ---');
    try {
      const ahora = moment.utc(); // Usar UTC para consistencia con la base de datos

      // Obtener IDs de estados de paciente
      const estadoIds = {};
      const estadosNombres = ['ADMITIDO', 'SIGNOS_VITALES', 'EN_ATENCION', 'PROCEDIMIENTOS', 'HOSPITALIZADO', 'ALTA_PETICION', 'ALTA_VOLUNTARIA', 'ALTA_MEDICA', 'FALLECIDO', 'ATENCION_INCOMPLETA'];
      for (const nombre of estadosNombres) {
        const estado = await CatEstadoPaciente.findOne({ where: { nombre } });
        if (estado) {
          estadoIds[nombre] = estado.id;
        } else {
          console.warn(`[checkPatientStatus] Estado "${nombre}" no encontrado en el catálogo.`);
        }
      }

      // Obtener todas las admisiones que no están en estados finales y su último estado de atención
      const admisionesActivasConUltimoEstado = await Admision.findAll({
        where: {
          estado_paciente_id: {
            [Op.notIn]: [estadoIds.ALTA_VOLUNTARIA, estadoIds.ALTA_MEDICA, estadoIds.FALLECIDO, estadoIds.ATENCION_INCOMPLETA].filter(Boolean)
          }
        },
        include: [
          {
            model: AtencionPacienteEstado,
            as: 'EstadosAtencion',
            where: {
              createdAt: {
                [Op.in]: AtencionPacienteEstado.sequelize.literal(`(
                  SELECT MAX(createdAt)
                  FROM ATENCION_PACIENTE_ESTADO AS T2
                  WHERE T2.admisionId = Admision.id
                )`)
              }
            },
            include: [{
              model: CatEstadoPaciente,
              as: 'Estado',
              attributes: ['nombre']
            }],
            required: true
          },
          {
            model: SignosVitales,
            as: 'SignosVitales', // Corregido: el alias debe ser 'SignosVitales' para coincidir con la asociación del modelo
            order: [['fecha_hora_registro', 'DESC']],
            limit: 1,
            required: false // LEFT JOIN
          },
          {
            model: CumplimientoProcedimientos,
            as: 'CumplimientosProcedimientos', // Usar CumplimientosProcedimientos en lugar de ProcedimientosEmergencia
            required: false // LEFT JOIN
          },
          {
            model: CatTriaje,
            as: 'TriajeDefinitivo',
            attributes: ['nombre', 'color'],
            required: false // LEFT JOIN
          }
        ]
      });

      for (const admision of admisionesActivasConUltimoEstado) {
        const ultimoEstado = admision.EstadosAtencion[0];
        if (!ultimoEstado) {
          console.warn(`[CRON] Admisión ID: ${admision.id} no tiene un último estado de atención. Saltando.`);
          continue;
        }

        const ultimoEstadoNombre = ultimoEstado.Estado.nombre;
        const fechaUltimoEstado = moment(ultimoEstado.createdAt).utc();
        const tiempoDesdeUltimoEstado = ahora.diff(fechaUltimoEstado); // Diferencia en milisegundos
        
        // Obtener fecha_ultima_actividad de la admisión (si existe)
        const fechaUltimaActividad = admision.fecha_ultima_actividad 
          ? moment(admision.fecha_ultima_actividad).utc() 
          : fechaUltimoEstado;
        const tiempoDesdeUltimaActividad = ahora.diff(fechaUltimaActividad); // Diferencia en milisegundos
        
        // ============================================
        // LÓGICA DE CIERRE AUTOMÁTICO (24 HORAS)
        // ============================================
        // Si pasan > 24 horas sin actividad, cambiar a ALTA_VOLUNTARIA
        const horas24 = 24 * 60 * 60 * 1000;
        
        // Lógica para pacientes admitidos sin actividad (sin SV ni procedimientos) por más de 24 horas
        if (ultimoEstadoNombre === 'ADMITIDO' && tiempoDesdeUltimaActividad >= horas24) {
          const signosVitalesCount = admision.SignosVitales ? admision.SignosVitales.length : 0;
          const procedimientosCount = admision.CumplimientosProcedimientos ? admision.CumplimientosProcedimientos.length : 0;

          if (signosVitalesCount === 0 && procedimientosCount === 0) {
            if (systemUserId && systemRoleId) {
              const observacionCierre = 'Cierre automático por inactividad (sin SV ni procedimientos).';
              await createOrUpdateAtencionPacienteEstado(admision, 'ALTA_VOLUNTARIA', systemUserId, systemRoleId, null, observacionCierre);
              await admision.update({
                estado_paciente_id: (await CatEstadoPaciente.findOne({ where: { nombre: 'ALTA_VOLUNTARIA' } })).id,
                fecha_hora_retiro: ahora.toDate(),
                alerta_triaje_activa: false,
                fecha_hora_ultima_alerta_triaje: null,
                observacion_cierre: observacionCierre
              });
              console.log(`[CRON] Paciente con Admisión ID: ${admision.id} marcado como ALTA_VOLUNTARIA por inactividad (sin SV/procedimientos).`);
            } else {
              console.warn(`[CRON] No se pudo registrar ALTA_VOLUNTARIA para Admisión ID: ${admision.id}. Usuario de sistema no disponible.`);
            }
          }
        }
        // Lógica para pacientes en estado 'PROCEDIMIENTOS' sin actividad por más de 24 horas
        else if (ultimoEstadoNombre === 'PROCEDIMIENTOS' && tiempoDesdeUltimaActividad >= horas24) {
          if (systemUserId && systemRoleId) {
            const observacionCierre = 'Cierre automático por inactividad (estado PROCEDIMIENTOS > 24h).';
            await createOrUpdateAtencionPacienteEstado(admision, 'ALTA_VOLUNTARIA', systemUserId, systemRoleId, null, observacionCierre);
            await admision.update({
              estado_paciente_id: (await CatEstadoPaciente.findOne({ where: { nombre: 'ALTA_VOLUNTARIA' } })).id,
              fecha_hora_retiro: ahora.toDate(),
              observacion_cierre: observacionCierre
            });
            console.log(`[CRON] Paciente con Admisión ID: ${admision.id} marcado como ALTA_VOLUNTARIA desde PROCEDIMIENTOS.`);
          } else {
            console.warn(`[CRON] No se pudo registrar ALTA_VOLUNTARIA para Admisión ID: ${admision.id}. Usuario de sistema no disponible.`);
          }
        }
        // Lógica para pacientes en estado 'SIGNOS_VITALES' que no son atendidos en 24 horas
        else if (ultimoEstadoNombre === 'SIGNOS_VITALES' && tiempoDesdeUltimaActividad >= horas24) {
          if (systemUserId && systemRoleId) {
            const observacionCierre = 'Cierre automático por inactividad (estado SIGNOS_VITALES > 24h).';
            await createOrUpdateAtencionPacienteEstado(admision, 'ALTA_VOLUNTARIA', systemUserId, systemRoleId, null, observacionCierre);
            await admision.update({
              estado_paciente_id: (await CatEstadoPaciente.findOne({ where: { nombre: 'ALTA_VOLUNTARIA' } })).id,
              fecha_hora_retiro: ahora.toDate(),
              observacion_cierre: observacionCierre
            });
            console.log(`[CRON] Paciente con Admisión ID: ${admision.id} marcado como ALTA_VOLUNTARIA desde SIGNOS_VITALES.`);
          } else {
            console.warn(`[CRON] No se pudo registrar ALTA_VOLUNTARIA para Admisión ID: ${admision.id}. Usuario de sistema no disponible.`);
          }
        }
        // Lógica para pacientes en estado 'EN_ATENCION' cuya atención no finaliza en 24 horas
        else if (ultimoEstadoNombre === 'EN_ATENCION' && tiempoDesdeUltimoEstado >= 24 * 60 * 60 * 1000) {
          if (systemUserId && systemRoleId) {
            await createOrUpdateAtencionPacienteEstado(admision, 'ATENCION_INCOMPLETA', systemUserId, systemRoleId, null, 'Atención incompleta automática por inactividad (estado EN_ATENCION > 24h).');
            console.log(`[CRON] Paciente con Admisión ID: ${admision.id} marcado como ATENCION_INCOMPLETA desde EN_ATENCION.`);
          } else {
            console.warn(`[CRON] No se pudo registrar ATENCION_INCOMPLETA para Admisión ID: ${admision.id}. Usuario de sistema no disponible.`);
          }
        }

        // --- Lógica para desactivar alertas de triaje para pacientes no activos (basado en AtencionPacienteEstado) ---
        // Esta lógica se mantiene similar, pero ahora se basa en el `ultimoEstadoNombre`
        const estadosNoActivosParaAlerta = ['ALTA_VOLUNTARIA', 'ALTA_MEDICA', 'FALLECIDO', 'ATENCION_INCOMPLETA'];
        if (estadosNoActivosParaAlerta.includes(ultimoEstadoNombre)) {
          if (admision.alerta_triaje_activa) {
            await admision.update(
              {
                alerta_triaje_activa: false,
                fecha_hora_ultima_alerta_triaje: null,
              }
            );
            console.log(`Alertas de triaje desactivadas para Admisión ID: ${admision.id} (estado: ${ultimoEstadoNombre}).`);
          }
        } else {
          // --- Nueva lógica para alertas de triaje (solo para pacientes activos según AtencionPacienteEstado) ---
          if (admision.TriajeDefinitivo && admision.TriajeDefinitivo.nombre) {
            const triajeNombre = admision.TriajeDefinitivo.nombre;
            const tiempoLimiteMs = TIEMPOS_ESPERA_TRIAJE[triajeNombre];

            const ultimoSignoVital = admision.SignosVitales && admision.SignosVitales.length > 0 ? admision.SignosVitales[0] : null;

            if (!ultimoSignoVital) {
              console.log(`[checkPatientStatus] Admisión ${admision.id}: No hay signos vitales registrados. No se genera alerta de triaje.`);
              if (admision.alerta_triaje_activa) {
                await admision.update({
                  alerta_triaje_activa: false,
                  fecha_hora_ultima_alerta_triaje: null,
                });
                console.log(`✅ Alerta de triaje desactivada para Admisión ID: ${admision.id} (sin signos vitales).`);
              }
              continue;
            }

            const fechaRegistroSignosVitales = moment(ultimoSignoVital.fecha_hora_registro).tz('America/Guayaquil');
            const tiempoDesdeSignosVitales = ahora.diff(fechaRegistroSignosVitales);

            console.log(`[checkPatientStatus] Admisión ${admision.id}: Triaje: ${triajeNombre}, Tiempo Límite: ${tiempoLimiteMs}ms, Tiempo Desde Signos Vitales: ${tiempoDesdeSignosVitales}ms`);
            console.log(`[checkPatientStatus] Admisión ${admision.id}: Alerta Activa (antes): ${admision.alerta_triaje_activa}`);

            if (tiempoLimiteMs !== undefined) {
              if (tiempoDesdeSignosVitales > tiempoLimiteMs) {
                if (!admision.alerta_triaje_activa || (admision.alerta_triaje_activa && ahora.diff(moment(admision.fecha_hora_ultima_alerta_triaje)) >= 5 * 60 * 1000)) {
                  await admision.update({
                    alerta_triaje_activa: true,
                    fecha_hora_ultima_alerta_triaje: ahora.toDate(),
                  });
                  console.warn(`🚨 ALERTA DE TRIAJE EXCEDIDO para Admisión ID: ${admision.id} (Triaje: ${triajeNombre}). Tiempo transcurrido: ${Math.floor(tiempoDesdeSignosVitales / 60000)} minutos.`);
                }
              } else {
                if (admision.alerta_triaje_activa) {
                  await admision.update({
                    alerta_triaje_activa: false,
                    fecha_hora_ultima_alerta_triaje: null,
                  });
                  console.log(`✅ Alerta de triaje desactivada para Admisión ID: ${admision.id}.`);
                }
              }
              console.log(`[checkPatientStatus] Admisión ${admision.id}: Alerta Activa (después): ${admision.alerta_triaje_activa}`);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error en la tarea programada de verificación de estado de pacientes y alertas de triaje:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Guayaquil" // Ajusta la zona horaria según sea necesario
  });
};

module.exports = startPatientStatusCheck;