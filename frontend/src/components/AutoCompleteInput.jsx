import React, { useState, useEffect, useRef } from 'react';

const AutoCompleteInput = ({
  label,
  name,
  value,
  onChange,
  onSearch,
  suggestions,
  onSelect,
  disabled,
  required,
  displayKey,
  placeholder,
  onBlur
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false); // Para evitar que onBlur se ejecute cuando se hace click en una sugerencia
  const justSelected = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Solo cerrar si no se está haciendo click en una sugerencia o en el input
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) && !isSelecting) {
        console.log('[AutoCompleteInput] Click fuera, cerrando sugerencias');
        setShowSuggestions(false);
        // Ejecutar onBlur si existe y hay valor pero no hay selección
        if (onBlur && value && !isSelecting) {
          setTimeout(() => {
            onBlur();
          }, 200); // Pequeño delay para permitir que onSelect se ejecute primero
        }
      }
      setIsSelecting(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, onBlur, isSelecting]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    console.log('[AutoCompleteInput] handleInputChange - nuevo valor:', newValue);
    onChange(e);
    onSearch(newValue);
    // Mostrar sugerencias si hay texto
    if (newValue.length >= 2) {
      console.log('[AutoCompleteInput] Activando búsqueda y mostrando sugerencias');
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  };

  // Mostrar sugerencias cuando lleguen del backend
  useEffect(() => {
    console.log('[AutoCompleteInput] useEffect - suggestions:', suggestions.length, 'value:', value.length, 'showSuggestions:', showSuggestions);
    
    if (justSelected.current) {
      console.log('[AutoCompleteInput] Selección detectada, no abrir sugerencias');
      justSelected.current = false;
      setShowSuggestions(false);
      return;
    }

    if (value.length >= 2) {
      if (suggestions.length > 0) {
        console.log('[AutoCompleteInput] Mostrando sugerencias:', suggestions.length);
        setShowSuggestions(true);
      } else {
        // Mantener abierto para mostrar "No se encontraron resultados"
        console.log('[AutoCompleteInput] Sin sugerencias, pero manteniendo abierto para mostrar mensaje');
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions, value]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex !== -1 && suggestions[highlightedIndex]) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else if (suggestions.length === 1) {
        // Si solo hay una sugerencia, seleccionarla automáticamente
        handleSuggestionClick(suggestions[0]);
      } else if (suggestions.length > 0) {
        // Buscar coincidencia exacta
        const matched = suggestions.find(s => s[displayKey]?.toLowerCase() === value?.toLowerCase());
        if (matched) {
          handleSuggestionClick(matched);
        }
      }
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    console.log('[AutoCompleteInput] handleSuggestionClick - seleccionando:', suggestion);
    setIsSelecting(true);
    justSelected.current = true;
    onSelect(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    // Enfocar el input después de seleccionar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
      setIsSelecting(false);
    }, 100);
  };

  const handleInputFocus = () => {
    // Si hay texto y sugerencias, mostrar la lista
    if (value.length >= 2) {
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else {
        // Si hay texto pero no hay sugerencias, buscar de nuevo
        onSearch(value);
        setShowSuggestions(true);
      }
    }
  };

  const handleInputBlur = (e) => {
    // Solo ejecutar onBlur si no se está seleccionando una sugerencia
    if (!isSelecting && onBlur) {
      setTimeout(() => {
        if (!isSelecting) {
          onBlur();
        }
      }, 200);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}:
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`mt-1 block w-full border rounded-md shadow-sm p-2 pr-8 ${
            disabled 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
          }`}
          required={required}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder || 'Escriba para buscar...'}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange({ target: { name, value: '' } });
              setShowSuggestions(false);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            ✕
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          className="absolute z-[9999] w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          style={{ position: 'absolute', top: '100%', left: 0 }}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id || suggestion.Codigo || index}
              className={`p-3 cursor-pointer transition-colors ${
                index === highlightedIndex 
                  ? 'bg-blue-100 border-l-4 border-blue-500' 
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[AutoCompleteInput] Click en sugerencia:', suggestion);
                handleSuggestionClick(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevenir que el blur cierre la lista
              }}
            >
              <div className="font-medium text-gray-900">{suggestion[displayKey]}</div>
              {suggestion.Categoria && (
                <div className="text-xs text-gray-500 mt-1">
                  Categoría: {suggestion.Categoria}
                  {suggestion.Codigo_Triaje && ` • Código: ${suggestion.Codigo_Triaje}`}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {showSuggestions && suggestions.length === 0 && value.length >= 2 && (
        <div 
          className="absolute z-[9999] w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 p-3 text-sm text-gray-500"
          style={{ position: 'absolute', top: '100%', left: 0 }}
        >
          No se encontraron resultados para "{value}"
        </div>
      )}
    </div>
  );
};

export default AutoCompleteInput;