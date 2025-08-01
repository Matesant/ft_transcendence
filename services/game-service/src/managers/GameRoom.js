import { EventEmitter } from 'events';

const FIELD_HALF_WIDTH = 6;
const SCORE_BOUNDARY = 8.5;
const PADDLE_Z_LEFT = -8.25;
const PADDLE_Z_RIGHT = 8.25;
const PADDLE_COLLISION = {
    LEFT_MIN_Z: -8.45,
    LEFT_MAX_Z: -8.05,
    RIGHT_MIN_Z: 8.05,
    RIGHT_MAX_Z: 8.45
};
const PADDLE_MOVE_LIMIT = 5.4;
const BALL_INITIAL_SPEED = 0.1;
const BALL_NORMAL_SPEED = 0.15;
const PADDLE_HALF_WIDTH = 0.65;

export class GameRoom extends EventEmitter {
    constructor(id, player1, player2) {
        super();
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.state = 'waiting';
        this.lastActivity = Date.now();
        
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
        
        this.inputBuffer = new Map();
        this.gameLoop = null;
        this.tickRate = 60;
        this.tick = 0;
        
        this.lastStateSync = 0;
        this.stateSyncInterval = 16;

        this.firstCollision = true;
        
        this.ballReleaseTimer = null;
    }

    startGame() {
        if (this.state !== 'waiting') return;
        
        this.state = 'playing';
        this.lastActivity = Date.now();
        
        this.resetGame();
        this.gameState.ball.velocityX = 0;
        this.gameState.ball.velocityZ = 0;
        
        this.broadcastToPlayers({
            type: 'game_start',
            gameState: this.gameState,
            gameId: this.id
        });
        
        this.startGameLoop();
        
        if (this.ballReleaseTimer) {
            clearTimeout(this.ballReleaseTimer);
            this.ballReleaseTimer = null;
        }
        
        this.ballReleaseTimer = setTimeout(() => {
            this.releaseBall();
            this.ballReleaseTimer = null;
        }, 5000);
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
        
        this.processInputs();
        
        this.updatePhysics();
        
        this.checkWinCondition();
        
        if (Date.now() - this.lastStateSync > this.stateSyncInterval) {
            this.syncGameState();
            this.lastStateSync = Date.now();
        }
    }

    processInputs() {
        const p1Inputs = this.inputBuffer.get(this.player1.id) || [];
        for (const input of p1Inputs) {
            this.applyInput(this.player1.id, input);
        }
        this.inputBuffer.set(this.player1.id, []);
        
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
        const maxX = PADDLE_MOVE_LIMIT;
        
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
        this.gameState.ball.x += this.gameState.ball.velocityX;
        this.gameState.ball.z += this.gameState.ball.velocityZ;
        
        if (this.gameState.ball.x <= -FIELD_HALF_WIDTH || this.gameState.ball.x >= FIELD_HALF_WIDTH) {
            this.gameState.ball.velocityX *= -1;
            this.gameState.ball.x = Math.max(-(FIELD_HALF_WIDTH - 0.1), Math.min(FIELD_HALF_WIDTH - 0.1, this.gameState.ball.x));
        }
        
        this.checkPaddleCollisions();
        
        if (this.gameState.ball.z <= -SCORE_BOUNDARY) {
            this.gameState.score.player2++;
            this.resetBall(1);
            this.broadcastToPlayers({
                type: 'score',
                scorer: this.player2.id,
                score: this.gameState.score
            });
        } else if (this.gameState.ball.z >= SCORE_BOUNDARY) {
            this.gameState.score.player1++;
            this.resetBall(-1);
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
        
        if (ball.z <= PADDLE_COLLISION.LEFT_MAX_Z && ball.z >= PADDLE_COLLISION.LEFT_MIN_Z &&
            Math.abs(ball.x - leftPaddle.x) < PADDLE_HALF_WIDTH) {
            ball.velocityZ = Math.abs(ball.velocityZ);
            this.handleFirstCollision(ball);
            this.addSpin(ball, leftPaddle);
        }

        if (ball.z >= PADDLE_COLLISION.RIGHT_MIN_Z && ball.z <= PADDLE_COLLISION.RIGHT_MAX_Z &&
            Math.abs(ball.x - rightPaddle.x) < PADDLE_HALF_WIDTH) {
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
        ball.velocityX += hitFactor * 0.1;

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
            velocityX: 0,
            velocityZ: 0
        };
        
        if (this.ballReleaseTimer) {
            clearTimeout(this.ballReleaseTimer);
            this.ballReleaseTimer = null;
        }
        
        this.ballReleaseTimer = setTimeout(() => {
            if (this.state === 'playing') {
                this.gameState.ball.velocityX = (Math.random() - 0.5) * BALL_INITIAL_SPEED;
                this.gameState.ball.velocityZ = direction * BALL_INITIAL_SPEED * this.gameState.speedMultiplier;
                console.log(`Ball released after point scored in game ${this.id}`);
            }
            this.ballReleaseTimer = null;
        }, 300);
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
        
        if (this.ballReleaseTimer) {
            clearTimeout(this.ballReleaseTimer);
            this.ballReleaseTimer = null;
        }
        
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
        
        if (remainingPlayer.connection) {
            remainingPlayer.connection.socket.send(JSON.stringify({
                type: 'opponent_disconnected',
                message: `${disconnectedPlayer.name} disconnected`
            }));
        }
        
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
            
            if (this.ballReleaseTimer) {
                clearTimeout(this.ballReleaseTimer);
                this.ballReleaseTimer = null;
            }
            
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

    releaseBall() {
        if (this.state !== 'playing') return;
        
        this.gameState.ball.velocityX = (Math.random() - 0.5) * BALL_INITIAL_SPEED;
        this.gameState.ball.velocityZ = (Math.random() > 0.5 ? 1 : -1) * BALL_INITIAL_SPEED * this.gameState.speedMultiplier;
        
        console.log(`Ball released in game ${this.id}`);
    }
}
