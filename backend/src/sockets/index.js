const { Server } = require('socket.io');
const { getCorsOrigin } = require('../config/corsOrigins');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: getCorsOrigin(), methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[socket] client disconnected: ${socket.id}`));
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized - call initSocket(server) first');
  return io;
}

module.exports = { initSocket, getIO };
