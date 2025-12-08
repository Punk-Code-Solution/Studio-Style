/**
 * Socket.IO utility para emitir eventos em tempo real
 * Singleton para garantir uma única instância do servidor Socket.IO
 */

let io = null;

/**
 * Inicializa o servidor Socket.IO
 * @param {http.Server} server - Servidor HTTP do Express
 * @returns {SocketIOServer} Instância do Socket.IO
 */
function initializeSocketIO(server) {
  if (io) {
    return io;
  }

  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`✅ Cliente Socket.IO conectado: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Cliente Socket.IO desconectado: ${socket.id}`);
    });

    // Evento para o cliente se inscrever em atualizações de agendamentos
    socket.on('subscribe:schedules', () => {
      socket.join('schedules');
      console.log(`📅 Cliente ${socket.id} se inscreveu em atualizações de agendamentos`);
    });

    // Evento para o cliente se desinscrever
    socket.on('unsubscribe:schedules', () => {
      socket.leave('schedules');
      console.log(`📅 Cliente ${socket.id} se desinscreveu de atualizações de agendamentos`);
    });
  });

  console.log('🚀 Socket.IO inicializado');
  return io;
}

/**
 * Emite evento de novo agendamento criado
 * @param {Object} scheduleData - Dados do agendamento criado
 */
function emitScheduleCreated(scheduleData) {
  if (!io) {
    console.warn('⚠️ Socket.IO não inicializado. Evento não será emitido.');
    return;
  }

  io.to('schedules').emit('schedule:created', {
    schedule: scheduleData,
    timestamp: new Date().toISOString()
  });

  console.log('📢 Evento schedule:created emitido para todos os clientes inscritos');
}

/**
 * Emite evento de agendamento atualizado
 * @param {Object} scheduleData - Dados do agendamento atualizado
 */
function emitScheduleUpdated(scheduleData) {
  if (!io) {
    console.warn('⚠️ Socket.IO não inicializado. Evento não será emitido.');
    return;
  }

  io.to('schedules').emit('schedule:updated', {
    schedule: scheduleData,
    timestamp: new Date().toISOString()
  });

  console.log('📢 Evento schedule:updated emitido para todos os clientes inscritos');
}

/**
 * Emite evento de agendamento deletado
 * @param {string} scheduleId - ID do agendamento deletado
 */
function emitScheduleDeleted(scheduleId) {
  if (!io) {
    console.warn('⚠️ Socket.IO não inicializado. Evento não será emitido.');
    return;
  }

  io.to('schedules').emit('schedule:deleted', {
    scheduleId,
    timestamp: new Date().toISOString()
  });

  console.log('📢 Evento schedule:deleted emitido para todos os clientes inscritos');
}

/**
 * Retorna a instância do Socket.IO (se já inicializada)
 * @returns {SocketIOServer|null}
 */
function getIO() {
  return io;
}

module.exports = {
  initializeSocketIO,
  emitScheduleCreated,
  emitScheduleUpdated,
  emitScheduleDeleted,
  getIO
};

