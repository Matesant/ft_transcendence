import { Scene, MeshBuilder, StandardMaterial } from "@babylonjs/core";
import { Ball, DIRECTION } from "../gameObjects/Ball";
import { Paddle, PaddleType } from "../gameObjects/Paddle";
import { Wall, WallType } from "../gameObjects/Wall";
import { ScoreManager } from "./ScoreManager";
import { InputManager } from "./InputManager";
import { CONFIG } from "../config";
import { PowerUpManager } from "./PowerUpManager";
import { STRINGS, Language } from "../../i18n";

// Simple enum for game states (removed PAUSED)
enum GameState {
    MENU,
    PLAYING,
    GAME_OVER
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
    
    // Add match-related fields
    private _currentMatch: MatchInfo | null = null;
    private _player1Name: string = "Player 1";
    private _player2Name: string = "Player 2";
    
    private _lang: Language = "ptBR"; // Set Brazilian Portuguese as default

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
        this._createMenuUI();
        this._createGameOverUI();
        this._createLanguageSelector();  // ← add language selector here

        // Initialize power-up manager
        this._powerUpManager = new PowerUpManager(
            scene,
            this._leftPaddle,
            this._rightPaddle,
            this._ball,
            this._scoreManager
        );

        // Load current match and show menu
        this._loadCurrentMatch();
        (async () => {
            await this._showMenu();
        })();
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
    
    private _createMenuUI(): void {
        this._menuUI = document.createElement("div");
        this._menuUI.style.position = "absolute";
        this._menuUI.style.top = "0";
        this._menuUI.style.left = "0";
        this._menuUI.style.width = "100%";
        this._menuUI.style.height = "100%";
        this._menuUI.style.display = "flex";
        this._menuUI.style.flexDirection = "column";
        this._menuUI.style.justifyContent = "center";
        this._menuUI.style.alignItems = "center";
        this._menuUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        
        const title = document.createElement("h1");
        title.textContent = "PONG"; // game title stays constant (or add i18n if desired)
        title.style.color = "white";
        title.style.fontSize = "48px";
        title.style.marginBottom = "30px";
        
        const matchInfo = document.createElement("div");
        matchInfo.id = "matchInfo";
        matchInfo.style.color = "white";
        matchInfo.style.fontSize = "20px";
        matchInfo.style.marginBottom = "20px";
        matchInfo.style.textAlign = "center";
        this._updateMatchInfoDisplay(matchInfo);
        
        const subtitle = document.createElement("h2");
        subtitle.textContent = STRINGS[this._lang].selectGameMode;
        subtitle.style.color = "white";
        subtitle.style.fontSize = "24px";
        subtitle.style.marginBottom = "20px";
        
        // Container for both buttons
        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.flexDirection = "row";
        buttonsContainer.style.gap = "20px";
        buttonsContainer.style.justifyContent = "center";
        buttonsContainer.style.alignItems = "center";
        
        // Create button containers (to include label and button)
        const classicContainer = document.createElement("div");
        classicContainer.style.display = "flex";
        classicContainer.style.flexDirection = "column";
        classicContainer.style.alignItems = "center";
        classicContainer.style.width = "200px";
        
        const powerUpsContainer = document.createElement("div");
        powerUpsContainer.style.display = "flex";
        powerUpsContainer.style.flexDirection = "column";
        powerUpsContainer.style.alignItems = "center"; 
        powerUpsContainer.style.width = "200px";
        
        // Classic mode label
        const classicLabel = document.createElement("div");
        classicLabel.textContent = STRINGS[this._lang].classicMode;
        classicLabel.style.color = "white";
        classicLabel.style.fontSize = "18px";
        classicLabel.style.marginBottom = "10px";
        
        // Power-ups mode label
        const powerUpsLabel = document.createElement("div");
        powerUpsLabel.textContent = STRINGS[this._lang].powerUpsMode;
        powerUpsLabel.style.color = "white"; 
        powerUpsLabel.style.fontSize = "18px";
        powerUpsLabel.style.marginBottom = "10px";
        
        // Classic mode button
        const classicButton = document.createElement("button");
        classicButton.textContent = STRINGS[this._lang].start;
        classicButton.style.padding = "10px 20px";
        classicButton.style.width = "120px";
        classicButton.style.fontSize = "18px";
        classicButton.style.cursor = "pointer";
        classicButton.style.backgroundColor = "#4286f4";
        classicButton.style.border = "none";
        classicButton.style.borderRadius = "5px";
        classicButton.style.color = "white";
        
        // Power-ups mode button
        const powerUpsButton = document.createElement("button");
        powerUpsButton.textContent = STRINGS[this._lang].start;
        powerUpsButton.style.padding = "10px 20px";
        powerUpsButton.style.width = "120px";
        powerUpsButton.style.fontSize = "18px";
        powerUpsButton.style.cursor = "pointer";
        powerUpsButton.style.backgroundColor = "#f44283";
        powerUpsButton.style.border = "none";
        powerUpsButton.style.borderRadius = "5px";
        powerUpsButton.style.color = "white";
        
        // Add event listeners
        classicButton.addEventListener("click", () => {
            this._startGame(false); // Start game without power-ups
        });
        
        powerUpsButton.addEventListener("click", () => {
            this._startGame(true); // Start game with power-ups
        });
        
        // Assemble the UI
        classicContainer.appendChild(classicLabel);
        classicContainer.appendChild(classicButton);
        
        powerUpsContainer.appendChild(powerUpsLabel);
        powerUpsContainer.appendChild(powerUpsButton);
        
        buttonsContainer.appendChild(classicContainer);
        buttonsContainer.appendChild(powerUpsContainer);
        
        this._menuUI.appendChild(title);
        this._menuUI.appendChild(matchInfo);
        this._menuUI.appendChild(subtitle);
        this._menuUI.appendChild(buttonsContainer);
        
        document.body.appendChild(this._menuUI);
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
    
    private _createGameOverUI(): void {
        this._gameOverUI = document.createElement("div");
        this._gameOverUI.style.position = "absolute";
        this._gameOverUI.style.top = "0";
        this._gameOverUI.style.left = "0";
        this._gameOverUI.style.width = "100%";
        this._gameOverUI.style.height = "100%";
        this._gameOverUI.style.display = "none";
        this._gameOverUI.style.flexDirection = "column";
        this._gameOverUI.style.justifyContent = "center";
        this._gameOverUI.style.alignItems = "center";
        this._gameOverUI.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        
        const gameOverText = document.createElement("h2");
        gameOverText.id = "gameOverText";
        // Estilo para ficar grande e visível
        gameOverText.style.color = "#fff";
        gameOverText.style.fontSize = "48px";
        gameOverText.style.margin = "0 0 10px";
        
        const winnerText = document.createElement("h3");
        winnerText.id = "winnerText";
        // Estilo para ficar legível
        winnerText.style.color = "#fff";
        winnerText.style.fontSize = "24px";
        winnerText.style.margin = "0 0 20px";
        
        const playAgainButton = document.createElement("button");
        playAgainButton.id = "playAgainButton";
        playAgainButton.style.padding = "10px 20px";
        playAgainButton.style.fontSize = "20px";
        playAgainButton.style.cursor = "pointer";
        playAgainButton.style.backgroundColor = "#4CAF50";
        playAgainButton.style.border = "none";
        playAgainButton.style.borderRadius = "5px";
        playAgainButton.style.color = "white";
        playAgainButton.style.marginBottom = "10px";
        playAgainButton.style.width = "180px"; // Set fixed width
        playAgainButton.style.textAlign = "center"; // Center the text
        
        playAgainButton.addEventListener("click", () => {
            this._resetGame();
            this._startGame(this._powerUpsEnabled); // Use the same mode as before
        });
        
        const menuButton = document.createElement("button");
        menuButton.id = "menuButton";
        menuButton.style.padding = "10px 20px";
        menuButton.style.fontSize = "20px";
        menuButton.style.cursor = "pointer";
        menuButton.style.backgroundColor = "#f44336";
        menuButton.style.border = "none";
        menuButton.style.borderRadius = "5px";
        menuButton.style.color = "white";
        menuButton.style.width = "180px"; // Match the width of the play again button
        menuButton.style.textAlign = "center"; // Center the text
        
        menuButton.addEventListener("click", () => {
             (async () => {
                 await this._showMenu();
             })();
        });
        
        this._gameOverUI.appendChild(gameOverText);
        this._gameOverUI.appendChild(winnerText);
        this._gameOverUI.appendChild(playAgainButton);
        this._gameOverUI.appendChild(menuButton);
        document.body.appendChild(this._gameOverUI);
    }
    
    private async _showMenu(): Promise<void> {
        this._gameState = GameState.MENU;
        this._menuUI.style.display = "flex";
        this._gameOverUI.style.display = "none";
        this._resetGame();
        this._powerUpManager.deactivate();

        // ← await the load so _currentMatch is set before we update the UI
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

        // Store the current game mode
        this._powerUpsEnabled = enablePowerUps;

        // Try to load a new match (if available)
        await this._loadCurrentMatch();

        // Start the ball automatically with random direction for first serve
        this._ball.start(); // No direction specified = random
        this._firstCollision = true;

        // Activate power-up spawning only if power-ups mode is enabled
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
        // Create ground
        const ground = MeshBuilder.CreateGround(
            "ground", 
            { width: CONFIG.FIELD.WIDTH, height: CONFIG.FIELD.HEIGHT }, 
            this._scene
        );
        const groundMaterial = new StandardMaterial("groundMaterial", this._scene);
        groundMaterial.diffuseColor = CONFIG.FIELD.COLOR;
        ground.material = groundMaterial;
        
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
    
    public update(): void {
        // Only update game logic if in PLAYING state
        if (this._gameState === GameState.PLAYING) {
            this._handleInput();
            this._updateGameObjects();
            this._powerUpManager.update(); // Update power-ups
            this._checkCollisions();
            
            // Check for game over condition
            const score = this._scoreManager.score;
            if (score.player1 >= 5) {
                this._showGameOver(this._player1Name);
            } else if (score.player2 >= 5) {
                this._showGameOver(this._player2Name);
            }
        }
    }
    
    private _handleInput(): void {
        // Handle paddle movement
        if (this._inputManager.isKeyPressed("a")) {
            this._rightPaddle.moveLeft();
        }
        if (this._inputManager.isKeyPressed("d")) {
            this._rightPaddle.moveRight();
        }
        
        // Use arrow keys for left paddle
        if (this._inputManager.isKeyPressed("arrowleft")) {
            this._leftPaddle.moveLeft();
        }
        if (this._inputManager.isKeyPressed("arrowright")) {
            this._leftPaddle.moveRight();
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
                    ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED);
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
                    ball.velocity = normalizedVelocity.scale(CONFIG.BALL.NORMAL_SPEED);
                }
                
                // Add spin based on hit position
                const hitFactor = (ballPos.x - this._rightPaddle.mesh.position.x) / (this._rightPaddle.width / 2 * this._rightPaddle.mesh.scaling.x);
                ball.addSpin(hitFactor);
            }
            
            // Scoring logic - left player scores (ball went past right side)
            if (ballPos.z > CONFIG.SCORE.BOUNDARY.RIGHT) {
                this._scoreManager.player2Scores();
                
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
        // Menu UI
        const subtitle = this._menuUI.querySelector("h2");
        if (subtitle) subtitle.textContent = STRINGS[this._lang].selectGameMode;

        const classicLabel = this._menuUI.querySelector(".classic-label");
        if (classicLabel) classicLabel.textContent = STRINGS[this._lang].classicMode;
        const classicBtn = this._menuUI.querySelector(".classic-btn");
        if (classicBtn) classicBtn.textContent = STRINGS[this._lang].start;

        const puLabel = this._menuUI.querySelector(".powerups-label");
        if (puLabel) puLabel.textContent = STRINGS[this._lang].powerUpsMode;
        const puBtn = this._menuUI.querySelector(".powerups-btn");
        if (puBtn) puBtn.textContent = STRINGS[this._lang].start;

        const matchInfo = document.getElementById("matchInfo");
        if (matchInfo) this._updateMatchInfoDisplay(matchInfo);

        // Game-Over UI
        const gameOverText = document.getElementById("gameOverText");
        if (gameOverText) gameOverText.textContent = STRINGS[this._lang].gameOver;

        const playAgainBtn = document.getElementById("playAgainButton");
        if (playAgainBtn) {
            playAgainBtn.textContent = this._currentMatch
                ? STRINGS[this._lang].nextMatch
                : STRINGS[this._lang].playAgain;
        }

        const menuBtn = document.getElementById("menuButton");
        if (menuBtn) menuBtn.textContent = STRINGS[this._lang].mainMenu;
    }
}