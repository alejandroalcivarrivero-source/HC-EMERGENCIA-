import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import axios from 'axios';

export default function ProduccionPorEstado() {
  const [produccionData, setProduccionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduccionData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/reportes/produccion-por-estado', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setProduccionData(response.data);
      } catch (err) {
        console.error('Error al obtener datos de producción por estado:', err);
        setError('Error al cargar los datos de producción. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduccionData();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Producción por Estado de Paciente</h2>

          {loading && <p className="text-center text-gray-600">Cargando datos...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {!loading && !error && produccionData.length === 0 && (
            <p className="text-center text-gray-600">No hay datos de producción disponibles.</p>
          )}

          {!loading && !error && produccionData.length > 0 && (
            <div className="overflow-x-auto bg-white shadow-md rounded-lg p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado del Paciente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad de Pacientes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produccionData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.estado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  );
}