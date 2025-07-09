#!/usr/bin/env python3
"""
Cookie Test Server para Debian/Linux
Servidor HTTP especializado para testar autenticação por cookies
"""

import http.server
import socketserver
import os
import subprocess
import sys
import signal
import time
from pathlib import Path

# Configurações
PORT = 8080
HTML_FILE = "cookie-test-fixed.html"
SCRIPT_DIR = Path(__file__).parent.absolute()

# Cores para terminal
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

def print_colored(message, color=Colors.NC):
    print(f"{color}{message}{Colors.NC}")

def check_port_available(port):
    """Verifica se a porta está disponível"""
    try:
        result = subprocess.run(['netstat', '-tuln'], 
                              capture_output=True, text=True)
        return f":{port} " not in result.stdout
    except:
        return True

def open_browser(url):
    """Tenta abrir o navegador automaticamente"""
    browsers = ['xdg-open', 'firefox', 'chromium', 'google-chrome']
    
    for browser in browsers:
        try:
            subprocess.run([browser, url], 
                         stdout=subprocess.DEVNULL, 
                         stderr=subprocess.DEVNULL)
            print_colored(f"🖥️ Abrindo {browser}: {url}", Colors.GREEN)
            return True
        except FileNotFoundError:
            continue
    
    print_colored("⚠️ Navegador não detectado automaticamente", Colors.YELLOW)
    print_colored(f"Abra manualmente: {url}", Colors.YELLOW)
    return False

class CookieTestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SCRIPT_DIR, **kwargs)
    
    def end_headers(self):
        # Headers CORS para permitir requisições cross-origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        # Cache control para desenvolvimento
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Responder a requisições OPTIONS (preflight CORS)
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Log colorido para requisições
        timestamp = time.strftime("%H:%M:%S")
        message = f"[{timestamp}] {format % args}"
        if "GET" in message:
            print_colored(message, Colors.CYAN)
        elif "POST" in message:
            print_colored(message, Colors.GREEN)
        else:
            print_colored(message, Colors.NC)

def signal_handler(signum, frame):
    print_colored("\n🛑 Parando servidor...", Colors.YELLOW)
    sys.exit(0)

def main():
    # Configurar handler para Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    print_colored("🚀 Cookie Test Server para Debian/Linux", Colors.BLUE)
    print_colored("=" * 45, Colors.BLUE)
    
    # Verificar se o arquivo HTML existe
    html_path = SCRIPT_DIR / HTML_FILE
    if not html_path.exists():
        print_colored(f"❌ Arquivo não encontrado: {HTML_FILE}", Colors.RED)
        print_colored("Certifique-se de que o arquivo existe no mesmo diretório.", Colors.YELLOW)
        sys.exit(1)
    
    # Verificar se a porta está disponível
    if not check_port_available(PORT):
        print_colored(f"❌ Porta {PORT} já está em uso", Colors.RED)
        print_colored("Pare outros serviços ou use uma porta diferente.", Colors.YELLOW)
        sys.exit(1)
    
    try:
        # Criar servidor
        with socketserver.TCPServer(("127.0.0.1", PORT), CookieTestHandler) as httpd:
            print_colored(f"📂 Diretório: {SCRIPT_DIR}", Colors.GREEN)
            print_colored(f"🌐 Servidor rodando em: http://localhost:{PORT}", Colors.GREEN)
            print_colored(f"🍪 Página de teste: http://localhost:{PORT}/{HTML_FILE}", Colors.GREEN)
            print_colored("📋 Use Ctrl+C para parar o servidor", Colors.BLUE)
            print()
            
            # Abrir navegador após um delay
            url = f"http://localhost:{PORT}/{HTML_FILE}"
            
            def delayed_browser_open():
                time.sleep(2)
                open_browser(url)
            
            import threading
            threading.Thread(target=delayed_browser_open, daemon=True).start()
            
            print_colored("💡 Dicas para testar no Debian:", Colors.BLUE)
            print_colored("  • Certifique-se que seus serviços estão rodando", Colors.BLUE)
            print_colored("  • Use 'Test All Services' para verificar conectividade", Colors.BLUE)
            print_colored("  • Teste 'Debug Auth Flow' para autenticação completa", Colors.BLUE)
            print_colored("  • Cookies funcionam corretamente via HTTP", Colors.BLUE)
            print()
            
            print_colored("🔄 Aguardando requisições...", Colors.CYAN)
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print_colored(f"❌ Porta {PORT} já está em uso.", Colors.RED)
            print_colored("Tente parar outros serviços.", Colors.YELLOW)
        else:
            print_colored(f"❌ Erro ao iniciar servidor: {e}", Colors.RED)
        sys.exit(1)
    except KeyboardInterrupt:
        print_colored("\n👋 Servidor parado. Até mais!", Colors.YELLOW)

if __name__ == "__main__":
    main()
