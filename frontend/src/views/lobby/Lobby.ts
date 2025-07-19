import { AView } from "../AView";
import { Sidebar } from "../../components/sidebar/Sidebar";
import { NetworkManager } from "../game/managers/NetworkManager";
import { Game } from "../game/Game";

export class Lobby extends AView {
    private _network: NetworkManager = new NetworkManager();
    private _lobbyId: string | null = null;
    private _playerId: string = "";
    private _playerName: string = "";
    private _isHost: boolean = false;
    private _game: Game | null = null;

    public render(): void {
        document.body.innerHTML = `
        ${Sidebar.getHtml()}
        <div id="lobby-container" class="ml-64 p-8">
            <div class="max-w-md mx-auto bg-white p-4 rounded shadow">
                <div id="createJoin" class="space-y-2">
                    <button id="createLobby" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full">Criar Lobby</button>
                    <div class="flex space-x-2">
                        <input id="joinInput" class="border flex-grow px-2 py-2 rounded" placeholder="ID do Lobby" />
                        <button id="joinLobby" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Entrar</button>
                    </div>
                </div>
                <div id="lobbyInfo" class="hidden mt-4">
                    <p class="mb-2">Lobby ID: <span id="lobbyIdSpan" class="font-semibold"></span></p>
                    <ul id="playersList" class="mb-4 list-disc list-inside"></ul>
                    <button id="startBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded hidden">Iniciar Partida</button>
                </div>
            </div>
        </div>`;

        this._network.onLobbyCreated((data) => {
            this._lobbyId = data.lobbyId;
            this.updateLobby(data.players);
        });
        this._network.onLobbyUpdate((data) => {
            this._lobbyId = data.lobbyId;
            this.updateLobby(data.players);
        });
        this._network.onMatchFound(() => {
            this.startGame();
        });

        document.getElementById('createLobby')?.addEventListener('click', async () => {
            this._isHost = true;
            this.preparePlayer();
            await this._network.connect(this._playerId, this._playerName);
            this._network.createLobby();
        });

        document.getElementById('joinLobby')?.addEventListener('click', async () => {
            const id = (document.getElementById('joinInput') as HTMLInputElement).value;
            if (!id) return;
            this.preparePlayer();
            await this._network.connect(this._playerId, this._playerName);
            this._network.joinLobby(id);
        });

        document.getElementById('startBtn')?.addEventListener('click', () => {
            if (this._lobbyId) {
                this._network.startLobby(this._lobbyId);
            }
        });
    }

    private preparePlayer() {
        this._playerName = prompt('Seu nome:') || 'Anon';
        this._playerId = this.generateId();
    }

    private updateLobby(players: any[]) {
        const info = document.getElementById('lobbyInfo');
        const span = document.getElementById('lobbyIdSpan');
        const list = document.getElementById('playersList');
        if (!info || !span || !list || !this._lobbyId) return;
        info.classList.remove('hidden');
        span.textContent = this._lobbyId;
        list.innerHTML = '';
        players.forEach(p => {
            const li = document.createElement('li');
            li.textContent = p.name;
            list.appendChild(li);
        });
        const startBtn = document.getElementById('startBtn');
        if (this._isHost && players.length >= 2 && startBtn) {
            startBtn.classList.remove('hidden');
        }
    }

    private startGame() {
        const container = document.getElementById('lobby-container');
        if (container) container.innerHTML = '';
        this._game = new Game('remote', this._playerId, this._playerName, undefined, this._network);
        this._game.render();
    }

    private generateId(): string {
        return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    public dispose(): void {
        if (this._game) this._game.dispose();
        this._network.disconnect();
    }
}
