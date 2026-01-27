import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RecuperarForm() {
  const [cedula, setCedula] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:3001/usuarios/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, correo })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al enviar el correo');
      setMensaje('Se ha enviado un correo con instrucciones para restablecer la contraseña');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">Recuperar contraseña</h2>

        {mensaje && <div className="mb-4 text-green-600 text-sm">{mensaje}</div>}
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Cédula</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Enviar instrucciones
        </button>
        <div className="text-center mt-4">
          <Link to="/" className="text-blue-600 hover:underline">Regresar al Login</Link>
        </div>
      </form>
    </div>
  );
}
