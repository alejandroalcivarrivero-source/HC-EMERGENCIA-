import axios from 'axios';

// Configurar interceptores globales en la instancia por defecto de axios
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
        const errorMessage = data?.message || 'Token inválido o expirado.';
        
        console.warn('[Axios Interceptor] Token inválido o expirado. Limpiando sesión...');
        
        // Limpiar datos de sesión
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        
        // Solo redirigir si no estamos ya en la página de login
        if (window.location.pathname !== '/') {
          console.warn('[Axios Interceptor] Redirigiendo al login...');
          // Usar window.location.href para forzar recarga completa y limpiar estado
          window.location.href = '/';
        }
        
        // Retornar un error más descriptivo
        return Promise.reject(new Error(errorMessage));
      }
    }
    
    // Para otros errores, simplemente rechazar la promesa
    return Promise.reject(error);
  }
);

// Exportar axios por defecto (los componentes pueden seguir importándolo normalmente)
export default axios;
