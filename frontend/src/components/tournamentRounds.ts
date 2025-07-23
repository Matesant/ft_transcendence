import { router } from "../router/Router";
import { apiUrl } from "../utils/api";

class tournamentRounds extends HTMLElement {

    constructor() {
        super();
    }

    async connectedCallback() {
        await this._fetchTournamentData();
    }

    private async _fetchTournamentData(): Promise<void> {
        let tournamentData: any = null;

        try {
            let response = await fetch(apiUrl(3002, '/match/tournament'), {credentials: 'include'});
            tournamentData = await response.json();
        } catch (error) {
            console.error('Erro ao buscar dados do torneio:', error);
        }

        this.innerHTML = `
            <!-- Tournament rounds with glassmorphism design -->
            <div class="w-full max-w-5xl mx-auto">
                <div class="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col max-h-[80vh]">
                    <h2 class="text-3xl font-bold text-center mb-8 text-white drop-shadow-lg">🏆 Rodadas do Torneio</h2>
                    <p class="text-white/80 text-center mb-8 text-lg">Acompanhe o progresso das partidas</p>

                    <!-- Container com scroll para as rodadas -->
                    <div class="flex-1 overflow-y-auto mb-8">
                        <div id="tournamentRounds" class="space-y-6 pr-2 custom-scrollbar">
                            <!-- As rodadas serão inseridas aqui via JavaScript -->
                        </div>
                    </div>
                    
                    <!-- Botões fixos na parte inferior -->
                    <div id="button-container" class="flex gap-4 justify-center flex-shrink-0">
                        <button id="iniciar-partida" class="bg-green-500/80 hover:bg-green-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-green-400/30">
                            🎮 Iniciar Partida
                        </button>
                        <button id="novo-torneio" class="bg-purple-500/80 hover:bg-purple-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-purple-400/30">
                            🔄 Novo Torneio
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.getElementById('novo-torneio')?.addEventListener('click', () => {

        sessionStorage.removeItem("round_in_progress");
        history.pushState("", "", "/tournament");
        router();
      });
    
      document.getElementById('iniciar-partida')?.addEventListener('click', async () => {
        history.pushState("", "", "/game");
        router();
    } );

      if (tournamentData && tournamentData.rounds)
      {
        const container = document.getElementById('tournamentRounds');
        
        if (!container) {
            console.error('Tournament rounds container not found!');
            return;
        }
            
        tournamentData.rounds.forEach(round => {
            const roundElement = document.createElement('div');
            roundElement.className = 'bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:bg-white/10 transition-all duration-300';
            
            const roundTitle = document.createElement('h3');
            roundTitle.className = 'text-2xl font-bold mb-6 pb-3 border-b border-white/20 text-white text-center';
            roundTitle.innerHTML = `<span class="text-yellow-400">🎯</span> Rodada ${round.round}`;
            
            roundElement.appendChild(roundTitle);
            
            const matchesList = document.createElement('div');
            matchesList.className = 'space-y-4';
            
            round.matches.forEach(match => {
                const matchElement = document.createElement('div');
                matchElement.className = 'p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1';
                
                // Status da partida
                const statusElement = document.createElement('div');
                let statusClass = 'inline-block px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border ';
                
                switch(match.status) {
                    case 'pending':
                        statusClass += 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30';
                        break;
                    case 'in_progress':
                        statusClass += 'bg-blue-400/20 text-blue-200 border-blue-400/30';
                        break;
                    case 'completed':
                    case 'wo': // walkover
                        statusClass += 'bg-green-400/20 text-green-200 border-green-400/30';
                        break;
                    default:
                        statusClass += 'bg-gray-400/20 text-gray-200 border-gray-400/30';
                }
                
                statusElement.className = statusClass;
                statusElement.textContent = match.status.toUpperCase();
                
                // Jogadores
                const playersElement = document.createElement('div');
                playersElement.className = 'flex items-center justify-center my-4 text-lg';
                
                // Usar innerHTML para garantir que o texto seja exibido corretamente
                const player1Name = match.player1 || 'Player 1';
                const player2Name = match.player2 || 'Player 2';
                
                playersElement.innerHTML = `
                    <span class="font-semibold text-white">${player1Name}</span>
                    <span class="text-blue-300 mx-4 font-bold">&nbsp;vs&nbsp;</span>
                    <span class="font-semibold text-white">${player2Name}</span>
                `;
                
                // Vencedor (se houver)
                let winnerElement = null;
                if (match.winner) {
                    winnerElement = document.createElement('div');
                    winnerElement.className = 'mt-4 text-center';
                    winnerElement.innerHTML = `
                        <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-400/20 rounded-xl backdrop-blur-sm border border-green-400/30">
                            <span class="text-xl">🏆</span>
                            <span class="text-green-200 font-semibold">Vencedor: ${match.winner}</span>
                        </div>
                    `;
                }
                
                // Montar o elemento da partida
                matchElement.appendChild(statusElement);
                matchElement.appendChild(playersElement);
                if (winnerElement) matchElement.appendChild(winnerElement);
                
                matchesList.appendChild(matchElement);
            });
                            

            roundElement.appendChild(matchesList);
            container.appendChild(roundElement);
        });
      }

      var requestData: any = null;

      try {
        let response = await fetch(apiUrl(3002, '/match/next'), {credentials: 'include'});
        requestData = await response.json();

        } catch (error) {
            console.error('Erro ao buscar dados do torneio:', error);
        }

        if ('champion' in requestData) {
            const message = requestData.message;
            let header = document.createElement('h2');
            header.className = 'text-2xl font-bold text-center mb-4 mt-8';
            header.textContent = message;

            let button = document.getElementById('button-container');
            button.insertAdjacentElement('beforebegin', header);

        }

    }

}

customElements.define("tournament-rounds", tournamentRounds);
