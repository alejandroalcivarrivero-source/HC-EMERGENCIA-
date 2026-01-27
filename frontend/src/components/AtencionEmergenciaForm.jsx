import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, differenceInYears, parseISO } from 'date-fns'; // Para manejar fechas y horas
import RecetaMedicaForm from './RecetaMedicaForm'; // Importar el componente de Receta Médica
import OrdenExamenForm from './OrdenExamenForm'; // Importar el componente de Orden de Examen
import OrdenImagenForm from './OrdenImagenForm'; // Importar el componente de Orden de Imagen

const AtencionEmergenciaForm = ({ admisionData, atencionData, signosVitalesData, readOnly = false }) => {
  const { admisionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atencionEmergenciaData, setAtencionEmergenciaData] = useState({
    // SECCIÓN: ATENCIÓN INICIAL
    fechaAtencion: '', // Se inicializará automáticamente al cargar
    horaAtencion: '', // Se inicializará automáticamente al cargar
    condicionLlegada: '',
    motivoAtencion: '',
    // SECCIÓN: EVENTO TRAUMÁTICO (Accidente, Violencia, Intoxicación)
    fechaEvento: '',
    horaEvento: '',
    lugarEvento: '',
    direccionEvento: '',
    custodiaPolicial: false,
    notificacion: false,
    tipoAccidenteViolenciaIntoxicacion: [],
    observacionesAccidente: '',
    sugestivoAlientoAlcoholico: false,
    // SECCIÓN: ANTECEDENTES PATOLÓGICOS
    antecedentesPatologicos: {
      alergicos: '', clinicos: '', ginecologicos: '', traumaticos: '',
      pediatricos: '', quirurgicos: '', farmacologicos: '', habitos: '',
      familiares: '', otros: ''
    },
    // SECCIÓN: PROBLEMA ACTUAL
    enfermedadProblemaActual: '',
    // SECCIÓN: EXAMEN FÍSICO
    examenFisico: {
      piel_faneras: '', cabeza: '', ojos: '', oidos: '', nariz: '', boca: '',
      orofaringe: '', cuello: '', axilas_mamas: '', torax: '', abdomen: '',
      columna_vertebral: '', miembros_superiores: '', miembros_inferiores: '',
      glasgow_ocular: null, glasgow_verbal: null, glasgow_motora: null
    },
    // SECCIÓN: EXAMEN TRAUMATOLÓGICO
    examenFisicoTraumaCritico: '',
    // SECCIÓN: OBSTETRICIA
    embarazoParto: {
      numeroGestas: null, numeroPartos: null, numeroAbortos: null, numeroCesareas: null,
      fum: '', semanasGestacion: null, movimientoFetal: false, frecuenciaCardiacaFetal: null,
      rupturaMembranas: false, tiempo: '', afu: '', presentacion: '',
      dilatacion: '', borramiento: '', plano: '', pelvisViable: false,
      sangradoVaginal: false, contracciones: false, scoreMama: null
    },
    // SECCIÓN: ESTUDIOS COMPLEMENTARIOS
    examenesComplementarios: [],
    // SECCIÓN: DIAGNÓSTICOS PRESUNTIVOS
    diagnosticosPresuntivos: [], // [{cie: '', descripcion: ''}]
    // SECCIÓN: DIAGNÓSTICOS DEFINITIVOS
    diagnosticosDefinitivos: [], // [{cie: '', descripcion: ''}]
    // SECCIÓN: PLAN DE TRATAMIENTO
    planTratamiento: [], // [{medicamento: '', via: '', dosis: '', posologia: '', dias: null}]
    observacionesPlanTratamiento: '',
    // SECCIÓN: CONDICIÓN AL EGRESO
    condicionEgreso: '',
    referenciaEgreso: '',
    establecimientoEgreso: ''
  });
  const TABS = ['inicioAtencion', 'enfermedadActual', 'antecedentes', 'accidenteViolencia', 'examenFisico', 'examenTrauma', 'embarazoParto', 'examenesComplementarios', 'diagnosticos', 'planTratamiento', 'condicionEgreso'];
  const [activeTab, setActiveTab] = useState('inicioAtencion');
  const [showRecetaModal, setShowRecetaModal] = useState(false); // Estado para controlar el modal de receta
  const [showOrdenExamenModal, setShowOrdenExamenModal] = useState(false); // Estado para controlar el modal de orden de examen
  const [showOrdenImagenModal, setShowOrdenImagenModal] = useState(false); // Estado para controlar el modal de orden de imagen
  const [saving, setSaving] = useState(false); // Estado para indicar que se está guardando
  const [saved, setSaved] = useState(false); // Estado para indicar que se guardó exitosamente
  const [saveError, setSaveError] = useState(null); // Estado para errores de guardado
  const lastSavedRef = useRef(null); // Referencia al último estado guardado
  const timeoutRef = useRef(null); // Referencia al timeout de auto-save
  const existingAtencionIdRef = useRef(null); // Referencia al ID de atención existente
  const horaInicialRef = useRef(null); // Referencia a la hora inicial de captura (para persistencia)
  const fechaInicialRef = useRef(null); // Referencia a la fecha inicial de captura (para persistencia)

  useEffect(() => {
    console.log("[AtencionEmergenciaForm] admisionData recibido:", admisionData);
    console.log("[AtencionEmergenciaForm] atencionData recibido:", atencionData);
    console.log("[AtencionEmergenciaForm] signosVitalesData recibido:", signosVitalesData);

    if (!admisionData || !signosVitalesData) {
      // Si los datos esenciales no están disponibles, aún estamos cargando o hay un error en la página padre
      setLoading(true);
      return;
    }

    // Si atencionData existe, precargar el formulario con esos datos (Atención en Curso)
    if (atencionData) {
      existingAtencionIdRef.current = atencionData.id; // Guardar el ID de la atención existente
      
      // Guardar la hora y fecha originales para persistencia
      fechaInicialRef.current = atencionData.fechaAtencion || format(new Date(), 'yyyy-MM-dd');
      horaInicialRef.current = atencionData.horaAtencion || format(new Date(), 'HH:mm');
      
      setAtencionEmergenciaData(prevData => ({
        ...prevData,
        ...atencionData,
        // Respetar la fecha y hora originales (no regenerar)
        fechaAtencion: fechaInicialRef.current,
        horaAtencion: horaInicialRef.current,
        tipoAccidenteViolenciaIntoxicacion: JSON.parse(atencionData.tipoAccidenteViolenciaIntoxicacion || '[]'),
        antecedentesPatologicos: JSON.parse(atencionData.antecedentesPatologicos || '{}'),
        examenFisico: JSON.parse(atencionData.examenFisico || '{}'),
        embarazoParto: JSON.parse(atencionData.embarazoParto || '{}'),
        examenesComplementarios: JSON.parse(atencionData.examenesComplementarios || '[]'),
        diagnosticosPresuntivos: JSON.parse(atencionData.diagnosticosPresuntivos || '[]'),
        diagnosticosDefinitivos: JSON.parse(atencionData.diagnosticosDefinitivos || '[]'),
        planTratamiento: JSON.parse(atencionData.planTratamiento || '[]'),
      }));
      lastSavedRef.current = JSON.stringify({
        ...atencionData,
        tipoAccidenteViolenciaIntoxicacion: JSON.parse(atencionData.tipoAccidenteViolenciaIntoxicacion || '[]'),
        antecedentesPatologicos: JSON.parse(atencionData.antecedentesPatologicos || '{}'),
        examenFisico: JSON.parse(atencionData.examenFisico || '{}'),
        embarazoParto: JSON.parse(atencionData.embarazoParto || '{}'),
        examenesComplementarios: JSON.parse(atencionData.examenesComplementarios || '[]'),
        diagnosticosPresuntivos: JSON.parse(atencionData.diagnosticosPresuntivos || '[]'),
        diagnosticosDefinitivos: JSON.parse(atencionData.diagnosticosDefinitivos || '[]'),
        planTratamiento: JSON.parse(atencionData.planTratamiento || '[]'),
      }); // Inicializar referencia
    } else {
      // Si no existe atención previa (Atención Nueva), inicializar fecha y hora automáticamente
      const fechaActual = format(new Date(), 'yyyy-MM-dd');
      const horaActual = format(new Date(), 'HH:mm');
      
      // Guardar la hora inicial para persistencia
      fechaInicialRef.current = fechaActual;
      horaInicialRef.current = horaActual;
      
      setAtencionEmergenciaData(prevData => ({
        ...prevData,
        fechaAtencion: fechaActual,
        horaAtencion: horaActual
      }));
      lastSavedRef.current = null; // No hay datos guardados aún
    }
    setLoading(false);
    if (atencionData && admisionId) {
      const saved = localStorage.getItem(`form008_tab_${admisionId}`);
      if (saved && TABS.includes(saved)) setActiveTab(saved);
    }
  }, [admisionData, atencionData, signosVitalesData]);

  // Función para guardar automáticamente
  const autoSave = useCallback(async (dataToSave, isImmediate = false) => {
    if (readOnly) return;
    // Evitar guardar si no hay cambios
    const currentDataString = JSON.stringify(dataToSave);
    if (currentDataString === lastSavedRef.current && !isImmediate) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      const token = localStorage.getItem('token');
      if (!token) return;

      const dataToSend = {
        ...dataToSave,
        pacienteId: admisionData.pacienteId,
        admisionId: parseInt(admisionId),
        tipoAccidenteViolenciaIntoxicacion: JSON.stringify(dataToSave.tipoAccidenteViolenciaIntoxicacion),
        antecedentesPatologicos: JSON.stringify(dataToSave.antecedentesPatologicos),
        examenFisico: JSON.stringify(dataToSave.examenFisico),
        embarazoParto: JSON.stringify(dataToSave.embarazoParto),
        examenesComplementarios: JSON.stringify(dataToSave.examenesComplementarios),
        diagnosticosPresuntivos: JSON.stringify(dataToSave.diagnosticosPresuntivos),
        diagnosticosDefinitivos: JSON.stringify(dataToSave.diagnosticosDefinitivos),
        planTratamiento: JSON.stringify(dataToSave.planTratamiento),
      };

      if (existingAtencionIdRef.current) {
        // Actualizar existente
        await axios.put(`http://localhost:3001/api/atencion-emergencia/${existingAtencionIdRef.current}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Crear nuevo
        const response = await axios.post('http://localhost:3001/api/atencion-emergencia', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        existingAtencionIdRef.current = response.data.id;
      }

      lastSavedRef.current = currentDataString;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Ocultar mensaje después de 3 segundos
    } catch (error) {
      console.error('[AtencionEmergenciaForm] Error en auto-save:', error);
      setSaveError('Error al guardar automáticamente');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  }, [admisionData, admisionId, readOnly]);

  // Auto-save con debounce (2 segundos después de dejar de escribir)
  useEffect(() => {
    if (loading || !admisionData || readOnly) return;

    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      autoSave(atencionEmergenciaData, false);
    }, 2000); // 2 segundos de delay

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [atencionEmergenciaData, autoSave, loading, admisionData, readOnly]);

  const handleTabChange = (newTab) => {
    autoSave(atencionEmergenciaData, true);
    if (admisionId) localStorage.setItem(`form008_tab_${admisionId}`, newTab);
    setActiveTab(newTab);
  };

  // Guardar al cerrar/recargar página (no en modo solo lectura)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (readOnly) return;
      if (JSON.stringify(atencionEmergenciaData) !== lastSavedRef.current) {
        // Usar sendBeacon para guardar de forma síncrona antes de cerrar
        const token = localStorage.getItem('token');
        if (token) {
          const dataToSend = {
            ...atencionEmergenciaData,
            pacienteId: admisionData?.pacienteId,
            admisionId: parseInt(admisionId),
            tipoAccidenteViolenciaIntoxicacion: JSON.stringify(atencionEmergenciaData.tipoAccidenteViolenciaIntoxicacion),
            antecedentesPatologicos: JSON.stringify(atencionEmergenciaData.antecedentesPatologicos),
            examenFisico: JSON.stringify(atencionEmergenciaData.examenFisico),
            embarazoParto: JSON.stringify(atencionEmergenciaData.embarazoParto),
            examenesComplementarios: JSON.stringify(atencionEmergenciaData.examenesComplementarios),
            diagnosticosPresuntivos: JSON.stringify(atencionEmergenciaData.diagnosticosPresuntivos),
            diagnosticosDefinitivos: JSON.stringify(atencionEmergenciaData.diagnosticosDefinitivos),
            planTratamiento: JSON.stringify(atencionEmergenciaData.planTratamiento),
          };
          
          const url = existingAtencionIdRef.current
            ? `http://localhost:3001/api/atencion-emergencia/${existingAtencionIdRef.current}`
            : 'http://localhost:3001/api/atencion-emergencia';
          
          navigator.sendBeacon(
            url,
            new Blob([JSON.stringify(dataToSend)], { type: 'application/json' })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [atencionEmergenciaData, admisionId, admisionData, readOnly]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Listener especial para condicionLlegada
    if (name === 'condicionLlegada') {
      setAtencionEmergenciaData(prevData => {
        const newData = {
          ...prevData,
          condicionLlegada: value
        };
        
        // Si cambia a ESTABLE o INESTABLE, restaurar fecha/hora original
        if (value === 'ESTABLE' || value === 'INESTABLE') {
          newData.fechaAtencion = fechaInicialRef.current || format(new Date(), 'yyyy-MM-dd');
          newData.horaAtencion = horaInicialRef.current || format(new Date(), 'HH:mm');
        }
        // Si es FALLECIDO, mantener la fecha/hora actual (permitir edición)
        // No hacer nada especial, los campos ya estarán desbloqueados
        
        return newData;
      });
      return;
    }

    if (name === 'custodiaPolicial' || name === 'notificacion' || name === 'sugestivoAlientoAlcoholico') {
      setAtencionEmergenciaData(prevData => ({
        ...prevData,
        [name]: value === 'true' // Convertir a booleano
      }));
    } else {
      setAtencionEmergenciaData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNestedChange = (section, field, value) => {
    setAtencionEmergenciaData(prevData => {
      const newValue = (field === 'glasgow_ocular' || field === 'glasgow_verbal' || field === 'glasgow_motora')
        ? (value === '' ? null : parseInt(value, 10)) // Convertir a número o null para Glasgow
        : value;
      return {
        ...prevData,
        [section]: {
          ...prevData[section],
          [field]: newValue
        }
      };
    });
  };

  const handleArrayChange = (section, index, field, value) => {
    setAtencionEmergenciaData(prevData => {
      const newArray = [...prevData[section]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prevData, [section]: newArray };
    });
  };

  const addArrayItem = (section, newItem) => {
    setAtencionEmergenciaData(prevData => ({
      ...prevData,
      [section]: [...prevData[section], newItem]
    }));
  };

  const removeArrayItem = (section, index) => {
    setAtencionEmergenciaData(prevData => ({
      ...prevData,
      [section]: prevData[section].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const dataToSend = {
        ...atencionEmergenciaData,
        pacienteId: admisionData.pacienteId,
        admisionId: parseInt(admisionId),
        // Asegurarse de que los arrays/objetos se envíen como JSON strings
        tipoAccidenteViolenciaIntoxicacion: JSON.stringify(atencionEmergenciaData.tipoAccidenteViolenciaIntoxicacion),
        antecedentesPatologicos: JSON.stringify(atencionEmergenciaData.antecedentesPatologicos),
        examenFisico: JSON.stringify(atencionEmergenciaData.examenFisico),
        embarazoParto: JSON.stringify(atencionEmergenciaData.embarazoParto),
        examenesComplementarios: JSON.stringify(atencionEmergenciaData.examenesComplementarios),
        diagnosticosPresuntivos: JSON.stringify(atencionEmergenciaData.diagnosticosPresuntivos),
        diagnosticosDefinitivos: JSON.stringify(atencionEmergenciaData.diagnosticosDefinitivos),
        planTratamiento: JSON.stringify(atencionEmergenciaData.planTratamiento),
      };
      console.log('[AtencionEmergenciaForm] Datos a enviar:', dataToSend);

      // Usar el ID guardado en la referencia si existe, sino verificar
      if (existingAtencionIdRef.current) {
        // Si existe, actualizar
        await axios.put(`http://localhost:3001/api/atencion-emergencia/${existingAtencionIdRef.current}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Atención de emergencia actualizada exitosamente.');
      } else {
        // Verificar si existe una atención de emergencia para esta admisión
        const existingAtencionResponse = await axios.get(`http://localhost:3001/api/atencion-emergencia/admision/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response && err.response.status === 404) {
            console.log('[AtencionEmergenciaForm] No existe atención previa, se procederá a crear.');
            return null; // No existe, es un POST
          }
          console.error('[AtencionEmergenciaForm] Error al verificar atención existente:', err);
          throw err;
        });

        if (existingAtencionResponse && existingAtencionResponse.data) {
          // Si existe, actualizar y guardar el ID
          existingAtencionIdRef.current = existingAtencionResponse.data.id;
          await axios.put(`http://localhost:3001/api/atencion-emergencia/${existingAtencionResponse.data.id}`, dataToSend, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Atención de emergencia actualizada exitosamente.');
        } else {
          // Si no existe, crear
          const response = await axios.post('http://localhost:3001/api/atencion-emergencia', dataToSend, {
            headers: { Authorization: `Bearer ${token}` }
          });
          existingAtencionIdRef.current = response.data.id; // Guardar el ID para futuros auto-saves
          alert('Atención de emergencia creada exitosamente.');
        }
      }

      // Actualizar el estado del paciente a 'ATENDIDO' o 'HOSPITALIZADO' según la condición de egreso
      let nuevoEstadoAtencion = 'EN_ATENCION'; // Por defecto, se mantiene en atención
      if (atencionEmergenciaData.condicionEgreso === 'HOSPITALIZACION') {
        nuevoEstadoAtencion = 'HOSPITALIZADO';
      } else if (atencionEmergenciaData.condicionEgreso === 'OBSERVACION_EMERGENCIA') {
        nuevoEstadoAtencion = 'OBSERVACION';
      } else if (atencionEmergenciaData.condicionEgreso === 'FALLECIDO') {
        nuevoEstadoAtencion = 'FALLECIDO';
        // Actualizar también la fecha de fallecimiento en la admisión
        try {
          await axios.put(`http://localhost:3001/usuarios/admisiones/${admisionId}/estado`, {
            estado_paciente: 'FALLECIDO',
            fecha_hora_fallecimiento: new Date().toISOString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Fecha de fallecimiento actualizada en la admisión.');
        } catch (fallecimientoError) {
          console.error('Error al actualizar fecha de fallecimiento:', fallecimientoError);
          // No lanzar error, continuar con el flujo
        }
      } else if (atencionEmergenciaData.condicionEgreso === 'ALTA' || atencionEmergenciaData.condicionEgreso === 'ALTA_DEFINITIVA' || atencionEmergenciaData.condicionEgreso === 'CONSULTA_EXTERNA') {
        nuevoEstadoAtencion = 'ATENDIDO'; // O 'EGRESO' si se prefiere un estado final más genérico
      }

      await axios.put(`http://localhost:3001/api/atencion-paciente-estado/${admisionId}/estado`, { estado: nuevoEstadoAtencion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Estado del paciente actualizado a: ${nuevoEstadoAtencion}`);

      navigate('/lista-espera'); // Volver a la lista de espera
    } catch (err) {
      console.error('[AtencionEmergenciaForm] Error al guardar la atención de emergencia:', err.message);
      console.error('[AtencionEmergenciaForm] Stack trace:', err.stack);
      setError('Error al guardar la atención de emergencia. Verifique los datos e intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !admisionData) {
    return <div className="text-center py-4">Cargando formulario de atención...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  // Obtener el color del triaje desde el objeto TriajeDefinitivo si está disponible
  const triajeColor = admisionData.TriajeDefinitivo?.color || 
                      (admisionData.triajeDefinitivo === 'RESUCITACIÓN' ? 'Rojo' : 
                       admisionData.triajeDefinitivo === 'EMERGENCIA' ? 'Naranja' :
                       admisionData.triajeDefinitivo === 'URGENCIA' ? 'Amarillo' :
                       admisionData.triajeDefinitivo === 'URGENCIA MENOR' ? 'Verde' :
                       admisionData.triajeDefinitivo === 'SIN URGENCIA' ? 'Azul' : 'Gris');
  
  const triajeNombre = admisionData.TriajeDefinitivo?.nombre || admisionData.triajeDefinitivo || 'N/A';
  
  // Función para obtener el color CSS según el color del triaje
  const getTriajeColorClass = (color) => {
    const colorLower = color?.toLowerCase();
    if (colorLower === 'rojo' || colorLower === 'red') return 'text-red-600';
    if (colorLower === 'naranja' || colorLower === 'orange') return 'text-orange-600';
    if (colorLower === 'amarillo' || colorLower === 'yellow') return 'text-yellow-600';
    if (colorLower === 'verde' || colorLower === 'green') return 'text-green-600';
    if (colorLower === 'azul' || colorLower === 'blue') return 'text-blue-600';
    return 'text-gray-600';
  };
  
  const getTriajeBorderColor = (color) => {
    const colorLower = color?.toLowerCase();
    if (colorLower === 'rojo' || colorLower === 'red') return 'border-red-600';
    if (colorLower === 'naranja' || colorLower === 'orange') return 'border-orange-600';
    if (colorLower === 'amarillo' || colorLower === 'yellow') return 'border-yellow-600';
    if (colorLower === 'verde' || colorLower === 'green') return 'border-green-600';
    if (colorLower === 'azul' || colorLower === 'blue') return 'border-blue-600';
    return 'border-gray-600';
  };

  const isTriajeRojo = triajeColor?.toLowerCase() === 'rojo' || triajeColor?.toLowerCase() === 'red';

  return (
    <div>
      {/* Mensaje cuando el formulario está cerrado legalmente */}
      {readOnly && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <span className="text-amber-600 shrink-0" aria-hidden>⚠️</span>
          <p className="text-sm text-amber-800 font-medium">
            Este formulario está cerrado legalmente. Cualquier adición debe realizarse mediante el Formulario 005 (Evolución).
          </p>
        </div>
      )}
      {/* Indicador de estado de guardado - Posicionado mejor (Guardar Progreso) */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-2">
        {saving && !readOnly && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sincronizando...
          </div>
        )}
        {saved && !saving && !readOnly && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guardado exitoso
          </div>
        )}
        {saveError && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {saveError}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={readOnly} className={readOnly ? 'opacity-95 pointer-events-none select-none' : ''}>
        {/* Tabs de navegación mejorados */}
        <div className="border-b-2 border-gray-200">
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'inicioAtencion' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('inicioAtencion')}
              title="Información básica de la atención inicial"
            >
              🏥 Atención Inicial
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'enfermedadActual' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('enfermedadActual')}
              title="Descripción del problema o enfermedad actual"
            >
              💬 Problema Actual
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'antecedentes' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('antecedentes')}
              title="Antecedentes médicos personales y familiares"
            >
              📋 Antecedentes
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'accidenteViolencia' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('accidenteViolencia')}
              title="Información sobre accidentes, violencia o intoxicación"
            >
              ⚠️ Evento Traumático
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'examenFisico' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('examenFisico')}
              title="Evaluación física general del paciente"
            >
              🔍 Examen Físico
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'examenTrauma' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('examenTrauma')}
              title="Evaluación específica de trauma o casos críticos"
            >
              🚨 Examen Trauma
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'embarazoParto' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('embarazoParto')}
              title="Información obstétrica y ginecológica"
            >
              👶 Obstetricia
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'examenesComplementarios' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('examenesComplementarios')}
              title="Laboratorios, imágenes y estudios complementarios"
            >
              🧪 Estudios
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'diagnosticos' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('diagnosticos')}
              title="Diagnósticos presuntivos y definitivos"
            >
              📊 Diagnósticos
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'planTratamiento' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('planTratamiento')}
              title="Plan de tratamiento y medicamentos"
            >
              💊 Tratamiento
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'condicionEgreso' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('condicionEgreso')}
              title="Condición final y destino del paciente"
            >
              🚪 Egreso
            </button>
          </div>
        </div>

        {/* Contenido de las pestañas - Minimalist Clinical */}
        <div className="bg-white rounded-2xl shadow-sm p-8 min-h-[500px] space-y-6 border border-gray-100">
          {activeTab === 'inicioAtencion' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Atención Inicial</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="fechaAtencion" className="block text-gray-700 text-sm font-bold mb-2">
                    Fecha de Atención: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="fechaAtencion"
                    name="fechaAtencion"
                    value={atencionEmergenciaData.fechaAtencion}
                    onChange={handleChange}
                    required
                    readOnly={atencionEmergenciaData.condicionLlegada !== 'FALLECIDO'}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      atencionEmergenciaData.condicionLlegada !== 'FALLECIDO' 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'bg-white'
                    }`}
                    title={
                      atencionEmergenciaData.condicionLlegada !== 'FALLECIDO' 
                        ? 'Fecha automática capturada al inicio de la atención. Solo editable para pacientes fallecidos.' 
                        : 'Editable solo para pacientes fallecidos'
                    }
                  />
                  {atencionEmergenciaData.condicionLlegada !== 'FALLECIDO' && (
                    <p className="text-xs text-gray-500 mt-1">Fecha automática capturada al inicio</p>
                  )}
                </div>
                <div>
                  <label htmlFor="horaAtencion" className="block text-gray-700 text-sm font-bold mb-2">
                    Hora de Atención: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="horaAtencion"
                    name="horaAtencion"
                    value={atencionEmergenciaData.horaAtencion}
                    onChange={handleChange}
                    required
                    readOnly={atencionEmergenciaData.condicionLlegada !== 'FALLECIDO'}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      atencionEmergenciaData.condicionLlegada !== 'FALLECIDO' 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'bg-white'
                    }`}
                    title={
                      atencionEmergenciaData.condicionLlegada !== 'FALLECIDO' 
                        ? 'Hora automática capturada al inicio de la atención. Solo editable para pacientes fallecidos.' 
                        : 'Editable solo para pacientes fallecidos'
                    }
                  />
                  {atencionEmergenciaData.condicionLlegada !== 'FALLECIDO' && (
                    <p className="text-xs text-gray-500 mt-1">Hora automática capturada al inicio</p>
                  )}
                </div>
              </div>

              {/* Selector visual de condición de llegada */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-3">
                  Condición de Llegada: <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'condicionLlegada', value: 'ESTABLE' } })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      atencionEmergenciaData.condicionLlegada === 'ESTABLE'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="font-semibold text-gray-800">ESTABLE</div>
                      <div className="text-xs text-gray-600 mt-1">Paciente estable</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'condicionLlegada', value: 'INESTABLE' } })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      atencionEmergenciaData.condicionLlegada === 'INESTABLE'
                        ? 'border-yellow-500 bg-yellow-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">⚠️</div>
                      <div className="font-semibold text-gray-800">INESTABLE</div>
                      <div className="text-xs text-gray-600 mt-1">Requiere atención urgente</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'condicionLlegada', value: 'FALLECIDO' } })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      atencionEmergenciaData.condicionLlegada === 'FALLECIDO'
                        ? 'border-red-500 bg-red-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">❌</div>
                      <div className="font-semibold text-gray-800">FALLECIDO</div>
                      <div className="text-xs text-gray-600 mt-1">Sin signos vitales</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Motivo de atención con auto-completar */}
              <div className="mb-4">
                <label htmlFor="motivoAtencion" className="block text-gray-700 text-sm font-bold mb-2">
                  Motivo de Atención:
                </label>
                <textarea
                  id="motivoAtencion"
                  name="motivoAtencion"
                  value={atencionEmergenciaData.motivoAtencion || (admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma || '')}
                  onChange={handleChange}
                  rows={4}
                  placeholder={admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma ? `Motivo de admisión: ${admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma}` : 'Describa el motivo de atención...'}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma && !atencionEmergenciaData.motivoAtencion && (
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'motivoAtencion', value: admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma } })}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    📋 Usar motivo de admisión: "{admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma}"
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Se elimina el bloque de Signos Vitales de las pestañas */}

          {activeTab === 'accidenteViolencia' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Evento Traumático</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="fechaEvento" className="block text-gray-700 text-sm font-bold mb-2">Fecha del Evento:</label>
                  <input
                    type="date"
                    id="fechaEvento"
                    name="fechaEvento"
                    value={atencionEmergenciaData.fechaEvento}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="horaEvento" className="block text-gray-700 text-sm font-bold mb-2">Hora del Evento:</label>
                  <input
                    type="time"
                    id="horaEvento"
                    name="horaEvento"
                    value={atencionEmergenciaData.horaEvento}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="lugarEvento" className="block text-gray-700 text-sm font-bold mb-2">Lugar del Evento:</label>
                  <input
                    type="text"
                    id="lugarEvento"
                    name="lugarEvento"
                    value={atencionEmergenciaData.lugarEvento}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Custodia Policial:</label>
                <div className="flex items-center">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      className="form-radio"
                      name="custodiaPolicial"
                      value="true"
                      checked={atencionEmergenciaData.custodiaPolicial === true}
                      onChange={handleChange}
                    />
                    <span className="ml-2">Sí</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="custodiaPolicial"
                      value="false"
                      checked={atencionEmergenciaData.custodiaPolicial === false}
                      onChange={handleChange}
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Notificación:</label>
                <div className="flex items-center">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      className="form-radio"
                      name="notificacion"
                      value="true"
                      checked={atencionEmergenciaData.notificacion === true}
                      onChange={handleChange}
                    />
                    <span className="ml-2">Sí</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="notificacion"
                      value="false"
                      checked={atencionEmergenciaData.notificacion === false}
                      onChange={handleChange}
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Accidente, Violencia, Intoxicación:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    'Accidente de Tránsito', 'Caída', 'Quemadura', 'Mordedura',
                    'Violencia por Arma de Fuego', 'Violencia por Punzocortante', 'Violencia por Riña', 'Violencia Familiar',
                    'Presunta Violencia Física', 'Presunta Violencia Psicológica', 'Presunta Violencia Sexual', 'Ahogamiento',
                    'Cuerpo Extraño', 'Aplastamiento', 'Otro Accidente', 'Intoxicación Alcohólica',
                    'Intoxicación Alimentaria', 'Intoxicación por Drogas', 'Inhalación de Gases', 'Otra Intoxicación',
                    'Picadura', 'Envenenamiento', 'Anafilaxia'
                  ].map((type) => (
                    <label key={type} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        name="tipoAccidenteViolenciaIntoxicacion"
                        value={type}
                        checked={atencionEmergenciaData.tipoAccidenteViolenciaIntoxicacion.includes(type)}
                        onChange={(e) => {
                          const { value, checked } = e.target;
                          setAtencionEmergenciaData(prevData => {
                            const currentTypes = prevData.tipoAccidenteViolenciaIntoxicacion;
                            if (checked) {
                              return { ...prevData, tipoAccidenteViolenciaIntoxicacion: [...currentTypes, value] };
                            } else {
                              return { ...prevData, tipoAccidenteViolenciaIntoxicacion: currentTypes.filter(t => t !== value) };
                            }
                          });
                        }}
                      />
                      <span className="ml-2">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="observacionesAccidente" className="block text-gray-700 text-sm font-bold mb-2">Observaciones:</label>
                <textarea
                  id="observacionesAccidente"
                  name="observacionesAccidente"
                  value={atencionEmergenciaData.observacionesAccidente}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Sugestivo Aliento Alcohólico:</label>
                <div className="flex items-center">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      className="form-radio"
                      name="sugestivoAlientoAlcoholico"
                      value="true"
                      checked={atencionEmergenciaData.sugestivoAlientoAlcoholico === true}
                      onChange={handleChange}
                    />
                    <span className="ml-2">Sí</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="sugestivoAlientoAlcoholico"
                      value="false"
                      checked={atencionEmergenciaData.sugestivoAlientoAlcoholico === false}
                      onChange={handleChange}
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'antecedentes' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Antecedentes Patológicos</h2>
              {Object.keys(atencionEmergenciaData.antecedentesPatologicos).map(key => (
                <div key={key} className="mb-4">
                  <label htmlFor={`antecedentes-${key}`} className="block text-gray-700 text-sm font-bold mb-2">
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </label>
                  <textarea
                    id={`antecedentes-${key}`}
                    name={key}
                    value={atencionEmergenciaData.antecedentesPatologicos[key]}
                    onChange={(e) => handleNestedChange('antecedentesPatologicos', key, e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="2"
                  ></textarea>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'enfermedadActual' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Problema Actual</h2>
              
              {/* Plantillas rápidas */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Plantillas Rápidas:</label>
                <div className="flex flex-wrap gap-2">
                  {['Dolor', 'Fiebre', 'Trauma', 'Dificultad Respiratoria', 'Dolor Abdominal', 'Cefalea', 'Vómitos', 'Diarrea'].map((plantilla) => (
                    <button
                      key={plantilla}
                      type="button"
                      onClick={() => {
                        const textoActual = atencionEmergenciaData.enfermedadProblemaActual || '';
                        const nuevoTexto = textoActual ? `${textoActual}\n• ${plantilla}` : `• ${plantilla}`;
                        handleChange({ target: { name: 'enfermedadProblemaActual', value: nuevoTexto } });
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      + {plantilla}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="enfermedadProblemaActual" className="block text-gray-700 text-sm font-bold mb-2">
                  Descripción del Problema Actual: <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="enfermedadProblemaActual"
                  name="enfermedadProblemaActual"
                  value={atencionEmergenciaData.enfermedadProblemaActual}
                  onChange={handleChange}
                  rows={8}
                  minLength={20}
                  required
                  placeholder="Describa detalladamente el problema o enfermedad actual del paciente (mínimo 20 caracteres)..."
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    atencionEmergenciaData.enfermedadProblemaActual.length > 0 && atencionEmergenciaData.enfermedadProblemaActual.length < 20
                      ? 'border-yellow-500'
                      : ''
                  }`}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-600">
                    {atencionEmergenciaData.enfermedadProblemaActual.length < 20 ? (
                      <span className="text-yellow-600">
                        ⚠️ Mínimo 20 caracteres requeridos ({atencionEmergenciaData.enfermedadProblemaActual.length}/20)
                      </span>
                    ) : (
                      <span className="text-green-600">
                        ✅ Descripción completa ({atencionEmergenciaData.enfermedadProblemaActual.length} caracteres)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {atencionEmergenciaData.enfermedadProblemaActual.length} caracteres
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examenFisico' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Examen Físico</h2>
              {Object.keys(atencionEmergenciaData.examenFisico).filter(key => !key.startsWith('glasgow_')).map(key => (
                <div key={key} className="mb-4">
                  <label htmlFor={`examenFisico-${key}`} className="block text-gray-700 text-sm font-bold mb-2">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                  </label>
                  <textarea
                    id={`examenFisico-${key}`}
                    name={key}
                    value={atencionEmergenciaData.examenFisico[key]}
                    onChange={(e) => handleNestedChange('examenFisico', key, e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="2"
                  ></textarea>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'examenTrauma' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Examen Traumatológico</h2>
              <div className="mb-4">
                <label htmlFor="examenFisicoTraumaCritico" className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
                <textarea
                  id="examenFisicoTraumaCritico"
                  name="examenFisicoTraumaCritico"
                  value={atencionEmergenciaData.examenFisicoTraumaCritico}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="5"
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'embarazoParto' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Obstetricia</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="numeroGestas" className="block text-gray-700 text-sm font-bold mb-2">Número de Gestas:</label>
                  <input
                    type="number"
                    id="numeroGestas"
                    name="numeroGestas"
                    value={atencionEmergenciaData.embarazoParto.numeroGestas || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'numeroGestas', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="numeroPartos" className="block text-gray-700 text-sm font-bold mb-2">Número de Partos:</label>
                  <input
                    type="number"
                    id="numeroPartos"
                    name="numeroPartos"
                    value={atencionEmergenciaData.embarazoParto.numeroPartos || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'numeroPartos', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="numeroAbortos" className="block text-gray-700 text-sm font-bold mb-2">Número de Abortos:</label>
                  <input
                    type="number"
                    id="numeroAbortos"
                    name="numeroAbortos"
                    value={atencionEmergenciaData.embarazoParto.numeroAbortos || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'numeroAbortos', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="numeroCesareas" className="block text-gray-700 text-sm font-bold mb-2">Número de Cesáreas:</label>
                  <input
                    type="number"
                    id="numeroCesareas"
                    name="numeroCesareas"
                    value={atencionEmergenciaData.embarazoParto.numeroCesareas || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'numeroCesareas', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="fum" className="block text-gray-700 text-sm font-bold mb-2">FUM:</label>
                  <input
                    type="date"
                    id="fum"
                    name="fum"
                    value={atencionEmergenciaData.embarazoParto.fum}
                    onChange={(e) => handleNestedChange('embarazoParto', 'fum', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="semanasGestacion" className="block text-gray-700 text-sm font-bold mb-2">Semanas de Gestación:</label>
                  <input
                    type="number"
                    id="semanasGestacion"
                    name="semanasGestacion"
                    value={atencionEmergenciaData.embarazoParto.semanasGestacion || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'semanasGestacion', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Movimiento Fetal:</label>
                  <input
                    type="checkbox"
                    name="movimientoFetal"
                    checked={atencionEmergenciaData.embarazoParto.movimientoFetal}
                    onChange={(e) => handleNestedChange('embarazoParto', 'movimientoFetal', e.target.checked)}
                    className="mr-2 leading-tight"
                  />
                  <span className="text-sm">Sí</span>
                </div>
                <div>
                  <label htmlFor="frecuenciaCardiacaFetal" className="block text-gray-700 text-sm font-bold mb-2">Frecuencia Cardíaca Fetal:</label>
                  <input
                    type="number"
                    id="frecuenciaCardiacaFetal"
                    name="frecuenciaCardiacaFetal"
                    value={atencionEmergenciaData.embarazoParto.frecuenciaCardiacaFetal || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'frecuenciaCardiacaFetal', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Ruptura de Membranas:</label>
                  <input
                    type="checkbox"
                    name="rupturaMembranas"
                    checked={atencionEmergenciaData.embarazoParto.rupturaMembranas}
                    onChange={(e) => handleNestedChange('embarazoParto', 'rupturaMembranas', e.target.checked)}
                    className="mr-2 leading-tight"
                  />
                  <span className="text-sm">Sí</span>
                </div>
                <div>
                  <label htmlFor="tiempo" className="block text-gray-700 text-sm font-bold mb-2">Tiempo:</label>
                  <input
                    type="text"
                    id="tiempo"
                    name="tiempo"
                    value={atencionEmergenciaData.embarazoParto.tiempo}
                    onChange={(e) => handleNestedChange('embarazoParto', 'tiempo', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="afu" className="block text-gray-700 text-sm font-bold mb-2">AFU:</label>
                  <input
                    type="text"
                    id="afu"
                    name="afu"
                    value={atencionEmergenciaData.embarazoParto.afu}
                    onChange={(e) => handleNestedChange('embarazoParto', 'afu', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="presentacion" className="block text-gray-700 text-sm font-bold mb-2">Presentación:</label>
                  <input
                    type="text"
                    id="presentacion"
                    name="presentacion"
                    value={atencionEmergenciaData.embarazoParto.presentacion}
                    onChange={(e) => handleNestedChange('embarazoParto', 'presentacion', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="dilatacion" className="block text-gray-700 text-sm font-bold mb-2">Dilatación:</label>
                  <input
                    type="text"
                    id="dilatacion"
                    name="dilatacion"
                    value={atencionEmergenciaData.embarazoParto.dilatacion}
                    onChange={(e) => handleNestedChange('embarazoParto', 'dilatacion', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="borramiento" className="block text-gray-700 text-sm font-bold mb-2">Borramiento:</label>
                  <input
                    type="text"
                    id="borramiento"
                    name="borramiento"
                    value={atencionEmergenciaData.embarazoParto.borramiento}
                    onChange={(e) => handleNestedChange('embarazoParto', 'borramiento', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label htmlFor="plano" className="block text-gray-700 text-sm font-bold mb-2">Plano:</label>
                  <input
                    type="text"
                    id="plano"
                    name="plano"
                    value={atencionEmergenciaData.embarazoParto.plano}
                    onChange={(e) => handleNestedChange('embarazoParto', 'plano', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Pelvis Viable:</label>
                  <input
                    type="checkbox"
                    name="pelvisViable"
                    checked={atencionEmergenciaData.embarazoParto.pelvisViable}
                    onChange={(e) => handleNestedChange('embarazoParto', 'pelvisViable', e.target.checked)}
                    className="mr-2 leading-tight"
                  />
                  <span className="text-sm">Sí</span>
                </div>
                <div className="col-span-full">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Sangrado Vaginal:</label>
                  <input
                    type="checkbox"
                    name="sangradoVaginal"
                    checked={atencionEmergenciaData.embarazoParto.sangradoVaginal}
                    onChange={(e) => handleNestedChange('embarazoParto', 'sangradoVaginal', e.target.checked)}
                    className="mr-2 leading-tight"
                  />
                  <span className="text-sm">Sí</span>
                </div>
                <div className="col-span-full">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Contracciones:</label>
                  <input
                    type="checkbox"
                    name="contracciones"
                    checked={atencionEmergenciaData.embarazoParto.contracciones}
                    onChange={(e) => handleNestedChange('embarazoParto', 'contracciones', e.target.checked)}
                    className="mr-2 leading-tight"
                  />
                  <span className="text-sm">Sí</span>
                </div>
                <div>
                  <label htmlFor="scoreMama" className="block text-gray-700 text-sm font-bold mb-2">Score Mama:</label>
                  <input
                    type="number"
                    id="scoreMama"
                    name="scoreMama"
                    value={atencionEmergenciaData.embarazoParto.scoreMama || ''}
                    onChange={(e) => handleNestedChange('embarazoParto', 'scoreMama', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examenesComplementarios' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Estudios Complementarios</h2>
              {atencionEmergenciaData.examenesComplementarios.map((examen, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={examen}
                    onChange={(e) => handleArrayChange('examenesComplementarios', index, null, e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('examenesComplementarios', index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('examenesComplementarios', '')}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Agregar Examen
              </button>
            </div>
          )}

          {activeTab === 'diagnosticos' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Diagnósticos</h2>
              <h3 className="text-lg font-semibold mb-2">Diagnósticos Presuntivos</h3>
              {atencionEmergenciaData.diagnosticosPresuntivos.map((diag, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Código CIE"
                    value={diag.cie}
                    onChange={(e) => handleArrayChange('diagnosticosPresuntivos', index, 'cie', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={diag.descripcion}
                    onChange={(e) => handleArrayChange('diagnosticosPresuntivos', index, 'descripcion', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('diagnosticosPresuntivos', index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded col-span-3"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('diagnosticosPresuntivos', { cie: '', descripcion: '' })}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
              >
                Agregar Diagnóstico Presuntivo
              </button>

              <h3 className="text-lg font-semibold mb-2">Diagnósticos Definitivos</h3>
              {atencionEmergenciaData.diagnosticosDefinitivos.map((diag, index) => (
                <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Código CIE"
                    value={diag.cie}
                    onChange={(e) => handleArrayChange('diagnosticosDefinitivos', index, 'cie', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={diag.descripcion}
                    onChange={(e) => handleArrayChange('diagnosticosDefinitivos', index, 'descripcion', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('diagnosticosDefinitivos', index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded col-span-3"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('diagnosticosDefinitivos', { cie: '', descripcion: '' })}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Agregar Diagnóstico Definitivo
              </button>
            </div>
          )}

          {activeTab === 'planTratamiento' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Plan de Tratamiento</h2>
              {atencionEmergenciaData.planTratamiento.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Medicamento"
                    value={item.medicamento}
                    onChange={(e) => handleArrayChange('planTratamiento', index, 'medicamento', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Vía"
                    value={item.via}
                    onChange={(e) => handleArrayChange('planTratamiento', index, 'via', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <input
                    type="text"
                    placeholder="Dosis"
                    value={item.dosis}
                    onChange={(e) => handleArrayChange('planTratamiento', index, 'dosis', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <input
                    type="text"
                    placeholder="Posología"
                    value={item.posologia}
                    onChange={(e) => handleArrayChange('planTratamiento', index, 'posologia', e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <input
                    type="number"
                    placeholder="Días"
                    value={item.dias || ''}
                    onChange={(e) => handleArrayChange('planTratamiento', index, 'dias', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('planTratamiento', index)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded col-span-full"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('planTratamiento', { medicamento: '', via: '', dosis: '', posologia: '', dias: null })}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
              >
                Agregar Medicamento
              </button>
              <div className="mb-4">
                <label htmlFor="observacionesPlanTratamiento" className="block text-gray-700 text-sm font-bold mb-2">Observaciones del Plan de Tratamiento:</label>
                <textarea
                  id="observacionesPlanTratamiento"
                  name="observacionesPlanTratamiento"
                  value={atencionEmergenciaData.observacionesPlanTratamiento}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'condicionEgreso' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Condición al Egreso</h2>
              {signosVitalesData && signosVitalesData.sin_constantes_vitales && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-800 font-bold text-lg mb-2">⚠️ IMPORTANTE: Paciente llegó sin constantes vitales</p>
                  <p className="text-red-700 text-sm mb-2">
                    Si confirma el fallecimiento, seleccione <strong>"FALLECIDO"</strong> en la condición de egreso.
                  </p>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="condicionEgreso" className="block text-gray-700 text-sm font-bold mb-2">
                  Condición de Egreso: <span className="text-red-600">*</span>
                </label>
                <select
                  id="condicionEgreso"
                  name="condicionEgreso"
                  value={atencionEmergenciaData.condicionEgreso}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Seleccione...</option>
                  <option value="HOSPITALIZACION">HOSPITALIZACIÓN</option>
                  <option value="ALTA">ALTA</option>
                  <option value="ESTABLE">ESTABLE</option>
                  <option value="INESTABLE">INESTABLE</option>
                  <option value="FALLECIDO" className={signosVitalesData && signosVitalesData.sin_constantes_vitales ? 'bg-red-100 font-bold' : ''}>
                    FALLECIDO {signosVitalesData && signosVitalesData.sin_constantes_vitales ? '(Recomendado)' : ''}
                  </option>
                  <option value="ALTA_DEFINITIVA">ALTA DEFINITIVA</option>
                  <option value="CONSULTA_EXTERNA">CONSULTA EXTERNA</option>
                  <option value="OBSERVACION_EMERGENCIA">OBSERVACIÓN EN EMERGENCIA</option>
                </select>
                {signosVitalesData && signosVitalesData.sin_constantes_vitales && atencionEmergenciaData.condicionEgreso !== 'FALLECIDO' && (
                  <p className="text-red-600 text-xs mt-1">
                    ⚠️ Recuerde: Este paciente llegó sin constantes vitales. Debe confirmar la condición de egreso.
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="referenciaEgreso" className="block text-gray-700 text-sm font-bold mb-2">Referencia de Egreso:</label>
                <input
                  type="text"
                  id="referenciaEgreso"
                  name="referenciaEgreso"
                  value={atencionEmergenciaData.referenciaEgreso}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="establecimientoEgreso" className="block text-gray-700 text-sm font-bold mb-2">Establecimiento de Egreso:</label>
                <input
                  type="text"
                  id="establecimientoEgreso"
                  name="establecimientoEgreso"
                  value={atencionEmergenciaData.establecimientoEgreso}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción mejorados */}
        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/lista-espera')}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            ← Volver a Lista
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || readOnly}
          >
            {loading ? 'Guardando...' : 'Guardar Progreso'}
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
};

export default AtencionEmergenciaForm;