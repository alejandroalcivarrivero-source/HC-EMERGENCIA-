import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import Header from '../components/Header';
import {
  Server,
  Users,
  ShieldCheck,
  Video,
  CheckCircle,
  XCircle,
  Key,
  UserMinus,
  UserPlus,
  RefreshCw,
  Activity,
  Settings
} from 'lucide-react';
import AdminVideos from './AdminVideos';

export default function SoporteTI() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('infra');
  const [health, setHealth] = useState({ database: 'LOADING', postfix: 'LOADING' });
  const [stats, setStats] = useState({ totalUsuarios: 0, totalLogs: 0 });
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/soporte/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchData();
    if (activeTab === 'users') fetchUsuarios();
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab, fetchData]);

  useEffect(() => {
    // Sincronizar activeTab con la ruta actual si es necesario
    const path = location.pathname;
    if (path === '/admin/usuarios') setActiveTab('users');
    else if (path === '/admin/videos') setActiveTab('videos');
    else if (path === '/admin/logs') setActiveTab('audit');
  }, [location]);

  const fetchHealth = async () => {
    try {
      const res = await axios.get('/api/soporte/health-check');
      setHealth(res.data);
    } catch (error) {
      setHealth({ database: 'FAIL', postfix: 'FAIL' });
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const [resUsers, resRoles] = await Promise.all([
        axios.get('/api/usuarios-admin'),
        axios.get('/usuarios/roles')
      ]);
      setUsuarios(resUsers.data);
      setRoles(resRoles.data);
    } catch (error) {
      console.error('Error fetching users/roles', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/soporte/intentos-cedula');
      setAuditLogs(res.data);
    } catch (error) {
      console.error('Error fetching audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPass = prompt('Ingrese la nueva contraseña temporal:');
    if (!newPass) return;
    try {
      await axios.post(`/api/usuarios-admin/reset-password/${userId}`, { nuevaContrasena: newPass });
      alert('Contraseña actualizada');
    } catch (error) {
      alert('Error al actualizar contraseña');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await axios.put(`/api/usuarios-admin/status/${user.id}`, { activo: !user.activo });
      fetchUsuarios();
    } catch (error) {
      alert('Error al cambiar estado');
    }
  };

  const handleChangeRol = async (userId, rolId) => {
    try {
      await axios.put(`/api/usuarios-admin/cambiar-rol/${userId}`, { id_rol: rolId });
      fetchUsuarios();
    } catch (error) {
      alert('Error al cambiar rol');
    }
  };

  const filteredUsers = usuarios.filter(u => 
    u.nombres?.toLowerCase().includes(searchUser.toLowerCase()) || 
    u.apellidos?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Panel de Soporte TI - SIGEMECH" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard de Infraestructura (Always visible at top) */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Server className="h-6 w-6 mr-2 text-blue-600" />
            Estado de Infraestructura
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">MariaDB (Túnel/Local)</p>
                <p className="text-2xl font-bold text-gray-900">Base de Datos</p>
              </div>
              <div>
                {health.database === 'OK' ? (
                  <span className="flex items-center text-green-600 font-bold"><CheckCircle className="h-8 w-8 mr-1" /> ONLINE</span>
                ) : health.database === 'FAIL' ? (
                  <span className="flex items-center text-red-600 font-bold"><XCircle className="h-8 w-8 mr-1" /> OFFLINE</span>
                ) : (
                  <span className="animate-pulse text-gray-400">Verificando...</span>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Servidor Postfix</p>
                <p className="text-2xl font-bold text-gray-900">Servicio de Correo</p>
              </div>
              <div>
                {health.postfix === 'OK' ? (
                  <span className="flex items-center text-green-600 font-bold"><CheckCircle className="h-8 w-8 mr-1" /> ONLINE</span>
                ) : health.postfix === 'FAIL' ? (
                  <span className="flex items-center text-red-600 font-bold"><XCircle className="h-8 w-8 mr-1" /> OFFLINE</span>
                ) : (
                  <span className="animate-pulse text-gray-400">Verificando...</span>
                )}
              </div>
            </div>

            <button 
              onClick={() => { fetchHealth(); fetchData(); }}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-6 rounded-xl shadow-sm border border-blue-200 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`h-6 w-6 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </button>
          </div>
        </section>

        {/* Contadores Dinámicos */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg mr-4">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Usuarios Registrados</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsuarios}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg mr-4">
              <Activity className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Logs de Auditoría (24h)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLogs}</p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', name: 'Gestión de Usuarios', icon: Users, path: '/admin/usuarios' },
              { id: 'audit', name: 'Monitoreo de Logs', icon: Activity, path: '/admin/logs' },
              { id: 'videos', name: 'Gestión de Videos', icon: Video, path: '/admin/videos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate(tab.path);
                }}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === 'users' && (
            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nombre o username..." 
                  className="px-4 py-2 border rounded-lg w-1/3"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{user.nombres} {user.apellidos}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={user.id_rol} 
                            onChange={(e) => handleChangeRol(user.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            {roles.map(rol => (
                              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.activo ? 'Activo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => handleResetPassword(user.id)}
                            className="text-blue-600 hover:text-blue-900 p-1" 
                            title="Resetear Contraseña"
                          >
                            <Key className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`${user.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} p-1`}
                            title={user.activo ? 'Bloquear Usuario' : 'Activar Usuario'}
                          >
                            {user.activo ? <UserMinus className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Últimos Eventos de Validación (Cédulas)</h3>
              <div className="grid grid-cols-1 gap-4">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-4 ${log.total_intentos > 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Cédula: {log.cedula}</p>
                        <p className="text-sm text-gray-500">Total de intentos fallidos (24h): <span className="font-bold text-red-600">{log.total_intentos}</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Último Intento</p>
                      <p className="text-sm font-medium">{new Date(log.ultima_fecha).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-gray-500 text-center py-10">No se registran intentos fallidos en las últimas 24 horas.</p>}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="p-0">
              <AdminVideos hideHeader={true} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
