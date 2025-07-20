import { AView } from "../AView";
import { Game } from "../game/Game";
import { getWsManager } from "../../utils/connectionStore";

export class Online extends AView {
  private game!: Game;

  public render(parent: HTMLElement = document.body): void {
    const wsManager = getWsManager();
    if (!wsManager || !wsManager.socket) {
      parent.innerHTML = '<p>Connection not available.</p>';
      return;
    }

    const playerId = sessionStorage.getItem('playerId') || wsManager.playerId;
    const playerName = wsManager.playerName;
    const playerSide = sessionStorage.getItem('playerSide') as 'left' | 'right' | null;
    const opponentRaw = sessionStorage.getItem('opponent');
    const opponent = opponentRaw ? JSON.parse(opponentRaw) : undefined;
    const gameId = sessionStorage.getItem('gameId');

    this.game = new Game('remote', playerId, playerName, undefined, {
      socket: wsManager.socket,
      skipMenu: true,
      playerSide: playerSide ?? undefined,
      opponent,
      gameId: gameId ?? undefined
    });

    this.game.render();
  }

  public dispose(): void {
    if (this.game) {
      this.game.dispose();
    }
  }
}
