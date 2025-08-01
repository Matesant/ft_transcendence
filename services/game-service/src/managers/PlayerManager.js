export class PlayerManager {
    constructor() {
        this.players = new Map(); 
        this.connections = new Map();
    }

    addPlayer(player) {
        this.players.set(player.id, player);
        this.connections.set(player.connection, player.id);
        console.log(`Player ${player.name} (${player.id}) joined`);
    }

    removePlayer(connection) {
        const playerId = this.connections.get(connection);
        if (playerId) {
            const player = this.players.get(playerId);
            if (player) {
                console.log(`Player ${player.name} (${playerId}) disconnected`);
            }
            
            this.players.delete(playerId);
            this.connections.delete(connection);
        }
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
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
