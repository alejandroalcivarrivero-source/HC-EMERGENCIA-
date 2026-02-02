import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { mainLinksMedico, quickAccessLinks } from '../components/Header';
import { FileText, Clock, User, Users, PenLine, ShieldAlert, BarChart3, Activity, Stethoscope, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [atencionesEnCurso, setAtencionesEnCurso] = useState([]);
  const [loadingAtenciones, setLoadingAtenciones] = useState(false);
  const [kpis, setKpis] = useState({ pacientesEnEspera: 0, atencionesAbiertas: 0, porFirmar: 0 });
  const [loadingKpis, setLoadingKpis] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/');

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsuario(payload);

      if (payload.rol_id === 1 || payload.rol_id === 5) {
        cargarAtencionesEnCurso();
        cargarKpis();
      }
    } catch {
      localStorage.removeItem('token');
      navigate('/');
    }
  }, [navigate]);

  const cargarKpis = async () => {
    setLoadingKpis(true);
    const token = localStorage.getItem('token');
    try {
      const [espera, enCurso, pendientes] = await Promise.all([
        axios.get('http://localhost:3001/api/atencion-paciente-estado/espera', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3001/api/pendientes-firma/en-curso', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3001/api/pendientes-firma', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setKpis({
        pacientesEnEspera: Array.isArray(espera.data) ? espera.data.length : 0,
        atencionesAbiertas: Array.isArray(enCurso.data) ? enCurso.data.length : 0,
        porFirmar: Array.isArray(pendientes.data) ? pendientes.data.length : 0,
      });
    } catch (e) {
      console.error('Error al cargar KPIs:', e);
    } finally {
      setLoadingKpis(false);
    }
  };

  const cargarAtencionesEnCurso = async () => {
    try {
      setLoadingAtenciones(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/pendientes-firma/en-curso', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAtencionesEnCurso(response.data);
    } catch (error) {
      console.error('Error al cargar atenciones en curso:', error);
    } finally {
      setLoadingAtenciones(false);
    }
  };

  const handleContinuarAtencion = (atencion) => {
    navigate(`/atencion-emergencia-page/${atencion.admisionId}`);
  };


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Header />
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard de Emergencia</h1>

          {usuario ? (
            <div>
              {/* Dashboard Administrativo (ID 5) */}
              {usuario.rol_id === 5 && (
                <div className="space-y-6">
                  {/* Tarjetas de Indicadores */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Usuarios Activos</p>
                        <p className="text-2xl font-bold text-gray-800">24</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Médicos en Turno</p>
                        <p className="text-2xl font-bold text-gray-800">8</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Atenciones Totales del Día</p>
                        <p className="text-2xl font-bold text-gray-800">45</p>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico Simple Distribución Triage */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Prioridad (Triage)</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-red-600 font-medium">Emergencia (Rojo)</span>
                          <span className="text-gray-600">12%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-orange-600 font-medium">Urgencia Mayor (Naranja)</span>
                          <span className="text-gray-600">28%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '28%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-yellow-600 font-medium">Urgencia Menor (Amarillo)</span>
                          <span className="text-gray-600">35%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-green-600 font-medium">No Urgente (Verde)</span>
                          <span className="text-gray-600">15%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-600 font-medium">Consulta (Azul)</span>
                          <span className="text-gray-600">10%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accesos Rápidos Admin */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                      to="/admin/usuarios"
                      className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-blue-600 font-semibold"
                    >
                      <Users className="w-5 h-5" />
                      Gestión de Usuarios
                    </Link>
                    <Link
                      to="/admin/usuarios" // Redirige a gestión, donde se aprueban
                      className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-amber-600 font-semibold"
                    >
                      <UserCheck className="w-5 h-5" />
                      Aprobar Usuarios Pendientes
                    </Link>
                    <Link
                      to="/reportes"
                      className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-emerald-600 font-semibold"
                    >
                      <BarChart3 className="w-5 h-5" />
                      Reportes Globales
                    </Link>
                  </div>
                </div>
              )}

              {/* KPIs Clínicos (Médicos y Otros) */}
              {(usuario.rol_id === 1 || usuario.rol_id === 2) && (
                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8`}>
                  <Link
                    to="/lista-espera?filtro=prioritarios"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pacientes en Espera</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {loadingKpis ? '—' : kpis.pacientesEnEspera}
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/atenciones-en-curso"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Atenciones Abiertas</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {loadingKpis ? '—' : kpis.atencionesAbiertas}
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/pendientes-firma"
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <PenLine className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Por Firmar</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {loadingKpis ? '—' : kpis.porFirmar}
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {/* Atenciones en Curso */}
              {(usuario.rol_id === 1 || usuario.rol_id === 2) && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
                      <Clock className="w-5 h-5 text-blue-600" />
                      Atenciones en Curso
                    </h2>
                    <Link
                      to="/atenciones-en-curso"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver todas →
                    </Link>
                  </div>
                  
                  {loadingAtenciones ? (
                    <div className="text-center py-8 text-gray-500">Cargando...</div>
                  ) : atencionesEnCurso.length === 0 ? (
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No hay atenciones en curso.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {atencionesEnCurso.slice(0, 5).map((atencion) => {
                        const paciente = atencion.Paciente;
                        const nombrePaciente = `${paciente.primer_nombre} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido} ${paciente.segundo_apellido || ''}`.trim();
                        const enCurso = !!atencion.id;
                        return (
                          <div
                            key={atencion.id || `adm-${atencion.admisionId}`}
                            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all flex items-center justify-between gap-4 ${enCurso ? 'border-l-4 border-l-blue-500' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-semibold text-gray-800">{nombrePaciente}</span>
                                {enCurso && (
                                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                    En curso
                                  </span>
                                )}
                                {(atencion.alertaNotificacion094 || atencion.requiereNotificacion094) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs font-medium">
                                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                                    Previsión 094
                                  </span>
                                )}
                                <span className="text-sm text-gray-500">CI: {paciente.numero_identificacion}</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                Última actualización: {format(new Date(atencion.updatedAt || atencion.createdAt), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleContinuarAtencion(atencion)}
                              className="shrink-0 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
                            >
                              Continuar atención
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h2 className="font-semibold text-gray-800 mb-3" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>Accesos rápidos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(usuario.rol_id === 1 ? mainLinksMedico : quickAccessLinks[usuario.rol_id])?.filter((l) => !l.separator).map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="flex flex-col items-center justify-center p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-center"
                        style={{ minHeight: '100px' }}
                      >
                        {Icon && <Icon className="w-8 h-8 mb-2 text-gray-500" />}
                        <span className="text-sm font-semibold text-gray-800 leading-tight">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-600">Cargando datos...</p></div>
          )}
        </div>
      </main>
    </div>
  );
}