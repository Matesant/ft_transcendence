import { AView } from "../AView";
import { NetworkManager } from "../game/managers/NetworkManager";
import { Game } from "../game/Game";

export class Lobby extends AView {
    private _network: NetworkManager;
    private _players: { id: string; name: string }[] = [];
    private _lobbyId: string | null = null;
    private _playerId: string;
    private _playerName: string;
    private _isHost: boolean = false;
    private _container: HTMLDivElement | null = null;

    constructor() {
        super();
        this._network = new NetworkManager();
        this._playerId = 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        this._playerName = prompt('Enter your name:') || 'Player';
    }

    public async render() {
        const params = new URLSearchParams(window.location.search);
        this._lobbyId = params.get('lobby');

        await this._network.connect(this._playerId, this._playerName);
        this._setupHandlers();

        if (this._lobbyId) {
            this._isHost = false;
            this._network.joinLobby(this._lobbyId);
        } else {
            this._isHost = true;
            this._network.createLobby();
        }

        this._renderUI();
    }

    private _setupHandlers() {
        this._network.onLobbyUpdate((data) => {
            this._lobbyId = data.lobbyId;
            this._players = data.players;
            this._updateList();
        });

        this._network.onGameStart((data) => {
            console.log('[Lobby] Game starting, received data:', data);
            
            // Clean up lobby UI
            this.dispose();
            
            // Clear the entire body to ensure clean slate
            document.body.innerHTML = '';
            
            // Create and start the remote game
            console.log('[Lobby] Creating remote game with:', {
                playerId: this._playerId,
                playerName: this._playerName
            });
            
            const game = new Game('remote', this._playerId, this._playerName, () => {
                console.log('[Lobby] Remote game started successfully');
            }, true); // fromLobby = true
            
            // Start the game rendering
            game.render();
        });
    }

    private _renderUI() {
        this._container = document.createElement('div');
        this._container.className = 'flex flex-col items-center justify-center h-screen bg-gray-100';

        const title = document.createElement('h2');
        title.className = 'text-2xl font-bold mb-4';
        title.textContent = 'Lobby';
        this._container.appendChild(title);

        const code = document.createElement('div');
        code.className = 'mb-4 text-gray-700';
        code.id = 'lobbyCode';
        code.textContent = 'Code: ...';
        this._container.appendChild(code);

        const list = document.createElement('ul');
        list.id = 'playersList';
        list.className = 'mb-4';
        this._container.appendChild(list);

        const startBtn = document.createElement('button');
        startBtn.textContent = 'Iniciar Partida';
        startBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
        startBtn.onclick = () => {
            if (this._lobbyId) {
                this._network.startGame(this._lobbyId);
            }
        };
        startBtn.id = 'startBtn';
        this._container.appendChild(startBtn);

        document.body.appendChild(this._container);
        this._updateList();
    }

    private _updateList() {
        if (!this._container) return;
        const codeDiv = this._container.querySelector('#lobbyCode') as HTMLDivElement;
        if (codeDiv && this._lobbyId) {
            codeDiv.textContent = `Code: ${this._lobbyId}`;
        }

        const list = this._container.querySelector('#playersList') as HTMLUListElement;
        if (list) {
            list.innerHTML = '';
            this._players.forEach(p => {
                const li = document.createElement('li');
                li.textContent = p.name;
                li.className = 'text-gray-800';
                list.appendChild(li);
            });
        }

        const startBtn = this._container.querySelector('#startBtn') as HTMLButtonElement;
        if (startBtn) {
            startBtn.style.display = this._isHost ? 'block' : 'none';
        }
    }

    public dispose() {
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._network.disconnect();
    }
}
