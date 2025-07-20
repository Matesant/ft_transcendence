import { router } from "../../router/Router";
import { apiUrl } from "../../utils/api";

class startTournament extends HTMLElement {

    constructor() {
      super ();
      
        this.innerHTML = `
        <div class="flex">
            <!-- Sidebar ocupa uma largura fixa -->
            <aside class="w-64"></aside>
    
            <!-- Div centralizada no espaço restante -->
            <div class="flex-grow flex justify-center items-center">
                <div class="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    <h1 class="text-2xl font-bold mb-4 text-center">Inserir Jogadores</h1>
            
                    <div id="inputs" class="space-y-2 mb-6">
                        <!-- Campo inicial -->
                        <div class="flex gap-2 items-center">
                            <input type="text" class="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="Nome do jogador" />
                            <button class="remove-btn text-red-600 text-sm hover:underline ml-4">Remover</button>
                        </div>
                    </div>
            
                    <div class="flex gap-4 justify-center mb-6">
                        <button id="addBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition">Adicionar nome</button>
                        <button id="submitBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition">Enviar</button>
                    </div>
            
                    <div id="response" class="text-sm text-center text-gray-700 mt-4"></div>
                </div>
            </div>
        </div>
        `;

        const inputsContainer = document.getElementById('inputs');
        const addBtn = document.getElementById('addBtn');
        const submitBtn = document.getElementById('submitBtn');
        const responseBox = document.getElementById('response');
    
        function createInputRow() {
          const row = document.createElement('div');
          row.className = 'flex gap-2 items-center';
    
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'Nome do jogador';
          input.className = 'w-full p-2 border border-gray-300 rounded-md text-sm';
    
          const removeBtn = document.createElement('button');
          removeBtn.textContent = 'Remover';
          removeBtn.className = 'remove-btn text-red-600 text-sm hover:underline ml-4';
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