import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";

const API_URL = '/api/stats/kpis';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

const TRIAGE_COLORS = {
    Rojo: 'bg-red-500 text-white',
    Naranja: 'bg-orange-500 text-white',
    Amarillo: 'bg-yellow-500 text-gray-900',
    Verde: 'bg-green-500 text-white',
    Azul: 'bg-blue-500 text-white',
};

const DashboardStats = ({ rolId }) => {
    const [statsData, setStatsData] = useState({
        totalAtencionesHoy: 0,
        alertaSistolicaAlta: 0,
        triageCounts: { Rojo: 0, Naranja: 0, Amarillo: 0, Verde: 0, Azul: 0 },
        produccionPorMedico: [],
        lastUpdated: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async (manualRefresh = false) => {
        if (!manualRefresh) {
            setLoading(true);
            setError(null);
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const text = await response.text();
                console.log('Respuesta cruda:', text);
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Error al parsear JSON:', jsonError);
                const text = await response.text();
                console.log('Respuesta cruda:', text);
                throw new Error('La respuesta del servidor no es un JSON válido.');
            }
            const { data } = result;
            
            const validatedData = {
                totalAtencionesHoy: data.produccionMedica?.reduce((acc, curr) => acc + parseInt(curr.total), 0) || 0,
                alertaSistolicaAlta: data.alertas_hipertension || 0,
                triageCounts: {
                    Rojo: data.distribucionTriage?.find(t => t.prioridad_triage === 'Rojo')?.count || 0,
                    Naranja: data.distribucionTriage?.find(t => t.prioridad_triage === 'Naranja')?.count || 0,
                    Amarillo: data.distribucionTriage?.find(t => t.prioridad_triage === 'Amarillo')?.count || 0,
                    Verde: data.distribucionTriage?.find(t => t.prioridad_triage === 'Verde')?.count || 0,
                    Azul: data.distribucionTriage?.find(t => t.prioridad_triage === 'Azul')?.count || 0,
                },
                produccionPorMedico: data.produccionMedica || [],
                lastUpdated: new Date().toISOString(),
            };

            setStatsData(validatedData);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
            setError("Error de conexión: Verifique su sesión o el estado del servidor.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const intervalId = setInterval(() => fetchStats(false), REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [fetchStats]);

    const { totalAtencionesHoy, alertaSistolicaAlta, triageCounts, produccionPorMedico, lastUpdated } = statsData;

    const getProductivityTitle = () => {
        if (rolId === 1) return 'Mi Producción Personal';
        if (rolId === 5) return 'Productividad del Staff Médico';
        return ''; // No title if table is hidden
    };

    const showTriage = rolId === 3 || rolId === 5;
    const showProductivity = rolId === 1 || rolId === 5;

    if (loading && !lastUpdated) {
        return (
            <div className="p-8 bg-white shadow-xl rounded-2xl animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-4 gap-6">
                    <div className="h-32 bg-gray-100 rounded-xl"></div>
                    <div className="h-32 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Indicadores de Gestión de Hoy</h2>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                        Sincronizado: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--'}
                    </span>
                    <button
                        onClick={() => fetchStats(true)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Actualizar ahora"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Atenciones Totales</p>
                    <p className="text-3xl font-black text-gray-800 mt-2">{totalAtencionesHoy}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alertas Hipertensión</p>
                    <p className="text-3xl font-black text-red-600 mt-2">{alertaSistolicaAlta}</p>
                </div>
            </div>

            {/* Triage Grid */}
            {/* Triage Grid */}
            {showTriage && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">Carga de Triage por Prioridad</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {Object.entries(triageCounts).map(([level, count]) => (
                            <div key={level} className={`${TRIAGE_COLORS[level]} p-4 rounded-xl shadow-sm text-center transform hover:scale-105 transition-transform`}>
                                <p className="text-[10px] font-black uppercase opacity-80">{level}</p>
                                <p className="text-2xl font-bold">{count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Doctor Productivity Table */}
            {showProductivity && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase">{getProductivityTitle()}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-4">Profesional</th>
                                    <th className="px-6 py-4 text-right">Atenciones (008)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {produccionPorMedico.length > 0 ? produccionPorMedico.map((medico, i) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">ID Usuario: {medico.usuarioId}</td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">{medico.total}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="px-6 py-8 text-center text-gray-400 text-sm">Sin actividad registrada hoy</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardStats;