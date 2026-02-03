import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocketEmergencia } from '../hooks/useSocketEmergencia';
import LlamadoEmergente from '../components/LlamadoEmergente';
import axios from 'axios';

/**
 * Componente de Pantalla de Turnero Digital de EMERGENCIA optimizado para Smart TV
 * Diseño SIGEMECH - Sistema de Gestión de Emergencias del Centro de Salud Chone
 * Layout 70/30: Área principal de llamados (70%) + Videos educativos (30%)
 */
const PantallaTurnosEmergencia = () => {
  const { conectado, pacientesEnTurno, pacienteLlamado, setPacienteLlamado } = useSocketEmergencia();
  const [ultimosLlamados, setUltimosLlamados] = useState([]);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [videos, setVideos] = useState([]);
  const [videoActualIndex, setVideoActualIndex] = useState(0);
  const [configuracionAudio, setConfiguracionAudio] = useState({
    volumen_videos: 15,
    volumen_llamado: 100,
    volumen_atenuacion: 5
  });
  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const videoRef = useRef(null);
  const videoElementRef = useRef(null);
  const volumenVideoNormalRef = useRef(0.15); // Volumen normal del video (15% por defecto)

  // Cargar videos activos, configuración de audio y últimos llamados
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar últimos llamados históricos
        const resLlamados = await axios.get('http://localhost:3001/api/atencion-paciente-estado/ultimos-llamados');
        if (resLlamados.data && Array.isArray(resLlamados.data)) {
          setUltimosLlamados(resLlamados.data);
        }

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

  // Efecto para manejar atenuación de video cuando hay llamado
  useEffect(() => {
    if (pacienteLlamado) {
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
    } else {
      // Restaurar volumen cuando no hay llamado
      restaurarVolumenVideo();
    }
  }, [pacienteLlamado, configuracionAudio, videos, videoActualIndex, restaurarVolumenVideo]);

  const handleLlamadoCompleto = () => {
    // Agregar el paciente llamado al historial local
    if (pacienteLlamado) {
      setUltimosLlamados(prev => {
        // Evitar duplicados y mantener solo los últimos 5
        const filtrados = prev.filter(p => p.admisionId !== pacienteLlamado.admisionId);
        return [pacienteLlamado, ...filtrados].slice(0, 5);
      });
    }
    setPacienteLlamado(null);
    restaurarVolumenVideo();
  };

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
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* HEADER */}
      <header className="bg-blue-950 bg-opacity-95 px-8 py-5 border-b-4 border-yellow-400 flex justify-between items-center z-10 shadow-lg">
        <div className="flex items-center gap-6">
          <h1 className="font-extrabold text-white tracking-tight text-3xl md:text-4xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            SIGEMECH - EMERGENCIA
          </h1>
          <div className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
            conectado ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          } text-sm`} style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            <span className="text-xl">{conectado ? '🟢' : '🔴'}</span>
            <span>{conectado ? 'EN LÍNEA' : 'DESCONECTADO'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="font-extrabold text-white text-2xl md:text-3xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            {formatearHora(fechaHora)}
          </div>
          <div className="font-semibold text-blue-100 mt-1 text-lg" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {formatearFecha(fechaHora)}
          </div>
        </div>
      </header>

      {/* COMPONENTE DE LLAMADO EMERGENTE (OVERLAY) */}
      {pacienteLlamado && (
        <LlamadoEmergente
          paciente={pacienteLlamado}
          onComplete={handleLlamadoCompleto}
        />
      )}

      {/* CONTENIDO PRINCIPAL - Layout 70/30 */}
      <div className="flex-1 flex overflow-hidden">
        {/* LADO IZQUIERDO - LISTA DE PACIENTES (70%) */}
        <div className="w-[70%] bg-white/5 p-6 flex flex-col">
          <h2 className="text-3xl font-bold text-white mb-6 pl-4 border-l-8 border-yellow-400">
            Últimos Llamados
          </h2>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {ultimosLlamados.length > 0 ? (
              ultimosLlamados.map((paciente, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between transform transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-blue-100 text-blue-800 font-black text-2xl w-12 h-12 rounded-full flex items-center justify-center border-2 border-blue-200">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold text-blue-900">
                        {formatearNombre(paciente.nombrePaciente)}
                      </h3>
                      <p className="text-gray-500 font-medium mt-1">
                        {formatearFecha(new Date(paciente.updatedAt || new Date()))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 px-8 py-4 rounded-lg border-l-4 border-blue-500 text-right">
                    <p className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">Consultorio</p>
                    <p className="text-4xl font-black text-blue-800">{paciente.areaConsultorio}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/50">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-2xl font-medium">No hay llamados recientes</p>
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO - VIDEOS EDUCATIVOS (30%) */}
        <div className="w-[30%] bg-gray-900 bg-opacity-90 border-l-4 border-yellow-400 p-5 flex flex-col">
          <h3 className="font-extrabold text-white mb-4 text-center text-xl" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
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
              <p className="text-white font-bold text-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{videoActual.titulo}</p>
              <p className="text-gray-300 font-medium text-xs">
                Video {videoActualIndex + 1} de {videos.length}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-blue-950 bg-opacity-95 px-8 py-4 border-t-4 border-yellow-400">
        <div className="flex justify-between items-center text-white">
          <div className="font-bold text-lg md:text-xl" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            Centro de Salud Chone - Sistema de Gestión de Emergencias
          </div>
          <div className="font-semibold text-base md:text-lg" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {ultimosLlamados.length > 0 && (
              <span>Pacientes en turno: {ultimosLlamados.length}</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PantallaTurnosEmergencia;
