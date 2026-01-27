import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook personalizado para manejar la conexión Socket.io del turnero digital de EMERGENCIA
 * DIFERENCIADO del turnero de Consulta Externa que usa otra lógica
 * @returns {Object} Objeto con socket, conectado y eventos
 */
export const useSocketEmergencia = () => {
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [pacientesEnTurno, setPacientesEnTurno] = useState([]);
  const [pacienteLlamado, setPacienteLlamado] = useState(null);

  useEffect(() => {
    // Crear conexión Socket.io
    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Eventos de conexión
    socketInstance.on('connect', () => {
      console.log('✅ Conectado al servidor Socket.io (Emergencia)');
      setConectado(true);
      
      // Unirse a la sala de turnero digital de emergencia
      socketInstance.emit('join-turnero');
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Desconectado del servidor Socket.io');
      setConectado(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.io:', error);
      setConectado(false);
    });

    // Escuchar evento de cambio de estado de paciente (solo para emergencia)
    socketInstance.on('paciente-estado-cambiado', (data) => {
      console.log('📢 Evento recibido: paciente-estado-cambiado (Emergencia)', data);
      
      // Actualizar lista de pacientes en turno
      setPacientesEnTurno(prev => {
        const existe = prev.find(p => p.admisionId === data.admisionId);
        if (existe) {
          // Actualizar paciente existente
          return prev.map(p => 
            p.admisionId === data.admisionId 
              ? { ...p, estadoNuevo: data.estadoNuevo, areaConsultorio: data.areaConsultorio }
              : p
          );
        } else {
          // Agregar nuevo paciente
          return [...prev, {
            admisionId: data.admisionId,
            pacienteId: data.pacienteId,
            nombrePaciente: data.nombrePaciente,
            estadoNuevo: data.estadoNuevo,
            areaConsultorio: data.areaConsultorio,
            timestamp: data.timestamp
          }];
        }
      });
    });

    // Escuchar evento de llamado de paciente (solo para emergencia)
    socketInstance.on('paciente-llamado', (data) => {
      console.log('📢 Evento recibido: paciente-llamado (Emergencia)', data);
      
      // Establecer paciente llamado para efectos visuales y audio
      setPacienteLlamado({
        admisionId: data.admisionId,
        pacienteId: data.pacienteId,
        nombrePaciente: data.nombrePaciente,
        intentosLlamado: data.intentosLlamado,
        areaConsultorio: data.areaConsultorio,
        timestamp: data.timestamp
      });

      // Actualizar paciente en la lista si existe
      setPacientesEnTurno(prev => {
        const existe = prev.find(p => p.admisionId === data.admisionId);
        if (existe) {
          return prev.map(p => 
            p.admisionId === data.admisionId 
              ? { ...p, intentosLlamado: data.intentosLlamado }
              : p
          );
        }
        return prev;
      });
    });

    setSocket(socketInstance);

    // Limpiar conexión al desmontar
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    conectado,
    pacientesEnTurno,
    pacienteLlamado,
    setPacienteLlamado
  };
};
