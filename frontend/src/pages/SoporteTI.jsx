import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import Header from '../components/Header';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { validarPasswordEstricto } from '../utils/validaciones'; // Importar la función de validación
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
  Settings,
  Mail,
  Shield,
  Clock,
  AlertTriangle,
  Eye, EyeOff
} from 'lucide-react';
import AdminVideos from './AdminVideos';

export default function SoporteTI({ initialTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Nuevas pestañas principales: 'sistema', 'estadisticas', 'seguridad'
    // Mapeo de initialTab a estas nuevas categorías
    if (initialTab === 'users' || initialTab === 'audit' || initialTab === 'videos' || initialTab === 'email_logs') return 'seguridad';
    return 'sistema';
  });
  // Sub-tabs para Seguridad
  const [securitySubTab, setSecuritySubTab] = useState(() => {
    if (initialTab === 'logs' || initialTab === 'email_logs') return 'email_logs';
    if (initialTab === 'users') return 'users';
    if (initialTab === 'audit') return 'audit';
    if (initialTab === 'videos') return 'videos';
    return 'users';
  });

  const [health, setHealth] = useState({
    database: 'LOADING',
    postfix: 'LOADING',
    system: {
        cpu: 0,
        memory: { total: 0, used: 0, free: 0, percentage: 0 },
        disk: { total: 0, used: 0, free: 0, percentage: 0 }
    }
  });
  const [serverLogs, setServerLogs] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [stats, setStats] = useState({ totalUsuarios: 0, totalLogs: 0, totalPacientes: 0, ultimoIntentoFallido: null });
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    userId: null,
    title: '',
    message: '',
    showInput: false,
    showOtp: false,
    otpValue: '',
    token_otp: null
  });

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
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'seguridad') {
        if (securitySubTab === 'users') fetchUsuarios(searchUser);
        if (securitySubTab === 'audit') fetchAudit();
    }
    if (activeTab === 'sistema') {
        fetchServerLogs();
    }
  }, [activeTab, securitySubTab]);

  useEffect(() => {
      if (initialTab) {
        if (['users', 'audit', 'videos', 'logs', 'email_logs'].includes(initialTab)) {
          setActiveTab('seguridad');
          setSecuritySubTab((initialTab === 'logs' || initialTab === 'email_logs') ? 'email_logs' : initialTab);
        } else {
          setActiveTab('sistema');
        }
      }
    }, [initialTab]);
  
    const fetchUsuarios = useCallback(async (search = '') => {
      setLoading(true);
      try {
          const [resUsers, resRoles] = await Promise.all([
              axios.get(`/api/usuarios-admin?search=${search}`),
              axios.get('/usuarios/roles')
          ]);
          setUsuarios(resUsers.data);
          setRoles(resRoles.data);
      } catch (error) {
          console.error('Error fetching users/roles', error);
      } finally {
          setLoading(false);
      }
  }, []);
  
    useEffect(() => {
      const handler = setTimeout(() => {
          if (activeTab === 'seguridad' && securitySubTab === 'users') {
              fetchUsuarios(searchUser);
          }
      }, 500); // Debounce de 500ms
  
      return () => {
          clearTimeout(handler);
      };
  }, [searchUser, activeTab, securitySubTab]);

  const fetchHealth = async () => {
    try {
      const res = await axios.get('/api/soporte/health-check');
      setHealth(res.data);
    } catch (error) {
      setHealth({
          database: 'FAIL',
          postfix: 'FAIL',
          system: {
            cpu: 0,
            memory: { total: 0, used: 0, free: 0, percentage: 0 },
            disk: { total: 0, used: 0, free: 0, percentage: 0 }
        }
       });
    }
  };

  const fetchServerLogs = async () => {
      try {
          const res = await axios.get('/api/soporte/logs-server');
          setServerLogs(res.data.logs || []);
      } catch (error) {
          console.error('Error fetching server logs', error);
      }
  };

  const handleManualBackup = async () => {
      if(!window.confirm('¿Está seguro de iniciar un respaldo manual de la base de datos?')) return;
      
      setLoading(true);
      try {
          const res = await axios.post('/api/soporte/manual-backup');
          setBackupStatus({ type: 'success', message: `Backup creado: ${res.data.archivo}` });
          setTimeout(() => setBackupStatus(null), 5000);
      } catch (error) {
          setBackupStatus({ type: 'error', message: 'Error al crear backup' });
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

  const handleResetPassword = (userId) => {
    setModalConfig({
      isOpen: true,
      userId,
      title: 'Cambiar Contraseña',
      message: 'Para cambiar la contraseña, primero debe solicitar un código OTP que será enviado al correo del usuario.',
      showInput: false,
      showOtp: false,
      otpValue: '',
      token_otp: null,
      actionType: 'REQUEST_OTP',
      newPasswordValue: '', // Nuevo estado para la nueva contraseña
      confirmPasswordValue: '', // Nuevo estado para confirmar contraseña
      newPasswordError: null, // Nuevo estado para errores de validación de nueva contraseña
      confirmPasswordError: null // Nuevo estado para errores de confirmación de contraseña
    });
  };

  const confirmResetPassword = async (inputValue) => {
    // Si la acción es solicitar OTP
    if (modalConfig.actionType === 'REQUEST_OTP') {
      try {
        setLoading(true);
        // Solicitar el OTP primero
        const user = usuarios.find(u => u.id === modalConfig.userId);
        if (!user) {
          alert('Error: No se pudo encontrar la información del usuario.');
          return;
        }
        const res = await axios.post('/usuarios/solicitar-otp-cambio-clave', { cedula: user.cedula, tipoCorreo: 'correo' });
        
        // Si tiene éxito, cambiar el estado del modal para pedir OTP y contraseña
        // Es crucial mantener el modal abierto y solo actualizar su configuración
        setModalConfig(prev => ({
          ...prev,
          isOpen: true, // Asegurar que se mantenga abierto
          title: 'Validar Código OTP y Establecer Nueva Contraseña',
          message: 'Ingrese el código de 6 dígitos enviado al correo y establezca la nueva contraseña.',
          showInput: true,
          inputPlaceholder: 'Nueva Contraseña',
          inputType: 'password',
          minLength: 8, // Mínimo 8 caracteres
          showOtp: true,
          actionType: 'RESET_PASSWORD',
          confirmText: 'Actualizar Contraseña',
          passwordValidator: validarPasswordEstricto, // Pasa la función de validación
          showConfirmInput: true, // Mostrar campo de confirmación
          confirmInputPlaceholder: 'Confirmar Nueva Contraseña',
          token_otp: res.data.token_otp
        }));
        
      } catch (error) {
        // Manejar error de solicitud de OTP
        console.error('Error solicitando OTP:', error);
        alert(error.response?.data?.mensaje || 'Error al solicitar OTP. Por favor verifique los logs del servidor.');
        // No cerramos el modal para permitir reintentar o cancelar manualmente
      } finally {
        setLoading(false);
      }
    } else if (modalConfig.actionType === 'RESET_PASSWORD') {
      const newPasswordError = validarPasswordEstricto(modalConfig.newPasswordValue); // Validar la nueva contraseña
      if (newPasswordError) {
        alert(newPasswordError);
        return; // Detener ejecución, modal sigue abierto
      }
      if (modalConfig.newPasswordValue !== modalConfig.confirmPasswordValue) {
        alert('Las contraseñas no coinciden.');
        return; // Detener ejecución, modal sigue abierto
      }

      try {
        await axios.post(`/api/usuarios-admin/reset-password/${modalConfig.userId}`, {
          nuevaContrasena: modalConfig.newPasswordValue,
          otp: modalConfig.otpValue,
          token_otp: modalConfig.token_otp
        });
        alert('Contraseña actualizada correctamente.');
        fetchUsuarios();
        // Cerrar modal solo en éxito absoluto
         setModalConfig(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        const msg = error.response?.data?.mensaje || 'Error al actualizar contraseña';
        if (msg.toLowerCase().includes('expirado')) {
          alert('Código expirado. Por favor solicite uno nuevo iniciando el proceso nuevamente.');
          // Opcional: Podríamos devolver el modal al estado REQUEST_OTP
        } else {
          alert(msg);
        }
        // No cerramos el modal para permitir corrección de OTP o contraseña
      }
    }
  };

  const handleEditEmail = (user) => {
    setModalConfig({
      isOpen: true,
      userId: user.id,
      title: 'Editar Correo Electrónico',
      message: `Ingrese el nuevo correo electrónico para ${user.nombres} ${user.apellidos}.`,
      showInput: true,
      inputPlaceholder: 'nuevo@correo.com',
      inputType: 'email',
      defaultValue: user.correo,
      actionType: 'EDIT_EMAIL'
    });
  };

  const confirmEditEmail = async (nuevoCorreo) => {
    try {
      await axios.put(`/api/usuarios-admin/editar-correo/${modalConfig.userId}`, { correo: nuevoCorreo });
      alert('Correo electrónico actualizado correctamente.');
      fetchUsuarios();
    } catch (error) {
      alert('Error al actualizar el correo: ' + (error.response?.data?.mensaje || error.message));
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

 const filteredUsers = usuarios.filter(user => {
   if (!searchUser) return true;
 
   const searchTerm = searchUser.toLowerCase();
   const isNumericSearch = !isNaN(searchTerm) && searchTerm.trim() !== '';
 
   if (isNumericSearch) {
     return (user.cedula || '').includes(searchTerm);
   }
 
   return (
     (user.nombres || '').toLowerCase().includes(searchTerm) ||
     (user.apellidos || '').toLowerCase().includes(searchTerm) ||
     (user.username || '').toLowerCase().includes(searchTerm) ||
     (user.cedula || '').toLowerCase().includes(searchTerm)
   );
 });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Panel de Soporte TI - SIGEMECH" />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Main Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-2">
            <nav className="-mb-px flex space-x-8">
                {[
                    { id: 'sistema', name: 'Salud del Sistema', icon: Server },
                    { id: 'estadisticas', name: 'Producción Estadística', icon: Activity }, // TODO: Implementar en Fase 2
                    { id: 'seguridad', name: 'Seguridad y Accesos', icon: ShieldCheck },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content Area */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 overflow-hidden min-h-[500px]">
            
            {/* 1. SALUD DEL SISTEMA */}
            {activeTab === 'sistema' && (
                <div className="p-6 space-y-8">
                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Database Status */}
                        <div className={`p-4 rounded-xl border ${health.database === 'OK' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">Base de Datos</h3>
                                {health.database === 'OK' ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-red-600"/>}
                            </div>
                            <p className={`text-xl font-bold ${health.database === 'OK' ? 'text-green-700' : 'text-red-700'}`}>
                                {health.database === 'OK' ? 'ONLINE' : 'OFFLINE'}
                            </p>
                        </div>

                         {/* Postfix Status */}
                         <div className={`p-4 rounded-xl border ${health.postfix === 'OK' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">Servidor de Correo</h3>
                                {health.postfix === 'OK' ? <CheckCircle className="h-5 w-5 text-green-600"/> : <XCircle className="h-5 w-5 text-red-600"/>}
                            </div>
                            <p className={`text-xl font-bold ${health.postfix === 'OK' ? 'text-green-700' : 'text-red-700'}`}>
                                {health.postfix === 'OK' ? 'ONLINE' : 'OFFLINE'}
                            </p>
                        </div>

                        {/* CPU Usage */}
                         <div className="p-4 rounded-xl border bg-gray-50 border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">CPU Server</h3>
                                <Activity className="h-5 w-5 text-blue-600"/>
                            </div>
                            <p className="text-xl font-bold text-gray-800">
                                {health.system?.cpu || 0}%
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${health.system?.cpu || 0}%` }}></div>
                            </div>
                        </div>

                        {/* RAM Usage */}
                        <div className="p-4 rounded-xl border bg-gray-50 border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">Memoria RAM</h3>
                                <Server className="h-5 w-5 text-indigo-600"/>
                            </div>
                            <p className="text-xl font-bold text-gray-800">
                                {health.system?.memory?.percentage || 0}%
                            </p>
                            <p className="text-xs text-gray-500">{health.system?.memory?.used?.toFixed(0)} MB / {health.system?.memory?.total?.toFixed(0)} MB</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${health.system?.memory?.percentage || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Disk Usage & Backup */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Almacenamiento (Disco Principal)</h3>
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                            En Uso
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                            {health.system?.disk?.percentage || 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                                    <div style={{ width: `${health.system?.disk?.percentage || 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <p>Total: {health.system?.disk?.total || 0} GB</p>
                                    <p>Usado: {health.system?.disk?.used || 0} GB</p>
                                    <p>Libre: {health.system?.disk?.free || 0} GB</p>
                                </div>
                            </div>

                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Respaldo Manual</h3>
                                <button
                                    onClick={handleManualBackup}
                                    disabled={loading}
                                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <ShieldCheck className="mr-2 h-5 w-5" />
                                    {loading ? 'Generando Backup...' : 'Iniciar Backup BD Ahora'}
                                </button>
                                {backupStatus && (
                                    <div className={`mt-2 p-2 rounded text-xs ${backupStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {backupStatus.message}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Server Logs */}
                        <div className="md:col-span-2 bg-gray-900 rounded-xl shadow-inner p-4 text-green-400 font-mono text-xs overflow-y-auto h-96">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                                <span className="font-bold">Server Logs (Últimas 100 líneas)</span>
                                <button onClick={fetchServerLogs} className="hover:text-white"><RefreshCw className="h-4 w-4"/></button>
                            </div>
                            <div className="space-y-1">
                                {serverLogs.length > 0 ? (
                                    serverLogs.map((line, idx) => (
                                        <div key={idx} className="break-all hover:bg-gray-800 px-1 rounded">
                                            <span className="text-gray-500 select-none mr-2">[{idx + 1}]</span>
                                            {line}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 italic">No hay logs disponibles o no se pudieron leer.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PRODUCCIÓN ESTADÍSTICA (Placeholder) */}
            {activeTab === 'estadisticas' && (
                <div className="p-10 text-center">
                   <div className="inline-block p-4 rounded-full bg-blue-50 mb-4">
                       <Activity className="h-12 w-12 text-blue-500" />
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900">Módulo de Estadísticas en Construcción</h2>
                   <p className="text-gray-500 mt-2">Este módulo estará disponible en la Fase 2 de la implementación.</p>
                </div>
            )}


            {/* 3. SEGURIDAD Y ACCESOS (Migrated content) */}
            {activeTab === 'seguridad' && (
                <div className="flex flex-col h-full">
                    {/* Sub-tabs Navigation */}
                    <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 flex space-x-4">
                         {[
                            { id: 'users', name: 'Gestión Usuarios', icon: Users },
                            { id: 'audit', name: 'Auditoría Accesos', icon: Shield },
                            { id: 'videos', name: 'Videos Tutoriales', icon: Video },
                            { id: 'email_logs', name: 'Logs Correos', icon: Mail },
                        ].map((subTab) => (
                            <button
                                key={subTab.id}
                                onClick={() => setSecuritySubTab(subTab.id)}
                                className={`
                                    px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors
                                    ${securitySubTab === subTab.id
                                        ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                                `}
                            >
                                <subTab.icon className="h-4 w-4 mr-1.5" />
                                {subTab.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-0">
                         {securitySubTab === 'users' && (
                            <div className="p-6">
                              <div className="mb-4 flex justify-between items-center">
                                <input
                                  type="text"
                                  placeholder="Buscar por nombre, cédula o username."
                                  className="px-4 py-2 border rounded-lg w-1/3"
                                  value={searchUser}
                                  onChange={(e) => setSearchUser(e.target.value)}
                                  autoComplete="off"
                                />
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase flex items-center">
                                        <Users className="h-4 w-4 mr-1" />
                                        Usuario
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
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
                                          <div className="text-sm text-gray-500">{user.correo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{user.cedula}</div>
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
                                            onClick={() => handleEditEmail(user)}
                                            className="text-indigo-600 hover:text-indigo-900 p-1"
                                            title="Editar Correo Electrónico"
                                          >
                                            <Mail className="h-5 w-5" />
                                          </button>
                                          <button
                                            onClick={() => handleResetPassword(user.id)}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="Cambiar/Resetear Contraseña"
                                          >
                                            <Key className="h-5 w-5" />
                                          </button>
                                          <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`${user.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} p-1`}
                                            title={user.activo ? 'Inactivar/Bloquear Usuario (Rojo)' : 'Reactivar Usuario (Verde)'}
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

                          {securitySubTab === 'audit' && (
                            <div className="p-6">
                              <h3 className="text-lg font-medium mb-4">Últimos Eventos de Validación (Cédulas)</h3>
                              <div className="grid grid-cols-1 gap-4">
                                {auditLogs.map((log, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                    <div className="flex items-center">
                                      <div className={`p-2 rounded-full mr-4 ${log.total_intentos > 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Activity className="h-6 w-6" />
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

                          {securitySubTab === 'videos' && (
                            <div className="p-0">
                              <AdminVideos hideHeader={true} />
                            </div>
                          )}

                          {securitySubTab === 'email_logs' && (
                            <EmailLogsTab />
                          )}
                    </div>
                </div>
            )}
        </div>
      </main>

      <ConfirmActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false, newPasswordError: null, confirmPasswordError: null })}
        onConfirm={modalConfig.actionType === 'EDIT_EMAIL' ? confirmEditEmail : confirmResetPassword}
        closeOnConfirm={modalConfig.actionType === 'EDIT_EMAIL' || (modalConfig.actionType === 'RESET_PASSWORD' && !modalConfig.newPasswordError && !modalConfig.confirmPasswordError && modalConfig.newPasswordValue === modalConfig.confirmPasswordValue && modalConfig.otpValue?.length === 6)}
        title={modalConfig.title}
        message={modalConfig.message}
        showInput={modalConfig.showInput}
        inputPlaceholder={modalConfig.inputPlaceholder}
        inputType={modalConfig.inputType}
        minLength={modalConfig.minLength}
        defaultValue={modalConfig.defaultValue}
        confirmText={modalConfig.confirmText || (modalConfig.actionType === 'REQUEST_OTP' ? 'Enviar Código al Correo' : 'Aceptar')}
        showOtp={modalConfig.showOtp}
        otpValue={modalConfig.otpValue}
        onOtpChange={(val) => setModalConfig(prev => ({ ...prev, otpValue: val }))}
        isOtpValid={modalConfig.otpValue?.length === 6}
        
        // Nuevas props para la nueva contraseña y su confirmación
        showConfirmInput={modalConfig.showConfirmInput}
        confirmInputPlaceholder={modalConfig.confirmInputPlaceholder}
        newPasswordValue={modalConfig.newPasswordValue}
        onNewPasswordChange={(val) => setModalConfig(prev => ({ ...prev, newPasswordValue: val, newPasswordError: validarPasswordEstricto(val) }))}
        confirmPasswordValue={modalConfig.confirmPasswordValue}
        onConfirmPasswordChange={(val) => setModalConfig(prev => ({
            ...prev,
            confirmPasswordValue: val,
            confirmPasswordError: prev.newPasswordValue !== val ? 'Las contraseñas no coinciden.' : null
        }))}
        newPasswordError={modalConfig.newPasswordError}
        confirmPasswordError={modalConfig.confirmPasswordError}
        passwordValidator={modalConfig.passwordValidator}
        showPasswordEye={true} // Mostrar los iconos de ojo para ver/ocultar contraseña
      />
    </div>
  );
}

function EmailLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/soporte/logs-correos');
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching email logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Historial de Envío de Correos</h3>
        <button
          onClick={fetchLogs}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.fecha).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.correo_destino}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.tipo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    log.estado === 'ENVIADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {log.estado}
                  </span>
                  {log.error_mensaje && (
                    <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={log.error_mensaje}>
                      {log.error_mensaje}
                    </p>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                  No se registran logs de correos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
