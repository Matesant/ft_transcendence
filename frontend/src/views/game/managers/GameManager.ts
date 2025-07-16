import { Scene, MeshBuilder, StandardMaterial, Mesh } from "@babylonjs/core";
import { Ball, DIRECTION } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";
import { PowerUpManager } from "./PowerUpManager";
import { STRINGS, Language } from "../../i18n";
import { MultiplayerManager } from "../core/MultiplayerManager";
import { UIManager } from "../core/UIManager";
import { ThemeManager } from "../core/ThemeManager";
import { SpeedManager } from "../core/SpeedManager";

// Simple enum for game states (removed PAUSED)
enum GameState {
    MENU,
    PLAYING,
    GAME_OVER
}

// Enum para modo de jogo multiplayer
export enum GameMode {
    SINGLE_PLAYER,
    MULTIPLAYER_HOST,
    MULTIPLAYER_JOIN
}

interface MatchInfo {
    id: number;
    player1: string;
    player2: string;
    round: number;
    status: string;
}

export class GameManager {
    private _scene: Scene;
    private _ball: Ball;
    private _leftPaddle: Paddle;
    private _rightPaddle: Paddle;
    private _scoreManager: ScoreManager;
    private _inputManager: InputManager;
    private _firstCollision: boolean = true;
    private _gameState: GameState = GameState.MENU;
    
    private _menuUI: HTMLDivElement;
    private _gameOverUI: HTMLDivElement;
    private _powerUpManager: PowerUpManager;
    
    // Add a field to track the current game mode
    private _powerUpsEnabled: boolean = false;

    // Add these as new properties to the GameManager class
    private _currentMatch: MatchInfo | null = null;
    private _player1Name: string = "Player 1";
    private _player2Name: string = "Player 2";
    
    private _lang: Language = "ptBR"; // Set Brazilian Portuguese as default

    // Unificar campos extras
    private _speedMultiplier: number = CONFIG.SPEED.MULTIPLIER.DEFAULT;
    private _tableTheme: 'GREEN' | 'BLUE' = 'GREEN';
    private _ground: Mesh;
    // Multiplayer manager
    private _multiplayerManager: MultiplayerManager;
    private _uiManager: UIManager;
    private _themeManager: ThemeManager;
    private _speedManager: SpeedManager;

    constructor(scene: Scene) {
        this._scene = scene;
        this._scoreManager = new ScoreManager();
        this._inputManager = new InputManager();

        // Initialize game objects
        this._ball = new Ball(scene);
        this._leftPaddle = new Paddle(scene, PaddleType.LEFT);
        this._rightPaddle = new Paddle(scene, PaddleType.RIGHT);
        new Wall(scene, WallType.TOP);
        new Wall(scene, WallType.BOTTOM);

        // Create playing field and UI
        this._createPlayingField();
        this._uiManager = new UIManager();
        this._menuUI = this._uiManager.createMenuUI(
            this._player1Name,
            this._player2Name,
            this._currentMatch,
            () => {
                console.log('[Multiplayer] Iniciar jogo single player');
                this._startGame(false);
            },
            () => {
                console.log('[Multiplayer] Iniciar jogo com power-ups');
                this._startGame(true);
            },
            async () => {
                console.log('[Multiplayer] Host: criar sala');
                this._multiplayerManager.gameMode = GameMode.MULTIPLAYER_HOST;
                await this._setupMultiplayer(true);
            },
            async () => {
                console.log('[Multiplayer] Join: entrar em sala');
                this._multiplayerManager.gameMode = GameMode.MULTIPLAYER_JOIN;
                await this._setupMultiplayer(false);
            }
        );
        this._gameOverUI = this._uiManager.createGameOverUI(
            () => { this._resetGame(); this._startGame(this._powerUpsEnabled); },
            async () => { await this._showMenu(); }
        );
        this._createLanguageSelector();
        this._powerUpManager = new PowerUpManager(
            scene,
            this._leftPaddle,
            this._rightPaddle,
            this._ball,
            this._scoreManager
        );
        this._multiplayerManager = new MultiplayerManager();
        this._loadCurrentMatch();
        (async () => {
            await this._showMenu();
        })();
        this._themeManager = new ThemeManager(scene, this._ground);
        this._speedManager = new SpeedManager(CONFIG.SPEED.MULTIPLIER.DEFAULT);
    }
    
    private async _loadCurrentMatch(): Promise<void> {
        try {
            const response = await fetch('http://localhost:3002/match/next', {
                method: 'GET',
                credentials: 'include' // Include authentication cookies
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Check if tournament is complete - if yes, reset to practice mode
                if (data.tournamentComplete) {
                    console.log('Tournament is complete, using practice mode');
                    this._currentMatch = null;
                    this._player1Name = "Player 1";
                    this._player2Name = "Player 2";
                    this._scoreManager.setPlayerNames(this._player1Name, this._player2Name);
                    return;
                }
                
                // Normal match loading logic
                if (data.match) {
                    this._currentMatch = data.match;
                    this._player1Name = data.match.player1;
                    this._player2Name = data.match.player2;
                    
                    // Update score manager with player names
                    this._scoreManager.setPlayerNames(this._player1Name, this._player2Name);
                    
                    console.log(`Match loaded: ${this._player1Name} vs ${this._player2Name}`);
                } else {
                    console.log('No matches available');
                    // Set default names if no match
                    this._player1Name = "Player 1";
                    this._player2Name = "Player 2";
                    this._scoreManager.setPlayerNames(this._player1Name, this._player2Name);
                }
            }
        } catch (error) {
            console.error('Failed to load match:', error);
            // Use default names on error
            this._player1Name = "Player 1";
            this._player2Name = "Player 2";
            this._scoreManager.setPlayerNames(this._player1Name, this._player2Name);
        }
    }
    
    private _updateMatchInfoDisplay(element: HTMLElement): void {
        if (this._currentMatch) {
            element.innerHTML = `
                <div><strong>${STRINGS[this._lang].currentMatch}</strong></div>
                <div>${this._player1Name} vs ${this._player2Name}</div>
                <div>${STRINGS[this._lang].round} ${this._currentMatch.round}</div>
            `;
        } else if (
            this._player1Name !== "Player 1" &&
            this._player2Name !== "Player 2"
        ) {
            element.innerHTML = `
                <div><strong>${STRINGS[this._lang].currentMatch}</strong></div>
                <div>${this._player1Name} vs ${this._player2Name}</div>
                <div>${STRINGS[this._lang].practiceMode}</div>
            `;
        } else {
            element.innerHTML = `
                <div style="color: #ffa500;">${STRINGS[this._lang].noTournament}</div>
                <div>${STRINGS[this._lang].practiceMode}</div>
            `;
        }
    }
    
    private async _showMenu(): Promise<void> {
        this._gameState = GameState.MENU;
        this._menuUI.style.display = "flex";
        this._gameOverUI.style.display = "none";
        this._resetGame();
        this._powerUpManager.deactivate();
        await this._loadCurrentMatch();
        const matchInfoElement = document.getElementById("matchInfo");
        if (matchInfoElement) {
          this._updateMatchInfoDisplay(matchInfoElement);
        }
    }
    
    // Update _startGame to store the current mode
    private async _startGame(enablePowerUps: boolean = false): Promise<void> {
        this._gameState = GameState.PLAYING;
        this._menuUI.style.display = "none";
        this._gameOverUI.style.display = "none";
        this._powerUpsEnabled = enablePowerUps;
        this._leftPaddle.setSpeedMultiplier(this._speedMultiplier);
        this._rightPaddle.setSpeedMultiplier(this._speedMultiplier);
        await this._loadCurrentMatch();
        this._ball.start();
        this._applySpeedMultiplierToBall(this._ball);
        this._firstCollision = true;
        if (enablePowerUps) {
            this._powerUpManager.activate();
        } else {
            this._powerUpManager.deactivate();
        }
    }
    
    private async _showGameOver(winner: string): Promise<void> {
        this._gameState = GameState.GAME_OVER;

        const gameOverText = document.getElementById("gameOverText") as HTMLHeadingElement;
        const winnerText    = document.getElementById("winnerText")    as HTMLHeadingElement;
        const playAgainBtn  = document.getElementById("playAgainButton") as HTMLButtonElement;
        const menuBtn       = document.getElementById("menuButton")    as HTMLButtonElement;

        // 1) Set all texts from i18n
        if (gameOverText) gameOverText.textContent = STRINGS[this._lang].gameOver;
        if (winnerText)    winnerText.textContent    = `${winner} ${STRINGS[this._lang].wins}`;

         // … existing tournament-complete logic …
         if (this._currentMatch) {
             await this._submitMatchResult(winner);
             const response = await fetch('http://localhost:3002/match/next',{ method:'GET', credentials:'include' });
             if (response.ok) {
                 const data = await response.json();
                 if (data.tournamentComplete) {
                     // 1) Tournament Complete layout
                     if (gameOverText) {
                         gameOverText.textContent = STRINGS[this._lang].tournamentCompleteTitle;
                         gameOverText.style.fontSize = "3rem";
                         gameOverText.style.color = "#ffd700";
                         gameOverText.style.textShadow = "0 0 20px #fff, 0 0 10px #ffd700";
                         gameOverText.style.marginBottom = "20px";
                     }
                     if (winnerText) {
                         winnerText.innerHTML = `🏆 ${STRINGS[this._lang].championLabel}: <span style="color:#ffd700;">${data.champion}</span> 🏆`;
                         winnerText.style.fontSize = "2.5rem";
                         winnerText.style.color = "#fff";
                         winnerText.style.marginBottom = "30px";
                     }
                     if (playAgainBtn) playAgainBtn.style.display = "none";
                     if (menuBtn) {
                         menuBtn.style.display = "block";
                         menuBtn.textContent = STRINGS[this._lang].mainMenu;
                     }
                     this._gameOverUI.style.display = "flex";
                     return;
                 } else {
                    // Next match in tournament
                     if (playAgainBtn) {
                         playAgainBtn.style.display = "block";
                         playAgainBtn.textContent = STRINGS[this._lang].nextMatch;
                     }
                     if (menuBtn) {
                         menuBtn.style.display = "inline-block";
                         menuBtn.textContent = STRINGS[this._lang].mainMenu;
                     }
                 }
             }
         } else {
            // Practice mode
             if (playAgainBtn) {
                 playAgainBtn.style.display = "block";
                 playAgainBtn.textContent = STRINGS[this._lang].playAgain;
             }
             if (menuBtn) {
                 menuBtn.style.display = "inline-block";
                 menuBtn.textContent = STRINGS[this._lang].mainMenu;
             }
         }

         this._gameOverUI.style.display = "flex";
    }
    
    private async _submitMatchResult(winner: string): Promise<void> {
        if (!this._currentMatch) return;
        
        try {
            const response = await fetch('http://localhost:3002/match/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    matchId: this._currentMatch.id,
                    winner: winner
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Match result submitted successfully:', result);
                
                // Clear current match and try to load next one
                this._currentMatch = null;
                await this._loadCurrentMatch();
                
                // Update the match info display
                const matchInfoElement = document.getElementById("matchInfo");
                if (matchInfoElement) {
                    this._updateMatchInfoDisplay(matchInfoElement);
                }
            } else {
                console.error('Failed to submit match result:', response.statusText);
            }
        } catch (error) {
            console.error('Error submitting match result:', error);
        }
    }
    
    private _resetGame(): void {
        this._ball.reset();
        this._scoreManager.reset();
        this._firstCollision = true;
        
        // Reset paddles
        this._leftPaddle.reset();
        this._rightPaddle.reset();
        
        // Reset power-ups
        this._powerUpManager.reset();
        this._powerUpManager.deactivate();
    }
    
    private _createPlayingField(): void {
        this._ground = MeshBuilder.CreateGround(
            "ground",
            { width: CONFIG.FIELD.WIDTH, height: CONFIG.FIELD.HEIGHT },
            this._scene
        );
        const groundMaterial = new StandardMaterial("groundMaterial", this._scene);
        groundMaterial.diffuseColor = CONFIG.TABLE_THEMES[this._tableTheme].FIELD_COLOR;
        this._ground.material = groundMaterial;
        
        // Create center lines
        const lineMaterial = new StandardMaterial("lineMaterial", this._scene);
        lineMaterial.emissiveColor = CONFIG.CENTER_LINE.COLOR;
        lineMaterial.alpha = CONFIG.CENTER_LINE.ALPHA;
        
        const centerLineVertical = MeshBuilder.CreateBox(
            "centerLineVertical", 
            {
                width: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.x, 
                height: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.y, 
                depth: CONFIG.CENTER_LINE.VERTICAL.DIMENSIONS.z
            }, 
            this._scene
        );
        centerLineVertical.position = CONFIG.CENTER_LINE.VERTICAL.POSITION.clone();
        centerLineVertical.material = lineMaterial;
        
        const centerLineHorizontal = MeshBuilder.CreateBox(
            "centerLineHorizontal", 
            {
                width: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.x, 
                height: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.y, 
                depth: CONFIG.CENTER_LINE.HORIZONTAL.DIMENSIONS.z
            }, 
            this._scene
        );
        centerLineHorizontal.position = CONFIG.CENTER_LINE.HORIZONTAL.POSITION.clone();
        centerLineHorizontal.material = lineMaterial;
    }
    
    // Add a new method to handle multiplayer setup
    private async _setupMultiplayer(isHost: boolean): Promise<void> {
        console.log(`[Multiplayer] Setup: isHost=${isHost}, player1Name=${this._player1Name}`);
        await this._multiplayerManager.setupMultiplayer(
            isHost,
            this._player1Name,
            (mode) => {
                console.log(`[Multiplayer] Callback: modo selecionado = ${mode}`);
                this._powerUpsEnabled = (mode === 'powerup');
                this._startGame(this._powerUpsEnabled);
            },
            (side) => {
                console.log(`[Multiplayer] Callback: player side = ${side}`);
                // Player side callback
            },
            isHost
                ? (roomId) => { if (roomId) console.log(`[Multiplayer] Sala criada: ${roomId}`); alert(`ID da sala: ${roomId}`); }
                : undefined
        );
    }

    public update(): void {
        // Update input manager
        this._inputManager.update();
        // Log game state and multiplayer info
        console.log(`[GameManager] update: gameState=${this._gameState}, gameMode=${this._multiplayerManager.gameMode}, playerSide=${this._multiplayerManager.playerSide}`);
        // Only update game logic if in PLAYING state
        if (this._gameState === GameState.PLAYING) {
            this._handleInput();
            // Multiplayer logic
            const socket = this._multiplayerManager.socket;
            const playerSide = this._multiplayerManager.playerSide;
            if (this._multiplayerManager.gameMode === GameMode.SINGLE_PLAYER || playerSide === 'left') {
                // Update game objects (ball movement)
                this._updateGameObjects();
                // Check collisions
                this._checkCollisions();
                // Power-ups (only host handles in multiplayer)
                if (this._powerUpsEnabled) {
                    this._powerUpManager.update();
                }
                // In multiplayer mode and host, send ball updates
                if (socket && socket.readyState === WebSocket.OPEN && playerSide === 'left' && this._ball.active) {
                    console.log('[Multiplayer] Host enviando BALL_UPDATE');
                    socket.send(JSON.stringify({
                        type: 'BALL_UPDATE',
                        ball: {
                            x: this._ball.mesh.position.x,
                            y: this._ball.mesh.position.y,
                            z: this._ball.mesh.position.z
                        }
                    }));
                }
            } else {
                // For non-host in multiplayer, don't update ball or check collisions
                // Just update paddles
                this._leftPaddle.update();
                this._rightPaddle.update();
            }
            // Check for game over condition
            const score = this._scoreManager.score;
            if (score.player1 >= 5 || score.player2 >= 5) {
                const winner = score.player1 >= 5 ? "Player 1" : "Player 2";
                console.log(`[GameManager] Game over: winner=${winner}`);
                this._showGameOver(winner);
            }
        }
    }
    
    private _handleInput(): void {
        // Track if paddle position changed
        let leftPaddleChanged = false;
        let rightPaddleChanged = false;
        
        // Handle player 1 paddle (left)
        if (this._multiplayerManager.playerSide !== 'right') { // Control left paddle if we're player 1 or single player
            if (this._inputManager.isKeyPressed("arrowleft")) {
                this._leftPaddle.moveLeft();
                leftPaddleChanged = true;
            }
            if (this._inputManager.isKeyPressed("arrowright")) {
                this._leftPaddle.moveRight();
                leftPaddleChanged = true;
            }
        }
        
        // Handle player 2 paddle (right)
        if (this._multiplayerManager.playerSide !== 'left') { // Control right paddle if we're player 2 or single player
            if (this._inputManager.isKeyPressed("a")) {
                this._rightPaddle.moveLeft();
                rightPaddleChanged = true;
            }
            if (this._inputManager.isKeyPressed("d")) {
                this._rightPaddle.moveRight();
                rightPaddleChanged = true;
            }
        }
        
        // Send paddle updates in multiplayer mode
        const socket = this._multiplayerManager.socket;
        if (socket && socket.readyState === WebSocket.OPEN) {
            if (this._multiplayerManager.playerSide === 'left' && leftPaddleChanged) {
                socket.send(JSON.stringify({
                    type: 'PADDLE_MOVE',
                    x: this._leftPaddle.mesh.position.x
                }));
            } else if (this._multiplayerManager.playerSide === 'right' && rightPaddleChanged) {
                socket.send(JSON.stringify({
                    type: 'PADDLE_MOVE',
                    x: this._rightPaddle.mesh.position.x
                }));
            }
        }
    }

    private _updateGameObjects(): void {
        // Update all balls from the power-up manager instead of just the main ball
        const balls = this._powerUpManager.balls;
        for (const ball of balls) {
            ball.update();
        }
        
        // Continue updating paddles
        this._leftPaddle.update();
        this._rightPaddle.update();
    }
    
    private _checkCollisions(): void {
        // Get all balls from the power-up manager
        const balls = this._powerUpManager.balls;
        
        for (const ball of balls) {
            if (!ball.active) continue;
            
            const ballPos = ball.mesh.position;
            
            // Ball collision with walls (using field width/height)
            const wallBoundary = CONFIG.FIELD.WIDTH / 2 - 0.2;
            if (ballPos.x <= -wallBoundary || ballPos.x >= wallBoundary) {
                // Push the ball slightly away from the wall to prevent sticking
                if (ballPos.x <= -wallBoundary) {
                    ballPos.x = -wallBoundary + 0.05; // Push right slightly
                } else {
                    ballPos.x = wallBoundary - 0.05; // Push left slightly
                }
                
                // Apply our improved reverseX which ensures minimum horizontal velocity
                ball.reverseX();
            }
            
            // Left paddle collision
            if (ballPos.z <= CONFIG.PADDLE.COLLISION.LEFT.MAX_Z && 
                ballPos.z >= CONFIG.PADDLE.COLLISION.LEFT.MIN_Z &&
                Math.abs(ballPos.x - this._leftPaddle.mesh.position.x) < this._leftPaddle.width / 2 * this._leftPaddle.mesh.scaling.x) {
                
                ball.reverseZ();
                
                // Speed up ball after first collision
                if (this._firstCollision) {
                    this._firstCollision = false;
                    const currentVelocity = ball.velocity;
                    const normalizedVelocity = currentVelocity.normalize();
                    ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED * this._speedMultiplier);
                }
                
                // Add spin based on hit position
                const hitFactor = (ballPos.x - this._leftPaddle.mesh.position.x) / (this._leftPaddle.width / 2 * this._leftPaddle.mesh.scaling.x);
                ball.addSpin(hitFactor);
            }
            
            // Right paddle collision (similar update for scaled width)
            if (ballPos.z >= CONFIG.PADDLE.COLLISION.RIGHT.MIN_Z && 
                ballPos.z <= CONFIG.PADDLE.COLLISION.RIGHT.MAX_Z &&
                Math.abs(ballPos.x - this._rightPaddle.mesh.position.x) < this._rightPaddle.width / 2 * this._rightPaddle.mesh.scaling.x) {
                
                ball.reverseZ();
                
                // Speed up ball after first collision
                if (this._firstCollision) {
                    this._firstCollision = false;
                    const currentVelocity = ball.velocity;
                    const normalizedVelocity = currentVelocity.normalize();
                    ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED * this._speedMultiplier);
                }
                
                // Add spin based on hit position
                const hitFactor = (ballPos.x - this._rightPaddle.mesh.position.x) / (this._rightPaddle.width / 2 * this._rightPaddle.mesh.scaling.x);
                ball.addSpin(hitFactor);
            }
            
            // Scoring logic - left player scores (ball went past right side)
            if (ballPos.z > CONFIG.SCORE.BOUNDARY.RIGHT) {
                this._scoreManager.player2Scores();
                
                // Send score update in multiplayer mode
                if (this._multiplayerManager.socket && this._multiplayerManager.socket.readyState === WebSocket.OPEN && 
                    this._multiplayerManager.playerSide === 'left') {
                    this._multiplayerManager.socket.send(JSON.stringify({
                        type: 'SCORE_UPDATE',
                        score: this._scoreManager.score
                    }));
                }
                
                // If this is the main ball, reset all balls
                if (ball === this._ball) {
                    this._powerUpManager.reset();
                    this._ball.reset();
                    this._firstCollision = true;
                    
                    // Start ball moving toward player 1 (negative z direction)
                    // Since player 2 scored, ball should go toward player 1
                    this._ball.start(DIRECTION.LEFT);
                } else {
                    // Just remove this extra ball
                    ball.reset();
                    ball.active = false;
                    const ballIndex = this._powerUpManager.balls.indexOf(ball);
                    if (ballIndex > 0) { // Don't remove the main ball
                        this._powerUpManager.balls.splice(ballIndex, 1);
                        ball.mesh.dispose();
                    }
                }
            }
            
            // Scoring logic - right player scores (ball went past left side)
            if (ballPos.z < CONFIG.SCORE.BOUNDARY.LEFT) {
                this._scoreManager.player1Scores();
                
                // Send score update in multiplayer mode
                if (this._multiplayerManager.socket && this._multiplayerManager.socket.readyState === WebSocket.OPEN && 
                    this._multiplayerManager.playerSide === 'left') {
                    this._multiplayerManager.socket.send(JSON.stringify({
                        type: 'SCORE_UPDATE',
                        score: this._scoreManager.score
                    }));
                }
                
                // If this is the main ball, reset all balls
                if (ball === this._ball) {
                    this._powerUpManager.reset();
                    this._ball.reset();
                    this._firstCollision = true;
                    
                    // Start ball moving toward player 2 (positive z direction)
                    // Since player 1 scored, ball should go toward player 2
                    this._ball.start(DIRECTION.RIGHT);
                } else {
                    // Just remove this extra ball
                    ball.reset();
                    ball.active = false;
                    const ballIndex = this._powerUpManager.balls.indexOf(ball);
                    if (ballIndex > 0) { // Don't remove the main ball
                        this._powerUpManager.balls.splice(ballIndex, 1);
                        ball.mesh.dispose();
                    }
                }
            }
        }
    }
    
    // Add this getter method
    public get gameMode(): GameMode {
        return this._multiplayerManager.gameMode;
    }
    public setupMultiplayerRenderLoop(): void {
        if (this._multiplayerManager.gameMode === GameMode.MULTIPLAYER_HOST) {
            // Stop the existing render loop and use setInterval instead
            this._scene.getEngine().stopRenderLoop();
            
            setInterval(() => {
                this.update();
                this._scene.render();
            }, 16);
        }
    }
    
    private _createLanguageSelector(): void {
        // Remove existing selector if present
        const oldSelector = document.getElementById("languageSelector");
        if (oldSelector) oldSelector.remove();

        const selector = document.createElement("select");
        selector.id = "languageSelector";
        selector.style.position = "fixed";
        selector.style.top = "24px";
        selector.style.right = "24px";
        selector.style.zIndex = "10000";
        selector.style.padding = "8px 16px";
        selector.style.fontSize = "1rem";
        selector.style.borderRadius = "8px";
        selector.style.background = "#222";
        selector.style.color = "#fff";
        selector.style.border = "1px solid #444";
        selector.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

        const languageLabels: Record<Language, string> = {
            ptBR: "Português (Brasil)",
            en: "English",
            es: "Español",
            fr: "Français",
            de: "Deutsch",
            ru: "Русский"
        };

        for (const lang of Object.keys(languageLabels) as Language[]) {
            const option = document.createElement("option");
            option.value = lang;
            option.textContent = languageLabels[lang];
            if (lang === this._lang) option.selected = true;
            selector.appendChild(option);
        }

        selector.addEventListener("change", () => {
            this._lang = selector.value as Language;
            // Update all UI elements with the new language
            this._updateAllUIText();
        });

        document.body.appendChild(selector);
    }

    // Add a method to update all UI text when language changes:
    private _updateAllUIText(): void {
        this._uiManager.updateAllUIText();
    }

    // Replace table theme and speed logic with manager usage
    private _toggleTableTheme(): void {
        this._themeManager.toggleTableTheme();
    }
    private _applySpeedMultiplierToBall(ball: Ball): void {
        this._speedManager.applyToBall(ball);
    }
}