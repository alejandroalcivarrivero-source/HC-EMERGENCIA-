import { useState, useEffect } from 'react'; // Importar useEffect
import { useNavigate, Link } from 'react-router-dom';

export default function RegistroForm() {
  const [form, setForm] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: '',
    correo: '',
    telefono: '', // Nuevo campo para el número de teléfono
    contrasena: '',
    confirmar_contrasena: '', // Nuevo campo para confirmar contraseña
    rol_id: '',
    password_firma: '' // Contraseña del p12
  });
  const [modoRegistro, setModoRegistro] = useState('manual'); // 'manual' | 'firma'
  const [archivoFirma, setArchivoFirma] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState(false); // Para bloquear campos autocompletados
  const [validandoFirma, setValidandoFirma] = useState(false);
  const [roles, setRoles] = useState([]); // Estado para los roles
  const [sexos, setSexos] = useState([]); // Nuevo estado para los sexos
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para mostrar/ocultar confirmar contraseña
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar roles
        const rolesRes = await fetch('http://localhost:3001/usuarios/public-roles');
        const rolesData = await rolesRes.json();
        if (!rolesRes.ok) throw new Error(rolesData.message || 'Error al obtener roles');
        setRoles(rolesData);

        // Cargar sexos
        const sexosRes = await fetch('http://localhost:3001/usuarios/sexos'); // Endpoint para obtener sexos
        const sexosData = await sexosRes.json();
        if (!sexosRes.ok) throw new Error(sexosData.message || 'Error al obtener sexos');
        setSexos(sexosData);

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Intente de nuevo más tarde.');
      }
    };
    fetchData();
  }, []); // Se ejecuta una vez al montar el componente

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpiar errores relacionados con el campo modificado
    if (error && error.includes(e.target.name)) {
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.p12') || file.name.endsWith('.pfx')) {
        setArchivoFirma(file);
        setCamposBloqueados(false); // Resetear bloqueo si cambia el archivo
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

      // Autocompletar y bloquear
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
    if (!/^\d{10}$/.test(cedula)) {
      return 'La cédula debe tener 10 dígitos numéricos.';
    }
    // Algoritmo de validación de cédula ecuatoriana (simplificado)
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) {
      return 'Cédula inválida: Código de provincia incorrecto.';
    }
    const digitoVerificador = parseInt(cedula[9], 10);
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let digito = parseInt(cedula[i], 10);
      if (i % 2 === 0) { // Posiciones impares
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      suma += digito;
    }
    const ultimoDigitoCalculado = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    if (ultimoDigitoCalculado !== digitoVerificador) {
      return 'Cédula inválida: Dígito verificador incorrecto.';
    }
    return null; // Cédula válida
  };

  const validateEmail = (email) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Formato de correo electrónico inválido.';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (password.length < 8 || password.length > 16) {
      return 'La contraseña debe tener entre 8 y 16 caracteres.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula.';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra minúscula.';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe contener al menos un número.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Limpiar errores previos

    // Validaciones
    const cedulaError = validateCedula(form.cedula);
    if (cedulaError) {
      setError(cedulaError);
      return;
    }

    const emailError = validateEmail(form.correo);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(form.contrasena);
    if (passwordError) {
      setError(passwordError);
      return;
    }

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
        // No setear Content-Type header manualmente con FormData, el navegador lo hace con boundary
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-10 w-full max-w-2xl">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">Registro de Nuevo Usuario</h2>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
          type="button"
          className={`pb-2 px-4 font-medium text-sm transition-colors ${modoRegistro === 'manual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => { setModoRegistro('manual'); setCamposBloqueados(false); }}
        >
          Registro Manual
        </button>
        <button
          type="button"
          className={`pb-2 px-4 font-medium text-sm transition-colors ${modoRegistro === 'firma' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setModoRegistro('firma')}
        >
          Registro con Firma (.p12)
        </button>
      </div>

      {error && <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">{error}</div>}

      {modoRegistro === 'firma' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">Carga de Firma Electrónica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Archivo .p12 / .pfx</label>
              <input type="file" accept=".p12,.pfx" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Contraseña del certificado</label>
              <input type="password" name="password_firma" value={form.password_firma} onChange={handleChange} placeholder="Contraseña de la firma" className="input-field" />
            </div>
          </div>
          
          <button
            type="button"
            onClick={validarYAutocompletar}
            disabled={validandoFirma || !archivoFirma || !form.password_firma}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors text-sm font-medium"
          >
            {validandoFirma ? 'Validando...' : 'Validar y Autocompletar Datos'}
          </button>
          
          <p className="mt-2 text-xs text-blue-600">
            * Al validar, la Cédula, Nombres y Apellidos se extraerán automáticamente de su firma digital.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
          <input
            type="text"
            name="cedula"
            value={form.cedula}
            onChange={handleChange}
            required
            readOnly={modoRegistro === 'firma' && camposBloqueados}
            className={`input-field ${modoRegistro === 'firma' && camposBloqueados ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
          <input
            type="text"
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
            required
            readOnly={modoRegistro === 'firma' && camposBloqueados}
            className={`input-field ${modoRegistro === 'firma' && camposBloqueados ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
          <input
            type="text"
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            required
            readOnly={modoRegistro === 'firma' && camposBloqueados}
            className={`input-field ${modoRegistro === 'firma' && camposBloqueados ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} required className="input-field" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <select name="sexo" value={form.sexo} onChange={handleChange} required className="input-field">
              <option value="">Seleccione</option>
              {sexos.map(sexo => (
                <option key={sexo.id} value={sexo.nombre}>{sexo.nombre}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" name="correo" value={form.correo} onChange={handleChange} required className="input-field" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono</label>
            <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="contrasena"
                value={form.contrasena}
                onChange={handleChange}
                required
                className="input-field pr-10" // Añadir padding a la derecha para el icono
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.622a8.967 8.967 0 017.98 0m-.932 1.24a3.75 3.75 0 11-7.498 0 3.75 3.75 0 017.498 0zM14.98 8.622a8.967 8.967 0 017.98 0m-.932 1.24a3.75 3.75 0 11-7.498 0 3.75 3.75 0 017.498 0zM12 12a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmar_contrasena"
                value={form.confirmar_contrasena}
                onChange={handleChange}
                required
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.622a8.967 8.967 0 017.98 0m-.932 1.24a3.75 3.75 0 11-7.498 0 3.75 3.75 0 017.498 0zM14.98 8.622a8.967 8.967 0 017.98 0m-.932 1.24a3.75 3.75 0 11-7.498 0 3.75 3.75 0 017.498 0zM12 12a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select name="rol_id" value={form.rol_id} onChange={handleChange} required className="input-field">
              <option value="">Seleccione</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Registrar</button>
        <p className="mt-4 text-sm text-center">
          ¿Ya tienes una cuenta? <Link to="/" className="text-blue-600 hover:underline">Inicia Sesión</Link>
        </p>
      </form>
    </div>
  );
}
