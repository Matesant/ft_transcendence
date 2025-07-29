import { Scene, Vector3 } from "@babylonjs/core";
import { PowerUp } from "../gameObjects/PowerUp";
import { Ball, DIRECTION } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { ScoreManager } from "./ScoreManager";
import { CONFIG } from "../config";

export class PowerUpManager {
    private _scene: Scene;
    private _powerUps: PowerUp[] = [];
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _balls: Ball[] = [];
    private _scoreManager: ScoreManager;
    private _activeEffects: Map<string, NodeJS.Timeout> = new Map();
    private _nextSpawnTime: number = 0;
    
    // Add an active flag to control when power-ups should spawn
    private _active: boolean = false;
    
    // Add a flag to track the first spawn after activation
    private _isFirstSpawnAfterActivation: boolean = true;
    
    constructor(scene: Scene, leftPaddle: Paddle, rightPaddle: Paddle, ball: Ball, scoreManager: ScoreManager) {
        this._scene = scene;
        this._leftPaddle = leftPaddle;
        this._rightPaddle = rightPaddle;
        this._balls = [ball];
        this._scoreManager = scoreManager;
        
        this._scheduleNextSpawn();
    }
    
    private _scheduleNextSpawn(): void {
        let delay: number;
        
        if (this._isFirstSpawnAfterActivation) {
            delay = 1000;
            this._isFirstSpawnAfterActivation = false;
        } else {
            const min = CONFIG.POWER_UPS.SPAWN_INTERVAL.MIN;
            const max = CONFIG.POWER_UPS.SPAWN_INTERVAL.MAX;
            delay = Math.random() * (max - min) + min;
        }
        
        this._nextSpawnTime = Date.now() + delay;
    }
    
    public update(): void {
        if (!this._active) return;
        
        this._powerUps.forEach(powerUp => powerUp.update());
        
        if (Date.now() >= this._nextSpawnTime) {
            this._spawnRandomPowerUp();
            this._scheduleNextSpawn();
        }
        
        this._checkPowerUpCollisions();
    }
    
    private _spawnRandomPowerUp(): void {
        const powerUpTypes = Object.values(CONFIG.POWER_UPS.TYPES);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const x = (Math.random() * 8) - 4; 
        const z = (Math.random() * 12) - 6;
        const position = new Vector3(x, 0.2, z);
        
        const powerUp = new PowerUp(this._scene, randomType, position);
        this._powerUps.push(powerUp);
    }
    
    private _checkPowerUpCollisions(): void {
        for (const ball of this._balls) {
            if (!ball.active) continue;
            
            const ballPos = ball.mesh.position;
            
            for (let i = this._powerUps.length - 1; i >= 0; i--) {
                const powerUp = this._powerUps[i];
                if (!powerUp.active) continue;
                
                const powerUpPos = powerUp.mesh.position;
                const distance = Vector3.Distance(ballPos, powerUpPos);
                
                if (distance < (CONFIG.BALL.DIAMETER / 2 + CONFIG.POWER_UPS.DIMENSIONS.x / 2)) {
                    const forLeftPaddle = ball.velocity.z > 0;
                    this._activatePowerUp(powerUp.type, forLeftPaddle);
                    
                    powerUp.deactivate();
                    this._powerUps.splice(i, 1);
                }
            }
        }
    }
    
    private _activatePowerUp(type: string, forLeftPaddle: boolean): void {
        switch (type) {
            case CONFIG.POWER_UPS.TYPES.LARGER_PADDLE:
                this._applyPaddleResize(forLeftPaddle ? this._leftPaddle : this._rightPaddle, 1.5, type);
                break;
                
            case CONFIG.POWER_UPS.TYPES.SMALLER_OPPONENT:
                this._applyPaddleResize(forLeftPaddle ? this._rightPaddle : this._leftPaddle, 0.7, type);
                break;
                
            case CONFIG.POWER_UPS.TYPES.FAST_BALL:
                this._applyBallSpeedModifier(1.5, type);
                break;
                
            case CONFIG.POWER_UPS.TYPES.MULTI_BALL:
                this._createMultiBall();
                break;
        }
    }
    
    private _applyPaddleResize(paddle: Paddle, scaleFactor: number, effectType: string): void {
        const paddleId = paddle === this._leftPaddle ? 'left' : 'right';
        const effectKey = `${effectType}_${paddleId}`;
        
        if (this._activeEffects.has(effectKey)) {
            clearTimeout(this._activeEffects.get(effectKey));
        }
        
        paddle.resize(scaleFactor);
        
        const duration = effectType === CONFIG.POWER_UPS.TYPES.LARGER_PADDLE 
            ? CONFIG.POWER_UPS.DURATION.LARGER_PADDLE 
            : CONFIG.POWER_UPS.DURATION.DEFAULT;
        
        const timeout = setTimeout(() => {
            paddle.resize(1.0);
            this._activeEffects.delete(effectKey);
        }, duration);
        
        this._activeEffects.set(effectKey, timeout);
    }
    
    private _applyBallSpeedModifier(speedFactor: number, effectType: string): void {
        if (this._activeEffects.has(effectType)) {
            clearTimeout(this._activeEffects.get(effectType));
        }
        
        for (const ball of this._balls) {
            if (ball.active) {
                const currentVel = ball.velocity;
                const currentSpeed = currentVel.length();
                const normalizedVel = currentVel.normalize();
                ball.velocity = normalizedVel.scale(currentSpeed * speedFactor);
            }
        }
        
        const timeout = setTimeout(() => {
            for (const ball of this._balls) {
                if (ball.active) {
                    const currentVel = ball.velocity;
                    const normalizedVel = currentVel.normalize();
                    ball.velocity = normalizedVel.scale(CONFIG.BALL.NORMAL_SPEED);
                }
            }
            this._activeEffects.delete(effectType);
        }, CONFIG.POWER_UPS.DURATION.DEFAULT);
        
        this._activeEffects.set(effectType, timeout);
    }
    
    private _createMultiBall(): void {
        const newBall = new Ball(this._scene);
        
        const originalBall = this._balls[0];
        const offset = new Vector3(
            (Math.random() - 0.5) * CONFIG.BALL.DIAMETER * 4,
            0,
            (Math.random() - 0.5) * CONFIG.BALL.DIAMETER * 4
        );
        newBall.mesh.position = originalBall.mesh.position.add(offset);
        
        newBall.start();
        
        this._balls.push(newBall);
    }
    
    public get balls(): Ball[] {
        return this._balls;
    }
    
    public reset(): void {
        this._powerUps.forEach(powerUp => powerUp.deactivate());
        this._powerUps = [];
        
        this._activeEffects.forEach(timeout => clearTimeout(timeout));
        this._activeEffects.clear();
        
        this._leftPaddle.resize(1.0);
        this._rightPaddle.resize(1.0);
        
        for (let i = this._balls.length - 1; i > 0; i--) {
            const ball = this._balls[i];
            ball.mesh.dispose();
            this._balls.pop();
        }
        
        this._scheduleNextSpawn();
    }
    
    public activate(): void {
        this._active = true;
        
        this._spawnRandomPowerUp();
        
        this._scheduleNextSpawn();
    }

    public deactivate(): void {
        this._active = false;
    }
}