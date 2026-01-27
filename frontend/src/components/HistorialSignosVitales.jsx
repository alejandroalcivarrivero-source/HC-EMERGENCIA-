import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';

const HistorialSignosVitales = ({ admisionId }) => {
  const [signosVitales, setSignosVitales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (admisionId) {
      cargarHistorial();
    }
  }, [admisionId]);

  const cargarHistorial = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3001/api/pendientes-firma/prellenado/${admisionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSignosVitales(response.data.signosVitales || []);
    } catch (error) {
      console.error('Error al cargar historial de signos vitales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando historial...</div>;
  }

  if (signosVitales.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded">
        No hay registros de signos vitales disponibles.
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-gray-800">Historial de Signos Vitales</h4>
      </div>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {signosVitales.map((sv, index) => (
          <div
            key={index}
            className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {format(new Date(sv.fecha_hora_registro), 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
            {sv.sin_constantes_vitales ? (
              <p className="text-sm text-gray-600 italic">Sin constantes vitales registradas</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {sv.temperatura && (
                  <div>
                    <span className="text-gray-600">Temp:</span>{' '}
                    <span className="font-semibold">{sv.temperatura}°C</span>
                  </div>
                )}
                {sv.presion_arterial && (
                  <div>
                    <span className="text-gray-600">PA:</span>{' '}
                    <span className="font-semibold">{sv.presion_arterial}</span>
                  </div>
                )}
                {sv.frecuencia_cardiaca && (
                  <div>
                    <span className="text-gray-600">FC:</span>{' '}
                    <span className="font-semibold">{sv.frecuencia_cardiaca} bpm</span>
                  </div>
                )}
                {sv.frecuencia_respiratoria && (
                  <div>
                    <span className="text-gray-600">FR:</span>{' '}
                    <span className="font-semibold">{sv.frecuencia_respiratoria} rpm</span>
                  </div>
                )}
                {sv.saturacion_oxigeno && (
                  <div>
                    <span className="text-gray-600">SpO2:</span>{' '}
                    <span className="font-semibold">{sv.saturacion_oxigeno}%</span>
                  </div>
                )}
                {sv.peso && (
                  <div>
                    <span className="text-gray-600">Peso:</span>{' '}
                    <span className="font-semibold">{sv.peso} kg</span>
                  </div>
                )}
                {sv.talla && (
                  <div>
                    <span className="text-gray-600">Talla:</span>{' '}
                    <span className="font-semibold">{sv.talla} cm</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorialSignosVitales;
