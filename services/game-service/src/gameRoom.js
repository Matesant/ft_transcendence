export class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // Map of connection -> player data
    this.gameState = {
      ball: { x: 0, y: 0.2, z: 0 },
      leftPaddle: { x: 0 },
      rightPaddle: { x: 0 },
      score: { player1: 0, player2: 0 }
    };
    this.playerCount = 0;
    this.interval = null;
  }

  addPlayer(connection, alias) {
    const playerNumber = this.playerCount + 1;
    if (playerNumber > 2) {
      connection.socket.send(JSON.stringify({
        type: "ERROR",
        message: "Room is full"
      }));
      connection.socket.close();
      return;
    }

    this.players.set(connection, {
      alias,
      side: playerNumber === 1 ? "left" : "right"
    });
    
    this.playerCount++;
    
    connection.socket.on('message', (message) => this.handleMessage(connection, message));
    connection.socket.on('close', () => this.removePlayer(connection));
    
    // Send initial game state and player assignment
    connection.socket.send(JSON.stringify({
      type: "JOINED",
      side: playerNumber === 1 ? "left" : "right",
      roomId: this.id
    }));

    // Start game when two players join
    if (this.playerCount === 2) {
      this.startGame();
    }
  }

  removePlayer(connection) {
    this.players.delete(connection);
    this.playerCount--;
    
    // Notify remaining players that opponent left
    this.broadcastMessage({
      type: "PLAYER_LEFT"
    });
    
    // Stop game loop if active
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  handleMessage(connection, message) {
    try {
      const data = JSON.parse(message);
      const player = this.players.get(connection);
      
      if (data.type === "PADDLE_MOVE") {
        // Update paddle position based on which side this player controls
        if (player.side === "left") {
          this.gameState.leftPaddle.x = data.x;
        } else {
          this.gameState.rightPaddle.x = data.x;
        }
        
        // Broadcast updated paddle position to all players
        this.broadcastMessage({
          type: "PADDLE_UPDATE",
          side: player.side,
          x: data.x
        });
      } else if (data.type === "SCORE_UPDATE") {
        // Update score
        this.gameState.score = data.score;
        this.broadcastMessage({
          type: "SCORE_UPDATE",
          score: data.score
        });
      } else if (data.type === "BALL_UPDATE") {
        // Update ball position (from controlling client)
        this.gameState.ball = data.ball;
        this.broadcastMessage({
          type: "BALL_UPDATE",
          ball: data.ball
        });
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }

  broadcastMessage(data) {
    const message = JSON.stringify(data);
    this.players.forEach((player, connection) => {
      if (connection.socket.readyState === 1) { // WebSocket.OPEN
        connection.socket.send(message);
      }
    });
  }

  startGame() {
    this.broadcastMessage({
      type: "GAME_START"
    });
  }
}