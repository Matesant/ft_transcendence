import { apiUrl } from '../utils/api';

class DisablefaBtn extends HTMLElement {
    constructor() {
      super();
    }
  
    connectedCallback() {

      this.innerHTML = `
        <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Disable 2FA
        </button>
      `;
  
      const button = this.querySelector('button');
      if (button) {
        button.addEventListener('click', async () => {
          try {
              const response = await fetch(apiUrl(3001, '/auth/2fa/disable'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ alias: this.getAttribute('data-alias') }),
              credentials: 'include'
            });
  
            const data = await response.json();
            if (data.success) {

                let msg = document.createElement('div');
                msg.innerHTML = `${data.message}`;
                msg.className = 'bg-green-100 text-green-800 p-2 rounded mt-4';
                this.parentElement.appendChild(msg);
                setTimeout(() => {
                    msg.remove();
                }, 3000);
            }


          } catch (error) {
            console.error(error);
            alert('Erro ao comunicar com o servidor.');
          }
        });
      }
    }
  }
  
  customElements.define('disable-2fa-button', DisablefaBtn);