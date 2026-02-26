// Game constants
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;
const GRAVITY = 0.65; // Reduced from 0.8 to make jumps longer (less pull down)
const JUMP_FORCE = -18; // Changed from -15 to -18 to make jumps higher (stronger initial upward force)
const GROUND_HEIGHT = 40;
const PLAYER_WIDTH = 80;  // Doubled from 40 to 80
const PLAYER_HEIGHT = 100; // Doubled from 50 to 100
const OBSTACLE_WIDTH = 30;
const OBSTACLE_MIN_HEIGHT = 30;
const OBSTACLE_MAX_HEIGHT = 80;
const COIN_SIZE = 30;
const INITIAL_SPEED = 5;
let SPEED_INCREMENT = 0.0001; // Changed from const to let so it can be updated
const PLAYER_NAME = 'dimbadimba'; // Player character name
const POWERUP_SIZE = 40; // Size of power-up items
const POWERUP_DURATION = 7000; // Duration of power-ups in milliseconds
const POWERUP_SPAWN_CHANCE = 0.15; // Chance of spawning a power-up when an obstacle is passed
const INITIAL_LIVES = 3; // Number of lives player starts with
const INVINCIBILITY_TIME = 1500; // Time (ms) of invincibility after hit

// Combo system constants
const COMBO_TIMEOUT = 2000; // Time in ms before combo resets
const COMBO_MAX_MULTIPLIER = 5; // Maximum combo multiplier

// Smoke effect constants
const MAX_SMOKE_PARTICLES = 25;  // Increased from 20
const SMOKE_SPAWN_RATE = 80;     // Reduced from 100 ms for more frequent puffs
const SMOKE_SIZE_MIN = 4;        // Reduced from 5 
const SMOKE_SIZE_MAX = 12;       // Reduced from 15
const SMOKE_LIFETIME = 2400;     // Increased from 2000 ms for longer-lasting smoke

// Unique ID counter for obstacles
let obstacleIdCounter = 0;

// PWA Installation Variables
let deferredPrompt;
let installButton;
let installToastShown = false;

// Difficulty presets
const DIFFICULTY_SETTINGS = {
    easy: {
        initialSpeed: 4,
        speedIncrement: 0.00005,
        obstacleInterval: 2000,
        coinInterval: 2000,
        powerupSpawnChance: 0.25,
        gravity: 0.55, // Reduced from 0.7
        jumpForce: -17 // Stronger upward force
    },
    normal: {
        initialSpeed: 5,
        speedIncrement: 0.0001,
        obstacleInterval: 1500,
        coinInterval: 2500,
        powerupSpawnChance: 0.15,
        gravity: 0.65, // Reduced from 0.8
        jumpForce: -18 // Stronger upward force
    },
    hard: {
        initialSpeed: 6,
        speedIncrement: 0.00015,
        obstacleInterval: 1200,
        coinInterval: 3000,
        powerupSpawnChance: 0.1,
        gravity: 0.75, // Reduced from 0.9
        jumpForce: -19 // Stronger upward force
    }
};

// Game variables
let canvas, ctx;
let gameState = {
    running: false,
    paused: false,
    speed: INITIAL_SPEED,
    score: 0,
    highScore: 0,
    obstacles: [],
    coins: [],
    powerups: [], // Array to store power-ups on screen
    activePowerups: {}, // Object to track active power-ups and their timers
    pointIndicators: [], // Array to store point indicators when collecting coins
    timeSinceLastObstacle: 0,
    obstacleInterval: 1500,
    timeSinceLastCoin: 0,
    coinInterval: 2500,
    timeSinceLastPowerup: 0,
    powerupInterval: 5000, // Minimum time between power-up spawns
    groundPos: 0,
    groundPattern: null,
    backgroundPos: [0, 0, 0, 0], // Multiple background positions for parallax
    backgroundSpeed: [0.2, 0.5, 1, 2], // Different speeds for each layer
    soundEnabled: true,
    dayMode: true, // Default to day mode
    difficulty: 'normal', // Default difficulty
    gravity: GRAVITY, // Current gravity (can be modified by difficulty)
    jumpForce: JUMP_FORCE, // Current jump force (can be modified by difficulty)
    powerupSpawnChance: POWERUP_SPAWN_CHANCE, // Current power-up spawn chance
    dimbadimba: { // Player character renamed to dimbadimba
        x: 80,
        y: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
        jumping: false,
        frameX: 0,
        frameY: 0,
        maxFrames: 8,
        frameTimer: 0,
        frameInterval: 100,
        armRotation: 0, // Angle for arm rotation animation
        isArmRotating: false, // Flag to track if arms are rotating
        armRotationSpeed: Math.PI/8, // Speed of arm rotation
        armRotationCycles: 0, // Counter for completed cycles
        maxArmRotationCycles: 2 // Number of full rotations to complete
    },
    smokeParticles: [], // Array to hold smoke particles
    smokeTimer: 0, // Timer for spawning smoke particles
    firstObstacleSpawned: false, // Track if the first obstacle has spawned
    magnetRange: 150, // Range for magnet power-up to attract coins
    speedBoostMultiplier: 1.5, // Speed multiplier for speed boost power-up
    scoreMultiplier: 1, // Score multiplier (2 when double score is active)
    lives: INITIAL_LIVES,
    isInvincible: false,
    invincibilityTimer: 0,
    // Combo system state
    combo: {
        count: 0,
        multiplier: 1,
        timer: null,
        maxCombo: 0, // Track best combo in this run
        lastActionTime: 0
    },
    // Particle effects
    particles: [],
    // Near-miss tracking
    nearMissCount: 0,
    checkedObstacleIds: new Set(), // Track obstacles checked for near-miss
};

// UI elements
let startScreen, gameOverScreen, startButton, restartButton;
let currentScoreElement, highScoreElement, finalScoreElement;
let soundToggleBtn, dayModeBtn, nightModeBtn;
let easyModeBtn, normalModeBtn, hardModeBtn; // Difficulty buttons
let difficultyDisplayElement; // Element to display current difficulty
let powerupIndicator; // UI element to show active power-ups

// Sprites and assets
const sprites = {
    player: null,
    obstacle: null,
    coin: null,
    ground: null,
    background: null,
    dayBackground: null,
    nightBackground: null,
    // New parallax background layers
    parallaxLayers: {
        day: [],
        night: []
    },
    obstacles: [],
    powerups: {} // Object to store power-up sprites by type
};

// Sound effects
const sounds = {
    jump: null,
    coin: null,
    gameOver: null,
    backgroundMusic: null,
    audioCtx: null,
    powerup: null, // Sound for collecting power-ups
    hit: null, // Sound for hit when colliding with obstacles
};

// Game colors for different modes
const colors = {
    day: {
        sky: ['#87CEEB', '#3498db'], // Light blue gradient
        ground: '#8B4513', // Brown
        groundDetail: '#A0522D', // Sienna
        groundLine: '#CD853F', // Peru
        obstacleColors: [
            { fill: '#3498db', outline: '#2980b9' }, // Blue
            { fill: '#27ae60', outline: '#219653' }, // Green
            { fill: '#8e44ad', outline: '#6c3483' }, // Purple
            { fill: '#c0392b', outline: '#922b21' }  // Red
        ],
        coinColor: '#f1c40f', // Yellow
    },
    night: {
        sky: ['#000022', '#000033'], // Dark blue gradient
        ground: '#333333', // Dark gray
        groundDetail: '#444444', // Medium gray
        groundLine: '#555555', // Light gray
        obstacleColors: [
            { fill: '#f39c12', outline: '#d35400' }, // Orange
            { fill: '#3498db', outline: '#2980b9' }, // Blue
            { fill: '#2ecc71', outline: '#27ae60' }, // Green
            { fill: '#e74c3c', outline: '#c0392b' }  // Red
        ],
        coinColor: '#ffd700', // Gold
    }
};

// Multiple obstacle shapes
const obstacleShapes = [
    // Cactus shape
    [
        [0,0,1,1,0,0,0],
        [0,1,1,1,1,0,0],
        [1,1,1,1,1,1,0],
        [1,1,1,1,1,1,0],
        [0,1,1,1,1,0,0],
        [0,1,1,1,1,0,0],
        [0,1,1,1,1,0,0],
        [1,1,1,1,1,1,0]
    ],
    // Rock shape
    [
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0]
    ],
    // Spiky shape
    [
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0]
    ],
    // Log shape
    [
        [1,1,1,1,1,1,1],
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1],
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1],
        [1,0,1,0,1,0,1],
        [1,1,1,1,1,1,1]
    ]
];

// Power-up types
const POWERUP_TYPES = {
    SPEED: 'speed',
    SHIELD: 'shield',
    MAGNET: 'magnet',
    DOUBLE_SCORE: 'doubleScore'
};

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired - script.js initialization starting');
    
    // Initialize the game
    // DON'T call initGame() here as it's creating conflicts
    
    // Get canvas and create context
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Specifically check for iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Apply iOS specific class
    if (isIOS) {
        document.body.classList.add('ios-device');
    }
    
    // Set canvas dimensions to fill the screen
    updateCanvasSize();
    
    // Get UI elements
    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('game-over');
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    currentScoreElement = document.getElementById('currentScore');
    highScoreElement = document.getElementById('highScore');
    finalScoreElement = document.getElementById('finalScore');
    soundToggleBtn = document.getElementById('soundToggle');
    dayModeBtn = document.getElementById('dayModeBtn');
    nightModeBtn = document.getElementById('nightModeBtn');
    difficultyDisplayElement = document.getElementById('difficultyDisplay');
    
    // Debug log DOM elements
    console.log('startButton element found:', startButton !== null);
    console.log('restartButton element found:', restartButton !== null);
    
    // Get difficulty buttons
    easyModeBtn = document.getElementById('easyModeBtn');
    normalModeBtn = document.getElementById('normalModeBtn');
    hardModeBtn = document.getElementById('hardModeBtn');
    
    // Get PWA install button
    installButton = document.getElementById('installButton');
    
    // Create power-up indicator element
    createPowerupIndicator();
    
    // Load high score from local storage
    const savedHighScore = localStorage.getItem('pixelRunnerHighScore');
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
        highScoreElement.textContent = gameState.highScore;
    }
    
    // Load sound preference from local storage
    const soundPref = localStorage.getItem('pixelRunnerSound');
    if (soundPref !== null) {
        gameState.soundEnabled = soundPref === 'true';
        updateSoundToggleButton();
    }
    
    // Load day/night mode preference from local storage
    const modePref = localStorage.getItem('pixelRunnerDayMode');
    if (modePref !== null) {
        gameState.dayMode = modePref === 'true';
        updateModeButtons();
    }
    
    // Load difficulty preference from local storage
    const difficultyPref = localStorage.getItem('pixelRunnerDifficulty');
    if (difficultyPref !== null) {
        gameState.difficulty = difficultyPref;
        updateDifficultyButtons();
    }
    
    // Initialize lives counter display
    updateLivesDisplay();
    
    // Create sprites
    createSprites();
    
    // Set up event listeners - now using a direct approach
    setupEventListeners();
    
    // Initialize PWA installation features
    initPwaInstallation();
    
    // Setup mobile-specific features if on mobile
    if (isMobile) {
        setupTouchControls();
        handleDeviceOrientation(); // Check initial orientation
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', function() {
            // Small delay to allow orientation to complete
            setTimeout(function() {
                handleDeviceOrientation();
                updateCanvasSize();
            }, 300);
        });
        
        // Also listen for resize which works on more devices
        window.addEventListener('resize', function() {
            handleDeviceOrientation();
            updateCanvasSize();
        });
        
        // Special handling for iOS audio
        document.addEventListener('touchstart', function() {
            // iOS requires user interaction to start audio context
            if (sounds.audioCtx && sounds.audioCtx.state === 'suspended') {
                sounds.audioCtx.resume();
            }
        }, {once: true});
    }
    
    // Add additional resize listener to handle dynamic viewport changes
    window.addEventListener('resize', function() {
        updateCanvasSize();
    });
    
    // Handle iOS Safari 100vh issues
    if (isMobile) {
        // For iOS Safari, we need to update height on scroll as well
        window.addEventListener('scroll', function() {
            adjustGameHeight();
        });
        
        // Initial size adjustment
        adjustGameHeight();
    }
    
    // Draw initial game screen
    drawGame();
    
    // Initialize mobile-specific behaviors
    handleMobileSpecificBehaviors();
    
    // Initialize the fullscreen button if available
    const fullscreenButton = document.getElementById('fullscreenButton');
    
    if (fullscreenButton) {
        // Only show the fullscreen button if fullscreen is available
        if (isFullscreenAvailable()) {
            fullscreenButton.style.display = 'flex';
        } else {
            fullscreenButton.style.display = 'none';
        }
    }
    
    // Check orientation initially
    handleDeviceOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', handleDeviceOrientation);
    window.addEventListener('resize', handleDeviceOrientation);
    
    // Try to scroll to hide URL bar on page load
    window.addEventListener('load', function() {
        // Timeout needed for iOS
        setTimeout(function() {
            // Scroll to hide address bar
            window.scrollTo(0, 1);
            // Check button visibility again after hiding URL bar
            ensureStartButtonVisibility();
        }, 100);
    });
    
    // Ensure start button is visible
    ensureStartButtonVisibility();
    
    console.log('DOMContentLoaded initialization complete');
});

function initializeAudio() {
    // Only initialize audio if not already initialized
    if (sounds.audioCtx) return;
    
    
    try {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        sounds.audioCtx = new AudioContext();
        
        // Handle iOS audio context suspension
        if (sounds.audioCtx.state === 'suspended') {
            const resumeAudio = function() {
                sounds.audioCtx.resume();
                
                // Remove event listeners once audio is resumed
                ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(function(event) {
                    document.body.removeEventListener(event, resumeAudio);
                });
            };
            
            // Add event listeners to resume audio on user interaction
            ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(function(event) {
                document.body.addEventListener(event, resumeAudio);
            });
        }
        
        // Load sounds
        loadSounds();
        
        console.log("Audio context initialized successfully");
    } catch (error) {
        console.error("Error initializing audio context:", error);
        gameState.soundEnabled = false;
        updateSoundToggleButton();
    }
}

function updateCanvasSize() {
    // Get the actual visible viewport dimensions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // iOS and Android have different ways of reporting viewport size
    // Use visual viewport API if available (more accurate on mobile)
    if (window.visualViewport) {
        GAME_WIDTH = window.visualViewport.width;
        GAME_HEIGHT = window.visualViewport.height;
    } else {
        GAME_WIDTH = window.innerWidth;
        GAME_HEIGHT = window.innerHeight;
    }
    
    // Adjust for iOS safe areas
    if (isIOS) {
        const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
        const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
        
        if (safeAreaTop) GAME_HEIGHT -= safeAreaTop;
        if (safeAreaBottom) GAME_HEIGHT -= safeAreaBottom;
    }
    
    // Performance optimization for mobile devices
    const isMobile = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Reduce quality on low-end devices
    if (isMobile && (GAME_WIDTH * GAME_HEIGHT > 1000000)) {
        // For very high-resolution mobile screens, use a scaling factor
        const scaleFactor = Math.min(1, 1000000 / (GAME_WIDTH * GAME_HEIGHT));
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = Math.floor(GAME_WIDTH * scaleFactor);
        canvas.height = Math.floor(GAME_HEIGHT * scaleFactor);
        ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
    } else {
        // Set canvas dimensions
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
    }
    
    // Update player position to maintain relative distance from ground
    if (gameState.running) {
        const groundY = GAME_HEIGHT - GROUND_HEIGHT - gameState.dimbadimba.height;
        if (!gameState.dimbadimba.jumping) {
            gameState.dimbadimba.y = groundY;
        }
    }
    
    // Adjust game container and elements to account for browser UI
    adjustGameHeight();
    
    // Handle orientation changes
    handleDeviceOrientation();
    
    // Recreate ground pattern if it exists
    if (sprites.ground) {
        gameState.groundPattern = ctx.createPattern(sprites.ground, 'repeat-x');
    }
    
    // Recreate background if needed
    createBackgroundSprites();
}

function loadSounds() {
    // Create synthesized sounds using the Web Audio API
    // This eliminates the need for external audio files
    
    if (!sounds.audioCtx) {
        console.warn("Cannot load sounds - audio context not initialized");
        return;
    }
    
    try {
        // Jump sound - short upward sweep
        sounds.jump = createSound(function(time) {
            const oscillator = sounds.audioCtx.createOscillator();
            const gainNode = sounds.audioCtx.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, time);
            oscillator.frequency.exponentialRampToValueAtTime(600, time + 0.2);
            
            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(sounds.audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.2);
        });
        
        // Coin collection sound - happy bling
        sounds.coin = createSound(function(time) {
            const oscillator = sounds.audioCtx.createOscillator();
            const gainNode = sounds.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, time);
            oscillator.frequency.exponentialRampToValueAtTime(900, time + 0.1);
            
            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(sounds.audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.3);
        });
        
        // Game over sound - descending tone
        sounds.gameOver = createSound(function(time) {
            const oscillator = sounds.audioCtx.createOscillator();
            const gainNode = sounds.audioCtx.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(280, time);
            oscillator.frequency.exponentialRampToValueAtTime(80, time + 0.5);
            
            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(sounds.audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.5);
        });
        
        // Background music - enhanced with variety
        sounds.backgroundMusic = createLoopingMusic(sounds.audioCtx);
        
        // Power-up collection sound
        sounds.powerup = createSound(function(time) {
            const oscillator = sounds.audioCtx.createOscillator();
            const gainNode = sounds.audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, time);
            oscillator.frequency.exponentialRampToValueAtTime(880, time + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(660, time + 0.2);
            
            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(sounds.audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.3);
        });
        
        // Hit sound
        sounds.hit = createSound(function(time) {
            const oscillator = sounds.audioCtx.createOscillator();
            const gainNode = sounds.audioCtx.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, time);
            oscillator.frequency.exponentialRampToValueAtTime(400, time + 0.2);
            
            gainNode.gain.setValueAtTime(0.5, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(sounds.audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + 0.2);
        });
    } catch (error) {
        console.error("Error creating sounds:", error);
        // Initialize dummy sounds to prevent errors
        sounds.jump = function() {};
        sounds.coin = function() {};
        sounds.gameOver = function() {};
        sounds.powerup = function() {};
        sounds.backgroundMusic = { play: function() {}, stop: function() {} };
        sounds.hit = function() {};
    }
}

function createSound(setupFn) {
    return function() {
        if (!sounds.audioCtx || !gameState.soundEnabled) return;
        
        // Resume audio context if it's suspended (browser requirement for user interaction)
        if (sounds.audioCtx.state === 'suspended') {
            sounds.audioCtx.resume();
        }
        
        setupFn(sounds.audioCtx.currentTime);
    };
}

function createLoopingMusic(audioCtx) {
    // Musical notes in Hz (based on A4 = 440Hz)
    const NOTES = {
        // Lower octave
        C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
        G3: 196.00, A3: 220.00, B3: 246.94,
        // Middle octave
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, 
        G4: 392.00, A4: 440.00, B4: 493.88,
        // Upper octave
        C5: 523.25, D5: 587.33, E5: 659.25,
        REST: 0
    };
    
    // Happy, peppy music patterns for day mode (all in C major)
    const dayMelodyPatterns = [
        [
            { note: NOTES.E4, duration: 0.12, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.C5, duration: 0.24, type: 'triangle' },
            { note: NOTES.B4, duration: 0.12, type: 'triangle' },
            { note: NOTES.C5, duration: 0.12, type: 'triangle' },
            { note: NOTES.G4, duration: 0.24, type: 'triangle' },
            { note: NOTES.E4, duration: 0.12, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.A4, duration: 0.24, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.F4, duration: 0.12, type: 'triangle' },
            { note: NOTES.E4, duration: 0.24, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.C5, duration: 0.12, type: 'triangle' },
            { note: NOTES.G4, duration: 0.24, type: 'triangle' }
        ],
        [
            { note: NOTES.C5, duration: 0.12, type: 'sine' },
            { note: NOTES.A4, duration: 0.12, type: 'sine' },
            { note: NOTES.G4, duration: 0.24, type: 'sine' },
            { note: NOTES.F4, duration: 0.12, type: 'sine' },
            { note: NOTES.E4, duration: 0.12, type: 'sine' },
            { note: NOTES.G4, duration: 0.24, type: 'sine' },
            { note: NOTES.C5, duration: 0.12, type: 'sine' },
            { note: NOTES.B4, duration: 0.12, type: 'sine' },
            { note: NOTES.A4, duration: 0.24, type: 'sine' },
            { note: NOTES.G4, duration: 0.12, type: 'sine' },
            { note: NOTES.F4, duration: 0.12, type: 'sine' },
            { note: NOTES.E4, duration: 0.12, type: 'sine' },
            { note: NOTES.D4, duration: 0.12, type: 'sine' },
            { note: NOTES.C4, duration: 0.12, type: 'sine' },
            { note: NOTES.E4, duration: 0.24, type: 'sine' }
        ],
        [
            { note: NOTES.G4, duration: 0.08, type: 'triangle' },
            { note: NOTES.A4, duration: 0.08, type: 'triangle' },
            { note: NOTES.B4, duration: 0.08, type: 'triangle' },
            { note: NOTES.C5, duration: 0.16, type: 'triangle' },
            { note: NOTES.D5, duration: 0.08, type: 'triangle' },
            { note: NOTES.C5, duration: 0.08, type: 'triangle' },
            { note: NOTES.B4, duration: 0.16, type: 'triangle' },
            { note: NOTES.A4, duration: 0.08, type: 'triangle' },
            { note: NOTES.G4, duration: 0.08, type: 'triangle' },
            { note: NOTES.A4, duration: 0.16, type: 'triangle' },
            { note: NOTES.B4, duration: 0.08, type: 'triangle' },
            { note: NOTES.A4, duration: 0.08, type: 'triangle' },
            { note: NOTES.G4, duration: 0.16, type: 'triangle' },
            { note: NOTES.E4, duration: 0.08, type: 'triangle' },
            { note: NOTES.G4, duration: 0.08, type: 'triangle' },
            { note: NOTES.C5, duration: 0.16, type: 'triangle' },
            { note: NOTES.G4, duration: 0.16, type: 'triangle' },
            { note: NOTES.E4, duration: 0.16, type: 'triangle' }
        ]
    ];
    
    // More mysterious but still melodic patterns for night mode (mostly in A minor)
    const nightMelodyPatterns = [
        [
            { note: NOTES.E4, duration: 0.12, type: 'sine' },
            { note: NOTES.A4, duration: 0.12, type: 'sine' },
            { note: NOTES.C5, duration: 0.24, type: 'sine' },
            { note: NOTES.B4, duration: 0.12, type: 'sine' },
            { note: NOTES.A4, duration: 0.12, type: 'sine' },
            { note: NOTES.E4, duration: 0.24, type: 'sine' },
            { note: NOTES.A4, duration: 0.12, type: 'sine' },
            { note: NOTES.B4, duration: 0.12, type: 'sine' },
            { note: NOTES.C5, duration: 0.24, type: 'sine' },
            { note: NOTES.A4, duration: 0.12, type: 'sine' },
            { note: NOTES.B4, duration: 0.12, type: 'sine' },
            { note: NOTES.A4, duration: 0.24, type: 'sine' },
            { note: NOTES.G4, duration: 0.12, type: 'sine' },
            { note: NOTES.E4, duration: 0.12, type: 'sine' },
            { note: NOTES.A4, duration: 0.24, type: 'sine' }
        ],
        [
            { note: NOTES.A4, duration: 0.12, type: 'triangle' },
            { note: NOTES.C5, duration: 0.12, type: 'triangle' },
            { note: NOTES.E5, duration: 0.24, type: 'triangle' },
            { note: NOTES.D5, duration: 0.12, type: 'triangle' },
            { note: NOTES.C5, duration: 0.12, type: 'triangle' },
            { note: NOTES.B4, duration: 0.24, type: 'triangle' },
            { note: NOTES.C5, duration: 0.12, type: 'triangle' },
            { note: NOTES.A4, duration: 0.12, type: 'triangle' },
            { note: NOTES.E4, duration: 0.24, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.A4, duration: 0.12, type: 'triangle' },
            { note: NOTES.B4, duration: 0.12, type: 'triangle' },
            { note: NOTES.A4, duration: 0.12, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.A4, duration: 0.24, type: 'triangle' }
        ],
        [
            { note: NOTES.E4, duration: 0.08, type: 'sine' },
            { note: NOTES.A4, duration: 0.08, type: 'sine' },
            { note: NOTES.B4, duration: 0.08, type: 'sine' },
            { note: NOTES.C5, duration: 0.16, type: 'sine' },
            { note: NOTES.B4, duration: 0.08, type: 'sine' },
            { note: NOTES.A4, duration: 0.08, type: 'sine' },
            { note: NOTES.G4, duration: 0.16, type: 'sine' },
            { note: NOTES.E4, duration: 0.08, type: 'sine' },
            { note: NOTES.G4, duration: 0.08, type: 'sine' },
            { note: NOTES.A4, duration: 0.16, type: 'sine' },
            { note: NOTES.B4, duration: 0.08, type: 'sine' },
            { note: NOTES.A4, duration: 0.08, type: 'sine' },
            { note: NOTES.E4, duration: 0.16, type: 'sine' },
            { note: NOTES.A4, duration: 0.08, type: 'sine' },
            { note: NOTES.B4, duration: 0.08, type: 'sine' },
            { note: NOTES.C5, duration: 0.16, type: 'sine' },
            { note: NOTES.B4, duration: 0.16, type: 'sine' },
            { note: NOTES.A4, duration: 0.16, type: 'sine' }
        ]
    ];
    
    // Consistent, driving bass patterns for day mode
    const dayBassPatterns = [
        [
            { note: NOTES.C3, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.C3, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.F3, duration: 0.16, type: 'sine' },
            { note: NOTES.C4, duration: 0.16, type: 'sine' },
            { note: NOTES.F3, duration: 0.16, type: 'sine' },
            { note: NOTES.C4, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.D4, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.D4, duration: 0.16, type: 'sine' },
            { note: NOTES.C3, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.C3, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' }
        ],
        [
            { note: NOTES.C3, duration: 0.24, type: 'sine' },
            { note: NOTES.E3, duration: 0.12, type: 'sine' },
            { note: NOTES.G3, duration: 0.12, type: 'sine' },
            { note: NOTES.F3, duration: 0.24, type: 'sine' },
            { note: NOTES.A3, duration: 0.12, type: 'sine' },
            { note: NOTES.C4, duration: 0.12, type: 'sine' },
            { note: NOTES.G3, duration: 0.24, type: 'sine' },
            { note: NOTES.B3, duration: 0.12, type: 'sine' },
            { note: NOTES.D4, duration: 0.12, type: 'sine' },
            { note: NOTES.C3, duration: 0.24, type: 'sine' },
            { note: NOTES.E3, duration: 0.12, type: 'sine' },
            { note: NOTES.G3, duration: 0.12, type: 'sine' }
        ]
    ];
    
    // Consistent bass patterns for night mode
    const nightBassPatterns = [
        [
            { note: NOTES.A3, duration: 0.16, type: 'sine' },
            { note: NOTES.E3, duration: 0.16, type: 'sine' },
            { note: NOTES.A3, duration: 0.16, type: 'sine' },
            { note: NOTES.E3, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.D3, duration: 0.16, type: 'sine' },
            { note: NOTES.G3, duration: 0.16, type: 'sine' },
            { note: NOTES.D3, duration: 0.16, type: 'sine' },
            { note: NOTES.F3, duration: 0.16, type: 'sine' },
            { note: NOTES.C3, duration: 0.16, type: 'sine' },
            { note: NOTES.F3, duration: 0.16, type: 'sine' },
            { note: NOTES.C3, duration: 0.16, type: 'sine' },
            { note: NOTES.E3, duration: 0.16, type: 'sine' },
            { note: NOTES.A3, duration: 0.16, type: 'sine' },
            { note: NOTES.E3, duration: 0.16, type: 'sine' },
            { note: NOTES.A3, duration: 0.16, type: 'sine' }
        ],
        [
            { note: NOTES.A3, duration: 0.24, type: 'sine' },
            { note: NOTES.E3, duration: 0.12, type: 'sine' },
            { note: NOTES.A3, duration: 0.12, type: 'sine' },
            { note: NOTES.G3, duration: 0.24, type: 'sine' },
            { note: NOTES.D3, duration: 0.12, type: 'sine' },
            { note: NOTES.G3, duration: 0.12, type: 'sine' },
            { note: NOTES.F3, duration: 0.24, type: 'sine' },
            { note: NOTES.C3, duration: 0.12, type: 'sine' },
            { note: NOTES.F3, duration: 0.12, type: 'sine' },
            { note: NOTES.E3, duration: 0.24, type: 'sine' },
            { note: NOTES.B3, duration: 0.12, type: 'sine' },
            { note: NOTES.E3, duration: 0.12, type: 'sine' }
        ]
    ];
    
    // Shared bridge patterns for smooth transitions between different melody sections
    const bridgePatterns = [
        [
            { note: NOTES.C4, duration: 0.12, type: 'triangle' },
            { note: NOTES.E4, duration: 0.12, type: 'triangle' },
            { note: NOTES.G4, duration: 0.12, type: 'triangle' },
            { note: NOTES.C5, duration: 0.12, type: 'triangle' }
        ],
        [
            { note: NOTES.A4, duration: 0.12, type: 'sine' },
            { note: NOTES.E4, duration: 0.12, type: 'sine' },
            { note: NOTES.C4, duration: 0.12, type: 'sine' },
            { note: NOTES.A3, duration: 0.12, type: 'sine' }
        ]
    ];
    
    let currentPatternIndex = 0;
    let loopId = null;
    let lastMelodyPattern = -1;
    let lastBassPattern = -1;
    let fadeOutGain = null;
    
    function playNote(note, time, duration, type, gain, isChord = false) {
        if (note === NOTES.REST || isNaN(note) || note <= 0) return;
        
        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(note, time);
            
            // Smoother envelope with longer attack and release for more pleasant sound
            const attackTime = 0.04;
            const releaseTime = isChord ? duration * 0.6 : duration * 0.4;
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(gain, time + attackTime);
            gainNode.gain.setValueAtTime(gain, time + duration - releaseTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start(time);
            oscillator.stop(time + duration);
            
            return gainNode; // Return the gain node for potential fade effects
        } catch (e) {
            console.error("Error playing note:", e);
            return null;
        }
    }
    
    function playBridgePattern(time, isDayMode) {
        // Choose a bridge pattern based on day/night mode
        const bridgeIndex = isDayMode ? 0 : 1;
        const bridge = bridgePatterns[bridgeIndex];
        
        let currentTime = time;
        for (let i = 0; i < bridge.length; i++) {
            const note = bridge[i];
            playNote(note.note, currentTime, note.duration, note.type, 0.12);
            currentTime += note.duration;
        }
        
        return currentTime - time; // Return duration of bridge
    }
    
    function scheduleLoop(time) {
        const dayMode = gameState.dayMode;
        
        // Select patterns based on day/night mode
        const melodyPatterns = dayMode ? dayMelodyPatterns : nightMelodyPatterns;
        const bassPatterns = dayMode ? dayBassPatterns : nightBassPatterns;
        
        // Choose a different melody pattern than the last one
        let melodyPatternIndex;
        do {
            melodyPatternIndex = Math.floor(Math.random() * melodyPatterns.length);
        } while (melodyPatternIndex === lastMelodyPattern && melodyPatterns.length > 1);
        
        // If it's a new pattern and not the first one, play a bridge for smooth transition
        let bridgeDuration = 0;
        if (lastMelodyPattern !== -1 && melodyPatternIndex !== lastMelodyPattern) {
            bridgeDuration = playBridgePattern(time, dayMode);
        }
        
        lastMelodyPattern = melodyPatternIndex;
        
        // Choose a different bass pattern than the last one
        let bassPatternIndex;
        do {
            bassPatternIndex = Math.floor(Math.random() * bassPatterns.length);
        } while (bassPatternIndex === lastBassPattern && bassPatterns.length > 1);
        lastBassPattern = bassPatternIndex;
        
        const selectedMelody = melodyPatterns[melodyPatternIndex];
        const selectedBass = bassPatterns[bassPatternIndex];
        
        // Add very slight tempo variation to keep it natural
        const tempoVariation = 1 + (Math.random() * 0.04 - 0.02); // ±2% variation
        
        // Adjust starting time for bridge if needed
        const startTime = time + bridgeDuration;
        
        // Play melody
        let totalDuration = 0;
        let currentTime = startTime;
        for (let i = 0; i < selectedMelody.length; i++) {
            const note = selectedMelody[i];
            const duration = note.duration * tempoVariation;
            
            // Add occasional chords for richness (every 4th note with 40% chance)
            const addChord = i % 4 === 0 && Math.random() < 0.4;
            
            // Melody note - slightly louder for peppy feel
            playNote(note.note, currentTime, duration, note.type, 0.13);
            
            // Add a chord if selected
            if (addChord) {
                // Perfect fifth above the melody note
                const fifthAbove = note.note * 1.5;
                playNote(fifthAbove, currentTime, duration, note.type, 0.07, true);
                
                // Octave above the melody note (occasionally)
                if (Math.random() < 0.5) {
                    const octaveAbove = note.note * 2;
                    playNote(octaveAbove, currentTime, duration, note.type, 0.05, true);
                }
            }
            
            currentTime += duration;
            totalDuration += duration;
        }
        
        // Play bass accompaniment (starts at the same time as melody)
        currentTime = startTime;
        for (let i = 0; i < selectedBass.length; i++) {
            const note = selectedBass[i];
            const duration = note.duration * tempoVariation;
            
            playNote(note.note, currentTime, duration, note.type, 0.18);
            currentTime += duration;
        }
        
        // Schedule the next loop - ensure we don't create a gap
        const nextLoopTime = startTime + totalDuration;
        loopId = setTimeout(() => scheduleLoop(audioCtx.currentTime), 
                           (nextLoopTime - audioCtx.currentTime) * 1000 - 50); // Start 50ms before end for smoothness
        
        return totalDuration;
    }
    
    function createNoiseBuffer(audioCtx) {
        const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    return {
        play: function() {
            if (!audioCtx || !gameState.soundEnabled || loopId) return;
            
            // Reset pattern index
            currentPatternIndex = 0;
            
            // Resume audio context if it's suspended
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    scheduleLoop(audioCtx.currentTime);
                });
            } else {
                scheduleLoop(audioCtx.currentTime);
            }
        },
        stop: function() {
            if (loopId) {
                clearTimeout(loopId);
                loopId = null;
            }
            
            // Create smooth fade-out effect instead of abrupt stop
            if (audioCtx && audioCtx.state === 'running') {
                const fadeOutTime = 1.0; // 1 second fade out
                
                // Create a gain node for fading out all sound
                if (!fadeOutGain) {
                    fadeOutGain = audioCtx.createGain();
                    fadeOutGain.gain.value = 1;
                    fadeOutGain.connect(audioCtx.destination);
                }
                
                // Schedule the fade-out
                const now = audioCtx.currentTime;
                fadeOutGain.gain.setValueAtTime(fadeOutGain.gain.value, now);
                fadeOutGain.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);
                
                // Reset after fade completes
                setTimeout(() => {
                    if (fadeOutGain) {
                        fadeOutGain.disconnect();
                        fadeOutGain = null;
                    }
                }, fadeOutTime * 1000);
            }
        }
    };
}

function toggleSound() {
    // Initialize audio on first toggle if needed
    if (!sounds.audioCtx && gameState.soundEnabled) {
        initializeAudio();
    }
    
    gameState.soundEnabled = !gameState.soundEnabled;
    localStorage.setItem('pixelRunnerSound', gameState.soundEnabled);
    
    updateSoundToggleButton();
    
    // Handle background music based on sound toggle
    if (gameState.soundEnabled && gameState.running && !gameState.paused) {
        sounds.backgroundMusic.play();
    } else {
        sounds.backgroundMusic.stop();
    }
}

function updateSoundToggleButton() {
    if (soundToggleBtn) {
        soundToggleBtn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
        soundToggleBtn.setAttribute('aria-label', gameState.soundEnabled ? 'Mute' : 'Unmute');
    }
}

function toggleDayNightMode(isDayMode) {
    if (gameState.dayMode === isDayMode) return;
    
    gameState.dayMode = isDayMode;
    localStorage.setItem('pixelRunnerDayMode', gameState.dayMode);
    
    updateModeButtons();
    createSprites();
    drawGame();
}

function updateModeButtons() {
    // Check if the buttons exist before trying to update them
    if (!dayModeBtn || !nightModeBtn) {
        console.warn("Mode buttons not found");
        return;
    }
    
    // Update mode button selection
    dayModeBtn.classList.remove('selected');
    nightModeBtn.classList.remove('selected');
    
    if (gameState.dayMode) {
        dayModeBtn.classList.add('selected');
    } else {
        nightModeBtn.classList.add('selected');
    }
}

function createSprites() {
    // Try to load player image first, then fall back to pixel art if image fails to load
    loadPlayerImage();
    
    // Get current mode colors
    const modeColors = gameState.dayMode ? colors.day : colors.night;
    
    // Create multiple obstacle sprites with outlines - each with its own color
    sprites.obstacles = [];
    for (let i = 0; i < obstacleShapes.length; i++) {
        // Get color for this shape from the colors array
        const colorIndex = i % modeColors.obstacleColors.length;
        const color = modeColors.obstacleColors[colorIndex];
        
        sprites.obstacles.push(
            createObstacleWithOutline(
                obstacleShapes[i],
                color.fill, 
                color.outline, 
                4
            )
        );
    }
    
    // Keep backward compatibility
    sprites.obstacle = sprites.obstacles[0];
    
    // Coin sprite (yellow circle)
    sprites.coin = createPixelArt([
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0]
    ], modeColors.coinColor, 4);
    
    // Create ground pattern
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 80;
    groundCanvas.height = GROUND_HEIGHT;
    const groundCtx = groundCanvas.getContext('2d');
    
    // Fill ground with color based on mode
    groundCtx.fillStyle = modeColors.ground;
    groundCtx.fillRect(0, 0, groundCanvas.width, groundCanvas.height);
    
    // Add pixel details to ground
    groundCtx.fillStyle = modeColors.groundDetail;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * groundCanvas.width;
        const y = Math.random() * groundCanvas.height;
        const size = Math.random() * 6 + 2;
        groundCtx.fillRect(x, y, size, size);
    }
    
    // Add top line to ground
    groundCtx.fillStyle = modeColors.groundLine;
    groundCtx.fillRect(0, 0, groundCanvas.width, 2);
    
    sprites.ground = groundCanvas;
    gameState.groundPattern = ctx.createPattern(groundCanvas, 'repeat-x');
    
    // Create backgrounds for day and night
    createBackgroundSprites();
    
    // Create power-up sprites
    createPowerupSprites();
}

// Function to load player image
function loadPlayerImage() {
    // Define the player pixels as fallback
    const dimbadimbaPixels = [
        [0,0,0,5,5,5,5,0,0,0], // Hair (black)
        [0,0,5,1,1,1,1,5,0,0], // Head (green)
        [0,0,5,1,4,4,1,5,0,0], // Eyes (white)
        [0,0,5,1,1,1,1,5,0,0], // Face (green)
        [0,0,0,5,1,1,5,0,0,0], // Neck (green)
        [0,0,5,6,6,6,6,5,0,0], // Torso row 1 (black)
        [0,2,7,7,7,7,7,7,2,0], // Torso row 2 (white) with yellow hands
        [5,6,6,6,6,6,6,6,6,5], // Torso row 3 (black)
        [0,0,1,0,0,0,0,1,0,0], // Legs (green)
        [0,0,1,1,0,0,1,1,0,0]  // Feet (green)
    ];
    
    const colorMap = [
        '#2ecc71', // Green - index 1 (head, neck, legs)
        '#f1c40f', // Yellow - index 2 (hands)
        '#ffffff', // White - index 3 (alternating torso)
        '#ffffff', // White - index 4 (eyes)
        '#000000', // Black - index 5 (hair, outline)
        '#000000', // Black - index 6 (alternating torso)
        '#ffffff'  // White - index 7 (alternating torso)
    ];

    // Try to load the image
    const playerImage = new Image();
    playerImage.onload = function() {
        console.log("Dimbadimba image loaded successfully");
        
        // Store the original image for reference
        sprites.playerOriginal = playerImage;
        
        // Create a properly sized version that maintains aspect ratio
        const canvas = document.createElement('canvas');
        canvas.width = PLAYER_WIDTH * 2.2;  // Increased from 1.5x
        canvas.height = PLAYER_HEIGHT * 2.2; // Increased from 1.5x
        const ctx = canvas.getContext('2d');
        
        // Calculate base scaling to maintain aspect ratio
        let baseScale = Math.min(
            PLAYER_WIDTH / playerImage.width,
            PLAYER_HEIGHT / playerImage.height
        );
        
        // Make the character larger (increased from 2.5x)
        const scale = baseScale * 3.6;
        
        // Calculate dimensions with the enhanced scale
        const width = playerImage.width * scale;
        const height = playerImage.height * scale;
        
        // Center the image on the canvas (may extend beyond player hitbox)
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        // Store these dimensions and offsets for use in drawGame
        gameState.dimbadimba.imageScale = scale;
        gameState.dimbadimba.imageWidth = width;
        gameState.dimbadimba.imageHeight = height;
        gameState.dimbadimba.imageOffsetX = x;
        gameState.dimbadimba.imageOffsetY = y;
        gameState.dimbadimba.canvasWidth = canvas.width;
        gameState.dimbadimba.canvasHeight = canvas.height;
        
        // Clear and draw the image centered and scaled
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(playerImage, x, y, width, height);
        
        // Use this canvas as the player sprite
        sprites.player = canvas;
        
        // Also create a version for the start screen (make this larger too)
        const startScreenDimbadimba = document.createElement('img');
        startScreenDimbadimba.src = playerImage.src;
        startScreenDimbadimba.style.width = '240px'; // Adjusted size to fit container
        startScreenDimbadimba.style.height = 'auto';
        startScreenDimbadimba.style.transform = 'scale(1.3)'; // Scale the image itself rather than making container larger
        startScreenDimbadimba.style.filter = 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))';
        startScreenDimbadimba.style.position = 'relative'; // For proper scaling
        startScreenDimbadimba.style.zIndex = '5'; // Ensure it's above the container background
        startScreenDimbadimba.classList.add('start-screen-character');
        
        // Display character on start screen
        const dimbadimbaDisplay = document.getElementById('dimbadimbaDisplay');
        if (dimbadimbaDisplay) {
            dimbadimbaDisplay.innerHTML = '';
            dimbadimbaDisplay.appendChild(startScreenDimbadimba);
        }
    };
    
    playerImage.onerror = function() {
        console.warn("Could not load dimbadimba image, falling back to pixel art");
        // Create the player sprite with multiple colors - increased scale from 12 to 18
        sprites.player = createMultiColorPixelArt(dimbadimbaPixels, colorMap, 18);
        
        // Also create a version for the start screen - increased scale from 24 to 32
        const startScreenDimbadimba = createMultiColorPixelArt(dimbadimbaPixels, colorMap, 32);
        
        // Display character on start screen
        const dimbadimbaDisplay = document.getElementById('dimbadimbaDisplay');
        if (dimbadimbaDisplay) {
            dimbadimbaDisplay.innerHTML = '';
            dimbadimbaDisplay.appendChild(startScreenDimbadimba);
        }
    };
    
    // Set the source to try loading the image
    playerImage.src = 'images/dimbadimba.png';
}

function createBackgroundSprites() {
    // Create parallax background layers for day mode
    sprites.parallaxLayers.day = createParallaxBackgroundDay();
    
    // Create parallax background layers for night mode
    sprites.parallaxLayers.night = createParallaxBackgroundNight();
    
    // Keep the original backgrounds for compatibility
    sprites.dayBackground = sprites.parallaxLayers.day[0];
    sprites.nightBackground = sprites.parallaxLayers.night[0];
    
    // Set the active background based on current mode
    sprites.background = gameState.dayMode ? sprites.dayBackground : sprites.nightBackground;
}

function createParallaxBackgroundDay() {
    const layers = [];
    
    // Layer 1: Sky (furthest, slowest)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = GAME_WIDTH;
    skyCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const skyCtx = skyCanvas.getContext('2d');
    
    // Fill background with day sky gradient
    const gradient = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
    gradient.addColorStop(0, colors.day.sky[0]);
    gradient.addColorStop(1, colors.day.sky[1]);
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    
    // Add sun
    const sunSize = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.15;
    const sunX = GAME_WIDTH * 0.8;
    const sunY = sunSize;
    
    // Create sun gradient
    const sunGradient = skyCtx.createRadialGradient(
        sunX, sunY, 0,
        sunX, sunY, sunSize
    );
    sunGradient.addColorStop(0, 'rgba(255, 255, 190, 1)');
    sunGradient.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)');
    sunGradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
    
    skyCtx.fillStyle = sunGradient;
    skyCtx.fillRect(sunX - sunSize, sunY - sunSize, sunSize * 2, sunSize * 2);
    
    layers.push(skyCanvas);
    
    // Layer 2: Distant mountains (far)
    const mountainsCanvas = document.createElement('canvas');
    mountainsCanvas.width = GAME_WIDTH * 1.5; // Make wider for slower scrolling
    mountainsCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const mountainsCtx = mountainsCanvas.getContext('2d');
    
    // Create distant mountains
    drawMountainRange(mountainsCtx, mountainsCanvas.width, mountainsCanvas.height, 
                     'rgba(120, 160, 180, 0.5)', 0.6, 3);
    
    layers.push(mountainsCanvas);
    
    // Layer 3: Hills (medium distance)
    const hillsCanvas = document.createElement('canvas');
    hillsCanvas.width = GAME_WIDTH * 1.2; // Make wider for scrolling
    hillsCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const hillsCtx = hillsCanvas.getContext('2d');
    
    // Create medium-distance hills
    drawMountainRange(hillsCtx, hillsCanvas.width, hillsCanvas.height, 
                     'rgba(100, 170, 100, 0.7)', 0.4, 5);
    
    layers.push(hillsCanvas);
    
    // Layer 4: Clouds (closest, fastest)
    const cloudsCanvas = document.createElement('canvas');
    cloudsCanvas.width = GAME_WIDTH * 2; // Make wider for scrolling
    cloudsCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const cloudsCtx = cloudsCanvas.getContext('2d');
    
    // Add clouds
    cloudsCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    for (let i = 0; i < 12; i++) {
        const cloudX = Math.random() * cloudsCanvas.width;
        const cloudY = Math.random() * (cloudsCanvas.height * 0.6);
        const cloudWidth = Math.random() * 120 + 80;
        const cloudHeight = cloudWidth * 0.6;
        
        drawCloud(cloudsCtx, cloudX, cloudY, cloudWidth, cloudHeight);
    }
    
    layers.push(cloudsCanvas);
    
    return layers;
}

function createParallaxBackgroundNight() {
    const layers = [];
    
    // Layer 1: Sky with stars (furthest, slowest)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = GAME_WIDTH;
    skyCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const skyCtx = skyCanvas.getContext('2d');
    
    // Fill background with night sky gradient
    const gradient = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
    gradient.addColorStop(0, colors.night.sky[0]);
    gradient.addColorStop(1, colors.night.sky[1]);
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    
    // Add stars
    const starCount = Math.floor(GAME_WIDTH * GAME_HEIGHT / 800);
    for (let i = 0; i < starCount; i++) {
        const x = Math.random() * skyCanvas.width;
        const y = Math.random() * skyCanvas.height;
        const radius = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.7 + 0.3;
        
        skyCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        skyCtx.beginPath();
        skyCtx.arc(x, y, radius, 0, Math.PI * 2);
        skyCtx.fill();
    }
    
    // Add moon
    const moonSize = Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.1;
    const moonX = GAME_WIDTH * 0.8;
    const moonY = moonSize * 1.5;
    
    // Draw moon
    skyCtx.fillStyle = 'rgba(200, 200, 220, 0.9)';
    skyCtx.beginPath();
    skyCtx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
    skyCtx.fill();
    
    // Add moon craters
    skyCtx.fillStyle = 'rgba(150, 150, 170, 0.4)';
    for (let i = 0; i < 4; i++) {
        const craterSize = moonSize * (Math.random() * 0.2 + 0.1);
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * moonSize * 0.6;
        const craterX = moonX + Math.cos(angle) * distance;
        const craterY = moonY + Math.sin(angle) * distance;
        
        skyCtx.beginPath();
        skyCtx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
        skyCtx.fill();
    }
    
    layers.push(skyCanvas);
    
    // Layer 2: Distant mountains (far)
    const mountainsCanvas = document.createElement('canvas');
    mountainsCanvas.width = GAME_WIDTH * 1.5;
    mountainsCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const mountainsCtx = mountainsCanvas.getContext('2d');
    
    // Create distant mountains (darker for night)
    drawMountainRange(mountainsCtx, mountainsCanvas.width, mountainsCanvas.height, 
                     'rgba(40, 45, 60, 0.7)', 0.6, 3);
    
    layers.push(mountainsCanvas);
    
    // Layer 3: Hills (medium distance)
    const hillsCanvas = document.createElement('canvas');
    hillsCanvas.width = GAME_WIDTH * 1.2;
    hillsCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const hillsCtx = hillsCanvas.getContext('2d');
    
    // Create medium-distance hills (darker for night)
    drawMountainRange(hillsCtx, hillsCanvas.width, hillsCanvas.height, 
                     'rgba(30, 50, 40, 0.8)', 0.4, 5);
    
    layers.push(hillsCanvas);
    
    // Layer 4: Fog/Mist (closest, fastest)
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = GAME_WIDTH * 2;
    fogCanvas.height = GAME_HEIGHT - GROUND_HEIGHT;
    const fogCtx = fogCanvas.getContext('2d');
    
    // Add fog patches
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * fogCanvas.width;
        const y = fogCanvas.height - Math.random() * (fogCanvas.height * 0.4);
        const width = Math.random() * 300 + 100;
        const height = Math.random() * 60 + 20;
        
        const fogGradient = fogCtx.createRadialGradient(
            x + width/2, y + height/2, 0,
            x + width/2, y + height/2, width/2
        );
        fogGradient.addColorStop(0, 'rgba(200, 200, 255, 0.2)');
        fogGradient.addColorStop(1, 'rgba(200, 200, 255, 0)');
        
        fogCtx.fillStyle = fogGradient;
        fogCtx.fillRect(x, y, width, height);
    }
    
    layers.push(fogCanvas);
    
    return layers;
}

function drawMountainRange(ctx, width, height, color, heightFactor, count) {
    ctx.fillStyle = color;
    
    for (let i = 0; i < count; i++) {
        const mountainWidth = width / count;
        const startX = i * mountainWidth - (mountainWidth/2);
        const peakHeight = height * heightFactor * (0.7 + Math.random() * 0.3);
        
        ctx.beginPath();
        ctx.moveTo(startX, height);
        
        // Create jagged mountain shape
        let x = startX;
        while (x < startX + mountainWidth * 2) {
            const peakX = startX + mountainWidth;
            const distFromPeak = Math.abs(x - peakX) / mountainWidth;
            let y = height - peakHeight * (1 - distFromPeak * distFromPeak);
            
            // Add some randomness to the mountain shape
            y += (Math.random() - 0.5) * 20;
            
            ctx.lineTo(x, y);
            x += mountainWidth / 10;
        }
        
        ctx.lineTo(startX + mountainWidth * 2, height);
        ctx.closePath();
        ctx.fill();
    }
}

function drawCloud(ctx, x, y, width, height) {
    const numBubbles = 5;
    const bubbleSize = height;
    
    for (let i = 0; i < numBubbles; i++) {
        const bubbleX = x + (i * (width / numBubbles));
        const bubbleY = y + Math.sin(i * 0.8) * (height * 0.2);
        const size = bubbleSize * (0.5 + Math.random() * 0.5);
        
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createPixelArt(pixels, color, scale = 1) {
    const canvas = document.createElement('canvas');
    const width = pixels[0].length * scale;
    const height = pixels.length * scale;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    for (let y = 0; y < pixels.length; y++) {
        for (let x = 0; x < pixels[y].length; x++) {
            if (pixels[y][x]) {
                ctx.fillStyle = color;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }
    
    return canvas;
}

function createMultiColorPixelArt(pixelData, colorMap, scale = 1) {
    const canvas = document.createElement('canvas');
    const height = pixelData.length;
    const width = pixelData[0].length;
    
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const ctx = canvas.getContext('2d');
    
    // Draw pixels
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = pixelData[y][x];
            if (colorIndex > 0) { // If not transparent
                ctx.fillStyle = colorMap[colorIndex - 1]; // -1 because indices start at 1
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }
    
    return canvas;
}

function createObstacleWithOutline(pixels, fillColor, outlineColor, scale = 1) {
    const canvas = document.createElement('canvas');
    const width = pixels[0].length * scale;
    const height = pixels.length * scale;
    
    // Add extra space for outline
    canvas.width = width + scale * 2;
    canvas.height = height + scale * 2;
    
    const ctx = canvas.getContext('2d');
    
    // Define outline pixels to check (8 directions)
    const directions = [
        [-1, -1], [0, -1], [1, -1],
        [-1, 0],           [1, 0],
        [-1, 1],  [0, 1],  [1, 1]
    ];
    
    // First pass: Draw the outline
    for (let y = 0; y < pixels.length; y++) {
        for (let x = 0; x < pixels[y].length; x++) {
            if (pixels[y][x]) {
                // For each filled pixel, draw outline in all 8 directions
                for (const [dx, dy] of directions) {
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    // Check if position is outside the pixel array or is an empty pixel
                    if (newX < 0 || newY < 0 || 
                        newX >= pixels[0].length || 
                        newY >= pixels.length || 
                        !pixels[newY][newX]) {
                        
                        ctx.fillStyle = outlineColor;
                        ctx.fillRect(
                            (x + dx) * scale + scale, 
                            (y + dy) * scale + scale, 
                            scale, scale
                        );
                    }
                }
            }
        }
    }
    
    // Second pass: Draw the actual pixels on top of the outline
    for (let y = 0; y < pixels.length; y++) {
        for (let x = 0; x < pixels[y].length; x++) {
            if (pixels[y][x]) {
                ctx.fillStyle = fillColor;
                ctx.fillRect(
                    x * scale + scale, 
                    y * scale + scale, 
                    scale, scale
                );
            }
        }
    }
    
    return canvas;
}

function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Simple direct event attachment instead of cloning
    if (startButton) {
        // Remove any existing listeners to prevent duplicates
        startButton.removeEventListener('click', startGame);
        
        // Add the event listener directly
        startButton.addEventListener('click', function(e) {
            console.log('Start button clicked');
            e.preventDefault();
            startGame();
        });
        console.log('Start button event listener attached');
    } else {
        console.warn("Start button element not found");
    }
    
    // Create and add share button to start screen
    addShareButtonToStartScreen();
    
    if (restartButton) {
        // Remove any existing listeners to prevent duplicates
        restartButton.removeEventListener('click', restartGame);
        
        // Add event listener directly
        restartButton.addEventListener('click', function(e) {
            console.log('Restart button clicked');
            e.preventDefault();
            restartGame();
        });
        console.log('Restart button event listener attached');
    } else {
        console.warn("Restart button element not found");
    }
    
    // Sound toggle button
    if (soundToggleBtn) {
        soundToggleBtn.removeEventListener('click', toggleSound);
        soundToggleBtn.addEventListener('click', toggleSound);
    }
    
    // Day/Night mode buttons
    if (dayModeBtn) {
        dayModeBtn.addEventListener('click', function() {
            toggleDayNightMode(true);
        });
    }
    
    if (nightModeBtn) {
        nightModeBtn.addEventListener('click', function() {
            toggleDayNightMode(false);
        });
    }
    
    // Keyboard events
    window.addEventListener('keydown', function(e) {
        if ((e.code === 'Space' || e.key === ' ') && gameState.running) {
            if (!gameState.dimbadimba.jumping) {
                jump();
                e.preventDefault();
            }
        } else if (e.key === 'p' || e.key === 'P') {
            togglePause();
        } else if (e.key === 'm' || e.key === 'M') {
            toggleSound();
        }
    });
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();

        if (!gameState.running && !gameState.paused) {
            if (gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
                restartGame();
            } else {
                startGame();
            }
        } else if (gameState.running && !gameState.dimbadimba.jumping) {
            jump();
        }
    });
    
    // Window resize event
    window.addEventListener('resize', function() {
        updateCanvasSize();
        // Redraw the game to reflect new dimensions
        drawGame();
    });
    
    // Add event listeners for the difficulty buttons
    if (easyModeBtn) {
        easyModeBtn.addEventListener('click', function() {
            gameState.difficulty = 'easy';
            updateDifficultyButtons();
            localStorage.setItem('pixelRunnerDifficulty', gameState.difficulty);
        });
    }
    
    if (normalModeBtn) {
        normalModeBtn.addEventListener('click', function() {
            gameState.difficulty = 'normal';
            updateDifficultyButtons();
            localStorage.setItem('pixelRunnerDifficulty', gameState.difficulty);
        });
    }
    
    if (hardModeBtn) {
        hardModeBtn.addEventListener('click', function() {
            gameState.difficulty = 'hard';
            updateDifficultyButtons();
            localStorage.setItem('pixelRunnerDifficulty', gameState.difficulty);
        });
    }
}

// Function to add share button to start screen
function addShareButtonToStartScreen() {
    // Remove any existing share button first
    const existingButton = document.getElementById('start-screen-share-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Create the share button with proper HTML structure
    const shareButton = document.createElement('button');
    shareButton.id = 'start-screen-share-button';
    
    // Create SVG icon element
    const iconSpan = document.createElement('span');
    iconSpan.className = 'share-icon';
    
    // Create text element
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Share';
    
    // Add icon and text to button
    shareButton.appendChild(iconSpan);
    shareButton.appendChild(textSpan);
    
    // Apply modern pill button styling (now for inline use in the header)
    shareButton.style.padding = '6px 14px';
    shareButton.style.borderRadius = '50px';
    shareButton.style.background = '#222';
    shareButton.style.color = 'white';
    shareButton.style.fontWeight = '600';
    shareButton.style.fontSize = '14px';
    shareButton.style.display = 'flex';
    shareButton.style.alignItems = 'center';
    shareButton.style.gap = '8px';
    shareButton.style.border = 'none';
    shareButton.style.cursor = 'pointer';
    shareButton.style.marginLeft = '12px';
    shareButton.style.transition = 'transform 0.2s, background 0.2s';
    shareButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    // Add share icon styling
    iconSpan.style.width = '16px';
    iconSpan.style.height = '16px';
    iconSpan.style.display = 'block';
    iconSpan.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg>')`;
    iconSpan.style.backgroundRepeat = 'no-repeat';
    iconSpan.style.backgroundPosition = 'center';
    iconSpan.style.backgroundSize = 'contain';
    
    // Hover effects
    shareButton.onmouseover = function() {
        this.style.transform = 'scale(1.05)';
        this.style.background = '#000';
    };
    shareButton.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.background = '#222';
    };
    
    // Add click event
    shareButton.addEventListener('click', function() {
        // Use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Dimbadimba Pixel Runner',
                text: '🎮 Check out Dimbadimba Pixel Runner - a fun endless runner game!',
                url: window.location.href.split('?')[0],
            }).catch(err => {
                console.error('Error sharing:', err);
                // Fall back to custom share dialog if Web Share API fails
                openShareDialog();
            });
        } else {
            // Use custom share dialog for browsers without Web Share API
            openShareDialog();
        }
    });
    
    // Find the game title in the header and add the share button next to it
    const gameTitle = document.querySelector('.game-title') || document.querySelector('h1');
    
    if (gameTitle) {
        // Insert after the game title
        gameTitle.insertAdjacentElement('afterend', shareButton);
    } else {
        // Fallback: Look for game header
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            // Append to header with styling for right alignment
            shareButton.style.marginLeft = 'auto';
            gameHeader.appendChild(shareButton);
        } else {
            // Final fallback: Add to start screen with absolute positioning
            shareButton.style.position = 'absolute';
            shareButton.style.top = '15px';
            shareButton.style.right = '60px';
            shareButton.style.zIndex = '9998';
            document.body.appendChild(shareButton);
        }
    }
}

// Function to open a share dialog with options
function openShareDialog() {
    // Create a modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    overlay.innerHTML = `
        <div class="share-dialog">
            <h3>Share Dimbadimba</h3>
            <div class="share-options">
                <button class="share-option x-share">
                    <span class="share-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </span>
                    <span>X</span>
                </button>
                <button class="share-option facebook-share">
                    <span class="share-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </span>
                    <span>Facebook</span>
                </button>
                <button class="share-option whatsapp-share">
                    <span class="share-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.693 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </span>
                    <span>WhatsApp</span>
                </button>
                <button class="share-option copy-link">
                    <span class="share-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
                            <path d="M11 17H7c-2.76 0-5-2.24-5-5s2.24-5 5-5h4v2H7c-1.65 0-3 1.35-3 3s1.35 3 3 3h4v2zm2-2h4c1.65 0 3-1.35 3-3s-1.35-3-3-3h-4V7h4c2.76 0 5 2.24 5 5s-2.24 5-5 5h-4v-2zm-8-4h16v2H5v-2z"/>
                        </svg>
                    </span>
                    <span>Copy Link</span>
                </button>
            </div>
            <button class="close-dialog">Close</button>
        </div>
    `;
    
    // Add styles for the dialog
    const dialogStyles = document.createElement('style');
    dialogStyles.textContent = `
        .share-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        }
        
        .share-dialog {
            background-color: #2c3e50;
            border-radius: 16px;
            padding: 24px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        
        .share-dialog h3 {
            color: white;
            margin-top: 0;
            margin-bottom: 25px;
            font-size: 24px;
        }
        
        .share-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .share-option {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #34495e;
            border: 3px solid rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            padding: 18px;
            color: white;
            cursor: pointer;
            transition: transform 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .share-option:hover {
            transform: translateY(-4px);
            background-color: #2c3e50;
            border-color: rgba(255, 255, 255, 0.5);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        
        .share-option .share-icon {
            width: 32px;
            height: 32px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .share-option .share-icon svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        }
        
        .close-dialog {
            background-color: #e74c3c;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        
        .close-dialog:hover {
            background-color: #c0392b;
        }
        
        .x-share { 
            background-color: #000000; 
            border-color: rgba(255, 255, 255, 0.4);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 5px rgba(255, 255, 255, 0.15);
        }
        
        .x-share:hover {
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(255, 255, 255, 0.25);
        }
        
        .facebook-share { background-color: #4267B2; }
        .whatsapp-share { background-color: #25D366; }
        .copy-link { background-color: #2980b9; }
        
        @media (max-width: 480px) {
            .share-dialog {
                padding: 20px;
                width: 95%;
            }
            
            .share-options {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .share-option {
                flex-direction: row;
                justify-content: flex-start;
                padding: 14px;
                text-align: left;
            }
            
            .share-option .share-icon {
                margin-bottom: 0;
                margin-right: 12px;
            }
            
            .share-option span:not(.share-icon) {
                font-size: 18px;
                flex-grow: 1;
                text-align: center;
                margin-right: 32px;
            }
        }
    `;
    document.head.appendChild(dialogStyles);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Add event listeners
    overlay.querySelector('.x-share').addEventListener('click', () => {
        shareOnX(gameState.score);
        overlay.remove();
    });
    
    overlay.querySelector('.facebook-share').addEventListener('click', () => {
        shareOnFacebook(gameState.score);
        overlay.remove();
    });
    
    overlay.querySelector('.whatsapp-share').addEventListener('click', () => {
        shareOnWhatsApp(gameState.score);
        overlay.remove();
    });
    
    overlay.querySelector('.copy-link').addEventListener('click', () => {
        copyShareLink(gameState.score);
        overlay.remove();
    });
    
    overlay.querySelector('.close-dialog').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Close when clicking outside the dialog
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function updateDifficultyButtons() {
    // Check if the buttons exist before trying to update them
    if (!easyModeBtn || !normalModeBtn || !hardModeBtn) {
        console.warn("Difficulty buttons not found");
        return;
    }
    
    // Remove 'selected' class from all buttons
    easyModeBtn.classList.remove('selected');
    normalModeBtn.classList.remove('selected');
    hardModeBtn.classList.remove('selected');
    
    // Add 'selected' class to the appropriate button based on current difficulty
    switch(gameState.difficulty) {
        case 'easy':
            easyModeBtn.classList.add('selected');
            if (difficultyDisplayElement) difficultyDisplayElement.textContent = "Easy";
            break;
        case 'normal':
            normalModeBtn.classList.add('selected');
            if (difficultyDisplayElement) difficultyDisplayElement.textContent = "Normal";
            break;
        case 'hard':
            hardModeBtn.classList.add('selected');
            if (difficultyDisplayElement) difficultyDisplayElement.textContent = "Hard";
            break;
        default:
            // Default to normal if unknown difficulty
            normalModeBtn.classList.add('selected');
            if (difficultyDisplayElement) difficultyDisplayElement.textContent = "Normal";
            // Update game state to match
            gameState.difficulty = 'normal';
            break;
    }
}

// Fix the startGame function to correctly show character on start screen
function startGame() {
    console.log('startGame function called');
    
    // Initialize audio on game start, but don't block if it fails
    try {
        if (gameState.soundEnabled && !sounds.audioCtx) {
            initializeAudio();
        }
    } catch (e) {
        console.error("Error initializing audio:", e);
        // Continue with game even if audio fails
        gameState.soundEnabled = false;
        updateSoundToggleButton();
    }
    
    // Apply difficulty settings first - moved up to ensure it's applied before game starts
    try {
        applyDifficultySettings();
    } catch (e) {
        console.error("Error applying difficulty settings:", e);
        // Fall back to normal difficulty if there's an error
        gameState.difficulty = 'normal';
        // Apply default values manually if needed
        gameState.speed = INITIAL_SPEED;
        gameState.obstacleInterval = 1500;
        gameState.coinInterval = 2500;
        gameState.gravity = GRAVITY;
        gameState.jumpForce = JUMP_FORCE;
        gameState.powerupSpawnChance = POWERUP_SPAWN_CHANCE;
    }
    
    resetGame();
    gameState.running = true;
    
    if (startScreen) {
        startScreen.classList.add('hidden');
    }
    
    // Play background music if enabled and audio is available
    if (gameState.soundEnabled && sounds.audioCtx) {
        try {
            sounds.backgroundMusic.play();
        } catch (e) {
            console.error("Error playing background music:", e);
        }
    }
    
    // Cancel any existing animation frame before starting a new one
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Ensure animation loop starts correctly
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animationLoop);
    
    console.log('Game started successfully');
}

function restartGame() {
    // Initialize audio on game restart if needed
    if (gameState.soundEnabled && !sounds.audioCtx) {
        initializeAudio();
    }
    
    // Apply difficulty settings first - similar to startGame
    try {
        applyDifficultySettings();
    } catch (e) {
        console.error("Error applying difficulty settings on restart:", e);
        // Fall back to normal difficulty if there's an error
        gameState.difficulty = 'normal';
        // Apply default values manually if needed
        gameState.speed = INITIAL_SPEED;
        gameState.obstacleInterval = 1500;
        gameState.coinInterval = 2500;
        gameState.gravity = GRAVITY;
        gameState.jumpForce = JUMP_FORCE;
        gameState.powerupSpawnChance = POWERUP_SPAWN_CHANCE;
    }
    
    resetGame();
    gameState.running = true;
    gameOverScreen.classList.add('hidden');
    
    // Play background music if enabled
    if (gameState.soundEnabled) {
        sounds.backgroundMusic.play();
    }
    
    // Cancel any existing animation frame before starting a new one
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Ensure animation loop starts correctly with proper timing
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animationLoop);
}

function resetGame() {
    gameState.dimbadimba.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
    gameState.dimbadimba.velocityY = 0;
    gameState.dimbadimba.jumping = false;
    gameState.dimbadimba.armRotation = 0;
    gameState.dimbadimba.isArmRotating = false;
    gameState.dimbadimba.armRotationCycles = 0;
    
    // Store current difficulty settings before resetting
    const currentDifficulty = gameState.difficulty;
    
    // Reset to initial values based on difficulty (will be properly set by applyDifficultySettings)
    gameState.speed = INITIAL_SPEED;
    gameState.obstacles = [];
    gameState.coins = [];
    gameState.powerups = [];
    gameState.pointIndicators = []; // Clear any point indicators
    gameState.particles = []; // Clear dust/effect particles
    gameState.activePowerups = {};
    gameState.timeSinceLastObstacle = 0;
    gameState.timeSinceLastCoin = 0;
    gameState.timeSinceLastPowerup = 0;
    gameState.firstObstacleSpawned = false; // Reset first obstacle flag
    gameState.scoreMultiplier = 1;
    gameState.paused = false; // Make sure the game isn't paused
    
    // Reset combo system
    gameState.combo = {
        count: 0,
        multiplier: 1,
        timer: null,
        maxCombo: 0,
        lastActionTime: 0
    };
    gameState.nearMissCount = 0;
    gameState.checkedObstacleIds = new Set(); // Clear near-miss tracking
    obstacleIdCounter = 0; // Reset obstacle ID counter
    
    // Reset score to 0
    gameState.score = 0;
    
    // Clear power-up indicator
    if (powerupIndicator) {
        powerupIndicator.innerHTML = '';
    }
    
    // Stop background music when resetting
    sounds.backgroundMusic.stop();
    
    updateScore();
    
    // Reset to difficulty settings
    applyDifficultySettings();
    
    gameState.lives = INITIAL_LIVES;
    gameState.isInvincible = false;
    gameState.invincibilityTimer = 0;
    updateLivesDisplay();
}

// Add a pause toggle cooldown to prevent rapid toggling
let pauseToggleCooldown = false;

function togglePause() {
    // Prevent rapid toggling that can cause timing/animation issues
    if (pauseToggleCooldown) return;
    
    // Set a short cooldown (150ms) to prevent multiple rapid toggles
    pauseToggleCooldown = true;
    setTimeout(() => { pauseToggleCooldown = false; }, 150);
    
    gameState.paused = !gameState.paused;
    
    // Handle music when pausing/unpausing
    if (gameState.paused) {
        sounds.backgroundMusic.stop();
    } else if (gameState.soundEnabled) {
        sounds.backgroundMusic.play();
        
        // Reset lastTime when unpausing to prevent huge deltaTime on first frame
        lastTime = performance.now();
    }
}

function jump() {
    if (!gameState.dimbadimba.jumping) {
        gameState.dimbadimba.velocityY = gameState.jumpForce;
        gameState.dimbadimba.jumping = true;
        playSound('jump');
        
        // Create jump dust particles
        createJumpDustParticles();
        
        // Start arm rotation animation on jump
        gameState.dimbadimba.isArmRotating = true;
        gameState.dimbadimba.armRotation = 0;
        gameState.dimbadimba.armRotationCycles = 0;
    }
}

function updatePlayer(deltaTime) {
    // Track if player was in air before update
    const wasJumping = gameState.dimbadimba.jumping;
    
    // Apply gravity
    gameState.dimbadimba.velocityY += gameState.gravity;
    gameState.dimbadimba.y += gameState.dimbadimba.velocityY;
    
    // Ground collision
    const groundY = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
    if (gameState.dimbadimba.y >= groundY) {
        gameState.dimbadimba.y = groundY;
        gameState.dimbadimba.velocityY = 0;
        gameState.dimbadimba.jumping = false;
        
        // Create landing dust particles if just landed
        if (wasJumping) {
            createLandingDustParticles();
        }
    }
    
    // Update arm rotation animation if active
    if (gameState.dimbadimba.isArmRotating) {
        // Increase rotation angle
        gameState.dimbadimba.armRotation += gameState.dimbadimba.armRotationSpeed;
        
        // Check if a full rotation is completed (2π radians)
        if (gameState.dimbadimba.armRotation >= 2 * Math.PI) {
            // Reset rotation angle but count the cycle
            gameState.dimbadimba.armRotation = 0;
            gameState.dimbadimba.armRotationCycles++;
            
            // Stop after the specified number of cycles
            if (gameState.dimbadimba.armRotationCycles >= gameState.dimbadimba.maxArmRotationCycles) {
                gameState.dimbadimba.isArmRotating = false;
                gameState.dimbadimba.armRotationCycles = 0;
                gameState.dimbadimba.armRotation = 0;
            }
        }
    }
}

function updateObstacles(deltaTime) {
    // Generate new obstacle
    gameState.timeSinceLastObstacle += deltaTime;
    
    // If it's the first obstacle, spawn it earlier and at a fixed position
    if (!gameState.firstObstacleSpawned && gameState.timeSinceLastObstacle > 800) {
        spawnObstacle();
        gameState.firstObstacleSpawned = true;
        gameState.obstacleInterval = Math.random() * 1500 + 1000 / (gameState.speed * 0.2);
    } 
    // Regular obstacle spawning for subsequent obstacles
    else if (gameState.firstObstacleSpawned && gameState.timeSinceLastObstacle > gameState.obstacleInterval) {
        spawnObstacle();
        gameState.obstacleInterval = Math.random() * 1500 + 1000 / (gameState.speed * 0.2);
    }
    
    // Update obstacle positions
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        gameState.obstacles[i].x -= getCurrentGameSpeed();
        
        // Remove obstacles that are off screen
        if (gameState.obstacles[i].x < -OBSTACLE_WIDTH * 1.5) {
            gameState.obstacles.splice(i, 1);
            // Award points for passing an obstacle
            gameState.score += 10 * gameState.scoreMultiplier;
            updateScore();
            
            // Chance to spawn a power-up when obstacle is passed
            if (Math.random() < POWERUP_SPAWN_CHANCE && gameState.timeSinceLastPowerup > gameState.powerupInterval) {
                spawnPowerup();
            }
        }
    }
}

// Helper function to spawn an obstacle
function spawnObstacle() {
    gameState.timeSinceLastObstacle = 0;
    
    // Randomize obstacle shape
    const shapeIndex = Math.floor(Math.random() * sprites.obstacles.length);
    
    // Vary the height based on shape (some shapes look better shorter or taller)
    const baseHeight = OBSTACLE_MIN_HEIGHT + Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
    
    // Adjust dimensions based on shape index
    let width = OBSTACLE_WIDTH;
    let height = baseHeight;
    
    // Adjust dimensions for different shapes
    if (shapeIndex === 1) { // Rock - wider, shorter
        width = OBSTACLE_WIDTH * 1.2;
        height = baseHeight * 0.8;
    } else if (shapeIndex === 2) { // Spiky - shorter
        height = baseHeight * 0.7;
    } else if (shapeIndex === 3) { // Log - longer
        width = OBSTACLE_WIDTH * 0.8;
        height = baseHeight * 1.4;
    }
    
    gameState.obstacles.push({
        id: ++obstacleIdCounter, // Unique ID for tracking
        x: GAME_WIDTH,
        y: GAME_HEIGHT - GROUND_HEIGHT - height,
        width: width,
        height: height,
        shapeIndex: shapeIndex
    });
}

// Function to get current game speed (considering power-ups)
function getCurrentGameSpeed() {
    return gameState.speed * (gameState.activePowerups[POWERUP_TYPES.SPEED] ? gameState.speedBoostMultiplier : 1);
}

function updateCoins(deltaTime) {
    // Generate new coin
    gameState.timeSinceLastCoin += deltaTime;
    if (gameState.timeSinceLastCoin > gameState.coinInterval) {
        gameState.timeSinceLastCoin = 0;
        gameState.coinInterval = Math.random() * 2000 + 1500;
        
        const y = Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - COIN_SIZE - 20) + 20;
        gameState.coins.push({
            x: GAME_WIDTH,
            y: y,
            width: COIN_SIZE,
            height: COIN_SIZE,
            rotation: 0,
            magnetized: false // Track if being pulled by magnet
        });
    }
    
    // Update coin positions and animation
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
        const coin = gameState.coins[i];
        
        // Check if magnet power-up is active
        if (gameState.activePowerups[POWERUP_TYPES.MAGNET] && !coin.magnetized) {
            const distX = gameState.dimbadimba.x + gameState.dimbadimba.width/2 - (coin.x + coin.width/2);
            const distY = gameState.dimbadimba.y + gameState.dimbadimba.height/2 - (coin.y + coin.height/2);
            const dist = Math.sqrt(distX * distX + distY * distY);
            
            // If coin is within magnet range, pull it towards player
            if (dist < gameState.magnetRange) {
                coin.magnetized = true;
            }
        }
        
        if (coin.magnetized) {
            // Move coin towards player
            const targetX = gameState.dimbadimba.x + gameState.dimbadimba.width/2 - coin.width/2;
            const targetY = gameState.dimbadimba.y + gameState.dimbadimba.height/2 - coin.height/2;
            
            const dx = targetX - coin.x;
            const dy = targetY - coin.y;
            const speed = 8; // Speed of magnetized coins
            
            coin.x += dx * 0.1 * speed;
            coin.y += dy * 0.1 * speed;
        } else {
            // Normal coin movement
            coin.x -= getCurrentGameSpeed();
        }
        
        coin.rotation += 0.05;
        
        // Remove coins that are off screen
        if (coin.x < -COIN_SIZE) {
            gameState.coins.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Skip collision if player is invincible
    if (gameState.isInvincible) return;
    
    // Check for collisions with obstacles
    for (let i = 0; i < gameState.obstacles.length; i++) {
        const obstacle = gameState.obstacles[i];
        
        // Adjust hitbox to be more forgiving
        const adjustedPlayerHitbox = {
            x: gameState.dimbadimba.x + 10,
            y: gameState.dimbadimba.y + 5,
            width: gameState.dimbadimba.width - 20,
            height: gameState.dimbadimba.height - 10
        };
        
        if (detectCollision(adjustedPlayerHitbox, obstacle)) {
            // If shield is active, use it instead of losing a life
            if (gameState.activePowerups[POWERUP_TYPES.SHIELD]) {
                // Play a shield hit sound
                sounds.powerup();
                
                // Remove obstacle
                gameState.obstacles.splice(i, 1);
                
                // Deactivate shield
                deactivatePowerup(POWERUP_TYPES.SHIELD);
                
                // Add points for shield save
                gameState.score += 25 * gameState.scoreMultiplier;
                updateScore();
                
                return;
            }
            
            // Handle normal collision (lose a life)
            handleCollision();
            break;
        }
    }
    
    // Rest of collision checks for coins and powerups (unchanged)
    checkCoinCollisions();
    checkPowerupCollisions();
}

// Fix drawing function for proper invincibility effect
function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw sky background
    drawBackground();
    
    // Draw ground
    drawGround();
    
    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
        ctx.drawImage(
            sprites.obstacles[obstacle.shapeIndex] || sprites.obstacle,
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    });
    
    // Draw coins
    gameState.coins.forEach(coin => {
        ctx.drawImage(
            sprites.coin,
            coin.x,
            coin.y,
            coin.width,
            coin.height
        );
    });
    
    // Draw power-ups
    for (let i = 0; i < gameState.powerups.length; i++) {
        const powerup = gameState.powerups[i];
        const sprite = sprites.powerups[powerup.type];
        
        if (sprite) {
            ctx.save();
            // Calculate rotation center
            const centerX = powerup.x + powerup.width / 2;
            const centerY = powerup.y + powerup.height / 2;
            
            // Translate, rotate, and draw
            ctx.translate(centerX, centerY);
            ctx.rotate(powerup.rotation);
            ctx.drawImage(
                sprite,
                -powerup.width / 2,
                -powerup.height / 2,
                powerup.width,
                powerup.height
            );
            ctx.restore();
        }
    }
    
    // Draw player (dimbadimba)
    ctx.save();
    
    // Add flashing effect when invincible
    if (gameState.isInvincible) {
        // Make character flash by changing opacity
        ctx.globalAlpha = 0.5 + Math.sin(gameState.invincibilityTimer / 100) * 0.5;
    }
    
    // Draw shield effect if active
    if (gameState.activePowerups[POWERUP_TYPES.SHIELD]) {
        ctx.beginPath();
        ctx.arc(
            gameState.dimbadimba.x + gameState.dimbadimba.width / 2,
            gameState.dimbadimba.y + gameState.dimbadimba.height / 2,
            Math.max(gameState.dimbadimba.width, gameState.dimbadimba.height) * 0.6,
            0, Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.7)';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = '#3498db';
        ctx.shadowBlur = 15;
    }
    
    // Draw player with rotating arms or normal sprite
    if (gameState.dimbadimba.isArmRotating) {
        // Create and draw a sprite with rotated arms
        const rotatedArmSprite = createRotatingArmSprite(gameState.dimbadimba.armRotation);
        
        // Check if we're using the custom image (which is larger than the player hitbox)
        if (sprites.playerOriginal) {
            // Calculate offset to center the larger sprite on the player's hitbox
            const offsetX = (rotatedArmSprite.width - gameState.dimbadimba.width) / 2;
            const offsetY = (rotatedArmSprite.height - gameState.dimbadimba.height) / 2;
            
            ctx.drawImage(
                rotatedArmSprite,
                gameState.dimbadimba.x - offsetX,
                gameState.dimbadimba.y - offsetY,
                rotatedArmSprite.width,
                rotatedArmSprite.height
            );
        } else {
            // Regular sized pixel art sprite
            ctx.drawImage(
                rotatedArmSprite,
                gameState.dimbadimba.x,
                gameState.dimbadimba.y,
                gameState.dimbadimba.width,
                gameState.dimbadimba.height
            );
        }
    } else {
        // Draw normal player sprite
        if (sprites.playerOriginal) {
            // Calculate offset to center the larger sprite on the player's hitbox
            // Increased offset to account for larger character size
            const offsetX = (sprites.player.width - gameState.dimbadimba.width) / 2;
            const offsetY = (sprites.player.height - gameState.dimbadimba.height) / 2;
            
            // Draw with the calculated offset
            ctx.drawImage(
                sprites.player,
                gameState.dimbadimba.x - offsetX,
                gameState.dimbadimba.y - offsetY,
                sprites.player.width,
                sprites.player.height
            );
        } else {
            // Regular sized pixel art sprite
            ctx.drawImage(
                sprites.player,
                gameState.dimbadimba.x,
                gameState.dimbadimba.y,
                gameState.dimbadimba.width,
                gameState.dimbadimba.height
            );
        }
    }
    ctx.restore();
    
    // Draw smoke particles (draw after player so smoke appears above)
    gameState.smokeParticles.forEach(particle => {
        particle.draw(ctx);
    });
    
    // Draw magnet range indicator if active
    if (gameState.activePowerups[POWERUP_TYPES.MAGNET]) {
        ctx.beginPath();
        ctx.arc(
            gameState.dimbadimba.x + gameState.dimbadimba.width / 2,
            gameState.dimbadimba.y + gameState.dimbadimba.height / 2,
            gameState.magnetRange,
            0, Math.PI * 2
        );
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Draw speed effect if active
    if (gameState.activePowerups[POWERUP_TYPES.SPEED]) {
        // Draw speed lines behind player
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const lineX = gameState.dimbadimba.x - 5 - i * 8;
            const lineHeight = gameState.dimbadimba.height * (0.7 + Math.random() * 0.3);
            const lineY = gameState.dimbadimba.y + (gameState.dimbadimba.height - lineHeight) / 2;
            
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX, lineY + lineHeight);
        }
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // Draw score multiplier if active
    if (gameState.activePowerups[POWERUP_TYPES.DOUBLE_SCORE]) {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#f1c40f';
        ctx.textAlign = 'center';
        ctx.fillText(
            'x2',
            gameState.dimbadimba.x + gameState.dimbadimba.width / 2,
            gameState.dimbadimba.y - 10
        );
    }
    
    // Draw point indicators
    drawPointIndicators();
    
    // Draw particles (dust effects, etc.)
    drawParticles();
    
    // Draw combo counter
    drawComboCounter();
    
    // Draw "paused" text if game is paused
    if (gameState.paused && gameState.running) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.font = '36px PixelFont, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '20px PixelFont, Arial';
        ctx.fillText('Press P to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
}

let lastTime = 0;
let animationFrameId = null; // Track the animation frame ID
let gameTime = 0; // Track total game time for animations

function animationLoop(timestamp = 0) {
    // Safety check for game state
    if (!gameState || !gameState.running) {
        animationFrameId = null; // Reset the animation frame ID
        return;
    }
    
    // Continue the animation loop
    animationFrameId = requestAnimationFrame(animationLoop);
    
    if (gameState.paused) {
        drawGame(); // Keep drawing the paused state
        return;
    }
    
    // Ensure valid deltaTime (prevent huge jumps if tab was inactive)
    // If lastTime is 0 (first frame or after unpause), use a small default delta
    const deltaTime = (lastTime === 0) ? 16 : Math.min(timestamp - lastTime, 100);
    lastTime = timestamp;
    gameTime += deltaTime; // Track total game time
    
    try {
        // Update game elements
        updatePlayer(deltaTime);
        updateObstacles(deltaTime);
        updateCoins(deltaTime);
        updatePowerups(deltaTime);
        updateSmoke(deltaTime); // Update smoke particles
        updateParticles(deltaTime); // Update dust/effect particles
        updatePointIndicators(deltaTime); // Update point indicators
        updateCombo(performance.now()); // Update combo system timing
        updateBackground();
        checkCollisions();
        
        // Check for near-misses on obstacles
        gameState.obstacles.forEach(obstacle => {
            checkNearMiss(obstacle);
        });
        
        // Increase game speed over time
        gameState.speed += SPEED_INCREMENT * deltaTime;
        
        // Update invincibility status
        if (gameState.isInvincible) {
            gameState.invincibilityTimer += deltaTime;
            if (gameState.invincibilityTimer >= INVINCIBILITY_TIME) {
                gameState.isInvincible = false;
                gameState.invincibilityTimer = 0;
            }
        }
        
        // Draw everything
        drawGame();
    } catch (e) {
        console.error("Error in game loop:", e);
    }
}

// Setup improved touch events for mobile
function setupTouchControls() {
    // Handle touch events for game canvas (jumping)
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();

        if (!gameState.running && !gameState.paused) {
            if (gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
                restartGame();
            } else {
                startGame();
            }
        } else if (gameState.running && !gameState.dimbadimba.jumping) {
            jump();
        }
    });

    // Add touch controls for pause and sound toggle
    const touchControls = document.createElement('div');
    touchControls.className = 'mobile-controls';
    touchControls.innerHTML = `
        <button id="pauseTouchBtn" aria-label="Pause">⏸️</button>
        <button id="soundTouchBtn" aria-label="Toggle Sound">${gameState.soundEnabled ? '🔊' : '🔇'}</button>
    `;
    document.querySelector('.game-container').appendChild(touchControls);

    // Add event listeners for mobile control buttons
    document.getElementById('pauseTouchBtn').addEventListener('touchstart', function(e) {
        e.preventDefault();
        togglePause();
    });

    document.getElementById('soundTouchBtn').addEventListener('touchstart', function(e) {
        e.preventDefault();
        toggleSound();
        this.textContent = gameState.soundEnabled ? '🔊' : '🔇';
    });
}

// Create and manage orientation message
function createOrientationMessage() {
    // Check if we already have an orientation message
    let message = document.getElementById('orientation-message');
    
    if (!message) {
        message = document.createElement('div');
        message.id = 'orientation-message';
        message.classList.add('hidden');
        
        const content = document.createElement('div');
        content.className = 'orientation-content';
        
        const icon = document.createElement('div');
        icon.className = 'rotate-icon';
        icon.innerHTML = '📱';
        
        const text = document.createElement('p');
        text.textContent = 'For the best experience, please rotate your device to landscape mode.';
        
        const dismissBtn = document.createElement('button');
        dismissBtn.id = 'dismiss-orientation';
        dismissBtn.textContent = 'Continue in Portrait';
        
        // Store dismissal in localStorage
        dismissBtn.addEventListener('click', () => {
            message.classList.add('hidden');
            localStorage.setItem('orientationDismissed', 'true');
        });
        
        content.appendChild(icon);
        content.appendChild(text);
        content.appendChild(dismissBtn);
        message.appendChild(content);
        
        document.querySelector('.game-container').appendChild(message);
    }
    
    return message;
}

// Handle device orientation changes
function handleDeviceOrientation() {
    const orientationMessage = document.getElementById('orientation-message');
    if (!orientationMessage) return;
    
    // If the user has dismissed the message, don't show it again
    if (localStorage.getItem('orientationDismissed') === 'true') {
        orientationMessage.classList.add('hidden');
        return;
    }
    
    const isPortrait = window.innerWidth < window.innerHeight;
    
    if (isPortrait) {
        // Portrait mode - show message
        orientationMessage.classList.remove('hidden');
    } else {
        // Landscape mode - hide message
        orientationMessage.classList.add('hidden');
    }
}

function adjustGameHeight() {
    // Get the actual visible viewport height
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const gameContainer = document.querySelector('.game-container');
    const gameHeader = document.querySelector('.game-header');
    
    if (gameContainer && gameHeader) {
        // Set the game container height to account for browser UI
        gameContainer.style.height = `${vh}px`;
        
        // Adjust canvas to fit within container minus header height
        const headerHeight = gameHeader.offsetHeight;
        const canvas = document.getElementById('gameCanvas');
        
        if (canvas) {
            // Account for any safe areas on notched phones
            const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
            const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
            
            const totalSafeAreaHeight = safeAreaTop + safeAreaBottom;
            const adjustedHeight = Math.max(vh - headerHeight - totalSafeAreaHeight, vh * 0.7); // Ensure minimum height
            
            canvas.style.height = `${adjustedHeight}px`;
            
            // Set CSS variables for safe areas that can be used in CSS
            document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
            document.documentElement.style.setProperty('--game-canvas-height', `${adjustedHeight}px`);
        }
        
        // Adjust mobile controls position for different devices
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            const isLandscape = window.innerWidth > window.innerHeight;
            
            // In landscape mode on short screens, move controls to the right side
            if (isLandscape && vh < 500) {
                mobileControls.style.left = 'auto';
                mobileControls.style.right = '20px';
                mobileControls.style.bottom = '10px';
            } else {
                // Reset to default position
                mobileControls.style.left = '20px';
                mobileControls.style.right = 'auto';
                mobileControls.style.bottom = '20px';
            }
        }
    }
}

// Add fullscreen detection and handling
function isFullscreenAvailable() {
    return document.fullscreenEnabled || 
           document.webkitFullscreenEnabled || 
           document.mozFullScreenEnabled ||
           document.msFullscreenEnabled;
}

function isInFullscreen() {
    return !!(document.fullscreenElement || 
              document.mozFullScreenElement ||
              document.webkitFullscreenElement || 
              document.msFullscreenElement);
}

// Handle device-specific behaviors
function handleMobileSpecificBehaviors() {
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // iOS-specific behaviors
        document.body.addEventListener('touchend', function() {
            // This trick helps with audio playback on iOS
            if (gameState && gameState.music && gameState.music.context && 
                gameState.music.context.state !== 'running') {
                gameState.music.context.resume();
            }
        }, false);
        
        // Add a touch handler for the entire screen to ensure audio can start
        document.body.addEventListener('touchstart', function() {
            // This ensures the iOS device knows the page is interactive
        }, false);
    }
    
    // Add to home screen prompt for mobile
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Show "Add to Home Screen" info
        if (!localStorage.getItem('pwaPromptDismissed')) {
            const pwaPrompt = document.createElement('div');
            pwaPrompt.className = 'pwa-prompt';
            pwaPrompt.innerHTML = `
                <div class="pwa-content">
                    <div class="pwa-message">
                        <p>Add Dimbadimba to your home screen for the best experience!</p>
                    </div>
                    <div class="pwa-buttons">
                        <button id="pwa-install-btn">Install</button>
                        <button id="pwa-dismiss-btn">Not Now</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(pwaPrompt);
            
            document.getElementById('pwa-install-btn').addEventListener('click', () => {
                // Hide the prompt
                pwaPrompt.style.display = 'none';
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    // Clear the deferred prompt
                    deferredPrompt = null;
                });
            });
            
            document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
                // Hide the prompt
                pwaPrompt.style.display = 'none';
                // Remember that the user dismissed the prompt
                localStorage.setItem('pwaPromptDismissed', 'true');
            });
        }
    });
    
    // Handle specific behaviors for desktop browsers
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
        // Add hover effects for desktop, which won't trigger unwanted mobile effects
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.add('desktop-hover-enabled');
        });
    } else {
        // Add auto URL bar hiding
        window.addEventListener('load', function() {
            setTimeout(function() {
                // Scroll to hide URL bar
                window.scrollTo(0, 1);
            }, 100);
        });
        
        // Re-hide URL bar after orientation changes
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                window.scrollTo(0, 1);
            }, 100);
        });
        
        // Add a class to the body to enable mobile-specific CSS
        document.body.classList.add('is-mobile-device');
    }
}

// Create power-up indicator UI element
function createPowerupIndicator() {
    powerupIndicator = document.createElement('div');
    powerupIndicator.className = 'powerup-indicator';
    document.querySelector('.game-area').appendChild(powerupIndicator);
    
    // Add CSS for the power-up indicator
    const style = document.createElement('style');
    style.textContent = `
        .powerup-indicator {
            position: absolute;
            top: 60px;
            right: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 1000;
        }
        .powerup-item {
            display: flex;
            align-items: center;
            background: rgba(0,0,0,0.6);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
            min-width: 120px;
        }
        .powerup-icon {
            width: 20px;
            height: 20px;
            margin-right: 8px;
            display: inline-block;
        }
        .powerup-timer {
            margin-left: auto;
            font-weight: bold;
        }
        .shield-icon { background-color: #3498db; }
        .speed-icon { background-color: #2ecc71; }
        .magnet-icon { background-color: #9b59b6; }
        .double-score-icon { background-color: #f1c40f; }
    `;
    document.head.appendChild(style);
}

// New function to update power-ups
function updatePowerups(deltaTime) {
    // Update existing power-ups on screen
    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
        gameState.powerups[i].x -= getCurrentGameSpeed();
        gameState.powerups[i].rotation += 0.03; // Rotate the power-up
        
        // Remove power-ups that are off screen
        if (gameState.powerups[i].x < -POWERUP_SIZE) {
            gameState.powerups.splice(i, 1);
        }
    }
    
    // Update active power-up timers
    for (const type in gameState.activePowerups) {
        if (gameState.activePowerups[type]) {
            // Decrease remaining time
            gameState.activePowerups[type].timeLeft -= deltaTime;
            
            // Update indicator
            updatePowerupIndicator(type, gameState.activePowerups[type].timeLeft);
            
            // End power-up if time expired
            if (gameState.activePowerups[type].timeLeft <= 0) {
                deactivatePowerup(type);
            }
        }
    }
    
    // Update time since last power-up spawn
    gameState.timeSinceLastPowerup += deltaTime;
}

// Spawn a power-up at a random position
function spawnPowerup() {
    // Reset timer
    gameState.timeSinceLastPowerup = 0;
    
    // Choose a random power-up type
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random vertical position
    const y = Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - POWERUP_SIZE - 50) + 50;
    
    // Add the power-up to the game
    gameState.powerups.push({
        x: GAME_WIDTH,
        y: y,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        type: type,
        rotation: 0
    });
}

// Update the power-up indicator UI
function updatePowerupIndicator(type, timeLeft) {
    if (!powerupIndicator) return;
    
    // Find existing indicator for this power-up type
    let indicator = document.getElementById(`powerup-${type}`);
    
    if (!indicator) {
        // Create new indicator if it doesn't exist
        indicator = document.createElement('div');
        indicator.id = `powerup-${type}`;
        indicator.className = 'powerup-item';
        
        const icon = document.createElement('span');
        icon.className = `powerup-icon ${type}-icon`;
        
        const label = document.createElement('span');
        label.textContent = getPowerupName(type);
        
        const timer = document.createElement('span');
        timer.className = 'powerup-timer';
        
        indicator.appendChild(icon);
        indicator.appendChild(label);
        indicator.appendChild(timer);
        powerupIndicator.appendChild(indicator);
    }
    
    // Update timer display
    const timerElement = indicator.querySelector('.powerup-timer');
    if (timerElement) {
        timerElement.textContent = Math.ceil(timeLeft / 1000) + 's';
    }
}

// Get readable name for power-up type
function getPowerupName(type) {
    switch(type) {
        case POWERUP_TYPES.SPEED:
            return 'Speed Boost';
        case POWERUP_TYPES.SHIELD:
            return 'Shield';
        case POWERUP_TYPES.MAGNET:
            return 'Coin Magnet';
        case POWERUP_TYPES.DOUBLE_SCORE:
            return 'Double Score';
        default:
            return 'Power-Up';
    }
}

// Activate a power-up effect
function activatePowerup(type) {
    // Play power-up sound
    sounds.powerup();
    
    // Apply power-up effect
    gameState.activePowerups[type] = {
        timeLeft: POWERUP_DURATION,
        timerId: null
    };
    
    // Apply specific power-up effects
    switch(type) {
        case POWERUP_TYPES.DOUBLE_SCORE:
            gameState.scoreMultiplier = 2;
            break;
        case POWERUP_TYPES.SHIELD:
            // Visual effect for shield will be handled in drawGame
            break;
        case POWERUP_TYPES.MAGNET:
            // Magnet effect is handled in updateCoins
            break;
        case POWERUP_TYPES.SPEED:
            // Speed effect is handled in getCurrentGameSpeed
            break;
    }
    
    // Update the UI indicator
    updatePowerupIndicator(type, POWERUP_DURATION);
}

// Deactivate a power-up effect
function deactivatePowerup(type) {
    // Remove from active power-ups
    delete gameState.activePowerups[type];
    
    // Remove UI indicator
    const indicator = document.getElementById(`powerup-${type}`);
    if (indicator && powerupIndicator) {
        powerupIndicator.removeChild(indicator);
    }
    
    // Remove specific power-up effects
    switch(type) {
        case POWERUP_TYPES.DOUBLE_SCORE:
            gameState.scoreMultiplier = 1;
            break;
        // Other power-ups automatically stop when removed from activePowerups
    }
}

function createPowerupSprites() {
    // Get current mode colors
    const modeColors = gameState.dayMode ? colors.day : colors.night;
    
    // Speed boost power-up (lightning bolt)
    sprites.powerups[POWERUP_TYPES.SPEED] = createPixelArt([
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,0,0,0],
        [1,1,1,1,0,0,0,0],
        [0,0,1,1,1,0,0,0],
        [0,0,0,1,1,1,0,0],
        [0,0,0,0,1,1,1,0],
        [0,0,0,0,0,1,1,1]
    ], '#2ecc71', 5); // Green
    
    // Shield power-up (shield shape)
    sprites.powerups[POWERUP_TYPES.SHIELD] = createPixelArt([
        [0,1,1,1,1,1,0],
        [1,1,1,1,1,1,1],
        [1,1,0,0,0,1,1],
        [1,0,0,0,0,0,1],
        [0,1,0,0,0,1,0],
        [0,0,1,0,1,0,0],
        [0,0,0,1,0,0,0]
    ], '#3498db', 5); // Blue
    
    // Magnet power-up (horseshoe magnet)
    sprites.powerups[POWERUP_TYPES.MAGNET] = createPixelArt([
        [1,1,0,0,0,1,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,0,0,0,0,0,1],
        [1,1,0,0,0,1,1],
        [0,1,1,0,1,1,0],
        [0,0,1,1,1,0,0]
    ], '#9b59b6', 5); // Purple
    
    // Double score power-up (x2 symbol)
    sprites.powerups[POWERUP_TYPES.DOUBLE_SCORE] = createPixelArt([
        [1,0,0,0,0,0,1],
        [0,1,0,0,0,1,0],
        [0,0,1,0,1,0,0],
        [0,0,0,1,0,0,0],
        [0,0,1,0,1,0,0],
        [0,1,0,0,0,1,0],
        [1,0,0,0,0,0,1]
    ], '#f1c40f', 5); // Yellow
}

// Create a point indicator when collecting a coin
function createPointIndicator(x, y, points) {
    // Calculate position (centered above the coin)
    const indicator = {
        x: x,
        y: y,
        points: points,
        opacity: 1.0,
        scale: 1.0,
        lifetime: 0,
        maxLifetime: 2000 // Increased from 1500 to 2000ms for longer visibility
    };
    
    // Add to the array of active indicators
    gameState.pointIndicators.push(indicator);
}

// Update point indicators with improved animation
function updatePointIndicators(deltaTime) {
    for (let i = gameState.pointIndicators.length - 1; i >= 0; i--) {
        const indicator = gameState.pointIndicators[i];
        
        // Update lifetime
        indicator.lifetime += deltaTime;
        
        // First quarter of animation: explosive growth and fast rise
        if (indicator.lifetime < indicator.maxLifetime / 4) {
            indicator.y -= 2.0; // Much faster upward movement
            indicator.scale = 0.5 + (indicator.lifetime / (indicator.maxLifetime / 4)) * 1.5; // Grow from 0.5 to 2.0 size
        } 
        // Second quarter: slower rise, maintain large size with bounce
        else if (indicator.lifetime < (indicator.maxLifetime / 2)) {
            indicator.y -= 1.0; // Medium speed
            // Add a pronounced bouncing effect
            const bouncePhase = (indicator.lifetime / 100) % (2 * Math.PI);
            indicator.scale = 2.0 + Math.sin(bouncePhase) * 0.3;
        }
        // Third quarter: slow rise, start gentle fade
        else if (indicator.lifetime < (indicator.maxLifetime * 3/4)) {
            indicator.y -= 0.5;
            indicator.scale = 2.0; // Maintain large size
            indicator.opacity = 1.0;
        }
        // Final quarter: very slow rise and fade out
        else {
            indicator.y -= 0.3;
            indicator.opacity = 1.0 - ((indicator.lifetime - (indicator.maxLifetime * 3/4)) / (indicator.maxLifetime/4));
        }
        
        // Remove expired indicators
        if (indicator.lifetime >= indicator.maxLifetime) {
            gameState.pointIndicators.splice(i, 1);
        }
    }
}

// Draw point indicators on screen
function drawPointIndicators() {
    // Return early if no indicators
    if (gameState.pointIndicators.length === 0) return;
    
    for (let i = 0; i < gameState.pointIndicators.length; i++) {
        const indicator = gameState.pointIndicators[i];
        
        // Save context state
        ctx.save();
        
        // Calculate base font size - much larger than before
        const fontSize = Math.floor(30 * indicator.scale);
        
        // Set up text properties with larger size for more prominence
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Create a background glow for the text
        ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw a thick black outline for maximum contrast
        ctx.lineWidth = Math.max(3, fontSize / 8);
        ctx.strokeStyle = `rgba(0, 0, 0, ${indicator.opacity})`;
        ctx.strokeText(`+${indicator.points}`, indicator.x, indicator.y);
        
        // Draw bright inner text
        // First a white base for brightness
        ctx.fillStyle = `rgba(255, 255, 255, ${indicator.opacity})`;
        ctx.fillText(`+${indicator.points}`, indicator.x, indicator.y);
        
        // Then overlay with gold gradient for shine effect
        const gradient = ctx.createLinearGradient(
            indicator.x - fontSize, 
            indicator.y - fontSize/2,
            indicator.x + fontSize,
            indicator.y + fontSize/2
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${indicator.opacity})`); // Gold
        gradient.addColorStop(0.5, `rgba(255, 255, 200, ${indicator.opacity})`); // Bright yellow
        gradient.addColorStop(1, `rgba(255, 140, 0, ${indicator.opacity})`); // Orange
        
        ctx.fillStyle = gradient;
        ctx.fillText(`+${indicator.points}`, indicator.x, indicator.y);
        
        // Add sparkle effect (optional sparkles around the text)
        if (indicator.lifetime < indicator.maxLifetime / 2) {
            const sparkleCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < sparkleCount; j++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = fontSize * (0.8 + Math.random() * 0.5);
                const sparkleX = indicator.x + Math.cos(angle) * distance;
                const sparkleY = indicator.y + Math.sin(angle) * distance;
                const sparkleSize = fontSize / 5 + Math.random() * (fontSize / 10);
                
                // Draw sparkle
                ctx.fillStyle = `rgba(255, 255, 255, ${indicator.opacity * 0.8})`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Restore context state
        ctx.restore();
    }
}

// Create a modified player sprite when arms are rotating
function createRotatingArmSprite(angle) {
    // If we're using an image for the player, return the cached properly sized image
    if (sprites.playerOriginal) {
        // Create a temporary canvas for the modified sprite
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gameState.dimbadimba.canvasWidth || PLAYER_WIDTH * 1.5;
        tempCanvas.height = gameState.dimbadimba.canvasHeight || PLAYER_HEIGHT * 1.5;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Clear the canvas
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the image with maintained aspect ratio
        tempCtx.drawImage(
            sprites.playerOriginal, 
            gameState.dimbadimba.imageOffsetX, 
            gameState.dimbadimba.imageOffsetY, 
            gameState.dimbadimba.imageWidth, 
            gameState.dimbadimba.imageHeight
        );
        
        // Add some visual effect to show the arm rotating action
        // (like a subtle glow or sparkle since we can't actually rotate arms on the image)
        tempCtx.save();
        tempCtx.globalAlpha = 0.5;
        tempCtx.fillStyle = '#f1c40f'; // Yellow color for effect
        
        // Draw small circles around the character to indicate motion
        for (let i = 0; i < 5; i++) {
            const circleAngle = angle + (i * Math.PI / 2.5);
            const circleX = tempCanvas.width / 2 + Math.cos(circleAngle) * (tempCanvas.width * 0.4);
            const circleY = tempCanvas.height / 2 + Math.sin(circleAngle) * (tempCanvas.height * 0.3);
            const circleSize = 10 + Math.sin(angle * 3) * 5; // Larger circles for bigger character
            
            tempCtx.beginPath();
            tempCtx.arc(circleX, circleY, circleSize, 0, Math.PI * 2);
            tempCtx.fill();
        }
        tempCtx.restore();
        
        return tempCanvas;
    }
    
    // Otherwise use the existing pixel art animation
    // Create a temporary canvas for the modified sprite
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = PLAYER_WIDTH;
    tempCanvas.height = PLAYER_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the basic player sprite
    tempCtx.drawImage(sprites.player, 0, 0);
    
    // Define the arm regions in the sprite (based on the dimbadimbaPixels array)
    const leftArmX = 20; // Approximate x position of left arm
    const rightArmX = 60; // Approximate x position of right arm
    const armY = 70; // Approximate y position of arms
    const armWidth = 20; // Approximate width of arm
    const armHeight = 20; // Approximate height of arm
    
    // Clear the arm regions
    tempCtx.clearRect(leftArmX, armY, armWidth, armHeight);
    tempCtx.clearRect(rightArmX, armY, armWidth, armHeight);
    
    // Draw rotated arms
    // Left arm
    tempCtx.save();
    tempCtx.translate(leftArmX + armWidth/2, armY + armHeight/2);
    tempCtx.rotate(angle);
    tempCtx.fillStyle = '#f1c40f'; // Yellow color for arms
    tempCtx.fillRect(-armWidth/2, -armHeight/2, armWidth, armHeight);
    tempCtx.restore();
    
    // Right arm
    tempCtx.save();
    tempCtx.translate(rightArmX + armWidth/2, armY + armHeight/2);
    tempCtx.rotate(-angle); // Rotate in opposite direction
    tempCtx.fillStyle = '#f1c40f'; // Yellow color for arms
    tempCtx.fillRect(-armWidth/2, -armHeight/2, armWidth, armHeight);
    tempCtx.restore();
    
    return tempCanvas;
}

// Add this after the handleDeviceOrientation function

// Ensure the start button is visible in landscape mode
function ensureStartButtonVisibility() {
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    
    // Function to check if an element is fully visible in the viewport
    function isElementInViewport(el) {
        if (!el) return false;
        
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Function to check and scroll to button if needed
    function checkButtonVisibility(button) {
        if (button && !isElementInViewport(button)) {
            // If button exists but is not fully visible
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Additionally force button into view on iOS
            setTimeout(() => {
                const overlay = button.closest('.overlay');
                if (overlay) {
                    const buttonPosition = button.offsetTop;
                    overlay.scrollTop = buttonPosition - (overlay.clientHeight / 2) + (button.clientHeight / 2);
                }
            }, 100);
        }
    }
    
    // Check orientation and screen height to determine if we need to intervene
    if (window.innerHeight < 500 && window.innerWidth > window.innerHeight) {
        // We're in landscape on a small screen, likely mobile
        if (startButton && !document.getElementById('startScreen').classList.contains('hidden')) {
            checkButtonVisibility(startButton);
        } else if (restartButton && !document.getElementById('game-over').classList.contains('hidden')) {
            checkButtonVisibility(restartButton);
        }
    }
}

// Add to window resize and orientation change events
window.addEventListener('resize', ensureStartButtonVisibility);
window.addEventListener('orientationchange', function() {
    // Small delay to allow the orientation change to complete
    setTimeout(ensureStartButtonVisibility, 300);
});

function applyDifficultySettings() {
    try {
        // Make sure we have a valid difficulty setting
        if (!gameState.difficulty || !DIFFICULTY_SETTINGS[gameState.difficulty]) {
            console.warn("Invalid difficulty setting: " + gameState.difficulty + ". Falling back to normal.");
            gameState.difficulty = 'normal';
        }
        
        const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
        
        // Apply the settings to the game
        gameState.speed = settings.initialSpeed;
        gameState.obstacleInterval = settings.obstacleInterval;
        gameState.coinInterval = settings.coinInterval;
        gameState.powerupSpawnChance = settings.powerupSpawnChance;
        gameState.gravity = settings.gravity;
        gameState.jumpForce = settings.jumpForce;
        
        // Update SPEED_INCREMENT for game progression
        SPEED_INCREMENT = settings.speedIncrement;
        
        console.log(`Applied ${gameState.difficulty} difficulty settings:`, settings);
        
        // Also update the display if it exists
        if (difficultyDisplayElement) {
            let displayText = "Normal";
            switch(gameState.difficulty) {
                case 'easy': displayText = "Easy"; break;
                case 'normal': displayText = "Normal"; break;
                case 'hard': displayText = "Hard"; break;
            }
            difficultyDisplayElement.textContent = displayText;
        }
    } catch (e) {
        console.error("Error in applyDifficultySettings:", e);
        // Apply safe defaults
        gameState.speed = INITIAL_SPEED;
        gameState.obstacleInterval = 1500;
        gameState.coinInterval = 2500;
        gameState.gravity = GRAVITY;
        gameState.jumpForce = JUMP_FORCE;
        gameState.powerupSpawnChance = POWERUP_SPAWN_CHANCE;
    }
}

// PWA Installation Functions

// Initialize PWA installation features
function initPwaInstallation() {
    console.log('PWA initialization started');
    
    // Get installation instruction elements
    const iosInstructions = document.getElementById('iosInstallInstructions');
    const androidInstructions = document.getElementById('androidInstallInstructions');
    
    // Detect device types
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid || /Mobi|Android/i.test(navigator.userAgent);
    
    // Check if the app is already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    const wasInstalled = localStorage.getItem('appInstalled') === 'true';
    
    // Hide install button if already installed or previously installed
    if (isStandalone || wasInstalled) {
        console.log('App appears to be already installed or was previously installed');
        if (installButton) {
            installButton.classList.add('hidden');
        }
        if (iosInstructions) iosInstructions.classList.add('hidden');
        if (androidInstructions) androidInstructions.classList.add('hidden');
        return; // No need to show installation options
    }
    
    // Listen for beforeinstallprompt event (works on Chrome/Android)
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event fired!', e);
        
        // For browsers' native install prompt - DO NOT PREVENT DEFAULT
        // e.preventDefault(); - Removing this to allow the native prompt to show
        
        // Store the event for later use with our custom button
        deferredPrompt = e;
        
        // Show our custom install button
        if (installButton) {
            installButton.classList.remove('hidden');
            console.log('Install button made visible due to beforeinstallprompt event');
        }
        
        // If on Android, hide the manual instructions since we have the prompt
        if (isAndroid && androidInstructions) {
            androidInstructions.classList.add('hidden');
        }
    });
    
    // iOS doesn't support beforeinstallprompt, show iOS instructions
    if (isIOS) {
        console.log('iOS device detected');
        if (iosInstructions) {
            iosInstructions.classList.remove('hidden');
            console.log('iOS installation instructions displayed');
        }
    }
    
    // If Android but no prompt fires, show instructions after a delay
    if (isAndroid) {
        console.log('Android device detected');
        
        // Show manual instructions if no prompt event fires
        setTimeout(() => {
            if (!deferredPrompt && androidInstructions) {
                androidInstructions.classList.remove('hidden');
                console.log('Android manual installation instructions displayed');
            }
        }, 3000);
    }
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', (e) => {
        console.log('appinstalled event fired!', e);
        
        // Hide the install button and instructions when app is installed
        if (installButton) installButton.classList.add('hidden');
        if (iosInstructions) iosInstructions.classList.add('hidden');
        if (androidInstructions) androidInstructions.classList.add('hidden');
        
        // Set a flag in localStorage to remember it was installed
        localStorage.setItem('appInstalled', 'true');
        
        // Alert the user that installation was successful
        alert('Game successfully installed! You can now access it from your home screen.');
    });
    
    // Add click event listener to install button
    if (installButton) {
        installButton.addEventListener('click', function() {
            console.log('Install button clicked');
            installPWA();
        });
        console.log('Click listener added to install button');
    } else {
        console.error('Install button not found in the DOM');
    }
    
    // Check if the app was launched from the home screen
    if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App launched in standalone mode (from home screen)');
        localStorage.setItem('appInstalled', 'true');
        if (installButton) installButton.classList.add('hidden');
    }
}

// Function to handle PWA installation
function installPWA() {
    console.log('installPWA function called, deferredPrompt:', deferredPrompt ? 'available' : 'not available');
    
    if (!deferredPrompt) {
        console.log('Unable to install: Install prompt not available');
        
        // Detect device type
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
            alert('To install on iOS: tap the Share button then "Add to Home Screen"');
        } else if (isAndroid) {
            alert('To install on Android: tap the menu button (⋮) then "Add to Home Screen"');
        } else {
            // Desktop browsers
            const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent);
            const isEdge = /Edge|Edg/.test(navigator.userAgent);
            
            let message = 'Installation not available right now.';
            
            if (isChrome) {
                message = 'To install this app in Chrome, click the menu (⋮) in the top-right corner and select "Install Dimbadimba..." or "Add to desktop".';
            } else if (isEdge) {
                message = 'To install this app in Edge, click the menu (…) in the top-right corner and select "Apps" > "Install this site as an app".';
            }
            
            alert(message);
        }
        return;
    }
    
    try {
        // Show the browser install prompt
        deferredPrompt.prompt();
        console.log('Installation prompt displayed');
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            // Clear the deferred prompt variable
            deferredPrompt = null;
        });
    } catch (err) {
        console.error('Error showing installation prompt:', err);
        alert('There was an error with the installation. Please try using the browser menu to install.');
    }
}

// Function to show install toast notification
function showInstallToast() {
    // Check if toast already exists or was previously dismissed
    if (document.querySelector('.install-toast') || localStorage.getItem('installToastDismissed') === 'true') {
        return;
    }
    
    // Create toast container
    const toast = document.createElement('div');
    toast.className = 'install-toast';
    
    // Create toast message
    const message = document.createElement('span');
    message.className = 'install-toast-message';
    message.textContent = 'Install Dimbadimba for the best gaming experience!';
    
    // Create install button
    const button = document.createElement('button');
    button.className = 'install-toast-button';
    button.textContent = 'Install';
    button.addEventListener('click', () => {
        installPWA();
        removeInstallToast();
    });
    
    // Create close button
    const close = document.createElement('span');
    close.className = 'install-toast-close';
    close.innerHTML = '&times;';
    close.addEventListener('click', () => {
        removeInstallToast();
        localStorage.setItem('installToastDismissed', 'true');
    });
    
    // Add elements to toast
    toast.appendChild(message);
    toast.appendChild(button);
    toast.appendChild(close);
    
    // Add toast to body
    document.body.appendChild(toast);
    
    // Set flag to prevent showing again
    installToastShown = true;
    
    // Auto-remove toast after 10 seconds
    setTimeout(() => {
        removeInstallToast();
    }, 10000);
}

// Function to remove install toast
function removeInstallToast() {
    const toast = document.querySelector('.install-toast');
    if (toast) {
        toast.remove();
    }
}

// New function to handle what happens on collision
function handleCollision() {
    // Decrease life
    gameState.lives--;
    
    // Play hit sound
    playSound('hit');
    
    // Reset combo on getting hit
    resetCombo();
    
    // Update life display
    updateLivesDisplay();
    
    // If no lives left, game over
    if (gameState.lives <= 0) {
        gameOver();
        return;
    }
    
    // Otherwise, make player invincible temporarily
    gameState.isInvincible = true;
    gameState.invincibilityTimer = 0;
}

// Function to update the lives display in UI
function updateLivesDisplay() {
    const livesDisplay = document.getElementById('livesDisplay');
    if (livesDisplay) {
        livesDisplay.textContent = gameState.lives;
    }
}

// Function to check coin collisions
function checkCoinCollisions() {
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
        const coin = gameState.coins[i];
        
        if (detectCollision(gameState.dimbadimba, coin)) {
            // Get coin position before removing it
            const coinX = coin.x + coin.width / 2;
            const coinY = coin.y;
            
            // Remove coin from array
            gameState.coins.splice(i, 1);
            
            // Increase combo for coin collection
            increaseCombo();
            
            // Calculate points (accounting for multiplier AND combo multiplier)
            const pointsEarned = Math.floor(50 * gameState.scoreMultiplier * gameState.combo.multiplier);
            
            // Add to score
            gameState.score += pointsEarned;
            updateScore();
            
            // Create visual indicator at coin position
            createPointIndicator(coinX, coinY, pointsEarned);
            
            // Start arm rotation animation
            gameState.dimbadimba.isArmRotating = true;
            gameState.dimbadimba.armRotation = 0;
            gameState.dimbadimba.armRotationCycles = 0;
            
            // Play coin sound
            sounds.coin();
        }
    }
}

// Function to check powerup collisions
function checkPowerupCollisions() {
    for (let i = gameState.powerups.length - 1; i >= 0; i--) {
        const powerup = gameState.powerups[i];
        
        if (detectCollision(gameState.dimbadimba, powerup)) {
            // Collect the power-up
            activatePowerup(powerup.type);
            gameState.powerups.splice(i, 1);
        }
    }
}

// Collision detection helper
function detectCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Draw background using parallax layers based on current mode
function drawBackground() {
    // Get the layers for the current mode
    const layers = gameState.dayMode ? sprites.parallaxLayers.day : sprites.parallaxLayers.night;
    
    // Draw each layer with its offset
    for (let i = 0; i < layers.length; i++) {
        // Calculate the x position with parallax effect (different speeds)
        const x = gameState.backgroundPos[i] % layers[i].width;
        
        // Draw first copy of the layer
        ctx.drawImage(layers[i], x, 0);
        
        // If we need to draw a second copy to fill the screen
        if (x < GAME_WIDTH - layers[i].width) {
            ctx.drawImage(layers[i], x + layers[i].width, 0);
        }
    }
}

// Update background positions for parallax effect
function updateBackground() {
    // Update each background layer position based on its speed
    for (let i = 0; i < gameState.backgroundPos.length; i++) {
        // Move each layer at different speeds
        const speed = getCurrentGameSpeed() * gameState.backgroundSpeed[i];
        gameState.backgroundPos[i] -= speed;
        
        // Prevent position from getting too large by keeping it within width
        if (Math.abs(gameState.backgroundPos[i]) > GAME_WIDTH * 2) {
            gameState.backgroundPos[i] %= GAME_WIDTH;
        }
    }
}

// Draw the ground using the pattern
function drawGround() {
    // Check if ground pattern is defined
    if (!gameState.groundPattern) {
        return;
    }
    
    // Calculate ground position (wrap around)
    gameState.groundPos = (gameState.groundPos - getCurrentGameSpeed()) % 50;
    
    // Set pattern fill with calculated offset
    ctx.save();
    ctx.translate(gameState.groundPos, 0);
    ctx.fillStyle = gameState.groundPattern;
    ctx.fillRect(-gameState.groundPos, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH + 50, GROUND_HEIGHT);
    ctx.restore();
}

// Add the missing updateScore function
function updateScore() {
    // Update current score display
    if (currentScoreElement) {
        currentScoreElement.textContent = gameState.score;
    }
    
    // Update high score if current score is higher
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        
        // Update high score display
        if (highScoreElement) {
            highScoreElement.textContent = gameState.highScore;
        }
        
        // Save high score to local storage
        localStorage.setItem('pixelRunnerHighScore', gameState.highScore);
    }
    
    // Update the final score display on game over screen
    if (finalScoreElement) {
        finalScoreElement.textContent = gameState.score;
    }
}

// Add missing playSound function
function playSound(soundName) {
    if (!gameState.soundEnabled || !sounds.audioCtx) return;
    
    switch(soundName) {
        case 'jump':
            sounds.jump();
            break;
        case 'coin':
            sounds.coin();
            break;
        case 'gameOver':
            sounds.gameOver();
            break;
        case 'powerup':
            sounds.powerup();
            break;
        case 'hit':
            sounds.hit();
            break;
    }
}

// ========== COMBO SYSTEM ==========

// Increase combo count when collecting coins or successful near-misses
function increaseCombo() {
    gameState.combo.count++;
    gameState.combo.multiplier = Math.min(1 + (gameState.combo.count * 0.2), COMBO_MAX_MULTIPLIER);
    gameState.combo.lastActionTime = performance.now(); // Use performance.now() for consistency
    
    // Track max combo
    if (gameState.combo.count > gameState.combo.maxCombo) {
        gameState.combo.maxCombo = gameState.combo.count;
    }
}

// Check if combo should be reset (called from animation loop using deltaTime)
function updateCombo(currentTime) {
    if (gameState.combo.count > 0 && gameState.combo.lastActionTime > 0) {
        const timeSinceLastAction = currentTime - gameState.combo.lastActionTime;
        if (timeSinceLastAction >= COMBO_TIMEOUT) {
            resetCombo();
        }
    }
}

// Reset combo when timer expires or player gets hit
function resetCombo() {
    gameState.combo.count = 0;
    gameState.combo.multiplier = 1;
    gameState.combo.lastActionTime = 0;
}

// Draw combo counter on screen
function drawComboCounter() {
    if (gameState.combo.count < 2) return;
    
    const comboText = `${gameState.combo.count}x COMBO!`;
    const multiplierText = `(${gameState.combo.multiplier.toFixed(1)}x points)`;
    
    // Calculate pulsing effect based on combo count using gameTime variable
    const pulseScale = 1 + Math.sin(gameTime / 100) * 0.1 * Math.min(gameState.combo.count / 5, 1);
    const baseFontSize = 28 + Math.min(gameState.combo.count * 2, 20);
    
    ctx.save();
    
    // Position in upper right area
    const x = GAME_WIDTH - 30;
    const y = 120;
    
    // Add glow effect based on combo count
    ctx.shadowColor = getComboColor(gameState.combo.count);
    ctx.shadowBlur = 10 + gameState.combo.count * 2;
    
    // Draw combo text
    ctx.font = `bold ${Math.floor(baseFontSize * pulseScale)}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Text outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(comboText, x, y);
    
    // Text fill with gradient
    const gradient = ctx.createLinearGradient(x - 200, y - 20, x, y + 20);
    gradient.addColorStop(0, getComboColor(gameState.combo.count));
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, getComboColor(gameState.combo.count));
    ctx.fillStyle = gradient;
    ctx.fillText(comboText, x, y);
    
    // Draw multiplier text smaller below
    ctx.font = `bold ${Math.floor(16 * pulseScale)}px Arial, sans-serif`;
    ctx.shadowBlur = 5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeText(multiplierText, x, y + 30);
    ctx.fillStyle = '#ffdd57';
    ctx.fillText(multiplierText, x, y + 30);
    
    ctx.restore();
}

// Get color based on combo count
function getComboColor(count) {
    if (count >= 15) return '#ff00ff'; // Purple for legendary
    if (count >= 10) return '#ff6600'; // Orange for epic
    if (count >= 7) return '#ffdd00';  // Gold for great
    if (count >= 4) return '#00ff00';  // Green for good
    return '#ffffff'; // White for starting
}

// ========== NEAR-MISS SYSTEM ==========

// Check for near-miss with obstacles (player barely avoids)
function checkNearMiss(obstacle) {
    // Skip if already checked (using Set for better tracking)
    if (gameState.checkedObstacleIds.has(obstacle.id)) return;
    
    const nearMissDistance = 15;
    const playerRight = gameState.dimbadimba.x + gameState.dimbadimba.width;
    const obstacleLeft = obstacle.x;
    const playerBottom = gameState.dimbadimba.y + gameState.dimbadimba.height;
    const obstacleTop = obstacle.y;
    
    // Check if player just passed the obstacle very closely
    if (playerRight > obstacleLeft && playerRight < obstacleLeft + nearMissDistance) {
        // Check if player was jumping over (bottom of player near top of obstacle)
        if (playerBottom < obstacleTop + 20 && playerBottom > obstacleTop - 30) {
            // Near miss! Mark as checked using Set
            gameState.checkedObstacleIds.add(obstacle.id);
            gameState.nearMissCount++;
            
            // Award points
            const nearMissPoints = 10 * gameState.scoreMultiplier * gameState.combo.multiplier;
            gameState.score += Math.floor(nearMissPoints);
            updateScore();
            
            // Increase combo
            increaseCombo();
            
            // Visual feedback
            createNearMissIndicator(
                gameState.dimbadimba.x + gameState.dimbadimba.width,
                gameState.dimbadimba.y + gameState.dimbadimba.height / 2
            );
        }
    }
}

// Create near-miss visual indicator
function createNearMissIndicator(x, y) {
    gameState.pointIndicators.push({
        x: x,
        y: y,
        points: 'CLOSE!',
        opacity: 1.0,
        scale: 0.8,
        lifetime: 0,
        maxLifetime: 1000,
        isNearMiss: true
    });
}

// ========== PARTICLE SYSTEM ==========

// Create jump dust particles
function createJumpDustParticles() {
    const particleCount = 8;
    const baseX = gameState.dimbadimba.x + gameState.dimbadimba.width / 2;
    const baseY = GAME_HEIGHT - GROUND_HEIGHT;
    
    for (let i = 0; i < particleCount; i++) {
        gameState.particles.push({
            x: baseX + (Math.random() - 0.5) * 40,
            y: baseY,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 4 - 2,
            size: 4 + Math.random() * 6,
            baseColor: gameState.dayMode ? 
                { r: 139, g: 69, b: 19 } : 
                { r: 80, g: 80, b: 80 },
            baseAlpha: 0.4 + Math.random() * 0.3,
            lifetime: 400 + Math.random() * 200,
            age: 0,
            opacity: 1
        });
    }
}

// Create landing dust particles
function createLandingDustParticles() {
    const particleCount = 12;
    const baseX = gameState.dimbadimba.x + gameState.dimbadimba.width / 2;
    const baseY = GAME_HEIGHT - GROUND_HEIGHT;
    
    for (let i = 0; i < particleCount; i++) {
        // Full circle distribution for more realistic landing dust
        const angle = (2 * Math.PI / particleCount) * i;
        // But only allow particles to go upward and sideways (not downward into ground)
        const vy = Math.sin(angle) < 0 ? Math.sin(angle) * 2 : -Math.random() * 2;
        gameState.particles.push({
            x: baseX,
            y: baseY,
            vx: Math.cos(angle) * (3 + Math.random() * 3),
            vy: vy - Math.random(),
            size: 5 + Math.random() * 5,
            baseColor: gameState.dayMode ? 
                { r: 139, g: 69, b: 19 } : 
                { r: 80, g: 80, b: 80 },
            baseAlpha: 0.5 + Math.random() * 0.3,
            lifetime: 500 + Math.random() * 200,
            age: 0,
            opacity: 1
        });
    }
}

// Update particles
function updateParticles(deltaTime) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        
        particle.age += deltaTime;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravity
        
        // Fade out - update opacity based on life ratio
        const lifeRatio = particle.age / particle.lifetime;
        particle.opacity = (1 - lifeRatio) * (particle.baseAlpha || 1);
        particle.size *= 0.98;
        
        // Remove dead particles
        if (particle.age >= particle.lifetime || particle.size < 1) {
            gameState.particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    for (const particle of gameState.particles) {
        ctx.save();
        ctx.globalAlpha = particle.opacity || 1;
        
        // Use baseColor if available, otherwise fall back to color string
        if (particle.baseColor) {
            ctx.fillStyle = `rgba(${particle.baseColor.r}, ${particle.baseColor.g}, ${particle.baseColor.b}, 1)`;
        } else if (particle.color) {
            ctx.fillStyle = particle.color;
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Add missing gameOver function
function gameOver() {
    gameState.running = false;
    
    // Stop background music
    sounds.backgroundMusic.stop();
    
    // Play game over sound
    playSound('gameOver');
    
    // Show game over screen
    gameOverScreen.classList.remove('hidden');
    
    // Update and save high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('pixelRunnerHighScore', gameState.highScore);
    }
    
    // Update high score display
    highScoreElement.textContent = gameState.highScore;
    
    // Update final score display
    finalScoreElement.textContent = gameState.score;
    
    // Create share buttons if they don't exist yet
    createSocialShareButtons();
}

// Function to create social media share buttons
function createSocialShareButtons() {
    // Check if share buttons already exist
    if (document.getElementById('social-share-container')) {
        return;
    }
    
    // Create container for social share buttons
    const shareContainer = document.createElement('div');
    shareContainer.id = 'social-share-container';
    shareContainer.className = 'social-share-container';
    
    // Add share heading
    const shareHeading = document.createElement('p');
    shareHeading.textContent = 'Share your score:';
    shareHeading.className = 'share-heading';
    shareContainer.appendChild(shareHeading);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'share-buttons';
    
    // Add X (formerly Twitter) share button
    const xButton = createShareButton('x', 'X', '#000000');
    xButton.addEventListener('click', () => shareOnX(gameState.score));
    buttonContainer.appendChild(xButton);
    
    // Add Facebook share button
    const facebookButton = createShareButton('facebook', 'Facebook', '#4267B2');
    facebookButton.addEventListener('click', () => shareOnFacebook(gameState.score));
    buttonContainer.appendChild(facebookButton);
    
    // Add WhatsApp share button
    const whatsappButton = createShareButton('whatsapp', 'WhatsApp', '#25D366');
    whatsappButton.addEventListener('click', () => shareOnWhatsApp(gameState.score));
    buttonContainer.appendChild(whatsappButton);
    
    // Add share via URL button
    const urlButton = createShareButton('url', 'Copy Link', '#2980b9'); // Changed color to be distinct
    urlButton.addEventListener('click', () => copyShareLink(gameState.score));
    buttonContainer.appendChild(urlButton);
    
    // Add buttons to container
    shareContainer.appendChild(buttonContainer);
    
    // Add share container to game over screen
    const gameOverScreen = document.getElementById('game-over');
    // Insert before the restart button
    const restartButton = document.getElementById('restartButton');
    gameOverScreen.insertBefore(shareContainer, restartButton);
    
    // Add CSS styles for share buttons
    addSocialShareStyles();
}

// Helper function to create a share button
function createShareButton(platform, text, bgColor) {
    const button = document.createElement('button');
    button.className = `share-button ${platform}-share`;
    
    // Create SVG icon element based on platform
    const iconElement = document.createElement('span');
    iconElement.className = `share-icon ${platform}-icon`;
    
    // Set SVG content based on platform
    switch(platform) {
        case 'x':
            // X logo (formerly Twitter)
            iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
            break;
        case 'facebook':
            // Facebook logo 
            iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
            break;
        case 'whatsapp':
            // WhatsApp logo
            iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.693 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
            break;
        case 'url':
            // Updated, more modern link icon
            iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
                <path d="M11 17H7c-2.76 0-5-2.24-5-5s2.24-5 5-5h4v2H7c-1.65 0-3 1.35-3 3s1.35 3 3 3h4v2zm2-2h4c1.65 0 3-1.35 3-3s-1.35-3-3-3h-4V7h4c2.76 0 5 2.24 5 5s-2.24 5-5 5h-4v-2zm-8-4h16v2H5v-2z"/>
            </svg>`;
            break;
    }
    
    // Create text element
    const textElement = document.createElement('span');
    textElement.className = 'share-text';
    textElement.textContent = text;
    
    // Add icon and text to button
    button.appendChild(iconElement);
    button.appendChild(textElement);
    
    // Set button styling with common properties
    button.style.backgroundColor = bgColor;
    button.style.border = '3px solid rgba(255, 255, 255, 0.25)';
    button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    
    // Add extra styles for X button (dark background needs more visible border)
    if (platform === 'x') {
        button.style.border = '3px solid rgba(255, 255, 255, 0.4)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4), 0 0 5px rgba(255, 255, 255, 0.15)';
    }
    
    return button;
}

// Function to share on X (formerly Twitter)
function shareOnX(score) {
    let text, url;
    
    if (typeof score === 'number') {
        // Share score
        text = `🎮 I scored ${score} points in Dimbadimba Pixel Runner! Can you beat my score?`;
    } else {
        // Share game
        text = `🎮 Check out Dimbadimba Pixel Runner - a fun endless runner game!`;
    }
    
    url = window.location.href.split('?')[0]; // Remove any query parameters
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
}

// Function to share on Facebook
function shareOnFacebook(score) {
    let quote, url;
    
    if (typeof score === 'number') {
        // Share score
        quote = `🎮 I scored ${score} points in Dimbadimba Pixel Runner! Can you beat my score?`;
    } else {
        // Share game
        quote = `🎮 Check out Dimbadimba Pixel Runner - a fun endless runner game!`;
    }
    
    url = window.location.href.split('?')[0]; // Remove any query parameters
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
    window.open(shareUrl, '_blank');
}

// Function to share on WhatsApp
function shareOnWhatsApp(score) {
    let text;
    
    if (typeof score === 'number') {
        // Share score
        text = `🎮 I scored ${score} points in Dimbadimba Pixel Runner! Can you beat my score? Play now at ${window.location.href.split('?')[0]}`;
    } else {
        // Share game
        text = `🎮 Check out Dimbadimba Pixel Runner - a fun endless runner game! Play now at ${window.location.href.split('?')[0]}`;
    }
    
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
}

// Function to copy share link to clipboard
function copyShareLink(score) {
    let text;
    
    if (typeof score === 'number') {
        // Share score
        text = `🎮 I scored ${score} points in Dimbadimba Pixel Runner! Can you beat my score? Play now at ${window.location.href.split('?')[0]}`;
    } else {
        // Share game
        text = `🎮 Check out Dimbadimba Pixel Runner - a fun endless runner game! Play now at ${window.location.href.split('?')[0]}`;
    }
    
    // Try to use the clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show success message
                showShareNotification('Link copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                // Fallback to prompt
                prompt('Copy this link to share:', text);
            });
    } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showShareNotification('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            prompt('Copy this link to share:', text);
        }
        
        document.body.removeChild(textArea);
    }
}

// Function to show notification after copying
function showShareNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Function to add CSS styles for social share buttons
function addSocialShareStyles() {
    // Check if styles already exist
    if (document.getElementById('social-share-styles')) {
        return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'social-share-styles';
    
    // Add CSS rules
    style.textContent = `
        .social-share-container {
            margin: 20px 0;
            text-align: center;
        }
        
        .share-heading {
            color: white;
            font-size: 20px;
            margin-bottom: 15px;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
            font-weight: bold;
        }
        
        .share-buttons {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .share-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border: none;
            border-radius: 24px;
            color: white;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            min-width: 130px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            gap: 8px;
        }
        
        .share-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 10px rgba(0, 0, 0, 0.4);
        }
        
        .share-button:active {
            transform: translateY(-1px);
            box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3);
        }
        
        .share-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }
        
        .share-icon svg {
            width: 100%;
            height: 100%;
        }
        
        .share-text {
            font-size: 16px;
            letter-spacing: 0.5px;
        }
        
        /* Platform-specific styles */
        .x-share {
            background-color: #000000;
        }
        
        .facebook-share {
            background-color: #4267B2;
        }
        
        .whatsapp-share {
            background-color: #25D366;
        }
        
        .url-share {
            background-color: #2980b9;
        }
        
        .share-notification {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            transition: transform 0.3s ease-out;
            font-size: 16px;
            font-weight: 600;
        }
        
        .share-notification.visible {
            transform: translateX(-50%) translateY(0);
        }
        
        /* Responsive styles */
        @media (max-width: 480px) {
            .share-buttons {
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            
            .share-button {
                width: 90%;
                max-width: 250px;
                padding: 12px 16px;
                justify-content: flex-start;
            }
            
            .share-text {
                font-size: 18px;
            }
            
            .share-icon {
                width: 26px;
                height: 26px;
                margin-right: 5px;
            }
            
            /* Center text in the button */
            .share-text {
                flex-grow: 1;
                text-align: center;
                margin-right: 26px; /* Balance the icon on the left */
            }
        }
    `;
    
    // Add to document head
    document.head.appendChild(style);
}

// Particle class for smoke effect
class SmokeParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // Start with smaller smoke particles for pipe smoke
        this.size = SMOKE_SIZE_MIN * 0.6 + Math.random() * (SMOKE_SIZE_MIN * 0.5);
        this.maxSize = SMOKE_SIZE_MAX;
        this.life = 0;
        this.opacity = 0.9;
        // More consistent upward and leftward movement for pipe smoke
        this.velocityX = -0.6 - Math.random() * 0.8;
        this.velocityY = -0.8 - Math.random() * 0.6;  // More upward motion
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    }
    
    update(deltaTime) {
        this.life += deltaTime;
        
        if (this.life < SMOKE_LIFETIME * 0.2) {
            // Initial phase - slow growth to simulate smoke coming out of pipe
            this.size += (this.size * 1.5 - this.size) * 0.02;
        } else if (this.life < SMOKE_LIFETIME * 0.6) {
            // Middle phase - faster growth as smoke expands in the air
            this.size += (this.maxSize - this.size) * 0.03;
            // Smoke slows down as it rises
            this.velocityX *= 0.99;
            this.velocityY *= 0.99;
        } else {
            // Fading phase
            this.opacity = 0.9 * (1 - ((this.life - SMOKE_LIFETIME * 0.6) / (SMOKE_LIFETIME * 0.4)));
            // Add slight drift at the end
            this.velocityX *= 0.98;
            this.velocityY *= 0.98;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;
        
        return this.life < SMOKE_LIFETIME;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw smoke particle as soft cloud - more white for pipe smoke
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.6, 'rgba(245, 245, 245, 0.7)');
        gradient.addColorStop(1, 'rgba(240, 240, 240, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

function updateSmoke(deltaTime) {
    // Update timer for spawning new particles
    gameState.smokeTimer += deltaTime;
    
    // Spawn new particles at specific intervals
    if (gameState.smokeTimer > SMOKE_SPAWN_RATE && gameState.running && !gameState.paused) {
        gameState.smokeTimer = 0;
        
        // Get more precise pipe location measurements
        const offsetX = sprites.player.width - gameState.dimbadimba.width;
        const offsetY = sprites.player.height - gameState.dimbadimba.height;
        
        // Fixed position where the pipe would be - right side of mouth
        // The pipe location is consistent regardless of character position/movement
        const pipeX = gameState.dimbadimba.x + gameState.dimbadimba.width * 0.85;
        const pipeY = gameState.dimbadimba.y + gameState.dimbadimba.height * 0.42;
        
        // Add new particle if we don't exceed the max
        if (gameState.smokeParticles.length < MAX_SMOKE_PARTICLES) {
            gameState.smokeParticles.push(new SmokeParticle(pipeX, pipeY));
        }
    }
    
    // Update existing particles and remove dead ones
    gameState.smokeParticles = gameState.smokeParticles.filter(particle => particle.update(deltaTime));
}
  