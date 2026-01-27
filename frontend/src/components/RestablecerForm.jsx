import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function RestablecerForm() {
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nuevaContrasena !== confirmarContrasena) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/usuarios/restablecer/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaContrasena })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Contraseña actualizada correctamente');
        navigate('/');
      } else {
        setMensaje(data.mensaje || 'Error al restablecer');
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al conectar con el servidor');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Restablecer Contraseña</h2>

        {mensaje && <p className="text-red-500 text-sm mb-2">{mensaje}</p>}

        <label className="block mb-2">Nueva Contraseña:</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={nuevaContrasena}
          onChange={(e) => setNuevaContrasena(e.target.value)}
          required
        />

        <label className="block mb-2">Confirmar Contraseña:</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={confirmarContrasena}
          onChange={(e) => setConfirmarContrasena(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Restablecer
        </button>
      </form>
    </div>
  );
}
