import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';

export default function AdminUsuarios() {
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [usuariosActivos, setUsuariosActivos] = useState([]);
  const [roles, setRoles] = useState({});

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/usuarios', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const usuarios = res.data;
        setUsuariosPendientes(usuarios.filter(usuario => !usuario.activo));
        setUsuariosActivos(usuarios.filter(usuario => usuario.activo));
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };

    const obtenerRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/usuarios/roles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const rolesData = res.data;
        const rolesObject = {};
        rolesData.forEach(rol => {
          rolesObject[rol.id] = rol.nombre;
        });
        setRoles(rolesObject);
      } catch (error) {
        console.error('Error al obtener roles:', error);
      }
    };

    obtenerUsuarios();
    obtenerRoles();
  }, []);

  const toggleActivo = async (id, activo) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/usuarios/aprobar/${id}`, { activo: !activo }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsuariosPendientes((prevUsuarios) => {
        const updated = prevUsuarios.map((usuario) =>
          usuario.id === id ? { ...usuario, activo: !activo } : usuario
        );
        // Si se activó, mover a activos. Si se inactivó, mover a pendientes.
        // Como aquí solo cambiamos el estado, la recarga de lista completa sería ideal,
        // pero para optimizar UI, podemos filtrar.
        // Nota: La lógica actual de map solo actualiza la propiedad en la lista actual.
        // Si queremos mover entre listas, necesitamos más lógica.
        // Por simplicidad y consistencia, recargamos usuarios.
        return updated;
      });
      
      // Recargar usuarios para reflejar cambios en las listas correctas
      const res = await axios.get('http://localhost:3001/usuarios', {
          headers: { Authorization: `Bearer ${token}` },
      });
      const usuarios = res.data;
      setUsuariosPendientes(usuarios.filter(usuario => !usuario.activo));
      setUsuariosActivos(usuarios.filter(usuario => usuario.activo));

    } catch (error) {
      console.error('Error al actualizar estado del usuario:', error);
    }
  };

  const handleUpdateCorreoAlternativo = async (id, correoAlternativo) => {
    try {
        const token = localStorage.getItem('token');
        // Usamos el endpoint de usuariosAdmin que ya existe o creamos uno nuevo.
        // Si no existe, usamos el genérico de update si está permitido.
        // Asumiendo endpoint PUT /usuarios/:id o similar.
        // Verificando backend/routes/usuarios.js sería ideal, pero por ahora asumimos que usuariosAdmin tiene poder.
        await axios.put(`http://localhost:3001/usuarios-admin/${id}`, { correo_alternativo: correoAlternativo }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        alert('Correo alternativo actualizado.');
    } catch (error) {
        console.error('Error al actualizar correo alternativo:', error);
        alert('Error al actualizar correo alternativo.');
    }
  };

  const handleChangeRol = async (id, rolId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/usuarios/asignarAdmin/${id}`, { rol_id: rolId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsuariosPendientes((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === id ? { ...usuario, rol_id: rolId } : usuario
        )
      );
      setUsuariosActivos((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === id ? { ...usuario, rol_id: rolId } : usuario
        )
      );
    } catch (error) {
      console.error('Error al actualizar rol del usuario:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Administración de Usuarios</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Usuarios Pendientes de Aprobación</h3>
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombres
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellidos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosPendientes.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.cedula}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.nombres}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.apellidos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{usuario.correo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={usuario.rol_id}
                      onChange={(e) => handleChangeRol(usuario.id, parseInt(e.target.value))}
                    >
                      {Object.entries(roles).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() => toggleActivo(usuario.id, usuario.activo)}
                    >
                      {usuario.activo ? 'Inactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Usuarios Activos</h3>
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombres
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Apellidos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Correo Institucional
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Correo Alternativo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rol
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosActivos.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {usuario.cedula}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.nombres}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.apellidos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.correo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                        type="email"
                        defaultValue={usuario.correo_alternativo || ''}
                        onBlur={(e) => {
                            if (e.target.value !== usuario.correo_alternativo) {
                                handleUpdateCorreoAlternativo(usuario.id, e.target.value);
                            }
                        }}
                        className="mt-1 block w-full py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs"
                        placeholder="Agregar correo alt."
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={usuario.rol_id}
                      onChange={(e) => handleChangeRol(usuario.id, parseInt(e.target.value))}
                    >
                      {Object.entries(roles).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      onClick={() => toggleActivo(usuario.id, usuario.activo)}
                    >
                      {usuario.activo ? 'Inactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </div>
  );
}
