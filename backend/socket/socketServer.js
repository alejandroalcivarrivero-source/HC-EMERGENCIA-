const { Server } = require('socket.io');

let io = null;

/**
 * Inicializar servidor Socket.io
 * @param {http.Server} httpServer - Servidor HTTP de Express
 * @returns {Server} Instancia de Socket.io
 */
const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`✅ Cliente Socket.io conectado: ${socket.id}`);

    // Unirse a la sala de turnero digital (tanto emergencia como consulta externa usan la misma sala)
    socket.on('join-turnero', () => {
      socket.join('turnero-digital');
      console.log(`📺 Cliente ${socket.id} se unió a la sala de turnero digital`);
      // Confirmar unión al cliente
      socket.emit('joined-turnero', { success: true, room: 'turnero-digital' });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente Socket.io desconectado: ${socket.id}`);
    });
  });

  console.log('✅ Servidor Socket.io inicializado');
  return io;
};

/**
 * Obtener instancia de Socket.io
 * @returns {Server} Instancia de Socket.io
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado. Llama a initSocketServer primero.');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIO
};
