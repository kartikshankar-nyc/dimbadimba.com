import { GameLoop } from '../GameLoop'; // Update path as needed
import { advanceByFrame, createMockGameState, createMockAudioManager, createMockGameObject } from '../../test/utils/testUtils';
import { GameObject } from '../GameState';

describe('GameLoop', () => {
  let gameLoop: GameLoop;
  let mockGameState: ReturnType<typeof createMockGameState>;
  let mockAudioManager: ReturnType<typeof createMockAudioManager>;
  
  beforeEach(() => {
    jest.useFakeTimers();
    mockGameState = createMockGameState();
    mockAudioManager = createMockAudioManager();
    gameLoop = new GameLoop(mockGameState, mockAudioManager);
    
    // Mock requestAnimationFrame to use setTimeout
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    
    // Mock performance.now to return incremental values
    let now = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => {
      now += 16.7;
      return now;
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  describe('Initialization', () => {
    test('initializes with correct state', () => {
      expect(gameLoop.isRunning).toBe(false);
      expect(gameLoop.fps).toBe(60);
      expect(gameLoop.frameTime).toBeCloseTo(16.67, 1);
    });
  });
  
  describe('Start and Stop', () => {
    test('start sets isRunning to true and starts animation frame', () => {
      gameLoop.start();
      
      expect(gameLoop.isRunning).toBe(true);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
    
    test('start does nothing if already running', () => {
      // Set up as already running
      gameLoop['_isRunning'] = true;
      const requestSpy = jest.spyOn(window, 'requestAnimationFrame');
      
      // Call start
      gameLoop.start();
      
      // Should not request another animation frame
      expect(requestSpy).not.toHaveBeenCalled();
    });
    
    test('stop sets isRunning to false and cancels animation frame', () => {
      // Set up running state
      gameLoop['_isRunning'] = true;
      gameLoop['_lastTime'] = 12345;
      
      const cancelSpy = jest.spyOn(window, 'cancelAnimationFrame');
      
      // Call stop
      gameLoop.stop();
      
      expect(gameLoop.isRunning).toBe(false);
      expect(cancelSpy).toHaveBeenCalled();
      expect(mockAudioManager.cleanup).toHaveBeenCalled();
    });
  });
  
  describe('Game Loop Update', () => {
    test('update does nothing when not running', () => {
      // Set up as not running
      gameLoop['_isRunning'] = false;
      
      // Call update
      gameLoop.update(100);
      
      // Should not request another frame
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });
    
    test('update does nothing when game is paused', () => {
      // Set up as running but game is paused
      gameLoop['_isRunning'] = true;
      mockGameState.isPaused = true;
      
      // Call update
      gameLoop.update(100);
      
      // Should not request another frame
      expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });
    
    test('update calculates delta time correctly', () => {
      // Set up as running
      gameLoop['_isRunning'] = true;
      gameLoop['_lastTime'] = 1000;
      mockGameState.isPaused = false;
      
      // Call update with current time
      gameLoop.update(1100);
      
      // Verify last time updated
      expect(gameLoop['_lastTime']).toBe(1100);
      
      // Verify frame count incremented
      expect(gameLoop['_frameCount']).toBe(1);
      
      // Verify another frame requested
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
    
    test('update calls update on all game objects', () => {
      // Set up as running
      gameLoop['_isRunning'] = true;
      mockGameState.isPaused = false;
      
      // Create game objects with update methods
      const obj1 = createMockGameObject();
      const obj2 = createMockGameObject();
      
      mockGameState.objects = [obj1, obj2];
      
      // Call update
      gameLoop.update(100);
      
      // Verify updates called
      expect(obj1.update).toHaveBeenCalled();
      expect(obj2.update).toHaveBeenCalled();
    });
    
    test('update skips objects without update method', () => {
      // Set up as running
      gameLoop['_isRunning'] = true;
      mockGameState.isPaused = false;
      
      // Create a standard object
      const obj1 = createMockGameObject();
      
      // Create object without update method
      const obj2 = {
        x: 0,
        y: 0,
        width: 50, 
        height: 50
      } as GameObject;
      
      mockGameState.objects = [obj1, obj2];
      
      // Should not throw
      expect(() => gameLoop.update(100)).not.toThrow();
      
      // Verify only valid update called
      expect(obj1.update).toHaveBeenCalled();
    });
  });
  
  describe('Game Loop Performance', () => {
    test('maintains consistent frame rate', () => {
      // Set up running state
      gameLoop['_isRunning'] = true;
      mockGameState.isPaused = false;
      
      // Start loop
      gameLoop.start();
      
      // Run several frames 
      for (let i = 0; i < 10; i++) {
        advanceByFrame();
      }
      
      // After 10 frames, time should be approximately 167ms (10 * 16.7ms)
      expect(gameLoop['_frameCount']).toBeGreaterThanOrEqual(10);
    });
    
    test('handles delta time spike gracefully', () => {
      // Set up running state
      gameLoop['_isRunning'] = true;
      mockGameState.isPaused = false;
      
      // Create game object with update
      const obj = createMockGameObject();
      mockGameState.objects = [obj];
      
      // Simulate a very large delta time (browser tab inactive scenario)
      gameLoop['_lastTime'] = 1000;
      gameLoop.update(5000); // 4 second jump
      
      // Should still have called update, but with a reasonable delta time
      // Most game loops cap delta time to prevent physics issues
      expect(obj.update).toHaveBeenCalled();
      
      // Shouldn't have passed more than 100ms to update 
      // (This depends on your implementation, adjust if different)
      const passedDeltaTime = (obj.update as jest.Mock).mock.calls[0][0];
      expect(passedDeltaTime).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Game State Integration', () => {
    test('stops loop when game over', () => {
      // Set up running state
      gameLoop.start();
      
      // Verify running
      expect(gameLoop.isRunning).toBe(true);
      
      // Trigger game over
      mockGameState.isGameOver = true;
      advanceByFrame();
      
      // Loop should have stopped
      expect(gameLoop.isRunning).toBe(false);
    });
    
    test('pauses and resumes correctly', () => {
      // Start the loop
      gameLoop.start();
      
      // Verify running
      expect(gameLoop.isRunning).toBe(true);
      
      // Pause the game
      mockGameState.isPaused = true;
      advanceByFrame();
      
      // Loop should still be "running" but not updating
      expect(gameLoop.isRunning).toBe(true);
      
      // Resume the game
      mockGameState.isPaused = false;
      advanceByFrame();
      
      // Should be running and updating again
      expect(gameLoop.isRunning).toBe(true);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });
  });
}); 