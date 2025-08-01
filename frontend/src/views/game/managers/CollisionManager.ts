import { Ball, DIRECTION } from "../gameObjects/Ball";
import { Paddle } from "../gameObjects/Paddle";
import { ScoreManager } from "./ScoreManager";
import { PowerUpManager } from "./PowerUpManager";
import { CONFIG } from "../config";

export class CollisionManager {
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _ball: Ball;
    private _scoreManager: ScoreManager;
    private _powerUpManager: PowerUpManager;
    private _speedMultiplier: number;
    private _firstCollision: boolean = true;
    private _ballReleaseTimer: number | null = null;
    
    private _onScore: () => void;

    constructor(
        leftPaddle: Paddle,
        rightPaddle: Paddle,
        ball: Ball,
        scoreManager: ScoreManager,
        powerUpManager: PowerUpManager,
        onScore: () => void
    ) {
        this._leftPaddle = leftPaddle;
        this._rightPaddle = rightPaddle;
        this._ball = ball;
        this._scoreManager = scoreManager;
        this._powerUpManager = powerUpManager;
        this._onScore = onScore;
        this._speedMultiplier = CONFIG.SPEED.MULTIPLIER.DEFAULT;
    }

    public setSpeedMultiplier(speed: number): void {
        this._speedMultiplier = speed;
    }

    public setFirstCollision(value: boolean): void {
        this._firstCollision = value;
    }

    public clearBallReleaseTimer(): void {
        if (this._ballReleaseTimer) {
            window.clearTimeout(this._ballReleaseTimer);
            this._ballReleaseTimer = null;
        }
    }

    public checkCollisions(): void {
        const balls = this._powerUpManager.balls;
        
        for (const ball of balls) {
            if (!ball.active) continue;
            
            const ballPos = ball.mesh.position;
            
            this._checkWallCollisions(ball, ballPos);
            
            this._checkPaddleCollisions(ball, ballPos);
            
            this._checkScoring(ball, ballPos);
        }
    }

    private _checkWallCollisions(ball: Ball, ballPos: any): void {
        const wallBoundary = CONFIG.FIELD.WIDTH / 2 - 0.2;
        if (ballPos.x <= -wallBoundary || ballPos.x >= wallBoundary) {
            if (ballPos.x <= -wallBoundary) {
                ballPos.x = -wallBoundary + 0.05;
            } else {
                ballPos.x = wallBoundary - 0.05;
            }
            
            ball.reverseX();
        }
    }

    private _checkPaddleCollisions(ball: Ball, ballPos: any): void {
        if (ballPos.z <= CONFIG.PADDLE.COLLISION.LEFT.MAX_Z && 
            ballPos.z >= CONFIG.PADDLE.COLLISION.LEFT.MIN_Z &&
            Math.abs(ballPos.x - this._leftPaddle.mesh.position.x) < this._leftPaddle.width / 2 * this._leftPaddle.mesh.scaling.x) {
            
            ball.reverseZ();
            this._handlePaddleHit(ball, ballPos, this._leftPaddle);
        }
        
        if (ballPos.z >= CONFIG.PADDLE.COLLISION.RIGHT.MIN_Z && 
            ballPos.z <= CONFIG.PADDLE.COLLISION.RIGHT.MAX_Z &&
            Math.abs(ballPos.x - this._rightPaddle.mesh.position.x) < this._rightPaddle.width / 2 * this._rightPaddle.mesh.scaling.x) {
            
            ball.reverseZ();
            this._handlePaddleHit(ball, ballPos, this._rightPaddle);
        }
    }

    private _handlePaddleHit(ball: Ball, ballPos: any, paddle: Paddle): void {
        if (this._firstCollision) {
            this._firstCollision = false;
            const currentVelocity = ball.velocity;
            const normalizedVelocity = currentVelocity.normalize();
            ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED * this._speedMultiplier);
        }
        
        const hitFactor = (ballPos.x - paddle.mesh.position.x) / (paddle.width / 2 * paddle.mesh.scaling.x);
        ball.addSpin(hitFactor);
    }

    private _checkScoring(ball: Ball, ballPos: any): void {
        if (ballPos.z > CONFIG.SCORE.BOUNDARY.RIGHT) {
            this._scoreManager.player2Scores();
            this._handleScoring(ball, DIRECTION.LEFT);
        }
        
        if (ballPos.z < CONFIG.SCORE.BOUNDARY.LEFT) {
            this._scoreManager.player1Scores();
            this._handleScoring(ball, DIRECTION.RIGHT);
        }
    }

    private _handleScoring(ball: Ball, direction: typeof DIRECTION[keyof typeof DIRECTION]): void {
        if (ball === this._ball) {
            this._powerUpManager.reset();
            this._ball.reset();
            this._firstCollision = true;
            
            if (this._ballReleaseTimer) {
                window.clearTimeout(this._ballReleaseTimer);
                this._ballReleaseTimer = null;
            }
            
            this._ballReleaseTimer = window.setTimeout(() => {
                this._ball.start(direction);
                this._applySpeedMultiplierToBall(this._ball);
                this._ballReleaseTimer = null;
            }, 500) as number;
            
        } else {
            ball.reset();
            ball.active = false;
            const ballIndex = this._powerUpManager.balls.indexOf(ball);
            if (ballIndex > 0) {
                this._powerUpManager.balls.splice(ballIndex, 1);
                ball.mesh.dispose();
            }
        }
        
        this._onScore();
    }

    private _applySpeedMultiplierToBall(ball: Ball): void {
        const currentVel = ball.velocity;
        ball.velocity = currentVel.scale(this._speedMultiplier);
    }
}
