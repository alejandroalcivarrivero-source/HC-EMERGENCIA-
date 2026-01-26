import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function HistorialSignosVitalesModal({ isOpen, onClose, admisionId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && admisionId) {
      const fetchHistorial = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`http://localhost:3001/api/signos-vitales/historial/${admisionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setHistorial(response.data);
        } catch (err) {
          console.error('Error al obtener el historial de signos vitales:', err);
          setError('Error al cargar el historial. Por favor, intente de nuevo.');
        } finally {
          setLoading(false);
        }
      };
      fetchHistorial();
    }
  }, [isOpen, admisionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-gray-800">Historial de Signos Vitales y Antropométricos</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
        </div>
        {loading ? (
          <p className="text-center text-gray-600">Cargando historial...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : historial.length === 0 ? (
          <p className="text-center text-gray-600">No hay historial de signos vitales para este paciente.</p>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Fecha/Hora</th>
                  <th className="py-3 px-6 text-left">Temperatura (°C)</th>
                  <th className="py-3 px-6 text-left">Presión Arterial (mmHg)</th>
                  <th className="py-3 px-6 text-left">Frecuencia Cardíaca (/min)</th>
                  <th className="py-3 px-6 text-left">Frecuencia Respiratoria (/min)</th>
                  <th className="py-3 px-6 text-left">Saturación Oxígeno (%)</th>
                  <th className="py-3 px-6 text-left">Perímetro Cefálico (cm)</th>
                  <th className="py-3 px-6 text-left">Peso (kg)</th>
                  <th className="py-3 px-6 text-left">Talla (cm)</th>
                  <th className="py-3 px-6 text-left">Glicemia Capilar (mg/dL)</th>
                  <th className="py-3 px-6 text-left">Sin Constantes Vitales</th>
                  <th className="py-3 px-6 text-left">Registrado por</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {historial.map((signo, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left">{new Date(signo.fecha_hora_registro).toLocaleString()}</td>
                    <td className="py-3 px-6 text-left">{signo.temperatura || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.presion_arterial || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.frecuencia_cardiaca || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.frecuencia_respiratoria || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.saturacion_oxigeno || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.perimetro_cefalico || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.peso || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.talla || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.glicemia_capilar || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{signo.sin_constantes_vitales ? 'Sí' : 'No'}</td>
                    <td className="py-3 px-6 text-left">{signo.usuarioRegistro || 'N/A'}</td>
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