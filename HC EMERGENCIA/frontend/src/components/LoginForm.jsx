import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginForm() {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, contrasena })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Guardar el ID del usuario explícitamente
        localStorage.setItem('userId', data.user.id);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
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