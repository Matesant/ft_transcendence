# 🎮 Como Testar o Modo Multijogador

## 📋 Pré-requisitos

1. **Docker e Docker Compose** instalados
2. **Node.js 18+** (se rodar manualmente)
3. **Duas abas/janelas de navegador** ou **dois dispositivos**

## 🚀 Passo a Passo para Testar

### 1. **Iniciar os Serviços**

#### Opção A: Com Docker (Recomendado)
```bash
# Na raiz do projeto
cd /home/matesant/ft_transcendence

# Iniciar todos os serviços
docker-compose up

# Ou apenas o game-service para teste
docker-compose up game-service
```

#### Opção B: Manualmente
```bash
# Terminal 1 - Game Service
cd /home/matesant/ft_transcendence/services/game-service
npm install
npm run dev

# Terminal 2 - Frontend (se necessário)
cd /home/matesant/ft_transcendence/frontend
npm install
npm run dev
```

### 2. **Verificar se o Game Service está Rodando**

```bash
# Teste de saúde
curl http://localhost:3003/health

# Deve retornar:
# {"status":"ok","service":"game-service","timestamp":"2025-07-16T..."}

# Verificar estatísticas
curl http://localhost:3003/games/stats

# Deve retornar:
# {"totalGames":0,"activeGames":0,"totalPlayers":0,"onlinePlayers":0}
```

### 3. **Testar o Frontend**

1. **Abra o navegador** e acesse seu frontend (normalmente `http://localhost:8080`)

2. **Navegue para o jogo** - clique em "Game" ou "Jogar"

3. **Escolha "Online Multiplayer"** na tela de seleção de modo

4. **Digite um nome de jogador** quando solicitado (ex: "Player1")

5. **Aguarde a mensagem** "Searching for opponent..."

### 4. **Simular Segundo Jogador**

#### Opção A: Segunda Aba do Navegador
1. **Abra uma nova aba** no mesmo navegador
2. **Acesse o mesmo endereço** do frontend
3. **Navegue para o jogo** novamente
4. **Escolha "Online Multiplayer"**
5. **Digite um nome diferente** (ex: "Player2")

#### Opção B: Modo Incógnito
1. **Abra uma janela anônima/incógnita**
2. **Repita os mesmos passos** acima

#### Opção C: Outro Dispositivo
1. **Use outro computador/celular** na mesma rede
2. **Acesse `http://[IP_DO_SEU_PC]:8080`**
3. **Repita os passos** de conexão

### 5. **Verificar Conexão**

Quando ambos os jogadores se conectarem, você deve ver:

```
✅ Match found! Playing against [Nome do Oponente]
✅ Game started!
```

### 6. **Jogar!**

- **Player 1 (lado esquerdo)**: Use as **setas do teclado** ← →
- **Player 2 (lado direito)**: Use as **setas do teclado** ← →
- **Objetivo**: Chegar a 5 pontos primeiro

## 🔧 Troubleshooting

### Problema: "Failed to connect to server"

**Soluções:**
```bash
# Verificar se o game-service está rodando
docker ps | grep game-service

# Ou verificar logs
docker-compose logs game-service

# Reiniciar o serviço
docker-compose restart game-service
```

### Problema: "WebSocket connection failed"

**Soluções:**
1. **Verificar firewall/antivírus** bloqueando porta 3003
2. **Testar conexão direta:**
   ```bash
   telnet localhost 3003
   ```
3. **Verificar CORS** - o game-service deve aceitar conexões do frontend

### Problema: Players não conectam

**Diagnóstico:**
```bash
# Verificar logs do game-service
docker-compose logs -f game-service

# Verificar no browser console (F12)
# Deve mostrar mensagens de WebSocket
```

### Problema: Lag ou dessincronia

**Verificar:**
1. **Latência da rede** entre dispositivos
2. **Performance do servidor** - verificar CPU/RAM
3. **Console do navegador** para erros JavaScript

## 📊 Monitoramento Durante o Teste

### Logs Importantes do Game Service:
```
🎮 Game Service started on port 3003
New WebSocket connection established
Player Player1 (player_xxx) joined
Player Player1 added to queue. Queue size: 1
Player Player2 (player_yyy) joined
Created game game_1_xxx with players Player1 vs Player2
Game game_1_xxx started
```

### Console do Navegador (F12):
```javascript
WebSocket connected
Received: {type: "match_found", gameId: "game_1_xxx", ...}
Received: {type: "game_start", ...}
Received: {type: "game_state", ...}
```

## 🎯 Teste de Funcionalidades

### ✅ Checklist de Teste:

- [ ] **Conexão WebSocket** estabelecida
- [ ] **Matchmaking** funciona (2 players conectam)
- [ ] **Game start** ambos recebem notificação
- [ ] **Paddle movement** respondem aos inputs
- [ ] **Ball movement** sincronizado entre players
- [ ] **Score system** funciona corretamente
- [ ] **Game end** quando alguém chega a 5 pontos
- [ ] **Disconnection handling** - teste fechar uma aba
- [ ] **Reconnection** - teste refresh da página

### 🎮 Comandos de Teste:

```bash
# Verificar quantos jogadores online
curl http://localhost:3003/games/stats

# Durante o jogo, deve mostrar:
# {"totalGames":1,"activeGames":1,"totalPlayers":2,"onlinePlayers":2}
```

## 🐛 Debug Avançado

### Monitorar WebSocket Traffic:

1. **Abra F12** no navegador
2. **Vá para aba Network**
3. **Filtre por WS** (WebSocket)
4. **Veja as mensagens** enviadas/recebidas em tempo real

### Logs Detalhados do Server:

```bash
# Ver logs em tempo real
docker-compose logs -f game-service

# Filtrar apenas mensagens importantes
docker-compose logs game-service | grep -E "(Player|Game|Match)"
```

## 🎉 Sucesso!

Se você conseguir ver:
- ✅ Dois jogadores conectados
- ✅ Paddles se movendo em ambas as telas
- ✅ Bola sincronizada
- ✅ Score sendo atualizado

**Parabéns!** O multiplayer está funcionando perfeitamente! 🎊

---

## 📞 Ajuda Adicional

Se ainda tiver problemas, verifique:
1. **Logs do console** (F12)
2. **Logs do docker** (`docker-compose logs game-service`)
3. **Porta 3003** está aberta
4. **CORS** configurado corretamente
