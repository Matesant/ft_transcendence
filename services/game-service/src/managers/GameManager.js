import { GameRoom } from './GameRoom.js';

export class GameManager {
    constructor() {
        this.games = new Map(); // gameId -> GameRoom
        this.playerToGame = new Map(); // playerId -> gameId
        this.gameCounter = 0;
    }

    createGame(player1, player2) {
        this.gameCounter++;
        const gameId = `game_${this.gameCounter}_${Date.now()}`;
        
        const gameRoom = new GameRoom(gameId, player1, player2);
        
        this.games.set(gameId, gameRoom);
        this.playerToGame.set(player1.id, gameId);
        this.playerToGame.set(player2.id, gameId);
        
        console.log(`Created game ${gameId} with players ${player1.name} vs ${player2.name}`);
        
        // Set up game event listeners
        gameRoom.on('game_end', (result) => {
            this.handleGameEnd(gameId, result);
        });
        
        gameRoom.on('player_disconnect', (playerId) => {
            this.handlePlayerDisconnect(gameId, playerId);
        });
        
        return gameRoom;
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    getGameByPlayerId(playerId) {
        const gameId = this.playerToGame.get(playerId);
        return gameId ? this.games.get(gameId) : null;
    }

    handleGameEnd(gameId, result) {
        const game = this.games.get(gameId);
        if (game) {
            console.log(`Game ${gameId} ended. Winner: ${result.winner}`);
            
            // Remove players from mapping
            this.playerToGame.delete(game.player1.id);
            this.playerToGame.delete(game.player2.id);
            
            // Remove game
            this.games.delete(gameId);
        }
    }

    handlePlayerDisconnect(gameId, playerId) {
        const game = this.games.get(gameId);
        if (game) {
            console.log(`Player ${playerId} disconnected from game ${gameId}`);
            game.handlePlayerDisconnect(playerId);
        }
    }

    getTotalGames() {
        return this.gameCounter;
    }

    getActiveGamesCount() {
        return this.games.size;
    }

    // Clean up inactive games (called periodically)
    cleanupInactiveGames() {
        const now = Date.now();
        const GAME_TIMEOUT = 10 * 60 * 1000; // 10 minutes
        
        for (const [gameId, game] of this.games) {
            if (now - game.lastActivity > GAME_TIMEOUT) {
                console.log(`Cleaning up inactive game: ${gameId}`);
                this.handleGameEnd(gameId, { winner: null, reason: 'timeout' });
            }
        }
    }
}

// Clean up inactive games every 5 minutes
setInterval(() => {
    // This will be called from the main manager instance
}, 5 * 60 * 1000);
