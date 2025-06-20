import * as BABYLON from "@babylonjs/core";

export const CONFIG = {
    // Scene configuration
    SCENE_ROTATION_DEGREES: 90,
    CANVAS_ID: "gameCanvas",
    CAMERA: {
        BETA: Math.PI / 4,
        RADIUS: 22,
        TARGET: new BABYLON.Vector3(0, 0, 0)
    },
    SCENE: {
        CLEAR_COLOR: new BABYLON.Color4(0.1, 0.1, 0.15, 1)
    },
    AMBIENT_LIGHT: {
        DIRECTION: new BABYLON.Vector3(0, 1, 0),
        INTENSITY: 0.7,
        DIFFUSE: new BABYLON.Color3(1, 1, 1)
    },
    GLOW: {
        INTENSITY: 0.7
    },
    
    // Playing field
    FIELD: {
        WIDTH: 12,
        HEIGHT: 17,
        COLOR: new BABYLON.Color3(0.15, 0.35, 0.15)
    },
    
    // Center lines
    CENTER_LINE: {
        VERTICAL: {
            DIMENSIONS: new BABYLON.Vector3(0.05, 0.01, 17),
            POSITION: new BABYLON.Vector3(0, 0.01, 0)
        },
        HORIZONTAL: {
            DIMENSIONS: new BABYLON.Vector3(12, 0.01, 0.05),
            POSITION: new BABYLON.Vector3(0, 0.01, 0)
        },
        COLOR: new BABYLON.Color3(1, 1, 1),
        ALPHA: 0.7
    },
    
    // Walls
    WALL: {
        DIMENSIONS: new BABYLON.Vector3(0.1, 0.3, 17),
        POSITION: {
            TOP: new BABYLON.Vector3(-6.05, 0.15, 0),
            BOTTOM: new BABYLON.Vector3(6.05, 0.15, 0)
        },
        COLOR: new BABYLON.Color3(1, 1, 1)
    },
    
    // Paddles
    PADDLE: {
        DIMENSIONS: new BABYLON.Vector3(1.3, 0.3, 0.35),
        POSITION: {
            LEFT: new BABYLON.Vector3(0, 0.15, -8.25),
            RIGHT: new BABYLON.Vector3(0, 0.15, 8.25)
        },
        MOVE_SPEED: 0.175,
        POSITION_LIMIT: {
            MIN: -5,
            MAX: 5
        },
        COLOR: {
            LEFT: new BABYLON.Color3(0.2, 0.6, 1),
            RIGHT: new BABYLON.Color3(1, 0.3, 0.3)
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
    
    // Ball
    BALL: {
        DIAMETER: 0.4,
        POSITION: new BABYLON.Vector3(0, 0.2, 0),
        COLOR: new BABYLON.Color3(1, 1, 0.7),
        INITIAL_SPEED: 0.1,
        NORMAL_SPEED: 0.15,
        SPIN_FACTOR: 0.1
    },
    
    // Scoring
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
    }
};