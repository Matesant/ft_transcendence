export class LobbyManager {
    constructor() {
        this.lobbies = new Map(); // lobbyId -> lobby
        this.counter = 0;
    }

    createLobby(host) {
        const id = `lobby_${++this.counter}_${Date.now()}`;
        const lobby = { id, host, players: [host] };
        this.lobbies.set(id, lobby);
        return lobby;
    }

    joinLobby(id, player) {
        const lobby = this.lobbies.get(id);
        if (!lobby || lobby.players.length >= 2) {
            return null;
        }
        lobby.players.push(player);
        return lobby;
    }

    removePlayer(playerId) {
        for (const [id, lobby] of this.lobbies) {
            const index = lobby.players.findIndex(p => p.id === playerId);
            if (index !== -1) {
                lobby.players.splice(index, 1);
                if (lobby.players.length === 0) {
                    this.lobbies.delete(id);
                }
                return id;
            }
        }
        return null;
    }

    getLobby(id) {
        return this.lobbies.get(id);
    }

    deleteLobby(id) {
        this.lobbies.delete(id);
    }
}
