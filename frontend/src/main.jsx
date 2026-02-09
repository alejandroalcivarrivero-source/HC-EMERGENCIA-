import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './config/axios'; // Importar configuración de axios ANTES de App para que los interceptores estén activos
import App from './App';
import './index.css';
import { SidebarProvider } from './contexts/SidebarContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AxiosInterceptor from './AxiosInterceptor';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AxiosInterceptor>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </AxiosInterceptor>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
