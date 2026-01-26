import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header'; // Importar el componente Header

const SeleccionarPacienteProcedimiento = () => {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const token = localStorage.getItem('token');
        // Obtener todos los pacientes (o solo admitidos, según la lógica de negocio)
        // Por ahora, obtendremos todos los pacientes para simplificar la selección.
        // En un entorno real, podrías querer filtrar por pacientes actualmente admitidos.
        const response = await axios.get('http://localhost:3001/usuarios/pacientes', { // Asumiendo una ruta para obtener todos los pacientes
          headers: { Authorization: `Bearer ${token}` }
        });
        setPacientes(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar la lista de pacientes.');
      } finally {
        setLoading(false);
      }
    };

    fetchPacientes();
  }, []);

  const filteredPacientes = pacientes.filter(paciente =>
    paciente.numero_identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.primer_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.primer_apellido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPaciente = (pacienteId) => {
    navigate(`/procedimientos-emergencia/${pacienteId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
            <div className="text-center text-gray-600">Cargando pacientes...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
            <div className="text-center text-red-500">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Seleccionar Paciente para Procedimiento</h1>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por cédula o nombre..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredPacientes.length === 0 ? (
            <p className="text-gray-600">No se encontraron pacientes.</p>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <ul className="divide-y divide-gray-200">
                {filteredPacientes.map(paciente => (
                  <li key={paciente.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {paciente.primer_nombre} {paciente.segundo_nombre} {paciente.primer_apellido} {paciente.segundo_apellido}
                      </p>
                      <p className="text-sm text-gray-600">Cédula: {paciente.numero_identificacion}</p>
                    </div>
                    <button
                      onClick={() => handleSelectPaciente(paciente.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Seleccionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SeleccionarPacienteProcedimiento;