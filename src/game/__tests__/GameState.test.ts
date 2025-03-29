import { GameState } from '../GameState'; // Update path as needed
import { advanceByTime } from '../../test/utils/testUtils';

// Mock the localStorage
let localStorageMock: Record<string, string> = {};

beforeEach(() => {
  // Reset the mock localStorage before each test
  localStorageMock = {};
  
  // Mock localStorage methods
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => {
    return localStorageMock[key] || null;
  });
  
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    localStorageMock[key] = String(value);
  });
  
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => {
    delete localStorageMock[key];
  });
  
  jest.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    localStorageMock = {};
  });
});

describe('GameState', () => {
  describe('Initialization', () => {
    test('initializes with default values', () => {
      const gameState = new GameState();
      
      expect(gameState.score).toBe(0);
      expect(gameState.highScore).toBe(0);
      expect(gameState.lives).toBe(3);
      expect(gameState.level).toBe(1);
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.isPaused).toBe(false);
      expect(gameState.running).toBe(false);
      expect(gameState.soundEnabled).toBe(true);
      expect(gameState.difficulty).toBe(1.0);
      expect(gameState.player).toBeDefined();
      expect(gameState.objects).toHaveLength(0);
    });

    test('loads saved state from localStorage if available', () => {
      // Setup mock saved state
      const savedState = {
        score: 100,
        highScore: 200,
        lives: 2,
        level: 2,
        isGameOver: false,
        isPaused: true,
        running: false,
        soundEnabled: false,
        difficulty: 1.2
      };
      
      localStorageMock['gameState'] = JSON.stringify(savedState);
      
      const gameState = new GameState();
      
      // Check state loaded from localStorage
      expect(gameState.score).toBe(100);
      expect(gameState.highScore).toBe(200);
      expect(gameState.lives).toBe(2);
      expect(gameState.level).toBe(2);
      expect(gameState.isPaused).toBe(true);
      expect(gameState.soundEnabled).toBe(false);
      expect(gameState.difficulty).toBe(1.2);
    });

    test('handles invalid localStorage data gracefully', () => {
      // Set invalid JSON
      localStorageMock['gameState'] = 'invalid json';
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const gameState = new GameState();
      
      // Should fallback to defaults
      expect(gameState.score).toBe(0);
      expect(gameState.highScore).toBe(0);
      expect(gameState.lives).toBe(3);
      
      // Should log error
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Score Management', () => {
    test('addPoints increases score', () => {
      const gameState = new GameState();
      
      gameState.addPoints(10);
      expect(gameState.score).toBe(10);
      
      gameState.addPoints(20);
      expect(gameState.score).toBe(30);
    });

    test('addPoints updates high score when current score exceeds it', () => {
      const gameState = new GameState();
      gameState.highScore = 50;
      
      gameState.addPoints(40);
      expect(gameState.highScore).toBe(50); // Unchanged
      
      gameState.addPoints(20);
      expect(gameState.highScore).toBe(60); // Updated
    });

    test('addPoints handles negative points by preventing score below zero', () => {
      const gameState = new GameState();
      gameState.score = 20;
      
      gameState.addPoints(-10);
      expect(gameState.score).toBe(10);
      
      gameState.addPoints(-20);
      expect(gameState.score).toBe(0); // Won't go negative
    });

    test('addPoints adds extra life at score thresholds', () => {
      const gameState = new GameState();
      gameState.score = 990;
      gameState.lives = 2;
      
      gameState.addPoints(10);
      expect(gameState.lives).toBe(3); // Extra life at 1000
      
      gameState.addPoints(990);
      expect(gameState.lives).toBe(4); // Extra life at 2000
    });

    test('addPoints increases difficulty at level thresholds', () => {
      const gameState = new GameState();
      gameState.score = 1990;
      
      gameState.addPoints(10);
      expect(gameState.level).toBe(2);
      expect(gameState.difficulty).toBeCloseTo(1.2);
      
      gameState.score = 3990;
      gameState.addPoints(10);
      expect(gameState.level).toBe(3);
      expect(gameState.difficulty).toBeCloseTo(1.4);
    });
  });

  describe('Game State Transitions', () => {
    test('pause sets isPaused to true and running to false', () => {
      const gameState = new GameState();
      gameState.isPaused = false;
      gameState.running = true;
      
      gameState.pause();
      
      expect(gameState.isPaused).toBe(true);
      expect(gameState.running).toBe(false);
    });

    test('resume sets isPaused to false and running to true', () => {
      const gameState = new GameState();
      gameState.isPaused = true;
      gameState.running = false;
      
      gameState.resume();
      
      expect(gameState.isPaused).toBe(false);
      expect(gameState.running).toBe(true);
    });

    test('playerDied decreases lives', () => {
      const gameState = new GameState();
      gameState.lives = 3;
      
      gameState.playerDied();
      
      expect(gameState.lives).toBe(2);
    });

    test('playerDied sets game over when lives reach zero', () => {
      const gameState = new GameState();
      gameState.lives = 1;
      gameState.isGameOver = false;
      
      gameState.playerDied();
      
      expect(gameState.lives).toBe(0);
      expect(gameState.isGameOver).toBe(true);
      expect(gameState.running).toBe(false);
    });

    test('reset restores default game state', () => {
      const gameState = new GameState();
      
      // Modify state
      gameState.score = 100;
      gameState.lives = 1;
      gameState.level = 3;
      gameState.isGameOver = true;
      gameState.isPaused = true;
      gameState.addObject({ x: 10, y: 10, width: 20, height: 20 });
      
      // Reset state
      gameState.reset();
      
      // Verify defaults restored
      expect(gameState.score).toBe(0);
      expect(gameState.lives).toBe(3);
      expect(gameState.level).toBe(1);
      expect(gameState.isGameOver).toBe(false);
      expect(gameState.isPaused).toBe(false);
      expect(gameState.objects).toHaveLength(0);
    });
  });

  describe('Object Management', () => {
    test('addObject adds object to objects array', () => {
      const gameState = new GameState();
      const obj = { x: 10, y: 20, width: 30, height: 40 };
      
      gameState.addObject(obj);
      
      expect(gameState.objects).toHaveLength(1);
      expect(gameState.objects[0]).toBe(obj);
    });

    test('removeObject removes object from objects array', () => {
      const gameState = new GameState();
      const obj1 = { x: 10, y: 20, width: 30, height: 40 };
      const obj2 = { x: 50, y: 60, width: 30, height: 40 };
      
      gameState.addObject(obj1);
      gameState.addObject(obj2);
      
      gameState.removeObject(obj1);
      
      expect(gameState.objects).toHaveLength(1);
      expect(gameState.objects[0]).toBe(obj2);
    });

    test('removeObject handles non-existent objects gracefully', () => {
      const gameState = new GameState();
      const obj1 = { x: 10, y: 20, width: 30, height: 40 };
      const obj2 = { x: 50, y: 60, width: 30, height: 40 };
      
      gameState.addObject(obj1);
      
      // Should not throw error
      gameState.removeObject(obj2);
      
      expect(gameState.objects).toHaveLength(1);
      expect(gameState.objects[0]).toBe(obj1);
    });
  });

  describe('Persistence', () => {
    test('state changes are saved to localStorage', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      const gameState = new GameState();
      
      gameState.addPoints(10);
      expect(setItemSpy).toHaveBeenCalled();
      
      const savedData = JSON.parse(localStorageMock['gameState']);
      expect(savedData.score).toBe(10);
      
      setItemSpy.mockClear();
      
      gameState.pause();
      expect(setItemSpy).toHaveBeenCalled();
      
      const pausedData = JSON.parse(localStorageMock['gameState']);
      expect(pausedData.isPaused).toBe(true);
    });

    test('handles localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const gameState = new GameState();
      
      // Should not throw error
      gameState.addPoints(10);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
}); 