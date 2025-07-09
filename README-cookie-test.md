# 🍪 Testador de Cookies - ft_transcendence

Um frontend simples e direto para testar a autenticação JWT com cookies nos serviços do ft_transcendence.

## 🚀 Como usar no Debian/Linux

### Opção 1: Script automatizado (mais fácil)
```bash
./test-cookies.sh
```

### Opção 2: Script Python robusto
```bash
python3 serve_cookie_test_debian.py
```

### Opção 3: Servidor Python simples
```bash
python3 -m http.server 8080
# Depois abra: http://localhost:8080/cookie-tester.html
```

## 📋 Pré-requisitos

1. **Serviços rodando**: Certifique-se que os serviços estão executando:
   ```bash
   make up
   # ou
   docker-compose up
   ```

2. **Python3 instalado**:
   ```bash
   sudo apt install python3
   ```

3. **Navegador instalado** (Firefox, Chromium, Chrome, etc.)

## 🔧 Funcionalidades do Testador

### 📊 Status do Sistema
- **Conectividade**: Verifica se todos os serviços estão respondendo
- **Autenticação**: Mostra se você está logado
- **Cookies**: Conta e exibe cookies ativos
- **Protocolo**: Confirma que está usando HTTP (necessário para cookies)

### 🔐 Autenticação
- **Login**: Usar credenciais de teste (`middleware_test` / `password123`)
- **Verificação**: Confirma se o JWT está válido
- **Logout**: Limpa a sessão

### 🧪 Testes de Serviços
- **User Service** (porta 3003): Testa endpoints de usuário
- **Match Service** (porta 3002): Testa endpoints de partida
- **Teste Completo**: Executa todos os testes em sequência

## 🐛 Solução de Problemas

### ❌ Cookies não funcionam
- **Problema**: Arquivo aberto diretamente no navegador (`file://`)
- **Solução**: Use um dos scripts para servir via HTTP

### ❌ Serviços não respondem
- **Problema**: Serviços não estão rodando
- **Solução**: Execute `make up` ou `docker-compose up`

### ❌ Porta 8080 em uso
- **Problema**: Outra aplicação está usando a porta
- **Solução**: Pare outros serviços ou mude a porta no script

### ❌ Navegador não abre automaticamente
- **Problema**: Comando não encontrado
- **Solução**: Abra manualmente: `http://localhost:8080/cookie-tester.html`

## 📝 Credenciais de Teste

```
Usuário: middleware_test
Senha: password123
```

## 🔍 Como Interpretar os Logs

- **✅ Verde**: Operação bem-sucedida
- **❌ Vermelho**: Erro ou falha
- **⚠️ Amarelo**: Aviso ou informação importante
- **🔄 Azul**: Operação em andamento

## 🎯 Fluxo de Teste Recomendado

1. **Executar script**: `./test-cookies.sh`
2. **Testar conectividade**: Verificar se todos os serviços respondem
3. **Fazer login**: Usar as credenciais de teste
4. **Verificar cookies**: Confirmar que foram salvos
5. **Testar serviços**: Verificar se a autenticação funciona entre serviços
6. **Teste completo**: Executar todos os testes automaticamente

## 📁 Arquivos Criados

- `cookie-tester.html`: Frontend de teste
- `serve_cookie_test_debian.py`: Servidor Python robusto
- `test-cookies.sh`: Script de teste automatizado
- `README-cookie-test.md`: Este arquivo

## 🔧 Personalização

Para usar com outros serviços, modifique as constantes no `cookie-tester.html`:

```javascript
const BASE_URL = 'http://localhost';
const PORTS = {
    auth: 3001,
    user: 3003,
    match: 3002
};
```
