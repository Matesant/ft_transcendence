import { router } from "../router/Router";
import { apiUrl } from "../utils/api";

class startTournament extends HTMLElement {

    constructor() {
      super ();
    }

    connectedCallback() {
        this.innerHTML = `
            <!-- Tournament setup form with glassmorphism design -->
            <div class="w-full max-w-3xl mx-auto">
                <div class="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col max-h-[80vh]">
                    <h2 class="text-3xl font-bold mb-8 text-center text-white drop-shadow-lg">🎮 Configurar Torneio</h2>
                    <p class="text-white/80 text-center mb-8 text-lg">Adicione os jogadores que participarão do torneio</p>
            
                    <!-- Container com scroll para os inputs -->
                    <div class="flex-1 overflow-y-auto mb-8">
                        <div id="inputs" class="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            <!-- Campo inicial -->
                            <div class="flex gap-3 items-center">
                                <input type="text" class="flex-1 p-4 border-2 border-white/30 rounded-xl text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/50 focus:outline-none transition-all duration-300" placeholder="Nome do jogador" />
                                <button class="remove-btn text-red-400 text-sm hover:text-red-300 px-4 py-2 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-all duration-300">Remover</button>
                            </div>
                        </div>
                    </div>
            
                    <!-- Botões fixos na parte inferior -->
                    <div class="flex gap-4 justify-center mb-4 flex-shrink-0">
                        <button id="addBtn" class="bg-blue-500/80 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-blue-400/30">
                            ➕ Adicionar Jogador
                        </button>
                        <button id="submitBtn" class="bg-green-500/80 hover:bg-green-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-green-400/30">
                            🚀 Iniciar Torneio
                        </button>
                    </div>
            
                    <div id="response" class="text-sm text-center text-white/80 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 flex-shrink-0"></div>
                </div>
            </div>
        `;

        const inputsContainer = document.getElementById('inputs');
        const addBtn = document.getElementById('addBtn');
        const submitBtn = document.getElementById('submitBtn');
        const responseBox = document.getElementById('response');
    
        function createInputRow() {
          const row = document.createElement('div');
          row.className = 'flex gap-3 items-center';
    
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'Nome do jogador';
          input.className = 'flex-1 p-4 border-2 border-white/30 rounded-xl text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/50 focus:outline-none transition-all duration-300';
    
          const removeBtn = document.createElement('button');
          removeBtn.textContent = 'Remover';
          removeBtn.className = 'remove-btn text-red-400 text-sm hover:text-red-300 px-4 py-2 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-all duration-300';
          removeBtn.addEventListener('click', () => {
            inputsContainer.removeChild(row);
          });
    
          row.appendChild(input);
          row.appendChild(removeBtn);
    
          return row;
        }
    
        addBtn.addEventListener('click', () => {
          const newRow = createInputRow();
          inputsContainer.appendChild(newRow);
        });
    
        submitBtn.addEventListener('click', async () => {
          const inputs = inputsContainer.querySelectorAll('input');
          const players = [];
    
          inputs.forEach(input => {
            const value = input.value.trim();
            if (value) players.push(value);
          });
    
          if (players.length === 0) {
            responseBox.textContent = "Nenhum nome inserido.";
            return;
          }
    
          try {
            const res = await fetch(apiUrl(3002, '/match'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ players }),
              credentials: 'include'
            });
    
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            responseBox.textContent = "Jogadores enviados com sucesso!";
            sessionStorage.setItem("round_in_progress", "true");
            history.pushState("", "", "/tournament");
            router();
          } catch (error) {
            responseBox.textContent = "Erro ao enviar: " + error.message;
          }
        });
    
        // Ativa o botão de remover do primeiro campo já existente
        document.querySelector('.remove-btn').addEventListener('click', function () {
          const row = this.parentElement;
          inputsContainer.removeChild(row);
        });
    }
  
  }
  
  customElements.define("start-tournament", startTournament);