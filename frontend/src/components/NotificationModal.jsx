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
      bg: 'bg-white/80',
      border: 'border-red-500',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      icon: (
        <div className="p-3 bg-red-100 rounded-full">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      )
    },
    warning: {
      bg: 'bg-white/80',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: (
        <div className="p-3 bg-yellow-100 rounded-full">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )
    },
    success: {
      bg: 'bg-white/80',
      border: 'border-green-500',
      text: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      icon: (
        <div className="p-3 bg-green-100 rounded-full">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    },
    info: {
      bg: 'bg-white/80',
      border: 'border-blue-500',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: (
        <div className="p-3 bg-blue-100 rounded-full">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    }
  };

  const styles = severityStyles[severity] || severityStyles.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-fade-in">
      <div 
        className={`relative w-full max-w-md p-8 ${styles.bg} border-t-8 ${styles.border} rounded-2xl shadow-2xl transform transition-all animate-scale-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {styles.icon}
          </div>
          <h3 className={`text-2xl font-extrabold ${styles.text} mb-2`}>
            {title}
          </h3>
          <div className="mt-2">
            {message && (
              <p className="text-gray-700 text-lg leading-relaxed">
                {message}
              </p>
            )}
            {content && (
              <div className="mt-4 w-full">
                {content}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`w-full px-6 py-3 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all ${styles.button}`}
            >
              {action.label}
            </button>
          )}
          {action?.secondaryLabel && (
            <button
              type="button"
              onClick={() => {
                action.secondaryOnClick();
                onClose();
              }}
              className="w-full px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 text-lg font-bold rounded-xl transition-all"
            >
              {action.secondaryLabel}
            </button>
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={`w-full px-6 py-3 ${action ? 'bg-transparent text-slate-500 hover:text-slate-700' : 'text-white ' + styles.button} text-lg font-bold rounded-xl transition-all`}
          >
            {action ? 'Cerrar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
