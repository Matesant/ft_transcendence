import { apiUrl } from '../utils/api';

class UploadAvatar extends HTMLElement {
    private fileInput!: HTMLInputElement;
    private uploadButton!: HTMLButtonElement;
    private statusDiv!: HTMLDivElement;
  
    constructor() {
      super();
    }
  
    connectedCallback() {
      this.innerHTML = `
            <div class="flex flex-col gap-4 w-90 border-2 border-white/30 rounded-2xl bg-white/10 backdrop-blur-md p-4 mx-auto mt-5">
              <div class="text-lg font-bold">Avatar upload</div>
            <!-- Input estilizado -->
            <input 
                type="file" 
                accept="image/*"
                class="block w-full text-sm text-gray-900 
                    border border-gray-300 rounded-lg 
                    cursor-pointer bg-gray-50 
                    file:mr-4 file:py-2 file:px-4 
                    file:rounded-lg file:border-0 
                    file:text-sm file:font-semibold 
                    file:bg-blue-50 file:text-blue-700 
                    hover:file:bg-blue-100" 
            >

            <!-- Botão estilizado -->
            <button
                class="px-4 py-2 bg-blue-600 text-white 
                    rounded-lg shadow hover:bg-blue-700 
                    focus:outline-none focus:ring-2 
                    focus:ring-blue-400 focus:ring-offset-2"
            >
                Send
            </button>

            <div></div>
            </div>
      `;
  
      this.fileInput = this.querySelector('input[type="file"]') as HTMLInputElement;
      this.uploadButton = this.querySelector('button') as HTMLButtonElement;
      this.statusDiv = this.querySelector('div > div') as HTMLDivElement;
  
      this.uploadButton.addEventListener('click', () => this.handleUpload());
    }
  
    async handleUpload() {
      if (!this.fileInput.files || this.fileInput.files.length === 0) {
        this.showStatus('Please select an file.');
        return;
      }
  
      const file = this.fileInput.files[0];
      const formData = new FormData();
      formData.append('avatar', file);
  
      this.showStatus('Enviando...');
  
      try {
        const resp = await fetch(apiUrl(3003, '/users/avatar'), {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
  
        if (!resp.ok) {
          this.showStatus(`Erro no upload: HTTP ${resp.status}`);
          return;
        }
  
        const data = await resp.json();
        if (data.success) {
          this.showStatus(`${data.message}!`);
        } else {
          this.statusDiv.className = "text-red-500";
          this.showStatus(`Error: ${data.statusCode || 'Erro desconhecido'}`);
        }
      } catch (err) {
        console.error(err);
        this.showStatus('Erro de rede ao enviar avatar.');
      }
    }
  
    showStatus(message: string) {
      this.statusDiv.textContent = message;
    }
  }
  
  customElements.define('upload-avatar', UploadAvatar);
  