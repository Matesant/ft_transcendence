import { router } from "../router/Router";
import { apiUrl } from "../utils/api";

class playersTable extends HTMLElement {

    private async getPlayersHtml(): Promise<string> {
        try {
            const response = await fetch(apiUrl(3003, '/players'), {credentials: "include"});
            if (!response.ok) throw new Error("HTTP error");
            const players = await response.json();

            const sortedPlayers = players.sort((a: any, b: any) => {
                if (b.winrate !== a.winrate) {
                    return b.winrate - a.winrate;
                }
                return b.wins - a.wins;
            });

            const playersHtml = sortedPlayers.map((player: any, index: number) => {
                const totalGames = player.wins + player.losses;
                const rankBadge = this.getRankBadge(index + 1);
                const winrateColor = this.getWinrateColor(player.winrate);
                const avatarUrl = player.avatar ? `${apiUrl(3003, `/${player.avatar}`)}` : apiUrl(3003, '/uploads/default.jpeg');
                
                return `
                    <div class="ranking-player bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer" data-alias="${player.alias}">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                ${rankBadge}
                                <div class="flex items-center gap-2">
                                    <img src="${avatarUrl}" alt="${player.display_name || player.alias}" class="w-8 h-8 rounded-full object-cover border-2 border-white/30" onerror="this.src='${apiUrl(3003, '/uploads/default.jpeg')}'">
                                    <div>
                                        <h3 class="font-bold text-base text-white">${player.display_name || player.alias}</h3>
                                        <p class="text-xs text-white/70">@${player.alias}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-bold ${winrateColor}">${player.winrate}%</div>
                                <div class="text-xs text-white/60">Taxa de Vitória</div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div class="bg-white/10 rounded-lg p-2">
                                <div class="text-lg font-bold text-green-400">${player.wins}</div>
                                <div class="text-xs text-white/70">Vitórias</div>
                            </div>
                            <div class="bg-white/10 rounded-lg p-2">
                                <div class="text-lg font-bold text-red-400">${player.losses}</div>
                                <div class="text-xs text-white/70">Derrotas</div>
                            </div>
                            <div class="bg-white/10 rounded-lg p-2">
                                <div class="text-lg font-bold text-blue-400">${totalGames}</div>
                                <div class="text-xs text-white/70">Total</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join("");

            return `
                <div class="w-full">
                    <div class="text-center mb-6">
                        <h2 class="text-3xl font-bold text-white mb-2">🏆 Ranking </h2>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        ${playersHtml}
                    </div>
                </div>
            `;
        } catch (err) {
            return `
                <div class="w-full text-center">
                    <div class="bg-red-500/20 text-red-300 rounded-2xl p-8 border border-red-500/30">
                        <h2 class="text-xl font-bold mb-2">❌ Erro de Rede</h2>
                        <p class="text-sm">Não foi possível carregar o ranking dos jogadores.</p>
                    </div>
                </div>
            `;
        }
    }

    private getRankBadge(position: number): string {
        switch (position) {
            case 1:
                return '<div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">🥇</div>';
            case 2:
                return '<div class="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">🥈</div>';
            case 3:
                return '<div class="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">🥉</div>';
            default:
                return `<div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">${position}</div>`;
        }
    }

    private getWinrateColor(winrate: number): string {
        if (winrate >= 80) return 'text-green-400';
        if (winrate >= 60) return 'text-yellow-400';
        if (winrate >= 40) return 'text-orange-400';
        return 'text-red-400';
    }

    public async render(): Promise<void> {
        const rankingContent = await this.getPlayersHtml();
        this.innerHTML = rankingContent;

        const playerCards = this.querySelectorAll('.ranking-player');
        playerCards.forEach((card) => {
            card.addEventListener('click', () => {
                const alias = card.getAttribute('data-alias');
                if (alias) {
                    history.pushState(alias, "", "/player");
                    router();
                }
            });
        });
    }

  constructor() {
    super();
    this.render();
}

}

customElements.define("players-table", playersTable);
