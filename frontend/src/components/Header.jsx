import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, RefreshCw, FileCheck, FileEdit, Users, Settings, FileText, List, History, BarChart3, FileKey } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';

/** Solo operativo: uso clínico diario */
export const mainLinksMedico = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes en Espera', path: '/lista-espera', icon: Users },
  { name: 'Atenciones en Curso', path: '/atenciones-en-curso', icon: RefreshCw },
  { name: 'Bandeja de Pendientes', path: '/pendientes-firma', icon: FileCheck },
];

/** No operativo: agrupado en Ajustes */
export const ajustesLinksMedico = [
  { name: 'Firma Electrónica', path: '/ajustes/firma-electronica', icon: FileKey },
  { name: 'Historial', path: '/historial', icon: History },
  { name: 'Reportes', path: '/reportes', icon: BarChart3 },
];

export const quickAccessLinks = {
    3: [
      { name: 'Admisión', path: '/admision', icon: FileEdit },
      { name: 'Pacientes en Espera', path: '/lista-espera', icon: Users },
      { name: 'Gestión de Pacientes', path: '/signosvitales', icon: Users },
      { name: 'Mis Reportes', path: '/reportes', icon: BarChart3 },
    ],
    1: null,
    2: [
      { name: 'Pacientes en Espera', path: '/lista-espera', icon: Users },
      { name: 'Reportes', path: '/reportes', icon: BarChart3 }
    ],
    4: [{ name: 'Reportes', path: '/reportes', icon: BarChart3 }],
    5: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Gestión de Usuarios', path: '/admin/usuarios', icon: Users },
      { name: 'Videos', path: '/admin/videos', icon: FileText },
      { name: 'Reportes Globales', path: '/reportes', icon: BarChart3 },
    ],
  };

export default function Header() {
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userRoleId, setUserRoleId] = useState(null);
  const [ajustesOpen, setAjustesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  const roles = {
    1: 'Médico',
    2: 'Obstetriz',
    3: 'Enfermería',
    4: 'Estadístico',
    5: 'Administrador'
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.nombres && payload.apellidos) {
          setUserName(`${payload.nombres} ${payload.apellidos}`);
        } else if (payload.cedula) {
          setUserName(payload.cedula);
        }
        if (payload.rol_id) {
          const rid = parseInt(payload.rol_id, 10);
          setUserRole(roles[rid] || 'Desconocido');
          setUserRoleId(rid); // Guardar el rol_id como entero
        }
      } catch (error) {
        console.error('Error decodificando el token:', error);
        localStorage.removeItem('token');
        navigate('/');
      }
    }
    
    // Manejar clics fuera del menú desplegable y la barra lateral
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && event.target.id !== 'sidebar-toggle') {
        setIsSidebarOpen(false);
      }
    };


    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const cambiarContrasena = () => {
    navigate('/cambiar-contrasena'); // Navegar a la nueva ruta
    setDropdownOpen(false);
  };


  return (
    <>
      <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center shadow relative z-[3000]">
        <div className="flex items-center">
          {/* Botón para abrir/cerrar la barra lateral */}
          <button
            id="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 className="text-lg font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>Sistema de Gestión de Emergencias del Centro de Salud Chone</h1>
        </div>
        <div className="flex-grow flex justify-center items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
        </div>
        <div className="relative z-[3000]" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex flex-col items-end space-y-0 hover:underline focus:outline-none"
          >
            <span className="text-sm font-bold">{userName || 'Usuario'}</span>
            <span className="text-xs">{userRole}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-[3000]">
              <button
                onClick={cambiarContrasena}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Cambiar Contraseña
              </button>
              <button
                onClick={cerrarSesion}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Barra lateral */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="p-4" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Menú</h2>
          <nav>
            <ul className="space-y-0.5">
              {/* Menú para Médicos (1) y Obstetrices (2) */}
              {(userRoleId === 1 || userRoleId === 2) && (
                <>
                  {mainLinksMedico.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.name}>
                        <a
                          href={link.path}
                          className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-white/10 transition-colors text-white"
                          onClick={(e) => { e.preventDefault(); navigate(link.path); setIsSidebarOpen(false); }}
                        >
                          {Icon && <Icon className="w-5 h-5 text-gray-300 shrink-0" />}
                          <span className="font-medium text-sm">{link.name}</span>
                        </a>
                      </li>
                    );
                  })}
                  <li className="pt-3 mt-3 border-t border-gray-600">
                    <button
                      type="button"
                      onClick={() => setAjustesOpen(!ajustesOpen)}
                      className="flex items-center justify-between w-full py-2.5 px-4 rounded-xl hover:bg-white/10 transition-colors text-left"
                    >
                      <span className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="font-medium text-sm text-gray-400">Ajustes</span>
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${ajustesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {ajustesOpen && (
                      <ul className="mt-1 ml-4 pl-2 border-l-2 border-gray-600 space-y-0.5">
                        {ajustesLinksMedico.map((link) => {
                          const Icon = link.icon;
                          return (
                            <li key={link.name}>
                              <a
                                href={link.path}
                                className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/10 text-sm text-gray-400"
                                onClick={(e) => { e.preventDefault(); navigate(link.path); setIsSidebarOpen(false); }}
                              >
                                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                {link.name}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                </>
              )}

              {/* Menú para Administradores (5) - VISIBILIDAD FORZADA */}
              {userRoleId === 5 && quickAccessLinks[5] && quickAccessLinks[5].map((link, idx) => (
                 <li key={link.name}>
                   <a
                     href={link.path}
                     className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-white/10 transition-colors text-white"
                     onClick={(e) => { e.preventDefault(); navigate(link.path); setIsSidebarOpen(false); }}
                   >
                     {link.icon && <link.icon className="w-5 h-5 text-gray-300 shrink-0" />}
                     <span className="font-medium text-sm">{link.name}</span>
                   </a>
                 </li>
              ))}

              {/* Menú para Otros Roles (3, 4, etc.) excluyendo 1, 2 y 5 que ya fueron manejados */}
              {userRoleId && userRoleId !== 1 && userRoleId !== 2 && userRoleId !== 5 && quickAccessLinks[userRoleId] && quickAccessLinks[userRoleId].map((link, idx) => {
                if (link.separator) return <li key={`sep-${idx}`}><div className="my-2 border-t border-gray-600" /></li>;
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.path}
                      className="flex items-center gap-3 py-2.5 px-4 rounded-xl hover:bg-white/10 transition-colors text-white"
                      onClick={(e) => { e.preventDefault(); navigate(link.path); setIsSidebarOpen(false); }}
                    >
                      {Icon && <Icon className="w-5 h-5 text-gray-300 shrink-0" />}
                      <span className="font-medium text-sm">{link.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
