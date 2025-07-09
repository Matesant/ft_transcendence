#!/bin/bash

# Exemplo de como fazer requests de registro para o ft_transcendence
# Mostra diferentes formas de registrar usuários

echo "🔧 Exemplos de Request de Registro - ft_transcendence"
echo "=================================================="

# Configurações
AUTH_SERVICE="http://localhost:3001"
BASE_URL="http://localhost:3001/auth"

echo ""
echo "🌐 Endpoint de registro: $BASE_URL/register"
echo "📋 Método: POST"
echo "📤 Content-Type: application/json"
echo ""

# Exemplo 1: Registro básico com curl
echo "📝 Exemplo 1: Registro básico com curl"
echo "======================================"
echo ""

USER_DATA='{
    "alias": "novo_usuario",
    "email": "novo@example.com", 
    "password": "minhasenha123"
}'

echo "Comando:"
echo "curl -X POST \\"
echo "  $BASE_URL/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$USER_DATA'"
echo ""

echo "Executando..."
curl -X POST \
  "$BASE_URL/register" \
  -H 'Content-Type: application/json' \
  -d "$USER_DATA" \
  -w "\n\nStatus: %{http_code}\n" \
  -s

echo ""
echo "----------------------------------------"
echo ""

# Exemplo 2: Registro com dados aleatórios
echo "📝 Exemplo 2: Registro com dados aleatórios"
echo "=========================================="
echo ""

RANDOM_USER="user_$(date +%s)"
RANDOM_EMAIL="${RANDOM_USER}@example.com"

RANDOM_DATA="{
    \"alias\": \"$RANDOM_USER\",
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"password123\"
}"

echo "Comando:"
echo "curl -X POST \\"
echo "  $BASE_URL/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$RANDOM_DATA'"
echo ""

echo "Executando..."
curl -X POST \
  "$BASE_URL/register" \
  -H 'Content-Type: application/json' \
  -d "$RANDOM_DATA" \
  -w "\n\nStatus: %{http_code}\n" \
  -s

echo ""
echo "----------------------------------------"
echo ""

# Exemplo 3: Registro com validação de resposta
echo "📝 Exemplo 3: Registro com validação"
echo "===================================="
echo ""

TEST_USER="test_$(date +%s)"
TEST_EMAIL="${TEST_USER}@example.com"

TEST_DATA="{
    \"alias\": \"$TEST_USER\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\"
}"

echo "Dados do usuário:"
echo "  Alias: $TEST_USER"
echo "  Email: $TEST_EMAIL"
echo "  Senha: password123"
echo ""

echo "Fazendo registro..."
RESPONSE=$(curl -X POST \
  "$BASE_URL/register" \
  -H 'Content-Type: application/json' \
  -d "$TEST_DATA" \
  -w "\n%{http_code}" \
  -s)

# Separar resposta do código de status
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Resposta:"
echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Registro bem-sucedido! (HTTP $HTTP_CODE)"
    echo ""
    echo "Tentando fazer login..."
    
    LOGIN_DATA="{
        \"alias\": \"$TEST_USER\",
        \"password\": \"password123\"
    }"
    
    LOGIN_RESPONSE=$(curl -X POST \
      "$BASE_URL/login" \
      -H 'Content-Type: application/json' \
      -d "$LOGIN_DATA" \
      -c cookies.txt \
      -w "\n%{http_code}" \
      -s)
    
    LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
    LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
    
    echo "Login resposta:"
    echo "$LOGIN_BODY"
    echo ""
    
    if [ "$LOGIN_CODE" = "200" ]; then
        echo "✅ Login bem-sucedido! (HTTP $LOGIN_CODE)"
        echo "🍪 Cookies salvos em cookies.txt"
        
        # Testar autenticação
        echo ""
        echo "Testando autenticação..."
        AUTH_RESPONSE=$(curl -X GET \
          "$BASE_URL/verify" \
          -b cookies.txt \
          -s)
        
        echo "Verificação:"
        echo "$AUTH_RESPONSE"
        
    else
        echo "❌ Login falhou (HTTP $LOGIN_CODE)"
    fi
    
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠️ Usuário ou email já existe (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ Dados inválidos (HTTP $HTTP_CODE)"
else
    echo "❌ Erro desconhecido (HTTP $HTTP_CODE)"
fi

echo ""
echo "----------------------------------------"
echo ""

# Exemplo 4: Formato de dados obrigatórios
echo "📋 Exemplo 4: Campos obrigatórios"
echo "================================="
echo ""

echo "Campos obrigatórios para registro:"
echo "  • alias (string): Nome de usuário único"
echo "  • email (string): Email válido"
echo "  • password (string): Senha do usuário"
echo ""

echo "Exemplo de JSON:"
echo "{"
echo "  \"alias\": \"meu_usuario\","
echo "  \"email\": \"usuario@example.com\","
echo "  \"password\": \"minha_senha_segura\""
echo "}"
echo ""

echo "Possíveis respostas:"
echo "  • 200: Registro bem-sucedido"
echo "  • 400: Dados inválidos ou campos faltando"
echo "  • 409: Usuário ou email já existe"
echo "  • 500: Erro interno do servidor"
echo ""

echo "✅ Exemplos concluídos!"
echo ""
echo "💡 Dicas:"
echo "  • Use o testador web para interface gráfica"
echo "  • Verifique se os serviços estão rodando"
echo "  • Cookies são salvos automaticamente no navegador"
echo "  • Para curl, use -c cookies.txt para salvar cookies"
