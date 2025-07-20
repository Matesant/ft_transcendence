import fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';

import { GameRoom } from './managers/GameRoom.js';
import { GameManager } from './managers/GameManager.js';
import { PlayerManager } from './managers/PlayerManager.js';

dotenv.config();

const app = fastify({ 
    logger: true,
    keepAliveTimeout: 30000,
    connectionTimeout: 30000
});

// Register plugins
await app.register(cors, {
    origin: true,
    credentials: true
});

await app.register(cookie);
await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key'
});

await app.register(websocket);

// Initialize managers
const gameManager = new GameManager();
const playerManager = new PlayerManager();

// Room management for private lobbies
const roomManager = new Map(); // roomCode -> { players: [], host: playerId, createdAt: timestamp }

// Health check
app.get('/health', async (request, reply) => {
    return { status: 'ok', service: 'game-service', timestamp: new Date().toISOString() };
});

// Game stats endpoint
app.get('/games/stats', async (request, reply) => {
    return {
        totalGames: gameManager.getTotalGames(),
        activeGames: gameManager.getActiveGamesCount(),
        totalPlayers: playerManager.getTotalPlayers(),
        onlinePlayers: playerManager.getOnlinePlayersCount()
    };
});

// WebSocket connection for real-time gameplay
app.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        console.log('New WebSocket connection established');
        
        connection.socket.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('Received message:', data);
                
                switch (data.type) {
                    case 'join_queue':
                        await handleJoinQueue(connection, data);
                        break;
                    case 'leave_queue':
                        await handleLeaveQueue(connection, data);
                        break;
                    case 'create_room':
                        await handleCreateRoom(connection, data);
                        break;
                    case 'join_room':
                        await handleJoinRoom(connection, data);
                        break;
                    case 'leave_room':
                        await handleLeaveRoom(connection, data);
                        break;
                    case 'room_ready':
                        await handleRoomReady(connection, data);
                        break;
                    case 'game_input':
                        await handleGameInput(connection, data);
                        break;
                    case 'ping':
                        connection.socket.send(JSON.stringify({ 
                            type: 'pong', 
                            timestamp: Date.now() 
                        }));
                        break;
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error processing message:', error);
                connection.socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });
        
        connection.socket.on('close', () => {
            console.log('WebSocket connection closed');
            
            // Clean up player from regular queue
            playerManager.removePlayer(connection);
            
            // Clean up from room if in one
            if (connection.roomCode && connection.playerId) {
                handleLeaveRoom(connection, {
                    playerId: connection.playerId,
                    roomCode: connection.roomCode
                });
            }
        });
        
        connection.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
});

// Handler functions
async function handleJoinQueue(connection, data) {
    try {
        const player = {
            id: data.playerId,
            name: data.playerName,
            connection: connection,
            joinedAt: Date.now()
        };
        
        playerManager.addPlayer(player);
        
        // Try to find a match
        const opponent = playerManager.findOpponent(player.id);
        
        if (opponent) {
            // Create a new game room
            const gameRoom = gameManager.createGame(player, opponent);
            
            // Notify both players that a match was found
            player.connection.socket.send(JSON.stringify({
                type: 'match_found',
                gameId: gameRoom.id,
                opponent: { id: opponent.id, name: opponent.name },
                playerSide: 'left' // First player is always left
            }));
            
            opponent.connection.socket.send(JSON.stringify({
                type: 'match_found',
                gameId: gameRoom.id,
                opponent: { id: player.id, name: player.name },
                playerSide: 'right' // Second player is always right
            }));
            
            // Start the game
            gameRoom.startGame();
        } else {
            // Add to queue
            connection.socket.send(JSON.stringify({
                type: 'queue_joined',
                message: 'Searching for opponent...',
                queueSize: playerManager.getQueueSize()
            }));
        }
    } catch (error) {
        console.error('Error handling join queue:', error);
        connection.socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to join queue'
        }));
    }
}

async function handleLeaveQueue(connection, data) {
    playerManager.removePlayerFromQueue(data.playerId);
    connection.socket.send(JSON.stringify({
        type: 'queue_left',
        message: 'Left the queue'
    }));
}

async function handleGameInput(connection, data) {
    const gameRoom = gameManager.getGameByPlayerId(data.playerId);
    if (gameRoom) {
        gameRoom.handlePlayerInput(data.playerId, data.input);
    }
}

// Room management handlers
async function handleCreateRoom(connection, data) {
    try {
        const { playerId, playerName, roomCode } = data;
        
        // Check if room already exists
        if (roomManager.has(roomCode)) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Room already exists'
            }));
            return;
        }
        
        // Create new room
        const room = {
            players: [{
                id: playerId,
                name: playerName,
                connection: connection,
                isHost: true,
                ready: false
            }],
            host: playerId,
            createdAt: Date.now(),
            state: 'waiting' // waiting, ready, playing
        };
        
        roomManager.set(roomCode, room);
        
        // Store room code in connection for cleanup
        connection.roomCode = roomCode;
        connection.playerId = playerId;
        
        connection.socket.send(JSON.stringify({
            type: 'room_created',
            roomCode: roomCode,
            players: room.players.map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.isHost,
                ready: p.ready
            }))
        }));
        
        console.log(`Room ${roomCode} created by ${playerName}`);
    } catch (error) {
        console.error('Error creating room:', error);
        connection.socket.send(JSON.stringify({
            type: 'room_error',
            message: 'Failed to create room'
        }));
    }
}

async function handleJoinRoom(connection, data) {
    try {
        const { playerId, playerName, roomCode } = data;
        
        const room = roomManager.get(roomCode);
        if (!room) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Room not found'
            }));
            return;
        }
        
        // Check if room is full (max 2 players for now)
        if (room.players.length >= 2) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Room is full'
            }));
            return;
        }
        
        // Check if player already in room
        if (room.players.find(p => p.id === playerId)) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Already in room'
            }));
            return;
        }
        
        // Add player to room
        const newPlayer = {
            id: playerId,
            name: playerName,
            connection: connection,
            isHost: false,
            ready: false
        };
        
        room.players.push(newPlayer);
        
        // Store room code in connection for cleanup
        connection.roomCode = roomCode;
        connection.playerId = playerId;
        
        // Notify all players in room
        const playersInfo = room.players.map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            ready: p.ready
        }));
        
        room.players.forEach(player => {
            player.connection.socket.send(JSON.stringify({
                type: 'room_updated',
                roomCode: roomCode,
                players: playersInfo
            }));
        });
        
        console.log(`${playerName} joined room ${roomCode}`);
    } catch (error) {
        console.error('Error joining room:', error);
        connection.socket.send(JSON.stringify({
            type: 'room_error',
            message: 'Failed to join room'
        }));
    }
}

async function handleLeaveRoom(connection, data) {
    try {
        const { playerId, roomCode } = data;
        
        const room = roomManager.get(roomCode);
        if (!room) return;
        
        // Remove player from room
        room.players = room.players.filter(p => p.id !== playerId);
        
        if (room.players.length === 0) {
            // Delete empty room
            roomManager.delete(roomCode);
            console.log(`Room ${roomCode} deleted - no players left`);
        } else {
            // If host left, assign new host
            if (room.host === playerId && room.players.length > 0) {
                room.host = room.players[0].id;
                room.players[0].isHost = true;
            }
            
            // Notify remaining players
            const playersInfo = room.players.map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.isHost,
                ready: p.ready
            }));
            
            room.players.forEach(player => {
                player.connection.socket.send(JSON.stringify({
                    type: 'room_updated',
                    roomCode: roomCode,
                    players: playersInfo
                }));
            });
        }
        
        // Clean connection data
        delete connection.roomCode;
        delete connection.playerId;
        
        console.log(`Player ${playerId} left room ${roomCode}`);
    } catch (error) {
        console.error('Error leaving room:', error);
    }
}

async function handleRoomReady(connection, data) {
    try {
        const { playerId, roomCode, ready } = data;
        
        const room = roomManager.get(roomCode);
        if (!room) return;
        
        // Update player ready status
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = ready;
        }
        
        // Notify all players in room
        const playersInfo = room.players.map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            ready: p.ready
        }));
        
        room.players.forEach(player => {
            player.connection.socket.send(JSON.stringify({
                type: 'room_updated',
                roomCode: roomCode,
                players: playersInfo
            }));
        });
        
        // Check if all players are ready and room has 2 players
        if (room.players.length === 2 && room.players.every(p => p.ready)) {
            // Start game
            const player1 = room.players[0];
            const player2 = room.players[1];
            
            // Create game room
            const gameRoom = gameManager.createGame(
                { id: player1.id, name: player1.name, connection: player1.connection },
                { id: player2.id, name: player2.name, connection: player2.connection }
            );
            
            // Notify players that game is starting
            player1.connection.socket.send(JSON.stringify({
                type: 'game_starting',
                gameId: gameRoom.id,
                playerSide: 'left',
                opponent: { id: player2.id, name: player2.name }
            }));
            
            player2.connection.socket.send(JSON.stringify({
                type: 'game_starting',
                gameId: gameRoom.id,
                playerSide: 'right',
                opponent: { id: player1.id, name: player1.name }
            }));
            
            // Start the game
            gameRoom.startGame();
            
            // Remove room from lobby system
            roomManager.delete(roomCode);
            
            console.log(`Game started for room ${roomCode}`);
        }
    } catch (error) {
        console.error('Error handling room ready:', error);
    }
}

const start = async () => {
    try {
        const port = process.env.PORT || 3004;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`🎮 Game Service started on port ${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
