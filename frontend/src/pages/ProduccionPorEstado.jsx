import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProduccionPorEstado() {
  const [data, setData] = useState({
    kpis: { totalAtenciones: 0 },
    graficos: { flujoPorHora: [], produccionPorUsuario: [] },
    rango: { start: null, end: null }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('today'); // 'today', 'yesterday', 'week'

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      let params = {};
      const now = new Date();
      
      if (dateRange === 'today') {
        // Backend defaults to today if no params
      } else if (dateRange === 'yesterday') {
        const yesterday = subDays(now, 1);
        params.fechaInicio = format(yesterday, 'yyyy-MM-dd');
        params.fechaFin = format(yesterday, 'yyyy-MM-dd');
      } else if (dateRange === 'week') {
        const lastWeek = subDays(now, 7);
        params.fechaInicio = format(lastWeek, 'yyyy-MM-dd');
        params.fechaFin = format(now, 'yyyy-MM-dd');
      }

      const response = await axios.get('http://localhost:3001/api/estadistica/produccion-diaria', {
        headers: { 'Authorization': `Bearer ${token}` },
        params
      });

      setData(response.data);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('Error al cargar estadísticas. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tablero de Control de Producción</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">Filtro:</span>
            <select 
              value={dateRange} 
              onChange={handleRangeChange}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="week">Últimos 7 días</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
            <p className="font-bold text-red-700">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Atenciones</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{data.kpis.totalAtenciones}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="font-medium text-green-600">En rango seleccionado</span>
                </div>
              </div>

              {/* Placeholder for future KPIs */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">En Observación</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">--</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                 <div className="mt-4 text-sm text-gray-500">
                  <span className="font-medium">Datos en desarrollo</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Altas Médicas</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">--</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                 <div className="mt-4 text-sm text-gray-500">
                  <span className="font-medium">Datos en desarrollo</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hourly Flow Chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Flujo de Ingresos por Hora</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.graficos.flujoPorHora}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cantidad" name="Pacientes" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Production by User Chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Producción por Usuario (Top 10)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart
                      layout="vertical"
                      data={data.graficos.produccionPorUsuario ? data.graficos.produccionPorUsuario.slice(0, 10) : []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="usuario" type="category" width={150} tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_atenciones" name="Atenciones" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Detalle de Producción</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Atenciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.graficos.produccionPorUsuario && data.graficos.produccionPorUsuario.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.usuario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.total_atenciones}</td>
                      </tr>
                    ))}
                    {(!data.graficos.produccionPorUsuario || data.graficos.produccionPorUsuario.length === 0) && (
                       <tr>
                        <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">No hay datos disponibles para el rango seleccionado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
