import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AlertaTriaje() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlertas = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró token de autenticación. Por favor, inicie sesión.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:3001/api/alertas/alertas-triaje', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAlertas(response.data);
      } catch (err) {
        console.error('Error al obtener alertas de triaje:', err);
        setError('Error al cargar las alertas. Intente de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertas();
    // Opcional: Refrescar las alertas cada cierto tiempo
    const intervalId = setInterval(fetchAlertas, 60000); // Cada 1 minuto

    return () => clearInterval(intervalId); // Limpiar el intervalo al desmontar
  }, []);

  if (loading) {
    return <div className="text-center py-4">Cargando alertas...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (alertas.length === 0) {
    return <div className="text-center py-4 text-gray-500">No hay alertas de triaje activas en este momento.</div>;
  }

  // Función para determinar la clase CSS del triaje (similar a SignosVitalesPage)
  const getTriajeClass = (triajeColor) => {
    // Asegurarse de que triajeColor sea una cadena válida y no vacía
    if (!triajeColor) {
      return 'bg-gray-300 text-gray-800'; // Gris por defecto si no hay color
    }
    // Mapear los colores directamente a clases de Tailwind CSS
    switch (triajeColor.toLowerCase()) {
      case 'rojo':
        return 'bg-red-500 text-white';
      case 'naranja':
        return 'bg-orange-700 text-white';
      case 'amarillo':
        return 'bg-yellow-300 text-gray-800';
      case 'verde':
        return 'bg-green-500 text-white';
      case 'azul':
        return 'bg-blue-500 text-white';
      case 'gris': // Para el estado "FALLECIDO"
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-300 text-gray-800'; // Color por defecto si no coincide
    }
  };

  // Determinar el color de la alerta principal basado en el triaje más crítico
  const getAlertaContainerClass = () => {
    if (alertas.some(alerta => alerta.triajeColor === 'Rojo')) {
      return 'bg-red-100 border-red-500 text-red-700';
    }
    if (alertas.some(alerta => alerta.triajeColor === 'Naranja')) {
      return 'bg-orange-200 border-orange-700 text-orange-900';
    }
    if (alertas.some(alerta => alerta.triajeColor === 'Amarillo')) {
      return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    }
    // Si hay alertas pero ninguna es Rojo/Naranja/Amarillo, por defecto se muestra un color neutro o verde
    return 'bg-blue-100 border-blue-500 text-blue-700'; // O un color más neutro si se prefiere
  };

  return (
    <div className={`${getAlertaContainerClass()} border-l-4 p-4 shadow-md mb-6`} role="alert">
      <p className="font-bold text-lg mb-2">🚨 Alertas de Triaje Activas 🚨</p>
      <ul className="list-disc pl-5">
        {alertas.map((alerta) => (
          <li key={alerta.id} className="mb-1">
            Paciente: <span className="font-semibold">{alerta.Paciente.primer_nombre} {alerta.Paciente.segundo_nombre || ''} {alerta.Paciente.primer_apellido} {alerta.Paciente.segundo_apellido || ''} ({alerta.Paciente.numero_identificacion})</span> - Triaje: <span className={`font-bold ${getTriajeClass(alerta.triajeColor)} px-2 py-1 rounded-full text-xs`}>{alerta.triaje}</span> - Última Alerta: {new Date(alerta.fecha_hora_ultima_alerta_triaje).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}