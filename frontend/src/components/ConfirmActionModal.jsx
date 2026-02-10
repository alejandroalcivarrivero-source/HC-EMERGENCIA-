import React, { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  showInput = false,
  inputPlaceholder = "Ingrese el valor...",
  inputType = "text",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  minLength = 0,
  showOtp = false,
  otpValue = '',
  onOtpChange = () => {},
  isOtpValid = true,
  closeOnConfirm = true
}) {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(!showInput);

  useEffect(() => {
    let valid = true;
    if (showInput) {
      valid = inputValue.trim().length >= minLength;
    }
    if (showOtp) {
      valid = valid && isOtpValid;
    }
    setIsValid(valid);
  }, [inputValue, showInput, minLength, showOtp, isOtpValid]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(showInput ? inputValue : true);
      
      if (closeOnConfirm) {
        setInputValue('');
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="relative w-full max-w-md mx-auto my-6 z-50">
        <div className="relative flex flex-col w-full bg-white border-0 rounded-xl shadow-lg outline-none focus:outline-none">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <ShieldAlert className="h-6 w-6 text-amber-500 mr-2" />
              {title}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-400 hover:text-gray-600 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Body */}
          <div className="relative p-6 flex-auto">
            <p className="my-4 text-gray-600 text-lg leading-relaxed">
              {message}
            </p>
            {showOtp && (
              <div className="mt-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Código OTP (6 dígitos)</label>
                <input
                  type="text"
                  maxLength={6}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center tracking-widest text-2xl font-bold ${
                    !isOtpValid && otpValue.length > 0 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="000000"
                  value={otpValue}
                  onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            )}
            {showInput && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{inputPlaceholder}</label>
                <input
                  type={inputType}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                    !isValid && inputValue.length > 0 ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={inputPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus={!showOtp}
                />
                {showInput && minLength > 0 && inputValue.length < minLength && (
                  <p className="mt-1 text-xs text-red-500">
                    Mínimo {minLength} caracteres ({inputValue.length}/{minLength})
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-solid border-gray-200 rounded-b space-x-3">
            <button
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 outline-none focus:outline-none ease-linear transition-all duration-150"
              type="button"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              className={`px-6 py-2 rounded-lg text-white font-bold text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 ${
                isValid 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow hover:shadow-lg' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              type="button"
              disabled={!isValid}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
