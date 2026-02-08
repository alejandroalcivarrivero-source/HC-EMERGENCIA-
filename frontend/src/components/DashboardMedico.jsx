import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, CheckCircle, FileText } from 'lucide-react';

export default function DashboardMedico() {
  const [stats, setStats] = useState({
    pacientesEnEspera: 0,
    atencionesAbiertas: 0,
    porFirmar: 0,
  });
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Endpoint unificado para estadísticas del médico
        const resStats = await axios.get('/api/dashboard/medico/stats', { headers });
        setStats({
          pacientesEnEspera: resStats.data.pacientesEnEspera || 0,
          atencionesAbiertas: resStats.data.atencionesAbiertas || 0,
          porFirmar: resStats.data.porFirmar || 0,
        });

        // Endpoint para la lista de atenciones en curso
        const resAtenciones = await axios.get('/api/dashboard/medico/atenciones-en-curso', { headers });
        setAtenciones(resAtenciones.data.atenciones || []);

      } catch (error) {
        console.error("Error al cargar datos del dashboard de médico:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleContinuarAtencion = (atencionId) => {
    navigate(`/atencion-emergencia-page/${atencionId}`);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
            <User className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pacientes en Espera</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.pacientesEnEspera}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Atenciones Abiertas</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.atencionesAbiertas}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Por Firmar</p>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.porFirmar}</p>
          </div>
        </div>
      </div>

      {/* Lista de Trabajo: Atenciones en Curso */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Atenciones en Curso</h3>
        {loading ? (
            <p className="text-center text-gray-500">Cargando atenciones...</p>
        ) : atenciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Triage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {atenciones.map((atencion) => (
                  <tr key={atencion.atencionId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{atencion.nombre_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{atencion.triage_definitivo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleContinuarAtencion(atencion.atencionId)} className="text-indigo-600 hover:text-indigo-900">
                        Continuar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
            <p className="text-center text-gray-500 py-4">No tiene atenciones en curso.</p>
        )}
      </div>
    </div>
  );
}
