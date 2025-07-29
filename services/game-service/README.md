# Game Service

Real-time multiplayer game service with WebSocket support for the ft_transcendence Pong game.

## Features

- **Real-time multiplayer**: WebSocket-based communication for low-latency gameplay
- **Matchmaking**: Automatic player matching system
- **Game state synchronization**: Server-authoritative game state with client prediction
- **Lag compensation**: Input buffering and interpolation for smooth gameplay
- **Disconnection handling**: Graceful handling of player disconnections
- **Health monitoring**: Game statistics and health check endpoints

## Architecture

### Components

1. **PlayerManager**: Manages connected players and matchmaking queue
2. **GameManager**: Manages active game rooms and game lifecycle
3. **GameRoom**: Individual game instances with physics simulation
4. **NetworkManager** (Frontend): WebSocket client for real-time communication

### Game Flow

1. Player connects to WebSocket endpoint
2. Player joins matchmaking queue
3. When 2 players are found, a GameRoom is created
4. Game starts with server-authoritative physics
5. Client inputs are sent to server and processed
6. Server broadcasts game state to both clients
7. Game ends when one player reaches 5 points

## API Endpoints

### WebSocket (`/ws`)

Real-time communication for gameplay.

#### Client → Server Messages

```javascript
// Join matchmaking queue
{
  type: 'join_queue',
  playerId: string,
  playerName: string
}

// Leave matchmaking queue
{
  type: 'leave_queue',
  playerId: string
}

// Send game input
{
  type: 'game_input',
  playerId: string,
  input: {
    action: 'move_left' | 'move_right',
    timestamp: number
  }
}

// Ping for connection health
{
  type: 'ping',
  timestamp: number
}
```

#### Server → Client Messages

```javascript
// Match found
{
  type: 'match_found',
  gameId: string,
  opponent: { id: string, name: string },
  playerSide: 'left' | 'right'
}

// Game started
{
  type: 'game_start',
  gameState: GameState,
  gameId: string
}

// Game state update
{
  type: 'game_state',
  state: GameState,
  tick: number,
  timestamp: number
}

// Player scored
{
  type: 'score',
  scorer: string,
  score: { player1: number, player2: number }
}

// Game ended
{
  type: 'game_end',
  winner: { id: string, name: string },
  finalScore: { player1: number, player2: number }
}

// Opponent disconnected
{
  type: 'opponent_disconnected',
  message: string
}
```

### HTTP Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "game-service",
  "timestamp": "2025-07-16T10:30:00.000Z"
}
```

#### `GET /games/stats`
Game statistics.

**Response:**
```json
{
  "totalGames": 42,
  "activeGames": 3,
  "totalPlayers": 10,
  "onlinePlayers": 6
}
```

## Game State

The server maintains authoritative game state:

```javascript
{
  ball: {
    x: number,        // Ball X position
    z: number,        // Ball Z position
    velocityX: number, // Ball X velocity
    velocityZ: number  // Ball Z velocity
  },
  paddles: {
    left: { x: number, z: number },   // Left paddle position
    right: { x: number, z: number }   // Right paddle position
  },
  score: {
    player1: number,  // Player 1 score
    player2: number   // Player 2 score
  },
  powerUpsEnabled: boolean,
  speedMultiplier: number
}
```

## Network Optimization

### Client-Side Optimizations

1. **Input Throttling**: Inputs are limited to 60 FPS to reduce network traffic
2. **State Interpolation**: Smooth visual updates between server states
3. **Predictive Movement**: Client predicts own paddle movement for responsiveness
4. **Connection Health**: Ping/pong system monitors connection quality

### Server-Side Optimizations

1. **Game Loop**: 60 FPS physics simulation
2. **State Broadcasting**: Efficient state synchronization at 60 FPS
3. **Input Buffering**: Lag compensation through input buffering
4. **Cleanup**: Automatic cleanup of inactive games and disconnected players

## Development

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd services/game-service
npm install
```

### Running

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Docker

```bash
# Build and run with docker-compose
docker-compose up game-service
```

The service will be available at:
- WebSocket: `ws://localhost:3003/ws`
- HTTP API: `http://localhost:3003`

## Configuration

Environment variables:

- `PORT`: Service port (default: 3003)
- `JWT_SECRET`: JWT secret for authentication
- `COOKIE_SECRET`: Cookie secret
- `NODE_ENV`: Environment (development/production)

## Integration with Frontend

The frontend uses the `NetworkManager` class to communicate with the game service:

```typescript
import { NetworkManager } from './managers/NetworkManager';

const networkManager = new NetworkManager();

// Connect and join queue
await networkManager.connect(playerId, playerName);
networkManager.joinQueue();

// Handle events
networkManager.onMatchFound((data) => {
});

networkManager.onGameState((state) => {
  // Update game visuals
});

// Send input
networkManager.sendInput('move_left');
```

## Performance Considerations

- **Tick Rate**: 60 FPS server simulation for responsive gameplay
- **Network Rate**: State updates sent at 60 FPS with efficient serialization
- **Memory**: Automatic cleanup prevents memory leaks
- **Scalability**: Stateless design allows horizontal scaling

## Future Enhancements

- [ ] Spectator mode
- [ ] Tournament brackets
- [ ] Replay system
- [ ] Advanced matchmaking (ranking-based)
- [ ] Regional servers
- [ ] Mobile support
- [ ] Power-ups in multiplayer mode
