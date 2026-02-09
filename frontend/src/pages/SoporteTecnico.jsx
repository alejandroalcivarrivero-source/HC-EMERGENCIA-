import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Iconos temporales para evitar fallos si react-icons no está disponible
const FiMail = () => <span>[Mail]</span>;
const FiShield = () => <span>[Escudo]</span>;
const FiAlertTriangle = () => <span>[Alerta]</span>;
const FiCheckCircle = () => <span>[Check]</span>;
const FiXCircle = () => <span>[X]</span>;
const FiRefreshCw = ({ className }) => <span className={className}>[Refrescar]</span>;
const FiSend = () => <span>[Enviar]</span>;
const FiUser = () => <span>[Usuario]</span>;

const SoporteTecnico = () => {
    const [logsCorreos, setLogsCorreos] = useState([]);
    const [intentosCedula, setIntentosCedula] = useState([]);
    const [loading, setLoading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testStatus, setTestStatus] = useState({ loading: false, message: '', error: false });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [logsRes, intentosRes] = await Promise.all([
                axios.get(`${API_URL}/soporte/logs-correos`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/soporte/intentos-cedula`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setLogsCorreos(logsRes.data);
            setIntentosCedula(intentosRes.data);
        } catch (error) {
            console.error('Error al cargar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleTestEmail = async (e) => {
        e.preventDefault();
        if (!testEmail) return;

        setTestStatus({ loading: true, message: 'Enviando correo de prueba...', error: false });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/soporte/test-correo`, 
                { correo: testEmail }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTestStatus({ loading: false, message: res.data.mensaje, error: false });
            fetchLogs(); // Refrescar lista de logs
        } catch (error) {
            setTestStatus({ 
                loading: false, 
                message: error.response?.data?.mensaje || 'Error al enviar correo de prueba', 
                error: true 
            });
        }
    };

    if (loading && logsCorreos.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando Panel de Soporte...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FiShield className="text-blue-600" /> Panel de Soporte Técnico
                </h1>
                <button 
                    onClick={fetchLogs}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Actualizar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Test de Correo e Intentos Sospechosos */}
                <div className="space-y-6">
                    {/* Botón de Test */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <FiMail className="text-blue-500" /> Test de Servicio Postfix
                        </h2>
                        <form onSubmit={handleTestEmail} className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Correo de destino (Soporte)</label>
                                <input 
                                    type="email" 
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="ejemplo@mspz4.gob.ec"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={testStatus.loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                            >
                                <FiSend /> {testStatus.loading ? 'Enviando...' : 'Enviar Correo de Test'}
                            </button>
                        </form>
                        {testStatus.message && (
                            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${testStatus.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {testStatus.error ? <FiXCircle /> : <FiCheckCircle />}
                                {testStatus.message}
                            </div>
                        )}
                    </div>

                    {/* Contador de Intentos */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                            <FiAlertTriangle className="text-amber-500" /> Alertas de Seguridad (24h)
                        </h2>
                        <div className="overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-gray-600">Cédula</th>
                                        <th className="px-3 py-2 text-center text-gray-600">Fallos</th>
                                        <th className="px-3 py-2 text-right text-gray-600">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {intentosCedula.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-3 py-4 text-center text-gray-400">Sin alertas recientes</td>
                                        </tr>
                                    ) : (
                                        intentosCedula.map((intento, idx) => (
                                            <tr key={idx} className={parseInt(intento.total_intentos) > 5 ? 'bg-red-50' : ''}>
                                                <td className="px-3 py-2 font-medium flex items-center gap-1">
                                                    <FiUser className="text-gray-400" /> {intento.cedula}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`font-bold ${parseInt(intento.total_intentos) > 5 ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {intento.total_intentos}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs text-gray-500">
                                                    {new Date(intento.ultima_fecha).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Logs de Correos */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                                <FiMail className="text-blue-500" /> Registro de Envíos Recientes
                            </h2>
                        </div>
                        <div className="overflow-x-auto flex-grow">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-gray-600">Fecha</th>
                                        <th className="px-6 py-3 text-left text-gray-600">Destinatario</th>
                                        <th className="px-6 py-3 text-left text-gray-600">Tipo</th>
                                        <th className="px-6 py-3 text-center text-gray-600">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {logsCorreos.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">No hay registros de correos</td>
                                        </tr>
                                    ) : (
                                        logsCorreos.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                    {new Date(log.fecha).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700">
                                                    {log.correo_destino}
                                                    {log.cedula_asociada && (
                                                        <div className="text-[10px] text-gray-400 uppercase">CI: {log.cedula_asociada}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-600">
                                                        {log.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {log.estado === 'ENVIADO' ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                            <FiCheckCircle /> Enviado
                                                        </span>
                                                    ) : (
                                                        <span 
                                                            className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium cursor-help"
                                                            title={log.error_mensaje}
                                                        >
                                                            <FiXCircle /> Fallido
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoporteTecnico;
