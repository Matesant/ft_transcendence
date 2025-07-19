// src/views/Lobby.ts
import { AView } from "../AView";
import { PongHeader, PongFooter, PongButton } from "../../components/ui";
import { generateRoomCode } from "../../utils/codeGenerator";

export class Lobby extends AView {
  private elements: HTMLElement[] = [];
  private playersList!: HTMLUListElement;
  private roomCodeEl!: HTMLSpanElement;
  private actionBtn!: HTMLButtonElement;
  private roomCode: string = "";

  public render(parent: HTMLElement = document.body): void {
    // limpa conteúdo
    parent.innerHTML = "";

    // container principal
    const bg = document.createElement("div");
    bg.className = "min-h-screen flex flex-col bg-gray-100";
    bg.style.minHeight = "100vh";

    // header
    const header = PongHeader({ homeOnly: false });
    bg.appendChild(header);

    // área central
    const main = document.createElement("main");
    main.className =
      "flex flex-1 flex-col items-center justify-center w-full px-4";

    // card
    const card = document.createElement("div");
    card.className = "bg-white rounded-lg shadow-md w-full max-w-lg p-8";
    main.appendChild(card);

    // título
    const title = document.createElement("h2");
    title.className = "text-2xl font-bold mb-4 text-center";
    title.textContent = "Lobby";
    card.appendChild(title);

    // room code
    const codeDiv = document.createElement("div");
    codeDiv.className = "mb-6 flex items-center justify-center space-x-2";
    const codeLabel = document.createElement("span");
    codeLabel.className = "font-medium";
    codeLabel.textContent = "Room Code:";
    this.roomCodeEl = document.createElement("span");
    this.roomCodeEl.id = "roomCode";
    this.roomCodeEl.className = "text-xl font-bold";
    // Generate a room code
    this.roomCode = generateRoomCode(); // or use generateRoomCode() for simple alphanumeric
    this.roomCodeEl.textContent = this.roomCode;
    
    const copyBtn = PongButton({
      text: "Copy Link",
      variant: "secondary",
      onClick: () => this.onCopyLink(),
    });
    codeDiv.append(codeLabel, this.roomCodeEl, copyBtn);
    card.appendChild(codeDiv);

    // lista de jogadores
    const pListLabel = document.createElement("h3");
    pListLabel.className = "text-lg font-medium mb-2";
    pListLabel.textContent = "Players in room:";
    card.appendChild(pListLabel);
    this.playersList = document.createElement("ul");
    this.playersList.id = "playersList";
    this.playersList.className = "list-disc list-inside mb-6";
    card.appendChild(this.playersList);

    // botão de ação (Ready / Start)
    this.actionBtn = PongButton({
      text: "Ready",
      variant: "primary",
      onClick: () => this.onAction(),
    });
    this.actionBtn.classList.add(
      "w-full",
      "py-2",
      "text-lg",
      "font-semibold",
      "rounded-md"
    );
    card.appendChild(this.actionBtn);

    // footer
    const footer = PongFooter();

    bg.appendChild(main);
    bg.appendChild(footer);
    parent.appendChild(bg);
    this.elements.push(bg);

    // TODO: depois de renderizar, conecte seu NetworkManager:
    // - defina this.roomCodeEl.textContent
    // - atualize this.playersList com <li> para cada jogador
    // - ajuste this.actionBtn (texto e onClick) conforme host/guest
  }

  private onCopyLink(): void {
    const url = `${window.location.origin}/lobby?code=${this.roomCode}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }

  private onAction(): void {
    // TODO: disparar sinal de “ready” para o servidor, ou “start game” se for host
    console.log("Action button clicked");
  }

  public dispose(): void {
    this.elements.forEach((el) => el.parentNode?.removeChild(el));
    this.elements = [];
  }
}
