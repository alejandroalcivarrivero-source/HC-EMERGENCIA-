import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NotificationModal from './NotificationModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RestablecerForm() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    otp: '',
    nuevaContrasena: '',
    repetirContrasena: '',
  });
  
  const [mensaje, setMensaje] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    severity: 'info',
  });

  const passwordRequirements = {
    length: form.nuevaContrasena.length >= 8,
    uppercase: /[A-Z]/.test(form.nuevaContrasena),
    number: /\d/.test(form.nuevaContrasena),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(form.nuevaContrasena),
  };

  const passwordsMatch = form.nuevaContrasena === form.repetirContrasena && form.nuevaContrasena !== '';
  const isOtpValid = form.otp.length === 6;
  const areRequirementsMet = Object.values(passwordRequirements).every(Boolean);
  
  const isButtonDisabled = !isOtpValid || !areRequirementsMet || !passwordsMatch;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (form.nuevaContrasena && form.repetirContrasena && !passwordsMatch) {
      setMensaje('Las contraseñas no coinciden');
    } else {
      setMensaje('');
    }
  }, [form.nuevaContrasena, form.repetirContrasena, passwordsMatch]);


  const showNotification = (title, message, severity = 'info') => {
    setNotification({ isOpen: true, title, message, severity });
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isButtonDisabled) return;

    try {
      // NOTE: Assuming VITE_BACKEND_URL is available from environment variables
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/auth/restablecer-contrasena`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: form.otp,
          nuevaContrasena: form.nuevaContrasena,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Éxito', data.msg || 'Contraseña actualizada correctamente.', 'success');
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after success
      } else {
        showNotification('Error', data.error || 'Ocurrió un error inesperado.', 'error');
      }
    } catch (error) {
      console.error('Error al restablecer la contraseña:', error);
      showNotification('Error de Conexión', 'No se pudo conectar con el servidor.', 'error');
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Restablecer Contraseña
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Código OTP
              </label>
              <input
                type="text"
                name="otp"
                id="otp"
                value={form.otp}
                onChange={handleChange}
                maxLength="6"
                className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingresa tu código de 6 dígitos"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="nuevaContrasena" className="text-sm font-medium text-gray-700">
                Nueva Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="nuevaContrasena"
                id="nuevaContrasena"
                value={form.nuevaContrasena}
                onChange={handleChange}
                className="block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingresa tu nueva contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                style={{ top: '24px' }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="repetirContrasena" className="text-sm font-medium text-gray-700">
                Repetir Contraseña
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="repetirContrasena"
                id="repetirContrasena"
                value={form.repetirContrasena}
                onChange={handleChange}
                className={`block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
                  mensaje ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="Repite tu nueva contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                style={{ top: '24px' }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {mensaje && <p className="text-sm text-red-600">{mensaje}</p>}

            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700">Consideraciones de Seguridad:</h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li className={`flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordRequirements.length ? '✔' : '•'}<span className="ml-2">Al menos 8 caracteres</span>
                </li>
                <li className={`flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordRequirements.uppercase ? '✔' : '•'}<span className="ml-2">Incluir una mayúscula (A-Z)</span>
                </li>
                <li className={`flex items-center ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordRequirements.number ? '✔' : '•'}<span className="ml-2">Incluir un número (0-9)</span>
                </li>
                <li className={`flex items-center ${passwordRequirements.specialChar ? 'text-green-600' : 'text-gray-500'}`}>
                  {passwordRequirements.specialChar ? '✔' : '•'}<span className="ml-2">Incluir un carácter especial (!@#$...)</span>
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm ${
                isButtonDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
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
