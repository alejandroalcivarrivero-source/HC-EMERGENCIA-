import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header'; // Importar el componente Header
import axios from 'axios'; // Importar axios
import HistorialSignosVitalesModal from './HistorialSignosVitalesModal'; // Importar el modal de historial
import ConfirmModal from './ConfirmModal'; // Importar el modal de confirmación

export default function SignosVitalesForm() {
  // const { pacienteId } = useParams(); // Comentado para usar window.location.pathname
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null); // Almacenará los datos del paciente de la admisión
  const [admisionId, setAdmisionId] = useState(null); // Para guardar el admisionId real
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false); // Estado para controlar la visibilidad del modal de historial
  const [formData, setFormData] = useState({
    sinConstantesVitales: false,
    temperatura: '',
    presionArterial: '',
    frecuenciaCardiaca: '', // Cambiado de pulsoOximetria
    frecuenciaRespiratoria: '',
    saturacionOxigeno: '',
    perimetroCefalico: '',
    peso: '',
    talla: '',
    glicemiaCapilar: '',
    observaciones: '',
  });
  const [motivoConsulta, setMotivoConsulta] = useState({
    texto: 'No se ha registrado un motivo de consulta.',
    categoria: '',
    codigoTriaje: ''
  });
  const [imc, setImc] = useState(null);
  const [triajeColor, setTriajeColor] = useState('gray'); // Default color
  const [categoriasTriaje, setCategoriasTriaje] = useState([]); // Nuevo estado para las categorías de triaje
  const [showTriajeModal, setShowTriajeModal] = useState(false); // Estado para controlar la visibilidad del modal
  const [validationErrors, setValidationErrors] = useState({}); // Nuevo estado para errores de validación
  const [isPerimetroCefalicoRequired, setIsPerimetroCefalicoRequired] = useState(true); // Nuevo estado para controlar si el perímetro cefálico es requerido
  const [isFormDisabled, setIsFormDisabled] = useState(false); // Nuevo estado para deshabilitar el formulario
  const [triajeCalculadoBackend, setTriajeCalculadoBackend] = useState(null); // Estado para el triaje calculado por el backend
  const [triajeSeleccionadoProfesional, setTriajeSeleccionadoProfesional] = useState(null); // Estado para el triaje seleccionado por el profesional
  const [showConfirmTriajeModal, setShowConfirmTriajeModal] = useState(false); // Estado para el modal de confirmación de triaje
  const [showInfoModal, setShowInfoModal] = useState(false); // Nuevo estado para el modal informativo
  const [infoModalMessage, setInfoModalMessage] = useState(''); // Mensaje para el modal informativo
  const [showAsignarTriajeModal, setShowAsignarTriajeModal] = useState(false); // Modal para asignar solo triaje
  const [triajeParaAsignar, setTriajeParaAsignar] = useState(null); // Triaje seleccionado para asignar sin signos vitales
  const [observacionTriajeSolo, setObservacionTriajeSolo] = useState(''); // Observación al asignar solo triaje ROJO
  const [errorObservacionTriaje, setErrorObservacionTriaje] = useState(''); // Error de validación de observación
  const [showAltaVoluntariaModal, setShowAltaVoluntariaModal] = useState(false); // Modal para alta voluntaria
  const [observacionAltaVoluntaria, setObservacionAltaVoluntaria] = useState(''); // Observación para alta voluntaria
  
  // Función helper para convertir colores de texto del backend a colores CSS válidos
  const convertirColorACSS = (colorTexto) => {
    if (!colorTexto) return 'gray';
    
    const colorLower = colorTexto.toLowerCase();
    const colorMap = {
      'rojo': 'red',
      'red': 'red',
      'naranja': '#c2410c', // orange-700
      'orange': '#c2410c',
      'amarillo': '#fde047', // yellow-300
      'yellow': '#fde047',
      'verde': 'green',
      'green': 'green',
      'azul': '#3b82f6', // blue-500
      'blue': '#3b82f6',
      'sin urgencia': '#3b82f6', // Azul para SIN URGENCIA
    };
    
    return colorMap[colorLower] || colorLower;
  };
  
  // Rangos de validación estándar
  const VALIDATION_RANGES = {
    temperatura: { min: 34.0, max: 42.0, message: 'La temperatura debe estar entre 34.0 y 42.0 °C.' },
    presionArterialSistolica: { min: 60, max: 250, message: 'La presión sistólica debe estar entre 60 y 250 mmHg.' },
    presionArterialDiastolica: { min: 30, max: 150, message: 'La presión diastólica debe estar entre 30 y 150 mmHg.' },
    frecuenciaCardiaca: { min: 30, max: 200, message: 'La frecuencia cardíaca debe estar entre 30 y 200 /min.' },
    frecuenciaRespiratoria: { min: 5, max: 60, message: 'La frecuencia respiratoria debe estar entre 5 y 60 /min.' },
    saturacionOxigeno: { min: 70.0, max: 100.0, message: 'La pulsioximetría debe estar entre 70.0 y 100.0 %.' },
    perimetroCefalico: { min: 20.0, max: 70.0, message: 'El perímetro cefálico debe estar entre 20.0 y 70.0 cm.' },
    peso: { min: 1.0, max: 300.0, message: 'El peso debe estar entre 1.0 y 300.0 kg.' },
    talla: { min: 20.0, max: 250.0, message: 'La talla debe estar entre 20.0 y 250.0 cm.' },
    glicemiaCapilar: { min: 20.0, max: 600.0, message: 'La glicemia capilar debe estar entre 20.0 y 600.0 mg/dl.' },
  };

  useEffect(() => {
    // Extraer admisionId directamente de la URL
    const pathSegments = window.location.pathname.split('/');
    const idFromUrl = pathSegments[pathSegments.length - 1]; // Último segmento de la URL
    const currentAdmisionId = parseInt(idFromUrl);

    if (isNaN(currentAdmisionId)) {
      console.error('[Frontend] ID de admisión no es un número válido desde la URL.');
      setInfoModalMessage('Error: ID de admisión no válido.');
      setShowInfoModal(true);
      // No navegar inmediatamente, esperar a que el usuario cierre el modal
      return;
    }

    setAdmisionId(currentAdmisionId); // Actualizar el estado admisionId

    const fetchPacienteAdmision = async (id) => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No se encontró token de autenticación.');
        navigate('/login'); // Redirigir al login si no hay token
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/admisiones/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        console.log('Datos recibidos del backend:', data); // Mantener log para depuración

        if (!response.ok) {
          // Si la respuesta no es OK, lanzar un error con el mensaje del backend si está disponible
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        // Construir el nombre completo del paciente
        const nombreCompletoPaciente = `${data.Paciente.primer_nombre || ''} ${data.Paciente.segundo_nombre || ''} ${data.Paciente.primer_apellido || ''} ${data.Paciente.segundo_apellido || ''}`.trim();
        setPaciente({ ...data.Paciente, nombreCompleto: nombreCompletoPaciente }); // Añadir nombreCompleto al objeto paciente
        setAdmisionId(data.id); // Usar data.id para el admisionId
        if (data.MotivoConsultaSintoma) {
          setMotivoConsulta({
            texto: data.MotivoConsultaSintoma.Motivo_Consulta_Sintoma,
            categoria: data.MotivoConsultaSintoma.Categoria,
            codigoTriaje: data.MotivoConsultaSintoma.Codigo_Triaje
          });
        } else {
          setMotivoConsulta({
            texto: 'No se ha registrado un motivo de consulta.',
            categoria: '',
            codigoTriaje: ''
          });
        }

        // Deshabilitar el formulario si el paciente está fallecido
        if (data.estadoPaciente === 'FALLECIDO') { // Acceder a data.estadoPaciente
          setIsFormDisabled(true);
          setInfoModalMessage('Este paciente ha fallecido y no se pueden registrar más signos vitales.');
          setShowInfoModal(true);
        } else {
          setIsFormDisabled(false);
        }

        // Calcular la edad del paciente en meses
        if (data.Paciente && data.Paciente.fecha_nacimiento) { // Acceder a data.Paciente.fecha_nacimiento
          const fechaNacimiento = new Date(data.Paciente.fecha_nacimiento);
          const hoy = new Date();
          
          if (!isNaN(fechaNacimiento.getTime())) { // Verificar si la fecha es válida
            const diffMeses = (hoy.getFullYear() - fechaNacimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaNacimiento.getMonth());
            
            console.log(`[SignosVitalesForm] Fecha de Nacimiento: ${data.Paciente.fecha_nacimiento}, Meses de edad: ${diffMeses}`); // Debugging
            // Si el paciente tiene más de 36 meses, el perímetro cefálico no es requerido
            setIsPerimetroCefalicoRequired(diffMeses <= 36);
          } else {
            console.log('[SignosVitalesForm] Fecha de nacimiento del paciente es inválida. Perímetro cefálico no requerido por defecto.'); // Debugging
            setIsPerimetroCefalicoRequired(false); // Si la fecha de nacimiento es inválida, asumir que no es requerido
          }
        } else {
          console.log('[SignosVitalesForm] Fecha de nacimiento del paciente no disponible. Perímetro cefálico no requerido por defecto.'); // Debugging
          setIsPerimetroCefalicoRequired(false); // Si no hay fecha de nacimiento, asumir que no es requerido
        }
        
      } catch (error) {
        console.error('Error al obtener datos del paciente para signos vitales:', error);
        setInfoModalMessage(`Error al cargar datos del paciente: ${error.message}. Por favor, intente de nuevo.`);
        setShowInfoModal(true);
        // No navegar inmediatamente, esperar a que el usuario cierre el modal
      }
    };

    fetchPacienteAdmision(currentAdmisionId); // Llamar con el ID directamente

    const fetchCategoriasTriaje = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/cat-triaje', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategoriasTriaje(response.data);
      } catch (error) {
        console.error('Error al obtener categorías de triaje:', error);
      }
    };
    fetchCategoriasTriaje();
  }, [navigate]); // Eliminar pacienteId de las dependencias ya que no se usa useParams

  const openHistorialModal = () => {
    setIsHistorialModalOpen(true);
  };

  const closeHistorialModal = () => {
    setIsHistorialModalOpen(false);
  };

  const validateField = (name, value) => {
    let error = '';
    const numValue = parseFloat(value);

    if (name === 'presionArterial') {
      const parts = value.split('/');
      if (parts.length === 2) {
        const sistolica = parseFloat(parts[0]);
        const diastolica = parseFloat(parts[1]);

        if (isNaN(sistolica) || sistolica < VALIDATION_RANGES.presionArterialSistolica.min || sistolica > VALIDATION_RANGES.presionArterialSistolica.max) {
          error = VALIDATION_RANGES.presionArterialSistolica.message;
        } else if (isNaN(diastolica) || diastolica < VALIDATION_RANGES.presionArterialDiastolica.min || diastolica > VALIDATION_RANGES.presionArterialDiastolica.max) {
          error = VALIDATION_RANGES.presionArterialDiastolica.message;
        }
      } else if (value !== '') {
        error = 'Formato de Presión Arterial inválido (ej: 120/80).';
      }
    } else if (name === 'perimetroCefalico') {
      if (isPerimetroCefalicoRequired && value === '') {
        error = 'El perímetro cefálico es requerido para pacientes menores de 3 años (36 meses).';
      } else if (value !== '' && (isNaN(numValue) || numValue < VALIDATION_RANGES.perimetroCefalico.min || numValue > VALIDATION_RANGES.perimetroCefalico.max)) {
        error = VALIDATION_RANGES.perimetroCefalico.message;
      }
    }
    else if (VALIDATION_RANGES[name] && value !== '') {
      if (isNaN(numValue) || numValue < VALIDATION_RANGES[name].min || numValue > VALIDATION_RANGES[name].max) {
        error = VALIDATION_RANGES[name].message;
      }
    }
    setValidationErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      let newFormData = { ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value };

      // Si el perímetro cefálico no es requerido, limpiarlo y deshabilitar la validación
      if (name === 'perimetroCefalico' && !isPerimetroCefalicoRequired) {
        newFormData = { ...newFormData, perimetroCefalico: '' };
        setValidationErrors(prevErrors => ({ ...prevErrors, perimetroCefalico: '' })); // Limpiar error de validación
      }

      if (type !== 'checkbox') {
        validateField(name, value);
      }

      // Calcular IMC si peso y talla están presentes
      if (name === 'peso' || name === 'talla') {
        const pesoVal = parseFloat(newFormData.peso);
        const tallaVal = parseFloat(newFormData.talla);
        if (pesoVal > 0 && tallaVal > 0) {
          const imcValue = pesoVal / ((tallaVal / 100) * (tallaVal / 100));
          setImc(imcValue.toFixed(2));
        } else {
          setImc(null);
        }
      }

      // Lógica para deshabilitar campos si "Sin constantes vitales" está marcado
      if (name === 'sinConstantesVitales' && checked) {
        return {
          ...newFormData,
          temperatura: '',
          presionArterial: '',
          frecuenciaCardiaca: '',
          frecuenciaRespiratoria: '',
          saturacionOxigeno: '',
          perimetroCefalico: '',
          peso: '',
          talla: '',
          glicemiaCapilar: '',
          observaciones: '',
        };
      }
      return newFormData;
    });
  };

  useEffect(() => {
    // Lógica de semaforización del triaje (simplificación basada en criterios de prioridad I y II para adultos)
    // Es crucial entender que esta es una implementación simplificada y no un sistema completo del Triaje de Manchester.
    // No incluye la evaluación de la edad del paciente (para rangos pediátricos) ni las múltiples condiciones clínicas.
    // NOTA: Este cálculo es solo una PREVISUALIZACIÓN. El color definitivo viene del backend cuando se calcula el triaje.
    
    // Si ya hay un triaje calculado por el backend, NO sobrescribir con el cálculo del frontend
    if (triajeCalculadoBackend) {
      return; // No hacer nada si ya hay un triaje calculado por el backend
    }
    
    const { temperatura, presionArterial, frecuenciaCardiaca, frecuenciaRespiratoria, saturacionOxigeno, sinConstantesVitales } = formData; // Usar frecuenciaCardiaca

    let color = 'gray'; // Color por defecto si no hay datos o si "Sin constantes vitales" está marcado

    if (sinConstantesVitales) {
      setTriajeColor('gray'); // Si el paciente falleció, no hay triaje de color activo
      return;
    }

    // Convertir valores a números para comparaciones
    const tempVal = parseFloat(temperatura);
    const pulsoVal = parseInt(frecuenciaCardiaca); // Usar frecuenciaCardiaca para el pulso
    const frVal = parseInt(frecuenciaRespiratoria);
    const satOxVal = parseFloat(saturacionOxigeno);
    const [sistolica, diastolica] = presionArterial ? presionArterial.split('/').map(Number) : [null, null];

    // Criterios para ROJO (Prioridad I - Emergencia)
    // Adulto: Frecuencia Cardiaca < 50 o > 150, Presión Arterial Sistólica < 90 o > 220, Diastólica > 110, FR > 35 o < 10
    if (
      (pulsoVal && (pulsoVal < 50 || pulsoVal > 150)) ||
      (sistolica && (sistolica < 90 || sistolica > 220)) ||
      (diastolica && diastolica > 110) ||
      (frVal && (frVal > 35 || frVal < 10)) ||
      (satOxVal && satOxVal <= 85) // Saturación de oxigeno ≤ a 85%. (Pediátrico, pero se aplica como criterio de alarma general)
    ) {
      color = 'red';
    }
    // Criterios para NARANJA (Prioridad II - Urgente)
    // Frecuencia respiratoria ≥ de 24 por minuto.
    else if (
      (frVal && frVal >= 24)
    ) {
      color = '#c2410c'; // Naranja oscuro (orange-700)
    }
    // Criterios para AMARILLO (Prioridad III - Menos Urgente)
    // Aquí se podrían añadir más criterios si se especifican rangos para esta prioridad.
    // Por ahora, si no es rojo ni naranja, y los signos vitales están dentro de rangos "normales" pero no óptimos.
    else if (
      (tempVal && (tempVal >= 38.5 || tempVal <= 36)) || // Fiebre moderada o hipotermia leve
      (pulsoVal && (pulsoVal >= 100 || pulsoVal <= 60)) || // Taquicardia o bradicardia leve
      (satOxVal && satOxVal > 85 && satOxVal < 92) || // Hipoxia leve
      (sistolica && (sistolica >= 180 && sistolica <= 220)) || // Hipertensión moderada
      (diastolica && (diastolica >= 90 && diastolica <= 110)) // Hipertensión moderada
    ) {
      color = '#fde047'; // Amarillo pálido (yellow-300)
    }
    // Criterios para VERDE (Prioridad IV/V - No Urgente)
    // Si no cumple con los criterios anteriores y los signos vitales están dentro de rangos normales.
    else if (
      (tempVal && (tempVal > 36 && tempVal < 38.5)) &&
      (pulsoVal && (pulsoVal > 60 && pulsoVal < 100)) &&
      (frVal && (frVal > 10 && frVal < 24)) &&
      (satOxVal && satOxVal >= 92) &&
      (sistolica && sistolica >= 90 && sistolica < 180) &&
      (diastolica && diastolica >= 60 && diastolica < 90)
    ) {
      color = 'green';
    }

    setTriajeColor(color); // Actualizar el color del semáforo basado en la lógica del frontend (solo previsualización)
  }, [formData, triajeCalculadoBackend]); // Agregar triajeCalculadoBackend como dependencia

  // Actualizar el color del semáforo cuando el triaje calculado por el backend cambie
  useEffect(() => {
    if (triajeCalculadoBackend) {
      // Usar la función helper para convertir el color del backend
      const colorFinal = convertirColorACSS(triajeCalculadoBackend.color);
      setTriajeColor(colorFinal);
    } else {
      // Solo usar gray si no hay triaje calculado y no hay datos en el formulario
      const tieneDatos = formData.temperatura || formData.presionArterial || formData.frecuenciaCardiaca || 
                         formData.frecuenciaRespiratoria || formData.saturacionOxigeno;
      if (!tieneDatos && !formData.sinConstantesVitales) {
        setTriajeColor('gray'); // Color por defecto si no hay triaje calculado ni datos
      }
    }
  }, [triajeCalculadoBackend, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    let formIsValid = true;
    const newErrors = {};

    for (const key in formData) {
      if (formData.hasOwnProperty(key) && key !== 'sinConstantesVitales' && key !== 'observaciones' && key !== 'glicemiaCapilar') {
        // Si "Sin constantes vitales" está marcado, no validar los campos de signos vitales
        if (formData.sinConstantesVitales) {
          continue;
        }

        // Excluir perimetroCefalico de la validación de campo vacío si no es requerido
        if (key === 'perimetroCefalico' && !isPerimetroCefalicoRequired) {
          continue; // No es obligatorio, así que no lo validamos si está vacío
        }

        // Validar que los campos obligatorios no estén vacíos
        if (formData[key] === '') {
          formIsValid = false;
          newErrors[key] = 'Este campo es obligatorio.';
        } else if (key === 'perimetroCefalico') {
          if (isPerimetroCefalicoRequired && !validateField(key, formData[key])) {
            formIsValid = false;
            newErrors[key] = validationErrors[key] || 'El perímetro cefálico es requerido para pacientes menores de 3 años.';
          } else if (!isPerimetroCefalicoRequired && formData[key] !== '' && !validateField(key, formData[key])) {
            formIsValid = false;
            newErrors[key] = validationErrors[key] || VALIDATION_RANGES[key]?.message || 'Valor inválido.';
          }
        } else if (!validateField(key, formData[key])) {
          formIsValid = false;
          newErrors[key] = validationErrors[key] || VALIDATION_RANGES[key]?.message || 'Valor inválido.';
        }
      }
    }
    setValidationErrors(newErrors);

    if (!formIsValid) {
      setInfoModalMessage('Por favor, corrija los errores en el formulario antes de guardar.');
      setShowInfoModal(true);
      return;
    }

    if (!admisionId) {
      setInfoModalMessage('Error: ID de admisión no disponible.');
      setShowInfoModal(true);
      return;
    }

    try {
      const dataToSend = {
        admisionId: admisionId,
        sin_constantes_vitales: formData.sinConstantesVitales,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        presion_arterial: formData.presionArterial || null,
        frecuencia_cardiaca: formData.frecuenciaCardiaca ? parseInt(formData.frecuenciaCardiaca) : null,
        frecuencia_respiratoria: formData.frecuenciaRespiratoria ? parseInt(formData.frecuenciaRespiratoria) : null,
        saturacion_oxigeno: formData.saturacionOxigeno ? parseFloat(formData.saturacionOxigeno) : null,
        perimetro_cefalico: formData.perimetroCefalico ? parseFloat(formData.perimetroCefalico) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        talla: formData.talla ? parseFloat(formData.talla) : null,
        glicemia_capilar: formData.glicemiaCapilar ? parseFloat(formData.glicemiaCapilar) : null,
        observaciones: formData.observaciones || null,
      };
      console.log('[SignosVitalesForm] Datos a enviar para cálculo de triaje:', dataToSend);

      const token = localStorage.getItem('token');
      // Solo calcular el triaje, no guardar los signos vitales aún
      const response = await fetch('http://localhost:3001/api/signos-vitales/calcular-triaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          signosVitales: dataToSend,
          admisionId: admisionId // Pasar admisionId para obtener el motivo de consulta
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTriajeCalculadoBackend(result.triajeCalculado);
        setTriajeSeleccionadoProfesional(result.triajeCalculado); // Inicialmente, el profesional acepta el calculado
        setShowConfirmTriajeModal(true); // Mostrar el modal de confirmación
      } else {
        const errorData = await response.json();
        setInfoModalMessage(`Error al calcular triaje: ${errorData.message || response.statusText}`);
        setShowInfoModal(true);
        console.error('Error al calcular triaje:', errorData);
      }
    } catch (error) {
      console.error('Error en la solicitud de cálculo de triaje:', error);
      setInfoModalMessage('Error de conexión al calcular triaje. Por favor, intente de nuevo.');
      setShowInfoModal(true);
    }
  };

  const handleConfirmTriaje = async () => {
    if (!triajeSeleccionadoProfesional) {
      alert('Por favor, seleccione un triaje.');
      return;
    }

    // Datos completos a enviar, incluyendo signos vitales y el triaje definitivo
    const dataToSave = {
      admisionId: admisionId,
      sin_constantes_vitales: formData.sinConstantesVitales,
      temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
      presion_arterial: formData.presionArterial || null,
      frecuencia_cardiaca: formData.frecuenciaCardiaca ? parseInt(formData.frecuenciaCardiaca) : null,
      frecuencia_respiratoria: formData.frecuenciaRespiratoria ? parseInt(formData.frecuenciaRespiratoria) : null,
      saturacion_oxigeno: formData.saturacionOxigeno ? parseFloat(formData.saturacionOxigeno) : null,
      perimetro_cefalico: formData.perimetroCefalico ? parseFloat(formData.perimetroCefalico) : null,
      peso: formData.peso ? parseFloat(formData.peso) : null,
      talla: formData.talla ? parseFloat(formData.talla) : null,
      glicemia_capilar: formData.glicemiaCapilar ? parseFloat(formData.glicemiaCapilar) : null,
      observaciones: formData.observaciones || null,
      triajeDefinitivoId: triajeSeleccionadoProfesional.id, // Triaje seleccionado por el profesional
    };

    console.log('[SignosVitalesForm] Datos a guardar después de confirmación:', dataToSave);

    try {
      const token = localStorage.getItem('token');
      // Nueva ruta para guardar signos vitales y triaje definitivo
      const response = await fetch('http://localhost:3001/api/signos-vitales/guardar-con-triaje', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        setInfoModalMessage('Signos vitales y triaje guardados exitosamente.');
        setShowInfoModal(true);
        setShowConfirmTriajeModal(false);
        // Navegar después de que el usuario cierre el modal informativo
      } else {
        const errorData = await response.json();
        setInfoModalMessage(`Error al guardar signos vitales y triaje: ${errorData.message || response.statusText}`);
        setShowInfoModal(true);
        console.error('Error al guardar signos vitales y triaje:', errorData);
      }
    } catch (error) {
      console.error('Error en la solicitud de guardar signos vitales y triaje:', error);
      setInfoModalMessage('Error de conexión al guardar signos vitales y triaje. Por favor, intente de nuevo.');
      setShowInfoModal(true);
    }
  };

  const handleTriajeChange = (e) => {
    const selectedTriajeId = parseInt(e.target.value);
    const selectedTriaje = categoriasTriaje.find(cat => cat.id === selectedTriajeId);
    setTriajeSeleccionadoProfesional(selectedTriaje);
  };

  const handleAsignarTriajeSolo = async () => {
    // Limpiar error anterior
    setErrorObservacionTriaje('');
    
    if (!triajeParaAsignar) {
      setInfoModalMessage('Por favor, seleccione un triaje.');
      setShowInfoModal(true);
      return;
    }

    // Validar que la observación esté presente
    if (!observacionTriajeSolo || observacionTriajeSolo.trim() === '') {
      setErrorObservacionTriaje('La observación es obligatoria al asignar triaje ROJO sin signos vitales.');
      return;
    }

    if (!admisionId) {
      setInfoModalMessage('Error: ID de admisión no disponible.');
      setShowInfoModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/signos-vitales/asignar-triaje-solo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          admisionId: admisionId,
          triajeDefinitivoId: triajeParaAsignar.id,
          observacion: observacionTriajeSolo.trim()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInfoModalMessage(`Triaje ${result.triaje.nombre} (${result.triaje.color}) asignado exitosamente. El paciente puede proceder directamente al médico.`);
        setShowInfoModal(true);
        setShowAsignarTriajeModal(false);
        setTriajeParaAsignar(null);
        setObservacionTriajeSolo('');
        setErrorObservacionTriaje('');
      } else {
        const errorData = await response.json();
        setInfoModalMessage(`Error al asignar triaje: ${errorData.message || response.statusText}`);
        setShowInfoModal(true);
      }
    } catch (error) {
      console.error('Error en la solicitud de asignar triaje:', error);
      setInfoModalMessage('Error de conexión al asignar triaje. Por favor, intente de nuevo.');
      setShowInfoModal(true);
    }
  };

  if (!paciente) {
    return <div>Cargando datos del paciente...</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header /> {/* Añadir el componente Header */}
        <main className="p-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Tomar Signos Vitales para {paciente.nombreCompleto} ({paciente.numero_identificacion})</h2>
              <button
                type="button"
                onClick={openHistorialModal}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Ver Historial
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
          {/* Checkbox para "Sin constantes vitales" */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sinConstantesVitales"
              name="sinConstantesVitales"
              checked={formData.sinConstantesVitales}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="sinConstantesVitales" className="ml-2 block text-sm font-medium text-gray-900">
              Sin constantes vitales (Paciente fallecido)
            </label>
          </div>

        {/* Campos de Signos Vitales */}
        <fieldset disabled={formData.sinConstantesVitales || isFormDisabled} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="temperatura" className="block text-sm font-medium text-gray-700">Temperatura (°C):</label>
            <input type="number" step="0.1" id="temperatura" name="temperatura" value={formData.temperatura} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.temperatura && <p className="text-red-500 text-xs mt-1">{validationErrors.temperatura}</p>}
          </div>
          <div>
            <label htmlFor="presionArterial" className="block text-sm font-medium text-gray-700">Presión Arterial (mmHg):</label>
            <input type="text" id="presionArterial" name="presionArterial" value={formData.presionArterial} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" placeholder="Ej: 120/80" />
            {validationErrors.presionArterial && <p className="text-red-500 text-xs mt-1">{validationErrors.presionArterial}</p>}
          </div>
          <div>
            <label htmlFor="frecuenciaCardiaca" className="block text-sm font-medium text-gray-700">Frecuencia Cardíaca (/min):</label>
            <input type="number" id="frecuenciaCardiaca" name="frecuenciaCardiaca" value={formData.frecuenciaCardiaca} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.frecuenciaCardiaca && <p className="text-red-500 text-xs mt-1">{validationErrors.frecuenciaCardiaca}</p>}
          </div>
          <div>
            <label htmlFor="frecuenciaRespiratoria" className="block text-sm font-medium text-gray-700">Frecuencia Respiratoria (/min):</label>
            <input type="number" id="frecuenciaRespiratoria" name="frecuenciaRespiratoria" value={formData.frecuenciaRespiratoria} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.frecuenciaRespiratoria && <p className="text-red-500 text-xs mt-1">{validationErrors.frecuenciaRespiratoria}</p>}
          </div>
          <div>
            <label htmlFor="saturacionOxigeno" className="block text-sm font-medium text-gray-700">Saturación de Oxígeno (%):</label>
            <input type="number" step="0.1" id="saturacionOxigeno" name="saturacionOxigeno" value={formData.saturacionOxigeno} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.saturacionOxigeno && <p className="text-red-500 text-xs mt-1">{validationErrors.saturacionOxigeno}</p>}
          </div>
          <div>
            <label htmlFor="perimetroCefalico" className="block text-sm font-medium text-gray-700">Perímetro Cefálico (cm):</label>
            <input
              type="number"
              step="0.1"
              id="perimetroCefalico"
              name="perimetroCefalico"
              value={formData.perimetroCefalico}
              onChange={handleChange}
              required={!formData.sinConstantesVitales && isPerimetroCefalicoRequired && !isFormDisabled}
              disabled={!isPerimetroCefalicoRequired || isFormDisabled} // Deshabilitar si no es requerido o si el formulario está deshabilitado
              className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2"
            />
            {validationErrors.perimetroCefalico && <p className="text-red-500 text-xs mt-1">{validationErrors.perimetroCefalico}</p>}
            {!isPerimetroCefalicoRequired && (
              <p className="text-gray-500 text-xs mt-1">No requerido para pacientes mayores de 36 meses.</p>
            )}
          </div>
          <div>
            <label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso (kg):</label>
            <input type="number" step="0.1" id="peso" name="peso" value={formData.peso} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.peso && <p className="text-red-500 text-xs mt-1">{validationErrors.peso}</p>}
          </div>
          <div>
            <label htmlFor="talla" className="block text-sm font-medium text-gray-700">Talla (cm):</label>
            <input type="number" step="0.1" id="talla" name="talla" value={formData.talla} onChange={handleChange} required={!formData.sinConstantesVitales && !isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.talla && <p className="text-red-500 text-xs mt-1">{validationErrors.talla}</p>}
          </div>
          {imc && (
            <div className="text-sm font-medium text-gray-700 col-span-full">
              IMC: <span className="font-bold">{imc}</span>
            </div>
          )}
          <div>
            <label htmlFor="glicemiaCapilar" className="block text-sm font-medium text-gray-700">Glicemia Capilar (mg/dl):</label>
            <input type="number" step="0.1" id="glicemiaCapilar" name="glicemiaCapilar" value={formData.glicemiaCapilar} onChange={handleChange} disabled={isFormDisabled} className="mt-1 block w-2/3 border border-gray-300 rounded-md shadow-sm p-2" />
            {validationErrors.glicemiaCapilar && <p className="text-red-500 text-xs mt-1">{validationErrors.glicemiaCapilar}</p>}
          </div>

          {/* Motivo de Consulta y Categorización */}
          <div className="col-span-full mb-4">
            <label className="block text-sm font-medium text-gray-700">Motivo de Consulta:</label>
            <input
              type="text"
              id="motivoConsulta"
              name="motivoConsulta"
              value={motivoConsulta.texto}
              disabled
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 cursor-not-allowed"
            />
            {motivoConsulta.categoria && (
              <p className="text-sm text-gray-600 mt-1">
                Categoría: {motivoConsulta.categoria} - Código Triaje: {motivoConsulta.codigoTriaje}
              </p>
            )}
          </div>

          {/* Semaforización del Triaje */}
          <div className="mt-4 col-span-full">
            <label className="block text-sm font-medium text-gray-700">
              Semaforización del Triaje:
              <button
                type="button"
                onClick={() => setShowTriajeModal(true)}
                className="ml-2 text-blue-600 hover:underline text-xs"
              >
                Ver Criterios
              </button>
            </label>
            <div className={`w-8 h-8 rounded-full mt-1`} style={{ backgroundColor: triajeColor }}></div>
            {triajeCalculadoBackend && triajeSeleccionadoProfesional && triajeCalculadoBackend.id !== triajeSeleccionadoProfesional.id && (
              <p className="text-sm text-red-500 mt-1">Triaje modificado por el profesional. Original: {triajeCalculadoBackend.nombre} ({triajeCalculadoBackend.color})</p>
            )}
          </div>

          <div className="col-span-full">
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones:</label>
            <textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} rows="3" disabled={isFormDisabled} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>
        </fieldset>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate('/signosvitales')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isFormDisabled}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              // Cargar categorías de triaje si no están cargadas
              if (categoriasTriaje.length === 0) {
                fetch('http://localhost:3001/api/cat-triaje', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                })
                  .then(res => res.json())
                  .then(data => {
                    setCategoriasTriaje(data);
                    setShowAsignarTriajeModal(true);
                  })
                  .catch(err => {
                    console.error('Error al cargar categorías de triaje:', err);
                    setInfoModalMessage('Error al cargar las categorías de triaje.');
                    setShowInfoModal(true);
                  });
              } else {
                setShowAsignarTriajeModal(true);
              }
            }}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            disabled={isFormDisabled}
          >
            ⚠️ Asignar Solo Triaje (Sin Signos Vitales)
          </button>
          <button
            type="button"
            onClick={() => setShowAltaVoluntariaModal(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isFormDisabled || !admisionId}
          >
            🚪 Alta Voluntaria / Paciente se Retira
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isFormDisabled}
          >
            Guardar Signos Vitales
          </button>
        </div>
      </form>
        </div>
      </main>
      {showTriajeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Criterios de Triaje de Manchester</h3>
            <ul className="space-y-3">
              {categoriasTriaje.map((cat) => (
                <li key={cat.id} className="flex items-start">
                  <span className={`w-5 h-5 rounded-full mr-3 flex-shrink-0`} style={{ backgroundColor: convertirColorACSS(cat.color) }}></span>
                  <div>
                    <p className="font-semibold text-gray-900">{cat.nombre} ({cat.color})</p>
                    <p className="text-sm text-gray-600">{cat.descripcion}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTriajeModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      {showConfirmTriajeModal && triajeCalculadoBackend && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-center">Confirmación de Triaje</h3>
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold">Triaje Calculado por el Sistema:</p>
              <div className="flex items-center justify-center mt-2">
                <span className={`w-8 h-8 rounded-full mr-3`} style={{ backgroundColor: convertirColorACSS(triajeCalculadoBackend.color) }}></span>
                <p className="text-xl font-bold" style={{ color: convertirColorACSS(triajeCalculadoBackend.color) }}>{triajeCalculadoBackend.nombre}</p>
              </div>
              <p className="text-sm text-gray-600 mt-2">¿Está de acuerdo con el triaje calculado?</p>
            </div>

            <div className="mb-4">
              <label htmlFor="triajeProfesional" className="block text-sm font-medium text-gray-700 mb-2">
                Triaje del Profesional (si desea cambiar):
              </label>
              <select
                id="triajeProfesional"
                name="triajeProfesional"
                value={triajeSeleccionadoProfesional ? triajeSeleccionadoProfesional.id : ''}
                onChange={handleTriajeChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                {categoriasTriaje.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre} ({cat.color})
                  </option>
                ))}
              </select>
              {triajeSeleccionadoProfesional && (
                <div className="flex items-center mt-2">
                  <span className={`w-5 h-5 rounded-full mr-2`} style={{ backgroundColor: convertirColorACSS(triajeSeleccionadoProfesional.color) }}></span>
                  <p className="text-sm text-gray-700">Triaje seleccionado: <span className="font-bold" style={{ color: convertirColorACSS(triajeSeleccionadoProfesional.color) }}>{triajeSeleccionadoProfesional.nombre}</span></p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowConfirmTriajeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTriaje}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Confirmar Triaje
              </button>
            </div>
          </div>
        </div>
      )}
      <HistorialSignosVitalesModal
        isOpen={isHistorialModalOpen}
        onClose={closeHistorialModal}
        admisionId={admisionId}
      />
      {showInfoModal && (
        <ConfirmModal
          message={infoModalMessage}
          isOpen={showInfoModal}
          onConfirm={() => {
            setShowInfoModal(false);
            if (infoModalMessage.includes('ID de admisión no válido') || infoModalMessage.includes('Error al cargar datos del paciente')) {
              navigate('/signosvitales');
            } else if (infoModalMessage.includes('Signos vitales y triaje guardados exitosamente.') || infoModalMessage.includes('Triaje') && infoModalMessage.includes('asignado exitosamente')) {
              navigate('/signosvitales', { state: { refresh: true } });
            }
          }}
          isInformative={true}
        />
      )}
      
      {/* Modal para asignar solo triaje sin signos vitales */}
      {showAsignarTriajeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-4 border-orange-500">
            <h3 className="text-xl font-bold mb-4 text-orange-600 flex items-center">
              ⚠️ Asignar Solo Triaje (Sin Signos Vitales)
            </h3>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-sm text-red-800 font-bold mb-2">
                ⚠️ SOLO TRIAGE ROJO (RESUCITACIÓN)
              </p>
              <p className="text-xs text-red-700">
                Este modal solo permite asignar triaje ROJO sin signos vitales. Para otros triajes, debe tomar signos vitales primero.
              </p>
            </div>
            <div className="mb-4">
              <label htmlFor="triajeParaAsignar" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccione el Triaje: <span className="text-red-600">*</span>
              </label>
              <select
                id="triajeParaAsignar"
                value={triajeParaAsignar ? triajeParaAsignar.id : ''}
                onChange={(e) => {
                  const selectedTriajeId = parseInt(e.target.value);
                  const selectedTriaje = categoriasTriaje.find(cat => cat.id === selectedTriajeId);
                  setTriajeParaAsignar(selectedTriaje);
                  // Limpiar error si se selecciona un triaje
                  if (errorObservacionTriaje) {
                    setErrorObservacionTriaje('');
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">Seleccione un triaje</option>
                {categoriasTriaje
                  .filter(cat => cat.nombre === 'RESUCITACIÓN' || cat.color?.toLowerCase() === 'rojo')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre} ({cat.color})
                    </option>
                  ))}
              </select>
              {triajeParaAsignar && (
                <div className="flex items-center mt-2">
                  <span className={`w-5 h-5 rounded-full mr-2`} style={{ backgroundColor: convertirColorACSS(triajeParaAsignar.color) }}></span>
                  <p className="text-sm text-gray-700">
                    Triaje seleccionado: <span className="font-bold text-red-600">{triajeParaAsignar.nombre}</span>
                    <span className="ml-2 text-red-600 font-semibold">(Puede proceder directamente al médico)</span>
                  </p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="observacionTriajeSolo" className="block text-sm font-medium text-gray-700 mb-2">
                Observación (Obligatoria): <span className="text-red-600">*</span>
              </label>
              <textarea
                id="observacionTriajeSolo"
                value={observacionTriajeSolo}
                onChange={(e) => {
                  setObservacionTriajeSolo(e.target.value);
                  // Limpiar error cuando el usuario empiece a escribir
                  if (errorObservacionTriaje) {
                    setErrorObservacionTriaje('');
                  }
                }}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 h-24 ${
                  errorObservacionTriaje ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Paciente en estado crítico, requiere reanimación inmediata, signos vitales inestables..."
                required
              ></textarea>
              {errorObservacionTriaje && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-sm font-semibold flex items-center">
                    <span className="mr-2">⚠️</span>
                    {errorObservacionTriaje}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAsignarTriajeModal(false);
                  setTriajeParaAsignar(null);
                  setObservacionTriajeSolo('');
                  setErrorObservacionTriaje('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignarTriajeSolo}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                disabled={!triajeParaAsignar || !observacionTriajeSolo.trim()}
              >
                Confirmar Asignación ROJO
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para Alta Voluntaria */}
      {showAltaVoluntariaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-4 border-red-500">
            <h3 className="text-xl font-bold mb-4 text-red-600 flex items-center">
              🚪 Alta Voluntaria / Paciente se Retira
            </h3>
            <p className="text-gray-700 mb-4">
              El paciente ha decidido no continuar con la atención médica. Por favor, proporcione una observación sobre el motivo del retiro.
            </p>
            <div className="mb-4">
              <label htmlFor="observacionAltaVoluntaria" className="block text-sm font-medium text-gray-700 mb-2">
                Observación (Obligatorio): <span className="text-red-600">*</span>
              </label>
              <textarea
                id="observacionAltaVoluntaria"
                value={observacionAltaVoluntaria}
                onChange={(e) => setObservacionAltaVoluntaria(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"
                placeholder="Ej: Paciente no desea esperar atención médica, paciente se retira voluntariamente..."
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAltaVoluntariaModal(false);
                  setObservacionAltaVoluntaria('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!observacionAltaVoluntaria.trim()) {
                    alert('Por favor, proporcione una observación sobre el motivo del retiro.');
                    return;
                  }
                  
                  try {
                    const token = localStorage.getItem('token');
                    const response = await axios.put(
                      `http://localhost:3001/api/atencion-paciente-estado/${admisionId}/estado`,
                      {
                        estado: 'ALTA_VOLUNTARIA',
                        observaciones: observacionAltaVoluntaria.trim()
                      },
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                    
                    setInfoModalMessage('Alta voluntaria registrada exitosamente.');
                    setShowInfoModal(true);
                    setShowAltaVoluntariaModal(false);
                    setObservacionAltaVoluntaria('');
                  } catch (error) {
                    console.error('Error al registrar alta voluntaria:', error);
                    setInfoModalMessage('Error al registrar la alta voluntaria. Por favor, intente nuevamente.');
                    setShowInfoModal(true);
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                disabled={!observacionAltaVoluntaria.trim()}
              >
                Confirmar Alta Voluntaria
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}