import { GameManager } from '../managers/GameManager.js';
import { PlayerManager } from '../managers/PlayerManager.js';

// Initialize all managers and services
export function initializeServices() {
    const gameManager = new GameManager();
    const playerManager = new PlayerManager();
    const roomManager = new Map();

    return {
        gameManager,
        playerManager,
        roomManager
    };
}
