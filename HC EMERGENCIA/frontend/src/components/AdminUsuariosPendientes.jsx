import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminUsuariosPendientes() {
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);

  useEffect(() => {
    const obtenerUsuariosPendientes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3001/usuarios/pendientes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsuariosPendientes(res.data);
      } catch (error) {
        console.error('Error al obtener usuarios pendientes:', error);
      }
    };

    obtenerUsuariosPendientes();
  }, []);

  const aprobarUsuario = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/usuarios/aprobar/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsuariosPendientes((prevUsuarios) =>
        prevUsuarios.filter((usuario) => usuario.id !== id)
      );
    } catch (error) {
      console.error('Error al aprobar usuario:', error);
    }
  };

  const rechazarUsuario = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/usuarios/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsuariosPendientes((prevUsuarios) =>
        prevUsuarios.filter((usuario) => usuario.id !== id)
      );
    } catch (error) {
      console.error('Error al rechazar usuario:', error);
    }
  };

  const roles = {
    1: 'Médico',
    2: 'Obstetriz',
    3: 'Enfermera',
    4: 'Estadístico',
    5: 'Administrador',
  };

  const getRoleName = (rolId) => {
    return roles[rolId] || 'Desconocido';
  };

  return (
    <div>
      <h2>Usuarios Pendientes de Aprobación</h2>
      {usuariosPendientes.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Cédula</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPendientes.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.cedula}</td>
                <td>{usuario.nombres}</td>
                <td>{usuario.apellidos}</td>
                <td>{usuario.correo}</td>
                <td>{getRoleName(usuario.rol_id)}</td>
                <td>
                  <button onClick={() => aprobarUsuario(usuario.id)}>Aceptar</button>
                  <button onClick={() => rechazarUsuario(usuario.id)}>Rechazar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay usuarios pendientes de aprobación.</p>
      )}
    </div>
  );
}