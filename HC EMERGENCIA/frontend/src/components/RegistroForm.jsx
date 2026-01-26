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
    rol_id: ''
  });
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

    try {
      const res = await fetch('http://localhost:3001/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');

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

        {error && <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
            <input type="text" name="cedula" value={form.cedula} onChange={handleChange} required className="input-field" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
            <input type="text" name="nombres" value={form.nombres} onChange={handleChange} required className="input-field" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
            <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} required className="input-field" />
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
