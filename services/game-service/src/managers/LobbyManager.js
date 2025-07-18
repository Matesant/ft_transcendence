export class LobbyManager {
    constructor() {
        this.lobbies = new Map(); // lobbyId -> lobby object
        this.counter = 0;
    }

    createLobby(host) {
        this.counter++;
        const lobbyId = `lobby_${this.counter}_${Date.now()}`;
        const lobby = {
            id: lobbyId,
            hostId: host.id,
            players: new Map([[host.id, host]])
        };
        host.lobbyId = lobbyId;
        this.lobbies.set(lobbyId, lobby);
        return lobby;
    }

    joinLobby(lobbyId, player) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return null;
        lobby.players.set(player.id, player);
        player.lobbyId = lobbyId;
        return lobby;
    }

    removePlayer(lobbyId, playerId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return;
        lobby.players.delete(playerId);
        if (lobby.players.size === 0) {
            this.lobbies.delete(lobbyId);
        }
    }

    getLobby(lobbyId) {
        return this.lobbies.get(lobbyId);
    }

    removeLobby(lobbyId) {
        this.lobbies.delete(lobbyId);
    }
}
