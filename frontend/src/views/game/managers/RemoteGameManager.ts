import { GameManager } from "./GameManager";
import { Ball } from "../gameObjects/Ball";
import { Paddle } from "../gameObjects/Paddle";
import { InputManager } from "./InputManager";
import { UIManager } from "./UIManager";
import { CONFIG } from "../config";
import { getText } from "../../../utils/language";
import { Scene } from "@babylonjs/core"; // Add this import

export class RemoteGameManager extends GameManager {
    private socket: WebSocket;
    private gameId: string;
    private playerId: string;
    private playerName: string;
    private playerSide?: 'left' | 'right';
    private opponent?: { id: string, name: string };
    private statusElement: HTMLElement;
    private connecting: boolean = true;
    private gameStarted: boolean = false;
    
    // Add the missing properties
    public canvas: HTMLCanvasElement;
    public input: InputManager;
    public ui: UIManager;
    public leftPaddle: any;
    public rightPaddle: any;
    public ball: any;
    public leftScore: number = 0;
    public rightScore: number = 0;
    public isRunning: boolean = false;
    
    // Add missing constants
    private readonly PADDLE_MARGIN = 20;
    private readonly PADDLE_HEIGHT = 80;
    private readonly PADDLE_WIDTH = 15;

    // Add missing methods
    public start(): void {
        this.isRunning = true;
    }
    
    public stop(): void {
        this.isRunning = false;
    }
    
    // Add disconnect method
    public disconnect(): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
    }

    constructor(
        scene: Scene, 
        playerId: string, 
        playerName: string, 
        onGameStarted?: () => void, 
        options?: { 
            socket?: WebSocket; 
            skipMenu?: boolean; 
            playerSide?: 'left' | 'right'; 
            opponent?: { id: string; name: string }; 
            gameId?: string 
        }
    ) {
        super(scene);
        this.playerId = playerId;
        this.playerName = playerName;
        this.playerSide = options?.playerSide;
        this.opponent = options?.opponent;
        this.gameId = options?.gameId || '';
        this.socket = options?.socket || new WebSocket(`ws://${window.location.hostname}:3004`);
        
        // Create canvas reference
        const canvas = document.getElementById(CONFIG.CANVAS_ID) as HTMLCanvasElement;
        this.canvas = canvas;
        
        // Initialize input and UI managers
        this.input = new InputManager();
        this.ui = new UIManager(
            () => {}, // onStartGame
            () => {}, // onShowMenu
            () => {}, // onResetAndRestart
            () => {}, // onSpeedChange
            () => {}  // onTableThemeToggle
        );
        
        // Create status display
        this.statusElement = document.createElement('div');
        this.statusElement.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white text-center bg-black/50 p-4 rounded-lg z-10';
        this.statusElement.textContent = getText('connectingToServer');
        this.canvas.parentElement?.appendChild(this.statusElement);

        // Setup socket event handlers
        this.setupSocketHandlers();

        // If we have a gameId, we're joining an existing game
        if (this.gameId) {
            this.joinGame(this.gameId);
        } else {
            this.findMatch();
        }
    }

    private setupSocketHandlers(): void {
        // Handle server messages
        this.socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch(data.type) {
                    case 'matchFound':
                        this.handleMatchFound(data);
                        break;
                    case 'gameState':
                        this.handleGameState(data);
                        break;
                    case 'gameStart':
                        this.handleGameStart(data);
                        break;
                    case 'gameEnd':
                        this.handleGameEnd(data);
                        break;
                    case 'playerDisconnected':
                        this.handlePlayerDisconnected(data);
                        break;
                }
            } catch (err) {
                console.error('Error parsing message:', err);
            }
        });

        // Handle socket close
        this.socket.addEventListener('close', () => {
            if (!this.gameStarted) {
                this.statusElement.textContent = getText('connectionFailed');
                this.statusElement.classList.add('text-red-500');
            }
        });

        // Handle socket error
        this.socket.addEventListener('error', () => {
            this.statusElement.textContent = getText('connectionFailed');
            this.statusElement.classList.add('text-red-500');
        });
    }

    private findMatch(): void {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.statusElement.textContent = getText('searchingForOpponent');
            this.socket.send(JSON.stringify({
                type: 'findMatch',
                playerId: this.playerId,
                playerName: this.playerName
            }));
        } else {
            this.statusElement.textContent = getText('connectionFailed');
            this.statusElement.classList.add('text-red-500');
        }
    }

    private joinGame(gameId: string): void {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.statusElement.textContent = getText('connectingToServer');
            this.socket.send(JSON.stringify({
                type: 'joinGame',
                gameId: gameId,
                playerId: this.playerId,
                playerName: this.playerName
            }));
        } else {
            this.statusElement.textContent = getText('connectionFailed');
            this.statusElement.classList.add('text-red-500');
        }
    }

    private handleMatchFound(data: any): void {
        // Update opponent information
        this.opponent = data.opponent;
        this.gameId = data.gameId;
        this.playerSide = data.side;
        
        this.statusElement.textContent = getText('matchFoundPlaying').replace('{0}', this.opponent?.name || getText('defaultPlayer'));
        
        // Wait for game start message
        setTimeout(() => {
            if (!this.gameStarted) {
                this.statusElement.textContent = getText('waitingForGameStart');
            }
        }, 2000);
    }

    private handleGameStart(data: any): void {
        this.gameStarted = true;
        this.connecting = false;
        
        // Hide status message
        if (this.statusElement.parentNode) {
            this.statusElement.parentNode.removeChild(this.statusElement);
        }
        
        // Initialize game objects based on server data
        this.leftPaddle = {
            draw: (ctx: any) => {
                ctx.fillStyle = 'blue';
                ctx.fillRect(
                    this.PADDLE_MARGIN, 
                    this.canvas.height / 2 - this.PADDLE_HEIGHT / 2,
                    this.PADDLE_WIDTH,
                    this.PADDLE_HEIGHT
                );
            }
        };
        
        this.rightPaddle = {
            draw: (ctx: any) => {
                ctx.fillStyle = 'red';
                ctx.fillRect(
                    this.canvas.width - this.PADDLE_MARGIN - this.PADDLE_WIDTH,
                    this.canvas.height / 2 - this.PADDLE_HEIGHT / 2,
                    this.PADDLE_WIDTH,
                    this.PADDLE_HEIGHT
                );
            }
        };
        
        this.ball = {
            draw: (ctx: any) => {
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(
                    this.canvas.width / 2,
                    this.canvas.height / 2,
                    10,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        };
        
        // Show scoreboard with player names
        const player1Name = this.playerSide === 'left' 
            ? this.playerName 
            : (this.opponent?.name || getText('player2'));
            
        const player2Name = this.playerSide === 'right' 
            ? this.playerName 
            : (this.opponent?.name || getText('player1'));
            
        this.ui.showScoreBoard(player1Name, player2Name);
        
        // Start the game loop
        if (!this.isRunning) {
            this.start();
        }
    }

    private handleGameState(data: any): void {
        // Update game state with server data
        if (!this.gameStarted || !this.ball || !this.leftPaddle || !this.rightPaddle) return;
        
        // Update ball position
        this.ball.x = data.ball.x;
        this.ball.y = data.ball.y;
        
        // Update paddles
        this.leftPaddle.y = data.paddles.left;
        this.rightPaddle.y = data.paddles.right;
        
        // Update scores
        if (data.scores) {
            this.leftScore = data.scores.left;
            this.rightScore = data.scores.right;
            this.ui.updateScores(this.leftScore, this.rightScore);
        }
    }

    private handleGameEnd(data: any): void {
        this.stop();
        
        // Determine if the current player won
        let winner: 'player1' | 'player2' | undefined;
        if (this.playerSide === 'left') {
            winner = data.winner === 'left' ? 'player1' : 'player2';
        } else {
            winner = data.winner === 'right' ? 'player1' : 'player2';
        }
        
        this.ui.showGameOver(winner);
    }

    private handlePlayerDisconnected(data: any): void {
        this.stop();
        this.ui.showWinByDefault();
    }

    public update(): void {
        // No local physics updates - all comes from server
        // Just send input to server
        if (this.gameStarted && this.playerSide) {
            const input = {
                up: this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('w'),
                down: this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('s'),
            };
            
            this.socket.send(JSON.stringify({
                type: 'input',
                gameId: this.gameId,
                playerId: this.playerId,
                input
            }));
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Don't render game objects while connecting
        if (this.connecting) return;
        
        // Draw court
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 0);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        ctx.stroke();
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw game objects
        if (this.leftPaddle) this.leftPaddle.draw(ctx);
        if (this.rightPaddle) this.rightPaddle.draw(ctx);
        if (this.ball) this.ball.draw(ctx);
    }
}
