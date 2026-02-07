import axios from 'axios';
import { clearSession } from '../utils/authUtils'; // Importamos la función de limpieza

// Interceptor de solicitudes: agregar token automáticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[Axios Interceptor] Token agregado a la petición:', config.url);
    } else if (!token) {
      console.warn('[Axios Interceptor] No hay token disponible para la petición:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('[Axios Interceptor] Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas: manejar errores de autenticación
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el error es 401 (No autorizado) o 403 (Prohibido) relacionado con token
    if (error.response) {
      const { status, data } = error.response;
      
      console.log('[Axios Interceptor] Error recibido:', status, data);
      
      // 401: No autorizado (token faltante o inválido)
      // 403: Prohibido (token expirado o inválido)
      if (status === 401 || status === 403) {
        const errorMessage = data?.message || 'Sesión expirada. Por favor, inicie sesión de nuevo.';
        
        console.warn('[Axios Interceptor] Token inválido o expirado. Limpiando sesión...');
        
        // Limpiar datos de sesión usando la utilidad
        clearSession(); 
        
        // Solo redirigir si no estamos ya en la página de login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          console.warn('[Axios Interceptor] Redirigiendo al login...');
          // Usar window.location.href para forzar recarga completa y limpiar estado
          window.location.href = '/login';
        }
        
        // Retornar un error más descriptivo
        return Promise.reject({ ...error, message: errorMessage });
      }
    }
    
    // Para otros errores, simplemente rechazar la promesa
    return Promise.reject(error);
  }
);

// Exportar axios por defecto (los componentes pueden seguir importándolo normalmente)
export default axios;
