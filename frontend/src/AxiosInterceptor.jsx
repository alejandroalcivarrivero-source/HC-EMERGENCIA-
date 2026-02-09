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
            // Si el error viene de un intento de login (ruta /api/auth/login o similar)
            // O si es una expiración de token
            const isLoginRequest = error.config.url.includes('/login');
            
            if (isLoginRequest) {
              showError(
                'Acceso Denegado',
                'Credenciales inválidas o usuario no autorizado. Si el problema persiste contacte a soporte técnico.',
                {
                  label: 'Recuperar por firma .p12',
                  onClick: () => window.location.href = '/recuperar',
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
            } else {
              // Sesión expirada durante el uso de la app
              clearSession();
              showError(
                'Sesión Expirada o No Autorizada',
                'Su sesión ha finalizado o no tiene permisos para esta acción. Por favor contacte a los administradores.',
                {
                  label: 'Ir al Login',
                  onClick: () => window.location.href = '/',
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
          }

          // Error 500 o fallos de servidor
          if (status >= 500) {
            showError(
              'Error Crítico del Sistema',
              'Se ha detectado un fallo interno en el servidor o base de datos. Contacte de inmediato a los administradores.',
              {
                label: 'Cerrar',
                onClick: () => {},
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
