import React, { useEffect } from 'react';
import axios from 'axios';
import { useNotification } from './contexts/NotificationContext';
import { clearSession } from './utils/authUtils';

const AxiosInterceptor = ({ children }) => {
  const { showError } = useNotification();

  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status } = error.response;

          // Error 401: Credenciales inválidas o Sesión expirada
          if (status === 401 || status === 403) {
            // Limpieza inmediata del token y datos de sesión para evitar bucles o estados inconsistentes
            clearSession();
            localStorage.clear();

            // Si el error viene de un intento de login (ruta /api/auth/login o similar)
            const isLoginRequest = error.config.url.includes('/login');
            
            if (isLoginRequest) {
              // No hacemos nada aquí, dejamos que el componente Login maneje el error
            } else {
              // Sesión expirada durante el uso de la app
              // El modal persiste hasta que el usuario hace click en la acción
              showError(
                'Sesión Expirada',
                'Su sesión ha caducado por seguridad. Debe iniciar sesión nuevamente para continuar.',
                {
                  label: 'Ir al Login',
                  onClick: () => {
                    // La redirección ocurre SOLO cuando el usuario confirma
                    window.location.href = '/';
                  }
                }
              );
            }
          }

        // Error 500 o fallos de servidor
        if (status >= 500) {
          showError(
            'Error Crítico del Sistema',
            'Se ha detectado un fallo interno en el servidor o base de datos. Contacte de inmediato a los administradores.',
            {
              label: 'Cerrar',
              onClick: () => {}, // No hace nada, solo cierra el modal (acción por defecto)
              persistent: true, // Custom flag, aunque NotificationModal lo hace por defecto con nuestros cambios
              content: (
                <div className="text-left bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                  <p className="font-bold text-gray-800 mb-2">Administradores Responsables:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Sergio Solorzano: <span className="font-mono">0983369608</span></li>
                    <li>• Alejandro Alcivar: <span className="font-mono">0986382910</span></li>
                  </ul>
                </div>
              )
            }
          );
        }
        } else if (error.request) {
          // Error de Red (sin respuesta del servidor)
          showError(
            'Error de Conexión',
            'No se pudo establecer conexión con el servidor. Verifique su internet.',
            {
              label: 'Reintentar',
              onClick: () => window.location.reload(),
              content: (
                <div className="text-left bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                  <p className="font-bold text-gray-800 mb-2">Administradores de Sistema:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Sergio Solorzano: <span className="font-mono">0983369608</span></li>
                    <li>• Alejandro Alcivar: <span className="font-mono">0986382910</span></li>
                  </ul>
                </div>
              )
            }
          );
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [showError]);

  return children;
};

export default AxiosInterceptor;
