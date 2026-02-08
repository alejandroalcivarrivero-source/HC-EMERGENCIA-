import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, ShieldAlert, BarChart3 } from 'lucide-react';

export default function DashboardEnfermeria() {
  const [stats, setStats] = useState({
    pacientesSinTriage: 0,
    alertasSignosVitales: 0,
    triagePorRealizar: 0,
  });
  const [pacientesPendientes, setPacientesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Asumiendo que estos endpoints existen o serán creados
        const resSinTriage = await axios.get('/api/dashboard/enfermeria/espera-sin-triage', { headers });
        const resAlertas = await axios.get('/api/dashboard/enfermeria/alertas-signos-vitales', { headers });
        const resTriagePendiente = await axios.get('/api/dashboard/enfermeria/triage-por-realizar', { headers });
        const resPacientesPendientes = await axios.get('/api/atencion-paciente-estado/espera-triage', { headers });

        setStats({
          pacientesSinTriage: resSinTriage.data.count || 0,
          alertasSignosVitales: resAlertas.data.count || 0,
          triagePorRealizar: resTriagePendiente.data.count || 0,
        });
        setPacientesPendientes(resPacientesPendientes.data || []);

      } catch (error) {
        console.error("Error al cargar datos del dashboard de enfermería:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-lg font-medium text-gray-600">Pacientes en Sala de Espera sin Triage</h2>
        <p className="text-6xl font-bold text-blue-600 my-2">{loading ? '...' : stats.pacientesSinTriage}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Alertas de Signos Vitales</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.alertasSignosVitales}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Triage por realizar</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.triagePorRealizar}</p>
          </div>
        </div>
      </div>

      {/* Acceso Rápido */}
      <Link to="/lista-espera" className="w-full bg-blue-600 text-white font-bold text-lg py-6 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg">
        Nuevo Triage
      </Link>

      {/* Lista de Pacientes Pendientes */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pacientes Pendientes de Clasificación</h3>
        {loading ? (
          <p className="text-center text-gray-500">Cargando pacientes...</p>
        ) : pacientesPendientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo de Espera</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pacientesPendientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paciente.nombre_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.cedula}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.tiempo_espera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No hay pacientes pendientes de clasificación.</p>
        )}
      </div>
    </div>
  );
}
