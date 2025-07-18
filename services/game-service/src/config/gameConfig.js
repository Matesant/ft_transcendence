export const GAME_CONFIG = {
    // Game timing
    TICK_RATE: 60, // 60 FPS for smooth gameplay
    STATE_SYNC_INTERVAL: 16, // ~60 FPS in milliseconds
    
    // Field dimensions
    FIELD: {
        WALL_BOUNDARY: 7.8 // Match frontend CONFIG.FIELD.WIDTH / 2 - 0.2
    },
    
    // Paddle configuration
    PADDLE: {
        MOVE_SPEED: 0.2, // Match frontend paddle movement speed
        DIMENSIONS: {
            WIDTH: 2.0, // Match frontend paddle width
            HEIGHT: 0.2,
            DEPTH: 0.5
        },
        POSITION: {
            LEFT_Z: -8.25, // Match frontend CONFIG.PADDLE.POSITION.LEFT.z
            RIGHT_Z: 8.25   // Match frontend CONFIG.PADDLE.POSITION.RIGHT.z
        },
        POSITION_LIMIT: {
            MIN: -7.0, // Match frontend paddle movement limits
            MAX: 7.0
        },
        COLLISION: {
            LEFT: {
                MIN_Z: -8.75,
                MAX_Z: -7.75
            },
            RIGHT: {
                MIN_Z: 7.75,
                MAX_Z: 8.75
            }
        }
    },
    
    // Ball configuration
    BALL: {
        INITIAL_SPEED: 0.08, // Match frontend CONFIG.BALL.INITIAL_SPEED
        NORMAL_SPEED: 0.08,  // Minimum speed to maintain
        SPIN_FACTOR: 0.15,   // Match frontend CONFIG.BALL.SPIN_FACTOR
        RADIUS: 0.2
    },
    
    // Scoring boundaries
    SCORE: {
        BOUNDARY: {
            LEFT: -9.0,  // When ball crosses this Z position, player 2 scores
            RIGHT: 9.0   // When ball crosses this Z position, player 1 scores
        }
    },
    
    // Game rules
    WIN_SCORE: 5,
    
    // Network optimization
    MAX_INPUT_BUFFER_SIZE: 10,
    RECONNECT_TIMEOUT: 5000, // 5 seconds
    GAME_TIMEOUT: 300000     // 5 minutes of inactivity
};
