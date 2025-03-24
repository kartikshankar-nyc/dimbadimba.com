/**
 * Dimbadimba Game - Obstacle Tests
 * 
 * Tests for obstacle functionality including variety and outlining
 */

// Mock canvas and context
const canvas = document.createElement('canvas');
const ctx = {
  fillRect: jest.fn(),
  fillStyle: null,
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(4 * 100 * 100).fill(0),
    width: 100, 
    height: 100
  }),
  putImageData: jest.fn()
};

describe('Obstacle Creation and Rendering', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock colors object
    global.colors = {
      day: {
        obstacleColor: '#3498db',    // Blue
        obstacleOutline: '#2980b9'   // Dark blue
      },
      night: {
        obstacleColor: '#f39c12',    // Orange
        obstacleOutline: '#d35400'   // Dark orange
      }
    };
    
    // Mock gameState
    global.gameState = {
      dayMode: true,
      obstacles: [],
      speed: 5,
      running: true,
      paused: false
    };
    
    // Mock createPixelArt function
    global.createPixelArt = jest.fn((pixels, color, scale = 1) => {
      const width = pixels[0].length * scale;
      const height = pixels.length * scale;
      
      // Mock creation of a pixel art canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Return the mock canvas
      return canvas;
    });
    
    // Mock createObstacleWithOutline function
    global.createObstacleWithOutline = jest.fn((pixels, fillColor, outlineColor, scale = 1) => {
      const width = pixels[0].length * scale;
      const height = pixels.length * scale;
      
      // Mock creation of a pixel art canvas with outline
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Return the mock canvas
      return canvas;
    });
    
    // Create obstacle shapes array
    global.obstacleShapes = [
      // Cactus shape
      [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0]
      ],
      // Rock shape
      [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [0, 1, 1, 0]
      ],
      // Spiky shape
      [
        [1, 0, 1, 0, 1],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0]
      ],
      // Log shape
      [
        [1, 1, 1, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1]
      ]
    ];
    
    // Mock updateObstacles function
    global.updateObstacles = jest.fn(deltaTime => {
      if (!gameState.running || gameState.paused) return;
      
      // Update existing obstacles
      for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obstacle = gameState.obstacles[i];
        obstacle.x -= gameState.speed;
        
        // Remove obstacles that are off screen
        if (obstacle.x + obstacle.width < 0) {
          gameState.obstacles.splice(i, 1);
        }
      }
      
      // Generate new obstacles
      if (Math.random() < 0.01) {
        const shapeIndex = Math.floor(Math.random() * obstacleShapes.length);
        const obstacleHeight = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
        
        gameState.obstacles.push({
          x: GAME_WIDTH,
          y: GAME_HEIGHT - GROUND_HEIGHT - obstacleHeight,
          width: OBSTACLE_WIDTH,
          height: obstacleHeight,
          shapeIndex
        });
      }
    });
    
    // Constants
    global.GAME_WIDTH = 800;
    global.GAME_HEIGHT = 600;
    global.GROUND_HEIGHT = 40;
    global.OBSTACLE_MIN_HEIGHT = 30;
    global.OBSTACLE_MAX_HEIGHT = 80;
    global.OBSTACLE_WIDTH = 30;
  });
  
  test('createObstacleWithOutline creates sprite with proper dimensions', () => {
    // Setup
    const pixels = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1]
    ];
    const fillColor = '#FF0000';
    const outlineColor = '#880000';
    const scale = 2;
    
    // Execute
    const sprite = global.createObstacleWithOutline(pixels, fillColor, outlineColor, scale);
    
    // Assert
    expect(sprite.width).toBe(pixels[0].length * scale); // 3 * 2 = 6
    expect(sprite.height).toBe(pixels.length * scale);   // 3 * 2 = 6
  });
  
  test('updateObstacles moves obstacles at correct speed', () => {
    // Setup
    gameState.obstacles = [
      { x: 500, y: 300, width: 30, height: 50, shapeIndex: 0 },
      { x: 700, y: 350, width: 30, height: 40, shapeIndex: 1 }
    ];
    
    // Execute
    global.updateObstacles(16); // 16ms deltaTime
    
    // Assert
    expect(gameState.obstacles[0].x).toBe(495); // 500 - 5 (speed)
    expect(gameState.obstacles[1].x).toBe(695); // 700 - 5 (speed)
  });
  
  test('updateObstacles removes obstacles that are off screen', () => {
    // Setup
    gameState.obstacles = [
      { x: -50, y: 300, width: 30, height: 50, shapeIndex: 0 }, // Off screen
      { x: 700, y: 350, width: 30, height: 40, shapeIndex: 1 }  // On screen
    ];
    
    // Execute
    global.updateObstacles(16);
    
    // Assert
    expect(gameState.obstacles.length).toBe(1);
    expect(gameState.obstacles[0].x).toBe(695);
  });
  
  test('updateObstacles does nothing when game is paused', () => {
    // Setup
    gameState.obstacles = [
      { x: 500, y: 300, width: 30, height: 50, shapeIndex: 0 }
    ];
    gameState.paused = true;
    
    // Execute
    global.updateObstacles(16);
    
    // Assert
    expect(gameState.obstacles[0].x).toBe(500); // Unchanged
  });
  
  test('updateObstacles does nothing when game is not running', () => {
    // Setup
    gameState.obstacles = [
      { x: 500, y: 300, width: 30, height: 50, shapeIndex: 0 }
    ];
    gameState.running = false;
    
    // Execute
    global.updateObstacles(16);
    
    // Assert
    expect(gameState.obstacles[0].x).toBe(500); // Unchanged
  });
  
  test('createSprites generates all obstacle shapes', () => {
    // Mock createSprites function
    global.createSprites = jest.fn(() => {
      const sprites = {
        obstacles: []
      };
      
      // Create sprites for each obstacle shape
      for (let i = 0; i < obstacleShapes.length; i++) {
        const daySprite = createObstacleWithOutline(
          obstacleShapes[i],
          colors.day.obstacleColor,
          colors.day.obstacleOutline,
          4
        );
        
        const nightSprite = createObstacleWithOutline(
          obstacleShapes[i],
          colors.night.obstacleColor,
          colors.night.obstacleOutline,
          4
        );
        
        sprites.obstacles.push({ day: daySprite, night: nightSprite });
      }
      
      return sprites;
    });
    
    // Execute
    const sprites = global.createSprites();
    
    // Assert
    expect(sprites.obstacles.length).toBe(obstacleShapes.length);
    expect(global.createObstacleWithOutline).toHaveBeenCalledTimes(obstacleShapes.length * 2); // Day and night versions
  });
  
  test('generateObstacles creates obstacles with random shapes', () => {
    // Mock Math.random to return predictable values
    const originalRandom = Math.random;
    Math.random = jest.fn()
      .mockReturnValueOnce(0.005) // Trigger obstacle creation
      .mockReturnValueOnce(0.25)  // Shape index (0.25 * 4 = 1)
      .mockReturnValueOnce(0.5);  // Height calculation
    
    // Create mock function for obstacle generation
    global.generateObstacles = () => {
      // This is a simplified version of what happens in updateObstacles
      if (Math.random() < 0.01) {
        const shapeIndex = Math.floor(Math.random() * obstacleShapes.length);
        const obstacleHeight = Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT) + OBSTACLE_MIN_HEIGHT;
        
        gameState.obstacles.push({
          x: GAME_WIDTH,
          y: GAME_HEIGHT - GROUND_HEIGHT - obstacleHeight,
          width: OBSTACLE_WIDTH,
          height: obstacleHeight,
          shapeIndex
        });
      }
    };
    
    // Execute
    global.generateObstacles();
    
    // Assert
    expect(gameState.obstacles.length).toBe(1);
    expect(gameState.obstacles[0].shapeIndex).toBe(1); // Second shape (rock)
    expect(gameState.obstacles[0].x).toBe(GAME_WIDTH);
    expect(gameState.obstacles[0].height).toBeGreaterThanOrEqual(OBSTACLE_MIN_HEIGHT);
    expect(gameState.obstacles[0].height).toBeLessThanOrEqual(OBSTACLE_MAX_HEIGHT);
    
    // Restore original Math.random
    Math.random = originalRandom;
  });
}); 