import { Vector3, Color4, Color3 } from "@babylonjs/core";

export const CONFIG = {
    SCENE_ROTATION_DEGREES: 90,
    CANVAS_ID: "gameCanvas",
    CAMERA: {
        BETA: Math.PI / 4,
        RADIUS: 22,
        TARGET: new Vector3(0, 0, 0)
    },
    SCENE: {
        CLEAR_COLOR: new Color4(0.1, 0.1, 0.15, 1)
    },
    AMBIENT_LIGHT: {
        DIRECTION: new Vector3(0, 1, 0),
        INTENSITY: 0.7,
        DIFFUSE: new Color3(1, 1, 1)
    },
    GLOW: {
        INTENSITY: 0.7
    },
    
    FIELD: {
        WIDTH: 12,
        HEIGHT: 17,
        COLOR: new Color3(0.15, 0.35, 0.15)
    },
    
    CENTER_LINE: {
        VERTICAL: {
            DIMENSIONS: new Vector3(0.05, 0.01, 17),
            POSITION: new Vector3(0, 0.01, 0)
        },
        HORIZONTAL: {
            DIMENSIONS: new Vector3(12, 0.01, 0.05),
            POSITION: new Vector3(0, 0.01, 0)
        },
        COLOR: new Color3(1, 1, 1),
        ALPHA: 0.7
    },
    
    WALL: {
        DIMENSIONS: new Vector3(0.1, 0.3, 17),
        POSITION: {
            TOP: new Vector3(-6.05, 0.15, 0),
            BOTTOM: new Vector3(6.05, 0.15, 0)
        },
        COLOR: new Color3(1, 1, 1)
    },
    
    PADDLE: {
        DIMENSIONS: new Vector3(1.3, 0.3, 0.35),
        POSITION: {
            LEFT: new Vector3(0, 0.15, -8.25),
            RIGHT: new Vector3(0, 0.15, 8.25)
        },
        MOVE_SPEED: 0.200,
        POSITION_LIMIT: {
            MIN: -5.4,
            MAX: 5.4
        },
        COLOR: {
            LEFT: new Color3(0.2, 0.6, 1),
            RIGHT: new Color3(1, 0.3, 0.3)
        },
        COLLISION: {
            LEFT: {
                MIN_Z: -8.45,
                MAX_Z: -8.05
            },
            RIGHT: {
                MIN_Z: 8.05,
                MAX_Z: 8.45
            }
        }
    },
    
    BALL: {
        DIAMETER: 0.4,
        POSITION: new Vector3(0, 0.2, 0),
        COLOR: new Color3(1, 1, 0.7),
        INITIAL_SPEED: 0.1,
        NORMAL_SPEED: 0.15,
        SPIN_FACTOR: 0.1
    },
    
    SCORE: {
        BOUNDARY: {
            LEFT: -8.5,
            RIGHT: 8.5
        },
        DISPLAY: {
            TOP: "20px",
            FONT_SIZE: "24px",
            FONT_FAMILY: "sans-serif",
            COLOR: "white"
        }
    },

    POWER_UPS: {
        TYPES: {
            LARGER_PADDLE: "larger_paddle",
            SMALLER_OPPONENT: "smaller_opponent",
            FAST_BALL: "fast_ball",
            MULTI_BALL: "multi_ball"
        },
        DURATION: {
            DEFAULT: 5000, 
            LARGER_PADDLE: 10000
        },
        SPAWN_INTERVAL: {
            MIN: 5000,
            MAX: 15000
        },
        DIMENSIONS: new Vector3(0.6, 0.1, 0.6),
        COLORS: {
            LARGER_PADDLE: new Color3(0.2, 0.8, 0.2),     
            SMALLER_OPPONENT: new Color3(0.8, 0.2, 0.2), 
            FAST_BALL: new Color3(1, 0.6, 0.2),          
            MULTI_BALL: new Color3(0.8, 0.2, 0.8)
        },
        ROTATION_SPEED: 0.01
    },

    SPEED: {
        MULTIPLIER: {
            MIN: 0.8,
            MAX: 1.5,
            DEFAULT: 1.0,
            STEP: 0.1
        }
    },

    TABLE_THEMES: {
        GREEN: {
            FIELD_COLOR: new Color3(0.15, 0.35, 0.15),
            BACKGROUND_COLOR: new Color4(0.1, 0.1, 0.15, 1)
        },
        BLUE: {
            FIELD_COLOR: new Color3(0.1, 0.3, 0.6),
            BACKGROUND_COLOR: new Color4(0.05, 0.05, 0.05, 1) 
        }
    }
};