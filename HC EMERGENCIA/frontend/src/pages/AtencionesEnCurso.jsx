import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { Clock, FileText, User } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Página de Atenciones en Curso (Persistencia)
 * Lista atenciones abiertas del médico para continuar donde dejó.
 */
export default function AtencionesEnCurso() {
  const [atenciones, setAtenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);
      if (payload.rol_id === 1 || payload.rol_id === 5) {
        cargarEnCurso();
      } else {
        setLoading(false);
      }
    } catch {
      localStorage.removeItem('token');
      navigate('/');
    }
  }, [navigate]);

  const cargarEnCurso = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3001/api/pendientes-firma/en-curso', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAtenciones(res.data);
    } catch (err) {
      console.error('Error al cargar atenciones en curso:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinuar = (a) => {
    navigate(`/atencion-emergencia-page/${a.admisionId}`);
  };

  if (!usuario) return null;
  if (usuario.rol_id !== 1 && usuario.rol_id !== 5) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="p-8 max-w-4xl mx-auto">
          <p className="text-gray-600">No tiene acceso a esta sección.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-7 h-7 text-blue-600" />
              Atenciones en Curso
            </h1>
            <Link
              to="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Volver al Dashboard
            </Link>
          </div>
          <p className="text-gray-600 mb-6">
            Continúe donde dejó. Las atenciones se guardan automáticamente.
          </p>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : atenciones.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <FileText className="w-14 h-14 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay atenciones en curso.</p>
              <Link
                to="/lista-espera"
                className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ir a Lista de Espera
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {atenciones.map((a) => {
                const p = a.Paciente;
                const nombre = p ? `${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}`.trim() : '—';
                return (
                  <div
                    key={a.id || `adm-${a.admisionId}`}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-800 block">{nombre}</span>
                          <span className="text-sm text-gray-500">
                            {p?.numero_identificacion && `CI: ${p.numero_identificacion} · `}
                            Última actualización: {format(new Date(a.updatedAt || a.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                          EN CURSO
                        </span>
                      </div>
                      <button
                        onClick={() => handleContinuar(a)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Continuar atención
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
