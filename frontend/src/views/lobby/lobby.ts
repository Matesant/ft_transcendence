import { AView } from "../AView";
import { PongHeader, PongFooter, PongButton, PongInput } from "../../components/ui";
import { generateRoomCode } from "../../utils/codeGenerator";
import { WebSocketManager, RoomPlayer, RoomState } from "../../utils/WebSocketManager";
import { navigateTo } from "../../router/Router";
import { setWsManager } from "../../utils/connectionStore";
import { requireAuth, getCurrentUserDisplayName, UserProfile } from "../../utils/userUtils";

export class Lobby extends AView {
  private elements: HTMLElement[] = [];
  private container!: HTMLDivElement;

  private playersList!: HTMLUListElement;
  private roomCodeEl!: HTMLSpanElement;
  private actionBtn!: HTMLButtonElement;
  private roomCode: string = "";
  
  private wsManager!: WebSocketManager;
  private keepConnection: boolean = false;
  private isHost: boolean = false;
  private isConnecting: boolean = false;
  private isSearching: boolean = false;
  private currentPlayers: RoomPlayer[] = [];
  
  private currentUserDisplayName: string = "";

  public render(parent: HTMLElement = document.body): void {
    this.initializeLobby(parent);
  }

  private async initializeLobby(parent: HTMLElement): Promise<void> {
    const user = await requireAuth();
    if (!user) {
      return;
    }

    const displayName = await getCurrentUserDisplayName();
    if (!displayName) {
      console.error("Could not get user display name");
      navigateTo("/login");
      return;
    }
    this.currentUserDisplayName = displayName;

    parent.innerHTML = "";
    this.container = document.createElement("div");
    this.container.className = "min-h-screen flex flex-col bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-sans";
    parent.appendChild(this.container);
    this.elements.push(this.container);

    const headerContainer = document.createElement("div");
    headerContainer.className = "w-full";
    headerContainer.appendChild(PongHeader({ homeOnly: false }));
    this.container.appendChild(headerContainer);

    this.initializeWebSocket();

    this.showSelection();
  }

  private async initializeWebSocket(): Promise<void> {
    this.wsManager = new WebSocketManager();
    
    this.wsManager.onConnected(() => {
      this.isConnecting = false;
    });

    this.wsManager.onDisconnected(() => {
    });

    this.wsManager.onRoomCreated((data: RoomState) => {
      this.currentPlayers = data.players;
      this.updatePlayersDisplay();
    });

    this.wsManager.onRoomUpdated((data: RoomState) => {
      this.roomCode = data.roomCode;
      this.currentPlayers = data.players;
      
      if (!this.isHost && this.isSearching) {
        this.isSearching = false;
        this.showJoinedRoom(data);
      } else {
        this.updatePlayersDisplay();
      }
    });

    this.wsManager.onRoomError((error: string) => {
      console.error('Room error:', error);
      this.showError(error);
    });

    this.wsManager.onGameStarting((data: any) => {
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

  private showSelection() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-start pt-16 w-full px-4 max-w-5xl mx-auto";

    const title = document.createElement("h1");
    title.className = "text-5xl font-bold mb-12 text-center drop-shadow-lg";
    title.textContent = "🎮 Multiplayer Lobby";
    main.appendChild(title);

    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 w-full max-w-md";

    const cardTitle = document.createElement("h2");
    cardTitle.className = "text-2xl font-bold mb-6";
    cardTitle.textContent = "Choose an Option";
    card.appendChild(cardTitle);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex gap-4";

    const btnCreate = PongButton({
      text: "🚀 Create",
      variant: "primary",
      onClick: () => this.showCreateRoom()
    });
    btnCreate.className = "flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-green-500/25";

    const btnJoin = PongButton({
      text: "🔗 Join",
      variant: "secondary",
      onClick: () => this.showJoinRoom()
    });
    btnJoin.className = "flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/25";

    buttonsContainer.append(btnCreate, btnJoin);
    card.appendChild(buttonsContainer);
    main.appendChild(card);
    this.container.appendChild(main);

    this.container.appendChild(PongFooter());
  }

  private showCreateRoom() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-start pt-16 w-full px-4";

    const title = document.createElement("h1");
    title.className = "text-4xl font-bold mb-8 text-center drop-shadow-lg";

    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-lg";

    if (this.isConnecting) {
      const connectingText = document.createElement("p");
      connectingText.textContent = "Connecting to server...";
      connectingText.className = "text-center text-xl mb-8";
      card.appendChild(connectingText);
    } else if (!this.wsManager?.connected) {
      const errorText = document.createElement("p");
      errorText.textContent = "Failed to connect to server. Please try again.";
      errorText.className = "text-center text-xl text-red-400 mb-8";
      card.appendChild(errorText);

      const retryBtn = PongButton({
        text: "Retry Connection",
        variant: "primary",
        onClick: () => this.initializeWebSocket().then(() => this.showCreateRoom())
      });
      retryBtn.className = "w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200";
      card.appendChild(retryBtn);
    } else {
      this.setupRoomCreation(card);
    }

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());
  }

  private setupRoomCreation(card: HTMLElement): void {
    this.roomCode = generateRoomCode();
    this.isHost = true;
    
    this.wsManager.createRoom(this.roomCode, this.currentUserDisplayName);

    const title = document.createElement("h2");
    title.textContent = "🎮 Room Created";
    title.className = "text-3xl text-center mb-8";
    card.appendChild(title);

    const codeSection = document.createElement("div");
    codeSection.className = "text-center mb-8";

    const codeTitle = document.createElement("h3");
    codeTitle.textContent = "Room Code";
    codeTitle.className = "text-xl mb-4 opacity-90";
    codeSection.appendChild(codeTitle);

    this.roomCodeEl = document.createElement("div");
    this.roomCodeEl.id = "roomCode";
    this.roomCodeEl.className = "text-3xl font-bold bg-black/20 p-4 rounded-lg tracking-widest mb-4";
    this.roomCodeEl.textContent = this.roomCode;
    codeSection.appendChild(this.roomCodeEl);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex gap-2 justify-center";

    const copyBtn = PongButton({
      text: "📋 Copy Code",
      variant: "secondary",
      onClick: (e) => this.onCopyCode(e)
    });
    copyBtn.className = "bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg cursor-pointer transition-all duration-300";

    buttonsContainer.append(copyBtn);
    codeSection.appendChild(buttonsContainer);
    card.appendChild(codeSection);

    const playersSection = document.createElement("div");
    playersSection.className = "mb-8";

    const pListLabel = document.createElement("h3");
    pListLabel.className = "text-2xl mb-4 text-center";
    pListLabel.textContent = "👥 Players in Room";
    playersSection.appendChild(pListLabel);

    this.playersList = document.createElement("ul");
    this.playersList.id = "playersList";
    this.playersList.className = "list-none p-0 m-0";
    playersSection.appendChild(this.playersList);
    card.appendChild(playersSection);

    this.actionBtn = PongButton({
      text: "🚀 Ready",
      variant: "primary",
      onClick: () => this.onAction()
    });
    this.actionBtn.className = "w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-green-500/25";
    card.appendChild(this.actionBtn);
  }

  private showJoinRoom() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-start pt-16 w-full px-4";

    const title = document.createElement("h1");
    title.className = "text-4xl font-bold mb-8 text-center drop-shadow-lg";
    title.textContent = "🔗 Join Room";
    main.appendChild(title);

    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-md";

    const description = document.createElement("p");
    description.className = "text-center opacity-80 mb-8 leading-relaxed";
    description.textContent = "Enter the room code to connect";
    card.appendChild(description);

    const inputDiv = document.createElement("div");
    inputDiv.className = "mb-4";
    const input = PongInput({
      id: "joinCode",
      name: "code",
      type: "text",
      placeholder: "Enter room code",
      required: true
    });
    input.className = "w-full p-4 border-none rounded-lg bg-black/20 text-white text-base mb-4 text-center placeholder-white/60";
    input.setAttribute('autocomplete', 'off');
    inputDiv.appendChild(input);
    card.appendChild(inputDiv);

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
        this.wsManager.joinRoom(code, this.currentUserDisplayName);
      }
    });
    joinBtn.className = "w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/25";
    card.appendChild(joinBtn);

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        joinBtn.click();
      }
    });

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());
  }

  private showSearchingLobby() {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-start pt-16 w-full px-4";

    const title = document.createElement("h1");
    title.className = "text-4xl font-bold mb-8 text-center drop-shadow-lg";
    title.textContent = "🔍 Searching Lobby";
    main.appendChild(title);

    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 w-full max-w-md text-center";

    const loadingContainer = document.createElement("div");
    loadingContainer.className = "mb-8";

    const spinner = document.createElement("div");
    spinner.className = "w-15 h-15 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4";

    loadingContainer.appendChild(spinner);
    card.appendChild(loadingContainer);

    const searchingText = document.createElement("p");
    searchingText.className = "text-xl mb-4 opacity-90";
    searchingText.textContent = "Looking for lobby...";
    card.appendChild(searchingText);

    const codeText = document.createElement("p");
    codeText.className = "text-base opacity-70 mb-8 bg-black/20 py-2 px-4 rounded-lg tracking-wider";
    codeText.textContent = `Code: ${this.roomCode}`;
    card.appendChild(codeText);

    const cancelBtn = PongButton({
      text: "Cancel",
      variant: "secondary",
      onClick: () => this.showJoinRoom()
    });
    cancelBtn.className = "bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-white py-3 px-8 rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-1";
    card.appendChild(cancelBtn);

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());

  }

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
      const originalClass = btn.className;
      btn.textContent = "✅ Copied!";
      btn.className = "bg-green-500/30 text-white py-2 px-4 rounded-lg cursor-pointer transition-all duration-300";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.className = originalClass;
      }, 2000);
    });
  }

  private onAction(): void {
    
    if (!this.wsManager?.connected) {
      this.showError("Not connected to server");
      return;
    }

    const currentPlayer = this.currentPlayers.find(p => p.id === this.wsManager.playerId);
    const newReadyState = !currentPlayer?.ready;
    
    this.wsManager.setReady(newReadyState);
    
    this.actionBtn.textContent = newReadyState ? "⏳ Ready!" : "🚀 Ready";
  }

  private updatePlayersDisplay(): void {
    if (!this.playersList || !this.currentPlayers) return;

    this.playersList.innerHTML = '';

    this.currentPlayers.forEach(player => {
      const li = document.createElement("li");
      li.className = `flex items-center justify-between bg-white/10 my-2 p-4 rounded-lg border-l-4 ${player.isHost ? 'border-yellow-400' : 'border-blue-400'}`;

      const playerInfo = document.createElement("div");
      playerInfo.className = "flex items-center gap-2";

      const icon = document.createElement("span");
      icon.textContent = player.isHost ? "👑" : "👤";
      icon.className = "text-xl";

      const name = document.createElement("span");
      name.textContent = player.id === this.wsManager?.playerId ? "You" : player.name;
      name.className = "font-bold";

      const status = document.createElement("span");
      status.textContent = player.ready ? "Ready ✅" : (player.isHost ? "Host" : "Waiting");
      status.className = `text-sm opacity-70 bg-black/20 py-1 px-2 rounded ${player.ready ? 'text-green-400' : 'text-white'}`;

      playerInfo.append(icon, name);
      li.append(playerInfo, status);
      this.playersList.appendChild(li);
    });

    if (this.actionBtn) {
      const currentPlayer = this.currentPlayers.find(p => p.id === this.wsManager?.playerId);
      this.actionBtn.textContent = currentPlayer?.ready ? "⏳ Ready!" : "🚀 Ready";
    }
  }

  private showError(message: string): void {
    const errorDiv = document.createElement("div");
    errorDiv.className = "fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white py-4 px-8 rounded-lg z-50 text-base shadow-lg";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

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
    main.className = "flex flex-1 flex-col items-center justify-start pt-16 w-full px-4";

    const title = document.createElement("h1");
    title.className = "text-5xl font-bold mb-8 text-center drop-shadow-lg animate-pulse";
    title.textContent = "🎮 Game Starting!";
    main.appendChild(title);

    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 w-full max-w-lg text-center";

    const gameInfo = document.createElement("div");
    gameInfo.className = "mb-8";

    const opponentInfo = document.createElement("p");
    opponentInfo.className = "text-2xl mb-4";
    opponentInfo.textContent = `🎯 VS ${data.opponent.name}`;
    gameInfo.appendChild(opponentInfo);

    const sideInfo = document.createElement("p");
    sideInfo.className = "text-xl opacity-80 mb-8";
    sideInfo.textContent = `You are playing on the ${data.playerSide} side`;
    gameInfo.appendChild(sideInfo);

    const countdown = document.createElement("div");
    countdown.className = "text-6xl font-bold text-green-400";
    countdown.textContent = "3";
    gameInfo.appendChild(countdown);

    card.appendChild(gameInfo);
    main.appendChild(card);
    this.container.appendChild(main);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdown.textContent = count.toString();
      } else {
        countdown.textContent = "GO!";
        clearInterval(countdownInterval);
        
        setTimeout(() => {
          setWsManager(this.wsManager);
          sessionStorage.setItem('roomCode', this.roomCode);
          sessionStorage.setItem('playerId', this.wsManager.playerId);
          sessionStorage.setItem('playerSide', data.playerSide);
          sessionStorage.setItem('gameId', data.gameId);
          sessionStorage.setItem('opponent', JSON.stringify(data.opponent));
          this.keepConnection = true;
          navigateTo('/online');
        }, 1000);
      }
    }, 1000);
  }

  private showJoinedRoom(data: RoomState) {
    this.clearBody();

    const main = document.createElement("main");
    main.className = "flex flex-1 flex-col items-center justify-start pt-16 w-full px-4";

    const title = document.createElement("h1");
    title.className = "text-4xl font-bold mb-8 text-center drop-shadow-lg";
    title.textContent = "🎮 Joined Room!";
    main.appendChild(title);

    const card = document.createElement("div");
    card.className = "bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-lg";

    const successMessage = document.createElement("div");
    successMessage.className = "text-center mb-8 p-4 bg-green-500/20 rounded-lg border border-green-500/30";
    successMessage.textContent = "✅ Successfully joined the room!";
    card.appendChild(successMessage);

    const codeSection = document.createElement("div");
    codeSection.className = "text-center mb-8";

    const codeTitle = document.createElement("h3");
    codeTitle.textContent = "Room Code";
    codeTitle.className = "text-xl mb-4 opacity-90";
    codeSection.appendChild(codeTitle);

    this.roomCodeEl = document.createElement("div");
    this.roomCodeEl.className = "text-3xl font-bold bg-black/20 p-4 rounded-lg tracking-widest mb-4";
    this.roomCodeEl.textContent = this.roomCode;
    codeSection.appendChild(this.roomCodeEl);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex gap-2 justify-center";

    const copyBtn = PongButton({
      text: "📋 Copy Code",
      variant: "secondary",
      onClick: (e) => this.onCopyCode(e)
    });
    copyBtn.className = "bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg cursor-pointer transition-all duration-300";

    buttonsContainer.append(copyBtn);
    codeSection.appendChild(buttonsContainer);
    card.appendChild(codeSection);

    const playersSection = document.createElement("div");
    playersSection.className = "mb-8";

    const pListLabel = document.createElement("h3");
    pListLabel.className = "text-2xl mb-4 text-center";
    pListLabel.textContent = "👥 Players in Room";
    playersSection.appendChild(pListLabel);

    this.playersList = document.createElement("ul");
    this.playersList.id = "playersList";
    this.playersList.className = "list-none p-0 m-0";
    playersSection.appendChild(this.playersList);
    card.appendChild(playersSection);

    this.actionBtn = PongButton({
      text: "🚀 Ready",
      variant: "primary",
      onClick: () => this.onAction()
    });
    this.actionBtn.className = "w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-8 text-lg rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-green-500/25";
    card.appendChild(this.actionBtn);

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());

    this.updatePlayersDisplay();
  }

  public dispose(): void {
    if (this.wsManager && !this.keepConnection) {
      this.wsManager.leaveRoom();
      this.wsManager.disconnect();
    }
    
    this.elements.forEach((el) => el.parentNode?.removeChild(el));
    this.elements = [];
  }
}
