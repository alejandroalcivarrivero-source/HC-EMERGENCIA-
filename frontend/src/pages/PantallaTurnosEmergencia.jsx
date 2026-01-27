import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocketEmergencia } from '../hooks/useSocketEmergencia';
import axios from 'axios';

/**
 * Componente de Pantalla de Turnero Digital de EMERGENCIA optimizado para Smart TV
 * Diseño SIGEMECH - Sistema de Gestión de Emergencias del Centro de Salud Chone
 * Layout 70/30: Área principal de llamados (70%) + Videos educativos (30%)
 */
const PantallaTurnosEmergencia = () => {
  const { conectado, pacientesEnTurno, pacienteLlamado, setPacienteLlamado } = useSocketEmergencia();
  const [pacientesLlamadosActivos, setPacientesLlamadosActivos] = useState(new Set());
  const [fechaHora, setFechaHora] = useState(new Date());
  const [animacionActiva, setAnimacionActiva] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videoActualIndex, setVideoActualIndex] = useState(0);
  const [configuracionAudio, setConfiguracionAudio] = useState({
    volumen_videos: 15,
    volumen_llamado: 100,
    volumen_atenuacion: 5
  });
  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const [mostrarAlertaGrande, setMostrarAlertaGrande] = useState(false);
  const audioRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const videoRef = useRef(null);
  const videoElementRef = useRef(null);
  const volumenVideoNormalRef = useRef(0.15); // Volumen normal del video (15% por defecto)

  // Cargar videos activos y configuración de audio desde la base de datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar videos
        const resVideos = await axios.get('http://localhost:3001/api/multimedia-tv/activos');
        if (resVideos.data.success && resVideos.data.videos && resVideos.data.videos.length > 0) {
          setVideos(resVideos.data.videos);
          setVideoActualIndex(0);
        }

        // Cargar configuración de audio
        const resAudio = await axios.get('http://localhost:3001/api/configuracion-audio');
        if (resAudio.data.success) {
          setConfiguracionAudio(resAudio.data.configuracion);
          volumenVideoNormalRef.current = resAudio.data.configuracion.volumen_videos / 100;
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    cargarDatos();
  }, []);

  // Habilitar audio con un clic del usuario (requerido por políticas del navegador)
  useEffect(() => {
    const habilitarAudio = () => {
      setAudioHabilitado(true);
      // Aplicar volumen inicial a los videos
      if (videoElementRef.current) {
        videoElementRef.current.volume = volumenVideoNormalRef.current;
        videoElementRef.current.muted = false;
      }
      document.removeEventListener('click', habilitarAudio);
      document.removeEventListener('touchstart', habilitarAudio);
    };

    document.addEventListener('click', habilitarAudio, { once: true });
    document.addEventListener('touchstart', habilitarAudio, { once: true });

    return () => {
      document.removeEventListener('click', habilitarAudio);
      document.removeEventListener('touchstart', habilitarAudio);
    };
  }, []);

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setFechaHora(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatear fecha en español
  const formatearFecha = (fecha) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${dia} ${mes} ${año}`;
  };

  // Formatear hora en formato 12 horas
  const formatearHora = (fecha) => {
    let horas = fecha.getHours();
    const minutos = fecha.getMinutes();
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12;
    horas = horas ? horas : 12; // 0 debería ser 12
    const minutosStr = minutos < 10 ? `0${minutos}` : minutos;
    return `${horas}:${minutosStr} ${ampm}`;
  };

  // Función para restaurar volumen normal del video (usada en callbacks)
  const restaurarVolumenVideo = useCallback(() => {
    const volumenNormal = volumenVideoNormalRef.current;
    const videoActual = videos[videoActualIndex];
    
    if (videoActual) {
      if (videoActual.tipo === 'youtube' && videoRef.current) {
        try {
          const iframe = videoRef.current;
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${Math.round(volumenNormal * 100)}]}`, '*');
          }
        } catch (e) {
          console.log('No se pudo restaurar volumen del video YouTube:', e);
        }
      } else if (videoActual.tipo === 'local' && videoElementRef.current) {
        videoElementRef.current.volume = volumenNormal;
      }
    }
  }, [videos, videoActualIndex]);

  // Efecto para manejar llamado de paciente
  useEffect(() => {
    if (pacienteLlamado) {
      // Activar animación de entrada y alerta grande
      setAnimacionActiva(true);
      setMostrarAlertaGrande(true);
      
      // Agregar a lista de pacientes llamados activos
      setPacientesLlamadosActivos(prev => new Set([...prev, pacienteLlamado.admisionId]));

      // Atenuar volumen del video (Audio Ducking)
      const volumenAtenuacion = configuracionAudio.volumen_atenuacion / 100;
      const videoActual = videos[videoActualIndex];
      
      if (videoActual) {
        if (videoActual.tipo === 'youtube' && videoRef.current) {
          try {
            const iframe = videoRef.current;
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${Math.round(volumenAtenuacion * 100)}]}`, '*');
            }
          } catch (e) {
            console.log('No se pudo atenuar video YouTube:', e);
          }
        } else if (videoActual.tipo === 'local' && videoElementRef.current) {
          videoElementRef.current.volume = volumenAtenuacion;
        }
      }

      // Reproducir campana con volumen configurado
      const volumenLlamado = configuracionAudio.volumen_llamado / 100;
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Primer tono (Ding)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode1.gain.setValueAtTime(0.4 * volumenLlamado, audioContext.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.3);

        // Segundo tono (Dong)
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);
          
          oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode2.gain.setValueAtTime(0.4 * volumenLlamado, audioContext.currentTime);
          gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          
          oscillator2.start(audioContext.currentTime);
          oscillator2.stop(audioContext.currentTime + 0.4);
        }, 200);
      } catch (error) {
        console.error('Error al reproducir campana:', error);
      }

      // Anunciar con voz sintética después de la campana
      setTimeout(() => {
        try {
          if (speechSynthesisRef.current) {
            window.speechSynthesis.cancel();
          }

          const voces = window.speechSynthesis.getVoices();
          const vozEspanol = voces.find(voz => voz.lang.includes('es')) || voces[0];

          const mensaje = `Paciente ${pacienteLlamado.nombrePaciente}, por favor dirigirse a ${pacienteLlamado.areaConsultorio}`;
          const utterance = new SpeechSynthesisUtterance(mensaje);
          
          if (vozEspanol) {
            utterance.voice = vozEspanol;
          }
          
          utterance.lang = 'es-ES';
          utterance.rate = 0.85;
          utterance.pitch = 1;
          utterance.volume = configuracionAudio.volumen_llamado / 100;

          // Restaurar volumen del video cuando termine el anuncio
          utterance.onend = () => {
            const volumenNormal = volumenVideoNormalRef.current;
            const videoActual = videos[videoActualIndex];
            
            if (videoActual) {
              if (videoActual.tipo === 'youtube' && videoRef.current) {
                try {
                  const iframe = videoRef.current;
                  if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${Math.round(volumenNormal * 100)}]}`, '*');
                  }
                } catch (e) {
                  console.log('No se pudo restaurar volumen del video YouTube:', e);
                }
              } else if (videoActual.tipo === 'local' && videoElementRef.current) {
                videoElementRef.current.volume = volumenNormal;
              }
            }
          };

          utterance.onerror = () => {
            // Asegurar que el volumen se restaure incluso si hay error
            const volumenNormal = volumenVideoNormalRef.current;
            const videoActual = videos[videoActualIndex];
            
            if (videoActual) {
              if (videoActual.tipo === 'youtube' && videoRef.current) {
                try {
                  const iframe = videoRef.current;
                  if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${Math.round(volumenNormal * 100)}]}`, '*');
                  }
                } catch (e) {
                  console.log('No se pudo restaurar volumen del video YouTube:', e);
                }
              } else if (videoActual.tipo === 'local' && videoElementRef.current) {
                videoElementRef.current.volume = volumenNormal;
              }
            }
          };

          speechSynthesisRef.current = utterance;
          
          if (voces.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
              const nuevasVoces = window.speechSynthesis.getVoices();
              const nuevaVozEspanol = nuevasVoces.find(voz => voz.lang.includes('es')) || nuevasVoces[0];
              if (nuevaVozEspanol) {
                utterance.voice = nuevaVozEspanol;
              }
              window.speechSynthesis.speak(utterance);
            };
          } else {
            window.speechSynthesis.speak(utterance);
          }
        } catch (error) {
          console.error('Error al anunciar paciente:', error);
          // Restaurar volumen en caso de error
          const volumenNormal = volumenVideoNormalRef.current;
          const videoActual = videos[videoActualIndex];
          if (videoActual && videoActual.tipo === 'local' && videoElementRef.current) {
            videoElementRef.current.volume = volumenNormal;
          }
        }
      }, 500);

      // Ocultar alerta grande después de 15 segundos y reducir tamaño de fuente
      const timeoutAlertaGrande = setTimeout(() => {
        setMostrarAlertaGrande(false);
      }, 15000);

      // Remover efecto de llamado después de 15 segundos
      const timeoutId = setTimeout(() => {
        setPacientesLlamadosActivos(prev => {
          const nuevo = new Set(prev);
          nuevo.delete(pacienteLlamado.admisionId);
          return nuevo;
        });
        setAnimacionActiva(false);
        setPacienteLlamado(null);
      }, 15000);

      // Cleanup: cancelar timeouts si el componente se desmonta o cambia pacienteLlamado
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutAlertaGrande);
        if (speechSynthesisRef.current) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [pacienteLlamado, configuracionAudio, videos, videoActualIndex]);

  // Formatear nombre del paciente (Nombre + inicial del apellido)
  const formatearNombre = (nombreCompleto) => {
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length === 0) return nombreCompleto;
    
    const nombre = partes[0];
    const apellido = partes.length > 1 ? partes[partes.length - 1] : '';
    const inicialApellido = apellido ? apellido.charAt(0).toUpperCase() + '.' : '';
    
    return `${nombre} ${inicialApellido}`.trim();
  };

  // Manejar cuando un video termina (solo para videos locales)
  const handleVideoEnd = useCallback(() => {
    if (videos.length > 0) {
      const siguienteIndex = (videoActualIndex + 1) % videos.length;
      setVideoActualIndex(siguienteIndex);
      // Aplicar volumen configurado al siguiente video cuando cambie
      setTimeout(() => {
        if (videoElementRef.current && audioHabilitado) {
          videoElementRef.current.volume = volumenVideoNormalRef.current;
        }
      }, 100);
    }
  }, [videos.length, videoActualIndex, audioHabilitado]);

  // Actualizar volumen cuando cambia la configuración
  useEffect(() => {
    volumenVideoNormalRef.current = configuracionAudio.volumen_videos / 100;
    // Aplicar nuevo volumen al video actual si está reproduciendo
    if (videoElementRef.current && audioHabilitado) {
      videoElementRef.current.volume = volumenVideoNormalRef.current;
    }
    if (videoRef.current && audioHabilitado) {
      try {
        const volumenInicial = Math.round(volumenVideoNormalRef.current * 100);
        videoRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${volumenInicial}]}`, '*');
      } catch (e) {
        // Ignorar errores
      }
    }
  }, [configuracionAudio.volumen_videos, audioHabilitado]);

  // Filtrar pacientes que están en EN_ATENCION o SIGNOS_VITALES
  const pacientesEnTurnoFiltrados = pacientesEnTurno.filter(p => 
    p.estadoNuevo === 'EN_ATENCION' || p.estadoNuevo === 'SIGNOS_VITALES'
  );

  // Obtener el paciente más reciente llamado
  const pacienteActualLlamado = pacienteLlamado 
    ? pacientesEnTurnoFiltrados.find(p => p.admisionId === pacienteLlamado.admisionId) || pacienteLlamado
    : null;

  // Obtener video actual
  const videoActual = videos.length > 0 ? videos[videoActualIndex] : null;

  // Estado vacío elegante si no hay pacientes - DEBE IR DESPUÉS DE TODOS LOS HOOKS
  if (!conectado) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔴</div>
          <h1 className="text-4xl font-bold text-white mb-2">SIGEMECH - EMERGENCIA</h1>
          <p className="text-2xl text-gray-300">Conectando al servidor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col ${
      animacionActiva ? 'bg-gradient-to-br from-green-900 via-green-800 to-blue-900' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'
    } transition-all duration-1000`}>
      {/* HEADER - Tamaño reducido cuando no hay alerta grande */}
      <header className="bg-blue-950 bg-opacity-95 px-8 py-5 border-b-4 border-yellow-400 flex justify-between items-center z-10 shadow-lg">
        <div className="flex items-center gap-6">
          <h1 className={`font-extrabold text-white tracking-tight ${mostrarAlertaGrande ? 'text-6xl md:text-7xl' : 'text-3xl md:text-4xl'}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            SIGEMECH - EMERGENCIA
          </h1>
          <div className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
            conectado ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          } ${mostrarAlertaGrande ? 'text-xl' : 'text-sm'}`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            <span className={mostrarAlertaGrande ? 'text-3xl' : 'text-xl'}>{conectado ? '🟢' : '🔴'}</span>
            <span>{conectado ? 'EN LÍNEA' : 'DESCONECTADO'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`font-extrabold text-white ${mostrarAlertaGrande ? 'text-5xl md:text-6xl' : 'text-2xl md:text-3xl'}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {formatearHora(fechaHora)}
          </div>
          <div className={`font-semibold text-blue-100 mt-1 ${mostrarAlertaGrande ? 'text-3xl' : 'text-lg'}`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {formatearFecha(fechaHora)}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL - Layout 70/30 */}
      <div className="flex-1 flex overflow-hidden">
        {/* LADO IZQUIERDO - ÁREA PRINCIPAL DE LLAMADOS (70%) */}
        <div className="w-[70%] flex flex-col items-center justify-center p-8">
          {pacienteActualLlamado ? (
            mostrarAlertaGrande ? (
              /* ALERTA GRANDE - Muestra por 15 segundos */
              <div
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-600 via-green-500 to-blue-600 rounded-3xl shadow-2xl p-16 transform transition-all duration-1000 ease-out animate-zoom-in"
                style={{
                  animation: 'zoomIn 0.8s ease-out, pulse 2s infinite'
                }}
              >
                <div className="text-center">
                  <div className="mb-12 text-9xl animate-bounce">🔔</div>
                  <h2
                    className="mb-8 font-extrabold tracking-tight text-white"
                    style={{ fontSize: 'clamp(6rem, 15vw, 12rem)', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  >
                    {formatearNombre(pacienteActualLlamado.nombrePaciente)}
                  </h2>
                  <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    Dirigirse a: <span className="text-yellow-300">{pacienteActualLlamado.areaConsultorio}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* VISTA NORMAL - Después de 15 segundos */
              <div
                className={`
                  w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8
                  transform transition-all duration-1000 ease-out
                  ${animacionActiva 
                    ? 'border-4 border-green-400 bg-green-50' 
                    : 'border-4 border-blue-300'
                  }
                `}
              >
                <div className="text-center">
                  <div className="mb-6">
                    <h2
                      className={`mb-4 font-extrabold tracking-tight ${
                        animacionActiva ? 'text-green-800' : 'text-blue-900'
                      }`}
                      style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', textShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                    >
                      {formatearNombre(pacienteActualLlamado.nombrePaciente)}
                    </h2>
                    <div className="text-2xl md:text-3xl font-bold text-gray-800" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                      Dirigirse a: <span className="text-blue-700">{pacienteActualLlamado.areaConsultorio}</span>
                    </div>
                  </div>
                  
                  {pacienteActualLlamado.intentosLlamado >= 3 && (
                    <div className="mt-6 p-6 bg-red-100 border-4 border-red-600 rounded-2xl">
                      <p className="text-2xl md:text-3xl font-extrabold text-red-800" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                        ⚠️ No responde ({pacienteActualLlamado.intentosLlamado} intentos)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="text-center">
              <div className={`mb-10 animate-pulse ${mostrarAlertaGrande ? 'text-9xl' : 'text-6xl'}`}>⏳</div>
              <p className={`font-extrabold text-white mb-6 ${mostrarAlertaGrande ? 'text-6xl md:text-7xl lg:text-8xl' : 'text-3xl md:text-4xl'}`} style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                Esperando pacientes...
              </p>
              <p className={`font-semibold text-blue-100 ${mostrarAlertaGrande ? 'text-4xl md:text-5xl' : 'text-xl md:text-2xl'}`} style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                Sistema de Llamado de Pacientes
              </p>
              {pacientesEnTurnoFiltrados.length === 0 && (
                <div className={`mt-10 p-8 bg-white/15 rounded-2xl inline-block border-2 border-white/30 ${mostrarAlertaGrande ? '' : 'p-6'}`}>
                  <p className={`font-bold text-white ${mostrarAlertaGrande ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                    No hay pacientes en espera en este momento
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LADO DERECHO - VIDEOS EDUCATIVOS (30%) */}
        <div className="w-[30%] bg-gray-900 bg-opacity-90 border-l-4 border-yellow-400 p-5 flex flex-col">
          <h3 className={`font-extrabold text-white mb-4 text-center ${mostrarAlertaGrande ? 'text-3xl' : 'text-xl'}`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Videos Educativos
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
              {videoActual ? (
                videoActual.tipo === 'youtube' ? (
                  <iframe
                    key={videoActual.id}
                    ref={videoRef}
                    className="w-full h-full"
                    src={`${videoActual.url_video}?autoplay=1&loop=1&playlist=${videoActual.url_video.match(/([a-zA-Z0-9_-]{11})/)?.[1] || ''}&mute=0&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
                    title={videoActual.titulo}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    style={{ pointerEvents: 'none' }}
                    onLoad={() => {
                      // Cuando el iframe carga, configurar volumen inicial
                      if (audioHabilitado && videoRef.current) {
                        try {
                          const volumenInicial = Math.round(volumenVideoNormalRef.current * 100);
                          videoRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${volumenInicial}]}`, '*');
                        } catch (e) {
                          console.log('No se pudo configurar volumen inicial de YouTube:', e);
                        }
                      }
                    }}
                  />
                ) : (
                  <video
                    key={videoActual.id}
                    ref={videoElementRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop={false}
                    muted={false}
                    playsInline
                    onEnded={handleVideoEnd}
                    onLoadedMetadata={() => {
                      if (videoElementRef.current && audioHabilitado) {
                        // Aplicar volumen configurado cuando el video carga
                        videoElementRef.current.volume = volumenVideoNormalRef.current;
                        videoElementRef.current.muted = false;
                      }
                    }}
                    onPlay={() => {
                      // Asegurar volumen correcto cuando el video se reproduce
                      if (videoElementRef.current && audioHabilitado) {
                        videoElementRef.current.volume = volumenVideoNormalRef.current;
                        videoElementRef.current.muted = false;
                      }
                    }}
                  >
                    <source src={videoActual.url_video} type="video/mp4" />
                    Tu navegador no soporta videos.
                  </video>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  No hay videos disponibles
                </div>
              )}
            </div>
          </div>
          {videoActual && (
            <div className="mt-3 text-center">
              <p className={`text-white font-bold ${mostrarAlertaGrande ? 'text-lg' : 'text-sm'}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{videoActual.titulo}</p>
              <p className={`text-gray-300 font-medium ${mostrarAlertaGrande ? 'text-base' : 'text-xs'}`}>
                Video {videoActualIndex + 1} de {videos.length}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER - Tamaño reducido cuando no hay alerta grande */}
      <footer className="bg-blue-950 bg-opacity-95 px-8 py-4 border-t-4 border-yellow-400">
        <div className="flex justify-between items-center text-white">
          <div className={`font-bold ${mostrarAlertaGrande ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            Centro de Salud Chone - Sistema de Gestión de Emergencias
          </div>
          <div className={`font-semibold ${mostrarAlertaGrande ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {pacientesEnTurnoFiltrados.length > 0 && (
              <span>Pacientes en turno: {pacientesEnTurnoFiltrados.length}</span>
            )}
          </div>
        </div>
      </footer>

      {/* Estilos CSS para animaciones personalizadas */}
      <style>{`
        @keyframes zoomIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }
        
        .animate-zoom-in {
          animation: zoomIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PantallaTurnosEmergencia;
