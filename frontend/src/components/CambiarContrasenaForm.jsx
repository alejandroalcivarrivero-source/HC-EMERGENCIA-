import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

export default function CambiarContrasenaForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setMessage('Las nuevas contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('No autenticado. Por favor, inicie sesión.');
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:3001/usuarios/cambiar-contrasena', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Su contraseña fue cambiada con éxito.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowSuccessModal(true);
      } else {
        setMessage(data.message || 'Error al cambiar la contraseña.');
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      setMessage('Error de conexión al servidor.');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Cambiar Contraseña</h2>


        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-gray-700 text-sm font-bold mb-2">
            Contraseña Actual:
          </label>
          <input
            type="password"
            id="currentPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">
            Nueva Contraseña:
          </label>
          <input
            type="password"
            id="newPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmNewPassword" className="block text-gray-700 text-sm font-bold mb-2">
            Confirmar Nueva Contraseña:
          </label>
          <input
            type="password"
            id="confirmNewPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cambiar Contraseña
          </button>
        </div>
        <div className="text-center mt-4">
          <Link to="/" className="text-blue-500 hover:underline">Regresar al Login</Link>
        </div>
      </form>
      <ConfirmModal
        message={message}
        isOpen={showSuccessModal}
        onConfirm={() => navigate('/')}
        onCancel={() => navigate('/')} // En este caso, cancelar también redirige al login
        isInformative={true} // Añadimos esta prop para que sea una modal informativa
      />
    </div>
  );
}