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
        
        // Set initial spawn time
        this._scheduleNextSpawn();
    }
    
    private _scheduleNextSpawn(): void {
        let delay: number;
        
        if (this._isFirstSpawnAfterActivation) {
            // For the first power-up after activation, appear within 1 second
            delay = 1000; // 1 second
            this._isFirstSpawnAfterActivation = false; // Reset flag after first spawn
        } else {
            // Use regular intervals for subsequent power-ups
            const min = CONFIG.POWER_UPS.SPAWN_INTERVAL.MIN;
            const max = CONFIG.POWER_UPS.SPAWN_INTERVAL.MAX;
            delay = Math.random() * (max - min) + min;
        }
        
        this._nextSpawnTime = Date.now() + delay;
    }
    
    // Update the update method to check the active flag
    public update(): void {
        // Only proceed if the manager is active
        if (!this._active) return;
        
        // Update existing power-ups
        this._powerUps.forEach(powerUp => powerUp.update());
        
        // Check if it's time to spawn a new power-up
        if (Date.now() >= this._nextSpawnTime) {
            this._spawnRandomPowerUp();
            this._scheduleNextSpawn();
        }
        
        // Check for collisions with power-ups
        this._checkPowerUpCollisions();
    }
    
    private _spawnRandomPowerUp(): void {
        // Get a random power-up type
        const powerUpTypes = Object.values(CONFIG.POWER_UPS.TYPES);
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        // Create a random position on the field
        const x = (Math.random() * 8) - 4; // Between -4 and 4
        const z = (Math.random() * 12) - 6; // Between -6 and 6
        const position = new Vector3(x, 0.2, z); // Slightly above the field
        
        // Create and add the power-up
        const powerUp = new PowerUp(this._scene, randomType, position);
        this._powerUps.push(powerUp);
    }
    
    private _checkPowerUpCollisions(): void {
        for (const ball of this._balls) {
            if (!ball.active) continue;
            
            const ballPos = ball.mesh.position;
            
            // Check each power-up for collision with the ball
            for (let i = this._powerUps.length - 1; i >= 0; i--) {
                const powerUp = this._powerUps[i];
                if (!powerUp.active) continue;
                
                const powerUpPos = powerUp.mesh.position;
                const distance = Vector3.Distance(ballPos, powerUpPos);
                
                // If the ball is close enough to the power-up, activate it
                if (distance < (CONFIG.BALL.DIAMETER / 2 + CONFIG.POWER_UPS.DIMENSIONS.x / 2)) {
                    // Determine which paddle gets the power-up based on ball direction
                    const forLeftPaddle = ball.velocity.z > 0;
                    this._activatePowerUp(powerUp.type, forLeftPaddle);
                    
                    // Remove the power-up
                    powerUp.deactivate();
                    this._powerUps.splice(i, 1);
                }
            }
        }
    }
    
    // Update the _activatePowerUp method to remove references to SLOW_BALL and EXTRA_POINT
    private _activatePowerUp(type: string, forLeftPaddle: boolean): void {
        // Apply the power-up effect
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
    
    // Update the _applyPaddleResize method to use different duration for larger paddle
    private _applyPaddleResize(paddle: Paddle, scaleFactor: number, effectType: string): void {
        // Clear any existing resize effect for this paddle
        const paddleId = paddle === this._leftPaddle ? 'left' : 'right';
        const effectKey = `${effectType}_${paddleId}`;
        
        if (this._activeEffects.has(effectKey)) {
            clearTimeout(this._activeEffects.get(effectKey));
        }
        
        // Apply the resize
        paddle.resize(scaleFactor);
        
        // Get the appropriate duration based on the effect type
        const duration = effectType === CONFIG.POWER_UPS.TYPES.LARGER_PADDLE 
            ? CONFIG.POWER_UPS.DURATION.LARGER_PADDLE 
            : CONFIG.POWER_UPS.DURATION.DEFAULT;
        
        // Set timeout to revert the effect
        const timeout = setTimeout(() => {
            paddle.resize(1.0); // Reset to normal size
            this._activeEffects.delete(effectKey);
        }, duration);
        
        this._activeEffects.set(effectKey, timeout);
    }
    
    // Update the _applyBallSpeedModifier method to use default duration
    private _applyBallSpeedModifier(speedFactor: number, effectType: string): void {
        // Clear any existing speed effect
        if (this._activeEffects.has(effectType)) {
            clearTimeout(this._activeEffects.get(effectType));
        }
        
        // Apply speed modifier to all balls
        for (const ball of this._balls) {
            if (ball.active) {
                const currentVel = ball.velocity;
                const currentSpeed = currentVel.length();
                const normalizedVel = currentVel.normalize();
                ball.velocity = normalizedVel.scale(currentSpeed * speedFactor);
            }
        }
        
        // Set timeout to revert the effect
        const timeout = setTimeout(() => {
            // Reset ball speeds to normal
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
        // Create a new ball
        const newBall = new Ball(this._scene);
        
        // Set its position to a random position near the original ball
        const originalBall = this._balls[0];
        const offset = new Vector3(
            (Math.random() - 0.5) * CONFIG.BALL.DIAMETER * 4,
            0,
            (Math.random() - 0.5) * CONFIG.BALL.DIAMETER * 4
        );
        newBall.mesh.position = originalBall.mesh.position.add(offset);
        
        // Start with random direction
        newBall.start();
        
        // Add it to our balls array
        this._balls.push(newBall);
    }
    
    public get balls(): Ball[] {
        return this._balls;
    }
    
    public reset(): void {
        // Clear all active power-ups
        this._powerUps.forEach(powerUp => powerUp.deactivate());
        this._powerUps = [];
        
        // Clear all active effects
        this._activeEffects.forEach(timeout => clearTimeout(timeout));
        this._activeEffects.clear();
        
        // Reset paddles to normal size
        this._leftPaddle.resize(1.0);
        this._rightPaddle.resize(1.0);
        
        // Clear extra balls, keeping only the original
        for (let i = this._balls.length - 1; i > 0; i--) {
            const ball = this._balls[i];
            ball.mesh.dispose();
            this._balls.pop();
        }
        
        // Schedule next spawn
        this._scheduleNextSpawn();
    }
    
    // Add methods to activate/deactivate the power-up system
    public activate(): void {
        this._active = true;
        
        // Spawn first power-up immediately
        this._spawnRandomPowerUp();
        
        // Then schedule next ones with normal timing
        this._scheduleNextSpawn();
    }

    public deactivate(): void {
        this._active = false;
    }
}