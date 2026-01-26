import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-timezone'; // Importar moment-timezone para manejo correcto de zona horaria
import HistorialProcedimientosModal from './HistorialProcedimientosModal'; // Importar el modal de historial
import ConfirmModal from './ConfirmModal'; // Importar modal de confirmación


const ProcedimientoEmergenciaForm = ({ pacienteId, admisionId, onProcedimientoAdded }) => {
  const navigate = useNavigate();
  const [nombreProcedimiento, setNombreProcedimiento] = useState('');
  // Función helper para obtener la fecha/hora actual de Ecuador en formato datetime-local
  // Usa moment-timezone para asegurar que siempre se use la zona horaria de Ecuador
  const getCurrentDateTimeLocal = () => {
    // Obtener la hora actual en zona horaria de Ecuador (America/Guayaquil)
    const ahoraEcuador = moment.tz('America/Guayaquil');
    // Formatear como datetime-local: YYYY-MM-DDTHH:mm
    return ahoraEcuador.format('YYYY-MM-DDTHH:mm');
  };
  const [horaRealizacion, setHoraRealizacion] = useState(getCurrentDateTimeLocal());
  const [horaModificadaManual, setHoraModificadaManual] = useState(false); // Rastrear si el usuario modificó manualmente la hora
  const [horaInvalida, setHoraInvalida] = useState(false); // Rastrear si la hora es inválida según las reglas
  const [mensajeHoraInvalida, setMensajeHoraInvalida] = useState(''); // Mensaje de error para hora inválida
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [procedimientosDisponibles, setProcedimientosDisponibles] = useState([]);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [requiereValoracionMedica, setRequiereValoracionMedica] = useState(false);
  const [observacionEscalamiento, setObservacionEscalamiento] = useState('');
  const [showSignosVitalesModal, setShowSignosVitalesModal] = useState(false);
  const [signosVitalesModalData, setSignosVitalesModalData] = useState(null);
  const [showConfirmacionCriticoModal, setShowConfirmacionCriticoModal] = useState(false); // Modal para confirmar si es crítico/ROJO
  const [admisionIdParaRedireccion, setAdmisionIdParaRedireccion] = useState(null); // Guardar admisionId para redirección
  const [fechaHoraAdmision, setFechaHoraAdmision] = useState(null); // Fecha/hora de admisión del paciente
  const [requiereJustificacionTardio, setRequiereJustificacionTardio] = useState(false); // Si requiere justificación de registro tardío
  const [justificacionRegistroTardio, setJustificacionRegistroTardio] = useState(''); // Justificación del registro tardío
  const [datosProcedimientoPendiente, setDatosProcedimientoPendiente] = useState(null); // Datos del procedimiento pendiente de guardar

  useEffect(() => {
    // OPTIMIZACIÓN: Cachear procedimientos disponibles en localStorage para evitar llamadas repetidas
    const cachedProcedimientos = localStorage.getItem('procedimientos_disponibles');
    const cacheTimestamp = localStorage.getItem('procedimientos_disponibles_timestamp');
    const cacheExpiry = 5 * 60 * 1000; // 5 minutos
    
    if (cachedProcedimientos && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < cacheExpiry) {
      console.log('[ProcedimientoEmergenciaForm] Usando procedimientos desde caché');
      setProcedimientosDisponibles(JSON.parse(cachedProcedimientos));
    } else {
      const fetchProcedimientosDisponibles = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:3001/api/cat-procedimientos-emergencia', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProcedimientosDisponibles(response.data);
          // Guardar en caché
          localStorage.setItem('procedimientos_disponibles', JSON.stringify(response.data));
          localStorage.setItem('procedimientos_disponibles_timestamp', Date.now().toString());
        } catch (err) {
          console.error('Error al obtener procedimientos disponibles:', err);
          setError('Error al cargar la lista de procedimientos disponibles.');
        }
      };
      fetchProcedimientosDisponibles();
    }
  }, []);

  useEffect(() => {
    // OPTIMIZACIÓN: Esta verificación puede hacerse de forma lazy solo cuando se necesite
    // Por ahora, permitimos que el formulario se use y validamos en el submit
    // Esto evita una llamada adicional al cargar la página
    if (admisionId) {
      // Solo verificar si el formulario está deshabilitado por alguna razón previa
      // La validación real se hará al enviar el formulario
      setIsFormDisabled(false);
    }
  }, [admisionId]);

  // Función para validar la hora según las reglas de seguridad clínica
  // Usa moment-timezone para comparar en zona horaria de Ecuador
  const validarHora = (horaString) => {
    if (!horaString) {
      return { valida: false, mensaje: 'La hora es requerida.', requiereJustificacion: false };
    }

    try {
      // Parsear la hora del formato datetime-local (YYYY-MM-DDTHH:mm) como hora local de Ecuador
      const fechaHoraSeleccionada = moment.tz(horaString, 'YYYY-MM-DDTHH:mm', 'America/Guayaquil');
      
      if (!fechaHoraSeleccionada.isValid()) {
        return { valida: false, mensaje: 'Formato de hora inválido.', requiereJustificacion: false };
      }
      
      // Obtener la hora actual en zona horaria de Ecuador
      const fechaHoraActual = moment.tz('America/Guayaquil');
      
      // LÍMITE SUPERIOR: Validar que no sea tiempo futuro
      if (fechaHoraSeleccionada.isAfter(fechaHoraActual)) {
        return { 
          valida: false, 
          mensaje: '⚠️ No se puede seleccionar una hora futura. La hora debe ser igual o anterior a la hora actual.',
          requiereJustificacion: false
        };
      }
      
      // LÍMITE INFERIOR: Validar que no sea anterior a la hora de admisión (solo si está disponible)
      if (fechaHoraAdmision) {
        if (fechaHoraSeleccionada.isBefore(fechaHoraAdmision)) {
          return { 
            valida: false, 
            mensaje: `⚠️ No se puede registrar un procedimiento con hora anterior a la hora de admisión del paciente (${fechaHoraAdmision.format('DD/MM/YYYY HH:mm')}). Nada puede ocurrir antes de que el paciente entre al sistema.`,
            requiereJustificacion: false
          };
        }
        
        // LÍMITE DE RETRASO (6 horas): Calcular tiempo desde admisión y desde procedimiento
        const horasDesdeAdmision = fechaHoraActual.diff(fechaHoraAdmision, 'hours', true);
        const horasDesdeProcedimiento = fechaHoraActual.diff(fechaHoraSeleccionada, 'hours', true);
        
        // Si el paciente lleva más de 6 horas admitido
        if (horasDesdeAdmision > 6) {
          // Solo permitir procedimientos de las últimas 6 horas respecto a la hora actual
          if (horasDesdeProcedimiento > 6) {
            // EXCEPCIÓN: Requiere justificación de registro tardío
            return { 
              valida: true, // Técnicamente válido si tiene justificación
              mensaje: `⚠️ Registro tardío detectado (${horasDesdeProcedimiento.toFixed(1)} horas de antigüedad). Se requiere justificación obligatoria del registro tardío.`,
              requiereJustificacion: true
            };
          }
        } else {
          // Si el paciente lleva menos de 6 horas admitido, aplicar la regla normal de 6 horas
          if (horasDesdeProcedimiento > 6) {
            return { 
              valida: false, 
              mensaje: `⚠️ No se puede registrar un procedimiento con más de 6 horas de antigüedad respecto a la hora actual. El procedimiento tiene ${horasDesdeProcedimiento.toFixed(1)} horas de antigüedad.`,
              requiereJustificacion: false
            };
          }
        }
      } else {
        // Si no hay fecha de admisión disponible, aplicar solo la regla básica de 6 horas
        const horasDesdeProcedimiento = fechaHoraActual.diff(fechaHoraSeleccionada, 'hours', true);
        if (horasDesdeProcedimiento > 6) {
          return { 
            valida: false, 
            mensaje: `⚠️ No se puede registrar un procedimiento con más de 6 horas de antigüedad respecto a la hora actual. El procedimiento tiene ${horasDesdeProcedimiento.toFixed(1)} horas de antigüedad.`,
            requiereJustificacion: false
          };
        }
      }
      
      return { valida: true, mensaje: '', requiereJustificacion: false };
    } catch (error) {
      console.error('[ProcedimientoEmergenciaForm] Error al validar hora:', error);
      return { valida: false, mensaje: 'Formato de hora inválido.', requiereJustificacion: false };
    }
  };

  // Actualizar la hora de realización cada minuto solo si NO fue modificada manualmente
  useEffect(() => {
    if (!horaModificadaManual) {
      // Actualizar inmediatamente al montar
      const horaActual = getCurrentDateTimeLocal();
      setHoraRealizacion(horaActual);
      setHoraInvalida(false);
      setMensajeHoraInvalida('');
      
      // Configurar intervalo para actualizar cada minuto
      const intervalId = setInterval(() => {
        const nuevaHora = getCurrentDateTimeLocal();
        setHoraRealizacion(nuevaHora);
        setHoraInvalida(false);
        setMensajeHoraInvalida('');
      }, 60000); // 60000 ms = 1 minuto
      
      // Limpiar intervalo al desmontar
      return () => clearInterval(intervalId);
    }
  }, [horaModificadaManual]);

  // Validar la hora cada vez que cambia
  useEffect(() => {
    if (horaRealizacion) {
      const validacion = validarHora(horaRealizacion);
      setHoraInvalida(!validacion.valida);
      setMensajeHoraInvalida(validacion.mensaje);
      setRequiereJustificacionTardio(validacion.requiereJustificacion || false);
      // Si no requiere justificación, limpiar el campo
      if (!validacion.requiereJustificacion) {
        setJustificacionRegistroTardio('');
      }
    } else {
      setHoraInvalida(false);
      setMensajeHoraInvalida('');
      setRequiereJustificacionTardio(false);
      setJustificacionRegistroTardio('');
    }
  }, [horaRealizacion, fechaHoraAdmision]);

  const openHistorialModal = () => {
    setIsHistorialModalOpen(true);
  };

  const closeHistorialModal = () => {
    setIsHistorialModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validación de hora antes de continuar
    if (horaInvalida) {
      setError(mensajeHoraInvalida || 'La hora seleccionada no es válida. Por favor, corrija la hora antes de continuar.');
      return;
    }

    // Validación: Si requiere valoración médica, la observación del escalamiento es obligatoria
    if (requiereValoracionMedica && (!observacionEscalamiento || observacionEscalamiento.trim() === '')) {
      setError('La observación del escalamiento es obligatoria cuando se sugiere revisión médica.');
      return;
    }

    // Validación: Si requiere justificación de registro tardío, debe estar completa
    if (requiereJustificacionTardio && (!justificacionRegistroTardio || justificacionRegistroTardio.trim() === '')) {
      setError('⚠️ Se requiere justificación obligatoria del registro tardío. Por favor, complete el campo de justificación en las observaciones.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // USAR SIEMPRE CUMPLIMIENTO_PROCEDIMIENTOS (simplificado)
      const procedimientoSeleccionado = procedimientosDisponibles.find(p => p.nombre === nombreProcedimiento);
      
      if (!procedimientoSeleccionado) {
        setError('Por favor, seleccione un procedimiento del catálogo.');
        return;
      }
      
      // Validar que admisionId exista
      if (!admisionId || admisionId === '' || admisionId === 'undefined') {
        setError('No se encontró una admisión activa para este paciente. Por favor, verifique que el paciente esté admitido.');
        return;
      }
      
      // Enviar la fecha/hora directamente como string del datetime-local
      // El backend lo interpretará como hora local de Ecuador (America/Guayaquil)
      // Formato: "YYYY-MM-DDTHH:mm" (sin conversión a UTC)
      let fechaHoraEnviar;
      
      // Si el usuario NO modificó manualmente la hora, capturar el timestamp exacto del momento de envío
      // Esto asegura que se capture el momento exacto de registro, no la hora del último minuto
      if (!horaModificadaManual) {
        // Capturar el timestamp exacto del momento actual (hora local de Ecuador)
        fechaHoraEnviar = getCurrentDateTimeLocal();
        console.log('[ProcedimientoEmergenciaForm] Hora NO modificada manualmente - Capturando timestamp exacto del momento de envío:', fechaHoraEnviar);
      } else if (horaRealizacion && !horaInvalida) {
        // Si el usuario modificó manualmente y la hora es válida, usar la hora que seleccionó
        fechaHoraEnviar = horaRealizacion;
        console.log('[ProcedimientoEmergenciaForm] Hora modificada manualmente - Usando hora seleccionada:', fechaHoraEnviar);
      } else {
        // Fallback: Si no hay hora seleccionada o es inválida, usar la hora actual
        fechaHoraEnviar = getCurrentDateTimeLocal();
        console.log('[ProcedimientoEmergenciaForm] Sin hora seleccionada o hora inválida - Usando hora actual:', fechaHoraEnviar);
      }
      
      console.log('[ProcedimientoEmergenciaForm] Hora seleccionada en el input (datetime-local):', horaRealizacion);
      console.log('[ProcedimientoEmergenciaForm] Hora enviada al backend:', fechaHoraEnviar);
      console.log('[ProcedimientoEmergenciaForm] ¿Hora modificada manualmente?:', horaModificadaManual);
      console.log('[ProcedimientoEmergenciaForm] ¿Hora válida?:', !horaInvalida);
      
      const cumplimientoData = {
        admisionId: parseInt(admisionId),
        procedimientoCatId: procedimientoSeleccionado.id,
        fechaHora: fechaHoraEnviar, // Enviar como string datetime-local sin conversión
        observacionHallazgo: observacion,
        alertaMedica: requiereValoracionMedica ? 1 : 0,
        observacionEscalamiento: requiereValoracionMedica ? observacionEscalamiento : null,
        justificacionRegistroTardio: requiereJustificacionTardio ? justificacionRegistroTardio : null
      };
      
      console.log('[ProcedimientoEmergenciaForm] Enviando cumplimiento:', cumplimientoData);

      const response = await axios.post('http://localhost:3001/api/cumplimiento-procedimientos', cumplimientoData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[ProcedimientoEmergenciaForm] Respuesta del servidor:', response.data);
      console.log('[ProcedimientoEmergenciaForm] admisionId disponible:', admisionId);
      console.log('[ProcedimientoEmergenciaForm] requiereSignosVitales:', response.data.requiereSignosVitales);
      console.log('[ProcedimientoEmergenciaForm] esTriajeRojo:', response.data.esTriajeRojo);

      // NUEVA LÓGICA: Si requiere signos vitales, mostrar modal de confirmación
      // El procedimiento se guardará cuando el usuario confirme explícitamente
      if (response.data.code === 'REQUIRE_SIGNOS_VITALES' && admisionId) {
        console.log('[ProcedimientoEmergenciaForm] Requiere signos vitales - Guardando datos pendientes y mostrando modal de confirmación...');
        // Guardar los datos del procedimiento en estado pendiente (NO se guarda en BD todavía)
        setDatosProcedimientoPendiente(cumplimientoData);
        setSignosVitalesModalData({
          message: 'ℹ️ Se sugiere tomar signos vitales para completar la evaluación del paciente. ¿Desea guardar el procedimiento y continuar a tomar signos vitales?',
          admisionId: admisionId,
          triaje: response.data.triaje || 'Sin triaje asignado',
          procedimientoGuardado: false // Indicar que el procedimiento NO se ha guardado todavía
        });
        setShowSignosVitalesModal(true);
        return; // NO limpiar formulario todavía - esperar confirmación
      }
      
      // Si NO requiere signos vitales, guardar normalmente
      setSuccess(response.data.message);
      
      // Limpiar formulario solo si se guardó exitosamente
      setNombreProcedimiento('');
      setObservacion('');
      setRequiereValoracionMedica(false);
      setObservacionEscalamiento('');
      setHoraModificadaManual(false);
      setHoraInvalida(false);
      setMensajeHoraInvalida('');
      setHoraRealizacion(getCurrentDateTimeLocal());
      setRequiereJustificacionTardio(false);
      setJustificacionRegistroTardio('');
      
      // Si hay alerta médica pero NO requiere signos vitales (ya los tiene), mostrar modal de confirmación para preguntar si es crítico/ROJO
      if (response.data.escalado && admisionId && !response.data.requiereSignosVitales) {
        console.log('[ProcedimientoEmergenciaForm] Alerta médica detectada, mostrando modal de confirmación...');
        setAdmisionIdParaRedireccion(admisionId);
        setShowConfirmacionCriticoModal(true);
        return; // Salir temprano para evitar ejecutar onProcedimientoAdded
      }
      
      if (onProcedimientoAdded) {
        onProcedimientoAdded(response.data.cumplimiento);
      }
    } catch (err) {
      console.error('[ProcedimientoEmergenciaForm] Error completo:', err);
      console.error('[ProcedimientoEmergenciaForm] Error response:', err.response);
      console.error('[ProcedimientoEmergenciaForm] Error code:', err.response?.data?.code);
      
      // Manejo especial del error de signos vitales faltantes
      if (err.response?.data?.code === 'REQUIRE_SIGNOS_VITALES') {
        console.log('[ProcedimientoEmergenciaForm] Detectado error REQUIRE_SIGNOS_VITALES, mostrando modal...');
        setSignosVitalesModalData({
          message: err.response.data.message,
          admisionId: err.response.data.admisionId,
          triaje: err.response.data.triaje
        });
        setShowSignosVitalesModal(true);
        return;
      }
      
      // Manejo especial del error de justificación de registro tardío requerida
      if (err.response?.data?.code === 'REQUIRE_JUSTIFICACION_TARDIO') {
        console.log('[ProcedimientoEmergenciaForm] Detectado error REQUIRE_JUSTIFICACION_TARDIO');
        setRequiereJustificacionTardio(true);
        setError(err.response.data.message || 'Se requiere justificación del registro tardío.');
        return;
      }
      
      // Manejo especial de errores de validación de tiempo
      if (err.response?.data?.code === 'HORA_FUTURA' || 
          err.response?.data?.code === 'HORA_ANTERIOR_ADMISION' ||
          err.response?.data?.code === 'PROCEDIMIENTO_MUY_ANTIGUO' ||
          err.response?.data?.code === 'SIN_FECHA_ADMISION') {
        setError(err.response.data.message || 'Error en la validación de tiempo del procedimiento.');
        return;
      }
      
      // Otros errores
      setError(err.response?.data?.message || 'Error al registrar el procedimiento.');
    }
  };


  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Procedimiento de Emergencia</h2>
        {(!admisionId || admisionId === 'undefined') && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700 font-semibold">⚠️ Advertencia: No se encontró admisión activa.</p>
            <p className="text-yellow-600 text-sm">Los procedimientos solo se registrarán sin vincular a una admisión específica.</p>
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isFormDisabled}> {/* Deshabilitar todo el fieldset */}
            <div className="mb-4">
              <label htmlFor="nombreProcedimiento" className="block text-gray-700 text-sm font-bold mb-2">
                Procedimiento:
              </label>
            <select
              id="nombreProcedimiento"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={nombreProcedimiento}
              onChange={(e) => setNombreProcedimiento(e.target.value)}
              required
            >
              <option value="">Seleccione un procedimiento</option>
              {procedimientosDisponibles.map((proc) => (
                <option key={proc.id} value={proc.nombre}>{proc.nombre}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="horaRealizacion" className="block text-gray-700 text-sm font-bold mb-2">
              Hora de Realización:
            </label>
            <input
              type="datetime-local"
              id="horaRealizacion"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                horaInvalida ? 'border-red-500 bg-red-50' : ''
              }`}
              value={horaRealizacion}
              max={getCurrentDateTimeLocal()} // Restringir tiempo futuro
              onChange={(e) => {
                const nuevaHora = e.target.value;
                setHoraRealizacion(nuevaHora);
                setHoraModificadaManual(true); // Marcar que el usuario modificó manualmente la hora
              }}
              required
            />
            {!horaModificadaManual && (
              <p className="text-gray-500 text-xs mt-1">
                ⏰ La hora se actualiza automáticamente cada minuto. Modifíquela manualmente si necesita una hora específica.
              </p>
            )}
            {horaInvalida && mensajeHoraInvalida && !requiereJustificacionTardio && (
              <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-red-700 text-sm font-semibold">{mensajeHoraInvalida}</p>
                <p className="text-red-600 text-xs mt-1">
                  Reglas de seguridad clínica: No se permite tiempo futuro, hora anterior a la admisión, ni más de 6 horas de antigüedad (excepto con justificación).
                </p>
              </div>
            )}
            {requiereJustificacionTardio && mensajeHoraInvalida && (
              <div className="mt-2 p-2 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-orange-700 text-sm font-semibold">{mensajeHoraInvalida}</p>
                <p className="text-orange-600 text-xs mt-1">
                  ⚠️ Registro tardío detectado. Complete el campo de justificación obligatorio a continuación.
                </p>
              </div>
            )}
            {horaModificadaManual && !horaInvalida && !requiereJustificacionTardio && (
              <p className="text-green-600 text-xs mt-1">
                ✅ Hora válida. Puede registrar el procedimiento.
              </p>
            )}
          </div>
          
          {/* Campo de Justificación de Registro Tardío (solo visible cuando se requiere) */}
          {requiereJustificacionTardio && (
            <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
              <label htmlFor="justificacionRegistroTardio" className="block text-orange-700 text-sm font-bold mb-2">
                ⚠️ Justificación de Registro Tardío (Obligatorio):
              </label>
              <p className="text-gray-600 text-xs mb-2">
                El procedimiento tiene más de 6 horas de antigüedad. Por seguridad clínica y auditoría, debe proporcionar una justificación detallada del motivo del registro tardío.
              </p>
              <textarea
                id="justificacionRegistroTardio"
                className="shadow appearance-none border-2 border-orange-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-orange-500 h-32"
                value={justificacionRegistroTardio}
                onChange={(e) => setJustificacionRegistroTardio(e.target.value)}
                placeholder="Ejemplo: Procedimiento realizado durante turno nocturno, sistema temporalmente no disponible, paciente en traslado, registro pendiente por alta carga de trabajo..."
                required={requiereJustificacionTardio}
              ></textarea>
              {justificacionRegistroTardio.length > 0 && (
                <p className="text-gray-500 text-xs mt-1">
                  {justificacionRegistroTardio.length} caracteres
                </p>
              )}
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="observacion" className="block text-gray-700 text-sm font-bold mb-2">
              Observación (opcional):
            </label>
            <textarea
              id="observacion"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            ></textarea>
          </div>

          {/* ESCALAMIENTO MÉDICO */}
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiereValoracionMedica}
                onChange={(e) => {
                  setRequiereValoracionMedica(e.target.checked);
                  if (!e.target.checked) {
                    setObservacionEscalamiento(''); // Limpiar observación si se desmarca
                  }
                }}
                className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                disabled={isFormDisabled}
              />
              <span className="ml-3 text-red-600 font-bold text-lg flex items-center">
                ⚠️ Sugerir revisión médica
              </span>
            </label>
            <p className="text-gray-600 text-xs mt-1 ml-8">
              Marcar si el paciente presenta signos que sugieren una revisión médica
            </p>
          </div>

          {/* OBSERVACIÓN DEL ESCALAMIENTO (solo visible si se marca el checkbox) */}
          {requiereValoracionMedica && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
              <label htmlFor="observacionEscalamiento" className="block text-red-700 text-sm font-bold mb-2">
                📋 Observación del Escalamiento (Obligatorio):
              </label>
              <p className="text-gray-600 text-xs mb-2">
                Describa detalladamente los signos, síntomas o hallazgos que justifican la sugerencia de revisión médica.
              </p>
              <textarea
                id="observacionEscalamiento"
                className="shadow appearance-none border-2 border-red-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-red-500 h-32"
                value={observacionEscalamiento}
                onChange={(e) => setObservacionEscalamiento(e.target.value)}
                placeholder="Ejemplo: Signos de infección, fiebre de 39.5°C, taquicardia, dolor abdominal intenso..."
                required={requiereValoracionMedica}
              ></textarea>
              {observacionEscalamiento.length > 0 && (
                <p className="text-gray-500 text-xs mt-1">
                  {observacionEscalamiento.length} caracteres
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                (horaInvalida && !requiereJustificacionTardio) || isFormDisabled || (requiereJustificacionTardio && !justificacionRegistroTardio.trim())
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
              disabled={(horaInvalida && !requiereJustificacionTardio) || isFormDisabled || (requiereJustificacionTardio && !justificacionRegistroTardio.trim())}
              title={horaInvalida && !requiereJustificacionTardio ? mensajeHoraInvalida : requiereJustificacionTardio && !justificacionRegistroTardio.trim() ? 'Complete la justificación del registro tardío' : ''}
            >
              Registrar Procedimiento
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
              disabled={isFormDisabled}
            >
              Cancelar
            </button>
          </div>
        </fieldset>
      </form>
      </div>
      <HistorialProcedimientosModal
        isOpen={isHistorialModalOpen}
        onClose={closeHistorialModal}
        admisionId={admisionId}
        pacienteId={pacienteId}
      />
      
      {/* Modal para confirmar si es paciente crítico/ROJO */}
      {showConfirmacionCriticoModal && admisionIdParaRedireccion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-4 border-orange-500">
            <h3 className="text-xl font-bold mb-4 text-orange-600 flex items-center">
              ⚠️ Confirmación de Prioridad
            </h3>
            <p className="text-gray-700 mb-4 font-semibold">
              El procedimiento ha sido registrado y el paciente ha sido escalado a valoración médica.
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
              <p className="text-sm text-orange-800 font-bold mb-2">
                ¿Es este paciente CRÍTICO o tiene TRIAGE ROJO (Prioridad 1 - RESUCITACIÓN)?
              </p>
              <p className="text-xs text-orange-700">
                Si es crítico/ROJO, irá directamente al médico sin necesidad de tomar signos vitales primero.
                Si NO es crítico, será redirigido a tomar signos vitales donde podrá asignar el triaje correspondiente.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  // NO es crítico - Redirigir a Signos Vitales
                  console.log('[ProcedimientoEmergenciaForm] NO es crítico, redirigiendo a Signos Vitales...');
                  setShowConfirmacionCriticoModal(false);
                  setAdmisionIdParaRedireccion(null);
                  navigate(`/signosvitales/tomar/${admisionIdParaRedireccion}`);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
              >
                📊 NO - Ir a Signos Vitales
              </button>
              <button
                onClick={async () => {
                  // SÍ es crítico - Asignar triaje ROJO y redirigir al médico
                  console.log('[ProcedimientoEmergenciaForm] SÍ es crítico/ROJO, asignando triaje ROJO...');
                  
                  try {
                    const token = localStorage.getItem('token');
                    
                    // Primero obtener el ID del triaje ROJO (RESUCITACIÓN)
                    const triajesResponse = await axios.get('http://localhost:3001/api/cat-triaje', {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const triajeRojo = triajesResponse.data.find(
                      t => t.nombre === 'RESUCITACIÓN' || t.color?.toLowerCase() === 'rojo'
                    );
                    
                    if (!triajeRojo) {
                      console.error('[ProcedimientoEmergenciaForm] No se encontró el triaje ROJO');
                      setError('No se pudo encontrar el triaje ROJO. Redirigiendo a Signos Vitales...');
                      setShowConfirmacionCriticoModal(false);
                      navigate(`/signosvitales/tomar/${admisionIdParaRedireccion}`);
                      return;
                    }
                    
                    console.log('[ProcedimientoEmergenciaForm] Triaje ROJO encontrado:', triajeRojo);
                    
                    // Asignar el triaje ROJO a la admisión
                    await axios.post(
                      'http://localhost:3001/api/signos-vitales/asignar-triaje-solo',
                      {
                        admisionId: admisionIdParaRedireccion,
                        triajeDefinitivoId: triajeRojo.id
                      },
                      {
                        headers: { Authorization: `Bearer ${token}` }
                      }
                    );
                    
                    console.log('[ProcedimientoEmergenciaForm] Triaje ROJO asignado exitosamente. Redirigiendo al médico...');
                    setShowConfirmacionCriticoModal(false);
                    setAdmisionIdParaRedireccion(null);
                    navigate('/lista-espera'); // Redirigir a la lista del médico
                  } catch (error) {
                    console.error('[ProcedimientoEmergenciaForm] Error al asignar triaje ROJO:', error);
                    setError('Error al asignar triaje ROJO. Redirigiendo a Signos Vitales...');
                    const admisionIdTemp = admisionIdParaRedireccion;
                    setShowConfirmacionCriticoModal(false);
                    setAdmisionIdParaRedireccion(null);
                    navigate(`/signosvitales/tomar/${admisionIdTemp}`);
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
                autoFocus
              >
                🔴 SÍ - Es Crítico/ROJO
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para redirigir a tomar signos vitales */}
      {showSignosVitalesModal && signosVitalesModalData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className={`bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-4 ${
            signosVitalesModalData.procedimientoGuardado ? 'border-green-500' : 'border-orange-500'
          }`}>
            <h3 className={`text-xl font-bold mb-4 flex items-center ${
              signosVitalesModalData.procedimientoGuardado ? 'text-green-600' : 'text-orange-600'
            }`}>
              {signosVitalesModalData.procedimientoGuardado ? '✅ Procedimiento Guardado' : '⚠️ Confirmación Requerida'}
            </h3>
            <p className="text-gray-700 mb-4 font-semibold">
              {signosVitalesModalData.message}
            </p>
            {!signosVitalesModalData.procedimientoGuardado && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                <p className="text-sm text-blue-800 font-semibold">
                  ℹ️ El procedimiento se guardará inmediatamente al confirmar "Sí - Guardar y Tomar Signos Vitales".
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  El registro del procedimiento es independiente de los signos vitales. Si presiona "Cancelar", el procedimiento NO se guardará y podrá intentar nuevamente cuando esté listo. Sus datos del formulario se mantendrán.
                </p>
              </div>
            )}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-bold">Triaje actual:</span> {signosVitalesModalData.triaje || 'Sin triaje asignado'}
              </p>
              {!signosVitalesModalData.procedimientoGuardado && (
                <p className="text-xs text-yellow-700 mt-2">
                  <span className="font-bold">⚠️ Importante:</span> Al marcar "Sugerir revisión médica", se recomienda tomar signos vitales para completar la evaluación del paciente.
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              {!signosVitalesModalData.procedimientoGuardado && (
                <button
                  onClick={() => {
                    // Si cancela, NO guardar el procedimiento y mantener el formulario con los datos
                    console.log('[ProcedimientoEmergenciaForm] Usuario canceló - Procedimiento NO se guardará.');
                    setShowSignosVitalesModal(false);
                    setSignosVitalesModalData(null);
                    setDatosProcedimientoPendiente(null);
                    // NO limpiar el formulario - mantener los datos para que el usuario pueda intentar de nuevo
                    setError('Registro cancelado. El procedimiento no se ha guardado. Puede intentar nuevamente cuando esté listo.');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar (No Guardar)
                </button>
              )}
              <button
                onClick={async () => {
                  // PRIMERO: Guardar el procedimiento inmediatamente (registro independiente)
                  if (!signosVitalesModalData.procedimientoGuardado && datosProcedimientoPendiente) {
                    console.log('[ProcedimientoEmergenciaForm] Guardando procedimiento inmediatamente antes de redirigir a signos vitales...');
                    try {
                      const token = localStorage.getItem('token');
                      // Agregar flag para indicar que el usuario confirma guardar sin signos vitales
                      const datosParaGuardar = {
                        ...datosProcedimientoPendiente,
                        confirmarGuardarSinSignosVitales: true
                      };
                      const response = await axios.post(
                        'http://localhost:3001/api/cumplimiento-procedimientos', 
                        datosParaGuardar,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      
                      console.log('[ProcedimientoEmergenciaForm] ✅ Procedimiento guardado exitosamente. ID:', response.data.cumplimiento?.id);
                      setSuccess('✅ Procedimiento registrado exitosamente.');
                      
                      // Guardar el ID del procedimiento guardado para referencia futura
                      const procedimientoIdGuardado = response.data.cumplimiento?.id;
                      
                      // Notificar que se agregó el procedimiento ANTES de redirigir
                      if (onProcedimientoAdded) {
                        console.log('[ProcedimientoEmergenciaForm] Notificando que se agregó el procedimiento...', response.data.cumplimiento);
                        await onProcedimientoAdded(response.data.cumplimiento);
                        console.log('[ProcedimientoEmergenciaForm] Callback onProcedimientoAdded completado.');
                      }
                      
                      // Limpiar formulario y datos pendientes DESPUÉS de guardar
                      setNombreProcedimiento('');
                      setObservacion('');
                      setRequiereValoracionMedica(false);
                      setObservacionEscalamiento('');
                      setHoraModificadaManual(false);
                      setHoraInvalida(false);
                      setMensajeHoraInvalida('');
                      setHoraRealizacion(getCurrentDateTimeLocal());
                      setRequiereJustificacionTardio(false);
                      setJustificacionRegistroTardio('');
                      setDatosProcedimientoPendiente(null);
                      
                      // Actualizar el estado del modal para indicar que ya se guardó
                      setSignosVitalesModalData({
                        ...signosVitalesModalData,
                        procedimientoGuardado: true,
                        procedimientoId: procedimientoIdGuardado
                      });
                      
                      // Esperar un momento para asegurar que la actualización se complete
                      await new Promise(resolve => setTimeout(resolve, 300));
                    } catch (err) {
                      console.error('[ProcedimientoEmergenciaForm] Error al guardar procedimiento pendiente:', err);
                      setError('Error al guardar el procedimiento. Por favor, intente nuevamente.');
                      setShowSignosVitalesModal(false);
                      setSignosVitalesModalData(null);
                      return;
                    }
                  }
                  
                  // SEGUNDO: Redirigir a tomar signos vitales (proceso independiente)
                  console.log('[ProcedimientoEmergenciaForm] Redirigiendo a signos vitales para admisión:', signosVitalesModalData.admisionId);
                  setShowSignosVitalesModal(false);
                  setSignosVitalesModalData(null);
                  navigate(`/signosvitales/tomar/${signosVitalesModalData.admisionId}`);
                }}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center ${
                  signosVitalesModalData.procedimientoGuardado 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                autoFocus
              >
                📊 {signosVitalesModalData.procedimientoGuardado ? 'Ir a Tomar Signos Vitales' : 'Sí - Guardar y Tomar Signos Vitales'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProcedimientoEmergenciaForm;