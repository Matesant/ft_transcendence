import { router } from "../../router/Router";

class tournamentRounds extends HTMLElement {

    private async  _fetchTournamentData(): Promise<any> {
        var tournamentData: any = null;

        try {
            let response = await fetch('http://localhost:3002/match/tournament', {credentials: 'include'});
            tournamentData = await response.json();
  
        } catch (error) {
            console.error('Erro ao buscar dados do torneio:', error);
        }

        this.innerHTML = `
    
              <div class="flex-grow bg-gray-100 min-h-screen p-8 justify-center">
                <div class="max-w-4xl mx-auto">
                  <h1 class="text-3xl font-bold text-center mb-8">Torneio de Partidas</h1>

                  <div id="tournamentRounds" class="space-y-8">
                    <!-- As rodadas serão inseridas aqui via JavaScript -->
                  </div>
              </div>
                <div id="button-container" class="text-center mt-8">
                    <button id="iniciar-partida" class="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition">
                    Iniciar partida
                    </button>
                    <button id="showMessageButton" class="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition">
                    Novo torneio
                    </button>
                </div>
            </div>
    `;

    document.getElementById('showMessageButton')?.addEventListener('click', () => {

        sessionStorage.removeItem("round_in_progress");
        history.pushState("", "", "/tournament");
        router();
      });
    
      document.getElementById('iniciar-partida')?.addEventListener('click', async () => {
        history.pushState("", "", "/game");
        router();
    } );

      if (tournamentData)
      {
        const container = document.getElementById('tournamentRounds');
            
        tournamentData.rounds.forEach(round => {
            const roundElement = document.createElement('div');
            roundElement.className = 'bg-white rounded-lg shadow-md p-6 border border-gray-800';
            
            const roundTitle = document.createElement('h2');
            roundTitle.className = 'text-xl font-semibold mb-4 border-b pb-2';
            roundTitle.textContent = `Rodada ${round.round}`;
            
            roundElement.appendChild(roundTitle);
            
            const matchesList = document.createElement('div');
            matchesList.className = 'space-y-4';
            
            round.matches.forEach(match => {
                const matchElement = document.createElement('div');
                matchElement.className = 'border rounded p-4 hover:bg-gray-50 transition border border-gray-500';
                
                // Status da partida
                const statusElement = document.createElement('div');
                let statusClass = 'inline-block px-2 py-1 rounded-full text-xs font-semibold ';
                
                switch(match.status) {
                    case 'pending':
                        statusClass += 'bg-yellow-100 text-yellow-800';
                        break;
                    case 'in_progress':
                        statusClass += 'bg-blue-100 text-blue-800';
                        break;
                    case 'completed':
                    case 'wo': // walkover
                        statusClass += 'bg-green-100 text-green-800';
                        break;
                    default:
                        statusClass += 'bg-gray-100 text-gray-800';
                }
                
                statusElement.className = statusClass;
                statusElement.textContent = match.status.toUpperCase();
                
                // Jogadores
                const playersElement = document.createElement('div');
                playersElement.className = 'flex items-center justify-between my-2';
                
                const player1Element = document.createElement('span');
                player1Element.className = 'font-medium';
                player1Element.textContent = match.player1 || 'Nenhum';
                
                const vsElement = document.createElement('span');
                vsElement.className = 'mx-4 text-gray-500';
                vsElement.textContent = 'vs';
                
                const player2Element = document.createElement('span');
                player2Element.className = 'font-medium';
                player2Element.textContent = match.player2 || 'Nenhum';
                
                playersElement.className = 'flex items-center justify-center my-2'; // Alinha os itens ao centro
                vsElement.className = 'mx-4 text-gray-500 text-center'; // Centraliza o texto

                playersElement.appendChild(player1Element);
                playersElement.appendChild(vsElement);
                playersElement.appendChild(player2Element);
                
                // Vencedor (se houver)
                let winnerElement = null;
                if (match.winner) {
                    winnerElement = document.createElement('div');
                    winnerElement.className = 'mt-2 text-sm text-green-600 font-medium';
                    winnerElement.textContent = `Vencedor: ${match.winner}`;
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
        let response = await fetch('http://localhost:3002/match/next', {credentials: 'include'});
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

    constructor() {

        super();
        this._fetchTournamentData();

    }

}

customElements.define("tournament-rounds", tournamentRounds);
