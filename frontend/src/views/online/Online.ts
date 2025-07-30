import { AView } from "../AView";
import { Game } from "../game/Game";
import { t } from "../../utils/LanguageContext";
import { getWsManager } from "../../utils/connectionStore";

export class Online extends AView {
  private languageListener?: () => void;
  private game!: Game;

  public render(parent: HTMLElement = document.body): void {
    if (this.languageListener) {
      window.removeEventListener('language-changed', this.languageListener);
    }
    this.languageListener = () => this.render(parent);
    window.addEventListener('language-changed', this.languageListener);
    const wsManager = getWsManager();
    if (!wsManager || !wsManager.socket) {
      parent.innerHTML = `<p>${t('connectionNotAvailable')}</p>`;
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
    if (this.languageListener) {
      window.removeEventListener('language-changed', this.languageListener);
      this.languageListener = undefined;
    }
    if (this.game) {
      this.game.dispose();
    }
  }
}
