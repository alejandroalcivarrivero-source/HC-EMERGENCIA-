import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, differenceInYears, differenceInWeeks, parseISO } from 'date-fns'; // Para manejar fechas y horas
import RecetaMedicaForm from './RecetaMedicaForm'; // Importar el componente de Receta Médica
import OrdenExamenForm from './OrdenExamenForm'; // Importar el componente de Orden de Examen
import OrdenImagenForm from './OrdenImagenForm'; // Importar el componente de Orden de Imagen
import { Trash2, PlusCircle, AlertCircle, FileText } from 'lucide-react'; // Nuevos íconos

const API_BASE = 'http://localhost:3001/api';

/** Campos oficiales MSP Sección E (Antecedentes Patológicos) – orden y etiquetas */
const CAMPOS_ANTECEDENTES = [
  { key: 'alergicos', label: 'Alérgicos', num: 1 },
  { key: 'clinicos', label: 'Clínicos', num: 2 },
  { key: 'ginecologicos', label: 'Ginecológicos', num: 3 },
  { key: 'traumaticos', label: 'Traumatológicos', num: 4 },
  { key: 'pediatricos', label: 'Pediátricos', num: 5 },
  { key: 'quirurgicos', label: 'Quirúrgicos', num: 6 },
  { key: 'farmacologicos', label: 'Farmacológicos', num: 7 },
  { key: 'habitos', label: 'Hábitos', num: 8 },
  { key: 'familiares', label: 'Familiares', num: 9 },
  { key: 'otros', label: 'Otros', num: 10 },
];

/** Sección G: Escala de Glasgow – opciones según Form 008 / estándar internacional */
const GLASGOW_OCULAR = [
  { value: 4, label: 'Espontánea' },
  { value: 3, label: 'A la voz' },
  { value: 2, label: 'Al dolor' },
  { value: 1, label: 'Ninguna' },
];
const GLASGOW_VERBAL = [
  { value: 5, label: 'Orientado' },
  { value: 4, label: 'Confuso' },
  { value: 3, label: 'Palabras inapropiadas' },
  { value: 2, label: 'Sonidos' },
  { value: 1, label: 'Ninguno' },
];
const GLASGOW_MOTORA = [
  { value: 6, label: 'Obedece' },
  { value: 5, label: 'Localiza' },
  { value: 4, label: 'Retira' },
  { value: 3, label: 'Flexión' },
  { value: 2, label: 'Extensión' },
  { value: 1, label: 'Ninguna' },
];
/** Clasificación GCS – estándar ATLS (alertas de color) */
const glasgowSeveridad = (total) => {
  if (total == null || total < 3) return null;
  if (total === 15) return { texto: 'Normal', clase: 'text-green-700', bg: 'bg-green-50 border-green-200', alerta: null };
  if (total >= 9) return { texto: 'Alerta: Deterioro neurológico leve/moderado', clase: 'text-amber-800', bg: 'bg-amber-50 border-amber-300', alerta: null };
  return { texto: 'URGENCIA NEUROLÓGICA CRÍTICA: Evaluar asegurar vía aérea (Intubación)', clase: 'text-red-800 font-semibold', bg: 'bg-red-50 border-red-400 animate-pulse', alerta: 'critical' };
};
/** Reacción pupilar – Form 008 (descriptores oficiales) */
const REACCION_PUPILAR = [
  { value: 'ISOCORICAS', label: 'Isocóricas' },
  { value: 'MIOTICAS', label: 'Mióticas' },
  { value: 'MIDRIATICAS', label: 'Midriáticas' },
  { value: 'NO_REACTIVAS', label: 'No reactivas' },
];

/** Sección D (MSP): catálogo base por categoría (valores normalizados para detección/validación) */
const TIPOS_D = {
  accidentes: [
    { value: 'ACCIDENTE_TRANSITO', label: 'Accidente de Tránsito' },
    { value: 'ACCIDENTE_CAIDA', label: 'Caída' },
    { value: 'ACCIDENTE_LABORAL', label: 'Accidente Laboral' },
    { value: 'ACCIDENTE_QUEMADURA', label: 'Quemadura' },
    { value: 'ACCIDENTE_APLASTAMIENTO', label: 'Aplastamiento/Contusión' },
    { value: 'ACCIDENTE_OTRO', label: 'Otro Accidente' },
  ],
  violencia: [
    { value: 'VIOLENCIA_INTRAFAMILIAR', label: 'Violencia intrafamiliar' },
    { value: 'VIOLENCIA_SEXUAL', label: 'Violencia sexual' },
    { value: 'VIOLENCIA_ARMA_FUEGO', label: 'Agresión con arma de fuego' },
    { value: 'VIOLENCIA_ARMA_BLANCA', label: 'Agresión con arma blanca / punzocortante' },
    { value: 'VIOLENCIA_RINA', label: 'Agresión por riña' },
    { value: 'VIOLENCIA_PSICOLOGICA', label: 'Presunta violencia psicológica' },
    { value: 'VIOLENCIA_FISICA', label: 'Presunta violencia física' },
  ],
  intoxicaciones: [
    { value: 'INTOX_ALCOHOL', label: 'Intoxicación alcohólica' },
    { value: 'INTOX_DROGAS', label: 'Intoxicación por drogas' },
    { value: 'INTOX_ALIMENTARIA', label: 'Intoxicación alimentaria' },
    { value: 'INTOX_PLAGUICIDAS', label: 'Intoxicación por plaguicidas' },
    { value: 'INTOX_INHALACION_GASES', label: 'Inhalación de gases' },
    { value: 'INTOX_OTRA', label: 'Otra intoxicación' },
  ],
};

/** Sección H – 15 ítems normativos del Examen Físico Regional (Form 008) */
const EXAMEN_FISICO_REGIONAL_ITEMS = [
  { key: 'estado_general', label: 'Estado general', num: 1 },
  { key: 'piel_faneras', label: 'Piel y faneras', num: 2 },
  { key: 'cabeza', label: 'Cabeza', num: 3 },
  { key: 'ojos', label: 'Ojos', num: 4 },
  { key: 'oidos', label: 'Oídos', num: 5 },
  { key: 'nariz', label: 'Nariz', num: 6 },
  { key: 'boca', label: 'Boca', num: 7 },
  { key: 'orofaringe', label: 'Orofaringe', num: 8 },
  { key: 'cuello', label: 'Cuello', num: 9 },
  { key: 'axilas_mamas', label: 'Axilas y mamas', num: 10 },
  { key: 'torax', label: 'Tórax', num: 11 },
  { key: 'abdomen', label: 'Abdomen', num: 12 },
  { key: 'columna_vertebral', label: 'Columna vertebral', num: 13 },
  { key: 'miembros_superiores', label: 'Miembros superiores', num: 14 },
  { key: 'miembros_inferiores', label: 'Miembros inferiores', num: 15 },
];

/** Sección K – 16 ítems normativos de Exámenes Complementarios (Form 008). Triggers: Lab (010) 1–5, Imagen (012) 8–14, Interconsulta (007) 15, Otros 16 */
const ITEMS_SECCION_K = [
  { id: 1, label: 'Hemograma', categoria: 'LAB' },
  { id: 2, label: 'Química sanguínea', categoria: 'LAB' },
  { id: 3, label: 'Coagulación', categoria: 'LAB' },
  { id: 4, label: 'Gasometría', categoria: 'LAB' },
  { id: 5, label: 'Uroanálisis', categoria: 'LAB' },
  { id: 6, label: 'Heces', categoria: 'LAB' },
  { id: 7, label: 'Otros laboratorio', categoria: 'LAB' },
  { id: 8, label: 'Radiografía', categoria: 'IMAGEN' },
  { id: 9, label: 'Ecografía', categoria: 'IMAGEN' },
  { id: 10, label: 'TAC', categoria: 'IMAGEN' },
  { id: 11, label: 'RMN', categoria: 'IMAGEN' },
  { id: 12, label: 'EKG', categoria: 'IMAGEN' },
  { id: 13, label: 'Otros estudios de imagen', categoria: 'IMAGEN' },
  { id: 14, label: 'Otros imagen', categoria: 'IMAGEN' },
  { id: 15, label: 'Interconsulta', categoria: 'INTERCONSULTA' },
  { id: 16, label: 'Otros', categoria: 'OTROS' },
];

const DEFAULT_EXAMENES_K = () => ({
  examenes_no_aplica: false,
  items: Object.fromEntries([...Array(16)].map((_, i) => [i + 1, false])),
  observaciones: '',
});

const AtencionEmergenciaForm = ({ admisionData, atencionData, signosVitalesData, readOnly = false, onAlergiasChange, onRevaloracionMedica, formData, setFormData }) => {
  const { admisionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atencionIdFromSave, setAtencionIdFromSave] = useState(null); // id de atención creada por autoguardado en esta sesión
  const TABS = ['inicioAtencion', 'enfermedadActual', 'antecedentes', 'accidenteViolencia', 'seccionG', 'examenFisico', 'embarazoParto', 'examenesComplementarios', 'diagnosticos', 'planTratamiento', 'condicionEgreso'];
  const [activeTab, setActiveTab] = useState('inicioAtencion');
  const [examenRegionalRevision, setExamenRegionalRevision] = useState(0); // fuerza re-render de lista H al usar "Marcar todo como Normal"
  const [showRecetaModal, setShowRecetaModal] = useState(false); // Estado para controlar el modal de receta
  const [showOrdenExamenModal, setShowOrdenExamenModal] = useState(false); // Estado para controlar el modal de orden de examen
  const [showOrdenImagenModal, setShowOrdenImagenModal] = useState(false); // Estado para controlar el modal de orden de imagen
  const [showModalMefObstetricia, setShowModalMefObstetricia] = useState(false); // MEF: Mujer Edad Fértil sin estado gestación
  const [showModalObservacionesEstudios, setShowModalObservacionesEstudios] = useState(false); // K: estudios marcados sin justificación
  const [saving, setSaving] = useState(false); // Estado para indicar que se está guardando
  const [saved, setSaved] = useState(false); // Estado para indicar que se guardó exitosamente
  const [saveError, setSaveError] = useState(null); // Estado para errores de guardado
  const lastSavedRef = useRef(null); // Referencia al último estado guardado
  const timeoutRef = useRef(null); // Referencia al timeout de auto-save
  const existingAtencionIdRef = useRef(null); // Referencia al ID de atención existente
  const horaInicialRef = useRef(null); // Referencia a la hora inicial de captura (para persistencia)
  const fechaInicialRef = useRef(null); // Referencia a la fecha inicial de captura (para persistencia)
  const formDataRef = useRef(null); // Ref para “Marcar todo como Normal” (evitar prev obsoleto)

  const [newPlanItem, setNewPlanItem] = useState({ medicamento: '', via: '', dosis: '', posologia: '', dias: null }); // Nuevo estado para añadir ítems al plan

  // Modal para confirmar egreso por fallecimiento
  const [showConfirmFallecidoModal, setShowConfirmFallecidoModal] = useState(false);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    console.log("[AtencionEmergenciaForm] admisionData recibido:", admisionData);
    console.log("[AtencionEmergenciaForm] atencionData recibido:", atencionData);
    console.log("[AtencionEmergenciaForm] signosVitalesData recibido:", signosVitalesData);

    if (!admisionData || !signosVitalesData) {
      setLoading(true);
      return;
    }

    // Inicialización de formData con atencionData si existe o datos por defecto si no
    if (atencionData && Object.keys(formData).length === 0) { // Solo si formData está vacío
      existingAtencionIdRef.current = atencionData.id;
      
      fechaInicialRef.current = atencionData.fechaAtencion || format(new Date(), 'yyyy-MM-dd');
      horaInicialRef.current = atencionData.horaAtencion || format(new Date(), 'HH:mm');
      
      const apRaw = JSON.parse(atencionData.antecedentesPatologicos || '{}');
      const apKeys = { alergicos: '', clinicos: '', ginecologicos: '', traumaticos: '', pediatricos: '', quirurgicos: '', farmacologicos: '', habitos: '', familiares: '', otros: '' };
      const apNoAplicaDef = Object.keys(apKeys).reduce((o, k) => ({ ...o, [k]: false }), {});
      const apNormalized = { ...apKeys, ...apRaw, noAplicaGeneral: apRaw.noAplicaGeneral ?? false, noAplica: { ...apNoAplicaDef, ...(apRaw.noAplica || {}) } };
      
      const tipoDef = { seleccion: [], transito: { consumoSustancias: '', proteccion: { casco: false, cinturon: false } } };
      let tipoRaw = JSON.parse(atencionData.tipoAccidenteViolenciaIntoxicacion || '[]');
      let tipoNormalized = tipoDef;
      if (Array.isArray(tipoRaw)) {
        tipoNormalized = { ...tipoDef, seleccion: tipoRaw };
      } else if (tipoRaw && typeof tipoRaw === 'object') {
        tipoNormalized = {
          ...tipoDef,
          ...tipoRaw,
          seleccion: Array.isArray(tipoRaw.seleccion) ? tipoRaw.seleccion : [],
          transito: {
            ...tipoDef.transito,
            ...(tipoRaw.transito || {}),
            proteccion: {
              ...tipoDef.transito.proteccion,
              ...(((tipoRaw.transito || {})?.proteccion) || {})
            }
          }
        };
      }
      const parsedEf = JSON.parse(atencionData.examenFisico || '{}');
      const sv = signosVitalesData;
      const regionalDefaults = {};
      EXAMEN_FISICO_REGIONAL_ITEMS.forEach(({ key }) => {
        regionalDefaults[key] = parsedEf[key] ?? '';
        regionalDefaults[`${key}_normal`] = parsedEf[`${key}_normal`] ?? true;
      });
      const examenFisicoNorm = {
        ...parsedEf,
        ...regionalDefaults,
        pupilas_derecha: parsedEf.pupilas_derecha ?? '',
        pupilas_izquierda: parsedEf.pupilas_izquierda ?? '',
        tiempo_llenado_capilar: parsedEf.tiempo_llenado_capilar ?? '',
        glicemia_capilar: parsedEf.glicemia_capilar ?? sv?.glicemia_capilar ?? null,
        perimetro_cefalico: parsedEf.perimetro_cefalico ?? sv?.perimetro_cefalico ?? null,
        peso: parsedEf.peso ?? sv?.peso ?? null,
        talla: parsedEf.talla ?? sv?.talla ?? null
      };
      const ep = JSON.parse(atencionData.embarazoParto || '{}');
      const embarazoPartoNorm = { estadoGestacion: ep.estadoGestacion ?? '', ...ep };
      const ecRaw = JSON.parse(atencionData.examenesComplementarios || '{}');
      const ecNorm = (() => {
        if (Array.isArray(ecRaw)) return DEFAULT_EXAMENES_K();
        const items = {};
        for (let i = 1; i <= 16; i++) items[i] = !!(ecRaw.items && ecRaw.items[i]);
        return {
          examenes_no_aplica: !!ecRaw.examenes_no_aplica,
          items: { ...Object.fromEntries([...Array(16)].map((_, i) => [i + 1, false])), ...items },
          observaciones: (ecRaw.observaciones ?? '').toString().trim()
        };
      })();
      setFormData(prevData => ({ // Usar setFormData
        ...prevData,
        ...atencionData,
        enfermedadProblemaActual: atencionData.enfermedadProblemaActual || '',
        fechaAtencion: fechaInicialRef.current,
        horaAtencion: horaInicialRef.current,
        tipoAccidenteViolenciaIntoxicacion: tipoNormalized,
        antecedentesPatologicos: apNormalized,
        examenFisico: examenFisicoNorm,
        embarazoParto: embarazoPartoNorm,
        examenesComplementarios: ecNorm,
        planTratamiento: JSON.parse(atencionData.planTratamiento || '[]'),
      }));
      lastSavedRef.current = JSON.stringify({
        ...atencionData,
        tipoAccidenteViolenciaIntoxicacion: tipoNormalized,
        antecedentesPatologicos: apNormalized,
        examenFisico: examenFisicoNorm,
        embarazoParto: embarazoPartoNorm,
        examenesComplementarios: ecNorm,
        planTratamiento: JSON.parse(atencionData.planTratamiento || '[]'),
      }); // Inicializar referencia
    } else if (Object.keys(formData).length === 0) { // Si no hay atencionData y formData está vacío, inicializar con defaults
      const fechaActual = format(new Date(), 'yyyy-MM-dd');
      const horaActual = format(new Date(), 'HH:mm');
      const sv = signosVitalesData;
      setFormData(prevData => ({
        ...prevData,
        fechaAtencion: fechaActual,
        horaAtencion: horaActual,
        condicionLlegada: '',
        motivoAtencion: '',
        fechaEvento: '', horaEvento: '', lugarEvento: '', direccionEvento: '',
        custodiaPolicial: null, notificacion: null,
        tipoAccidenteViolenciaIntoxicacion: { seleccion: [], transito: { consumoSustancias: '', proteccion: { casco: false, cinturon: false } } },
        observacionesAccidente: '', sugestivoAlientoAlcoholico: null,
        antecedentesPatologicos: (() => {
          const keys = { alergicos: '', clinicos: '', ginecologicos: '', traumaticos: '', pediatricos: '', quirurgicos: '', farmacologicos: '', habitos: '', familiares: '', otros: '' };
          const noAplicaKeys = Object.keys(keys).reduce((o, k) => ({ ...o, [k]: false }), {});
          return { ...keys, noAplicaGeneral: false, noAplica: noAplicaKeys };
        })(),
        enfermedadProblemaActual: '',
        examenFisico: (() => {
          const regionalKeys = EXAMEN_FISICO_REGIONAL_ITEMS.map(i => i.key);
          const desc = Object.fromEntries(regionalKeys.map(k => [k, '']));
          const norm = Object.fromEntries(regionalKeys.map(k => [`${k}_normal`, true]));
          return {
            ...desc, ...norm,
            glasgow_ocular: null, glasgow_verbal: null, glasgow_motora: null,
            pupilas_derecha: '', pupilas_izquierda: '', tiempo_llenado_capilar: '',
            glicemia_capilar: sv?.glicemia_capilar ?? null, perimetro_cefalico: sv?.perimetro_cefalico ?? null,
            peso: sv?.peso ?? null, talla: sv?.talla ?? null
          };
        })(),
        examenFisicoTraumaCritico: '',
        embarazoParto: { estadoGestacion: '', numeroGestas: null, numeroPartos: null, numeroAbortos: null, numeroCesareas: null, fum: '', semanasGestacion: null, movimientoFetal: false, frecuenciaCardiacaFetal: null, rupturaMembranas: false, tiempo: '', afu: '', presentacion: '', dilatacion: '', borramiento: '', plano: '', pelvisViable: false, sangradoVaginal: false, contracciones: false, scoreMama: null },
        examenesComplementarios: DEFAULT_EXAMENES_K(),
        planTratamiento: [],
        observacionesPlanTratamiento: '',
        condicionEgreso: '', referenciaEgreso: '', establecimientoEgreso: ''
      }));
      lastSavedRef.current = null; // No hay datos guardados aún
    }

    setLoading(false);
    if (atencionData && admisionId) { // No usar formData aquí, ya que atencionData es la fuente de verdad inicial
      const saved = localStorage.getItem(`form008_tab_${admisionId}`);
      if (saved && TABS.includes(saved)) setActiveTab(saved);
      else if (saved === 'examenTrauma') setActiveTab('examenFisico');
    }
  }, [admisionData, atencionData, signosVitalesData, formData]); // Agregar formData a las dependencias

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

      const idAtencionParaBorrador = existingAtencionIdRef.current || atencionData?.id || parseInt(admisionId, 10);
      
      const dataToSendForBorrador = {
        idAtencion: idAtencionParaBorrador,
        datos: dataToSave // Enviamos el objeto completo, el controlador lo convertirá a JSON string
      };

      await axios.post(`${API_BASE}/atencion-emergencia/borrador`, dataToSendForBorrador, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
  }, [admisionData, admisionId, readOnly, atencionData, formData]); // Agregar formData a las dependencias

  // Auto-save con debounce (2 segundos después de dejar de escribir)
  useEffect(() => {
    if (loading || !admisionData || readOnly) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      autoSave(formData, false); // Usar formData
    }, 2000); // 2 segundos de delay

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, autoSave, loading, admisionData, readOnly]); // Usar formData en dependencias

  const handleTabChange = (newTab) => {
    autoSave(formData, true); // Usar formData
    if (admisionId) localStorage.setItem(`form008_tab_${admisionId}`, newTab);
    setActiveTab(newTab);
  };

  // Guardar al cerrar/recargar página (no en modo solo lectura)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (readOnly) return;
      if (JSON.stringify(formData) !== lastSavedRef.current) { // Usar formData
        const token = localStorage.getItem('token');
        if (token) {
          const idAtencionParaBorrador = existingAtencionIdRef.current || atencionData?.id || parseInt(admisionId, 10);

          const dataToSendForBorrador = {
            idAtencion: idAtencionParaBorrador,
            datos: formData // Enviamos el objeto completo
          };
          
          navigator.sendBeacon(
            `${API_BASE}/atencion-emergencia/borrador`,
            new Blob([JSON.stringify(dataToSendForBorrador)], { type: 'application/json' })
          );
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, admisionId, admisionData, readOnly, atencionData]); // Usar formData y atencionData en dependencias

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'condicionEgreso' && value === 'FALLECIDO') {
      setShowConfirmFallecidoModal(true); // Mostrar modal de confirmación
    }

    if (name === 'condicionLlegada') {
      setFormData(prevData => {
        const newData = {
          ...prevData,
          condicionLlegada: value
        };
        
        if (value === 'ESTABLE' || value === 'INESTABLE') {
          newData.fechaAtencion = fechaInicialRef.current || format(new Date(), 'yyyy-MM-dd');
          newData.horaAtencion = horaInicialRef.current || format(new Date(), 'HH:mm');
        }
        
        return newData;
      });
      return;
    }

    if (name === 'custodiaPolicial' || name === 'notificacion' || name === 'sugestivoAlientoAlcoholico') {
      setFormData(prevData => ({
        ...prevData,
        [name]: value === 'true' // Convertir a booleano
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleGenerarPreliminar = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_BASE}/firma-electronica/preview-preliminar/${admisionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `formulario_008_preliminar_${admisionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert('PDF Preliminar generado y descargado.');
    } catch (err) {
      console.error('Error al generar PDF Preliminar:', err);
      alert(err.response?.data?.message || 'Error al generar el PDF Preliminar.');
    }
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prevData => {
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

  /** Marcar todo como Normal en Sección H: usa el mismo handleNestedChange que el clic individual. */
  const handleMarcarTodoNormalExamenRegional = () => {
    EXAMEN_FISICO_REGIONAL_ITEMS.forEach(({ key }) => {
      handleNestedChange('examenFisico', key, '');
      handleNestedChange('examenFisico', `${key}_normal`, true);
    });
    setExamenRegionalRevision(r => r + 1);
  };

  const handleArrayChange = (section, index, field, value) => {
    setFormData(prevData => {
      const newArray = [...prevData[section]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prevData, [section]: newArray };
    });
  };

  const addArrayItem = (section, newItem) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: [...prevData[section], newItem]
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData(prevData => ({
      ...prevData,
      [section]: prevData[section].filter((_, i) => i !== index)
    }));
  };

  /** No aplica general para Sección E (Antecedentes) */
  const setNoAplicaGeneralAntecedentes = (value) => {
    setFormData(prev => ({
      ...prev,
      antecedentesPatologicos: { ...prev.antecedentesPatologicos, noAplicaGeneral: !!value }
    }));
  };

  /** No aplica por campo en Sección E */
  const setNoAplicaCampoAntecedente = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      antecedentesPatologicos: {
        ...prev.antecedentesPatologicos,
        noAplica: { ...(prev.antecedentesPatologicos.noAplica || {}), [fieldKey]: !!value }
      }
    }));
  };

  /** Sección K: marcar/desmarcar ítem de exámenes complementarios (1–16) */
  const setExamenItemK = (num, checked) => {
    setFormData(prev => {
      const ec = prev.examenesComplementarios || DEFAULT_EXAMENES_K();
      return {
        ...prev,
        examenesComplementarios: {
          ...ec,
          items: { ...(ec.items || {}), [num]: !!checked }
        }
      };
    });
  };

  /** Sección K: activar "No Aplica" — limpia ítems y observaciones, deshabilita edición de la sección */
  const setNoAplicaEstudiosK = () => {
    setFormData(prev => ({
      ...prev,
      examenesComplementarios: {
        ...DEFAULT_EXAMENES_K(),
        examenes_no_aplica: true,
        items: Object.fromEntries([...Array(16)].map((_, i) => [i + 1, false])),
        observaciones: ''
      }
    }));
  };

  /** Notificar al padre cambio en alergias (para alerta en header del paciente). Evita sobrescribir con [] en el primer render antes de cargar desde atencionData. */
  const alergiasReportedOnce = useRef(false);
  useEffect(() => {
    if (typeof onAlergiasChange !== 'function') return;
    const txt = (formData?.antecedentesPatologicos?.alergicos || '').trim();
    const arr = txt ? txt.split(/[,;]/).map(a => a.trim()).filter(Boolean) : [];
    if (!alergiasReportedOnce.current && atencionData && arr.length === 0) {
      alergiasReportedOnce.current = true;
      return;
    }
    alergiasReportedOnce.current = true;
    onAlergiasChange(arr);
  }, [formData?.antecedentesPatologicos?.alergicos, onAlergiasChange, atencionData, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paciente = admisionData?.Paciente;
    const sexo = (paciente?.sexo || paciente?.Sexo?.nombre || '').trim();
    const edadAnios = paciente?.fecha_nacimiento ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento)) : null;
    const esMasculino = /^(masculino|hombre)$/i.test(sexo);
    const esMEF = !esMasculino && edadAnios != null && edadAnios >= 10 && edadAnios <= 49;
    const estadoGest = formData?.embarazoParto?.estadoGestacion || '';
    if (esMEF && !estadoGest) {
      setShowModalMefObstetricia(true);
      return;
    }
    const ec = formData?.examenesComplementarios || DEFAULT_EXAMENES_K();
    if (!ec.examenes_no_aplica) {
      const algunItem = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].some(i => !!(ec.items && ec.items[i]));
      const obs = (ec.observaciones ?? '').toString().trim();
      if (algunItem && !obs) {
        setShowModalObservacionesEstudios(true);
        return;
      }
    }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { diagnosticosPresuntivos, diagnosticosDefinitivos, ...dataToSaveForAtencion } = formData;
      
      const dataToSend = {
        ...dataToSaveForAtencion,
        pacienteId: admisionData.pacienteId,
        admisionId: parseInt(admisionId),
        tipoAccidenteViolenciaIntoxicacion: JSON.stringify(formData.tipoAccidenteViolenciaIntoxicacion),
        antecedentesPatologicos: JSON.stringify(formData.antecedentesPatologicos),
        examenFisico: JSON.stringify(formData.examenFisico),
        embarazoParto: JSON.stringify(formData.embarazoParto),
        examenesComplementarios: JSON.stringify(formData.examenesComplementarios),
        planTratamiento: JSON.stringify(formData.planTratamiento),
      };
      console.log('[AtencionEmergenciaForm] Datos a enviar para atención principal:', dataToSend);

      const finalEstadoFirma = atencionData?.estadoFirma === 'FINALIZADO_FIRMADO' ? 'FINALIZADO_FIRMADO' : 'PENDIENTE_FIRMA';
      const dataToSendWithEstado = { ...dataToSend, estadoFirma: finalEstadoFirma };

      if (existingAtencionIdRef.current) {
        await axios.put(`${API_BASE}/atencion-emergencia/${existingAtencionIdRef.current}`, dataToSendWithEstado, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Atención de emergencia actualizada exitosamente y marcada como PENDIENTE DE FIRMA.');
      } else {
        const existingAtencionResponse = await axios.get(`${API_BASE}/atencion-emergencia/admision/${admisionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response && err.response.status === 404) {
            console.log('[AtencionEmergenciaForm] No existe atención previa, se procederá a crear.');
            return null;
          }
          console.error('[AtencionEmergenciaForm] Error al verificar atención existente:', err);
          throw err;
        });

        if (existingAtencionResponse && existingAtencionResponse.data) {
          existingAtencionIdRef.current = existingAtencionResponse.data.id;
          await axios.put(`${API_BASE}/atencion-emergencia/${existingAtencionResponse.data.id}`, dataToSendWithEstado, {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Atención de emergencia actualizada exitosamente y marcada como PENDIENTE DE FIRMA.');
        } else {
          const response = await axios.post(`${API_BASE}/atencion-emergencia`, dataToSendWithEstado, {
            headers: { Authorization: `Bearer ${token}` }
          });
          existingAtencionIdRef.current = response.data.id;
          setAtencionIdFromSave(response.data.id);
          alert('Atención de emergencia creada exitosamente y marcada como PENDIENTE DE FIRMA.');
        }
      }

      let nuevoEstadoAtencion = 'EN_ATENCION';
      if (formData.condicionEgreso === 'HOSPITALIZACION') {
        nuevoEstadoAtencion = 'HOSPITALIZADO';
      } else if (formData.condicionEgreso === 'OBSERVACION_EMERGENCIA') {
        nuevoEstadoAtencion = 'OBSERVACION';
      } else if (formData.condicionEgreso === 'FALLECIDO') {
        nuevoEstadoAtencion = 'FALLECIDO';
        try {
          await axios.put(`${API_BASE}/usuarios/admisiones/${admisionId}/estado`, {
            estado_paciente: 'FALLECIDO',
            fecha_hora_fallecimiento: new Date().toISOString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Fecha de fallecimiento actualizada en la admisión.');
        } catch (fallecimientoError) {
          console.error('Error al actualizar fecha de fallecimiento:', fallecimientoError);
        }
      } else if (formData.condicionEgreso === 'ALTA' || formData.condicionEgreso === 'ALTA_DEFINITIVA' || formData.condicionEgreso === 'CONSULTA_EXTERNA') {
        nuevoEstadoAtencion = 'ATENDIDO';
      }

      await axios.put(`${API_BASE}/atencion-paciente-estado/${admisionId}/estado`, { estado: nuevoEstadoAtencion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Estado del paciente actualizado a: ${nuevoEstadoAtencion}`);

      navigate('/lista-espera');
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
  
  const triajeColor = admisionData.TriajeDefinitivo?.color || 
                      (admisionData.triajeDefinitivo === 'RESUCITACIÓN' ? 'Rojo' : 
                       admisionData.triajeDefinitivo === 'EMERGENCIA' ? 'Naranja' :
                       admisionData.triajeDefinitivo === 'URGENCIA' ? 'Amarillo' :
                       admisionData.triajeDefinitivo === 'SIN URGENCIA' ? 'Verde' :
                       admisionData.triajeDefinitivo === 'URGENCIA MENOR' ? 'Azul' : 'Gris');
  
  const triajeNombre = admisionData.TriajeDefinitivo?.nombre || admisionData.triajeDefinitivo || 'N/A';
  
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
        {/* Botón para generar PDF Preliminar */}
        {!readOnly && (activeTab === 'condicionEgreso' || activeTab === 'planTratamiento') && (
            <div className="mb-4 text-right">
                <button
                    type="button"
                    onClick={handleGenerarPreliminar}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2 float-right"
                >
                    <FileText className="w-4 h-4" />
                    Generar Preliminar
                </button>
            </div>
        )}
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
                activeTab === 'seccionG' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('seccionG')}
              title="Valoración Neurológica y Constantes (Sección G)"
            >
              Valoración Neurológica y Constantes
            </button>
            <button
              type="button"
              className={`py-3 px-5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === 'examenFisico' 
                  ? 'border-b-3 border-blue-600 text-blue-700 bg-blue-50 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleTabChange('examenFisico')}
              title="Evaluación física general y trauma/crítico (Secciones H e I)"
            >
              🔍 Examen Físico
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
                    value={formData.fechaAtencion || ''}
                    onChange={handleChange}
                    required
                    readOnly={formData.condicionLlegada !== 'FALLECIDO'}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formData.condicionLlegada !== 'FALLECIDO' 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'bg-white'
                    }`}
                    title={
                      formData.condicionLlegada !== 'FALLECIDO' 
                        ? 'Fecha automática capturada al inicio de la atención. Solo editable para pacientes fallecidos.' 
                        : 'Editable solo para pacientes fallecidos'
                    }
                  />
                  {formData.condicionLlegada !== 'FALLECIDO' && (
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
                    value={formData.horaAtencion || ''}
                    onChange={handleChange}
                    required
                    readOnly={formData.condicionLlegada !== 'FALLECIDO'}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      formData.condicionLlegada !== 'FALLECIDO' 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : 'bg-white'
                    }`}
                    title={
                      formData.condicionLlegada !== 'FALLECIDO' 
                        ? 'Hora automática capturada al inicio de la atención. Solo editable para pacientes fallecidos.' 
                        : 'Editable solo para pacientes fallecidos'
                    }
                  />
                  {formData.condicionLlegada !== 'FALLECIDO' && (
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
                      formData.condicionLlegada === 'ESTABLE'
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
                      formData.condicionLlegada === 'INESTABLE'
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
                      formData.condicionLlegada === 'FALLECIDO'
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
                  value={formData.motivoAtencion || (admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma || '')}
                  onChange={handleChange}
                  rows={4}
                  placeholder={admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma ? `Motivo de admisión: ${admisionData.MotivoConsultaSintoma.Motivo_Consulta_Sintoma}` : 'Describa el motivo de atención...'}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {admisionData.MotivoConsultaSintoma?.Motivo_Consulta_Sintoma && !formData.motivoAtencion && (
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

          {activeTab === 'accidenteViolencia' && (() => {
                const d = formData.tipoAccidenteViolenciaIntoxicacion || {};
                const seleccion = Array.isArray(d.seleccion) ? d.seleccion : [];
                const eventoRequerido = seleccion.length > 0;
                const hayViolencia = seleccion.some(v => String(v).startsWith('VIOLENCIA_'));
                const esTransito = seleccion.includes('ACCIDENTE_TRANSITO');
                const obs = String(formData.observacionesAccidente || '');
                const obsLen = obs.trim().length;

                const toggleTipo = (value) => {
                  setFormData(prev => {
                    const cur = prev.tipoAccidenteViolenciaIntoxicacion || {};
                    const sel = Array.isArray(cur.seleccion) ? cur.seleccion : [];
                    const existe = sel.includes(value);
                    const nextSel = existe ? sel.filter(x => x !== value) : [...sel, value];
                    const next = { ...cur, seleccion: nextSel };
                    if (existe && value === 'ACCIDENTE_TRANSITO') {
                      next.transito = { consumoSustancias: '', proteccion: { casco: false, cinturon: false } };
                    }
                    return { ...prev, tipoAccidenteViolenciaIntoxicacion: next };
                  });
                };

                const setTransito = (patch) => {
                  setFormData(prev => {
                    const cur = prev.tipoAccidenteViolenciaIntoxicacion || {};
                    const base = cur.transito || {};
                    const baseProt = (base.proteccion || {});
                    const patchProt = (patch.proteccion || {});
                    return { ...prev,
                      tipoAccidenteViolenciaIntoxicacion: {
                        ...cur,
                        transito: {
                          ...base,
                          ...patch,
                          proteccion: { ...baseProt, ...patchProt }
                        }
                      }
                    };
                  });
                };

                return (
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <h2 className="text-xl font-semibold text-gray-800">Accidente, Violencia, Intoxicación</h2>
                      <span className="text-xs text-gray-500">(Sección D)</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">
                      Registro normativo MSP Ecuador y estándares de trauma. Complete el relato con precisión clínica y legal.
                    </p>

                    {/* Selección por categorías */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      {[
                        { title: 'Accidentes', items: TIPOS_D.accidentes, color: 'border-sky-100 bg-sky-50/40' },
                        { title: 'Violencia', items: TIPOS_D.violencia, color: 'border-rose-100 bg-rose-50/40' },
                        { title: 'Intoxicaciones', items: TIPOS_D.intoxicaciones, color: 'border-amber-100 bg-amber-50/40' },
                      ].map((cat) => (
                        <div key={cat.title} className={`rounded-xl border p-4 ${cat.color}`}>
                          <h3 className="text-sm font-semibold text-gray-800 mb-3">{cat.title}</h3>
                          <div className="space-y-2">
                            {cat.items.map((it) => (
                              <label key={it.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={seleccion.includes(it.value)}
                                  onChange={() => toggleTipo(it.value)}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{it.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Datos requeridos del evento (si se selecciona algún tipo) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="fechaEvento" className="block text-gray-700 text-sm font-bold mb-2">
                          Fecha del evento{eventoRequerido && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          type="date"
                          id="fechaEvento"
                          name="fechaEvento"
                          value={formData.fechaEvento || ''}
                          onChange={handleChange}
                          required={eventoRequerido}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                      <div>
                        <label htmlFor="horaEvento" className="block text-gray-700 text-sm font-bold mb-2">
                          Hora del evento{eventoRequerido && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          type="time"
                          id="horaEvento"
                          name="horaEvento"
                          value={formData.horaEvento || ''}
                          onChange={handleChange}
                          required={eventoRequerido}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                      <div>
                        <label htmlFor="lugarEvento" className="block text-gray-700 text-sm font-bold mb-2">
                          Lugar del evento{eventoRequerido && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          type="text"
                          id="lugarEvento"
                          name="lugarEvento"
                          value={formData.lugarEvento || ''}
                          onChange={handleChange}
                          required={eventoRequerido}
                          placeholder="Ej.: Vía pública, domicilio, trabajo, escuela…"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                      <div>
                        <label htmlFor="direccionEvento" className="block text-gray-700 text-sm font-bold mb-2">
                          Dirección{eventoRequerido && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          type="text"
                          id="direccionEvento"
                          name="direccionEvento"
                          value={formData.direccionEvento || ''}
                          onChange={handleChange}
                          required={eventoRequerido}
                          placeholder="Calle, barrio, referencia…"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-xl border border-gray-100 bg-white">
                        <p className="block text-gray-700 text-sm font-bold mb-2">
                          Custodia Policial{eventoRequerido && <span className="text-red-500"> *</span>}
                        </p>
                        <div className="flex items-center gap-6">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              className="form-radio"
                              name="custodiaPolicial"
                              value="true"
                              checked={formData.custodiaPolicial === true}
                              onChange={handleChange}
                              required={eventoRequerido}
                              disabled={readOnly}
                            />
                            <span className="text-sm text-gray-700">Sí</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              className="form-radio"
                              name="custodiaPolicial"
                              value="false"
                              checked={formData.custodiaPolicial === false}
                              onChange={handleChange}
                              required={eventoRequerido}
                              disabled={readOnly}
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-gray-100 bg-white">
                        <p className="block text-gray-700 text-sm font-bold mb-2">
                          Notificación{eventoRequerido && <span className="text-red-500"> *</span>}
                        </p>
                        <div className="flex items-center gap-6">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              className="form-radio"
                              name="notificacion"
                              value="true"
                              checked={formData.notificacion === true}
                              onChange={handleChange}
                              required={eventoRequerido}
                              disabled={readOnly}
                            />
                            <span className="text-sm text-gray-700">Sí</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              className="form-radio"
                              name="notificacion"
                              value="false"
                              checked={formData.notificacion === false}
                              onChange={handleChange}
                              required={eventoRequerido}
                              disabled={readOnly}
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                        {hayViolencia && formData.notificacion !== true && (
                          <p className="mt-2 text-xs text-rose-700">
                            Previsión 094: por tratarse de violencia, se requiere notificación legal obligatoria (registre y coordine según protocolo).
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Filtro de seguridad vial (protocolos internacionales) */}
                    {esTransito && (
                      <div className="mb-5 p-4 rounded-2xl border border-sky-200 bg-sky-50">
                        <h3 className="text-sm font-semibold text-sky-900 mb-3">Accidente de Tránsito – Seguridad vial</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Consumo de sustancias</label>
                            <select
                              value={(d.transito && d.transito.consumoSustancias) || ''}
                              onChange={(e) => setTransito({ consumoSustancias: e.target.value })}
                              disabled={readOnly}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                              <option value="">Seleccionar…</option>
                              <option value="NO">No</option>
                              <option value="SI">Sí</option>
                              <option value="NO_CONSTA">No consta</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Alineado a registro de trauma: sustancia/alcohol u otras.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Uso de protección</label>
                            <div className="flex items-center gap-5 flex-wrap">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!((d.transito && d.transito.proteccion && d.transito.proteccion.casco) || false)}
                                  onChange={(e) => setTransito({ proteccion: { casco: e.target.checked } })}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">Casco</span>
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!((d.transito && d.transito.proteccion && d.transito.proteccion.cinturon) || false)}
                                  onChange={(e) => setTransito({ proteccion: { cinturon: e.target.checked } })}
                                  disabled={readOnly}
                                  className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm text-gray-700">Cinturón</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Observaciones periciales (obligatorias si hay violencia) */}
                    <div className="mb-4">
                      <label htmlFor="observacionesAccidente" className="block text-gray-700 text-sm font-bold mb-2">
                        Observaciones{hayViolencia && <span className="text-red-500"> *</span>}
                      </label>
                      <textarea
                        id="observacionesAccidente"
                        name="observacionesAccidente"
                        value={formData.observacionesAccidente || ''}
                        onChange={handleChange}
                        minLength={hayViolencia ? 100 : undefined}
                        required={hayViolencia}
                        placeholder={hayViolencia ? 'Describa el relato pericial (mínimo 100 caracteres): mecanismo, agresor si aplica, tiempo, hallazgos, contexto…' : 'Observaciones clínicas y del evento…'}
                        className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                          hayViolencia && obsLen > 0 && obsLen < 100 ? 'border-rose-400' : 'text-gray-700'
                        }`}
                        rows={5}
                      />
                      {hayViolencia && (
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs ${obsLen < 100 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {obsLen < 100 ? `⚠️ Relato insuficiente (${obsLen}/100).` : '✅ Relato pericial completo.'}
                          </span>
                          <span className="text-xs text-gray-500">Requisito de calidad legal (MSP).</span>
                        </div>
                      )}
                    </div>

                    {/* Aliento alcohólico */}
                    <div className="mb-2">
                      <p className="block text-gray-700 text-sm font-bold mb-2">
                        Sugestivo de aliento alcohólico{eventoRequerido && <span className="text-red-500"> *</span>}
                      </p>
                      <div className="flex items-center gap-6">
                        <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              className="form-radio"
                              name="sugestivoAlientoAlcoholico"
                              value="true"
                              checked={formData.sugestivoAlientoAlcoholico === true}
                              onChange={handleChange}
                              required={eventoRequerido}
                              disabled={readOnly}
                            />
                            <span className="text-sm text-gray-700">Sí</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              className="form-radio"
                              name="sugestivoAlientoAlcoholico"
                              value="false"
                              checked={formData.sugestivoAlientoAlcoholico === false}
                              onChange={handleChange}
                              required={eventoRequerido}
                              disabled={readOnly}
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()}

          {activeTab === 'antecedentes' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">Sección E – Antecedentes Patológicos</h2>
              <p className="text-sm text-gray-500 mb-4">Centro de Salud Chone – Formulario 008 (MSP)</p>
              {/* No aplica general */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">No aplica (todos los antecedentes)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!(formData.antecedentesPatologicos?.noAplicaGeneral)}
                      onChange={(e) => setNoAplicaGeneralAntecedentes(e.target.checked)}
                      disabled={readOnly}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-600">No aplica</span>
                  </div>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CAMPOS_ANTECEDENTES.map(({ key, label, num }) => {
                  const ap = formData.antecedentesPatologicos || {};
                  const valor = ap[key] != null ? ap[key] : "";
                  const noAplicaCampo = !!(ap.noAplica && ap.noAplica[key]);
                  const rows = Math.max(2, 1 + (String(valor).split("\n").length || 0));
                  return (
                    <div key={key} className="border border-gray-100 rounded-xl p-4 bg-white hover:border-gray-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={`antecedentes-${key}`} className="text-sm font-semibold text-gray-800">
                          {num}. {label}
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={noAplicaCampo}
                            onChange={(e) => setNoAplicaCampoAntecedente(key, e.target.checked)}
                            disabled={readOnly || !!ap.noAplicaGeneral}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-gray-500">No aplica</span>
                        </label>
                      </div>
                      <textarea
                        id={`antecedentes-${key}`}
                        value={valor}
                        onChange={(e) => handleNestedChange("antecedentesPatologicos", key, e.target.value)}
                        disabled={readOnly || noAplicaCampo || !!ap.noAplicaGeneral}
                        placeholder={noAplicaCampo || ap.noAplicaGeneral ? "—" : `Describa antecedentes ${label.toLowerCase()}…`}
                        rows={Math.min(6, rows)}
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-y disabled:bg-gray-50 disabled:text-gray-400 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'enfermedadActual' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Problema Actual</h2>
              
              {/* Plantillas rápidas */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Plantillas Rápidas:</label>
                <div className="flex flex-wrap gap-2">
                  {["Dolor", "Fiebre", "Trauma", "Dificultad Respiratoria", "Dolor Abdominal", "Cefalea", "Vómitos", "Diarrea"].map((plantilla) => (
                    <button
                      key={plantilla}
                      type="button"
                      onClick={() => {
                        const textoActual = formData.enfermedadProblemaActual || "";
                        const nuevoTexto = textoActual ? `${textoActual}\n• ${plantilla}` : `• ${plantilla}`;
                        handleChange({ target: { name: "enfermedadProblemaActual", value: nuevoTexto } });
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
                  value={formData.enfermedadProblemaActual || ""}
                  onChange={handleChange}
                  rows={8}
                  minLength={20}
                  required
                  placeholder="Describa detalladamente el problema o enfermedad actual del paciente (mínimo 20 caracteres)..."
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    (formData.enfermedadProblemaActual || '').length > 0 && (formData.enfermedadProblemaActual || '').length < 20
                      ? "border-yellow-500"
                      : ""
                  }`}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-600">
                    {(formData.enfermedadProblemaActual || '').length < 20 ? (
                      <span className="text-yellow-600">
                        ⚠️ Mínimo 20 caracteres requeridos ({(formData.enfermedadProblemaActual || '').length}/20)
                      </span>
                    ) : (
                      <span className="text-green-600">
                        ✅ Descripción completa ({(formData.enfermedadProblemaActual || '').length} caracteres)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(formData.enfermedadProblemaActual || '').length} caracteres
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seccionG' && (() => {
            const edadAnios = admisionData?.Paciente?.fecha_nacimiento
              ? differenceInYears(new Date(), parseISO(admisionData.Paciente.fecha_nacimiento))
              : null;
            const esPediatrico = edadAnios != null && edadAnios <= 14;
            return (
            <div className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Valoración Neurológica y Constantes</h2>

              {/* Constantes precargadas (cabecera): TA, FC, FR, Temp, SpO2, Peso, Talla, Perímetro Cefálico */}
              {signosVitalesData && !signosVitalesData.sin_constantes_vitales && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-100 pb-4 mb-4 text-sm">
                  {signosVitalesData.presion_arterial != null && <span><span className="text-gray-500">TA:</span> <strong>{signosVitalesData.presion_arterial}</strong></span>}
                  {signosVitalesData.frecuencia_cardiaca != null && <span><span className="text-gray-500">FC:</span> <strong>{signosVitalesData.frecuencia_cardiaca}</strong></span>}
                  {signosVitalesData.frecuencia_respiratoria != null && <span><span className="text-gray-500">FR:</span> <strong>{signosVitalesData.frecuencia_respiratoria}</strong></span>}
                  {signosVitalesData.temperatura != null && <span><span className="text-gray-500">Temp:</span> <strong>{signosVitalesData.temperatura}°</strong></span>}
                  {signosVitalesData.saturacion_oxigeno != null && <span><span className="text-gray-500">SpO₂:</span> <strong>{signosVitalesData.saturacion_oxigeno}%</strong></span>}
                  {signosVitalesData.peso != null && <span><span className="text-gray-500">Peso:</span> <strong>{signosVitalesData.peso} kg</strong></span>}
                  {signosVitalesData.talla != null && <span><span className="text-gray-500">Talla:</span> <strong>{signosVitalesData.talla} cm</strong></span>}
                  <span><span className="text-gray-500">Perím. cef.:</span> <strong>{esPediatrico && signosVitalesData.perimetro_cefalico != null ? `${signosVitalesData.perimetro_cefalico} cm` : 'N/A'}</strong></span>
                </div>
              )}

              {/* Glasgow: Ocular (4), Verbal (5), Motora (6) – alertas ATLS */}
              {(() => {
                const o = formData.examenFisico.glasgow_ocular;
                const v = formData.examenFisico.glasgow_verbal;
                const m = formData.examenFisico.glasgow_motora;
                const total = (o != null && v != null && m != null) ? o + v + m : null;
                const sev = glasgowSeveridad(total);
                const totalClase = total == null ? 'text-gray-500' : total >= 9 && total < 15 ? 'text-amber-700 font-semibold' : total < 9 ? 'text-red-700 font-bold animate-pulse' : 'text-gray-800';
                const bgBox = total != null && total >= 9 && total < 15 ? 'bg-amber-50/50 border-amber-200' : total != null && total < 9 ? 'bg-red-50/50 border-red-300 animate-pulse' : 'bg-white border-gray-200';
                return (
                  <div className={`border rounded-lg p-4 ${bgBox}`}>
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Escala de Glasgow (total sobre 15)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ocular (4)</label>
                        <select
                          value={formData.examenFisico.glasgow_ocular ?? ''}
                          onChange={(e) => handleNestedChange('examenFisico', 'glasgow_ocular', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white"
                          disabled={readOnly}
                        >
                          <option value="">— Seleccionar —</option>
                          {GLASGOW_OCULAR.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Verbal (5)</label>
                        <select
                          value={formData.examenFisico.glasgow_verbal ?? ''}
                          onChange={(e) => handleNestedChange('examenFisico', 'glasgow_verbal', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white"
                          disabled={readOnly}
                        >
                          <option value="">— Seleccionar —</option>
                          {GLASGOW_VERBAL.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motora (6)</label>
                        <select
                          value={formData.examenFisico.glasgow_motora ?? ''}
                          onChange={(e) => handleNestedChange('examenFisico', 'glasgow_motora', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 bg-white"
                          disabled={readOnly}
                        >
                          <option value="">— Seleccionar —</option>
                          {GLASGOW_MOTORA.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600">Total GCS:</span>
                      <span className={`text-lg ${totalClase}`}>{total ?? '—'}</span>
                      {total != null && total < 9 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded text-sm font-semibold">Urgencia: Asegurar vía aérea</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Reacción pupilar Derecha e Izquierda */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Reacción pupilar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Derecha</label>
                    <select
                      value={formData.examenFisico.pupilas_derecha ?? ''}
                      onChange={(e) => handleNestedChange('examenFisico', 'pupilas_derecha', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
                      disabled={readOnly}
                    >
                      <option value="">— Seleccionar —</option>
                      {REACCION_PUPILAR.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Izquierda</label>
                    <select
                      value={formData.examenFisico.pupilas_izquierda ?? ''}
                      onChange={(e) => handleNestedChange('examenFisico', 'pupilas_izquierda', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500"
                      disabled={readOnly}
                    >
                      <option value="">— Seleccionar —</option>
                      {REACCION_PUPILAR.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Valoración médica: solo llenado capilar y glicemia (perímetro cefálico solo arriba en constantes) */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Valoración médica</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de llenado capilar (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      value={formData.examenFisico.tiempo_llenado_capilar ?? ''}
                      onChange={(e) => handleNestedChange('examenFisico', 'tiempo_llenado_capilar', e.target.value === '' ? '' : e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Opcional (disponibilidad de insumos)"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Glicemia capilar (mg/dl)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={20}
                      max={600}
                      value={formData.examenFisico.glicemia_capilar ?? ''}
                      onChange={(e) => handleNestedChange('examenFisico', 'glicemia_capilar', e.target.value === '' ? null : parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Opcional (disponibilidad de insumos)"
                      disabled={readOnly || (signosVitalesData?.glicemia_capilar != null)}
                      title={signosVitalesData?.glicemia_capilar != null ? 'Registrado por enfermería' : 'Opcional'}
                    />
                    {signosVitalesData?.glicemia_capilar != null && <span className="text-xs text-gray-500">(desde enfermería)</span>}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {activeTab === 'examenFisico' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-6">
                {/* Sección H: Examen Físico Regional (Sistemático) — 60% */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">H. Examen Físico Regional (Sistemático)</h2>
                    <button
                      type="button"
                      onClick={handleMarcarTodoNormalExamenRegional}
                      disabled={readOnly}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Marcar todo como Normal
                    </button>
                  </div>
                  <div key={`examen-regional-${examenRegionalRevision}`} className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                    {EXAMEN_FISICO_REGIONAL_ITEMS.map(({ key, label, num }) => {
                      const ef = formData.examenFisico || {};
                      const esNormal = ef[`${key}_normal`] !== false;
                      return (
                        <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                          <label className={`flex items-center gap-2 cursor-pointer ${esNormal ? 'text-gray-500' : 'text-gray-800'}`}>
                            <input
                              type="checkbox"
                              checked={esNormal}
                              onChange={(e) => handleNestedChange('examenFisico', `${key}_normal`, e.target.checked)}
                              disabled={readOnly}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              title={esNormal ? 'Normal (marcado)' : 'Marcar como Normal para ocultar hallazgo'}
                            />
                            <span className="text-sm font-medium">{num}. {label}</span>
                            {esNormal && <span className="text-xs text-gray-400">Normal</span>}
                            {!esNormal && <span className="text-xs text-amber-600">Patológico — describa hallazgo abajo</span>}
                          </label>
                          {!esNormal && (
                            <div className="mt-2 ml-6">
                              <textarea
                                id={`examenFisico-${key}`}
                                value={ef[key] || ''}
                                onChange={(e) => handleNestedChange('examenFisico', key, e.target.value)}
                                disabled={readOnly}
                                placeholder="Descripción del hallazgo..."
                                className="w-full text-sm border border-gray-200 rounded-md py-1.5 px-2 text-gray-700 focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sección I: Examen de Trauma / Crítico — 40% */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">I. Examen Físico de Trauma / Crítico</h2>
                  {(() => {
                    const d = formData.tipoAccidenteViolenciaIntoxicacion || {};
                    const seleccion = Array.isArray(d.seleccion) ? d.seleccion : [];
                    const hayEventoTraumatico = seleccion.length > 0;
                    return (
                      <div className={hayEventoTraumatico ? 'rounded-lg border-2 border-amber-300 bg-amber-50/30 p-3' : ''}>
                        <textarea
                          id="examenFisicoTraumaCritico"
                          name="examenFisicoTraumaCritico"
                          value={formData.examenFisicoTraumaCritico || ''}
                          onChange={handleChange}
                          disabled={readOnly}
                          placeholder="Describa hallazgos según esquema ABCDE (Vía aérea, Respiración, Circulación, Déficit neurológico, Exposición). ATLS / estándar internacional."
                          className="w-full min-h-[280px] text-sm border border-gray-200 rounded-md py-2 px-3 text-gray-700 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          rows={12}
                        />
                        {hayEventoTraumatico && (
                          <p className="mt-2 text-xs text-amber-700">Priorice el llenado de esta sección por evento traumático registrado.</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'embarazoParto' && (() => {
            const paciente = admisionData?.Paciente;
            const sexo = (paciente?.sexo || paciente?.Sexo?.nombre || '').trim();
            const esMasculino = /^(masculino|hombre)$/i.test(sexo);
            const edadAnios = paciente?.fecha_nacimiento ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento)) : null;
            const esMEF = !esMasculino && edadAnios != null && edadAnios >= 10 && edadAnios <= 49;
            const ep = formData.embarazoParto || {};
            const estadoGestacion = ep.estadoGestacion || '';
            const embarazoVigente = estadoGestacion === 'SI' || estadoGestacion === 'SOSPECHA';
            const fumVal = ep.fum || '';
            const semanasAuto = fumVal ? differenceInWeeks(new Date(), parseISO(fumVal)) : null;
            const semanasGestacion = ep.semanasGestacion != null ? ep.semanasGestacion : semanasAuto;
            const deshabilitarSeccion = readOnly || esMasculino;
            const sv = signosVitalesData;
            const paRaw = sv?.presion_arterial;
            const pa = paRaw != null ? (typeof paRaw === 'number' ? paRaw : (() => { const s = String(paRaw).split('/')[0]; const n = parseFloat(s); return isNaN(n) ? null : n; })()) : null;
            const fc = sv?.frecuencia_cardiaca != null ? Number(sv.frecuencia_cardiaca) : null;
            const fr = sv?.frecuencia_respiratoria != null ? Number(sv.frecuencia_respiratoria) : null;
            const temp = sv?.temperatura != null ? Number(sv.temperatura) : null;
            const spo2 = sv?.saturacion_oxigeno != null ? Number(sv.saturacion_oxigeno) : null;
            const glasgow = (formData.examenFisico?.glasgow_ocular ?? null) != null && (formData.examenFisico?.glasgow_verbal ?? null) != null && (formData.examenFisico?.glasgow_motora ?? null) != null
              ? (formData.examenFisico.glasgow_ocular || 0) + (formData.examenFisico.glasgow_verbal || 0) + (formData.examenFisico.glasgow_motora || 0)
              : null;
            const puntajeMama = embarazoVigente ? [
              pa != null && (pa < 90 || pa > 160) ? 1 : 0,
              fc != null && (fc < 60 || fc > 120) ? 1 : 0,
              fr != null && (fr < 10 || fr > 30) ? 1 : 0,
              temp != null && (temp < 36 || temp > 38) ? 1 : 0,
              spo2 != null && spo2 < 95 ? 1 : 0,
              glasgow != null && glasgow < 15 ? 1 : 0
            ].reduce((a, b) => a + b, 0) : null;
            const scoreCritico = puntajeMama != null && puntajeMama >= 2;

            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Obstetricia (Sección J)</h2>

                {esMasculino && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm mb-6">
                    Esta sección no aplica para el sexo del paciente.
                  </div>
                )}

                {!esMasculino && (
                  <>
                    {esMEF && !estadoGestacion && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-amber-800 text-sm mb-4">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Paciente en edad fértil (10–49 años): indique si existe embarazo confirmado o sospecha.
                      </div>
                    )}

                    <div className="space-y-6">
                      <section>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Antecedentes obstétricos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { key: 'numeroGestas', label: 'Gestas', id: 'numeroGestas' },
                            { key: 'numeroPartos', label: 'Partos', id: 'numeroPartos' },
                            { key: 'numeroAbortos', label: 'Abortos', id: 'numeroAbortos' },
                            { key: 'numeroCesareas', label: 'Cesáreas', id: 'numeroCesareas' }
                          ].map(({ key, label, id }) => (
                            <div key={key}>
                              <label htmlFor={id} className="block text-gray-600 text-sm font-medium mb-1">{label}</label>
                              <input type="number" id={id} min={0} value={ep[key] ?? ''} disabled={deshabilitarSeccion}
                                onChange={(e) => handleNestedChange('embarazoParto', key, e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                className="w-full border border-gray-200 rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                              />
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">¿Embarazo confirmado o sospecha?</h3>
                        <div className="flex flex-wrap gap-2">
                          {["SI", "NO", "SOSPECHA"].map((v) => (
                            <button key={v} type="button" disabled={deshabilitarSeccion}
                              onClick={() => handleNestedChange('embarazoParto', 'estadoGestacion', v)}
                              className={`py-2 px-4 rounded-lg text-sm font-medium border transition ${estadoGestacion === v
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {v === 'SI' ? 'Sí' : v === 'NO' ? 'No' : 'Sospecha'}
                            </button>
                          ))}
                        </div>
                      </section>

                      {embarazoVigente && (
                        <>
                          <section>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Embarazo actual</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="fum" className="block text-gray-600 text-sm font-medium mb-1">FUM</label>
                                <input type="date" id="fum" value={fumVal} disabled={deshabilitarSeccion}
                                  onChange={(e) => handleNestedChange('embarazoParto', 'fum', e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div>
                                <label htmlFor="semanasGestacion" className="block text-gray-600 text-sm font-medium mb-1">Semanas de gestación</label>
                                <input type="number" id="semanasGestacion" min={0} max={44} value={semanasGestacion ?? ''} disabled={deshabilitarSeccion}
                                  onChange={(e) => handleNestedChange('embarazoParto', 'semanasGestacion', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                  placeholder={semanasAuto != null ? `Auto: ${semanasAuto}` : ''}
                                />
                              </div>
                              <div>
                                <label htmlFor="frecuenciaCardiacaFetal" className="block text-gray-600 text-sm font-medium mb-1">FCF (lpm)</label>
                                <input type="number" id="frecuenciaCardiacaFetal" value={ep.frecuenciaCardiacaFetal ?? ''} disabled={deshabilitarSeccion}
                                  onChange={(e) => handleNestedChange('embarazoParto', 'frecuenciaCardiacaFetal', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                  className="w-full border border-gray-200 rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div className="flex items-center gap-2 sm:col-span-2">
                                <input type="checkbox" id="movimientoFetal" checked={!!ep.movimientoFetal} disabled={deshabilitarSeccion}
                                  onChange={(e) => handleNestedChange('embarazoParto', 'movimientoFetal', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="movimientoFetal" className="text-sm text-gray-700">Movimiento fetal (Sí)</label>
                              </div>
                            </div>
                          </section>

                          <section>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Examen físico obstétrico</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {[
                                { key: 'afu', label: 'AFU (cm)' },
                                { key: 'dilatacion', label: 'Dilatación' },
                                { key: 'borramiento', label: 'Borramiento' },
                                { key: 'plano', label: 'Plano' },
                                { key: 'presentacion', label: 'Presentación' },
                                { key: 'tiempo', label: 'Tiempo (ruptura membranas)' }
                              ].map(({ key, label }) => (
                                <div key={key}>
                                  <label className="block text-gray-600 text-sm font-medium mb-1">{label}</label>
                                  <input type="text" value={ep[key] ?? ''} disabled={deshabilitarSeccion}
                                    onChange={(e) => handleNestedChange('embarazoParto', key, e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                              ))}
                              <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-3">
                                <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!ep.pelvisViable} disabled={deshabilitarSeccion} onChange={(e) => handleNestedChange('embarazoParto', 'pelvisViable', e.target.checked)} className="rounded border-gray-300 text-blue-600" /> Pelvis viable</label>
                                <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!ep.sangradoVaginal} disabled={deshabilitarSeccion} onChange={(e) => handleNestedChange('embarazoParto', 'sangradoVaginal', e.target.checked)} className="rounded border-gray-300 text-blue-600" /> Sangrado vaginal</label>
                                <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!ep.contracciones} disabled={deshabilitarSeccion} onChange={(e) => handleNestedChange('embarazoParto', 'contracciones', e.target.checked)} className="rounded border-gray-300 text-blue-600" /> Contracciones</label>
                                <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!ep.rupturaMembranas} disabled={deshabilitarSeccion} onChange={(e) => handleNestedChange('embarazoParto', 'rupturaMembranas', e.target.checked)} className="rounded border-gray-300 text-blue-600" /> Ruptura de membranas</label>
                              </div>
                            </div>
                          </section>

                          <section>
                            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm">
                              <h3 className="text-sm font-semibold text-gray-800 mb-2">Score MAMÁ (desde Sección G)</h3>
                              <p className="text-xs text-gray-600 mb-3">Calculado con PA, FC, FR, Temp, SpO₂ y Glasgow.</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-800">{puntajeMama ?? '—'}</span>
                                <span className="text-sm text-gray-500">puntos</span>
                              </div>
                              {scoreCritico && (
                                <div className="mt-3 rounded-lg border-2 border-red-400 bg-red-50 p-3 text-red-800 text-sm font-semibold">
                                  Puntaje Crítico: Evaluar activación de Claves Obstétricas (Roja/Azul/Amarilla).
                                </div>
                              )}
                            </div>
                          </section>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {activeTab === 'examenesComplementarios' && (() => {
            const ec = formData.examenesComplementarios || DEFAULT_EXAMENES_K();
            const noAplica = !!ec.examenes_no_aplica;
            const items = ec.items || Object.fromEntries([...Array(16)].map((_, i) => [i + 1, false]));
            const observaciones = (ec.observaciones ?? '').toString();
            const deshabilitarK = readOnly || noAplica;
            const labCount = [1,2,3,4,5,6,7].filter(i => items[i]).length;
            const imagenCount = [8,9,10,11,12,13,14].filter(i => items[i]).length;
            const interconsultaCount = items[15] ? 1 : 0;
            const item15o16 = !!(items[15] || items[16]);
            const observacionesRequerida = item15o16;
            const placeholderObservaciones = items[15] && !items[16]
              ? 'Describa la interconsulta realizada: especialidad, hallazgos, conducta…'
              : items[16] && !items[15]
                ? 'Describa otros estudios realizados o justifique por qué'
                : 'Observaciones de los exámenes complementarios...';

            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">K. Exámenes Complementarios</h2>

                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">No aplica (ningún examen complementario)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noAplica}
                        onChange={setNoAplicaEstudiosK}
                        disabled={readOnly}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-600">No aplica</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Grupo 1: Laboratorio */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <h3 className="text-base font-semibold text-gray-800">Laboratorio</h3>
                      {labCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{labCount} ítems</span>}
                    </div>
                    <div className="space-y-2">
                      {ITEMS_SECCION_K.filter(i => i.categoria === 'LAB').map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!items[item.id]}
                            onChange={(e) => setExamenItemK(item.id, e.target.checked)}
                            disabled={deshabilitarK}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{item.label}</span>
                          {((item.id === 1 || item.id === 2) && !!items[item.id]) && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setShowOrdenExamenModal(true); }}
                              className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                              disabled={deshabilitarK}
                            >
                              Generar Orden (010)
                            </button>
                          )}
                        </label>
                      ))}
                      {labCount > 0 && (
                        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Se requiere llenar el Formulario 010 (Orden de Exámenes).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Grupo 2: Imagen y Otros */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <h3 className="text-base font-semibold text-gray-800">Imagen / Estudios / Interconsulta</h3>
                      {(imagenCount > 0 || interconsultaCount > 0 || !!items[16]) && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {imagenCount + interconsultaCount + (items[16] ? 1 : 0)} ítems
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {ITEMS_SECCION_K.filter(i => i.categoria === 'IMAGEN' || i.categoria === 'INTERCONSULTA' || i.categoria === 'OTROS').map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!items[item.id]}
                            onChange={(e) => setExamenItemK(item.id, e.target.checked)}
                            disabled={deshabilitarK}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{item.label}</span>
                          {((item.id >= 8 && item.id <= 14) && !!items[item.id]) && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setShowOrdenImagenModal(true); }}
                              className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                              disabled={deshabilitarK}
                            >
                              Generar Orden (012)
                            </button>
                          )}
                        </label>
                      ))}
                      {(imagenCount > 0) && (
                        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Se requiere llenar el Formulario 012 (Orden de Imagen).
                        </p>
                      )}
                      {(interconsultaCount > 0) && (
                        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Se requiere llenar el Formulario 007 (Interconsulta).
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observaciones de los Exámenes Complementarios (Sección K) */}
                <div className="mb-4">
                  <label htmlFor="observacionesExamenesK" className="block text-gray-700 text-sm font-bold mb-2">
                    Observaciones de los Estudios{observacionesRequerida && <span className="text-red-500"> *</span>}
                  </label>
                  <textarea
                    id="observacionesExamenesK"
                    name="examenesComplementarios.observaciones"
                    value={observaciones}
                    onChange={(e) => handleNestedChange('examenesComplementarios', 'observaciones', e.target.value)}
                    minLength={observacionesRequerida ? 20 : undefined}
                    required={observacionesRequerida}
                    disabled={deshabilitarK}
                    placeholder={placeholderObservaciones}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                      observacionesRequerida && observaciones.length > 0 && observaciones.length < 20 ? 'border-rose-400' : 'text-gray-700'
                    }`}
                    rows={4}
                  />
                  {observacionesRequerida && (
                    <div className="flex justify-between mt-1">
                      <span className={`text-xs ${observaciones.length < 20 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {observaciones.length < 20 ? `⚠️ Mínimo 20 caracteres requeridos (${observaciones.length}/20) para estudios marcados.` : '✅ Descripción completa.'}
                      </span>
                      <span className="text-xs text-gray-500">Justificación normativa.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'diagnosticos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Diagnósticos (L y M)</h2>
              <p className="text-sm text-gray-500 mb-4">Gestione los diagnósticos principales y complementarios según la normativa MSP.</p>
              {/* Aquí se renderizará el componente DiagnosticosCIE10, que ya está en la página padre */}
              {/* <DiagnosticosCIE10 atencionId={existingAtencionIdRef.current || atencionData?.id} readOnly={readOnly} /> */}
              <div className="text-center text-gray-500 italic p-4 border rounded-lg">
                Los diagnósticos se gestionan directamente desde la sección de "Diagnósticos" en la vista principal.
              </div>
            </div>
          )}

          {activeTab === 'planTratamiento' && (() => {
            const plan = formData.planTratamiento || [];
            const canAddPlanItem = newPlanItem.medicamento.trim() !== '';

            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">N. Plan de Tratamiento</h2>
                <p className="text-sm text-gray-500 mb-4">Registre las indicaciones médicas y tratamientos. Puede generar órdenes y recetas desde aquí.</p>

                {/* Lista de medicamentos/acciones */}
                <div className="mb-6 space-y-4">
                  {plan.length === 0 ? (
                    <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded-lg">No hay ítems en el plan de tratamiento.</p>
                  ) : (
                    plan.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                        <div className="flex-1 space-y-1">
                          <p className="font-bold text-blue-800 text-base">{item.medicamento}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-700">
                            {item.via && <div><span className="font-medium text-gray-600">Vía:</span> {item.via}</div>}
                            {item.dosis && <div><span className="font-medium text-gray-600">Dosis:</span> {item.dosis}</div>}
                            {item.posologia && <div><span className="font-medium text-gray-600">Posología:</span> {item.posologia}</div>}
                            {item.dias && <div><span className="font-medium text-gray-600">Días:</span> {item.dias}</div>}
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('planTratamiento', index)}
                            className="shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Formulario para añadir ítem al plan de tratamiento */}
                {!readOnly && (
                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Añadir nuevo ítem al plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="new-medicamento" className="block text-sm font-medium text-gray-700 mb-1">Medicamento/Acción <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          id="new-medicamento"
                          value={newPlanItem.medicamento}
                          onChange={(e) => setNewPlanItem({ ...newPlanItem, medicamento: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                          placeholder="Ej: Ibuprofeno, Oxígeno, Reposo"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="new-via" className="block text-sm font-medium text-gray-700 mb-1">Vía</label>
                        <input
                          type="text"
                          id="new-via"
                          value={newPlanItem.via || ''}
                          onChange={(e) => setNewPlanItem({ ...newPlanItem, via: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                          placeholder="Ej: Oral, IV, IM"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-dosis" className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                        <input
                          type="text"
                          id="new-dosis"
                          value={newPlanItem.dosis || ''}
                          onChange={(e) => setNewPlanItem({ ...newPlanItem, dosis: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                          placeholder="Ej: 400mg, 5L/min"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-posologia" className="block text-sm font-medium text-gray-700 mb-1">Posología</label>
                        <input
                          type="text"
                          id="new-posologia"
                          value={newPlanItem.posologia || ''}
                          onChange={(e) => setNewPlanItem({ ...newPlanItem, posologia: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                          placeholder="Ej: Cada 8 horas, Dosis única"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-dias" className="block text-sm font-medium text-gray-700 mb-1">Días</label>
                        <input
                          type="number"
                          id="new-dias"
                          min={1}
                          value={newPlanItem.dias ?? ''}
                          onChange={(e) => setNewPlanItem({ ...newPlanItem, dias: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                          placeholder="Ej: 3, 5"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (canAddPlanItem) {
                            addArrayItem('planTratamiento', newPlanItem);
                            setNewPlanItem({ medicamento: '', via: '', dosis: '', posologia: '', dias: null }); // Limpiar formulario
                          } else {
                            alert('El campo "Medicamento/Acción" es obligatorio.');
                          }
                        }}
                        disabled={!canAddPlanItem}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Añadir a Plan
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <label htmlFor="observacionesPlanTratamiento" className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea
                    id="observacionesPlanTratamiento"
                    name="observacionesPlanTratamiento"
                    value={formData.observacionesPlanTratamiento || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:ring-1 focus:ring-blue-400"
                    placeholder="Observaciones adicionales sobre el plan de tratamiento..."
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecetaModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-prescription-rx"><path d="M2 13v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"/><path d="M14 14V8h2a2 2 0 0 1 2 2v4"/><path d="M7 10h1v4"/><path d="M17 17h1v4"/><path d="M14 7h1V3a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/><path d="M15 21h4a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-3"/></svg>
                    Generar Receta Médica
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrdenExamenModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-plus"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 13h6"/><path d="M12 10v6"/></svg>
                    Generar Orden Exámenes (010)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOrdenImagenModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    Generar Orden Imagen (012)
                  </button>
                </div>
                {atencionData && existingAtencionIdRef.current && (
                  <>
                    <RecetaMedicaForm
                      isOpen={showRecetaModal}
                      onClose={() => setShowRecetaModal(false)}
                      atencionId={existingAtencionIdRef.current}
                      pacienteId={admisionData?.pacienteId}
                    />
                    <OrdenExamenForm
                      isOpen={showOrdenExamenModal}
                      onClose={() => setShowOrdenExamenModal(false)}
                      atencionId={existingAtencionIdRef.current}
                      pacienteId={admisionData?.pacienteId}
                    />
                    <OrdenImagenForm
                      isOpen={showOrdenImagenModal}
                      onClose={() => setShowOrdenImagenModal(false)}
                      atencionId={existingAtencionIdRef.current}
                      pacienteId={admisionData?.pacienteId}
                    />
                  </>
                )}
              </div>
            );
          })()}

          {activeTab === 'condicionEgreso' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">O. Condición al Egreso de Emergencia</h2>
              
              <div className="mb-4">
                <label htmlFor="condicionEgreso" className="block text-gray-700 text-sm font-bold mb-2">
                  Condición de Egreso: <span className="text-red-500">*</span>
                </label>
                <select
                  id="condicionEgreso"
                  name="condicionEgreso"
                  value={formData.condicionEgreso || ''}
                  onChange={handleChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Seleccionar condición...</option>
                  <option value="HOSPITALIZACION">Hospitalización</option>
                  <option value="ALTA">Alta</option>
                  <option value="ESTABLE">Estable</option>
                  <option value="INESTABLE">Inestable</option>
                  <option value="FALLECIDO">Fallecido</option>
                  <option value="ALTA_DEFINITIVA">Alta definitiva</option>
                  <option value="CONSULTA_EXTERNA">Consulta externa</option>
                  <option value="OBSERVACION_EMERGENCIA">Observación de emergencia</option>
                </select>
              </div>

              {(formData.condicionEgreso === 'HOSPITALIZACION' || formData.condicionEgreso === 'CONSULTA_EXTERNA') && (
                <div className="mb-4">
                  <label htmlFor="referenciaEgreso" className="block text-gray-700 text-sm font-bold mb-2">
                    Referencia a: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="referenciaEgreso"
                    name="referenciaEgreso"
                    value={formData.referenciaEgreso || ''}
                    onChange={handleChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Especialidad, Servicio, Nivel..."
                  />
                </div>
              )}
              {(formData.condicionEgreso === 'ALTA' || formData.condicionEgreso === 'ALTA_DEFINITIVA' || formData.condicionEgreso === 'OBSERVACION_EMERGENCIA') && (
                <div className="mb-4">
                  <label htmlFor="establecimientoEgreso" className="block text-gray-700 text-sm font-bold mb-2">
                    Establecimiento de Egreso: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="establecimientoEgreso"
                    name="establecimientoEgreso"
                    value={formData.establecimientoEgreso || ''}
                    onChange={handleChange}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Ej: Domicilio, Hospital Básico, Primer Nivel..."
                  />
                </div>
              )}
{formData.condicionEgreso === 'FALLECIDO' && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    ⚠️  Ha seleccionado Condición de Egreso: FALLECIDO. Asegúrese de haber completado la Hora de Atención correctamente y los campos de defunción en el sistema.
                    Esta acción es irreversible y cierra la atención del paciente.
                  </div>
                </div>
              )}
            </div>
          )}
        </div> {/* Cierre del contenido de pestañas (bg-white) */}
        </fieldset>

        {/* Botones de acción: Guardar y Finalizar */}
        {!readOnly && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Guardando...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Guardar Atención (Pendiente de Firma)
                </>
              )}
            </button>
          </div>
        )}

        {/* Modales */}
        <ModalMefObstetricia
          isOpen={showModalMefObstetricia}
          onClose={() => setShowModalMefObstetricia(false)}
        />
        <ModalObservacionesEstudios
          isOpen={showModalObservacionesEstudios}
          onClose={() => setShowModalObservacionesEstudios(false)}
        />
        <ConfirmFallecidoModal
          isOpen={showConfirmFallecidoModal}
          onConfirm={() => {
            setFormData(prev => ({ ...prev, condicionEgreso: 'FALLECIDO' }));
            setShowConfirmFallecidoModal(false);
          }}
          onCancel={() => {
            setFormData(prev => ({ ...prev, condicionEgreso: '' }));
            setShowConfirmFallecidoModal(false);
          }}
        />
      </form>
    </div>
  );
};

// Componente para el modal de MEF
const ModalMefObstetricia = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-amber-700 mb-4">⚠️ Validación de Obstetricia</h3>
        <p className="text-gray-700 mb-4">
          La paciente está en edad fértil. Debe confirmar si existe embarazo o sospecha en la <strong>Sección J: Obstetricia</strong>.
          Esto es obligatorio para asegurar el cumplimiento normativo MSP.
        </p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

// Componente para el modal de Observaciones de Estudios
const ModalObservacionesEstudios = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-amber-700 mb-4">⚠️ Observaciones de Estudios Requeridas</h3>
        <p className="text-gray-700 mb-4">
          Ha marcado estudios complementarios en la <strong>Sección K</strong>. Es obligatorio añadir una descripción u observación en el campo correspondiente
          para justificar la solicitud y adjuntar resultados, según la normativa MSP.
        </p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

// Nuevo Modal de Confirmación para Egreso "FALLECIDO"
const ConfirmFallecidoModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-red-800 bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-lg mx-auto border-t-4 border-red-500">
        <div className="flex items-center gap-4 mb-5">
          <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
          <h3 className="text-xl font-bold text-red-800">Confirmación de Egreso: FALLECIDO</h3>
        </div>
        <p className="text-gray-700 mb-6 text-base">
          Está a punto de registrar la condición de egreso como <strong>FALLECIDO</strong>.
          Esta acción cerrará la atención del paciente y se registrará la fecha y hora de defunción en el sistema.
          <br /><br />
          <strong>Por favor, confirme que ha verificado los datos y que esta información es correcta.</strong>
          Una vez guardado, este registro no podrá ser modificado.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
          >
            Cancelar y Cambiar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Confirmar Fallecimiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default AtencionEmergenciaForm;