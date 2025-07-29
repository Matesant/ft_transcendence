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
            <div class="w-full max-w-5xl mx-auto">
                <div class="bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/20 shadow-2xl flex flex-col max-h-[85vh]">

                    <div class="flex-1 overflow-y-auto mb-4">
                        <div id="tournamentRounds" class="space-y-4 pr-2 custom-scrollbar">
                            <!-- As rodadas serão inseridas aqui via JavaScript -->
                        </div>
                    </div>
                    
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

    document.getElementById('novo-torneio')?.addEventListener('click', async () => {
        sessionStorage.removeItem("round_in_progress");
        sessionStorage.removeItem("powerupsEnabled");
        sessionStorage.removeItem("gameSpeed");
        sessionStorage.removeItem("tableTheme");
        
        history.pushState("", "", "/tournament?new=true");
        router();
      });
    
      document.getElementById('iniciar-partida')?.addEventListener('click', async () => {
        this._showGameStarting();
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
                    case 'wo':
                        statusClass += 'bg-green-400/20 text-green-200 border-green-400/30';
                        break;
                    default:
                        statusClass += 'bg-gray-400/20 text-gray-200 border-gray-400/30';
                }
                
                statusElement.className = statusClass;
                statusElement.textContent = match.status.toUpperCase();
                
                const playersElement = document.createElement('div');
                playersElement.className = 'flex items-center justify-center my-4 text-lg';
                
                if (match.status === 'wo') {
                    const winnerName = match.winner || match.player1 || 'Jogador';
                    playersElement.innerHTML = `
                        <div class="text-center">
                            <span class="font-semibold text-white">${winnerName}</span>
                            <div class="text-sm text-yellow-300 mt-1">
                                <span class="text-lg">⚠️</span> Walkover (WO)
                            </div>
                        </div>
                    `;
                } else {
                    const player1Name = match.player1 || 'Player 1';
                    const player2Name = match.player2 || 'Player 2';
                    
                    playersElement.innerHTML = `
                        <span class="font-semibold text-white">${player1Name}</span>
                        <span class="text-blue-300 mx-4 font-bold">&nbsp;vs&nbsp;</span>
                        <span class="font-semibold text-white">${player2Name}</span>
                    `;
                }
                
                let winnerElement = null;
                if (match.winner && match.status !== 'wo') {
                    winnerElement = document.createElement('div');
                    winnerElement.className = 'mt-4 text-center';
                    winnerElement.innerHTML = `
                        <div class="inline-flex items-center gap-2 px-4 py-2 bg-green-400/20 rounded-xl backdrop-blur-sm border border-green-400/30">
                            <span class="text-xl">🏆</span>
                            <span class="text-green-200 font-semibold">Vencedor: ${match.winner}</span>
                        </div>
                    `;
                }
                
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
            let championHeader = document.createElement('div');
            championHeader.className = 'text-center mb-6 mt-8';
            championHeader.innerHTML = `
                <h2 class="text-4xl font-bold text-yellow-400 mb-4">
                    🏆 Campeão: ${requestData.champion} 🏆
                </h2>
            `;

            let button = document.getElementById('button-container');
            button.insertAdjacentElement('beforebegin', championHeader);

            const iniciarPartidaBtn = document.getElementById('iniciar-partida');
            if (iniciarPartidaBtn) {
                iniciarPartidaBtn.style.display = 'none';
                iniciarPartidaBtn.style.pointerEvents = 'none';
                (iniciarPartidaBtn as HTMLButtonElement).disabled = true;
            }

            const novoTorneioBtn = document.getElementById('novo-torneio');
            if (novoTorneioBtn) {
                novoTorneioBtn.innerHTML = '🔄 Novo Torneio';
                novoTorneioBtn.className = 'bg-purple-500/80 hover:bg-purple-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-purple-400/30';
            }

        }

    }

    private async _showGameStarting(): Promise<void> {
        let nextMatchData: any = null;
        
        try {
            let response = await fetch(apiUrl(3002, '/match/next'), {credentials: 'include'});
            nextMatchData = await response.json();
        } catch (error) {
            console.error('Erro ao buscar próxima partida:', error);
        }

        this.innerHTML = `
            <div class="w-full max-w-5xl mx-auto flex flex-1 flex-col items-center justify-center">
                <div class="bg-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 shadow-2xl text-center max-w-lg w-full">
                    
                    <div class="mb-8">
                        <div id="countdown" class="text-6xl font-bold text-green-400">
                            
                        </div>
                    </div>
                    
                </div>
            </div>
        `;

        const countdownElement = document.getElementById('countdown') as HTMLDivElement;
        
        let count = 3;
        countdownElement.textContent = count.toString();
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count.toString();
            } else {
                countdownElement.textContent = "GO!";
                clearInterval(countdownInterval);
                
                setTimeout(() => {
                    history.pushState("", "", "/game");
                    router();
                }, 1000);
            }
        }, 1000);
    }

}

customElements.define("tournament-rounds", tournamentRounds);
