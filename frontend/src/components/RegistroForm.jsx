import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validarCedulaEcuador, validarPasswordEstricto } from '../utils/validaciones';
import NotificationModal from './NotificationModal';

export default function RegistroForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    correo: '',
    correo_alternativo: '',
    telefono: '',
    contrasena: '',
    confirmar_contrasena: '',
    rol_id: '',
    password_firma: '',
    unidad_operativa: 'Centro de Salud Chone Tipo C',
    registro_msp: ''
  });
  const [modoRegistro, setModoRegistro] = useState(null); // null | 'manual' | 'firma'
  const [archivoFirma, setArchivoFirma] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState(false);
  const [validandoFirma, setValidandoFirma] = useState(false);
  const [roles, setRoles] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    severity: 'info',
    action: null,
    content: null
  });
  const [isCedulaValida, setIsCedulaValida] = useState(false);
  const [cedulaError, setCedulaError] = useState(false);

  const navigate = useNavigate();

  const showNotification = (title, message, severity = 'info', action = null, content = null) => {
    setNotification({ isOpen: true, title, message, severity, action, content });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesRes = await fetch('http://localhost:3001/usuarios/public-roles');
        const rolesData = await rolesRes.json();
        if (!rolesRes.ok) throw new Error(rolesData.message || 'Error al obtener roles');
        setRoles(rolesData);

        const sexosRes = await fetch('http://localhost:3001/usuarios/sexos');
        const sexosData = await sexosRes.json();
        if (!sexosRes.ok) throw new Error(sexosData.message || 'Error al obtener sexos');
        setSexos(sexosData);

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Intente de nuevo más tarde.');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error && (error.includes(e.target.name) || error.includes('contraseñas'))) {
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.p12') || file.name.endsWith('.pfx')) {
        setArchivoFirma(file);
        setCamposBloqueados(false);
      } else {
        showNotification('Archivo Inválido', 'Solo se permiten archivos .p12 o .pfx', 'error');
        e.target.value = '';
        setArchivoFirma(null);
      }
    }
  };

  const verificarDuplicado = async (cedula) => {
    try {
      const res = await fetch(`http://localhost:3001/usuarios/verificar/${cedula}`);
      const data = await res.json();
      
      if (data.existe) {
        setIsCedulaValida(false);
        setNotification({
          isOpen: true,
          title: 'Usuario ya registrado',
          message: 'Usted ya cuenta con un acceso en SIGEMECH. ¿Desea recuperar su contraseña o prefiere contactar al equipo técnico?',
          severity: 'warning',
          content: (
            <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-inner space-y-4">
              <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                <h4 className="text-sm font-bold text-blue-900">Soporte Técnico SIGEMECH</h4>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Estadística Ext. 1341 / 1342</span>
              </div>
              
              <div className="space-y-4">
                {/* Ing. Sergio Solórzano */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Ing. Sergio Solórzano</span>
                    <span className="text-[10px] text-gray-400">0983369608</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href="https://wa.me/593983369608?text=Hola%20Ing.%20Sergio,%20mi%20cédula%20ya%20aparece%20registrada%20en%20SIGEMECH%20y%20necesito%20ayuda."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-xs font-bold"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03a11.811 11.811 0 001.592 5.918L0 24l6.108-1.604a11.82 11.82 0 005.937 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.782 11.782 0 00-3.48-8.487z"/>
                      </svg>
                      Contactar por WhatsApp
                    </a>
                    <a
                      href="mailto:sergio.solorzano@13d07.mspz4.gob.ec"
                      className="text-[11px] text-gray-500 hover:text-blue-600 transition-colors break-all"
                    >
                      sergio.solorzano@13d07.mspz4.gob.ec
                    </a>
                  </div>
                </div>

                {/* Ing. Alejandro Alcívar */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-xs font-bold text-gray-700">Ing. Alejandro Alcívar</span>
                    <span className="text-[10px] text-gray-400">0986382910</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href="https://wa.me/593986382910?text=Hola%20Ing.%20Alejandro,%20mi%20cédula%20ya%20aparece%20registrada%20en%20SIGEMECH%20y%20necesito%20ayuda."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-xs font-bold"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03a11.811 11.811 0 001.592 5.918L0 24l6.108-1.604a11.82 11.82 0 005.937 1.587h.005c6.634 0 12.032-5.396 12.035-12.03a11.782 11.782 0 00-3.48-8.487z"/>
                      </svg>
                      Contactar por WhatsApp
                    </a>
                    <a
                      href="mailto:andres.alcivar@13d07.mspz4.gob.ec"
                      className="text-[11px] text-gray-500 hover:text-blue-600 transition-colors break-all"
                    >
                      andres.alcivar@13d07.mspz4.gob.ec
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ),
          action: {
            label: 'Recuperar Contraseña',
            onClick: () => {
              window.location.href = '/recuperar';
            },
            secondaryLabel: 'Entendido',
            secondaryOnClick: () => {}
          }
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al verificar duplicado:', err);
      return false;
    }
  };

  const handleCedulaBlur = async () => {
    if (!form.cedula) {
      setIsCedulaValida(false);
      setCedulaError(false);
      return;
    }

    // Blindaje: Asegurar que solo procese si tiene 10 dígitos
    if (form.cedula.length !== 10) {
      setIsCedulaValida(false);
      setCedulaError(true);
      return;
    }

    // Validación Módulo 10 - Obligatorio para blindar identidad
    if (!validarCedulaEcuador(form.cedula)) {
      showNotification(
        'Identidad Protegida',
        'El número de cédula no supera la validación de Módulo 10. Por seguridad, debe ingresar una cédula ecuatoriana válida.',
        'error'
      );
      setIsCedulaValida(false);
      setCedulaError(true);
      return;
    }

    // Búsqueda de duplicados en tiempo real para evitar registros dobles
    const existe = await verificarDuplicado(form.cedula);
    if (!existe) {
      setIsCedulaValida(true);
      setCedulaError(false);
    } else {
      setIsCedulaValida(false);
      setCedulaError(true);
      // El modal de duplicado ya se dispara dentro de verificarDuplicado
    }
  };

  const validarYAutocompletar = async () => {
    if (!archivoFirma || !form.password_firma) {
      showNotification('Datos Faltantes', 'Cargue el archivo .p12 e ingrese la contraseña para validar.', 'warning');
      return;
    }
    
    setValidandoFirma(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('p12', archivoFirma);
      formData.append('password_firma', form.password_firma);

      const res = await fetch('http://localhost:3001/usuarios/validar-firma-registro', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al validar firma');

      // Verificar si el usuario de la firma ya existe
      const existe = await verificarDuplicado(data.cedula);
      if (existe) return;

      setForm(prev => ({
        ...prev,
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos
      }));
      setCamposBloqueados(true);
      setIsCedulaValida(true);
      showNotification('Validación Exitosa', 'Datos validados y extraídos correctamente. Avanzando al siguiente paso.', 'success');
      
      // Salto directo al Paso 2
      setTimeout(() => setStep(2), 1500);

    } catch (err) {
      showNotification('Error de Validación', err.message, 'error');
      setCamposBloqueados(false);
      setIsCedulaValida(false);
    } finally {
      setValidandoFirma(false);
    }
  };

  const validateStep1 = () => {
    if (!validarCedulaEcuador(form.cedula)) {
      showNotification('Cédula Inválida', 'El número de cédula ingresado no es válido para Ecuador.', 'error');
      return false;
    }
    if (!form.nombres || !form.apellidos || !form.fecha_nacimiento || !form.sexo) {
      showNotification('Campos Requeridos', 'Por favor complete todos los campos de identidad.', 'warning');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.correo) {
      showNotification('Usuario Requerido', 'El nombre de usuario (Zimbra) es requerido.', 'warning');
      return false;
    }
    if (form.correo_alternativo && !form.correo_alternativo.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showNotification('Correo Inválido', 'El formato del correo alternativo no es válido.', 'warning');
      return false;
    }
    if (!form.rol_id) {
      showNotification('Rol Requerido', 'Debe seleccionar un rol institucional.', 'warning');
      return false;
    }
    
    // Validación de Registro MSP si el rol es Médico (ID 1 típicamente, pero validamos por nombre si es posible o ID)
    const selectedRol = roles.find(r => r.id === parseInt(form.rol_id));
    if (selectedRol?.nombre === 'Médico' && !form.registro_msp) {
      showNotification('Registro MSP Requerido', 'El Número de Registro del MSP / Senescyt es obligatorio para médicos.', 'warning');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const validatePassword = (password) => {
    return validarPasswordEstricto(password);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    const passwordError = validatePassword(form.contrasena);
    if (passwordError) { showNotification('Contraseña Débil', passwordError, 'error'); return; }

    if (form.contrasena !== form.confirmar_contrasena) {
      showNotification('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });
      if (modoRegistro === 'firma' && archivoFirma) {
        formData.append('p12', archivoFirma);
      }

      const res = await fetch('http://localhost:3001/usuarios/registro', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al registrar');

      showNotification('Éxito', 'Registro completado exitosamente. Pendiente de aprobación.', 'success');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      showNotification('Error en Registro', err.message, 'error');
    }
  };

  const steps = [
    { id: 1, label: 'Identidad', icon: '👤' },
    { id: 2, label: 'Institucional', icon: '🏥' },
    { id: 3, label: 'Seguridad', icon: '🔒' }
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Logo y Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">SIGEMECH</h1>
            <p className="text-slate-500 font-medium">Registro de Profesional de la Salud</p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="relative flex justify-between">
              {/* Line background */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
              {/* Active line */}
              <div 
                className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              ></div>

              {steps.map((s) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      step >= s.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {step > s.id ? '✓' : s.icon}
                  </div>
                  <span className={`text-xs font-bold mt-2 uppercase tracking-wider ${step >= s.id ? 'text-blue-700' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-slate-200">
            {/* Step Header */}
            <div className="bg-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center">
                <span className="bg-blue-500/30 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">0{step}</span>
                {steps.find(s => s.id === step)?.label}
              </h2>
              <p className="text-blue-100 text-sm mt-1">Complete la información requerida para continuar.</p>
            </div>

            <div className="p-8">
              {/* Paso 1: Identidad */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Pregunta de Entrada */}
                  {modoRegistro === null && (
                    <div className="text-center py-8 animate-fade-in">
                      <h3 className="text-xl font-bold text-slate-800 mb-8">¿Dispone de su firma electrónica (.p12)?</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                          onClick={() => { setModoRegistro('firma'); setCamposBloqueados(false); setIsCedulaValida(false); }}
                          className="group p-8 border-2 border-slate-200 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center gap-4 shadow-sm"
                        >
                          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🖋️</div>
                          <span className="text-2xl font-black text-blue-900">SÍ</span>
                          <span className="text-sm text-slate-500 font-medium">Tengo mi archivo .p12</span>
                        </button>
                        <button
                          onClick={() => { setModoRegistro('manual'); setCamposBloqueados(false); setIsCedulaValida(false); }}
                          className="group p-8 border-2 border-slate-200 rounded-3xl hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 flex flex-col items-center gap-4 shadow-sm"
                        >
                          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📝</div>
                          <span className="text-2xl font-black text-orange-900">NO</span>
                          <span className="text-sm text-slate-500 font-medium">Ingresaré mis datos manualmente</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {modoRegistro === 'firma' && (
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                      <div className="flex items-center text-blue-800 font-bold text-sm">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Autocompletado Inteligente
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-blue-700 uppercase">Archivo de Firma</label>
                          <input 
                            type="file" accept=".p12,.pfx" onChange={handleFileChange}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-blue-700 uppercase">Contraseña</label>
                          <input 
                            type="password" name="password_firma" value={form.password_firma} onChange={handleChange}
                            className="w-full p-2 text-sm border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Clave del certificado"
                          />
                        </div>
                      </div>
                      <button
                        onClick={validarYAutocompletar}
                        disabled={validandoFirma || !archivoFirma || !form.password_firma}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center shadow-lg shadow-blue-200"
                      >
                        {validandoFirma ? 'Procesando...' : 'Validar y Extraer Datos'}
                      </button>
                    </div>
                  )}

                  {modoRegistro !== null && (
                    <div className="flex flex-col gap-5">
                      {/* Número de Cédula - Ancho completo */}
                      <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700">Número de Cédula</label>
                        <div className="relative">
                          <input
                            type="text"
                            name="cedula"
                            value={form.cedula}
                            onChange={handleChange}
                            onBlur={handleCedulaBlur}
                            maxLength="10"
                            readOnly={camposBloqueados}
                            placeholder="Ingrese su cédula"
                            className={`w-full p-3 border rounded-xl focus:ring-2 outline-none transition-all ${
                              camposBloqueados
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                : isCedulaValida
                                  ? 'border-green-500 ring-1 ring-green-500 focus:ring-green-500'
                                  : cedulaError
                                    ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                                    : 'bg-white border-slate-200 focus:ring-blue-500'
                            }`}
                          />
                          {isCedulaValida && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Apellidos */}
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-slate-700">Apellidos</label>
                          <input
                            type="text"
                            name="apellidos"
                            value={form.apellidos}
                            onChange={handleChange}
                            readOnly={camposBloqueados}
                            placeholder="Primer y Segundo Apellido"
                            className={`w-full p-3 border rounded-xl focus:ring-2 outline-none transition-all ${
                              camposBloqueados
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                : 'bg-white border-slate-200 focus:ring-blue-500'
                            }`}
                          />
                        </div>

                        {/* Nombres */}
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-slate-700">Nombres</label>
                          <input
                            type="text"
                            name="nombres"
                            value={form.nombres}
                            onChange={handleChange}
                            readOnly={camposBloqueados}
                            placeholder="Primer y Segundo Nombre"
                            className={`w-full p-3 border rounded-xl focus:ring-2 outline-none transition-all ${
                              camposBloqueados
                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                : 'bg-white border-slate-200 focus:ring-blue-500'
                            }`}
                          />
                        </div>

                        {/* Fecha de Nacimiento */}
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-slate-700">Fecha de Nacimiento</label>
                          <input
                            type="date"
                            name="fecha_nacimiento"
                            value={form.fecha_nacimiento}
                            onChange={handleChange}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                          />
                        </div>

                        {/* Sexo */}
                        <div className="space-y-1">
                          <label className="text-sm font-bold text-slate-700">Sexo</label>
                          <select
                            name="sexo"
                            value={form.sexo}
                            onChange={handleChange}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                          >
                            <option value="">Seleccione Sexo</option>
                            <option value="Hombre">Hombre</option>
                            <option value="Mujer">Mujer</option>
                          </select>
                        </div>

                        {/* Teléfono de Contacto */}
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-sm font-bold text-slate-700">Teléfono de Contacto</label>
                          <input
                            type="text"
                            name="telefono"
                            value={form.telefono}
                            onChange={handleChange}
                            placeholder="Ej: 0999999999"
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Institucional */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Unidad Operativa - Bloqueada */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Unidad Operativa</label>
                    <input
                      type="text"
                      value={form.unidad_operativa}
                      readOnly
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>

                  {/* Rol / Cargo - Desplegable */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Rol / Cargo</label>
                    <select
                      name="rol_id"
                      value={form.rol_id}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                    >
                      <option value="">Seleccione su Rol</option>
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Registro MSP - Solo si es Médico */}
                  {roles.find(r => r.id === parseInt(form.rol_id))?.nombre === 'Médico' && (
                    <div className="space-y-1 animate-slide-down">
                      <label className="text-sm font-bold text-slate-700">Número de Registro MSP / Senescyt</label>
                      <input
                        type="text"
                        name="registro_msp"
                        value={form.registro_msp}
                        onChange={handleChange}
                        placeholder="Ingrese su número de registro"
                        className="w-full p-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      <p className="text-[10px] text-blue-600 font-medium">Este campo es obligatorio para el perfil médico.</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Usuario Zimbra (Institucional)</label>
                    <div className="flex shadow-sm group">
                      <input
                        type="text" name="correo" value={form.correo} onChange={handleChange}
                        className="flex-1 p-3 border border-slate-200 rounded-l-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="nombre.apellido"
                      />
                      <span className="p-3 bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl text-slate-500 text-sm font-bold flex items-center">
                        @13d07.mspz4.gob.ec
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Ingrese únicamente el usuario sin el dominio.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Correo Alternativo (Respaldo)</label>
                    <div className="relative group">
                      <input
                        type="email"
                        name="correo_alternativo"
                        value={form.correo_alternativo}
                        onChange={handleChange}
                        placeholder="ejemplo@gmail.com"
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all pl-10"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Opcional. Se usará para recuperación y envío de OTP alternativo.</p>
                  </div>
                </div>
              )}

              {/* Paso 3: Seguridad */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Establecer Contraseña</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} name="contrasena" value={form.contrasena} onChange={handleChange}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                      >
                        {showPassword ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                    {form.contrasena && validatePassword(form.contrasena) && (
                      <p className="text-red-500 text-xs mt-1">{validatePassword(form.contrasena)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Confirmar Contraseña</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'} name="confirmar_contrasena" value={form.confirmar_contrasena} onChange={handleChange}
                        className={`w-full p-3 border rounded-xl focus:ring-2 outline-none pr-12 ${
                          form.confirmar_contrasena && form.contrasena !== form.confirmar_contrasena
                            ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                            : 'border-slate-200 focus:ring-blue-500'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                      >
                        {showConfirmPassword ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                    {form.confirmar_contrasena && form.contrasena !== form.confirmar_contrasena && (
                      <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden.</p>
                    )}
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Requisitos de Seguridad</h4>
                    <ul className="text-xs text-amber-700 space-y-1 list-disc ml-4 font-medium">
                      <li className={form.contrasena.length >= 8 ? 'text-green-600' : ''}>Mínimo 8 caracteres</li>
                      <li className={/[A-Z]/.test(form.contrasena) ? 'text-green-600' : ''}>Al menos una Mayúscula</li>
                      <li className={/[0-9]/.test(form.contrasena) ? 'text-green-600' : ''}>Al menos un Número</li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(form.contrasena) ? 'text-green-600' : ''}>Al menos un Carácter Especial</li>
                      {form.contrasena && form.confirmar_contrasena && form.contrasena === form.confirmar_contrasena && (
                        <li className="text-green-600 font-bold">✓ Las contraseñas coinciden</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-10 flex gap-4">
                {step > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    ANTERIOR
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    onClick={nextStep}
                    disabled={step === 1 && (!isCedulaValida || modoRegistro === null)}
                    className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all"
                  >
                    SIGUIENTE PASO
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex-[2] py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
                  >
                    FINALIZAR REGISTRO
                  </button>
                )}
              </div>

              <div className="mt-8 text-center">
                <Link to="/" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
                  ¿Ya tienes cuenta? Inicia Sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        severity={notification.severity}
        action={notification.action}
        content={notification.content}
      />
    </>
  );
}
