import React, { useEffect, useState, useRef } from 'react';

const LlamadoEmergente = ({ paciente, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [ciclo, setCiclo] = useState(1);
  const maxCiclos = 3;
  const duracionVisible = 15000; // 15 segundos
  const duracionOculto = 3000;   // 3 segundos

  const formatearNombre = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 0) return nombreCompleto;
    
    const nombre = partes[0];
    const apellido = partes.length > 1 ? partes[partes.length - 1] : '';
    // Nombre completo pero con inicial del segundo nombre si existe, etc.
    // El requerimiento pide "JUAN P."
    const inicialApellido = apellido ? apellido.charAt(0).toUpperCase() + '.' : '';
    return `${nombre} ${inicialApellido}`.trim().toUpperCase();
  };

  const anunciarPaciente = () => {
    // Cancelar cualquier audio previo
    window.speechSynthesis.cancel();

    const mensaje = `Atención. Paciente ${paciente.nombrePaciente}, por favor dirigirse al consultorio ${paciente.areaConsultorio}`;
    const utterance = new SpeechSynthesisUtterance(mensaje);
    
    const voces = window.speechSynthesis.getVoices();
    const vozEspanol = voces.find(voz => voz.lang.includes('es')) || voces[0];
    
    if (vozEspanol) {
      utterance.voice = vozEspanol;
    }
    
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  // Resetear ciclo si cambia el paciente
  useEffect(() => {
    setVisible(true);
    setCiclo(1);
  }, [paciente]);

  useEffect(() => {
    let timeoutId;

    const ejecutarCiclo = () => {
      if (visible) {
        // Al hacerse visible, anunciar
        anunciarPaciente();

        // Programar ocultamiento
        timeoutId = setTimeout(() => {
          if (ciclo < maxCiclos) {
            setVisible(false);
          } else {
            // Fin de los ciclos
            if (onComplete) onComplete();
          }
        }, duracionVisible);
      } else {
        // Programar siguiente aparición
        timeoutId = setTimeout(() => {
          setCiclo(c => c + 1);
          setVisible(true);
        }, duracionOculto);
      }
    };

    ejecutarCiclo();

    return () => {
      clearTimeout(timeoutId);
      window.speechSynthesis.cancel();
    };
  }, [visible, ciclo, paciente]); // Dependencias clave

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-blue-950 animate-fadeIn">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      <div className="absolute inset-0 bg-blue-900 opacity-50 animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8 text-center">
        {/* Encabezado Parpadeante */}
        <div className="mb-12 animate-bounce">
          <h1 className="text-6xl md:text-8xl font-black text-yellow-400 tracking-wider border-b-8 border-yellow-400 pb-4 inline-block shadow-lg">
            ¡LLAMADO URGENTE!
          </h1>
        </div>

        {/* Nombre del Paciente */}
        <div className="mb-16 transform transition-all duration-500 hover:scale-105">
          <h2 className="text-[5rem] md:text-[8rem] leading-tight font-extrabold text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
            {formatearNombre(paciente.nombrePaciente)}
          </h2>
        </div>

        {/* Consultorio */}
        <div className="bg-red-600 px-16 py-8 rounded-3xl shadow-2xl border-4 border-white transform rotate-1 animate-pulse">
          <p className="text-4xl md:text-6xl font-bold text-white mb-2">
            CONSULTORIO / ÁREA
          </p>
          <p className="text-6xl md:text-8xl font-black text-yellow-300">
            {paciente.areaConsultorio}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LlamadoEmergente;
