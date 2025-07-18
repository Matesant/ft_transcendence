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
    private _currentStep: 'menu' | 'lobby' = 'menu';

    constructor() {
        super();
        this._network = new NetworkManager();
        this._playerId = 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        this._playerName = ''; // Will be set when user chooses
    }

    public async render() {
        console.log('[Lobby] Starting render...');
        
        // Check if there's a specific lobby ID in the URL
        const params = new URLSearchParams(window.location.search);
        const urlLobbyId = params.get('lobby');
        
        if (urlLobbyId) {
            // Direct join with lobby ID from URL
            this._lobbyId = urlLobbyId;
            await this._joinExistingLobby();
        } else {
            // Show menu to choose between create or join
            this._renderMenu();
        }
    }

    private _setupHandlers() {
        this._network.onLobbyUpdate((data) => {
            this._lobbyId = data.lobbyId;
            this._players = data.players;
            this._updateList();
        });

        this._network.onGameStart((data) => {
            this.dispose();
            const game = new Game('remote', this._playerId, this._playerName, () => {});
            game.render();
        });
    }

    private _renderUI() {
        console.log('[Lobby] Rendering UI...');
        
        // Clear the body and create main container
        document.body.innerHTML = '';
        this._container = document.createElement('div');
        this._container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
        `;

        // Title
        const title = document.createElement('h1');
        title.style.cssText = `
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 2rem;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        `;
        title.textContent = '🎮 Multiplayer Lobby';
        this._container.appendChild(title);

        // Lobby info card
        const infoCard = document.createElement('div');
        infoCard.style.cssText = `
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            min-width: 400px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        `;

        // Lobby code
        const codeTitle = document.createElement('h3');
        codeTitle.textContent = 'Código do Lobby';
        codeTitle.style.cssText = `
            font-size: 1.2rem;
            margin-bottom: 1rem;
            opacity: 0.9;
        `;
        infoCard.appendChild(codeTitle);

        const code = document.createElement('div');
        code.id = 'lobbyCode';
        code.style.cssText = `
            font-size: 2rem;
            font-weight: bold;
            background: rgba(0,0,0,0.2);
            padding: 1rem;
            border-radius: 8px;
            letter-spacing: 0.2rem;
            margin-bottom: 1rem;
        `;
        code.textContent = 'Gerando...';
        infoCard.appendChild(code);

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copiar Código';
        copyBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
            margin-right: 0.5rem;
        `;
        copyBtn.onmouseover = () => copyBtn.style.background = 'rgba(255,255,255,0.3)';
        copyBtn.onmouseout = () => copyBtn.style.background = 'rgba(255,255,255,0.2)';
        copyBtn.onclick = () => {
            if (this._lobbyId) {
                navigator.clipboard.writeText(this._lobbyId);
                copyBtn.textContent = '✅ Copiado!';
                setTimeout(() => copyBtn.textContent = '📋 Copiar Código', 2000);
            }
        };

        // Share link button
        const shareLinkBtn = document.createElement('button');
        shareLinkBtn.textContent = '🔗 Copiar Link';
        shareLinkBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        shareLinkBtn.onmouseover = () => shareLinkBtn.style.background = 'rgba(255,255,255,0.3)';
        shareLinkBtn.onmouseout = () => shareLinkBtn.style.background = 'rgba(255,255,255,0.2)';
        shareLinkBtn.onclick = () => {
            if (this._lobbyId) {
                const shareUrl = `${window.location.origin}/lobby?lobby=${this._lobbyId}`;
                navigator.clipboard.writeText(shareUrl);
                shareLinkBtn.textContent = '✅ Link Copiado!';
                setTimeout(() => shareLinkBtn.textContent = '🔗 Copiar Link', 2000);
            }
        };

        const shareButtonsContainer = document.createElement('div');
        shareButtonsContainer.style.display = 'flex';
        shareButtonsContainer.style.justifyContent = 'center';
        shareButtonsContainer.appendChild(copyBtn);
        shareButtonsContainer.appendChild(shareLinkBtn);
        infoCard.appendChild(shareButtonsContainer);

        this._container.appendChild(infoCard);

        // Players section
        const playersSection = document.createElement('div');
        playersSection.style.cssText = `
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            min-width: 400px;
            border: 1px solid rgba(255,255,255,0.2);
        `;

        const playersTitle = document.createElement('h3');
        playersTitle.textContent = '👥 Jogadores Conectados';
        playersTitle.style.cssText = `
            font-size: 1.5rem;
            margin-bottom: 1rem;
            text-align: center;
        `;
        playersSection.appendChild(playersTitle);

        const list = document.createElement('ul');
        list.id = 'playersList';
        list.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
        `;
        playersSection.appendChild(list);

        this._container.appendChild(playersSection);

        // Action buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 1rem;
            justify-content: center;
        `;

        // Start game button (only for host)
        const startBtn = document.createElement('button');
        startBtn.textContent = '🚀 Iniciar Partida';
        startBtn.id = 'startBtn';
        startBtn.style.cssText = `
            background: linear-gradient(45deg, #4CAF50, #45a049);
            border: none;
            color: white;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        `;
        startBtn.onmouseover = () => startBtn.style.transform = 'translateY(-2px)';
        startBtn.onmouseout = () => startBtn.style.transform = 'translateY(0)';
        startBtn.onclick = () => {
            if (this._lobbyId) {
                this._network.startGame(this._lobbyId);
            }
        };
        buttonsContainer.appendChild(startBtn);

        // Leave lobby button
        const leaveBtn = document.createElement('button');
        leaveBtn.textContent = '🚪 Sair do Lobby';
        leaveBtn.style.cssText = `
            background: linear-gradient(45deg, #f44336, #d32f2f);
            border: none;
            color: white;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        `;
        leaveBtn.onmouseover = () => leaveBtn.style.transform = 'translateY(-2px)';
        leaveBtn.onmouseout = () => leaveBtn.style.transform = 'translateY(0)';
        leaveBtn.onclick = () => {
            this.dispose();
            window.history.pushState({}, '', '/');
            const event = new PopStateEvent('popstate');
            window.dispatchEvent(event);
        };
        buttonsContainer.appendChild(leaveBtn);

        this._container.appendChild(buttonsContainer);

        document.body.appendChild(this._container);
        console.log('[Lobby] UI container added to body');
        this._updateList();
    }

    private _updateList() {
        if (!this._container) return;
        
        const codeDiv = this._container.querySelector('#lobbyCode') as HTMLDivElement;
        if (codeDiv && this._lobbyId) {
            codeDiv.textContent = this._lobbyId;
        }

        const list = this._container.querySelector('#playersList') as HTMLUListElement;
        if (list) {
            list.innerHTML = '';
            
            if (this._players.length === 0) {
                const emptyMessage = document.createElement('li');
                emptyMessage.textContent = 'Aguardando jogadores...';
                emptyMessage.style.cssText = `
                    text-align: center;
                    opacity: 0.7;
                    font-style: italic;
                    padding: 1rem;
                `;
                list.appendChild(emptyMessage);
            } else {
                this._players.forEach((p, index) => {
                    const li = document.createElement('li');
                    li.style.cssText = `
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background: rgba(255,255,255,0.1);
                        margin: 0.5rem 0;
                        padding: 1rem;
                        border-radius: 8px;
                        border-left: 4px solid ${index === 0 ? '#FFD700' : '#4CAF50'};
                    `;
                    
                    const playerInfo = document.createElement('div');
                    playerInfo.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    `;
                    
                    const icon = document.createElement('span');
                    icon.textContent = index === 0 ? '👑' : '🎮';
                    icon.style.fontSize = '1.2rem';
                    
                    const name = document.createElement('span');
                    name.textContent = p.name;
                    name.style.fontWeight = 'bold';
                    
                    const status = document.createElement('span');
                    status.textContent = index === 0 ? 'Host' : 'Player';
                    status.style.cssText = `
                        font-size: 0.8rem;
                        opacity: 0.7;
                        background: rgba(0,0,0,0.2);
                        padding: 0.2rem 0.5rem;
                        border-radius: 4px;
                    `;
                    
                    playerInfo.appendChild(icon);
                    playerInfo.appendChild(name);
                    li.appendChild(playerInfo);
                    li.appendChild(status);
                    list.appendChild(li);
                });
            }
        }

        const startBtn = this._container.querySelector('#startBtn') as HTMLButtonElement;
        if (startBtn) {
            const canStart = this._isHost && this._players.length >= 2;
            startBtn.style.display = this._isHost ? 'block' : 'none';
            startBtn.disabled = !canStart;
            startBtn.style.opacity = canStart ? '1' : '0.5';
            startBtn.style.cursor = canStart ? 'pointer' : 'not-allowed';
            
            if (!canStart && this._isHost) {
                startBtn.textContent = `🚀 Aguardando jogadores (${this._players.length}/2)`;
            } else if (canStart) {
                startBtn.textContent = '🚀 Iniciar Partida';
            }
        }
    }

    private _renderMenu() {
        console.log('[Lobby] Rendering menu...');
        
        document.body.innerHTML = '';
        this._container = document.createElement('div');
        this._container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
        `;

        // Title
        const title = document.createElement('h1');
        title.style.cssText = `
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 3rem;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        `;
        title.textContent = '🎮 Multiplayer Lobby';
        this._container.appendChild(title);

        // Menu container
        const menuContainer = document.createElement('div');
        menuContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2rem;
            max-width: 500px;
            width: 100%;
        `;

        // Create lobby option
        const createOption = document.createElement('div');
        createOption.style.cssText = `
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
            cursor: pointer;
            transition: all 0.3s;
        `;
        
        createOption.onmouseover = () => {
            createOption.style.background = 'rgba(255,255,255,0.2)';
            createOption.style.transform = 'translateY(-5px)';
        };
        createOption.onmouseout = () => {
            createOption.style.background = 'rgba(255,255,255,0.1)';
            createOption.style.transform = 'translateY(0)';
        };

        const createTitle = document.createElement('h2');
        createTitle.textContent = '🚀 Criar Novo Lobby';
        createTitle.style.cssText = `
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #4CAF50;
        `;
        
        const createDesc = document.createElement('p');
        createDesc.textContent = 'Crie um novo lobby e aguarde outros jogadores se conectarem';
        createDesc.style.cssText = `
            opacity: 0.8;
            line-height: 1.5;
        `;

        createOption.appendChild(createTitle);
        createOption.appendChild(createDesc);
        createOption.onclick = () => this._createNewLobby();

        // Join lobby option
        const joinOption = document.createElement('div');
        joinOption.style.cssText = `
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.2);
        `;

        const joinTitle = document.createElement('h2');
        joinTitle.textContent = '🔗 Entrar em Lobby';
        joinTitle.style.cssText = `
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #2196F3;
        `;
        
        const joinDesc = document.createElement('p');
        joinDesc.textContent = 'Digite o código do lobby para se conectar';
        joinDesc.style.cssText = `
            opacity: 0.8;
            margin-bottom: 1rem;
            line-height: 1.5;
        `;

        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.placeholder = 'Código do lobby (ex: lobby_1_123456)';
        codeInput.style.cssText = `
            width: 100%;
            padding: 1rem;
            border: none;
            border-radius: 8px;
            background: rgba(0,0,0,0.2);
            color: white;
            font-size: 1rem;
            margin-bottom: 1rem;
            text-align: center;
        `;
        codeInput.setAttribute('autocomplete', 'off');

        const joinBtn = document.createElement('button');
        joinBtn.textContent = 'Entrar no Lobby';
        joinBtn.style.cssText = `
            background: linear-gradient(45deg, #2196F3, #1976D2);
            border: none;
            color: white;
            padding: 1rem 2rem;
            font-size: 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            width: 100%;
        `;
        joinBtn.onmouseover = () => joinBtn.style.transform = 'translateY(-2px)';
        joinBtn.onmouseout = () => joinBtn.style.transform = 'translateY(0)';
        joinBtn.onclick = () => {
            const code = codeInput.value.trim();
            if (code) {
                this._joinLobbyWithCode(code);
            } else {
                alert('Por favor, digite o código do lobby');
            }
        };

        // Allow Enter key to join
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinBtn.click();
            }
        });

        joinOption.appendChild(joinTitle);
        joinOption.appendChild(joinDesc);
        joinOption.appendChild(codeInput);
        joinOption.appendChild(joinBtn);

        menuContainer.appendChild(createOption);
        menuContainer.appendChild(joinOption);

        // Back button
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Voltar';
        backBtn.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 2rem;
            transition: all 0.3s;
        `;
        backBtn.onmouseover = () => backBtn.style.background = 'rgba(255,255,255,0.2)';
        backBtn.onmouseout = () => backBtn.style.background = 'rgba(255,255,255,0.1)';
        backBtn.onclick = () => {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
        };

        this._container.appendChild(menuContainer);
        this._container.appendChild(backBtn);
        document.body.appendChild(this._container);
    }

    private async _createNewLobby() {
        // Get player name
        if (!this._getPlayerName()) return;
        
        this._isHost = true;
        this._currentStep = 'lobby';
        
        try {
            console.log('[Lobby] Creating new lobby...');
            await this._network.connect(this._playerId, this._playerName);
            this._setupHandlers();
            this._network.createLobby();
            this._renderUI();
        } catch (error) {
            console.error('[Lobby] Error creating lobby:', error);
            this._showError('Erro ao criar lobby: ' + error.message);
        }
    }

    private async _joinLobbyWithCode(code: string) {
        // Get player name
        if (!this._getPlayerName()) return;
        
        this._lobbyId = code;
        this._isHost = false;
        this._currentStep = 'lobby';
        
        try {
            console.log('[Lobby] Joining lobby with code:', code);
            await this._network.connect(this._playerId, this._playerName);
            this._setupHandlers();
            this._network.joinLobby(code);
            this._renderUI();
        } catch (error) {
            console.error('[Lobby] Error joining lobby:', error);
            this._showError('Erro ao entrar no lobby: ' + error.message);
        }
    }

    private async _joinExistingLobby() {
        // Get player name
        if (!this._getPlayerName()) return;
        
        this._isHost = false;
        this._currentStep = 'lobby';
        
        try {
            console.log('[Lobby] Joining existing lobby:', this._lobbyId);
            await this._network.connect(this._playerId, this._playerName);
            this._setupHandlers();
            this._network.joinLobby(this._lobbyId!);
            this._renderUI();
        } catch (error) {
            console.error('[Lobby] Error joining existing lobby:', error);
            this._showError('Erro ao entrar no lobby: ' + error.message);
        }
    }

    private _getPlayerName(): boolean {
        if (this._playerName) return true;
        
        let playerName = null;
        while (!playerName || playerName.trim().length === 0) {
            playerName = prompt('Digite seu nome para entrar no lobby:', 'Jogador');
            if (playerName === null) {
                // User cancelled, redirect to home
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
                return false;
            }
        }
        this._playerName = playerName.trim();
        return true;
    }

    private _showError(message: string) {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: Arial, sans-serif;
                padding: 20px;
                text-align: center;
            ">
                <div style="
                    background: rgba(244, 67, 54, 0.1);
                    border: 1px solid rgba(244, 67, 54, 0.3);
                    border-radius: 15px;
                    padding: 2rem;
                    max-width: 500px;
                    margin-bottom: 2rem;
                ">
                    <h2 style="color: #f44336; margin-bottom: 1rem;">❌ Erro</h2>
                    <p style="line-height: 1.5; margin-bottom: 2rem;">${message}</p>
                    <button onclick="window.location.reload()" style="
                        background: linear-gradient(45deg, #2196F3, #1976D2);
                        border: none;
                        color: white;
                        padding: 1rem 2rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                    ">Tentar Novamente</button>
                </div>
                <button onclick="history.back()" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                ">← Voltar</button>
            </div>
        `;
    }

    public dispose() {
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._network.disconnect();
    }
}
