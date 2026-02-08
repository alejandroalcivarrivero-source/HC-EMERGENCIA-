import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';

const ConfiguracionModulos = ({ usuarioId }) => {
    const [modulos, setModulos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchModulos = async () => {
            try {
                const response = await axios.get(`/api/modulos/usuarios/${usuarioId}/modulos`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setModulos(response.data);
            } catch (err) {
                setError('Error al cargar los módulos.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (usuarioId) {
            fetchModulos();
        }
    }, [usuarioId]);

    const handleCheckboxChange = (modulo_id) => {
        setModulos(modulos.map(m =>
            m.modulo_id === modulo_id ? { ...m, activo: !m.activo } : m
        ));
    };

    const guardarCambios = async () => {
        try {
            await axios.put(`/api/modulos/usuarios/${usuarioId}/modulos`, { modulos }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            alert('Módulos actualizados con éxito.');
        } catch (err) {
            setError('Error al guardar los cambios.');
            console.error(err);
        }
    };

    if (loading) return <p>Cargando módulos...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Configuración de Módulos
            </h3>
            <div className="space-y-4">
                {modulos.map(modulo => (
                    <div key={modulo.modulo_id} className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">{modulo.nombre_modulo}</p>
                            <p className="text-sm text-gray-500">{modulo.descripcion}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={modulo.activo}
                                onChange={() => handleCheckboxChange(modulo.modulo_id)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                ))}
            </div>
            <div className="mt-6 text-right">
                <button
                    onClick={guardarCambios}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};

export default ConfiguracionModulos;