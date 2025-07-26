import { router } from "../router/Router";
import { apiUrl } from "../utils/api";
import { getText } from "../utils/language";

class startTournament extends HTMLElement {

    constructor() {
      super();
    }

    connectedCallback() {
        this.innerHTML = `
            <!-- Tournament setup form with glassmorphism design -->
            <div class="w-full max-w-5xl mx-auto">
                <div class="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col max-h-[80vh]">
                    <h2 class="text-3xl font-bold mb-8 text-center text-white drop-shadow-lg">🎮 ${getText('startTournament')}</h2>
                    
                    <!-- Layout principal com duas colunas -->
                    <div class="flex gap-8 flex-1">
                        <!-- Coluna esquerda - Lista de jogadores -->
                        <div class="flex-1 flex flex-col">
                            <h3 class="text-xl font-semibold text-white mb-4">👥 ${getText('players')}</h3>
                            <!-- Container com scroll para os inputs -->
                            <div class="flex-1 overflow-y-auto mb-6">
                                <div id="inputs" class="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    <!-- Campo inicial -->
                                    <div class="flex gap-3 items-center">
                                        <input type="text" class="flex-1 p-4 border-2 border-white/30 rounded-xl text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/50 focus:outline-none transition-all duration-300" placeholder="${getText('playerName')}" />
                                        <button class="remove-btn text-red-400 text-sm hover:text-red-300 px-4 py-2 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-all duration-300">${getText('remove')}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Coluna direita - Configurações do jogo -->
                        <div class="w-80 flex flex-col space-y-4">
                            <h3 class="text-xl font-semibold text-white mb-2">⚙️ ${getText('settings')}</h3>
                            
                            <!-- Power-up toggle -->
                            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="text-sm font-semibold text-white mb-2">🎲 ${getText('powerUpsMode')}</h4>
                                        <p class="text-xs text-white/60">${getText('enablePowerUps')}</p>
                                    </div>
                                    <div class="relative">
                                        <input type="checkbox" id="powerupToggle" class="sr-only">
                                        <div id="toggleSwitch" class="w-12 h-6 bg-gray-600 rounded-full cursor-pointer transition-colors duration-300 relative">
                                            <div id="toggleThumb" class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform translate-x-0"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Game Speed Control -->
                            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
                                <h4 class="text-sm font-semibold text-white mb-2">⚡ ${getText('gameSpeed')}</h4>
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-white text-xs">0.8x</span>
                                    <div class="flex-1 relative">
                                        <input type="range" id="speedSlider" min="0.8" max="1.5" step="0.1" value="1.0" 
                                            class="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider">
                                    </div>
                                    <span class="text-white text-xs">1.5x</span>
                                </div>
                                <div class="text-center">
                                    <span id="speedValue" class="text-green-500 text-sm font-bold">1.0x</span>
                                </div>
                            </div>

                            <!-- Table Color Control -->
                            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
                                <h4 class="text-sm font-semibold text-white mb-2">🎨 ${getText('tableColor')}</h4>
                                <button id="tableColorButton" class="w-full px-3 py-2 text-xs cursor-pointer border-none rounded text-white transition-colors duration-300 font-medium">
                                    ${getText('tableColor')}
                                </button>
                            </div>
                        </div>
                    </div>
            
                    <!-- Botões fixos na parte inferior -->
                    <div class="flex gap-4 justify-center mb-4 flex-shrink-0 mt-8">
                        <button id="addBtn" class="bg-blue-500/80 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-blue-400/30">
                            ➕ ${getText('addPlayer')}
                        </button>
                        <button id="submitBtn" class="bg-green-500/80 hover:bg-green-500 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm border border-green-400/30">
                            🚀 ${getText('start')}
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
        const powerupToggle = document.getElementById('powerupToggle') as HTMLInputElement;
        const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
        const speedValue = document.getElementById('speedValue');
        const tableColorButton = document.getElementById('tableColorButton');
        
        // Initialize with default value if not set
        if (sessionStorage.getItem("powerupsEnabled") === null) {
            sessionStorage.setItem("powerupsEnabled", "false");
        }
        if (sessionStorage.getItem("gameSpeed") === null) {
            sessionStorage.setItem("gameSpeed", "1.0");
        }
        if (sessionStorage.getItem("tableTheme") === null) {
            sessionStorage.setItem("tableTheme", "GREEN");
        }
        
        // Set values from sessionStorage
        powerupToggle.checked = sessionStorage.getItem("powerupsEnabled") === "true";
        speedSlider.value = sessionStorage.getItem("gameSpeed") || "1.0";
        speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
        
        const currentTableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
        
        // Get toggle elements
        const toggleSwitch = document.getElementById('toggleSwitch');
        const toggleThumb = document.getElementById('toggleThumb');
        
        function updateToggleState() {
            if (powerupToggle.checked) {
                // Activated state - blue background, thumb moves right
                toggleSwitch.className = 'w-12 h-6 bg-blue-500 rounded-full cursor-pointer transition-colors duration-300 relative';
                toggleThumb.className = 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform translate-x-6';
            } else {
                // Deactivated state - gray background, thumb on left
                toggleSwitch.className = 'w-12 h-6 bg-gray-600 rounded-full cursor-pointer transition-colors duration-300 relative';
                toggleThumb.className = 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform translate-x-0';
            }
        }
        
        function updateTableColorButton() {
            const tableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
            if (tableTheme === "GREEN") {
                tableColorButton.textContent = getText('switchToBlue');
                tableColorButton.className = "px-4 py-2 text-sm cursor-pointer bg-blue-500 hover:bg-blue-600 border-none rounded text-white transition-colors duration-300 font-medium";
            } else { // BLUE
                tableColorButton.textContent = getText('switchToGreen');
                tableColorButton.className = "px-4 py-2 text-sm cursor-pointer bg-green-500 hover:bg-green-600 border-none rounded text-white transition-colors duration-300 font-medium";
            }
        }
        
        // Set initial states
        updateToggleState();
        updateTableColorButton();
        
        // Add click handlers
        toggleSwitch.addEventListener('click', () => {
            powerupToggle.checked = !powerupToggle.checked;
            updateToggleState();
        });
        
        powerupToggle.addEventListener('change', updateToggleState);
        
        // Speed slider event listener
        speedSlider.addEventListener('input', () => {
            const speed = parseFloat(speedSlider.value);
            speedValue.textContent = `${speed.toFixed(1)}x`;
            sessionStorage.setItem("gameSpeed", speed.toString());
        });
        
        // Table color button event listener
        tableColorButton.addEventListener('click', () => {
            const currentTheme = sessionStorage.getItem("tableTheme") || "GREEN";
            const newTheme = currentTheme === "GREEN" ? "BLUE" : "GREEN";
            sessionStorage.setItem("tableTheme", newTheme);
            updateTableColorButton();
        });
    
        function createInputRow() {
          const row = document.createElement('div');
          row.className = 'flex gap-3 items-center';
    
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = getText('playerName');
          input.className = 'flex-1 p-4 border-2 border-white/30 rounded-xl text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/50 focus:outline-none transition-all duration-300';
    
          const removeBtn = document.createElement('button');
          removeBtn.textContent = getText('remove');
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
          const inputs = inputsContainer.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
          const players = [];
    
          inputs.forEach(input => {
            const value = input.value.trim();
            if (value) players.push(value);
          });
    
          if (players.length === 0) {
            responseBox.textContent = getText('noPlayersError');
            return;
          }

          const powerupsEnabled = powerupToggle.checked;
          const gameSpeed = parseFloat(speedSlider.value);
          const tableTheme = sessionStorage.getItem("tableTheme") || "GREEN";
          
          // Salvar configurações no sessionStorage
          sessionStorage.setItem("powerupsEnabled", powerupsEnabled.toString());
          sessionStorage.setItem("gameSpeed", gameSpeed.toString());
          sessionStorage.setItem("tableTheme", tableTheme);
    
          try {
            const res = await fetch(apiUrl(3002, '/match'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                players,
                powerupsEnabled,
                gameSpeed,
                tableTheme
              }),
              credentials: 'include'
            });
    
            if (!res.ok) throw new Error(`${getText('error')} ${res.status}`);
            responseBox.textContent = getText('playersSentSuccess');
            sessionStorage.setItem("round_in_progress", "true");
            history.pushState("", "", "/tournament");
            router();
          } catch (error) {
            responseBox.textContent = `${getText('sendError')}: ${error.message}`;
          }
        });
    
        // Ativa o botão de remover do primeiro campo já existente
        document.querySelector('.remove-btn').addEventListener('click', function() {
          const row = this.parentElement;
          inputsContainer.removeChild(row);
        });
    }
}
  
customElements.define("start-tournament", startTournament);