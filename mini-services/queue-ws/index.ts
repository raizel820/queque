import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Agency channels: Map<agencyId, Set<socketId>>
const agencyChannels = new Map<string, Set<string>>();
// User subscriptions: Map<userId, Set<socketId>>
const userSubscriptions = new Map<string, Set<string>>();
// Socket metadata: Map<socketId, { userId?, agencyIds? }>
const socketMeta = new Map<string, { userId?: string; agencyIds: Set<string> }>();

function joinChannel(channelType: 'agency' | 'user', id: string, socketId: string) {
  const meta = socketMeta.get(socketId) || { agencyIds: new Set() };

  if (channelType === 'agency') {
    let channel = agencyChannels.get(id);
    if (!channel) {
      channel = new Set();
      agencyChannels.set(id, channel);
    }
    channel.add(socketId);
    meta.agencyIds.add(id);
  } else if (channelType === 'user') {
    let channel = userSubscriptions.get(id);
    if (!channel) {
      channel = new Set();
      userSubscriptions.set(id, channel);
    }
    channel.add(socketId);
    meta.userId = id;
  }

  socketMeta.set(socketId, meta);
}

function leaveAllChannels(socketId: string) {
  const meta = socketMeta.get(socketId);
  if (!meta) return;

  // Remove from agency channels
  for (const agencyId of meta.agencyIds) {
    const channel = agencyChannels.get(agencyId);
    if (channel) {
      channel.delete(socketId);
      if (channel.size === 0) agencyChannels.delete(agencyId);
    }
  }

  // Remove from user channel
  if (meta.userId) {
    const channel = userSubscriptions.get(meta.userId);
    if (channel) {
      channel.delete(socketId);
      if (channel.size === 0) userSubscriptions.delete(meta.userId);
    }
  }

  socketMeta.delete(socketId);
}

io.on('connection', (socket) => {
  console.log(`[QueueWS] Client connected: ${socket.id}`);

  // Subscribe to agency-specific updates
  socket.on('subscribe-agency', (data: { agencyId: string }) => {
    joinChannel('agency', data.agencyId, socket.id);
    console.log(`[QueueWS] Socket ${socket.id} subscribed to agency: ${data.agencyId}`);
  });

  // Subscribe to user-specific updates
  socket.on('subscribe-user', (data: { userId: string }) => {
    joinChannel('user', data.userId, socket.id);
    console.log(`[QueueWS] Socket ${socket.id} subscribed to user: ${data.userId}`);
  });

  // Test event
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    leaveAllChannels(socket.id);
    console.log(`[QueueWS] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[QueueWS] Socket error (${socket.id}):`, error);
  });
});

// ─── Broadcast Functions (can be called from outside) ─────────

/**
 * Broadcast a queue update to all subscribers of an agency
 * Call from REST API routes via HTTP or internal events
 */
export function broadcastQueueUpdate(agencyId: string, data: {
  type: 'NEW_RESERVATION' | 'CALLED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reservationId: string;
  status: string;
  queueNumber: string;
}) {
  const channel = agencyChannels.get(agencyId);
  if (channel) {
    for (const socketId of channel) {
      io.to(socketId).emit('queue-update', {
        agencyId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Broadcast to a specific user (e.g., their reservation was called)
 */
export function broadcastToUser(userId: string, event: string, data: Record<string, unknown>) {
  const channel = userSubscriptions.get(userId);
  if (channel) {
    for (const socketId of channel) {
      io.to(socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

const PORT = 3005;
httpServer.listen(PORT, () => {
  console.log(`[QueueWS] Queue WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[QueueWS] Received SIGTERM signal, shutting down...');
  httpServer.close(() => {
    console.log('[QueueWS] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[QueueWS] Received SIGINT signal, shutting down...');
  httpServer.close(() => {
    console.log('[QueueWS] Server closed');
    process.exit(0);
  });
});
