export class PlayerManager {
    constructor() {
        this.players = new Map(); // playerId -> player object
        this.queue = new Map(); // playerId -> player object
        this.connections = new Map(); // connection -> playerId
    }

    addPlayer(player) {
        this.players.set(player.id, player);
        this.connections.set(player.connection, player.id);
        this.addToQueue(player);
        console.log(`Player ${player.name} (${player.id}) joined`);
    }

    addToQueue(player) {
        this.queue.set(player.id, player);
        console.log(`Player ${player.name} added to queue. Queue size: ${this.queue.size}`);
    }

    removePlayer(connection) {
        const playerId = this.connections.get(connection);
        if (playerId) {
            const player = this.players.get(playerId);
            if (player) {
                console.log(`Player ${player.name} (${playerId}) disconnected`);
            }
            
            this.players.delete(playerId);
            this.queue.delete(playerId);
            this.connections.delete(connection);
        }
    }

    removePlayerFromQueue(playerId) {
        this.queue.delete(playerId);
        console.log(`Player ${playerId} removed from queue. Queue size: ${this.queue.size}`);
    }

    findOpponent(playerId) {
        // Find the first player in queue that is not the current player
        for (const [id, player] of this.queue) {
            if (id !== playerId) {
                this.removePlayerFromQueue(id);
                this.removePlayerFromQueue(playerId);
                return player;
            }
        }
        return null;
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getQueueSize() {
        return this.queue.size;
    }

    getTotalPlayers() {
        return this.players.size;
    }

    getOnlinePlayersCount() {
        return this.players.size;
    }

    broadcastToPlayer(playerId, message) {
        const player = this.players.get(playerId);
        if (player && player.connection) {
            player.connection.socket.send(JSON.stringify(message));
        }
    }
}
