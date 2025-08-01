export async function websocketRoutes(fastify, options) {
    const { gameManager, playerManager, roomManager } = options;

    fastify.get('/ws', { websocket: true }, (connection, req) => {
        console.log('New WebSocket connection established');
        
        connection.socket.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('Received message:', data);
                
                switch (data.type) {
                    case 'create_room':
                        await handleCreateRoom(connection, data, roomManager);
                        break;
                    case 'join_room':
                        await handleJoinRoom(connection, data, roomManager);
                        break;
                    case 'leave_room':
                        await handleLeaveRoom(connection, data, roomManager);
                        break;
                    case 'room_ready':
                        await handleRoomReady(connection, data, roomManager, gameManager);
                        break;
                    case 'game_input':
                        await handleGameInput(connection, data, gameManager);
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
            
            playerManager.removePlayer(connection);
            
            if (connection.roomCode && connection.playerId) {
                handleLeaveRoom(connection, {
                    playerId: connection.playerId,
                    roomCode: connection.roomCode
                }, roomManager);
            }
        });
        
        connection.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
}

export async function handleGameInput(connection, data, gameManager) {
    const gameRoom = gameManager.getGameByPlayerId(data.playerId);
    if (gameRoom) {
        gameRoom.handlePlayerInput(data.playerId, data.input);
    }
}

export async function handleCreateRoom(connection, data, roomManager) {
    try {
        const { playerId, playerName, roomCode } = data;
        
        if (roomManager.has(roomCode)) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Room already exists'
            }));
            return;
        }
        
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
            state: 'waiting'
        };
        
        roomManager.set(roomCode, room);
        
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

export async function handleJoinRoom(connection, data, roomManager) {
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
        
        if (room.players.length >= 2) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Room is full'
            }));
            return;
        }
        
        if (room.players.find(p => p.id === playerId)) {
            connection.socket.send(JSON.stringify({
                type: 'room_error',
                message: 'Already in room'
            }));
            return;
        }
        
        const newPlayer = {
            id: playerId,
            name: playerName,
            connection: connection,
            isHost: false,
            ready: false
        };
        
        room.players.push(newPlayer);
        
        connection.roomCode = roomCode;
        connection.playerId = playerId;
        
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

export async function handleLeaveRoom(connection, data, roomManager) {
    try {
        const { playerId, roomCode } = data;
        
        const room = roomManager.get(roomCode);
        if (!room) return;
        
        room.players = room.players.filter(p => p.id !== playerId);
        
        if (room.players.length === 0) {
            roomManager.delete(roomCode);
            console.log(`Room ${roomCode} deleted - no players left`);
        } else {
            if (room.host === playerId && room.players.length > 0) {
                room.host = room.players[0].id;
                room.players[0].isHost = true;
            }
            
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
        
        delete connection.roomCode;
        delete connection.playerId;
        
        console.log(`Player ${playerId} left room ${roomCode}`);
    } catch (error) {
        console.error('Error leaving room:', error);
    }
}

export async function handleRoomReady(connection, data, roomManager, gameManager) {
    try {
        const { playerId, roomCode, ready } = data;
        
        const room = roomManager.get(roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = ready;
        }
        
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
        
        if (room.players.length === 2 && room.players.every(p => p.ready)) {
            const player1 = room.players[0];
            const player2 = room.players[1];
            
            const gameRoom = gameManager.createGame(
                { id: player1.id, name: player1.name, connection: player1.connection },
                { id: player2.id, name: player2.name, connection: player2.connection }
            );
            
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
            
            gameRoom.startGame();
            
            roomManager.delete(roomCode);
            
            console.log(`Game started for room ${roomCode}`);
        }
    } catch (error) {
        console.error('Error handling room ready:', error);
    }
}
