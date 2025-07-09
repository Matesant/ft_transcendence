#!/bin/bash
# Cookie Test Server para Debian/Linux
# Este script inicia um servidor HTTP local para testar cookies

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PORT=8080
HTML_FILE="cookie-test-fixed.html"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 Cookie Test Server para Debian/Linux${NC}"
echo -e "${BLUE}=========================================${NC}"

# Verificar se o arquivo HTML existe
if [ ! -f "$SCRIPT_DIR/$HTML_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $HTML_FILE${NC}"
    echo -e "${YELLOW}Certifique-se de que o arquivo existe no mesmo diretório.${NC}"
    exit 1
fi

# Verificar se Python3 está disponível
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 não encontrado${NC}"
    echo -e "${YELLOW}Instale com: sudo apt install python3${NC}"
    exit 1
fi

# Verificar se a porta está disponível
if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
    echo -e "${RED}❌ Porta $PORT já está em uso${NC}"
    echo -e "${YELLOW}Pare outros serviços ou use uma porta diferente.${NC}"
    exit 1
fi

# Função para cleanup
cleanup() {
    echo -e "\n${YELLOW}🛑 Parando servidor...${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}📂 Diretório: $SCRIPT_DIR${NC}"
echo -e "${GREEN}🌐 Servidor iniciando na porta $PORT${NC}"
echo -e "${GREEN}🍪 Página de teste: http://localhost:$PORT/$HTML_FILE${NC}"
echo -e "${BLUE}📋 Use Ctrl+C para parar o servidor${NC}"
echo

# Tentar abrir o navegador
open_browser() {
    local url="http://localhost:$PORT/$HTML_FILE"
    
    if command -v xdg-open &> /dev/null; then
        xdg-open "$url" 2>/dev/null &
        echo -e "${GREEN}🖥️ Abrindo navegador: $url${NC}"
    elif command -v firefox &> /dev/null; then
        firefox "$url" 2>/dev/null &
        echo -e "${GREEN}🖥️ Abrindo Firefox: $url${NC}"
    elif command -v chromium &> /dev/null; then
        chromium "$url" 2>/dev/null &
        echo -e "${GREEN}🖥️ Abrindo Chromium: $url${NC}"
    elif command -v google-chrome &> /dev/null; then
        google-chrome "$url" 2>/dev/null &
        echo -e "${GREEN}🖥️ Abrindo Chrome: $url${NC}"
    else
        echo -e "${YELLOW}⚠️ Navegador não detectado automaticamente${NC}"
        echo -e "${YELLOW}Abra manualmente: $url${NC}"
    fi
}

# Aguardar um pouco antes de abrir o navegador
(sleep 2 && open_browser) &

echo -e "${BLUE}💡 Dicas para testar no Debian:${NC}"
echo -e "${BLUE}  • Certifique-se que seus serviços estão rodando${NC}"
echo -e "${BLUE}  • Use 'Test All Services' para verificar conectividade${NC}"
echo -e "${BLUE}  • Teste 'Debug Auth Flow' para autenticação completa${NC}"
echo -e "${BLUE}  • Cookies funcionam corretamente via HTTP${NC}"
echo

# Iniciar servidor Python
cd "$SCRIPT_DIR"
python3 -m http.server $PORT --bind 127.0.0.1
