import fastify from 'fastify';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';

import { GameRoom } from './managers/GameRoom.js';
import { GameManager } from './managers/GameManager.js';
import { PlayerManager } from './managers/PlayerManager.js';
import { LobbyManager } from './managers/LobbyManager.js';

dotenv.config();

const app = fastify({ 
    logger: true,
    keepAliveTimeout: 30000,
    connectionTimeout: 30000
});

// Register plugins
await app.register(cors, {
    origin: [
        'http://localhost:8080', 
        'http://localhost:3000',
        'http://192.168.15.147:8080',
        'http://192.168.15.147:3000'
    ],
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
const lobbyManager = new LobbyManager();

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
                    case 'create_lobby':
                        await handleCreateLobby(connection, data);
                        break;
                    case 'join_lobby':
                        await handleJoinLobby(connection, data);
                        break;
                    case 'start_game':
                        await handleStartGame(connection, data);
                        break;
                    case 'join_queue':
                        await handleJoinQueue(connection, data);
                        break;
                    case 'leave_queue':
                        await handleLeaveQueue(connection, data);
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
            const playerId = playerManager.connections.get(connection);
            const player = playerId ? playerManager.getPlayer(playerId) : null;
            playerManager.removePlayer(connection);
            if (player && player.lobbyId) {
                lobbyManager.removePlayer(player.lobbyId, player.id);
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

async function handleCreateLobby(connection, data) {
    const player = {
        id: data.playerId,
        name: data.playerName,
        connection: connection,
        joinedAt: Date.now()
    };
    playerManager.addPlayer(player);
    playerManager.removePlayerFromQueue(player.id);
    const lobby = lobbyManager.createLobby(player);
    const payload = {
        type: 'lobby_update',
        lobbyId: lobby.id,
        hostId: lobby.hostId,
        players: Array.from(lobby.players.values()).map(p => ({ id: p.id, name: p.name }))
    };
    lobby.players.forEach(p => {
        p.connection.socket.send(JSON.stringify(payload));
    });
}

async function handleJoinLobby(connection, data) {
    const player = {
        id: data.playerId,
        name: data.playerName,
        connection: connection,
        joinedAt: Date.now()
    };
    playerManager.addPlayer(player);
    playerManager.removePlayerFromQueue(player.id);
    const lobby = lobbyManager.joinLobby(data.lobbyId, player);
    if (!lobby) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }));
        return;
    }
    const payload = {
        type: 'lobby_update',
        lobbyId: lobby.id,
        hostId: lobby.hostId,
        players: Array.from(lobby.players.values()).map(p => ({ id: p.id, name: p.name }))
    };
    lobby.players.forEach(p => {
        p.connection.socket.send(JSON.stringify(payload));
    });
}

async function handleStartGame(connection, data) {
    const lobby = lobbyManager.getLobby(data.lobbyId);
    if (!lobby) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Lobby not found' }));
        return;
    }
    const playersArr = Array.from(lobby.players.values());
    if (playersArr.length < 2) {
        connection.socket.send(JSON.stringify({ type: 'error', message: 'Need more players' }));
        return;
    }
    const [p1, p2] = playersArr;
    const gameRoom = gameManager.createGame(p1, p2);
    lobbyManager.removeLobby(lobby.id);
    playersArr.forEach((p, idx) => {
        p.connection.socket.send(JSON.stringify({
            type: 'game_start',
            gameId: gameRoom.id,
            playerSide: idx === 0 ? 'left' : 'right',
            opponent: { id: idx === 0 ? p2.id : p1.id, name: idx === 0 ? p2.name : p1.name }
        }));
    });
    gameRoom.startGame();
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
