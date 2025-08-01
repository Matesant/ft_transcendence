export async function gameRoutes(fastify, options) {
    const { gameManager, playerManager } = options;

    fastify.get('/games/stats', async (request, reply) => {
        return {
            totalGames: gameManager.getTotalGames(),
            activeGames: gameManager.getActiveGamesCount(),
            totalPlayers: playerManager.getTotalPlayers(),
            onlinePlayers: playerManager.getOnlinePlayersCount()
        };
    });

    fastify.post('/games/create', async (request, reply) => {
        try {
            const { player1Name = 'Player1', player2Name = 'Bot', gameMode = 'classic' } = request.body || {};
            
            const player1 = {
                id: `player_${Date.now()}_1`,
                name: player1Name,
                connection: null
            };
            
            const player2 = {
                id: `player_${Date.now()}_2`, 
                name: player2Name,
                connection: null
            };
            
            const gameRoom = gameManager.createGame(player1, player2);
            gameRoom.startGame();
            
            return {
                success: true,
                gameId: gameRoom.id,
                players: {
                    player1: { id: player1.id, name: player1.name },
                    player2: { id: player2.id, name: player2.name }
                },
                state: gameRoom.state,
                message: 'Game created successfully'
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    fastify.get('/games/:gameId', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const game = gameManager.getGame(gameId);
            
            if (!game) {
                reply.code(404).send({
                    success: false,
                    error: 'Game not found'
                });
                return;
            }
            
            return {
                success: true,
                gameId: game.id,
                state: game.state,
                gameState: game.gameState,
                players: {
                    player1: { id: game.player1.id, name: game.player1.name },
                    player2: { id: game.player2.id, name: game.player2.name }
                },
                lastActivity: game.lastActivity
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    fastify.get('/games/:gameId/state', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const game = gameManager.getGame(gameId);
            
            if (!game) {
                reply.code(404).send({
                    success: false,
                    error: 'Game not found'
                });
                return;
            }
            
            return {
                success: true,
                gameId: game.id,
                state: game.state,
                ball: {
                    x: game.gameState.ball.x,
                    z: game.gameState.ball.z,
                    velocityX: game.gameState.ball.velocityX,
                    velocityZ: game.gameState.ball.velocityZ
                },
                paddles: {
                    left: { x: game.gameState.paddles.left.x, z: game.gameState.paddles.left.z },
                    right: { x: game.gameState.paddles.right.x, z: game.gameState.paddles.right.z }
                },
                score: {
                    player1: game.gameState.score.player1,
                    player2: game.gameState.score.player2
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    fastify.post('/games/:gameId/move', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const { playerId, direction } = request.body || {};
            
            if (!playerId || !direction) {
                reply.code(400).send({
                    success: false,
                    error: 'playerId and direction are required'
                });
                return;
            }
            
            if (!['up', 'down', 'stop'].includes(direction)) {
                reply.code(400).send({
                    success: false,
                    error: 'direction must be: up, down, or stop'
                });
                return;
            }
            
            const game = gameManager.getGame(gameId);
            if (!game) {
                reply.code(404).send({
                    success: false,
                    error: 'Game not found'
                });
                return;
            }
            
            if (game.state !== 'playing') {
                reply.code(400).send({
                    success: false,
                    error: 'Game is not in playing state'
                });
                return;
            }
            
        let input = {};
        switch (direction) {
            case 'up':
                input = { action: 'move_left' };
                break;
            case 'down':
                input = { action: 'move_right' };
                break;
            case 'stop':
                input = { action: 'stop' };
                break;
        }            game.handlePlayerInput(playerId, input);
            
            return {
                success: true,
                gameId: game.id,
                playerId: playerId,
                direction: direction,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    fastify.post('/games/:gameId/join', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const { playerId, playerName = 'Player' } = request.body || {};
            
            const game = gameManager.getGame(gameId);
            if (!game) {
                reply.code(404).send({
                    success: false,
                    error: 'Game not found'
                });
                return;
            }
            
            return {
                success: true,
                gameId: game.id,
                playerId: playerId || `cli_player_${Date.now()}`,
                playerName: playerName,
                gameState: game.gameState,
                message: 'Joined game successfully'
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });

    fastify.delete('/games/:gameId', async (request, reply) => {
        try {
            const { gameId } = request.params;
            const game = gameManager.getGame(gameId);
            
            if (!game) {
                reply.code(404).send({
                    success: false,
                    error: 'Game not found'
                });
                return;
            }
            
            game.endGame('manual_stop');
            
            return {
                success: true,
                gameId: gameId,
                message: 'Game ended successfully'
            };
        } catch (error) {
            reply.code(500).send({
                success: false,
                error: error.message
            });
        }
    });
}
