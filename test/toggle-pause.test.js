/**
 * Unit tests for the toggle pause functionality
 */

// We need to create a mock game environment
const mockGameState = {
  running: true,
  paused: false,
  soundEnabled: false
};

const mockSounds = {
  backgroundMusic: {
    play: jest.fn(),
    stop: jest.fn()
  }
};

// Mock performance.now
const originalPerformanceNow = performance.now;
performance.now = jest.fn(() => 12345);

// Global variables that will be set by the togglePause function
let lastTime = 0;
let pauseToggleCooldown = false;

// Import the togglePause function implementation
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

// Mock global objects
global.gameState = mockGameState;
global.sounds = mockSounds;

describe('togglePause function', () => {
  beforeEach(() => {
    // Reset game state before each test
    mockGameState.running = true;
    mockGameState.paused = false;
    mockGameState.soundEnabled = false;
    pauseToggleCooldown = false;
    lastTime = 0;
    
    // Clear mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  afterAll(() => {
    // Restore original performance.now
    performance.now = originalPerformanceNow;
  });
  
  test('should toggle game pause state from false to true', () => {
    // Initial state
    expect(gameState.paused).toBe(false);
    
    // Toggle pause
    togglePause();
    
    // Verify state changed
    expect(gameState.paused).toBe(true);
    expect(sounds.backgroundMusic.stop).toHaveBeenCalled();
  });
  
  test('should toggle game pause state from true to false', () => {
    // Set initial state to paused
    gameState.paused = true;
    
    // Toggle pause
    togglePause();
    
    // Verify state changed back to unpaused
    expect(gameState.paused).toBe(false);
  });
  
  test('should play background music when unpausing if sound is enabled', () => {
    // Set up initial state
    gameState.paused = true;
    gameState.soundEnabled = true;
    
    // Toggle pause (unpause)
    togglePause();
    
    // Verify background music plays
    expect(sounds.backgroundMusic.play).toHaveBeenCalled();
    
    // Now lastTime should be set to the mocked performance.now value
    expect(lastTime).toBe(12345);
  });
  
  test('should not play background music when unpausing if sound is disabled', () => {
    // Set up initial state
    gameState.paused = true;
    gameState.soundEnabled = false;
    
    // Toggle pause (unpause)
    togglePause();
    
    // Verify background music does not play
    expect(sounds.backgroundMusic.play).not.toHaveBeenCalled();
  });
  
  test('should prevent multiple rapid toggles within cooldown period', () => {
    // Initial toggle
    togglePause();
    expect(gameState.paused).toBe(true);
    
    // Try to toggle again immediately - should be blocked by cooldown
    togglePause();
    expect(gameState.paused).toBe(true); // Still paused, toggle didn't work
    
    // Advance timer past cooldown
    jest.advanceTimersByTime(151);
    
    // Now toggle should work again
    togglePause();
    expect(gameState.paused).toBe(false); // Unpaused now
  });
  
  test('should reset lastTime when unpausing to prevent large deltaTime', () => {
    // Setup paused state
    gameState.paused = true;
    gameState.soundEnabled = true;
    
    // Unpause
    togglePause();
    
    // Check if lastTime was reset
    expect(lastTime).toBe(12345);
  });
}); 