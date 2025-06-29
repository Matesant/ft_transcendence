import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { GameRoom } from './gameRoom.js';

const fastify = Fastify({ logger: true });

// Add CORS support - this is the critical fix
await fastify.register(cors, {
  origin: 'http://localhost:8080',  // Your frontend URL
  credentials: true
});

await fastify.register(websocket);

const gameRooms = new Map();

// Simple endpoint to create game rooms
fastify.get('/create-room', async (request, reply) => {
  const roomId = `room_${Date.now()}`;
  gameRooms.set(roomId, new GameRoom(roomId));
  return { roomId };
});

// WebSocket endpoint for game connections
fastify.register(async function (fastify) {
  fastify.get('/game/:roomId', { websocket: true }, (connection, req) => {
    const roomId = req.params.roomId;
    const alias = req.query.alias || 'anonymous';
    
    if (!gameRooms.has(roomId)) {
      connection.socket.send(JSON.stringify({
        type: "ERROR",
        message: "Room not found"
      }));
      connection.socket.close();
      return;
    }
    
    const room = gameRooms.get(roomId);
    room.addPlayer(connection, alias);
  });
});

// Start the server
await fastify.listen({ port: 3004, host: '0.0.0.0' });
console.log('Game service running on port 3004');