import { AView } from "../AView";
import { PongHeader, PongFooter, PongButton, PongInput } from "../../components/ui";
import { generateRoomCode } from "../../utils/codeGenerator";
import { WebSocketManager, RoomPlayer, RoomState } from "../../utils/WebSocketManager";
import { navigateTo } from "../../router/Router";
import { setWsManager } from "../../utils/connectionStore";

export class Lobby extends AView {
  private elements: HTMLElement[] = [];
  private container!: HTMLDivElement;

  // elementos usados na sala
  private playersList!: HTMLUListElement;
  private roomCodeEl!: HTMLSpanElement;
  private actionBtn!: HTMLButtonElement;
  private roomCode: string = "";
  
  // WebSocket manager
  private wsManager!: WebSocketManager;
  private keepConnection: boolean = false;
  private isHost: boolean = false;
  private isConnecting: boolean = false;
  private isSearching: boolean = false;
  private currentPlayers: RoomPlayer[] = [];

  public render(parent: HTMLElement = document.body): void {
    parent.innerHTML = "";
    this.container = document.createElement("div");
    this.container.className = "min-h-screen flex flex-col";
    this.container.style.cssText = `
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: Arial, sans-serif;
    `;
    parent.appendChild(this.container);
    this.elements.push(this.container);

    // header
    this.container.appendChild(PongHeader({ homeOnly: false }));

    // Initialize WebSocket manager
    this.initializeWebSocket();

    // mostra o menu de seleção inicial
    this.showSelection();
  }

  private async initializeWebSocket(): Promise<void> {
    this.wsManager = new WebSocketManager();
    
    // Setup event handlers
    this.wsManager.onConnected(() => {
      console.log('Connected to game server');
      this.isConnecting = false;
    });

    this.wsManager.onDisconnected(() => {
      console.log('Disconnected from game server');
      this.showConnectionError();
    });

    this.wsManager.onRoomCreated((data: RoomState) => {
      console.log('Room created:', data);
      this.currentPlayers = data.players;
      this.updatePlayersDisplay();
    });

    this.wsManager.onRoomUpdated((data: RoomState) => {
      console.log('Room updated:', data);
      this.roomCode = data.roomCode;
      this.currentPlayers = data.players;
      
      // Se é um jogador que acabou de entrar (não é host e está procurando), mostrar a tela de joined
      if (!this.isHost && this.isSearching) {
        this.isSearching = false;
        this.showJoinedRoom(data);
      } else {
        // Caso contrário, apenas atualizar a lista de jogadores (para host ou jogadores já na sala)
        this.updatePlayersDisplay();
      }
    });

    this.wsManager.onRoomError((error: string) => {
      console.error('Room error:', error);
      this.showError(error);
    });

    this.wsManager.onGameStarting((data: any) => {
      console.log('Game starting:', data);
      this.showGameStarting(data);
    });

    try {
      this.isConnecting = true;
      await this.wsManager.connect();
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      this.showConnectionError();
    }
  }

  /** passo 1: cria os botões Create / Join */
  private showSelection() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-center w-full px-4";

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 3rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    title.textContent = "🎮 Multiplayer Lobby";
    main.appendChild(title);

    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 2rem;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
      max-width: 400px;
    `;

    const cardTitle = document.createElement("h2");
    cardTitle.className = "text-2xl font-bold mb-6";
    cardTitle.textContent = "Choose an Option";
    card.appendChild(cardTitle);

    const btnCreate = PongButton({
      text: "🚀 Create Room",
      variant: "primary",
      onClick: () => this.showCreateRoom()
    });
    btnCreate.style.cssText = `
      width: 100%;
      margin-bottom: 1rem;
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
    btnCreate.onmouseover = () => btnCreate.style.transform = 'translateY(-2px)';
    btnCreate.onmouseout = () => btnCreate.style.transform = 'translateY(0)';

    const btnJoin = PongButton({
      text: "🔗 Join Room",
      variant: "secondary",
      onClick: () => this.showJoinRoom()
    });
    btnJoin.style.cssText = `
      width: 100%;
      background: linear-gradient(45deg, #2196F3, #1976D2);
      border: none;
      color: white;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.2s;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    `;
    btnJoin.onmouseover = () => btnJoin.style.transform = 'translateY(-2px)';
    btnJoin.onmouseout = () => btnJoin.style.transform = 'translateY(0)';

    card.append(btnCreate, btnJoin);
    main.appendChild(card);
    this.container.appendChild(main);

    // footer
    this.container.appendChild(PongFooter());
  }

  /** passo 2a: flow de criação de sala */
  private showCreateRoom() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-center w-full px-4";

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 2rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;

    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 2rem;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
      max-width: 500px;
    `;

    if (this.isConnecting) {
      // Show connecting state
      const connectingText = document.createElement("p");
      connectingText.textContent = "Connecting to server...";
      connectingText.style.cssText = `
        text-align: center;
        font-size: 1.2rem;
        margin-bottom: 2rem;
      `;
      card.appendChild(connectingText);
    } else if (!this.wsManager?.connected) {
      // Show connection error
      const errorText = document.createElement("p");
      errorText.textContent = "Failed to connect to server. Please try again.";
      errorText.style.cssText = `
        text-align: center;
        font-size: 1.2rem;
        color: #f44336;
        margin-bottom: 2rem;
      `;
      card.appendChild(errorText);

      const retryBtn = PongButton({
        text: "Retry Connection",
        variant: "primary",
        onClick: () => this.initializeWebSocket().then(() => this.showCreateRoom())
      });
      retryBtn.style.cssText = `
        width: 100%;
        background: linear-gradient(45deg, #4CAF50, #45a049);
        border: none;
        color: white;
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border-radius: 10px;
        cursor: pointer;
      `;
      card.appendChild(retryBtn);
    } else {
      // Connected - create room
      this.setupRoomCreation(card);
    }

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());
  }

  private setupRoomCreation(card: HTMLElement): void {
    // gera e exibe o código
    this.roomCode = generateRoomCode();
    this.isHost = true;
    
    // Create room on server
    this.wsManager.createRoom(this.roomCode, "Host Player");

    const title = document.createElement("h2");
    title.textContent = "🎮 Room Created";
    title.style.cssText = `
      font-size: 2rem;
      text-align: center;
      margin-bottom: 2rem;
    `;
    card.appendChild(title);

    const codeSection = document.createElement("div");
    codeSection.style.cssText = `
      text-align: center;
      margin-bottom: 2rem;
    `;

    const codeTitle = document.createElement("h3");
    codeTitle.textContent = "Room Code";
    codeTitle.style.cssText = `
      font-size: 1.2rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    `;
    codeSection.appendChild(codeTitle);

    this.roomCodeEl = document.createElement("div");
    this.roomCodeEl.id = "roomCode";
    this.roomCodeEl.style.cssText = `
      font-size: 2rem;
      font-weight: bold;
      background: rgba(0,0,0,0.2);
      padding: 1rem;
      border-radius: 8px;
      letter-spacing: 0.2rem;
      margin-bottom: 1rem;
    `;
    this.roomCodeEl.textContent = this.roomCode;
    codeSection.appendChild(this.roomCodeEl);

    // botões de copiar
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    `;

    const copyBtn = PongButton({
      text: "📋 Copy Code",
      variant: "secondary",
      onClick: (e) => this.onCopyCode(e)
    });
    copyBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    copyBtn.onmouseover = () => copyBtn.style.background = 'rgba(255,255,255,0.3)';
    copyBtn.onmouseout = () => copyBtn.style.background = 'rgba(255,255,255,0.2)';

    const shareLinkBtn = PongButton({
      text: "🔗 Copy Link",
      variant: "secondary",
      onClick: (e) => this.onCopyLink(e)
    });
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

    buttonsContainer.append(copyBtn, shareLinkBtn);
    codeSection.appendChild(buttonsContainer);
    card.appendChild(codeSection);

    // lista de jogadores
    const playersSection = document.createElement("div");
    playersSection.style.cssText = `
      margin-bottom: 2rem;
    `;

    const pListLabel = document.createElement("h3");
    pListLabel.style.cssText = `
      font-size: 1.5rem;
      margin-bottom: 1rem;
      text-align: center;
    `;
    pListLabel.textContent = "👥 Players in Room";
    playersSection.appendChild(pListLabel);

    this.playersList = document.createElement("ul");
    this.playersList.id = "playersList";
    this.playersList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0;
    `;
    playersSection.appendChild(this.playersList);
    card.appendChild(playersSection);

    // botão Ready
    this.actionBtn = PongButton({
      text: "🚀 Ready",
      variant: "primary",
      onClick: () => this.onAction()
    });
    this.actionBtn.style.cssText = `
      width: 100%;
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
    this.actionBtn.onmouseover = () => this.actionBtn.style.transform = 'translateY(-2px)';
    this.actionBtn.onmouseout = () => this.actionBtn.style.transform = 'translateY(0)';
    card.appendChild(this.actionBtn);
  }

  /** passo 2b: flow de entrar numa sala existente */
  private showJoinRoom() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-center w-full px-4";

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 2rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    title.textContent = "🔗 Join Room";
    main.appendChild(title);

    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 2rem;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
      max-width: 400px;
    `;

    const description = document.createElement("p");
    description.style.cssText = `
      text-align: center;
      opacity: 0.8;
      margin-bottom: 2rem;
      line-height: 1.5;
    `;
    description.textContent = "Enter the room code to connect";
    card.appendChild(description);

    // input de código
    const inputDiv = document.createElement("div");
    inputDiv.className = "mb-4";
    const input = PongInput({
      id: "joinCode",
      name: "code",
      type: "text",
      placeholder: "Enter room code",
      required: true
    });
    input.style.cssText = `
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
    input.setAttribute('autocomplete', 'off');
    inputDiv.appendChild(input);
    card.appendChild(inputDiv);

    // botão Join
    const joinBtn = PongButton({
      text: "Join Room",
      variant: "primary",
      onClick: () => {
        const code = (document.getElementById("joinCode") as HTMLInputElement).value.trim();
        if (!code) { 
          this.showError("Please enter a room code"); 
          return; 
        }
        if (!this.wsManager?.connected) {
          this.showError("Not connected to server");
          return;
        }
        this.roomCode = code;
        this.isHost = false;
        this.isSearching = true;
        this.showSearchingLobby();
        this.wsManager.joinRoom(code, "Player");
      }
    });
    joinBtn.style.cssText = `
      width: 100%;
      background: linear-gradient(45deg, #2196F3, #1976D2);
      border: none;
      color: white;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.2s;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    `;
    joinBtn.onmouseover = () => joinBtn.style.transform = 'translateY(-2px)';
    joinBtn.onmouseout = () => joinBtn.style.transform = 'translateY(0)';
    card.appendChild(joinBtn);

    // Enter key support
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinBtn.click();
      }
    });

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());
  }

  /** passo 2c: tela de procurando lobby */
  private showSearchingLobby() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-center w-full px-4";

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 2rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    title.textContent = "🔍 Searching Lobby";
    main.appendChild(title);

    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 3rem;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
      max-width: 400px;
      text-align: center;
    `;

    // Loading animation
    const loadingContainer = document.createElement("div");
    loadingContainer.style.cssText = `
      margin-bottom: 2rem;
    `;

    const spinner = document.createElement("div");
    spinner.style.cssText = `
      width: 60px;
      height: 60px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    loadingContainer.appendChild(spinner);
    card.appendChild(loadingContainer);

    const searchingText = document.createElement("p");
    searchingText.style.cssText = `
      font-size: 1.2rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    `;
    searchingText.textContent = "Looking for lobby...";
    card.appendChild(searchingText);

    const codeText = document.createElement("p");
    codeText.style.cssText = `
      font-size: 1rem;
      opacity: 0.7;
      margin-bottom: 2rem;
      background: rgba(0,0,0,0.2);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      letter-spacing: 0.1rem;
    `;
    codeText.textContent = `Code: ${this.roomCode}`;
    card.appendChild(codeText);

    // Cancel button
    const cancelBtn = PongButton({
      text: "Cancel",
      variant: "secondary",
      onClick: () => this.showJoinRoom()
    });
    cancelBtn.style.cssText = `
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid rgba(244, 67, 54, 0.3);
      color: white;
      padding: 0.8rem 2rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    `;
    cancelBtn.onmouseover = () => {
      cancelBtn.style.background = 'rgba(244, 67, 54, 0.3)';
      cancelBtn.style.transform = 'translateY(-2px)';
    };
    cancelBtn.onmouseout = () => {
      cancelBtn.style.background = 'rgba(244, 67, 54, 0.2)';
      cancelBtn.style.transform = 'translateY(0)';
    };
    card.appendChild(cancelBtn);

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());

    // The WebSocket event handlers will handle the actual room join response
  }

  /** limpa somente o corpo, mantendo header/footer */
  private clearBody() {
    const children = Array.from(this.container.children);
    for (let i = 1; i < children.length - 1; i++) {
      this.container.removeChild(children[i]);
    }
  }

  private onCopyCode(event: Event): void {
    navigator.clipboard.writeText(this.roomCode).then(() => {
      const btn = event.target as HTMLButtonElement;
      const originalText = btn.textContent;
      btn.textContent = "✅ Copied!";
      btn.style.background = "rgba(76, 175, 80, 0.3)";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "rgba(255,255,255,0.2)";
      }, 2000);
    });
  }

  private onCopyLink(event: Event): void {
    const url = `${window.location.origin}/lobby?code=${this.roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      const btn = event.target as HTMLButtonElement;
      const originalText = btn.textContent;
      btn.textContent = "✅ Link Copied!";
      btn.style.background = "rgba(76, 175, 80, 0.3)";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "rgba(255,255,255,0.2)";
      }, 2000);
    });
  }

  private onAction(): void {
    console.log("Ready / Start pressed for room", this.roomCode);
    
    if (!this.wsManager?.connected) {
      this.showError("Not connected to server");
      return;
    }

    // Toggle ready state
    const currentPlayer = this.currentPlayers.find(p => p.id === this.wsManager.playerId);
    const newReadyState = !currentPlayer?.ready;
    
    this.wsManager.setReady(newReadyState);
    
    // Update button text
    this.actionBtn.textContent = newReadyState ? "⏳ Ready!" : "🚀 Ready";
  }

  // Helper methods for WebSocket integration
  private updatePlayersDisplay(): void {
    if (!this.playersList || !this.currentPlayers) return;

    // Clear current list
    this.playersList.innerHTML = '';

    this.currentPlayers.forEach(player => {
      const li = document.createElement("li");
      li.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255,255,255,0.1);
        margin: 0.5rem 0;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid ${player.isHost ? '#FFD700' : '#2196F3'};
      `;

      const playerInfo = document.createElement("div");
      playerInfo.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.5rem;
      `;

      const icon = document.createElement("span");
      icon.textContent = player.isHost ? "👑" : "👤";
      icon.style.fontSize = "1.2rem";

      const name = document.createElement("span");
      name.textContent = player.id === this.wsManager?.playerId ? "You" : player.name;
      name.style.fontWeight = "bold";

      const status = document.createElement("span");
      status.textContent = player.ready ? "Ready ✅" : (player.isHost ? "Host" : "Waiting");
      status.style.cssText = `
        font-size: 0.8rem;
        opacity: 0.7;
        background: rgba(0,0,0,0.2);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        color: ${player.ready ? '#4CAF50' : 'white'};
      `;

      playerInfo.append(icon, name);
      li.append(playerInfo, status);
      this.playersList.appendChild(li);
    });

    // Update action button text based on current player's ready state
    if (this.actionBtn) {
      const currentPlayer = this.currentPlayers.find(p => p.id === this.wsManager?.playerId);
      this.actionBtn.textContent = currentPlayer?.ready ? "⏳ Ready!" : "🚀 Ready";
    }
  }

  private showError(message: string): void {
    // Create a temporary error message
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(244, 67, 54, 0.9);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 2000;
      font-size: 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  private showConnectionError(): void {
    this.showError("Failed to connect to game server. Please check your connection.");
  }

  private showGameStarting(data: any): void {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-center w-full px-4";

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 2rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    `;
    title.textContent = "🎮 Game Starting!";

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    main.appendChild(title);

    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 3rem;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
      max-width: 500px;
      text-align: center;
    `;

    const gameInfo = document.createElement("div");
    gameInfo.style.cssText = `
      margin-bottom: 2rem;
    `;

    const opponentInfo = document.createElement("p");
    opponentInfo.style.cssText = `
      font-size: 1.5rem;
      margin-bottom: 1rem;
    `;
    opponentInfo.textContent = `🎯 VS ${data.opponent.name}`;
    gameInfo.appendChild(opponentInfo);

    const sideInfo = document.createElement("p");
    sideInfo.style.cssText = `
      font-size: 1.2rem;
      opacity: 0.8;
      margin-bottom: 2rem;
    `;
    sideInfo.textContent = `You are playing on the ${data.playerSide} side`;
    gameInfo.appendChild(sideInfo);

    const countdown = document.createElement("div");
    countdown.style.cssText = `
      font-size: 4rem;
      font-weight: bold;
      color: #4CAF50;
    `;
    countdown.textContent = "3";
    gameInfo.appendChild(countdown);

    card.appendChild(gameInfo);
    main.appendChild(card);
    this.container.appendChild(main);

    // Countdown timer
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdown.textContent = count.toString();
      } else {
        countdown.textContent = "GO!";
        clearInterval(countdownInterval);
        
        // Redirect to game after a short delay
        setTimeout(() => {
          setWsManager(this.wsManager);
          sessionStorage.setItem('roomCode', this.roomCode);
          sessionStorage.setItem('playerId', this.wsManager.playerId);
          sessionStorage.setItem('playerSide', data.playerSide);
          sessionStorage.setItem('gameId', data.gameId);
          sessionStorage.setItem('opponent', JSON.stringify(data.opponent));
          this.keepConnection = true;
          navigateTo('/online');
        }, 3000);
      }
    }, 1000);
  }

  /** Tela para quando o jogador entra em uma sala existente */
  private showJoinedRoom(data: RoomState) {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-center w-full px-4";

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 2rem;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    title.textContent = "🎮 Joined Room!";
    main.appendChild(title);

    const card = document.createElement("div");
    card.style.cssText = `
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 2rem;
      border: 1px solid rgba(255,255,255,0.2);
      width: 100%;
      max-width: 500px;
    `;

    const successMessage = document.createElement("div");
    successMessage.style.cssText = `
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(76, 175, 80, 0.2);
      border-radius: 8px;
      border: 1px solid rgba(76, 175, 80, 0.3);
    `;
    successMessage.textContent = "✅ Successfully joined the room!";
    card.appendChild(successMessage);

    // Room code display
    const codeSection = document.createElement("div");
    codeSection.style.cssText = `
      text-align: center;
      margin-bottom: 2rem;
    `;

    const codeTitle = document.createElement("h3");
    codeTitle.textContent = "Room Code";
    codeTitle.style.cssText = `
      font-size: 1.2rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    `;
    codeSection.appendChild(codeTitle);

    this.roomCodeEl = document.createElement("div");
    this.roomCodeEl.style.cssText = `
      font-size: 2rem;
      font-weight: bold;
      background: rgba(0,0,0,0.2);
      padding: 1rem;
      border-radius: 8px;
      letter-spacing: 0.2rem;
      margin-bottom: 1rem;
    `;
    this.roomCodeEl.textContent = this.roomCode;
    codeSection.appendChild(this.roomCodeEl);

    // Copy buttons
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    `;

    const copyBtn = PongButton({
      text: "📋 Copy Code",
      variant: "secondary",
      onClick: (e) => this.onCopyCode(e)
    });
    copyBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    copyBtn.onmouseover = () => copyBtn.style.background = 'rgba(255,255,255,0.3)';
    copyBtn.onmouseout = () => copyBtn.style.background = 'rgba(255,255,255,0.2)';

    const shareLinkBtn = PongButton({
      text: "🔗 Copy Link",
      variant: "secondary",
      onClick: (e) => this.onCopyLink(e)
    });
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

    buttonsContainer.append(copyBtn, shareLinkBtn);
    codeSection.appendChild(buttonsContainer);
    card.appendChild(codeSection);

    // Players list
    const playersSection = document.createElement("div");
    playersSection.style.cssText = `
      margin-bottom: 2rem;
    `;

    const pListLabel = document.createElement("h3");
    pListLabel.style.cssText = `
      font-size: 1.5rem;
      margin-bottom: 1rem;
      text-align: center;
    `;
    pListLabel.textContent = "👥 Players in Room";
    playersSection.appendChild(pListLabel);

    this.playersList = document.createElement("ul");
    this.playersList.id = "playersList";
    this.playersList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0;
    `;
    playersSection.appendChild(this.playersList);
    card.appendChild(playersSection);

    // Ready button
    this.actionBtn = PongButton({
      text: "🚀 Ready",
      variant: "primary",
      onClick: () => this.onAction()
    });
    this.actionBtn.style.cssText = `
      width: 100%;
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
    this.actionBtn.onmouseover = () => this.actionBtn.style.transform = 'translateY(-2px)';
    this.actionBtn.onmouseout = () => this.actionBtn.style.transform = 'translateY(0)';
    card.appendChild(this.actionBtn);

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());

    // Update players display with initial data
    this.updatePlayersDisplay();
  }

  public dispose(): void {
    // Disconnect from WebSocket
    if (this.wsManager && !this.keepConnection) {
      this.wsManager.leaveRoom();
      this.wsManager.disconnect();
    }
    
    this.elements.forEach((el) => el.parentNode?.removeChild(el));
    this.elements = [];
  }
}
