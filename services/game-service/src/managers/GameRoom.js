import { EventEmitter } from 'events';

// Constants aligned with frontend configuration so that
// server-side physics matches local gameplay.
const FIELD_HALF_WIDTH = 6;        // FIELD.WIDTH / 2 from frontend
const SCORE_BOUNDARY = 8.5;        // CONFIG.SCORE.BOUNDARY
const PADDLE_Z_LEFT = -8.25;       // CONFIG.PADDLE.POSITION.LEFT.z
const PADDLE_Z_RIGHT = 8.25;       // CONFIG.PADDLE.POSITION.RIGHT.z
const PADDLE_COLLISION = {
    LEFT_MIN_Z: -8.45,
    LEFT_MAX_Z: -8.05,
    RIGHT_MIN_Z: 8.05,
    RIGHT_MAX_Z: 8.45
};
const PADDLE_MOVE_LIMIT = 5.4;     // CONFIG.PADDLE.POSITION_LIMIT
const BALL_INITIAL_SPEED = 0.1;    // CONFIG.BALL.INITIAL_SPEED
const BALL_NORMAL_SPEED = 0.15;    // CONFIG.BALL.NORMAL_SPEED
const PADDLE_HALF_WIDTH = 0.65;    // CONFIG.PADDLE.DIMENSIONS.x / 2

export class GameRoom extends EventEmitter {
    constructor(id, player1, player2) {
        super();
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.state = 'waiting'; // waiting, playing, paused, finished
        this.lastActivity = Date.now();
        
        // Game state
        this.gameState = {
            ball: {
                x: 0,
                z: 0,
                velocityX: 0,
                velocityZ: 0
            },
            paddles: {
                left: { x: 0, z: PADDLE_Z_LEFT },
                right: { x: 0, z: PADDLE_Z_RIGHT }
            },
            score: {
                player1: 0,
                player2: 0
            },
            powerUpsEnabled: false,
            speedMultiplier: 1.0
        };
        
        // Input buffers for lag compensation
        this.inputBuffer = new Map(); // playerId -> [inputs]
        this.gameLoop = null;
        this.tickRate = 60; // 60 FPS
        this.tick = 0;
        
        // Network optimization
        this.lastStateSync = 0;
        this.stateSyncInterval = 16; // ~60 FPS (16ms)

        // Track first paddle collision to accelerate the ball
        this.firstCollision = true;
    }

    startGame() {
        if (this.state !== 'waiting') return;
        
        this.state = 'playing';
        this.lastActivity = Date.now();
        
        // Initialize game state
        this.resetGame();
        
        // Notify players that game is starting
        this.broadcastToPlayers({
            type: 'game_start',
            gameState: this.gameState,
            gameId: this.id
        });
        
        // Start game loop
        this.startGameLoop();
        
        console.log(`Game ${this.id} started`);
    }

    startGameLoop() {
        const targetInterval = 1000 / this.tickRate;
        
        this.gameLoop = setInterval(() => {
            this.updateGame();
            this.tick++;
        }, targetInterval);
    }

    updateGame() {
        if (this.state !== 'playing') return;
        
        this.lastActivity = Date.now();
        
        // Process inputs
        this.processInputs();
        
        // Update physics
        this.updatePhysics();
        
        // Check win condition
        this.checkWinCondition();
        
        // Sync state to clients (not every tick to save bandwidth)
        if (Date.now() - this.lastStateSync > this.stateSyncInterval) {
            this.syncGameState();
            this.lastStateSync = Date.now();
        }
    }

    processInputs() {
        // Process player 1 inputs (left paddle)
        const p1Inputs = this.inputBuffer.get(this.player1.id) || [];
        for (const input of p1Inputs) {
            this.applyInput(this.player1.id, input);
        }
        this.inputBuffer.set(this.player1.id, []);
        
        // Process player 2 inputs (right paddle)
        const p2Inputs = this.inputBuffer.get(this.player2.id) || [];
        for (const input of p2Inputs) {
            this.applyInput(this.player2.id, input);
        }
        this.inputBuffer.set(this.player2.id, []);
    }

    applyInput(playerId, input) {
        const isPlayer1 = playerId === this.player1.id;
        const paddle = isPlayer1 ? this.gameState.paddles.left : this.gameState.paddles.right;
        
        const moveSpeed = 0.2 * this.gameState.speedMultiplier;
        const maxX = PADDLE_MOVE_LIMIT; // Match frontend paddle boundary
        
        switch (input.action) {
            case 'move_left':
                paddle.x = Math.max(-maxX, paddle.x - moveSpeed);
                break;
            case 'move_right':
                paddle.x = Math.min(maxX, paddle.x + moveSpeed);
                break;
        }
    }

    updatePhysics() {
        // Update ball position
        this.gameState.ball.x += this.gameState.ball.velocityX;
        this.gameState.ball.z += this.gameState.ball.velocityZ;
        
        // Ball collision with walls
        if (this.gameState.ball.x <= -FIELD_HALF_WIDTH || this.gameState.ball.x >= FIELD_HALF_WIDTH) {
            this.gameState.ball.velocityX *= -1;
            this.gameState.ball.x = Math.max(-(FIELD_HALF_WIDTH - 0.1), Math.min(FIELD_HALF_WIDTH - 0.1, this.gameState.ball.x));
        }
        
        // Ball collision with paddles
        this.checkPaddleCollisions();
        
        // Ball scoring
        if (this.gameState.ball.z <= -SCORE_BOUNDARY) {
            // Player 2 scores
            this.gameState.score.player2++;
            this.resetBall(1); // Ball goes toward player 1
            this.broadcastToPlayers({
                type: 'score',
                scorer: this.player2.id,
                score: this.gameState.score
            });
        } else if (this.gameState.ball.z >= SCORE_BOUNDARY) {
            // Player 1 scores
            this.gameState.score.player1++;
            this.resetBall(-1); // Ball goes toward player 2
            this.broadcastToPlayers({
                type: 'score',
                scorer: this.player1.id,
                score: this.gameState.score
            });
        }
    }

    checkPaddleCollisions() {
        const ball = this.gameState.ball;
        const leftPaddle = this.gameState.paddles.left;
        const rightPaddle = this.gameState.paddles.right;
        
        // Left paddle collision
        if (ball.z <= PADDLE_COLLISION.LEFT_MAX_Z && ball.z >= PADDLE_COLLISION.LEFT_MIN_Z &&
            Math.abs(ball.x - leftPaddle.x) < PADDLE_HALF_WIDTH) {
            // Ensure ball goes up
            ball.velocityZ = Math.abs(ball.velocityZ);
            this.handleFirstCollision(ball);
            this.addSpin(ball, leftPaddle);
        }

        // Right paddle collision
        if (ball.z >= PADDLE_COLLISION.RIGHT_MIN_Z && ball.z <= PADDLE_COLLISION.RIGHT_MAX_Z &&
            Math.abs(ball.x - rightPaddle.x) < PADDLE_HALF_WIDTH) {
            // Ensure ball goes down
            ball.velocityZ = -Math.abs(ball.velocityZ);
            this.handleFirstCollision(ball);
            this.addSpin(ball, rightPaddle);
        }
    }

    handleFirstCollision(ball) {
        if (this.firstCollision) {
            this.firstCollision = false;
            const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityZ * ball.velocityZ);
            const normX = ball.velocityX / speed;
            const normZ = ball.velocityZ / speed;
            ball.velocityX = normX * BALL_NORMAL_SPEED * this.gameState.speedMultiplier;
            ball.velocityZ = normZ * BALL_NORMAL_SPEED * this.gameState.speedMultiplier;
        }
    }

    addSpin(ball, paddle) {
        const hitFactor = (ball.x - paddle.x) / 0.8;
        ball.velocityX += hitFactor * 0.1; // Match CONFIG.BALL.SPIN_FACTOR

        // Ensure minimum speed
        const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityZ * ball.velocityZ);
        if (speed < 0.05) {
            const factor = 0.05 / speed;
            ball.velocityX *= factor;
            ball.velocityZ *= factor;
        }
    }

    resetBall(direction = 1) {
        this.firstCollision = true;
        this.gameState.ball = {
            x: 0,
            z: 0,
            velocityX: (Math.random() - 0.5) * BALL_INITIAL_SPEED,
            velocityZ: direction * BALL_INITIAL_SPEED * this.gameState.speedMultiplier
        };
    }

    resetGame() {
        this.gameState = {
            ball: {
                x: 0,
                z: 0,
                velocityX: (Math.random() - 0.5) * BALL_INITIAL_SPEED,
                velocityZ: (Math.random() > 0.5 ? 1 : -1) * BALL_INITIAL_SPEED
            },
            paddles: {
                left: { x: 0, z: PADDLE_Z_LEFT },
                right: { x: 0, z: PADDLE_Z_RIGHT }
            },
            score: {
                player1: 0,
                player2: 0
            },
            powerUpsEnabled: false,
            speedMultiplier: 1.0
        };
        this.firstCollision = true;
    }

    checkWinCondition() {
        const winScore = 5;
        if (this.gameState.score.player1 >= winScore) {
            this.endGame(this.player1.id);
        } else if (this.gameState.score.player2 >= winScore) {
            this.endGame(this.player2.id);
        }
    }

    endGame(winnerId) {
        if (this.state === 'finished') return;
        
        this.state = 'finished';
        clearInterval(this.gameLoop);
        
        const winner = winnerId === this.player1.id ? this.player1 : this.player2;
        
        this.broadcastToPlayers({
            type: 'game_end',
            winner: {
                id: winnerId,
                name: winner.name
            },
            finalScore: this.gameState.score
        });
        
        this.emit('game_end', {
            gameId: this.id,
            winner: winnerId,
            score: this.gameState.score
        });
        
        console.log(`Game ${this.id} ended. Winner: ${winner.name}`);
    }

    handlePlayerInput(playerId, input) {
        if (this.state !== 'playing') return;
        
        // Add input to buffer with timestamp for lag compensation
        const inputs = this.inputBuffer.get(playerId) || [];
        inputs.push({
            ...input,
            timestamp: Date.now(),
            tick: this.tick
        });
        this.inputBuffer.set(playerId, inputs);
    }

    handlePlayerDisconnect(playerId) {
        if (this.state === 'finished') return;
        
        const disconnectedPlayer = playerId === this.player1.id ? this.player1 : this.player2;
        const remainingPlayer = playerId === this.player1.id ? this.player2 : this.player1;
        
        // Notify remaining player
        if (remainingPlayer.connection) {
            remainingPlayer.connection.socket.send(JSON.stringify({
                type: 'opponent_disconnected',
                message: `${disconnectedPlayer.name} disconnected`
            }));
        }
        
        // End game with remaining player as winner
        this.endGame(remainingPlayer.id);
    }

    syncGameState() {
        this.broadcastToPlayers({
            type: 'game_state',
            state: this.gameState,
            tick: this.tick,
            timestamp: Date.now()
        });
    }

    broadcastToPlayers(message) {
        if (this.player1.connection) {
            this.player1.connection.socket.send(JSON.stringify(message));
        }
        if (this.player2.connection) {
            this.player2.connection.socket.send(JSON.stringify(message));
        }
    }

    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.broadcastToPlayers({
                type: 'game_paused'
            });
        }
    }

    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.broadcastToPlayers({
                type: 'game_resumed'
            });
        }
    }
}
