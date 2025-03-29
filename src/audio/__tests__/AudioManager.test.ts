import { AudioManager } from '../AudioManager';

describe('AudioManager', () => {
  let audioManager: AudioManager;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    audioManager = new AudioManager();
  });
  
  describe('Basic Functionality', () => {
    test('initializes with default values', () => {
      expect(audioManager['sounds']).toBeInstanceOf(Map);
      expect(audioManager['sounds'].size).toBe(0);
      expect(audioManager['volume']).toBe(1.0);
    });
  });
  
  describe('Volume Control', () => {
    test('setVolume updates volume property', () => {
      audioManager.setVolume(0.5);
      expect(audioManager['volume']).toBe(0.5);
    });
    
    test('setVolume clamps values to valid range', () => {
      // Test too low
      audioManager.setVolume(-0.5);
      expect(audioManager['volume']).toBe(0);
      
      // Test too high
      audioManager.setVolume(1.5);
      expect(audioManager['volume']).toBe(1);
    });
  });
  
  describe('Sound Management with Mocks', () => {
    test('playSound does nothing for non-existent sounds', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      
      // Should not throw an error
      audioManager.playSound('nonExistentSound');
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
    
    test('stopSound does nothing for non-existent sounds', () => {
      // Should not throw an error
      audioManager.stopSound('nonExistentSound');
      
      // Just verify it runs without error
      expect(true).toBe(true);
    });
    
    test('cleanup clears the sounds map', () => {
      // Mock the context
      audioManager['context'] = {
        close: jest.fn().mockResolvedValue(undefined)
      } as unknown as AudioContext;
      
      audioManager.cleanup();
      
      expect(audioManager['sounds'].size).toBe(0);
      expect(audioManager['context']!.close).toHaveBeenCalled();
    });
  });
  
  describe('Creating oscillator', () => {
    test('createOscillator does nothing when context is null', () => {
      // Ensure context is null
      audioManager['context'] = null;
      
      // Should not throw
      audioManager.createOscillator(440, 0.5);
      
      // Just verify code runs without error
      expect(true).toBe(true);
    });
  });
}); 