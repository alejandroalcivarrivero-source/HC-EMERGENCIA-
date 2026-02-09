import React, { useEffect, useRef } from 'react';

const NotificationModal = ({
  isOpen,
  onClose,
  title,
  message,
  severity = 'info', // 'error', 'warning', 'success', 'info'
  action = null,
  content = null
}) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const severityStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const styles = severityStyles[severity] || severityStyles.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div 
        className={`relative w-full max-w-md p-6 ${styles.bg} border-t-4 ${styles.border} rounded-xl shadow-2xl transform transition-all animate-scale-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-bold ${styles.text}`}>
              {title}
            </h3>
            <div className="mt-2">
              {message && (
                <p className="text-sm text-gray-600">
                  {message}
                </p>
              )}
              {content && (
                <div className="mt-3">
                  {content}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <div className="flex gap-2">
            {action?.secondaryLabel && (
              <button
                type="button"
                onClick={() => {
                  action.secondaryOnClick();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors"
              >
                {action.secondaryLabel}
              </button>
            )}
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors ${styles.button}`}
              >
                {action.label}
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${action ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'text-white ' + styles.button} text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 transition-colors`}
            >
              {action ? 'Cerrar' : 'Aceptar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
