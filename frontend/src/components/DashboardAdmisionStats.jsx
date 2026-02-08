import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserX } from 'lucide-react';

const DashboardAdmisionStats = () => {
    const [stats, setStats] = useState({ admitidosHoy: 0, pendientesTriage: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // NOTE: The backend API URL will need to be updated.
                const response = await axios.get('/api/dashboard/admision-stats', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching admission stats:", error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Pacientes Admitidos Hoy</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.admitidosHoy}</p>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Pendientes de Triage</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.pendientesTriage}</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmisionStats;