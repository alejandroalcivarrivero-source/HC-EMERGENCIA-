import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';

export default function HistorialAdmisionesModal({ isOpen, onClose, pacienteId }) {
  const [historialAdmisiones, setHistorialAdmisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && pacienteId) {
      const fetchHistorialAdmisiones = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:3001/api/admisiones/historial/${pacienteId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setHistorialAdmisiones(response.data);
        } catch (err) {
          console.error('Error al obtener el historial de admisiones:', err);
          setError('Error al cargar el historial de admisiones. Por favor, intente de nuevo.');
        } finally {
          setLoading(false);
        }
      };
      fetchHistorialAdmisiones();
    }
  }, [isOpen, pacienteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">Historial de Admisiones del Paciente</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>
        {loading ? (
          <p className="text-center text-gray-600">Cargando historial de admisiones...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : historialAdmisiones.length === 0 ? (
          <p className="text-center text-gray-600">No hay historial de admisiones para este paciente.</p>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Fecha/Hora Admisión</th>
                  <th className="py-3 px-6 text-left">Cédula</th>
                  <th className="py-3 px-6 text-left">Apellidos y Nombres</th>
                  <th className="py-3 px-6 text-left">Motivo de Consulta</th>
                  <th className="py-3 px-6 text-left">Triaje</th>
                  <th className="py-3 px-6 text-left">Estado Paciente</th>
                  <th className="py-3 px-6 text-left">Usuario Registro</th>
                  <th className="py-3 px-6 text-left">Diagnóstico</th>
                  <th className="py-3 px-6 text-left">Fecha/Hora Egreso</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {historialAdmisiones.map((admision, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left">{moment.utc(admision.fechaHoraAdmision).tz('America/Guayaquil').format('DD/MM/YYYY HH:mm')}</td>
                    <td className="py-3 px-6 text-left">{admision.cedula}</td>
                    <td className="py-3 px-6 text-left">{admision.nombrePaciente}</td>
                    <td className="py-3 px-6 text-left">{admision.motivoConsulta}</td>
                    <td className="py-3 px-6 text-left">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${admision.triajeColor}-500 text-white`}>
                        {admision.triajeNombre}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">{admision.estadoPaciente}</td>
                    <td className="py-3 px-6 text-left">{admision.usuarioRegistro}</td>
                    <td className="py-3 px-6 text-left">{admision.diagnosticoFinal || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{admision.fechaHoraEgreso ? moment.utc(admision.fechaHoraEgreso).tz('America/Guayaquil').format('DD/MM/YYYY HH:mm') : 'N/A'}</td>
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