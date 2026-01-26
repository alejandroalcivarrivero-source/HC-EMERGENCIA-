import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function HistorialProcedimientosModal({ isOpen, onClose, admisionId, pacienteId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && pacienteId) { // Solo requiere pacienteId para abrir el historial
      const fetchHistorial = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          let url = `http://localhost:3001/api/procedimientos-emergencia/${pacienteId}`;
          const params = { historial: 'true' }; // Enviar como string 'true'
          if (admisionId) { // Si admisionId está presente, se añade al filtro
            params.admisionId = admisionId;
          }
          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: params
          });
          console.log('URL de solicitud de historial:', response.config.url);
          setHistorial(response.data);
        } catch (err) {
          console.error('Error al obtener el historial de procedimientos:', err);
          setError('Error al cargar el historial de procedimientos. Por favor, intente de nuevo.');
        } finally {
          setLoading(false);
        }
      };
      fetchHistorial();
    }
  }, [isOpen, admisionId, pacienteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">Historial de Procedimientos de Emergencia</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>
        {loading ? (
          <p className="text-center text-gray-600">Cargando historial...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : historial.length === 0 ? (
          <p className="text-center text-gray-600">No hay historial de procedimientos para esta admisión.</p>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Fecha/Hora</th>
                  <th className="py-3 px-6 text-left">Procedimiento</th>
                  <th className="py-3 px-6 text-left">Observaciones</th>
                  <th className="py-3 px-6 text-left">Realizado por</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {historial.map((proc, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left">{new Date(proc.horaRealizacion).toLocaleString()}</td>
                    <td className="py-3 px-6 text-left">{proc.nombreProcedimiento || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{proc.observacion || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{proc.UsuarioProcedimiento ? `${proc.UsuarioProcedimiento.nombres} ${proc.UsuarioProcedimiento.apellidos}` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}