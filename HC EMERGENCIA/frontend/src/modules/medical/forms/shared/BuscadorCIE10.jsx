/**
 * Componente Mejorado de Búsqueda CIE-10
 * Incluye búsqueda por código y descripción, con sugerencias inteligentes
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Search, Code, FileText, X } from 'lucide-react';

const BuscadorCIE10 = ({ 
  onSelect, 
  valorInicial = '', 
  placeholder = 'Buscar CIE-10...',
  disabled = false,
  className = ''
}) => {
  const [termino, setTermino] = useState(valorInicial);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modoBusqueda, setModoBusqueda] = useState('descripcion'); // 'descripcion' | 'codigo'
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const resultadosRef = useRef(null);

  // Función de búsqueda con debounce
  const buscarCIE10 = useMemo(
    () => debounce(async (texto, modo) => {
      if (texto.length < 2) {
        setResultados([]);
        setMostrarResultados(false);
        return;
      }

      setCargando(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        let url = `http://localhost:3001/api/cat-cie10?`;
        
        if (modo === 'codigo') {
          url += `codigo=${encodeURIComponent(texto)}&limit=20`;
        } else {
          url += `search=${encodeURIComponent(texto)}&limit=20&fuzzy=true`;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setResultados(response.data || []);
        setMostrarResultados(response.data && response.data.length > 0);
      } catch (err) {
        console.error('Error al buscar CIE-10:', err);
        setError('Error al buscar códigos CIE-10. Intente de nuevo.');
        setResultados([]);
        setMostrarResultados(false);
      } finally {
        setCargando(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (termino && termino.length >= 2) {
      buscarCIE10(termino, modoBusqueda);
    } else {
      setResultados([]);
      setMostrarResultados(false);
    }
  }, [termino, modoBusqueda, buscarCIE10]);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultadosRef.current &&
        !resultadosRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (cie10) => {
    onSelect(cie10);
    setTermino(cie10.codigo);
    setResultados([]);
    setMostrarResultados(false);
  };

  const handleClear = () => {
    setTermino('');
    setResultados([]);
    setMostrarResultados(false);
    onSelect(null);
  };

  const handleInputChange = (e) => {
    const nuevoTermino = e.target.value;
    setTermino(nuevoTermino);
    if (nuevoTermino.length === 0) {
      onSelect(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selector de modo de búsqueda */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => {
            setModoBusqueda('descripcion');
            setTermino(''); // Limpiar búsqueda al cambiar modo
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            modoBusqueda === 'descripcion'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={disabled}
        >
          <FileText className="w-4 h-4" />
          Descripción
        </button>
        <button
          type="button"
          onClick={() => {
            setModoBusqueda('codigo');
            setTermino(''); // Limpiar búsqueda al cambiar modo
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            modoBusqueda === 'codigo'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={disabled}
        >
          <Code className="w-4 h-4" />
          Código
        </button>
      </div>

      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={termino}
          onChange={handleInputChange}
          onFocus={() => {
            if (resultados.length > 0) {
              setMostrarResultados(true);
            }
          }}
          placeholder={
            modoBusqueda === 'codigo' 
              ? 'Ej: A00.0, I10, Z00.0...' 
              : placeholder
          }
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        
        {/* Botón limpiar */}
        {termino && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Indicador de carga */}
        {cargando && (
          <div className="absolute right-10 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Lista de resultados */}
      {mostrarResultados && resultados.length > 0 && (
        <div
          ref={resultadosRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {resultados.map((cie10) => (
            <div
              key={cie10.codigo}
              onClick={() => handleSelect(cie10)}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-blue-600 text-sm">
                    {cie10.codigo}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {cie10.descripcion}
                  </div>
                </div>
                {cie10.codigo.toUpperCase().startsWith('Z') && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Z
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {mostrarResultados && !cargando && termino.length >= 2 && resultados.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            No se encontraron resultados para "{termino}"
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Función debounce para optimizar búsquedas
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default BuscadorCIE10;
