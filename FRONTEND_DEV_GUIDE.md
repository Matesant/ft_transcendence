# Frontend Development Guide

Este guia explica como desenvolver o frontend do ft_transcendence com o novo sistema modular e multiplayer.

## 🚀 Início Rápido

### Opção 1: Usando o Makefile (Recomendado)

```bash
# 1. Instalar dependências do frontend
make frontend-install

# 2. Iniciar o ambiente completo (backend + frontend)
make fullstack-dev
```

### Opção 2: Desenvolvimento por Partes

```bash
# 1. Iniciar apenas o backend
make quick-backend

# 2. Em outro terminal, iniciar frontend com CSS watch
make frontend-watch
```

### Opção 3: Comando Manual

```bash
# Terminal 1: Backend
docker-compose -f docker-compose.dev.yml up -d game-service

# Terminal 2: CSS Watch (opcional, mas recomendado)
cd frontend
npx @tailwindcss/cli -i src/style.css -o public/style.css --watch

# Terminal 3: Frontend
cd frontend
npm start
```

## 🎮 Funcionalidades Implementadas

### Modo Local
- Jogo Pong tradicional para 2 jogadores no mesmo computador
- Controles: Setas (jogador direito), WASD (jogador esquerdo)
- Interface configurável com diferentes modos de jogo

### Modo Online (Multiplayer)
- Matchmaking automático
- Sincronização em tempo real via WebSocket
- Detecção de desconexão e reconexão
- Interface de status para mostrar estado da conexão

### Problemas Corrigidos Nesta Versão

1. **Jogo Local Duplicado**: Corrigido o problema onde duas instâncias do GameManager eram criadas
2. **UI Online Persistente**: Interface inicial agora esconde corretamente quando o jogo online inicia
3. **Workflow de Desenvolvimento**: Criado Makefile com comandos simplificados

## 📁 Estrutura Modular

O código foi modularizado da seguinte forma:

```
frontend/src/views/game/
├── Game.ts                 # Classe principal do jogo
├── GameModeSelector.ts     # Seletor de modo (local/online)
├── config.ts              # Configurações do jogo
└── managers/
    ├── GameManager.ts      # Gerenciador do jogo local
    ├── RemoteGameManager.ts # Gerenciador do jogo online
    ├── UIManager.ts        # Gerenciamento da interface
    ├── MatchManager.ts     # Lógica de partida
    ├── CollisionManager.ts # Detecção de colisões
    ├── FieldManager.ts     # Gerenciamento do campo
    ├── GameStateManager.ts # Estados do jogo
    ├── NetworkManager.ts   # Comunicação WebSocket
    ├── ScoreManager.ts     # Sistema de pontuação
    └── InputManager.ts     # Controles do jogador
```

## 🛠️ Comandos Disponíveis

### Frontend
- `make frontend-install` - Instalar dependências
- `make frontend-dev` - Servidor de desenvolvimento
- `make frontend-build` - Build para produção
- `make frontend-watch` - Desenvolvimento com CSS watch

### Full Stack
- `make fullstack-dev` - Iniciar tudo (backend + frontend)
- `make quick-backend` - Apenas backend (detached)
- `make quick-frontend` - Apenas frontend (assume backend rodando)

### Utilitários
- `make help` - Mostrar todos os comandos
- `make down` - Parar todos os serviços
- `make logs` - Ver logs dos serviços

## 🧪 Testando Multiplayer

1. Inicie o ambiente:
   ```bash
   make fullstack-dev
   ```

2. Abra duas abas/janelas do navegador em `http://localhost:8080`

3. Em cada aba:
   - Clique em "🌐 Online Multiplayer"
   - Digite um nome de jogador
   - Aguarde o matchmaking conectar os jogadores

4. Quando ambos estiverem conectados, o jogo iniciará automaticamente

## 🔧 Desenvolvimento

### Arquivo de Configuração

As configurações do jogo estão em `frontend/src/views/game/config.ts`:

```typescript
export const CONFIG = {
    CANVAS_ID: "gameCanvas",
    SCENE: {
        CLEAR_COLOR: Color4.FromColor3(Color3.Black()),
    },
    CAMERA: {
        BETA: Tools.ToRadians(50),
        RADIUS: 50,
        TARGET: Vector3.Zero()
    },
    // ... mais configurações
};
```

### Adicionando Novos Recursos

1. **Novos Modos de Jogo**: Modifique `GameModeSelector.ts`
2. **Lógica de Jogo**: Adicione em `managers/`
3. **Interface**: Modifique `UIManager.ts`
4. **Rede**: Estenda `NetworkManager.ts` e `RemoteGameManager.ts`

### Debugging

- Use `Shift + Ctrl + Alt + I` no jogo para abrir o Babylon.js Inspector
- Logs do WebSocket aparecerão no console do navegador
- Logs do backend: `make logs`

## 📝 TODO / Melhorias Futuras

- [ ] Sistema de ranking/leaderboard
- [ ] Reconnect automático em caso de queda de conexão
- [ ] Espectador mode
- [ ] Replay system
- [ ] Power-ups no modo online
- [ ] Salas privadas
- [ ] Chat durante o jogo

## 🐛 Problemas Conhecidos

- WebSocket pode demorar alguns segundos para conectar na primeira vez
- Em desenvolvimento, hot reload pode causar problemas de WebSocket (F5 resolve)

## 🆘 Ajuda

Se você tiver problemas:

1. Verifique se todos os serviços estão rodando: `make logs`
2. Reinstale dependências: `make frontend-install`
3. Limpe o ambiente: `make clean && make fullstack-dev`
4. Verifique o console do navegador para erros de JavaScript

Para mais informações, consulte o arquivo principal `README.md` ou `MULTIPLAYER_TEST_GUIDE.md`.
