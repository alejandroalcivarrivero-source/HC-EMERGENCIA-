import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-timezone'; // Re-importar moment-timezone
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import NotificationModal from './NotificationModal';
import AutoCompleteInput from './AutoCompleteInput';
import { validarCedulaEcuador } from '../utils/validaciones';

export default function AdmisionForm() {
  const navigate = useNavigate();
  const [userRolId, setUserRolId] = useState(null); // Estado para el rol del usuario
  const [tiposIdentificacion, setTiposIdentificacion] = useState([]);
  const [estadosCiviles, setEstadosCiviles] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [provinciasNacimiento, setProvinciasNacimiento] = useState([]);
  const [paisesResidencia, setPaisesResidencia] = useState([]);
  const [provinciasResidencia, setProvinciasResidencia] = useState([]);
  const [autoidentificacionesEtnicas, setAutoidentificacionesEtnicas] = useState([]);
  const [nacionalidadesPueblosList, setNacionalidadesPueblosList] = useState([]);
  const [pueblosKichwaList, setPueblosKichwaList] = useState([]);
  const [nivelesEducacion, setNivelesEducacion] = useState([]);
  const [gradosNivelesEducacion, setGradosNivelesEducacion] = useState([]);
  const [tiposEmpresaTrabajo, setTiposEmpresaTrabajo] = useState([]);
  const [ocupacionesProfesiones, setOcupacionesProfesiones] = useState([]);
  const [segurosSalud, setSegurosSalud] = useState([]);
  const [tiposBono, setTiposBono] = useState([]);
  const [tieneDiscapacidades, setTieneDiscapacidades] = useState([]);
  const [tiposDiscapacidad, setTiposDiscapacidad] = useState([]);
  const [parentescosContacto, setParentescosContacto] = useState([]);
  const [parentescosRepresentante, setParentescosRepresentante] = useState([]); // Nuevo estado
  const [formasLlegadaList, setFormasLlegadaList] = useState([]);
  const [fuentesInformacion, setFuentesInformacion] = useState([]);
  const [pacienteIdExistente, setPacienteIdExistente] = useState(null); // Nuevo estado para el ID del paciente existente
  const [motivosConsultaSugerencias, setMotivosConsultaSugerencias] = useState([]); // Nuevo estado para sugerencias de motivos de consulta
  const [motivoConsultaSeleccionado, setMotivoConsultaSeleccionado] = useState(null); // Nuevo estado para el motivo de consulta seleccionado
  const [sugerirRevisionMedica, setSugerirRevisionMedica] = useState(false); // Nuevo estado para sugerir revisión médica
  const [formData, setFormData] = useState({
    // Datos Personales
    tipoIdentificacion: '',
    numeroIdentificacion: '',
    primerApellido: '',
    segundoApellido: '',
    primerNombre: '',
    segundoNombre: '',
    estadoCivil: '',
    sexo: '',
    telefono: '',
    celular: '',
    correoElectronico: '',

    // Datos de Nacimiento
    nacionalidad: '',
    lugarNacimiento: '',
    provinciaNacimiento: '',
    cantonNacimiento: '',
    parroquiaNacimiento: '',
    fechaNacimiento: '', // Ahora contendrá fecha y hora en un solo campo datetime-local
    anioNacimiento: '',
    mesNacimiento: '',
    diaNacimiento: '',
    // Nuevos campos para representante en Datos de Nacimiento
    cedulaRepresentante: '',
    apellidosNombresRepresentante: '',
    parentescoRepresentanteNacimiento: '',

    // Datos de Residencia
    paisResidencia: '',
    provinciaResidencia: '',
    cantonResidencia: '',
    parroquiaResidencia: '',
    callePrincipal: '',
    calleSecundaria: '',
    barrioResidencia: '',
    referenciaResidencia: '',

    // Datos Adicionales
    autoidentificacionEtnica: '',
    nacionalidadPueblos: '',
    puebloKichwa: '',
    nivelEducacion: '',
    gradoNivelEducacion: '',
    tipoEmpresaTrabajo: '',
    ocupacionProfesionPrincipal: '',
    seguroSaludPrincipal: '',
    tipoBonoRecibe: '',
    tieneDiscapacidad: '',
    tipoDiscapacidad: '', // Nuevo campo para el tipo de discapacidad

    // Datos de Contacto
    contactoEnCasoNecesario: '',
    parentescoContacto: '',
    telefonoContacto: '',
    direccionContacto: '',

    // Forma de Llegada
    formaLlegada: '',
    fuenteInformacion: '',
    institucionPersonaEntrega: '',
    telefonoEntrega: '',
    motivoConsulta: '' // Nuevo campo para el motivo de consulta
  });

  // Función para validar cédula ecuatoriana
  const validarCedulaEcuatoriana = (cedula) => {
    return validarCedulaEcuador(cedula);
  };

  const calculateAge = (birthDateTimeString) => {
    if (!birthDateTimeString) {
      setFormData(prev => ({
        ...prev,
        anioNacimiento: '',
        mesNacimiento: '',
        diaNacimiento: '',
      }));
      setCalculatedAgeInHours(''); // Limpiar edad en horas si no hay fecha/hora
      setIsUnderTwoYears(false);
      setShowPartoQuestion(false);
      return;
    }
    
    const birth = new Date(birthDateTimeString); // Convertir la cadena a objeto Date
    
    // Asegurarse de que birth sea un objeto Date válido
    if (isNaN(birth.getTime())) {
      console.error("Fecha de nacimiento inválida:", birthDateTimeString);
      setFormData(prev => ({
        ...prev,
        anioNacimiento: '',
        mesNacimiento: '',
        diaNacimiento: '',
      }));
      setCalculatedAgeInHours('');
      setIsUnderTwoYears(false);
      setShowPartoQuestion(false);
      return;
    }

    const today = new Date(); // Obtener la fecha y hora actual

    if (birth.getTime() > today.getTime()) { // Comparar con la hora actual también
      showNotification('Fecha Inválida', 'La fecha y hora de nacimiento no pueden ser mayores a la fecha y hora actual.', 'error');
      setFormData(prev => ({
        ...prev,
        fechaNacimiento: '',
        anioNacimiento: '',
        mesNacimiento: '',
        diaNacimiento: '',
      }));
      setCalculatedAgeInHours(''); // Limpiar edad en horas
      setIsUnderTwoYears(false);
      setShowPartoQuestion(false);
      return;
    }

    // Calcular la diferencia en milisegundos
    const diffMillis = today.getTime() - birth.getTime();

    // Calcular la edad en años, meses y días
    let ageYears = today.getFullYear() - birth.getFullYear();
    let ageMonths = today.getMonth() - birth.getMonth();
    let ageDays = today.getDate() - birth.getDate();

    // Ajustar si el día o el mes actual es anterior al día o mes de nacimiento
    if (ageDays < 0) {
      ageMonths--;
      // Obtener el número de días en el mes anterior al actual
      ageDays += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (ageMonths < 0) {
      ageYears--;
      ageMonths += 12;
    }

    // Calcular la edad en horas
    const totalHours = Math.floor(diffMillis / (1000 * 60 * 60));
    const currentCalculatedAgeInHours = totalHours.toString();

    setFormData(prev => ({
      ...prev,
      anioNacimiento: ageYears.toString(),
      mesNacimiento: ageMonths.toString(),
      diaNacimiento: ageDays.toString(),
    }));
    setCalculatedAgeInHours(currentCalculatedAgeInHours);
    
    // Calcular la diferencia en días para la pregunta del parto
    const diffDaysForQuestion = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
    
    if (diffDaysForQuestion <= 2) {
      if (!hasAskedPartoQuestion) { // Solo preguntar si no se ha preguntado ya
        setModalMessage('¿El parto fue atendido en esta casa de salud?');
        setIsModalOpen(true);
        // setHasAskedPartoQuestion(true) se hará en handleModalConfirm/Cancel
      }
      setShowPartoQuestion(true); // Mostrar el campo de edad en horas
    } else {
      setShowPartoQuestion(false);
      setPartoEnCentroSalud(false); // Resetear si ya no aplica
      setHasAskedPartoQuestion(false); // Resetear la bandera si ya no cumple la condición
    }
    setIsUnderTwoYears(ageYears < 2); // La lógica de menor de 2 años sigue siendo por años
    setDiffDaysState(diffDaysForQuestion); // Actualizar el estado diffDaysState
  };


  const validateTab = (tabName) => {
    let isValid = true;
    let message = '';

    switch (tabName) {
      case 'personales':
        if (!formData.tipoIdentificacion) { isValid = false; message = 'Tipo de Identificación'; }
        if (formData.tipoIdentificacion !== 'NoIdentificado' && !formData.numeroIdentificacion) { isValid = false; message = 'Número de Identificación'; }
        if (!formData.primerApellido) { isValid = false; message = 'Primer Apellido'; }
        if (!formData.primerNombre) { isValid = false; message = 'Primer Nombre'; }
        if (!formData.estadoCivil) { isValid = false; message = 'Estado Civil'; }
        if (!formData.sexo) { isValid = false; message = 'Sexo'; }
        if (!formData.celular) { isValid = false; message = 'Celular'; }
        break;
      case 'nacimiento':
        if (!formData.nacionalidad) { isValid = false; message = 'Nacionalidad'; }
        if (!formData.fechaNacimiento) { isValid = false; message = 'Fecha de Nacimiento'; }
        if (!formData.provinciaNacimiento) { isValid = false; message = 'Provincia de Nacimiento'; }
        if (!formData.cantonNacimiento) { isValid = false; message = 'Cantón de Nacimiento'; }
        if (!formData.parroquiaNacimiento) { isValid = false; message = 'Parroquia de Nacimiento'; }
        if (isUnderTwoYears) {
          if (!formData.cedulaRepresentante) { isValid = false; message = 'Cédula de Representante'; }
          if (!formData.apellidosNombresRepresentante) { isValid = false; message = 'Apellidos y Nombres del Representante'; }
          if (!formData.parentescoRepresentanteNacimiento) { isValid = false; message = 'Parentesco del Representante'; }
        }
        break;
      case 'residencia':
        if (!formData.paisResidencia) { isValid = false; message = 'País de Residencia'; }
        if (!formData.provinciaResidencia) { isValid = false; message = 'Provincia de Residencia'; }
        if (!formData.cantonResidencia) { isValid = false; message = 'Cantón de Residencia'; }
        if (!formData.parroquiaResidencia) { isValid = false; message = 'Parroquia de Residencia'; }
        if (!formData.callePrincipal) { isValid = false; message = 'Calle Principal'; }
        if (!formData.barrioResidencia) { isValid = false; message = 'Barrio de Residencia'; }
        break;
      case 'adicionales':
        if (!formData.autoidentificacionEtnica) { isValid = false; message = 'Autoidentificación Étnica'; }
        if (formData.autoidentificacionEtnica === 'Indígena' && !formData.nacionalidadPueblos) { isValid = false; message = 'Nacionalidad y Pueblos'; }
        if (formData.nacionalidadPueblos === 'Kichwa' && !formData.puebloKichwa) { isValid = false; message = 'Pueblo Kichwa'; }
        if (!formData.nivelEducacion) { isValid = false; message = 'Nivel de Educación'; }
        if (!formData.gradoNivelEducacion) { isValid = false; message = 'Estado de Nivel de Educación'; }
        if (!formData.tipoEmpresaTrabajo) { isValid = false; message = 'Tipo de Empresa de Trabajo'; }
        if (!formData.ocupacionProfesionPrincipal) { isValid = false; message = 'Ocupación Profesión Principal'; }
        if (!formData.seguroSaludPrincipal) { isValid = false; message = 'Seguro de Salud Principal'; }
        if (!formData.tipoBonoRecibe) { isValid = false; message = 'Tipo de Bono que Recibe'; }
        if (!formData.tieneDiscapacidad) { isValid = false; message = 'Tiene Discapacidad'; }
        if (formData.tieneDiscapacidad === 'Sí' && !formData.tipoDiscapacidad) { isValid = false; message = 'Tipo de Discapacidad'; }
        break;
      case 'contacto':
        if (!formData.contactoEnCasoNecesario) { isValid = false; message = 'Contacto en caso de emergencia'; }
        if (!formData.parentescoContacto) { isValid = false; message = 'Parentesco del Contacto'; }
        if (!formData.telefonoContacto) { isValid = false; message = 'Teléfono del Contacto'; }
        if (!formData.direccionContacto) { isValid = false; message = 'Dirección del Contacto'; }
        break;
      case 'formaLlegada':
        if (!formData.formaLlegada) { isValid = false; message = 'Forma de Llegada'; }
        if (!formData.fuenteInformacion) { isValid = false; message = 'Fuente de Información'; }
        if (!formData.institucionPersonaEntrega) { isValid = false; message = 'Institución o Persona que Entrega al Paciente'; }
        if (!formData.telefonoEntrega) { isValid = false; message = 'Número de Teléfono de Entrega'; }
        break;
      case 'motivoConsulta':
        if (!motivoConsultaSeleccionado) { isValid = false; message = 'Motivo de Consulta'; }
        break;
      default:
        break;
    }

    return { isValid, message };
  };

  const tabOrder = ['personales', 'nacimiento', 'residencia', 'adicionales', 'contacto', 'formaLlegada', 'motivoConsulta'];

  const isTabEnabled = (tabName) => {
    const targetIndex = tabOrder.indexOf(tabName);
    if (targetIndex === 0) return true; // La primera pestaña siempre está habilitada

    for (let i = 0; i < targetIndex; i++) {
      const { isValid } = validateTab(tabOrder[i]);
      if (!isValid) {
        return false;
      }
    }
    return true;
  };
 
  const handleTabChange = (tabName) => {
    const currentTabIndex = tabOrder.indexOf(activeTab);
    const nextTabIndex = tabOrder.indexOf(tabName);

    if (nextTabIndex > currentTabIndex) {
      // Intentando avanzar a una pestaña posterior
      let canProceed = true;
      let errorMessage = '';
      for (let i = 0; i < nextTabIndex; i++) {
        const tabToValidate = tabOrder[i];
        const { isValid, message } = validateTab(tabToValidate);
        if (!isValid) {
          canProceed = false;
          errorMessage = message;
          setActiveTab(tabToValidate); // Volver a la pestaña con el error
          break;
        }
      }
      if (canProceed) {
        setActiveTab(tabName);
      } else {
        showNotification('Campo Obligatorio', `Por favor, complete el campo obligatorio: ${errorMessage} en la pestaña actual.`, 'warning');
      }
    } else {
      // Retrocediendo o haciendo clic en la pestaña actual, siempre permitido
      setActiveTab(tabName);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => {
      let updatedFormData = { ...prevFormData, [name]: value };

      // Lógica para el campo motivoConsulta
      if (name === 'motivoConsulta') {
        // Si el usuario cambia el texto manualmente, limpiar la selección si no coincide
        if (motivoConsultaSeleccionado && value !== motivoConsultaSeleccionado.Motivo_Consulta_Sintoma) {
          setMotivoConsultaSeleccionado(null);
        } else if (!value) {
          // Si se limpia el campo, limpiar también la selección
          setMotivoConsultaSeleccionado(null);
        }
      }

      // Lógica para el campo tipoIdentificacion
      if (name === 'tipoIdentificacion') {
        if (value === 'NoIdentificado') {
          updatedFormData = {
            // Mantener solo tipoIdentificacion y numeroIdentificacion (que se generará)
            tipoIdentificacion: value, // Usar el valor actual del select
            numeroIdentificacion: prevFormData.numeroIdentificacion, // Mantener el número actual hasta que se genere uno nuevo
            // Resetear el resto de los campos
            primerApellido: '',
            segundoApellido: '',
            primerNombre: '',
            segundoNombre: '',
            estadoCivil: '',
            sexo: '',
            telefono: '',
            celular: '',
            correoElectronico: '',
            nacionalidad: '',
            lugarNacimiento: '',
            provinciaNacimiento: '',
            cantonNacimiento: '',
            parroquiaNacimiento: '',
            fechaNacimiento: '',
            anioNacimiento: '',
            mesNacimiento: '',
            diaNacimiento: '',
            cedulaRepresentante: '',
            apellidosNombresRepresentante: '',
            parentescoRepresentanteNacimiento: '',
            paisResidencia: '',
            provinciaResidencia: '',
            cantonResidencia: '',
            parroquiaResidencia: '',
            callePrincipal: '',
            calleSecundaria: '',
            barrioResidencia: '',
            referenciaResidencia: '',
            autoidentificacionEtnica: '',
            nacionalidadPueblos: '',
            puebloKichwa: '',
            nivelEducacion: '',
            gradoNivelEducacion: '',
            tipoEmpresaTrabajo: '',
            ocupacionProfesionPrincipal: '',
            seguroSaludPrincipal: '',
            tipoBonoRecibe: '',
            tieneDiscapacidad: '',
            tipoDiscapacidad: '',
            contactoEnCasoNecesario: '',
            parentescoContacto: '',
            telefonoContacto: '',
            direccionContacto: '',
            formaLlegada: '',
            fuenteInformacion: '',
            institucionPersonaEntrega: '',
            telefonoEntrega: '',
            motivoConsulta: ''
          };
          setPacienteEncontrado(false);
          setPacienteIdExistente(null);
          setIsFormEnabledForNewEntry(true);
          setPartoEnCentroSalud(false);
          setHasAskedPartoQuestion(false);
          setIsUnderTwoYears(false);
          setShowPartoQuestion(false);
          setCalculatedAgeInHours('0');
          setPartoTime('');
          setMotivoConsultaSeleccionado(null);
          setCantonesEcuador([]);
          setParroquiasEcuador([]);
          setProvinciasEcuador([]);
          setCantonesResidenciaList([]);
          setParroquiasResidenciaList([]);
          setIsNacionalidadPueblosEnabled(false);
          setIsPuebloKichwaEnabled(false);
          setIsTipoDiscapacidadEnabled(false);
          setIsEntregaFieldsDisabled(false);
        } else if (value !== '') {
          updatedFormData.numeroIdentificacion = '';
          setIsFormEnabledForNewEntry(true);
          setPacienteEncontrado(false);
        } else {
          setIsFormEnabledForNewEntry(false);
          // La lógica de limpieza se maneja directamente en updatedFormData y los setXxx
        }
      }

      // Lógica para Datos Adicionales
      if (name === 'autoidentificacionEtnica') {
        if (value === 'Indígena') {
          setIsNacionalidadPueblosEnabled(true);
        } else {
          setIsNacionalidadPueblosEnabled(false);
          setIsPuebloKichwaEnabled(false);
          updatedFormData.nacionalidadPueblos = '';
          updatedFormData.puebloKichwa = '';
        }
      }

      if (name === 'nacionalidadPueblos') {
        if (updatedFormData.autoidentificacionEtnica === 'Indígena' && value === 'Kichwa') {
          setIsPuebloKichwaEnabled(true);
        } else {
          setIsPuebloKichwaEnabled(false);
          updatedFormData.puebloKichwa = '';
        }
      }

      // Lógica para el campo formaLlegada
      if (name === 'formaLlegada') {
        if (value === 'Ambulancia' || value === 'Otro transporte') {
          updatedFormData.fuenteInformacion = 'Indirecta';
          setIsEntregaFieldsDisabled(false);
          updatedFormData.institucionPersonaEntrega = '';
          updatedFormData.telefonoEntrega = '';
        } else if (value === 'Ambulatorio') {
          updatedFormData.fuenteInformacion = 'Directa';
          setIsEntregaFieldsDisabled(true);
          updatedFormData.institucionPersonaEntrega = `${updatedFormData.primerApellido || ''} ${updatedFormData.segundoApellido || ''} ${updatedFormData.primerNombre || ''} ${updatedFormData.segundoNombre || ''}`.trim();
          updatedFormData.telefonoEntrega = updatedFormData.celular || '';
        } else {
          updatedFormData.fuenteInformacion = '';
          setIsEntregaFieldsDisabled(false);
          updatedFormData.institucionPersonaEntrega = '';
          updatedFormData.telefonoEntrega = '';
        }
      }

      // Si los campos de entrega están deshabilitados (Ambulatorio), actualizar también al cambiar datos personales o celular
      if (updatedFormData.formaLlegada === 'Ambulatorio' && (name === 'primerApellido' || name === 'segundoApellido' || name === 'primerNombre' || name === 'segundoNombre' || name === 'celular')) {
        updatedFormData.institucionPersonaEntrega = `${updatedFormData.primerApellido || ''} ${updatedFormData.segundoApellido || ''} ${updatedFormData.primerNombre || ''} ${updatedFormData.segundoNombre || ''}`.trim();
        updatedFormData.telefonoEntrega = updatedFormData.celular || '';
      }

      // Lógica para fechaNacimiento (movida dentro del setFormData)
      if (name === 'fechaNacimiento') {
        const selectedDate = value;
        const existingTime = prevFormData.fechaNacimiento ? prevFormData.fechaNacimiento.split('T')[1] : '00:00';
        const tempDateForDiff = new Date(selectedDate);
        const today = new Date();
        const diffMillis = today.getTime() - tempDateForDiff.getTime();
        const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

        let newDateTimeString = '';
        if (diffDays > 2) {
          newDateTimeString = `${selectedDate}T00:00`;
        } else {
          newDateTimeString = `${selectedDate}T${existingTime}`;
        }
        updatedFormData.fechaNacimiento = newDateTimeString;
      }

      // Lógica para el campo de discapacidad (movida dentro del setFormData)
      if (name === 'tieneDiscapacidad') {
        if (value === 'Sí') {
          setIsTipoDiscapacidadEnabled(true);
        } else {
          setIsTipoDiscapacidadEnabled(false);
          updatedFormData.tipoDiscapacidad = '';
        }
      }

      // Lógica para nacionalidad (movida dentro del setFormData)
      if (name === 'nacionalidad') {
        if (value !== 'Ecuatoriana') {
          updatedFormData.provinciaNacimiento = '';
          updatedFormData.cantonNacimiento = '';
          updatedFormData.parroquiaNacimiento = '';
          updatedFormData.lugarNacimiento = '';
          setCantonesEcuador([]);
          setParroquiasEcuador([]);
          setProvinciasEcuador([]);
        }
      }

      // Lógica para paisResidencia (movida dentro del setFormData)
      if (name === 'paisResidencia') {
        if (value !== 'Ecuador') {
          updatedFormData.provinciaResidencia = '';
          updatedFormData.cantonResidencia = '';
          updatedFormData.parroquiaResidencia = '';
          setCantonesResidenciaList([]);
          setParroquiasResidenciaList([]);
        }
      }

      // Lógica para provinciaResidencia (movida dentro del setFormData)
      if (name === 'provinciaResidencia') {
        const provinciaSeleccionada = provinciasResidenciaList.find(p => p.nombre === value);
        if (provinciaSeleccionada) {
          obtenerCantonesResidencia(provinciaSeleccionada.id);
        } else {
          setCantonesResidenciaList([]);
          setParroquiasResidenciaList([]);
          updatedFormData.cantonResidencia = '';
          updatedFormData.parroquiaResidencia = '';
        }
      }

      // Lógica para cantonResidencia (movida dentro del setFormData)
      if (name === 'cantonResidencia') {
        const cantonSeleccionado = cantonesResidenciaList.find(c => c.nombre === value);
        if (cantonSeleccionado) {
          obtenerParroquiasResidencia(cantonSeleccionado.id);
        } else {
          setParroquiasResidenciaList([]);
          updatedFormData.parroquiaResidencia = '';
        }
      }

      return updatedFormData;
    });
  };

  // Funciones para obtener cantones y parroquias de residencia (movidas fuera de handleChange)
  const obtenerCantonesResidencia = async (provinciaId) => {
    try {
      const response = await fetch(`http://localhost:3001/usuarios/cantones/${provinciaId}`);
      const data = await response.json();
      setCantonesResidenciaList(data);
      setParroquiasResidenciaList([]); // Limpiar parroquias al cambiar cantón
      return data; // Devolver los datos
    } catch (error) {
      console.error('Error al obtener los cantones de residencia:', error);
      return [];
    }
  };

  const obtenerParroquiasResidencia = async (cantonId) => {
    try {
      const response = await fetch(`http://localhost:3001/usuarios/parroquias/${cantonId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setParroquiasResidenciaList(data);
      return data; // Devolver los datos
    } catch (error) {
      console.error('Error al obtener las parroquias de residencia:', error);
      return [];
    }
  };

  const handleChangePartoTime = (e) => {
    const newTime = e.target.value; // Formato "HH:MM"
    setPartoTime(newTime);

    if (formData.fechaNacimiento) {
      const [datePart] = formData.fechaNacimiento.split('T'); // Obtener solo la parte de la fecha
      const newDateTime = `${datePart}T${newTime}`;
      setFormData(prev => ({
        ...prev,
        fechaNacimiento: newDateTime
      }));
    }
  };

  const buscarPacienteAutomatico = useCallback(async (numeroIdentificacion) => {
    if (!validarCedulaEcuatoriana(numeroIdentificacion)) {
      setPacienteEncontrado(false);
      // Solo limpiar si tenía datos previos o si se borró la cédula
      if (pacienteIdExistente) {
        limpiarFormularioManteniedoIdentificacion(numeroIdentificacion);
      }
      return;
    }

    setIsSearchingPatient(true);
    try {
      const response = await fetch(`http://localhost:3001/usuarios/buscarPaciente/${numeroIdentificacion}`);
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.paciente) {
          const pacienteData = responseData.paciente;
          setPacienteIdExistente(pacienteData.id);

          let loadedProvinciaNacimiento = '';
          let loadedCantonNacimiento = '';
          let loadedParroquiaNacimiento = '';
          let loadedLugarNacimiento = pacienteData.lugar_nacimiento || '';

          if (pacienteData.Nacionalidad && pacienteData.Nacionalidad.nombre === 'Ecuatoriana') {
            loadedProvinciaNacimiento = pacienteData.ProvinciaNacimiento?.nombre || '';
            loadedCantonNacimiento = pacienteData.CantonNacimiento?.nombre || '';
            loadedParroquiaNacimiento = pacienteData.ParroquiaNacimiento?.nombre || '';

            let parts = [];
            if (loadedProvinciaNacimiento) parts.push(loadedProvinciaNacimiento);
            if (loadedCantonNacimiento) parts.push(loadedCantonNacimiento);
            if (loadedParroquiaNacimiento) parts.push(loadedParroquiaNacimiento);
            loadedLugarNacimiento = parts.join('/');
          }

          setFormData(prev => ({
            ...prev,
            primerApellido: pacienteData.primer_apellido || '',
            segundoApellido: pacienteData.segundo_apellido || '',
            primerNombre: pacienteData.primer_nombre || '',
            segundoNombre: pacienteData.segundo_nombre || '',
            estadoCivil: pacienteData.EstadoCivil ? pacienteData.EstadoCivil.nombre : '',
            sexo: pacienteData.Sexo ? pacienteData.Sexo.nombre : '',
            telefono: pacienteData.DatosAdicionalesPaciente ? pacienteData.DatosAdicionalesPaciente.telefono : '',
            celular: pacienteData.DatosAdicionalesPaciente ? pacienteData.DatosAdicionalesPaciente.celular : '',
            correoElectronico: pacienteData.DatosAdicionalesPaciente ? pacienteData.DatosAdicionalesPaciente.correo_electronico : '',
            nacionalidad: pacienteData.Nacionalidad ? pacienteData.Nacionalidad.nombre : '',
            lugarNacimiento: loadedLugarNacimiento,
            provinciaNacimiento: loadedProvinciaNacimiento,
            cantonNacimiento: loadedCantonNacimiento,
            parroquiaNacimiento: loadedParroquiaNacimiento,
            fechaNacimiento: pacienteData.fecha_nacimiento ? `${moment.utc(pacienteData.fecha_nacimiento).format('YYYY-MM-DD')}T${pacienteData.Partos && pacienteData.Partos.length > 0 && pacienteData.Partos[0].hora_parto ? pacienteData.Partos[0].hora_parto.substring(0, 5) : '00:00'}` : '',
            cedulaRepresentante: pacienteData.Representantes && pacienteData.Representantes.length > 0 ? pacienteData.Representantes[0].cedula_representante : '',
            apellidosNombresRepresentante: pacienteData.Representantes && pacienteData.Representantes.length > 0 ? pacienteData.Representantes[0].apellidos_nombres_representante : '',
            parentescoRepresentanteNacimiento: pacienteData.Representantes && pacienteData.Representantes.length > 0 && pacienteData.Representantes[0].Parentesco ? pacienteData.Representantes[0].Parentesco.nombre : '',
            paisResidencia: pacienteData.Residencia ? pacienteData.Residencia.pais_residencia : '',
            provinciaResidencia: pacienteData.Residencia && pacienteData.Residencia.Provincia ? pacienteData.Residencia.Provincia.nombre : '',
            cantonResidencia: pacienteData.Residencia && pacienteData.Residencia.Canton ? pacienteData.Residencia.Canton.nombre : '',
            parroquiaResidencia: pacienteData.Residencia && pacienteData.Residencia.Parroquia ? pacienteData.Residencia.Parroquia.nombre : '',
            callePrincipal: pacienteData.Residencia ? pacienteData.Residencia.calle_principal : '',
            calleSecundaria: pacienteData.Residencia ? pacienteData.Residencia.calle_secundaria : '',
            barrioResidencia: pacienteData.Residencia ? pacienteData.Residencia.barrio_residencia : '',
            referenciaResidencia: pacienteData.Residencia ? pacienteData.Residencia.referencia_residencia : '',
            autoidentificacionEtnica: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.AutoidentificacionEtnica ? pacienteData.DatosAdicionalesPaciente.AutoidentificacionEtnica.nombre : '',
            nacionalidadPueblos: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.NacionalidadPueblo ? pacienteData.DatosAdicionalesPaciente.NacionalidadPueblo.nombre : '',
            puebloKichwa: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.PuebloKichwa ? pacienteData.DatosAdicionalesPaciente.PuebloKichwa.nombre : '',
            nivelEducacion: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.NivelEducacionPaciente ? pacienteData.DatosAdicionalesPaciente.NivelEducacionPaciente.nombre : '',
            gradoNivelEducacion: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.GradoNivelEducacion ? pacienteData.DatosAdicionalesPaciente.GradoNivelEducacion.nombre : '',
            tipoEmpresaTrabajo: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.TipoEmpresaTrabajo ? pacienteData.DatosAdicionalesPaciente.TipoEmpresaTrabajo.nombre : '',
            ocupacionProfesionPrincipal: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.OcupacionProfesion ? pacienteData.DatosAdicionalesPaciente.OcupacionProfesion.nombre : '',
            seguroSaludPrincipal: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.SeguroSalud ? pacienteData.DatosAdicionalesPaciente.SeguroSalud.nombre : '',
            tipoBonoRecibe: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.TipoBono ? pacienteData.DatosAdicionalesPaciente.TipoBono.nombre : '',
            tieneDiscapacidad: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.TieneDiscapacidadPaciente ? pacienteData.DatosAdicionalesPaciente.TieneDiscapacidadPaciente.nombre : '',
            tipoDiscapacidad: pacienteData.DatosAdicionalesPaciente && pacienteData.DatosAdicionalesPaciente.TipoDiscapacidad ? pacienteData.DatosAdicionalesPaciente.TipoDiscapacidad.nombre : '',
            contactoEnCasoNecesario: pacienteData.ContactoEmergencia ? pacienteData.ContactoEmergencia.nombre_contacto : '',
            parentescoContacto: pacienteData.ContactoEmergencia && pacienteData.ContactoEmergencia.Parentesco ? pacienteData.ContactoEmergencia.Parentesco.nombre : '',
            telefonoContacto: pacienteData.ContactoEmergencia ? pacienteData.ContactoEmergencia.telefono : '',
            direccionContacto: pacienteData.ContactoEmergencia ? pacienteData.ContactoEmergencia.direccion : '',
          }));

          setPacienteEncontrado(true);
          setIsFormEnabledForNewEntry(true);
          setIsNacionalidadPueblosEnabled(pacienteData.DatosAdicionalesPaciente?.AutoidentificacionEtnica?.nombre === 'Indígena');
          setIsPuebloKichwaEnabled(pacienteData.DatosAdicionalesPaciente?.NacionalidadPueblo?.nombre === 'Kichwa');
          setIsTipoDiscapacidadEnabled(pacienteData.DatosAdicionalesPaciente?.TieneDiscapacidadPaciente?.nombre === 'Sí');

          if (pacienteData.fecha_nacimiento) {
            const birthDateObj = new Date(pacienteData.fecha_nacimiento);
            const diffMillis = new Date().getTime() - birthDateObj.getTime();
            const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
            setIsUnderTwoYears(new Date().getFullYear() - birthDateObj.getFullYear() < 2);
            setShowPartoQuestion(diffDays <= 2);
            setPartoEnCentroSalud(pacienteData.Partos?.length > 0);
            setCalculatedAgeInHours(Math.floor(diffMillis / (1000 * 60 * 60)).toString());
            setPartoTime(pacienteData.Partos?.[0]?.hora_parto?.substring(0, 5) || '');
            setHasAskedPartoQuestion(true);
          }
        } else {
          setPacienteEncontrado(false);
          setPacienteIdExistente(null);
          limpiarFormularioManteniedoIdentificacion(numeroIdentificacion);
          setIsFormEnabledForNewEntry(true);
        }
      } else {
        setPacienteEncontrado(false);
        setPacienteIdExistente(null);
        limpiarFormularioManteniedoIdentificacion(numeroIdentificacion);
        setIsFormEnabledForNewEntry(true);
      }
    } catch (error) {
      console.error('Error en la búsqueda automática de paciente:', error);
      setPacienteEncontrado(false);
    } finally {
      setIsSearchingPatient(false);
    }
  }, []);

  // UseEffect para el debounce de la búsqueda por cédula
  useEffect(() => {
    const { tipoIdentificacion, numeroIdentificacion } = formData;
    if (tipoIdentificacion === 'Cedula de Identidad' && numeroIdentificacion?.length === 10) {
      const timer = setTimeout(() => {
        buscarPacienteAutomatico(numeroIdentificacion);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.numeroIdentificacion, formData.tipoIdentificacion, buscarPacienteAutomatico]);

  const handleNumeroIdentificacionBlur = () => {
    // Ya no es necesario el blur para la búsqueda, pero mantenemos la validación si el usuario sale del campo
    const { tipoIdentificacion, numeroIdentificacion } = formData;
    if (tipoIdentificacion === 'Cedula de Identidad' && numeroIdentificacion && !validarCedulaEcuatoriana(numeroIdentificacion)) {
      showNotification('Identificación Inválida', 'Número de cédula ecuatoriana inválido.', 'error');
    }
  };

  const validateNumeroIdentificacion = () => {
    if (formData.tipoIdentificacion !== 'NoIdentificado' && !formData.numeroIdentificacion) {
      showNotification('Campo Requerido', 'Por favor, ingrese el número de identificación.', 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = (action) => {
    const tabsToValidate = ['personales', 'nacimiento', 'residencia', 'adicionales', 'contacto', 'formaLlegada', 'motivoConsulta']; // Incluir 'motivoConsulta'
    for (const tab of tabsToValidate) {
      const { isValid, message } = validateTab(tab);
      if (!isValid) {
        setActiveTab(tab);
        showNotification('Datos Incompletos', `Por favor, complete el campo obligatorio: ${message} en la pestaña actual.`, 'warning');
        return;
      }
    }
 
    // Validación adicional para motivoConsultaSeleccionado antes de enviar
    if (!motivoConsultaSeleccionado) {
      showNotification('Motivo de Consulta', 'Por favor, seleccione un Motivo de Consulta de la lista de sugerencias.', 'warning');
      setActiveTab('motivoConsulta');
      return;
    }

    if (action === 'guardar') {
      guardarFormulario();
    } else if (action === 'guardarYNavegar') {
      guardarYTomarSignosVitales();
    }
  };


  const limpiarFormulario = () => {
    setFormData({
      // Datos Personales
      tipoIdentificacion: '',
      numeroIdentificacion: '',
      primerApellido: '',
      segundoApellido: '',
      primerNombre: '',
      segundoNombre: '',
      estadoCivil: '',
      sexo: '',
      telefono: '',
      celular: '',
      correoElectronico: '',

      // Datos de Nacimiento
      nacionalidad: '',
      lugarNacimiento: '',
      provinciaNacimiento: '',
      cantonNacimiento: '',
      parroquiaNacimiento: '',
      fechaNacimiento: '', // Ahora contendrá fecha y hora en un solo campo datetime-local
      anioNacimiento: '', // Se mantiene para el cálculo
      mesNacimiento: '', // Se mantiene para el cálculo
      diaNacimiento: '', // Se mantiene para el cálculo
      // Nuevos campos para representante en Datos de Nacimiento
      cedulaRepresentante: '',
      apellidosNombresRepresentante: '',
      parentescoRepresentanteNacimiento: '',

      // Datos de Residencia
      paisResidencia: '',
      provinciaResidencia: '',
      cantonResidencia: '',
      parroquiaResidencia: '',
      callePrincipal: '',
      calleSecundaria: '',
      barrioResidencia: '',
      referenciaResidencia: '',

      // Datos Adicionales
      autoidentificacionEtnica: '',
      nacionalidadPueblos: '',
      puebloKichwa: '',
      nivelEducacion: '',
      gradoNivelEducacion: '',
      tipoEmpresaTrabajo: '',
      ocupacionProfesionPrincipal: '',
      seguroSaludPrincipal: '',
      tipoBonoRecibe: '',
      tieneDiscapacidad: '',
      tipoDiscapacidad: '', // Nuevo campo para el tipo de discapacidad

      // Datos de Contacto
      contactoEnCasoNecesario: '',
      parentescoContacto: '',
      telefonoContacto: '',
      direccionContacto: '',

      // Forma de Llegada
      formaLlegada: '',
      fuenteInformacion: '',
      institucionPersonaEntrega: '',
      telefonoEntrega: '',
      motivoConsulta: '' // Limpiar también el motivo de consulta
    });
    setIsFormEnabledForNewEntry(false); // Deshabilitar el formulario al limpiar
    setPacienteEncontrado(false); // Asegurarse de que el estado sea falso
    setPacienteIdExistente(null); // Limpiar el ID del paciente existente al limpiar el formulario
  };

  const limpiarFormularioManteniedoIdentificacion = (numeroIdentificacion) => {
    setFormData(prev => ({
      ...prev,
      primerApellido: '',
      segundoApellido: '',
      primerNombre: '',
      segundoNombre: '',
      estadoCivil: '',
      sexo: '',
      telefono: '',
      celular: '',
      correoElectronico: '',
      nacionalidad: '',
      lugarNacimiento: '',
      provinciaNacimiento: '',
      cantonNacimiento: '',
      parroquiaNacimiento: '',
      fechaNacimiento: '',
      anioNacimiento: '',
      mesNacimiento: '',
      diaNacimiento: '',
      cedulaRepresentante: '',
      apellidosNombresRepresentante: '',
      parentescoRepresentanteNacimiento: '',
      paisResidencia: '',
      provinciaResidencia: '',
      cantonResidencia: '',
      parroquiaResidencia: '',
      callePrincipal: '',
      calleSecundaria: '',
      barrioResidencia: '',
      referenciaResidencia: '',
      autoidentificacionEtnica: '',
      nacionalidadPueblos: '',
      puebloKichwa: '',
      nivelEducacion: '',
      gradoNivelEducacion: '',
      tipoEmpresaTrabajo: '',
      ocupacionProfesionPrincipal: '',
      seguroSaludPrincipal: '',
      tipoBonoRecibe: '',
      tieneDiscapacidad: '',
      tipoDiscapacidad: '',
      contactoEnCasoNecesario: '',
      parentescoContacto: '',
      telefonoContacto: '',
      direccionContacto: '',
      formaLlegada: '',
      fuenteInformacion: '',
      institucionPersonaEntrega: '',
      telefonoEntrega: '',
      motivoConsulta: ''
    }));
    setPacienteIdExistente(null);
    setPacienteEncontrado(false);
  };

  const guardarFormulario = async () => {
    try {
      const now = new Date();
      // Obtener la fecha en formato DD/MM/YYYY
      const fechaAdmision = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      // Obtener la hora en formato HH:MM
      const horaAdmision = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      const userId = localStorage.getItem('userId'); // Obtener el ID del usuario del localStorage

      const dataToSend = {
        ...formData,
        isUnderTwoYears,
        partoEnCentroSalud,
        fechaAdmision,
        horaAdmision,
        usuarioAdmisionId: userId, // Añadir el ID del usuario
        fechaParto: formData.fechaNacimiento ? formData.fechaNacimiento.split('T')[0] : null, // Extraer solo la fecha
        horaParto: partoTime, // Usar el estado partoTime para la hora
        calculatedAgeInHours, // Añadir la edad en horas
        motivoConsultaSintomaId: motivoConsultaSeleccionado ? motivoConsultaSeleccionado.id : null, // Añadir el ID del motivo de consulta
        sugerirRevisionMedica // Añadir el estado de sugerencia de revisión médica
      };
      console.log('Datos de admisión enviados desde frontend (guardar):', {
        ...dataToSend,
        motivoConsultaSintomaId: dataToSend.motivoConsultaSintomaId, // Asegurarse de que se loguee el ID
        sugerirRevisionMedica: dataToSend.sugerirRevisionMedica
      });

      // Usar axios en lugar de fetch para aprovechar el interceptor global
      const url = 'http://localhost:3001/usuarios/admision';
      
      try {
        const response = await axios.post(url, dataToSend);
        console.log('[AdmisionForm] Respuesta exitosa del servidor (guardar):', response.data);
        showNotification('Éxito', 'Registro de admisión guardado exitosamente.', 'success');
        limpiarFormulario();
        setPacienteIdExistente(null); // Limpiar el ID del paciente existente después de guardar/actualizar
        setActiveTab('personales'); // Redirigir a la primera pestaña
      } catch (error) {
        console.error('[AdmisionForm] Error al guardar el registro de admisión:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        showNotification('Error de Guardado', `Error al guardar el registro de admisión: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error en la solicitud de guardar formulario:', error);
      showNotification('Error de Conexión', 'Error de conexión al guardar el formulario. Por favor, intente de nuevo.', 'error');
    }
  };

  const guardarYTomarSignosVitales = async () => {
    try {
      const now = new Date();
      // Obtener la fecha en formato DD/MM/YYYY
      const fechaAdmision = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      // Obtener la hora en formato HH:MM
      const horaAdmision = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      const userId = localStorage.getItem('userId'); // Obtener el ID del usuario del localStorage

      const dataToSend = {
        ...formData,
        isUnderTwoYears,
        partoEnCentroSalud,
        fechaAdmision,
        horaAdmision,
        usuarioAdmisionId: userId, // Añadir el ID del usuario
        fechaParto: formData.fechaNacimiento ? formData.fechaNacimiento.split('T')[0] : null, // Extraer solo la fecha
        horaParto: partoTime, // Usar el estado partoTime para la hora
        calculatedAgeInHours, // Añadir la edad en horas
        motivoConsultaSintomaId: motivoConsultaSeleccionado ? motivoConsultaSeleccionado.id : null, // Añadir el ID del motivo de consulta
        sugerirRevisionMedica // Añadir el estado de sugerencia de revisión médica
      };
      console.log('Datos de admisión enviados desde frontend (guardarYNavegar):', {
        ...dataToSend,
        motivoConsultaSintomaId: dataToSend.motivoConsultaSintomaId, // Asegurarse de que se loguee el ID
        sugerirRevisionMedica: dataToSend.sugerirRevisionMedica
      });

      // Usar axios en lugar de fetch para aprovechar el interceptor global
      const url = 'http://localhost:3001/usuarios/admision';
      
      try {
        const response = await axios.post(url, dataToSend);
        console.log('[AdmisionForm] Respuesta exitosa del servidor:', response.data);
        showNotification('Éxito', 'Registro de admisión guardado exitosamente. Redirigiendo a Signos Vitales.', 'success');
        limpiarFormulario();
        setPacienteIdExistente(null); // Limpiar el ID del paciente existente después de guardar/actualizar
        navigate('/signosvitales');
      } catch (error) {
        console.error('[AdmisionForm] Error al guardar el registro de admisión:', error);
        
        // Si el error es 500, podría ser que la admisión se creó pero falló algo después
        if (error.response && error.response.status === 500) {
          console.warn('[AdmisionForm] Error 500 recibido, pero verificando si la admisión se creó...');
          const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
          const shouldContinue = confirm(`Se produjo un error al guardar (${errorMessage}), pero es posible que la admisión se haya creado. ¿Desea continuar a Signos Vitales para verificar?`);
          if (shouldContinue) {
            limpiarFormulario();
            setPacienteIdExistente(null);
            navigate('/signosvitales');
            return;
          }
        }
        
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        showNotification('Error de Guardado', `Error al guardar el registro de admisión: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error en la solicitud de guardar y tomar signos vitales:', error);
      showNotification('Error de Conexión', 'Error de conexión al guardar y tomar signos vitales. Por favor, intente de nuevo.', 'error');
    }
  };

  const handleModalConfirm = () => {
    if (modalMessage.includes('Paciente no encontrado')) {
      setIsFormEnabledForNewEntry(true); // Habilitar campos para nuevo ingreso
      setPacienteEncontrado(false); // Resetear para que no se considere "encontrado" y se pueda guardar como nuevo
    } else if (modalMessage.includes('¿El parto fue atendido')) {
      setPartoEnCentroSalud(true);
      setHasAskedPartoQuestion(true);
    }
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    if (modalMessage.includes('Paciente no encontrado')) {
      limpiarFormulario(); // Limpiar todos los campos
      setIsFormEnabledForNewEntry(false); // Deshabilitar campos
      setPacienteEncontrado(false); // Asegurarse de que el estado sea falso
    } else if (modalMessage.includes('¿El parto fue atendido')) {
      setPartoEnCentroSalud(false);
      setHasAskedPartoQuestion(true);
    }
    setIsModalOpen(false);
  };
  const [isUnderTwoYears, setIsUnderTwoYears] = useState(false); // Inicializar en false
  const [showPartoQuestion, setShowPartoQuestion] = useState(false); // Nuevo estado para controlar la visibilidad de la pregunta
  const [partoEnCentroSalud, setPartoEnCentroSalud] = useState(false); // Nuevo estado para la respuesta de la pregunta
  const [diffDaysState, setDiffDaysState] = useState(null); // Nuevo estado para diffDays
  const [calculatedAgeInHours, setCalculatedAgeInHours] = useState('0'); // Nuevo estado para la edad calculada en horas, inicializado en '0'
  const [hasAskedPartoQuestion, setHasAskedPartoQuestion] = useState(false); // Nuevo estado para controlar si ya se preguntó sobre el parto
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar la visibilidad del modal
  const [modalMessage, setModalMessage] = useState(''); // Estado para el mensaje del modal
  const [activeTab, setActiveTab] = useState('personales');
  const [provinciasEcuador, setProvinciasEcuador] = useState([]);
  const [cantonesEcuador, setCantonesEcuador] = useState([]);
  const [parroquiasEcuador, setParroquiasEcuador] = useState([]);
  const [partoTime, setPartoTime] = useState(''); // Nuevo estado para la hora del parto
  const [isNacionalidadPueblosEnabled, setIsNacionalidadPueblosEnabled] = useState(false);
  const [isPuebloKichwaEnabled, setIsPuebloKichwaEnabled] = useState(false);
  const [isTipoDiscapacidadEnabled, setIsTipoDiscapacidadEnabled] = useState(false); // Nuevo estado
  const [pacienteEncontrado, setPacienteEncontrado] = useState(false); // Nuevo estado para controlar si se encontró un paciente
  const [isFormEnabledForNewEntry, setIsFormEnabledForNewEntry] = useState(false); // Nuevo estado para habilitar/deshabilitar el formulario
  const [isEntregaFieldsDisabled, setIsEntregaFieldsDisabled] = useState(false); // Nuevo estado para inhabilitar campos de entrega
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);

  // Estados para el NotificationModal
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    severity: 'info'
  });

  const showNotification = (title, message, severity = 'info') => {
    setNotification({
      isOpen: true,
      title,
      message,
      severity
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Nuevos estados para ubicaciones de residencia
  const [provinciasResidenciaList, setProvinciasResidenciaList] = useState([]);
  const [cantonesResidenciaList, setCantonesResidenciaList] = useState([]);
  const [parroquiasResidenciaList, setParroquiasResidenciaList] = useState([]);

  const handleMotivoConsultaSearch = async (query) => {
    console.log('[AdmisionForm] Buscando motivos con query:', query);
    if (query.length >= 2) { // Buscar si hay al menos 2 caracteres (mejorado)
      try {
        const url = `http://localhost:3001/api/motivos-consulta/search?query=${encodeURIComponent(query)}`;
        console.log('[AdmisionForm] URL de búsqueda:', url);
        
        // Usar axios en lugar de fetch para aprovechar el interceptor global
        const response = await axios.get(url);
        
        console.log('[AdmisionForm] Respuesta status:', response.status);
        console.log('[AdmisionForm] Motivos encontrados:', response.data);
        setMotivosConsultaSugerencias(response.data || []);
      } catch (error) {
        console.error('[AdmisionForm] Error al buscar motivos de consulta:', error);
        // Si es un error 401/403, el interceptor de axios ya manejará la redirección
        if (error.response) {
          console.error('[AdmisionForm] Error response:', error.response.status, error.response.data);
        }
        setMotivosConsultaSugerencias([]);
      }
    } else {
      setMotivosConsultaSugerencias([]);
    }
  };

  const handleMotivoConsultaSelect = (selectedMotivo) => {
    console.log('[AdmisionForm] Motivo seleccionado:', selectedMotivo);
    if (!selectedMotivo || !selectedMotivo.Motivo_Consulta_Sintoma) {
      console.error('[AdmisionForm] Motivo inválido seleccionado');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      motivoConsulta: selectedMotivo.Motivo_Consulta_Sintoma
    }));
    setMotivoConsultaSeleccionado(selectedMotivo);
    setSugerirRevisionMedica(false); // Resetear el checkbox al cambiar el motivo
    console.log('[AdmisionForm] Motivo guardado en estado:', selectedMotivo);
  };

  // useEffect para obtener el rol del usuario desde el token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRolId(decoded.rol_id);
        console.log('[AdmisionForm] Rol del usuario:', decoded.rol_id);
      } catch (error) {
        console.error('[AdmisionForm] Error al decodificar el token:', error);
      }
    }
  }, []);

  useEffect(() => {
    const obtenerTiposIdentificacion = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/tiposIdentificacion');
        const data = await response.json();
        setTiposIdentificacion(data);
      } catch (error) {
        console.error('Error al obtener los tipos de identificación:', error);
      }
    };

    const obtenerEstadosCiviles = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/estadosCiviles');
        const data = await response.json();
        setEstadosCiviles(data);
      } catch (error) {
        console.error('Error al obtener los estados civiles:', error);
      }
    };

    const obtenerSexos = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/sexos');
        const data = await response.json();
        setSexos(data);
      } catch (error) {
        console.error('Error al obtener los sexos:', error);
      }
    };

    const obtenerNacionalidades = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/nacionalidades');
        const data = await response.json();
        setNacionalidades(data);
      } catch (error) {
        console.error('Error al obtener las nacionalidades:', error);
      }
    };


        const obtenerPaisesResidencia = async () => {
          try {
            const response = await fetch('http://localhost:3001/usuarios/paisesResidencia');
            const data = await response.json();
            setPaisesResidencia(data);
          } catch (error) {
            console.error('Error al obtener los países de residencia:', error);
          }
        };
    
        const obtenerProvinciasResidencia = async () => {
          try {
            const response = await fetch('http://localhost:3001/usuarios/provincias');
            const data = await response.json();
            setProvinciasResidenciaList(data);
          } catch (error) {
            console.error('Error al obtener las provincias de residencia:', error);
          }
        };
    const obtenerAutoidentificacionesEtnicas = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/autoidentificacionesEtnicas');
        const data = await response.json();
        setAutoidentificacionesEtnicas(data);
      } catch (error) {
        console.error('Error al obtener las autoidentificaciones étnicas:', error);
      }
    };

    const obtenerNacionalidadesPueblos = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/nacionalidadesPueblos');
        const data = await response.json();
        setNacionalidadesPueblosList(data);
      } catch (error) {
        console.error('Error al obtener las nacionalidades pueblos:', error);
      }
    };

    const obtenerPueblosKichwa = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/pueblosKichwa');
        const data = await response.json();
        setPueblosKichwaList(data);
      } catch (error) {
        console.error('Error al obtener los pueblos kichwa:', error);
      }
    };

    const obtenerNivelesEducacion = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/nivelesEducacion');
        const data = await response.json();
        setNivelesEducacion(data);
      } catch (error) {
        console.error('Error al obtener los niveles de educación:', error);
      }
    };

    const obtenerGradosNivelesEducacion = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/gradosNivelesEducacion');
        const data = await response.json();
        setGradosNivelesEducacion(data);
      } catch (error) {
        console.error('Error al obtener los grados niveles educación:', error);
      }
    };

    const obtenerTiposEmpresaTrabajo = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/tiposEmpresaTrabajo');
        const data = await response.json();
        setTiposEmpresaTrabajo(data);
      } catch (error) {
        console.error('Error al obtener los tipos empresa trabajo:', error);
      }
    };

    const obtenerOcupacionesProfesiones = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/ocupacionesProfesiones');
        const data = await response.json();
        setOcupacionesProfesiones(data);
      } catch (error) {
        console.error('Error al obtener las ocupaciones profesiones:', error);
      }
    };

    const obtenerSegurosSalud = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/segurosSalud');
        const data = await response.json();
        setSegurosSalud(data);
      } catch (error) {
        console.error('Error al obtener los seguros salud:', error);
      }
    };

    const obtenerTiposBono = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/tiposBono');
        const data = await response.json();
        setTiposBono(data);
      } catch (error) {
        console.error('Error al obtener los tipos bono:', error);
      }
    };

    const obtenerTieneDiscapacidades = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/tieneDiscapacidades');
        const data = await response.json();
        setTieneDiscapacidades(data);
      } catch (error) {
        console.error('Error al obtener los tiene discapacidades:', error);
      }
    };

    const obtenerTiposDiscapacidad = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/tiposDiscapacidad');
        const data = await response.json();
        setTiposDiscapacidad(data);
      } catch (error) {
        console.error('Error al obtener los tipos discapacidad:', error);
      }
    };

    const obtenerParentescosContacto = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/parentescosContacto');
        const data = await response.json();
        setParentescosContacto(data);
      } catch (error) {
        console.error('Error al obtener los parentescos contacto:', error);
      }
    };

    const obtenerParentescosRepresentante = async () => { // Nueva función
      try {
        const response = await fetch('http://localhost:3001/usuarios/parentescosContacto'); // Reutilizar el mismo endpoint
        const data = await response.json();
        setParentescosRepresentante(data);
      } catch (error) {
        console.error('Error al obtener los parentescos del representante:', error);
      }
    };

    const obtenerFormasLlegada = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/formasLlegada');
        const data = await response.json();
        setFormasLlegadaList(data);
      } catch (error) {
        console.error('Error al obtener las formas llegada:', error);
      }
    };

    const obtenerFuentesInformacion = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/fuentesInformacion');
        const data = await response.json();
        setFuentesInformacion(data);
      } catch (error) {
        console.error('Error al obtener las fuentes información:', error);
      }
    };

    obtenerTiposIdentificacion();
    obtenerEstadosCiviles();
    obtenerSexos();
    obtenerNacionalidades();
    obtenerPaisesResidencia(); // Reintroducir la llamada
    obtenerProvinciasResidencia();
    obtenerAutoidentificacionesEtnicas();
    obtenerNacionalidadesPueblos();
    obtenerPueblosKichwa();
    obtenerNivelesEducacion();
    obtenerGradosNivelesEducacion();
    obtenerTiposEmpresaTrabajo();
    obtenerOcupacionesProfesiones();
    obtenerSegurosSalud();
    obtenerTiposBono();
    obtenerTieneDiscapacidades();
    obtenerTiposDiscapacidad();
    obtenerParentescosContacto();
    obtenerParentescosRepresentante(); // Llamar a la nueva función
    obtenerFormasLlegada();
    obtenerFuentesInformacion();
  }, []);

  useEffect(() => {
    const obtenerProvinciasNacimiento = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/provincias');
        const data = await response.json();
        setProvinciasEcuador(data); // Mantener para nacimiento
      } catch (error) {
        console.error('Error al obtener las provincias de nacimiento:', error);
      }
    };

    // Cargar provincias de nacimiento solo si la nacionalidad es Ecuatoriana
    if (formData.nacionalidad === 'Ecuatoriana') {
      obtenerProvinciasNacimiento();
    } else {
      setProvinciasEcuador([]); // Limpiar si la nacionalidad no es Ecuatoriana
    }

    const obtenerProvinciasResidencia = async () => {
      try {
        const response = await fetch('http://localhost:3001/usuarios/provincias');
        const data = await response.json();
        setProvinciasResidenciaList(data); // Nuevo estado para residencia
      } catch (error) {
        console.error('Error al obtener las provincias de residencia:', error);
      }
    };

    obtenerProvinciasResidencia();
  }, [formData.nacionalidad]); // Dependencia de formData.nacionalidad

  useEffect(() => {
    if (formData.fechaNacimiento) {
      calculateAge(formData.fechaNacimiento);
      // Si es un paciente de parto y la hora no ha sido establecida, inicializar partoTime
      const birthDateObj = new Date(formData.fechaNacimiento);
      const diffMillis = new Date().getTime() - birthDateObj.getTime();
      const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

      if (diffDays <= 2 && partoEnCentroSalud) {
        const hours = birthDateObj.getHours().toString().padStart(2, '0');
        const minutes = birthDateObj.getMinutes().toString().padStart(2, '0');
        setPartoTime(`${hours}:${minutes}`);
      } else {
        setPartoTime(''); // Limpiar si no es un paciente de parto o no se ha confirmado el parto
      }
    } else {
      setPartoTime(''); // Limpiar si no hay fecha de nacimiento
   }
 }, [formData.fechaNacimiento, partoEnCentroSalud]);
  // useEffect para actualizar lugarNacimiento
  useEffect(() => {
    if (formData.nacionalidad === 'Ecuatoriana') {
      const provincia = provinciasEcuador.find(p => p.nombre === formData.provinciaNacimiento)?.nombre || '';
      const canton = cantonesEcuador.find(c => c.nombre === formData.cantonNacimiento)?.nombre || '';
      const parroquia = parroquiasEcuador.find(p => p.nombre === formData.parroquiaNacimiento)?.nombre || '';

      let lugarNacimientoValue = '';
      if (provincia) lugarNacimientoValue += provincia;
      if (canton) lugarNacimientoValue += (lugarNacimientoValue ? '/' : '') + canton;
      if (parroquia) lugarNacimientoValue += (lugarNacimientoValue ? '/' : '') + parroquia;

      setFormData(prev => ({
        ...prev,
        lugarNacimiento: lugarNacimientoValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        lugarNacimiento: ''
      }));
    }
  }, [formData.provinciaNacimiento, formData.cantonNacimiento, formData.parroquiaNacimiento, formData.nacionalidad, provinciasEcuador, cantonesEcuador, parroquiasEcuador]);


  // useEffect para cargar cantones de residencia cuando cambia la provincia de residencia
  useEffect(() => {
    if (formData.paisResidencia === 'Ecuador' && formData.provinciaResidencia) {
      const provinciaSeleccionada = provinciasResidenciaList.find(p => p.nombre === formData.provinciaResidencia);
      if (provinciaSeleccionada) {
        obtenerCantonesResidencia(provinciaSeleccionada.id);
      }
    } else {
      setCantonesResidenciaList([]);

      setParroquiasResidenciaList([]);
      setFormData(prev => ({
        ...prev,
        cantonResidencia: '',
        parroquiaResidencia: ''
      }));
    }
  }, [formData.provinciaResidencia, formData.paisResidencia, provinciasResidenciaList]);

  // useEffect para cargar parroquias de residencia cuando cambia el cantón de residencia
  useEffect(() => {
    if (formData.paisResidencia === 'Ecuador' && formData.cantonResidencia) {
      const cantonSeleccionado = cantonesResidenciaList.find(c => c.nombre === formData.cantonResidencia);
      if (cantonSeleccionado) {
        obtenerParroquiasResidencia(cantonSeleccionado.id);
      }
    } else {
      setParroquiasResidenciaList([]);
      setFormData(prev => ({
        ...prev,
        parroquiaResidencia: ''
      }));
    }
  }, [formData.cantonResidencia, formData.paisResidencia, cantonesResidenciaList]);

  // Funciones para obtener cantones y parroquias
  const obtenerCantones = async (provinciaId) => {
    try {
      const response = await fetch(`http://localhost:3001/usuarios/cantones/${provinciaId}`);
      const data = await response.json();
      setCantonesEcuador(data);
      setParroquiasEcuador([]); // Limpiar parroquias al cambiar cantón
      return data; // Devolver los datos
    } catch (error) {
      console.error('Error al obtener los cantones:', error);
      return [];
    }
  };

  const obtenerParroquias = async (cantonId) => {
    try {
      const response = await fetch(`http://localhost:3001/usuarios/parroquias/${cantonId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setParroquiasEcuador(data);
      return data; // Devolver los datos
    } catch (error) {
      console.error('Error al obtener las parroquias:', error);
      return [];
    }
  };

  // useEffect para cargar cantones cuando cambia la provincia de nacimiento
  useEffect(() => {
    if (formData.nacionalidad === 'Ecuatoriana' && formData.provinciaNacimiento) {
      const provinciaSeleccionada = provinciasEcuador.find(p => p.nombre === formData.provinciaNacimiento);
      if (provinciaSeleccionada) {
        obtenerCantones(provinciaSeleccionada.id);
      }
    } else {
      setCantonesEcuador([]);
      setParroquiasEcuador([]);
      setFormData(prev => ({
        ...prev,
        cantonNacimiento: '',
        parroquiaNacimiento: ''
      }));
    }
  }, [formData.provinciaNacimiento, formData.nacionalidad, provinciasEcuador]);

  // useEffect para cargar parroquias cuando cambia el cantón de nacimiento
  useEffect(() => {
    if (formData.nacionalidad === 'Ecuatoriana' && formData.cantonNacimiento) {
      const cantonSeleccionado = cantonesEcuador.find(c => c.nombre === formData.cantonNacimiento);
      if (cantonSeleccionado) {
        obtenerParroquias(cantonSeleccionado.id);
      }
    } else {
      setParroquiasEcuador([]);
      setFormData(prev => ({
        ...prev,
        parroquiaNacimiento: ''
      }));
    }
  }, [formData.cantonNacimiento, formData.nacionalidad, cantonesEcuador]);

  // useEffect para generar el código de "No Identificado"
  useEffect(() => {
    const generateNoIdentificadoCode = () => {
      const {
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        nacionalidad,
        provinciaNacimiento,
        fechaNacimiento
      } = formData;

      if (formData.tipoIdentificacion === 'NoIdentificado') { // Solo generar si es "No Identificado"
        let code = '';
        // Primeras dos letras del primer nombre
        code += (primerNombre ? primerNombre.substring(0, 2) : '  ').toUpperCase(); // Usar espacios si no hay nombre
        // Primera letra del segundo nombre o '0'
        code += (segundoNombre ? segundoNombre.substring(0, 1) : '0').toUpperCase();
        // Primeras dos letras del primer apellido
        code += (primerApellido ? primerApellido.substring(0, 2) : '  ').toUpperCase(); // Usar espacios si no hay apellido
        // Primera letra del segundo apellido o '0'
        code += (segundoApellido ? segundoApellido.substring(0, 1) : '0').toUpperCase();

        // Código de provincia de nacimiento
        let provinciaCode = '99'; // Por defecto para no ecuatorianos
        if (nacionalidad === 'Ecuatoriana' && provinciaNacimiento) {
          const provincia = provinciasEcuador.find(p => p.nombre === provinciaNacimiento);
          if (provincia) {
            provinciaCode = String(provincia.id).padStart(2, '0');
          }
        }
        code += provinciaCode;

        // Fecha de nacimiento
        if (fechaNacimiento) {
          const birthDate = new Date(fechaNacimiento);
          // Usar métodos UTC para evitar problemas de zona horaria en el cálculo del código
          const year = birthDate.getUTCFullYear().toString();
          const month = (birthDate.getUTCMonth() + 1).toString().padStart(2, '0');
          const day = birthDate.getUTCDate().toString().padStart(2, '0');

          code += year;
          code += month;
          code += day;

          // Carácter final: número de la década de nacimiento
          const decade = Math.floor(birthDate.getUTCFullYear() / 10) % 10;
          code += decade.toString();
        } else {
          code += '000000000'; // Rellenar con ceros si no hay fecha de nacimiento
        }

        setFormData(prev => ({ ...prev, numeroIdentificacion: code }));
      }
    };

    generateNoIdentificadoCode();
  }, [
    formData.tipoIdentificacion,
    formData.primerNombre,
    formData.segundoNombre,
    formData.primerApellido,
    formData.segundoApellido,
    formData.nacionalidad,
    formData.provinciaNacimiento,
    formData.fechaNacimiento,
    provinciasEcuador // Dependencia para asegurar que las provincias estén cargadas
  ]);

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white shadow-md rounded-lg">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabOrder.map((tabName, index) => (
          <button
            key={tabName}
            type="button"
            className={`py-2 px-4 text-sm font-medium ${activeTab === tabName ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'} ${!isTabEnabled(tabName) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleTabChange(tabName)}
            disabled={!isTabEnabled(tabName)}
          >
            {tabName === 'personales' && 'Datos Personales'}
            {tabName === 'nacimiento' && 'Datos de Nacimiento'}
            {tabName === 'residencia' && 'Datos de Residencia'}
            {tabName === 'adicionales' && 'Datos Adicionales'}
            {tabName === 'contacto' && 'Datos de Contacto'}
            {tabName === 'formaLlegada' && 'Forma de Llegada'}
            {tabName === 'motivoConsulta' && 'Motivo de Consulta'}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {activeTab === 'personales' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <h2 className="col-span-full text-xl font-semibold mb-2">Datos Personales</h2>
          <div>
            <label htmlFor="tipoIdentificacion" className="block text-sm font-medium text-gray-700">Tipo de Identificación <span className="text-red-500">*</span>:</label>
            <select id="tipoIdentificacion" name="tipoIdentificacion" value={formData.tipoIdentificacion} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              <option value="">-- Seleccione --</option>
              {tiposIdentificacion.map(tipo => (
                <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="numeroIdentificacion" className="block text-sm font-medium text-gray-700">Número de Identificación <span className="text-red-500">*</span>:</label>
            <input
              type="text"
              id="numeroIdentificacion"
              name="numeroIdentificacion"
              value={formData.numeroIdentificacion}
              onChange={handleChange}
              onBlur={handleNumeroIdentificacionBlur}
              required
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${isSearchingPatient ? 'bg-blue-50' : ''}`}
              disabled={formData.tipoIdentificacion === 'NoIdentificado' || (pacienteEncontrado && formData.numeroIdentificacion.length === 10) || !isFormEnabledForNewEntry}
            />
            {isSearchingPatient && <span className="text-xs text-blue-500 animate-pulse">Buscando paciente...</span>}
          </div>
          <div>
            <label htmlFor="primerApellido" className="block text-sm font-medium text-gray-700">Primer Apellido <span className="text-red-500">*</span>:</label>
            <input type="text" id="primerApellido" name="primerApellido" value={formData.primerApellido} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="segundoApellido" className="block text-sm font-medium text-gray-700">Segundo Apellido:</label>
            <input type="text" id="segundoApellido" name="segundoApellido" value={formData.segundoApellido} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="primerNombre" className="block text-sm font-medium text-gray-700">Primer Nombre <span className="text-red-500">*</span>:</label>
            <input type="text" id="primerNombre" name="primerNombre" value={formData.primerNombre} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="segundoNombre" className="block text-sm font-medium text-gray-700">Segundo Nombre:</label>
            <input type="text" id="segundoNombre" name="segundoNombre" value={formData.segundoNombre} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="estadoCivil" className="block text-sm font-medium text-gray-700">Estado Civil <span className="text-red-500">*</span>:</label>
            <select id="estadoCivil" name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {estadosCiviles.map(estado => (
                <option key={estado.id} value={estado.nombre}>{estado.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">Sexo <span className="text-red-500">*</span>:</label>
            <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {sexos.map(sexo => (
                <option key={sexo.id} value={sexo.nombre}>{sexo.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono:</label>
            <input type="text" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="celular" className="block text-sm font-medium text-gray-700">Celular <span className="text-red-500">*</span>:</label>
            <input type="text" id="celular" name="celular" value={formData.celular} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="correoElectronico" className="block text-sm font-medium text-gray-700">Correo Electrónico:</label>
            <input type="email" id="correoElectronico" name="correoElectronico" value={formData.correoElectronico} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
        </div>
      )}

      {activeTab === 'nacimiento' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <h2 className="col-span-full text-xl font-semibold mb-2">Datos de Nacimiento</h2>
          <div>
            <label htmlFor="nacionalidad" className="block text-sm font-medium text-gray-700">Nacionalidad <span className="text-red-500">*</span>:</label>
            <select id="nacionalidad" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {nacionalidades.map(nacionalidad => (
                <option key={nacionalidad.id} value={nacionalidad.nombre}>{nacionalidad.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lugarNacimiento" className="block text-sm font-medium text-gray-700">Lugar de Nacimiento:</label>
            <input type="text" id="lugarNacimiento" name="lugarNacimiento" value={formData.lugarNacimiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" readOnly={formData.nacionalidad === 'Ecuatoriana'} disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="provinciaNacimiento" className="block text-sm font-medium text-gray-700">Provincia <span className="text-red-500">*</span>:</label>
            <select id="provinciaNacimiento" name="provinciaNacimiento" value={formData.provinciaNacimiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={formData.nacionalidad !== 'Ecuatoriana' || !isFormEnabledForNewEntry} required={formData.nacionalidad === 'Ecuatoriana'}>
              <option value="">-- Seleccione --</option>
              {provinciasEcuador.map(provincia => (
                <option key={provincia.nombre} value={provincia.nombre}>{provincia.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cantonNacimiento" className="block text-sm font-medium text-gray-700">Cantón <span className="text-red-500">*</span>:</label>
            <select id="cantonNacimiento" name="cantonNacimiento" value={formData.cantonNacimiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={formData.nacionalidad !== 'Ecuatoriana' || !formData.provinciaNacimiento || !isFormEnabledForNewEntry} required={formData.nacionalidad === 'Ecuatoriana'}>
              <option value="">-- Seleccione --</option>
              {cantonesEcuador.map(canton => (
                <option key={canton.nombre} value={canton.nombre}>{canton.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="parroquiaNacimiento" className="block text-sm font-medium text-gray-700">Parroquia <span className="text-red-500">*</span>:</label>
            <select id="parroquiaNacimiento" name="parroquiaNacimiento" value={formData.parroquiaNacimiento} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={formData.nacionalidad !== 'Ecuatoriana' || !formData.cantonNacimiento || !isFormEnabledForNewEntry} required={formData.nacionalidad === 'Ecuatoriana'}>
              <option value="">-- Seleccione --</option>
              {parroquiasEcuador.map(parroquia => (
                <option key={parroquia.nombre} value={parroquia.nombre}>{parroquia.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700">Fecha de Nacimiento <span className="text-red-500">*</span>:</label>
            <input type="date" id="fechaNacimiento" name="fechaNacimiento" value={formData.fechaNacimiento.split('T')[0]} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" max={new Date().toISOString().slice(0, 10)} required disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="anioNacimiento" className="block text-sm font-medium text-gray-700">Año:</label>
            <input type="text" id="anioNacimiento" name="anioNacimiento" value={formData.anioNacimiento} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="mesNacimiento" className="block text-sm font-medium text-gray-700">Mes:</label>
            <input type="text" id="mesNacimiento" name="mesNacimiento" value={formData.mesNacimiento} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="diaNacimiento" className="block text-sm font-medium text-gray-700">Día:</label>
            <input type="text" id="diaNacimiento" name="diaNacimiento" value={formData.diaNacimiento} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" disabled={!isFormEnabledForNewEntry} />
          </div>
          {partoEnCentroSalud && showPartoQuestion && (
            <>
              <div>
                <label htmlFor="edadHoras" className="block text-sm font-medium text-gray-700">Edad en Horas:</label>
                <input type="text" id="edadHoras" name="edadHoras" value={calculatedAgeInHours || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" disabled={!isFormEnabledForNewEntry} />
              </div>
              <div>
                <label htmlFor="partoTime" className="block text-sm font-medium text-gray-700">Hora del Parto:</label>
                <input
                  type="time"
                  id="partoTime"
                  name="partoTime"
                  value={partoTime}
                  onChange={handleChangePartoTime}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  disabled={!isFormEnabledForNewEntry}
                />
              </div>
            </>
          )}

          {/* Campos de Representante para menores de 2 años */}
          {isUnderTwoYears && (
            <>
              <h3 className="col-span-full text-lg font-semibold mt-2">Datos del Representante (Menor de 2 años)</h3>
              <div>
                <label htmlFor="cedulaRepresentante" className="block text-sm font-medium text-gray-700">Cédula de Representante <span className="text-red-500">*</span>:</label>
                <input type="text" id="cedulaRepresentante" name="cedulaRepresentante" value={formData.cedulaRepresentante} onChange={handleChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isUnderTwoYears || !isFormEnabledForNewEntry ? 'bg-gray-100' : ''}`} disabled={!isUnderTwoYears || !isFormEnabledForNewEntry} required={isUnderTwoYears} />
              </div>
              <div>
                <label htmlFor="apellidosNombresRepresentante" className="block text-sm font-medium text-gray-700">Apellidos y Nombres <span className="text-red-500">*</span>:</label>
                <input type="text" id="apellidosNombresRepresentante" name="apellidosNombresRepresentante" value={formData.apellidosNombresRepresentante} onChange={handleChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isUnderTwoYears || !isFormEnabledForNewEntry ? 'bg-gray-100' : ''}`} disabled={!isUnderTwoYears || !isFormEnabledForNewEntry} required={isUnderTwoYears} />
              </div>
              <div>
                <label htmlFor="parentescoRepresentanteNacimiento" className="block text-sm font-medium text-gray-700">Parentesco <span className="text-red-500">*</span>:</label>
                <select id="parentescoRepresentanteNacimiento" name="parentescoRepresentanteNacimiento" value={formData.parentescoRepresentanteNacimiento} onChange={handleChange} className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isUnderTwoYears || !isFormEnabledForNewEntry ? 'bg-gray-100' : ''}`} disabled={!isUnderTwoYears || !isFormEnabledForNewEntry} required={isUnderTwoYears}>
                  <option value="">-- Seleccione --</option>
                  {parentescosRepresentante.map(parentesco => (
                    <option key={parentesco.id} value={parentesco.nombre}>{parentesco.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'residencia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <h2 className="col-span-full text-xl font-semibold mb-2">Datos de Residencia</h2>
          <div>
            <label htmlFor="paisResidencia" className="block text-sm font-medium text-gray-700">País de Residencia <span className="text-red-500">*</span>:</label>
            <select id="paisResidencia" name="paisResidencia" value={formData.paisResidencia} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {paisesResidencia.map(pais => (
                <option key={pais.id} value={pais.nombre}>{pais.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="provinciaResidencia" className="block text-sm font-medium text-gray-700">Provincia de Residencia <span className="text-red-500">*</span>:</label>
            <select id="provinciaResidencia" name="provinciaResidencia" value={formData.provinciaResidencia} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={formData.paisResidencia !== 'Ecuador' || !isFormEnabledForNewEntry} required={formData.paisResidencia === 'Ecuador'}>
              <option value="">-- Seleccione --</option>
              {provinciasResidenciaList.map(provincia => (
                <option key={provincia.nombre} value={provincia.nombre}>{provincia.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cantonResidencia" className="block text-sm font-medium text-gray-700">Cantón de Residencia <span className="text-red-500">*</span>:</label>
            <select id="cantonResidencia" name="cantonResidencia" value={formData.cantonResidencia} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={formData.paisResidencia !== 'Ecuador' || !formData.provinciaResidencia || !isFormEnabledForNewEntry} required={formData.paisResidencia === 'Ecuador'}>
              <option value="">-- Seleccione --</option>
              {cantonesResidenciaList.map(canton => (
                <option key={canton.nombre} value={canton.nombre}>{canton.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="parroquiaResidencia" className="block text-sm font-medium text-gray-700">Parroquia <span className="text-red-500">*</span>:</label>
            <select id="parroquiaResidencia" name="parroquiaResidencia" value={formData.parroquiaResidencia} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={formData.paisResidencia !== 'Ecuador' || !formData.cantonResidencia || !isFormEnabledForNewEntry} required={formData.paisResidencia === 'Ecuador'}>
              <option value="">-- Seleccione --</option>
              {parroquiasResidenciaList.map(parroquia => (
                <option key={parroquia.nombre} value={parroquia.nombre}>{parroquia.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="callePrincipal" className="block text-sm font-medium text-gray-700">Calle Principal <span className="text-red-500">*</span>:</label>
            <input type="text" id="callePrincipal" name="callePrincipal" value={formData.callePrincipal} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="calleSecundaria" className="block text-sm font-medium text-gray-700">Calle Secundaria:</label>
            <input type="text" id="calleSecundaria" name="calleSecundaria" value={formData.calleSecundaria} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="barrioResidencia" className="block text-sm font-medium text-gray-700">Barrio de Residencia <span className="text-red-500">*</span>:</label>
            <input type="text" id="barrioResidencia" name="barrioResidencia" value={formData.barrioResidencia} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="referenciaResidencia" className="block text-sm font-medium text-gray-700">Referencia de Residencia:</label>
            <input type="text" id="referenciaResidencia" name="referenciaResidencia" value={formData.referenciaResidencia} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
        </div>
      )}

      {activeTab === 'adicionales' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <h2 className="col-span-full text-xl font-semibold mb-2">Datos Adicionales</h2>
          <div>
            <label htmlFor="autoidentificacionEtnica" className="block text-sm font-medium text-gray-700">Autoidentificación Étnica <span className="text-red-500">*</span>:</label>
            <select id="autoidentificacionEtnica" name="autoidentificacionEtnica" value={formData.autoidentificacionEtnica} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {autoidentificacionesEtnicas.map(etnia => (
                <option key={etnia.id} value={etnia.nombre}>{etnia.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nacionalidadPueblos" className="block text-sm font-medium text-gray-700">Nacionalidad y Pueblos <span className="text-red-500">*</span>:</label>
            <select
              id="nacionalidadPueblos"
              name="nacionalidadPueblos"
              value={formData.nacionalidadPueblos}
              onChange={handleChange}
              required={isNacionalidadPueblosEnabled}
              disabled={!isNacionalidadPueblosEnabled || !isFormEnabledForNewEntry}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isNacionalidadPueblosEnabled || !isFormEnabledForNewEntry ? 'bg-gray-100 text-gray-500' : ''}`}
            >
              <option value="">-- Seleccione --</option>
              {nacionalidadesPueblosList.map(pueblo => (
                <option key={pueblo.id} value={pueblo.nombre}>{pueblo.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="puebloKichwa" className="block text-sm font-medium text-gray-700">Pueblo Kichwa <span className="text-red-500">*</span>:</label>
            <select
              id="puebloKichwa"
              name="puebloKichwa"
              value={formData.puebloKichwa}
              onChange={handleChange}
              required={isPuebloKichwaEnabled}
              disabled={!isPuebloKichwaEnabled || !isFormEnabledForNewEntry}
              className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isPuebloKichwaEnabled || !isFormEnabledForNewEntry ? 'bg-gray-100 text-gray-500' : ''}`}
            >
              <option value="">-- Seleccione --</option>
              {pueblosKichwaList.map(pueblo => (
                <option key={pueblo.id} value={pueblo.nombre}>{pueblo.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="nivelEducacion" className="block text-sm font-medium text-gray-700">Nivel de Educación <span className="text-red-500">*</span>:</label>
            <select id="nivelEducacion" name="nivelEducacion" value={formData.nivelEducacion} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {nivelesEducacion.map(nivel => (
                <option key={nivel.id} value={nivel.nombre}>{nivel.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gradoNivelEducacion" className="block text-sm font-medium text-gray-700">Estado de Nivel de Educación <span className="text-red-500">*</span>:</label>
            <select id="gradoNivelEducacion" name="gradoNivelEducacion" value={formData.gradoNivelEducacion} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {gradosNivelesEducacion.map(grado => (
                <option key={grado.id} value={grado.nombre}>{grado.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipoEmpresaTrabajo" className="block text-sm font-medium text-gray-700">Tipo de Empresa de Trabajo <span className="text-red-500">*</span>:</label>
            <select id="tipoEmpresaTrabajo" name="tipoEmpresaTrabajo" value={formData.tipoEmpresaTrabajo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {tiposEmpresaTrabajo.map(tipo => (
                <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ocupacionProfesionPrincipal" className="block text-sm font-medium text-gray-700">Ocupación Profesión Principal <span className="text-red-500">*</span>:</label>
            <select id="ocupacionProfesionPrincipal" name="ocupacionProfesionPrincipal" value={formData.ocupacionProfesionPrincipal} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {ocupacionesProfesiones.map(ocupacion => (
                <option key={ocupacion.id} value={ocupacion.nombre}>{ocupacion.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="seguroSaludPrincipal" className="block text-sm font-medium text-gray-700">Seguro de Salud Principal <span className="text-red-500">*</span>:</label>
            <select id="seguroSaludPrincipal" name="seguroSaludPrincipal" value={formData.seguroSaludPrincipal} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {segurosSalud.map(seguro => (
                <option key={seguro.id} value={seguro.nombre}>{seguro.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tipoBonoRecibe" className="block text-sm font-medium text-gray-700">Tipo de Bono que Recibe <span className="text-red-500">*</span>:</label>
            <select id="tipoBonoRecibe" name="tipoBonoRecibe" value={formData.tipoBonoRecibe} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {tiposBono.map(bono => (
                <option key={bono.id} value={bono.nombre}>{bono.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tieneDiscapacidad" className="block text-sm font-medium text-gray-700">Tiene Discapacidad <span className="text-red-500">*</span>:</label>
            <select id="tieneDiscapacidad" name="tieneDiscapacidad" value={formData.tieneDiscapacidad} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {tieneDiscapacidades.map(discapacidad => (
                <option key={discapacidad.id} value={discapacidad.nombre}>{discapacidad.nombre}</option>
              ))}
            </select>
          </div>
          {isTipoDiscapacidadEnabled && (
            <div>
              <label htmlFor="tipoDiscapacidad" className="block text-sm font-medium text-gray-700">Tipo de Discapacidad <span className="text-red-500">*</span>:</label>
              <select
                id="tipoDiscapacidad"
                name="tipoDiscapacidad"
                value={formData.tipoDiscapacidad}
                onChange={handleChange}
                required={isTipoDiscapacidadEnabled}
                disabled={!isTipoDiscapacidadEnabled || !isFormEnabledForNewEntry}
                className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${!isTipoDiscapacidadEnabled || !isFormEnabledForNewEntry ? 'bg-gray-100 text-gray-500' : ''}`}
              >
                <option value="">-- Seleccione --</option>
                {tiposDiscapacidad.map(tipo => (
                  <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contacto' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <h2 className="col-span-full text-xl font-semibold mb-2">Datos de Contacto</h2>
          <div>
            <label htmlFor="contactoEnCasoNecesario" className="block text-sm font-medium text-gray-700">En caso de emergencia llamar a? <span className="text-red-500">*</span>:</label>
            <input type="text" id="contactoEnCasoNecesario" name="contactoEnCasoNecesario" value={formData.contactoEnCasoNecesario} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="parentescoContacto" className="block text-sm font-medium text-gray-700">Parentesco <span className="text-red-500">*</span>:</label>
            <select id="parentescoContacto" name="parentescoContacto" value={formData.parentescoContacto} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {parentescosContacto.map(parentesco => (
                <option key={parentesco.id} value={parentesco.nombre}>{parentesco.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="telefonoContacto" className="block text-sm font-medium text-gray-700">Número de Teléfono <span className="text-red-500">*</span>:</label>
            <input type="text" id="telefonoContacto" name="telefonoContacto" value={formData.telefonoContacto} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="direccionContacto" className="block text-sm font-medium text-gray-700">Dirección <span className="text-red-500">*</span>:</label>
            <input type="text" id="direccionContacto" name="direccionContacto" value={formData.direccionContacto} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry} />
          </div>
        </div>
      )}

      {activeTab === 'formaLlegada' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <h2 className="col-span-full text-xl font-semibold mb-2">Forma de Llegada</h2>
          <div>
            <label htmlFor="formaLlegada" className="block text-sm font-medium text-gray-700">Forma de Llegada <span className="text-red-500">*</span>:</label>
            <select id="formaLlegada" name="formaLlegada" value={formData.formaLlegada} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" disabled={!isFormEnabledForNewEntry}>
              <option value="">-- Seleccione --</option>
              {formasLlegadaList.map(forma => (
                <option key={forma.id} value={forma.nombre}>{forma.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fuenteInformacion" className="block text-sm font-medium text-gray-700">Fuente de Información <span className="text-red-500">*</span>:</label>
            <select
              id="fuenteInformacion"
              name="fuenteInformacion"
              value={formData.fuenteInformacion}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              disabled={formData.formaLlegada === 'Ambulancia' || formData.formaLlegada === 'Otro transporte' || formData.formaLlegada === 'Ambulatorio' || !isFormEnabledForNewEntry}
            >
              <option value="">-- Seleccione --</option>
              {fuentesInformacion.map(fuente => (
                <option key={fuente.id} value={fuente.nombre}>{fuente.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="institucionPersonaEntrega" className="block text-sm font-medium text-gray-700">Institución o Persona que Entrega al Paciente <span className="text-red-500">*</span>:</label>
            <input type="text" id="institucionPersonaEntrega" name="institucionPersonaEntrega" value={formData.institucionPersonaEntrega} onChange={handleChange} required className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${isEntregaFieldsDisabled || !isFormEnabledForNewEntry ? 'bg-gray-100 text-gray-500' : ''}`} disabled={isEntregaFieldsDisabled || !isFormEnabledForNewEntry} />
          </div>
          <div>
            <label htmlFor="telefonoEntrega" className="block text-sm font-medium text-gray-700">Número de Teléfono <span className="text-red-500">*</span>:</label>
            <input type="text" id="telefonoEntrega" name="telefonoEntrega" value={formData.telefonoEntrega} onChange={handleChange} required className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${isEntregaFieldsDisabled || !isFormEnabledForNewEntry ? 'bg-gray-100 text-gray-500' : ''}`} disabled={isEntregaFieldsDisabled || !isFormEnabledForNewEntry} />
          </div>
        </div>
      )}

      {activeTab === 'motivoConsulta' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Motivo de Consulta</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
              <p className="text-sm text-blue-800">
                💡 <strong>Instrucciones:</strong> Escriba al menos 2 caracteres para buscar. Seleccione una opción de la lista desplegable haciendo clic o presionando Enter.
              </p>
            </div>
            {/* Debug info - remover en producción */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-2 text-xs text-gray-500">
                Sugerencias: {motivosConsultaSugerencias.length} | 
                Seleccionado: {motivoConsultaSeleccionado ? 'Sí' : 'No'} |
                Valor: {formData.motivoConsulta || '(vacío)'}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <AutoCompleteInput
              label="Motivo de Consulta"
              name="motivoConsulta"
              value={formData.motivoConsulta}
              onChange={handleChange}
              onSearch={handleMotivoConsultaSearch}
              suggestions={motivosConsultaSugerencias}
              onSelect={handleMotivoConsultaSelect}
              onBlur={() => {
                // Validar solo si hay texto pero no hay selección válida
                if (formData.motivoConsulta && !motivoConsultaSeleccionado) {
                  // Verificar si el texto coincide exactamente con alguna sugerencia
                  const exactMatch = motivosConsultaSugerencias.find(
                    s => s.Motivo_Consulta_Sintoma?.toLowerCase() === formData.motivoConsulta?.toLowerCase()
                  );
                  if (!exactMatch) {
                    // No hay coincidencia exacta, limpiar y mostrar mensaje
                    setTimeout(() => {
                      setFormData(prev => ({ ...prev, motivoConsulta: '' }));
                      showNotification('Motivo Inválido', 'Por favor, seleccione un Motivo de Consulta válido de la lista de sugerencias.', 'warning');
                    }, 100);
                  }
                }
              }}
              disabled={!isFormEnabledForNewEntry}
              required={true}
              displayKey="Motivo_Consulta_Sintoma"
              placeholder="Escriba al menos 2 caracteres para buscar..."
            />
            {motivoConsultaSeleccionado && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  ✅ Motivo seleccionado correctamente
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Categoría:</strong> {motivoConsultaSeleccionado.Categoria}
                </p>
                {motivoConsultaSeleccionado.Codigo_Triaje && (
                  <p className="text-sm text-gray-700">
                    <strong>Código Triaje:</strong> {motivoConsultaSeleccionado.Codigo_Triaje}
                  </p>
                )}
              </div>
            )}
            
            {/* Checkbox para Sugerir Revisión Médica (visible solo para IDs 1516 y 1517) */}
            {motivoConsultaSeleccionado && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="sugerirRevisionMedica"
                      name="sugerirRevisionMedica"
                      type="checkbox"
                      checked={sugerirRevisionMedica}
                      onChange={(e) => setSugerirRevisionMedica(e.target.checked)}
                      className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                      disabled={!isFormEnabledForNewEntry || !((motivoConsultaSeleccionado.id === 1516) || (motivoConsultaSeleccionado.id === 1517))}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="sugerirRevisionMedica" className="font-medium text-gray-700">
                      Sugerir revisión médica
                    </label>
                    <p className="text-gray-500">
                      Si activa esta opción, el paciente pasará a 'Toma de Signos' (URGENCIA PENDIENTE) en lugar de ir directamente a Procedimientos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-4">
        <button
          type="button"
          onClick={limpiarFormulario}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Limpiar
        </button>

        {/* LÓGICA DE ROLES - Estadístico (ID 4): Solo botón "Guardar" */}
        {userRolId === 4 && (
          <button
            type="button"
            onClick={() => handleSubmit('guardar')}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Guardar
          </button>
        )}

        {/* LÓGICA DE ROLES - Enfermería (ID 3): Solo botón "Guardar y Tomar Signos Vitales" */}
        {userRolId === 3 && (
          <button
            type="button"
            onClick={() => handleSubmit('guardarYNavegar')}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Guardar y Tomar Signos Vitales
          </button>
        )}

        {/* LÓGICA DE ROLES - Administrador (ID 5): Ambos botones */}
        {userRolId === 5 && (
          <>
            <button
              type="button"
              onClick={() => handleSubmit('guardar')}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('guardarYNavegar')}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Guardar y Tomar Signos Vitales
            </button>
          </>
        )}
      </div>
    <ConfirmModal
      message={modalMessage}
      onConfirm={handleModalConfirm}
      onCancel={handleModalCancel}
      isOpen={isModalOpen}
    />
    </form>
    <NotificationModal
      isOpen={notification.isOpen}
      onClose={closeNotification}
      title={notification.title}
      message={notification.message}
      severity={notification.severity}
    />
    </>
  );
}