import { AView } from "../AView";
import { PongHeader, PongFooter, PongButton, PongInput } from "../../components/ui";
import { generateRoomCode } from "../../utils/codeGenerator";

export class Lobby extends AView {
  private elements: HTMLElement[] = [];
  private container!: HTMLDivElement;

  // elementos usados na sala
  private playersList!: HTMLUListElement;
  private roomCodeEl!: HTMLSpanElement;
  private actionBtn!: HTMLButtonElement;
  private roomCode: string = "";

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

    // mostra o menu de seleção inicial
    this.showSelection();
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
    title.textContent = "🎮 Room Created";
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

    // gera e exibe o código
    this.roomCode = generateRoomCode();
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

    // adiciona o host
    const liYou = document.createElement("li");
    liYou.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,0.1);
      margin: 0.5rem 0;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #FFD700;
    `;

    const playerInfo = document.createElement("div");
    playerInfo.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    const icon = document.createElement("span");
    icon.textContent = "👑";
    icon.style.fontSize = "1.2rem";

    const name = document.createElement("span");
    name.textContent = "You";
    name.style.fontWeight = "bold";

    const status = document.createElement("span");
    status.textContent = "Host";
    status.style.cssText = `
      font-size: 0.8rem;
      opacity: 0.7;
      background: rgba(0,0,0,0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    `;

    playerInfo.append(icon, name);
    liYou.append(playerInfo, status);
    this.playersList.appendChild(liYou);
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

    main.appendChild(card);
    this.container.appendChild(main);
    this.container.appendChild(PongFooter());
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
        if (!code) { alert("Enter a code"); return; }
        this.roomCode = code;
        this.showCreateRoom();
        // TODO: chamar networkManager.joinRoom(code)
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
    // TODO: conectar no servidor usando this.roomCode
  }

  public dispose(): void {
    this.elements.forEach((el) => el.parentNode?.removeChild(el));
    this.elements = [];
  }
}
