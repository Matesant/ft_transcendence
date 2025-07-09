#!/bin/bash

# Script para testar cookies no ft_transcendence (Debian)
# Autor: GitHub Copilot
# Data: $(date)

set -e

echo "🚀 Iniciando testador de cookies para ft_transcendence"
echo "=================================================="

# Verificar se estamos no diretório correto
if [ ! -f "cookie-tester.html" ]; then
    echo "❌ Erro: cookie-tester.html não encontrado"
    echo "Certifique-se de estar no diretório correto"
    exit 1
fi

# Verificar se Python3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não está instalado"
    echo "Instale com: sudo apt install python3"
    exit 1
fi

# Verificar se os serviços estão rodando
echo "🔍 Verificando serviços..."

check_service() {
    local service=$1
    local port=$2
    
    if curl -s -f "http://localhost:$port/" > /dev/null 2>&1; then
        echo "✅ $service (porta $port): OK"
        return 0
    else
        echo "❌ $service (porta $port): Não está rodando"
        return 1
    fi
}

# Verificar cada serviço
services_ok=true
check_service "Auth Service" 3001 || services_ok=false
check_service "Match Service" 3002 || services_ok=false
check_service "User Service" 3003 || services_ok=false

if [ "$services_ok" = false ]; then
    echo ""
    echo "⚠️ Alguns serviços não estão rodando!"
    echo "💡 Para iniciar os serviços, execute:"
    echo "   make up    # ou docker-compose up"
    echo ""
    read -p "Continuar mesmo assim? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🌐 Iniciando servidor HTTP para testes..."
echo "📂 Arquivo: cookie-tester.html"
echo "🔗 URL: http://localhost:8080/cookie-tester.html"
echo ""
echo "💡 Instruções:"
echo "   1. O navegador abrirá automaticamente"
echo "   2. Clique em 'Testar Conectividade' primeiro"
echo "   3. Faça login com: middleware_test / password123"
echo "   4. Teste as funcionalidades dos serviços"
echo "   5. Use Ctrl+C para parar o servidor"
echo ""

# Verificar se a porta está disponível
if netstat -tuln 2>/dev/null | grep -q ":8080 "; then
    echo "❌ Porta 8080 já está em uso"
    echo "Pare outros serviços ou mude a porta"
    exit 1
fi

# Função para abrir navegador
open_browser() {
    sleep 2
    local url="http://localhost:8080/cookie-tester.html"
    
    if command -v xdg-open &> /dev/null; then
        xdg-open "$url" 2>/dev/null &
    elif command -v firefox &> /dev/null; then
        firefox "$url" 2>/dev/null &
    elif command -v chromium &> /dev/null; then
        chromium "$url" 2>/dev/null &
    else
        echo "⚠️ Navegador não detectado. Abra manualmente: $url"
    fi
}

# Abrir navegador em background
open_browser &

# Iniciar servidor Python
echo "🔄 Servidor iniciando..."
python3 -c "
import http.server
import socketserver
import os

os.chdir('$(pwd)')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        super().end_headers()

with socketserver.TCPServer(('', 8080), CustomHandler) as httpd:
    print('✅ Servidor rodando em http://localhost:8080')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n👋 Servidor parado!')
"
