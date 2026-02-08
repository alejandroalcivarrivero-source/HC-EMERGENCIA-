import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock } from 'lucide-react';

const ColaAdmisionTriage = () => {
    const [pacientes, setPacientes] = useState([]);

    useEffect(() => {
        const fetchPacientes = async () => {
            try {
                // NOTE: The backend API URL will need to be updated.
                const response = await axios.get('/api/dashboard/cola-admision', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setPacientes(response.data);
            } catch (error) {
                console.error("Error fetching admission queue:", error);
            }
        };

        fetchPacientes();
        const interval = setInterval(fetchPacientes, 60000); // Actualizar cada minuto

        return () => clearInterval(interval);
    }, []);

    const calcularTiempoEspera = (fechaAdmision) => {
        const ahora = new Date();
        const admision = new Date(fechaAdmision);
        const diff = Math.abs(ahora - admision);
        return Math.floor(diff / (1000 * 60)); // minutos
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Cola de Admisión y Triage</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Paciente</th>
                            <th scope="col" className="px-6 py-3">Cédula</th>
                            <th scope="col" className="px-6 py-3">Hora Admisión</th>
                            <th scope="col" className="px-6 py-3">Tiempo de Espera</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pacientes.length > 0 ? (
                            pacientes.map((paciente) => {
                                const tiempoEspera = calcularTiempoEspera(paciente.fecha_creacion);
                                const alerta = tiempoEspera > 15;
                                return (
                                    <tr key={paciente.admision_id} className={`bg-white border-b ${alerta ? 'bg-red-50' : ''}`}>
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {paciente.nombres} {paciente.apellidos}
                                        </th>
                                        <td className="px-6 py-4">{paciente.cedula}</td>
                                        <td className="px-6 py-4">{new Date(paciente.fecha_creacion).toLocaleTimeString()}</td>
                                        <td className={`px-6 py-4 font-bold ${alerta ? 'text-red-600' : 'text-gray-800'}`}>
                                            <div className="flex items-center gap-2">
                                                <Clock className={`w-4 h-4 ${alerta ? 'animate-pulse' : ''}`} />
                                                {tiempoEspera} minutos
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center">No hay pacientes en la cola de admisión.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ColaAdmisionTriage;