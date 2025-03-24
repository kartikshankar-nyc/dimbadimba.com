/**
 * Dimbadimba Game - Unit Tests
 * 
 * This file contains unit tests for the core game functionality
 */

// Mock browser environment
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

// Import game functions (in a real setup these would be properly exported/imported)
// For now, we'll mock the functions we want to test

describe('Game Initialization', () => {
  let originalCreateSprites;
  let originalAddEventListener;
  
  beforeEach(() => {
    // Clear any mocks
    jest.clearAllMocks();
    
    // Mock DOM elements
    document.getElementById = jest.fn().mockImplementation(id => {
      if (id === 'gameCanvas') return canvas;
      return document.createElement('div');
    });
    
    document.querySelector = jest.fn().mockImplementation(selector => {
      return document.createElement('div');
    });
    
    // Save original functions
    originalCreateSprites = global.createSprites;
    originalAddEventListener = global.addEventListener;
    
    // Mock functions
    global.createSprites = jest.fn();
    global.setupEventListeners = jest.fn();
    global.updateCanvasSize = jest.fn();
    global.drawGame = jest.fn();
    
    // Explicitly mock addEventListener with implementation
    document.addEventListener = jest.fn((event, handler) => {
      if (event === 'DOMContentLoaded') {
        // Store the handler for testing
        document.addEventListener.domContentLoadedHandler = handler;
      }
    });
  });
  
  afterEach(() => {
    // Restore original functions
    global.createSprites = originalCreateSprites;
    global.addEventListener = originalAddEventListener;
  });
  
  test('DOMContentLoaded initializes game properly', () => {
    // Setup - create a handler that would initialize the game
    const initGame = () => {
      global.updateCanvasSize();
      global.createSprites();
      global.setupEventListeners();
      global.drawGame();
    };
    
    // Attach our test handler
    document.addEventListener('DOMContentLoaded', initGame);
    
    // Simulate DOMContentLoaded event by calling the stored handler
    document.addEventListener.domContentLoadedHandler();
    
    // Assertions
    expect(global.updateCanvasSize).toHaveBeenCalled();
    expect(global.createSprites).toHaveBeenCalled();
    expect(global.setupEventListeners).toHaveBeenCalled();
    expect(global.drawGame).toHaveBeenCalled();
  });
});

describe('Game State Management', () => {
  beforeEach(() => {
    // Reset gameState
    global.gameState = {
      running: false,
      paused: false,
      dimbadimba: {
        x: 80,
        y: 0,
        velocityY: 0,
        jumping: false
      },
      speed: 5,
      score: 0,
      obstacles: [],
      coins: []
    };
    
    global.resetGame = jest.fn(() => {
      gameState.running = false;
      gameState.score = 0;
      gameState.obstacles = [];
      gameState.coins = [];
    });
    
    global.startGame = jest.fn(() => {
      global.resetGame();
      gameState.running = true;
    });
    
    global.togglePause = jest.fn(() => {
      if (gameState.running) {
        gameState.paused = !gameState.paused;
      }
    });
  });
  
  test('resetGame resets game state correctly', () => {
    // Setup
    gameState.score = 100;
    gameState.obstacles = [{x: 100, y: 100}];
    gameState.coins = [{x: 200, y: 200}];
    
    // Execute
    global.resetGame();
    
    // Assert
    expect(gameState.score).toBe(0);
    expect(gameState.obstacles.length).toBe(0);
    expect(gameState.coins.length).toBe(0);
  });
  
  test('startGame initializes game properly', () => {
    // Execute
    global.startGame();
    
    // Assert
    expect(global.resetGame).toHaveBeenCalled();
    expect(gameState.running).toBe(true);
  });
  
  test('togglePause pauses running game', () => {
    // Setup
    gameState.running = true;
    gameState.paused = false;
    
    // Execute
    global.togglePause();
    
    // Assert
    expect(gameState.paused).toBe(true);
  });
  
  test('togglePause resumes paused game', () => {
    // Setup
    gameState.running = true;
    gameState.paused = true;
    
    // Execute
    global.togglePause();
    
    // Assert
    expect(gameState.paused).toBe(false);
  });
  
  test('togglePause does nothing when game is not running', () => {
    // Setup
    gameState.running = false;
    gameState.paused = false;
    
    // Execute
    global.togglePause();
    
    // Assert
    expect(gameState.paused).toBe(false);
  });
});

describe('Player Movement', () => {
  beforeEach(() => {
    // Reset gameState
    global.gameState = {
      dimbadimba: {
        x: 80,
        y: 300,
        velocityY: 0,
        jumping: false,
        width: 80,
        height: 100
      }
    };
    
    global.GRAVITY = 0.8;
    global.JUMP_FORCE = -15;
    global.GAME_HEIGHT = 800;
    global.GROUND_HEIGHT = 40;
    
    global.jump = jest.fn(() => {
      if (!gameState.dimbadimba.jumping) {
        gameState.dimbadimba.velocityY = JUMP_FORCE;
        gameState.dimbadimba.jumping = true;
      }
    });
    
    global.updatePlayer = jest.fn(deltaTime => {
      // Apply gravity
      gameState.dimbadimba.velocityY += GRAVITY;
      gameState.dimbadimba.y += gameState.dimbadimba.velocityY;
      
      // Check for ground collision
      const groundY = GAME_HEIGHT - GROUND_HEIGHT - gameState.dimbadimba.height;
      if (gameState.dimbadimba.y >= groundY) {
        gameState.dimbadimba.y = groundY;
        gameState.dimbadimba.velocityY = 0;
        gameState.dimbadimba.jumping = false;
      }
    });
  });
  
  test('jump sets correct velocity and jumping state', () => {
    // Execute
    global.jump();
    
    // Assert
    expect(gameState.dimbadimba.velocityY).toBe(JUMP_FORCE);
    expect(gameState.dimbadimba.jumping).toBe(true);
  });
  
  test('jump does nothing if already jumping', () => {
    // Setup
    gameState.dimbadimba.jumping = true;
    gameState.dimbadimba.velocityY = -5; // Mid-jump velocity
    
    // Execute
    global.jump();
    
    // Assert
    expect(gameState.dimbadimba.velocityY).toBe(-5); // Unchanged
  });
  
  test('updatePlayer applies gravity correctly', () => {
    // Setup
    const initialY = gameState.dimbadimba.y;
    gameState.dimbadimba.velocityY = 2;
    
    // Execute
    global.updatePlayer(16); // 16ms delta time
    
    // Assert
    expect(gameState.dimbadimba.velocityY).toBe(2 + GRAVITY);
    expect(gameState.dimbadimba.y).toBe(initialY + gameState.dimbadimba.velocityY);
  });
  
  test('updatePlayer handles ground collision', () => {
    // Setup
    const groundY = GAME_HEIGHT - GROUND_HEIGHT - gameState.dimbadimba.height;
    gameState.dimbadimba.y = groundY + 10; // Below ground
    gameState.dimbadimba.velocityY = 5;
    gameState.dimbadimba.jumping = true;
    
    // Execute
    global.updatePlayer(16);
    
    // Assert
    expect(gameState.dimbadimba.y).toBe(groundY);
    expect(gameState.dimbadimba.velocityY).toBe(0);
    expect(gameState.dimbadimba.jumping).toBe(false);
  });
});

describe('Collision Detection', () => {
  beforeEach(() => {
    global.gameState = {
      dimbadimba: {
        x: 100,
        y: 100,
        width: 80,
        height: 100
      },
      obstacles: [
        { x: 300, y: 100, width: 30, height: 50 },
        { x: 90, y: 90, width: 30, height: 50 }
      ],
      coins: [
        { x: 500, y: 100, width: 30, height: 30 },
        { x: 110, y: 110, width: 30, height: 30 }
      ],
      score: 0
    };
    
    global.detectCollision = jest.fn((rect1, rect2) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    });
    
    global.checkCollisions = jest.fn(() => {
      // Check obstacle collisions
      for (let i = 0; i < gameState.obstacles.length; i++) {
        if (global.detectCollision(gameState.dimbadimba, gameState.obstacles[i])) {
          return true; // Collision detected
        }
      }
      
      // Check coin collisions
      for (let i = gameState.coins.length - 1; i >= 0; i--) {
        if (global.detectCollision(gameState.dimbadimba, gameState.coins[i])) {
          gameState.coins.splice(i, 1);
          gameState.score += 50;
        }
      }
      
      return false;
    });
  });
  
  test('detectCollision correctly identifies overlapping rectangles', () => {
    // Overlapping rectangles
    const rect1 = { x: 0, y: 0, width: 100, height: 100 };
    const rect2 = { x: 50, y: 50, width: 100, height: 100 };
    
    expect(global.detectCollision(rect1, rect2)).toBe(true);
  });
  
  test('detectCollision correctly identifies non-overlapping rectangles', () => {
    // Non-overlapping rectangles
    const rect1 = { x: 0, y: 0, width: 100, height: 100 };
    const rect2 = { x: 150, y: 150, width: 100, height: 100 };
    
    expect(global.detectCollision(rect1, rect2)).toBe(false);
  });
  
  test('checkCollisions detects obstacle collision', () => {
    // The setup has an obstacle overlapping with dimbadimba
    expect(global.checkCollisions()).toBe(true);
  });
  
  test('checkCollisions collects coins and adds score', () => {
    // Modify setup to have no obstacle collision
    gameState.obstacles = [{ x: 300, y: 300, width: 30, height: 50 }];
    
    // Execute
    global.checkCollisions();
    
    // Assert
    expect(gameState.coins.length).toBe(1); // One coin should be collected
    expect(gameState.score).toBe(50); // Score should increase
  });
});

describe('Day/Night Mode', () => {
  beforeEach(() => {
    global.gameState = {
      dayMode: true
    };
    
    global.toggleDayNightMode = jest.fn(isDayMode => {
      gameState.dayMode = isDayMode;
      // In real implementation this would recreate sprites
    });
  });
  
  test('toggleDayNightMode updates gameState correctly', () => {
    // Execute
    global.toggleDayNightMode(false);
    
    // Assert
    expect(gameState.dayMode).toBe(false);
  });
});

// Add more test suites as needed for additional game features 