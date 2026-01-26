import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminAprobarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:3001/usuarios/pendientes', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setUsuarios(res.data))
      .catch(err => console.error('Error al cargar usuarios:', err));
  }, [token]);

  const aprobarUsuario = (id) => {
    axios.put(`http://localhost:3001/usuarios/aprobar/${id}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setMensaje('✅ Usuario aprobado');
        setUsuarios(prev => prev.filter(u => u.id !== id));
      })
      .catch(() => setMensaje('❌ Error al aprobar usuario'));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Usuarios Pendientes</h2>
      {mensaje && <p className="mb-2">{mensaje}</p>}
      {usuarios.length === 0 ? (
        <p>No hay usuarios pendientes</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Cédula</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Correo</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id} className="border-t">
                <td className="p-2">{usuario.cedula}</td>
                <td className="p-2">{usuario.nombres} {usuario.apellidos}</td>
                <td className="p-2">{usuario.correo}</td>
                <td className="p-2">
                  <button
                    onClick={() => aprobarUsuario(usuario.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Aprobar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
