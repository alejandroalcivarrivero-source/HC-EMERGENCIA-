import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Clock, Activity, BarChart3, AlertCircle } from 'lucide-react';
import Header from '../Header';

export default function DashboardBI() {
  const [triajeStats, setTriajeStats] = useState([]);
  const [waitingTime, setWaitingTime] = useState(null);
  const [topDiagnosticos, setTopDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const [triajeRes, waitingRes, diagnosticosRes] = await Promise.all([
          axios.get('http://localhost:3001/api/bi/triaje-stats', config),
          axios.get('http://localhost:3001/api/bi/waiting-times', config),
          axios.get('http://localhost:3001/api/bi/top-diagnosticos', config)
        ]);

        setTriajeStats(triajeRes.data);
        setWaitingTime(waitingRes.data);
        setTopDiagnosticos(diagnosticosRes.data);
      } catch (err) {
        console.error('Error fetching BI data:', err);
        setError('Error al cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4 text-red-700">
                <AlertCircle className="w-8 h-8" />
                <p className="font-medium">{error}</p>
            </div>
        </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Panel de Control Administrativo
          </h1>
          <p className="text-gray-500">Indicadores clave de rendimiento y estadísticas de atención en tiempo real.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {waitingTime && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Tiempo Promedio de Espera</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-gray-900">{waitingTime.promedioMinutos}</h2>
                    <span className="text-sm font-medium text-gray-500">min</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{waitingTime.periodo}</p>
              </div>
            </div>
          )}
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Activity className="w-8 h-8 text-emerald-600" />
            </div>
             <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Total Atenciones (24h)</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {triajeStats.reduce((acc, curr) => acc + curr.cantidad, 0)}
                    </h2>
                    <span className="text-sm font-medium text-gray-500">pacientes</span>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart - Triaje Stats */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              Distribución por Clasificación de Triaje
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={triajeStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="cantidad"
                    nameKey="nivel"
                  >
                    {triajeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#374151', fontWeight: 500 }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-600 font-medium ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart - Top Diagnósticos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Top 10 Diagnósticos CIE-10
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDiagnosticos}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="codigo" 
                    width={50} 
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6', radius: 4 }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                        return (
                            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 max-w-xs">
                            <p className="font-bold text-gray-800 mb-1">{payload[0].payload.codigo}</p>
                            <p className="text-sm text-gray-600 mb-2">{payload[0].payload.descripcion}</p>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-md text-xs font-bold">
                                {payload[0].value} casos
                                </span>
                            </div>
                            </div>
                        );
                        }
                        return null;
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
