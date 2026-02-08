import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validarCedulaEcuador } from '../utils/validaciones';

export default function RegistroForm() {
  const [form, setForm] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    correo: '',
    telefono: '',
    contrasena: '',
    confirmar_contrasena: '',
    rol_id: '',
    password_firma: ''
  });
  const [modoRegistro, setModoRegistro] = useState('manual'); // 'manual' | 'firma'
  const [archivoFirma, setArchivoFirma] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState(false);
  const [validandoFirma, setValidandoFirma] = useState(false);
  const [roles, setRoles] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

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
        alert('Solo se permiten archivos .p12 o .pfx');
        e.target.value = '';
        setArchivoFirma(null);
      }
    }
  };

  const validarYAutocompletar = async () => {
    if (!archivoFirma || !form.password_firma) {
      setError('Cargue el archivo .p12 e ingrese la contraseña para validar.');
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

      setForm(prev => ({
        ...prev,
        cedula: data.cedula,
        nombres: data.nombres,
        apellidos: data.apellidos
      }));
      setCamposBloqueados(true);
      alert('Datos validados y extraídos correctamente del certificado.');

    } catch (err) {
      setError(err.message);
      setCamposBloqueados(false);
    } finally {
      setValidandoFirma(false);
    }
  };

  const validateCedula = (cedula) => {
    if (!validarCedulaEcuador(cedula)) {
      return 'El número de cédula ingresado no es válido para Ecuador.';
    }
    return null;
  };

  const validateEmail = (email) => {
    if (!email) return 'El nombre de usuario (Zimbra) es requerido.';
    return null;
  };

  const validatePassword = (password) => {
    if (password.length < 8 || password.length > 16) return 'La contraseña debe tener entre 8 y 16 caracteres.';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe contener al menos una letra mayúscula.';
    if (!/[a-z]/.test(password)) return 'La contraseña debe contener al menos una letra minúscula.';
    if (!/[0-9]/.test(password)) return 'La contraseña debe contener al menos un número.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cedulaError = validateCedula(form.cedula);
    if (cedulaError) { setError(cedulaError); return; }

    const emailError = validateEmail(form.correo);
    if (emailError) { setError(emailError); return; }

    const passwordError = validatePassword(form.contrasena);
    if (passwordError) { setError(passwordError); return; }

    if (form.contrasena !== form.confirmar_contrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (modoRegistro === 'firma' && (!archivoFirma || !form.password_firma)) {
      setError('Para registro con firma, debe cargar el archivo .p12 y su contraseña.');
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

      alert('Registro exitoso');
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      {/* Contenedor con ancho ajustado y sombra profesional */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
        
        {/* Encabezado Institucional */}
        <div className="bg-[#1e40af] p-6 text-white relative">
          <h2 className="text-2xl font-bold text-center">Registro de Profesional - SIGEMECH</h2>
          <p className="text-center text-blue-100 text-sm">Centro de Salud Chone Tipo C</p>
          
          <div className="flex justify-center mt-4 gap-4">
            <button
              type="button"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${modoRegistro === 'manual' ? 'bg-white text-[#1e40af]' : 'bg-blue-700 text-blue-100 hover:bg-blue-600'}`}
              onClick={() => { setModoRegistro('manual'); setCamposBloqueados(false); }}
            >
              REGISTRO MANUAL
            </button>
            <button
              type="button"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${modoRegistro === 'firma' ? 'bg-white text-[#1e40af]' : 'bg-blue-700 text-blue-100 hover:bg-blue-600'}`}
              onClick={() => setModoRegistro('firma')}
            >
              REGISTRO CON FIRMA (.P12)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {modoRegistro === 'firma' && (
            <div className="mb-8 p-5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-blue-900">Validación de Firma Electrónica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-800">Archivo .p12 / .pfx</label>
                  <input 
                    type="file" 
                    accept=".p12,.pfx" 
                    onChange={handleFileChange} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-blue-800">Contraseña del certificado</label>
                  <input 
                    type="password" 
                    name="password_firma" 
                    value={form.password_firma} 
                    onChange={handleChange} 
                    placeholder="Ingrese la clave" 
                    className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={validarYAutocompletar}
                disabled={validandoFirma || !archivoFirma || !form.password_firma}
                className="mt-5 w-full md:w-auto px-6 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-blue-300 transition-all font-semibold text-sm shadow-md flex items-center justify-center"
              >
                {validandoFirma ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validando Certificado...
                  </>
                ) : 'Validar y Extraer Información'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* GRUPO 1: DATOS PERSONALES */}
            <div className="col-span-2 border-b border-gray-100 pb-2">
              <span className="text-blue-700 font-bold uppercase text-xs tracking-widest flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-[10px]">1</span>
                Identidad Personal
              </span>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Cédula</label>
              <input 
                type="text" 
                name="cedula"
                value={form.cedula}
                onChange={handleChange}
                required
                readOnly={modoRegistro === 'firma' && camposBloqueados}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none ${modoRegistro === 'firma' && camposBloqueados ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Fecha de Nacimiento</label>
              <input 
                type="date" 
                name="fecha_nacimiento"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Nombres</label>
              <input 
                type="text" 
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                required
                readOnly={modoRegistro === 'firma' && camposBloqueados}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none ${modoRegistro === 'firma' && camposBloqueados ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Apellidos</label>
              <input 
                type="text" 
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                required
                readOnly={modoRegistro === 'firma' && camposBloqueados}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all outline-none ${modoRegistro === 'firma' && camposBloqueados ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Sexo</label>
              <select 
                name="sexo" 
                value={form.sexo} 
                onChange={handleChange} 
                required 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Seleccione</option>
                {sexos.map(sexo => (
                  <option key={sexo.id} value={sexo.nombre}>{sexo.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Teléfono de Contacto</label>
              <input 
                type="text" 
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="Ej: 0999999999"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
              />
            </div>

            {/* GRUPO 2: DATOS INSTITUCIONALES */}
            <div className="col-span-2 border-b border-gray-100 pb-2 mt-4">
              <span className="text-blue-700 font-bold uppercase text-xs tracking-widest flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-[10px]">2</span>
                Credenciales y Contacto
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Usuario Zimbra</label>
              <div className="flex shadow-sm group">
                <input 
                  type="text" 
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  required
                  className="flex-1 p-2.5 border rounded-l-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="nombre.apellido" 
                />
                <span className="p-2.5 bg-gray-200 border border-l-0 rounded-r-lg text-gray-600 text-xs font-semibold flex items-center">
                  @13d07.mspz4.gob.ec
                </span>
              </div>
              <p className="text-[10px] text-gray-500 italic mt-1">Use su usuario de correo institucional sin el @ dominio.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Rol Institucional</label>
              <select 
                name="rol_id" 
                value={form.rol_id} 
                onChange={handleChange} 
                required 
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Seleccione su rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
            </div>

            {/* GRUPO 3: SEGURIDAD */}
            <div className="col-span-2 border-b border-gray-100 pb-2 mt-4">
              <span className="text-blue-700 font-bold uppercase text-xs tracking-widest flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-2 text-[10px]">3</span>
                Seguridad de Acceso
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Contraseña del Sistema</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="contrasena"
                  value={form.contrasena}
                  onChange={handleChange}
                  required
                  placeholder="••••••••" 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Confirmar Contraseña</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  name="confirmar_contrasena"
                  value={form.confirmar_contrasena}
                  onChange={handleChange}
                  required
                  placeholder="••••••••" 
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <div className="mt-12">
            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
            >
              FINALIZAR REGISTRO PROFESIONAL
            </button>
            <p className="text-center mt-6 text-xs text-gray-500 leading-relaxed px-10">
              Al registrarte, confirmas que eres personal autorizado del Centro de Salud Chone Tipo C y aceptas el uso de tu firma electrónica para la suscripción legal de formularios clínicos según la normativa vigente.
            </p>
            <div className="mt-6 flex justify-center border-t pt-6">
              <Link to="/" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                Regresar al Inicio de Sesión
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
