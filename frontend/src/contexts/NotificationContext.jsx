import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationModal from '../components/NotificationModal';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    severity: 'info',
    action: null,
    content: null
  });

  const showNotification = useCallback((config) => {
    setNotification({
      isOpen: true,
      title: config.title || 'Notificación',
      message: config.message || '',
      severity: config.severity || 'info',
      action: config.action || null,
      content: config.content || null
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showError = useCallback((title, message, action = null) => {
    showNotification({ title, message, severity: 'error', action });
  }, [showNotification]);

  const showSuccess = useCallback((title, message) => {
    showNotification({ title, message, severity: 'success' });
  }, [showNotification]);

  const showWarning = useCallback((title, message) => {
    showNotification({ title, message, severity: 'warning' });
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, showError, showSuccess, showWarning }}>
      {children}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        severity={notification.severity}
        action={notification.action}
        content={notification.content}
      />
    </NotificationContext.Provider>
  );
};
