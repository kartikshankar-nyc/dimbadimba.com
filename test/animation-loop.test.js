/**
 * Unit tests for the animation loop
 */

// Create mock game environment
const mockGameState = {
  running: true,
  paused: false,
  speed: 5,
  dimbadimba: {
    velocityY: 0,
    y: 100,
    jumping: false
  },
  obstacles: [],
  coins: [],
  powerups: [],
  activePowerups: {},
  timeSinceLastObstacle: 0,
  timeSinceLastCoin: 0,
  timeSinceLastPowerup: 0,
  backgroundPos: [0, 0, 0, 0],
  backgroundSpeed: [0.2, 0.5, 1, 2],
  scoreMultiplier: 1
};

// Mock update functions
const mockUpdatePlayer = jest.fn();
const mockUpdateObstacles = jest.fn();
const mockUpdateCoins = jest.fn();
const mockUpdatePowerups = jest.fn();
const mockUpdateBackground = jest.fn();
const mockCheckCollisions = jest.fn();
const mockDrawGame = jest.fn();

// Animation frame ID and lastTime for animation loop
let animationFrameId = null;
let lastTime = 0;

// Import the animationLoop function implementation
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
  
  try {
    // Update game elements
    updatePlayer(deltaTime);
    updateObstacles(deltaTime);
    updateCoins(deltaTime);
    updatePowerups(deltaTime);
    updateBackground();
    checkCollisions();
    
    // Increase game speed over time
    gameState.speed += 0.0001 * deltaTime;
    
    // Draw everything
    drawGame();
  } catch (e) {
    console.error("Error in game loop:", e);
  }
}

// Set up global objects for testing
global.gameState = mockGameState;
global.updatePlayer = mockUpdatePlayer;
global.updateObstacles = mockUpdateObstacles;
global.updateCoins = mockUpdateCoins;
global.updatePowerups = mockUpdatePowerups;
global.updateBackground = mockUpdateBackground;
global.checkCollisions = mockCheckCollisions;
global.drawGame = mockDrawGame;

// Mock console.error to avoid polluting test output
const originalConsoleError = console.error;
console.error = jest.fn();

describe('animationLoop function', () => {
  beforeEach(() => {
    // Reset game state before each test
    mockGameState.running = true;
    mockGameState.paused = false;
    mockGameState.speed = 5;
    animationFrameId = null;
    lastTime = 0;
    
    // Clear mocks
    jest.clearAllMocks();
    requestAnimationFrame.mockClear();
  });
  
  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  test('should schedule next animation frame and update game when running and not paused', () => {
    // Call animation loop with timestamp
    animationLoop(1000);
    
    // Verify that requestAnimationFrame was called
    expect(requestAnimationFrame).toHaveBeenCalledWith(animationLoop);
    
    // Verify that update functions were called
    expect(mockUpdatePlayer).toHaveBeenCalled();
    expect(mockUpdateObstacles).toHaveBeenCalled();
    expect(mockUpdateCoins).toHaveBeenCalled();
    expect(mockUpdatePowerups).toHaveBeenCalled();
    expect(mockUpdateBackground).toHaveBeenCalled();
    expect(mockCheckCollisions).toHaveBeenCalled();
    expect(mockDrawGame).toHaveBeenCalled();
    
    // Verify that lastTime was updated
    expect(lastTime).toBe(1000);
  });
  
  test('should only draw game when paused', () => {
    // Set paused state
    mockGameState.paused = true;
    
    // Call animation loop
    animationLoop(1000);
    
    // Verify that requestAnimationFrame was called
    expect(requestAnimationFrame).toHaveBeenCalledWith(animationLoop);
    
    // Verify that only drawGame was called
    expect(mockDrawGame).toHaveBeenCalled();
    expect(mockUpdatePlayer).not.toHaveBeenCalled();
    expect(mockUpdateObstacles).not.toHaveBeenCalled();
    
    // Verify that lastTime was not updated
    expect(lastTime).toBe(0);
  });
  
  test('should stop animation loop when game is not running', () => {
    // Set game state to not running
    mockGameState.running = false;
    
    // Call animation loop
    animationLoop(1000);
    
    // Verify that requestAnimationFrame was not called
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    
    // Verify that no update functions were called
    expect(mockUpdatePlayer).not.toHaveBeenCalled();
    expect(mockDrawGame).not.toHaveBeenCalled();
    
    // Verify that animationFrameId was reset
    expect(animationFrameId).toBe(null);
  });
  
  test('should use default deltaTime (16ms) when lastTime is 0', () => {
    // Ensure lastTime is 0
    lastTime = 0;
    
    // Call animation loop
    animationLoop(1000);
    
    // Verify that updatePlayer was called with default delta time
    expect(mockUpdatePlayer).toHaveBeenCalledWith(16);
    
    // Verify that lastTime was updated
    expect(lastTime).toBe(1000);
  });
  
  test('should cap deltaTime at 100ms for large time jumps', () => {
    // Set lastTime to create a large delta
    lastTime = 500;
    
    // Call animation loop with a timestamp far in the future
    animationLoop(1000);
    
    // Verify that updatePlayer was called with capped delta time
    expect(mockUpdatePlayer).toHaveBeenCalledWith(100);
    
    // Verify that lastTime was updated
    expect(lastTime).toBe(1000);
  });
  
  test('should handle errors in update functions gracefully', () => {
    // Make one of the update functions throw an error
    mockUpdatePlayer.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    // Call animation loop
    animationLoop(1000);
    
    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Verify that the animation loop still requests the next frame
    expect(requestAnimationFrame).toHaveBeenCalledWith(animationLoop);
  });
}); 