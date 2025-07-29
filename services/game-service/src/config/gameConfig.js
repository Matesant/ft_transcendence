export const GAME_CONFIG = {
    TICK_RATE: 60, 
    STATE_SYNC_INTERVAL: 16,
    
    FIELD: {
        WALL_BOUNDARY: 7.8 
    },
    
    PADDLE: {
        MOVE_SPEED: 0.2, 
        DIMENSIONS: {
            WIDTH: 2.0, 
            HEIGHT: 0.2,
            DEPTH: 0.5
        },
        POSITION: {
            LEFT_Z: -8.25, 
            RIGHT_Z: 8.25  
        },
        POSITION_LIMIT: {
            MIN: -7.0, 
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
    
    BALL: {
        INITIAL_SPEED: 0.08,
        NORMAL_SPEED: 0.08,  
        SPIN_FACTOR: 0.15,  
        RADIUS: 0.2
    },
    
    SCORE: {
        BOUNDARY: {
            LEFT: -9.0, 
            RIGHT: 9.0 
        }
    },
    
    WIN_SCORE: 5,
    
    MAX_INPUT_BUFFER_SIZE: 10,
    RECONNECT_TIMEOUT: 5000,
    GAME_TIMEOUT: 300000
};
