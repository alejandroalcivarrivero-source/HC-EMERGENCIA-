import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../config/axios';
import { useNotification } from '../contexts/NotificationContext';
import Swal from 'sweetalert2';

export default function LoginForm() {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showError } = useNotification();

  const handleSubmit = async (e) => {
   e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent any parent handlers
    setError(null);
    try {
      const res = await axios.post('/usuarios/login', {
        cedula,
        contrasena
      });

      const data = res.data;

      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Guardar el ID del usuario explícitamente
        localStorage.setItem('userId', data.user.id);
      }
      
      if (data.user && (data.user.rol_id === 5 || data.user.rol_id === 6)) {
        navigate('/admin/usuarios');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const responseData = err.response?.data;
      const responseMessage = responseData?.message;
      let errorMessage = 'Error al iniciar sesión. Por favor, intente de nuevo.';
      let errorTitle = 'Error de Autenticación';

      if (status === 404) {
        errorTitle = 'Servicio no disponible';
        errorMessage = 'El servicio de autenticación no está disponible temporalmente.';
      } else if (status === 401) {
        // Verificar intentos fallidos
        if (responseData && responseData.intentos_fallidos !== undefined) {
             const intentos = responseData.intentos_fallidos;
             const maximos = responseData.max_intentos || 10;
             const restantes = responseData.intentosRestantes !== undefined ? responseData.intentosRestantes : (maximos - intentos);
             
             // Si queda 1 intento o menos, es el último
             const isLastAttempt = restantes <= 1;
             
             // Mostrar modal SweetAlert2
             Swal.fire({
               title: 'Contraseña Incorrecta',
               text: 'Intento ' + responseData.intentos + ' de 10. Al llegar a 10 se bloqueará.',
               icon: 'warning',
               confirmButtonText: 'Entendido',
               confirmButtonColor: isLastAttempt ? '#d33' : '#3085d6',
               allowOutsideClick: false,
               allowEscapeKey: false,
               allowEnterKey: false,
               stopKeydownPropagation: true
            });
             return; // Detener el flujo aquí ya que Swal maneja la UI
        } else {
             errorMessage = 'Cédula o contraseña no coinciden';
        }
      } else if (status === 403) {
         // Cuenta bloqueada o pendiente
         Swal.fire({
            title: 'Acceso Denegado',
            text: responseMessage || 'Su cuenta está bloqueada o pendiente de aprobación.',
            icon: 'error',
            confirmButtonText: 'Cerrar',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            stopKeydownPropagation: true
         });
         return;
      } else if (status === 429) { // Too Many Requests
        errorMessage = 'Su cuenta ha sido bloqueada por demasiados intentos fallidos';
        errorTitle = 'Cuenta Bloqueada';
      } else if (status === 500) {
        errorTitle = 'Error de Servidor';
        errorMessage = 'No se pudo conectar con el servidor central';
      } else if (err.message === 'Network Error' || !err.response) {
        errorTitle = 'Error de Conexión';
        errorMessage = 'No se pudo conectar con el servidor central';
      }

      setError(errorMessage);
      showError(errorTitle, errorMessage);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: 'url("/FOTO_CENTRO_SALUD_CHONE.jpg")' }}
    >
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg relative">
        <div className="flex justify-center mb-6">
          <img src="/LOGO_MSP.png" alt="Logo MSP" className="h-24" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-700 uppercase">Centro de Salud Chone Tipo C</h2>

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Iniciar Sesión
        </button>

        <p className="mt-4 text-sm text-center">
          <Link to="/recuperar" className="text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="mt-2 text-sm text-center">
          ¿No tienes una cuenta? <Link to="/registro" className="text-blue-600 hover:underline">Regístrate</Link>
        </p>
      </form>
      <div className="absolute bottom-4 text-white text-center w-full">
        <p className="text-sm font-bold">Sistema de Gestión de Emergencias del Centro de Salud Chone</p>
        <p className="text-xs font-bold">© 2025 Desarrollado por Sergio Solorzano y Alejandro Alcivar, con la colaboración de la Inteligencia Artificial de Google.</p>
      </div>
    </div>
  );
}
