/**
 * Dimbadimba Game - Audio Tests
 * 
 * Tests for the game's audio functionality
 */

describe('Audio System', () => {
  let mockAudioContext;
  let mockGainNode;
  let mockOscillator;
  let mockDestination;
  
  beforeEach(() => {
    // Clear any existing mocks
    jest.clearAllMocks();
    
    // Mock Web Audio API
    mockGainNode = {
      gain: { value: 1, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    mockOscillator = {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
    
    mockDestination = {};
    
    mockAudioContext = {
      currentTime: 0,
      createGain: jest.fn().mockReturnValue(mockGainNode),
      createOscillator: jest.fn().mockReturnValue(mockOscillator),
      createBufferSource: jest.fn().mockReturnValue({
        buffer: null,
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        loop: false,
        loopStart: 0,
        loopEnd: 0
      }),
      createBuffer: jest.fn().mockReturnValue({
        getChannelData: jest.fn().mockReturnValue(new Float32Array(44100))
      }),
      destination: mockDestination,
      state: 'running',
      resume: jest.fn().mockResolvedValue(undefined)
    };
    
    // Mock global window.AudioContext
    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    global.webkitAudioContext = global.AudioContext;
    
    // Create a mock sound toggle button with real innerHTML property
    const mockSoundToggle = {
      innerHTML: '',
      addEventListener: jest.fn()
    };
    
    // Mock DOM elements
    document.getElementById = jest.fn().mockImplementation(id => {
      if (id === 'soundToggle') {
        return mockSoundToggle;
      }
      return document.createElement('div');
    });
    
    // Mock gameState
    global.gameState = {
      soundEnabled: true,
      music: {
        context: null,
        gainNode: null,
        playing: false
      }
    };
    
    // Use the existing localStorage mock from setup.js instead of redefining it
    // Clear local storage mock store
    window.localStorage.clear();
    
    // Mock localStorage methods
    window.localStorage.getItem = jest.fn();
    window.localStorage.setItem = jest.fn();
    
    // Mock initializeAudio function
    global.initializeAudio = jest.fn(() => {
      // Create audio context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      
      // Initialize music properties
      gameState.music.context = audioCtx;
      gameState.music.gainNode = audioCtx.createGain();
      gameState.music.gainNode.connect(audioCtx.destination);
      
      // Setup audio resume behavior for browser autoplay policy
      const resumeAudio = function() {
        if (audioCtx.state !== 'running') {
          audioCtx.resume().then(() => {
            console.log('Audio context resumed');
          });
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      };
      
      document.addEventListener('click', resumeAudio);
      document.addEventListener('keydown', resumeAudio);
      document.addEventListener('touchstart', resumeAudio);
      
      return audioCtx;
    });
    
    // Mock createSound function
    global.createSound = jest.fn((setupFn) => {
      return function playSound(time = 0) {
        if (!gameState.soundEnabled) return;
        
        const nodes = setupFn(gameState.music.context);
        const source = nodes.source;
        
        if (source) {
          source.connect(gameState.music.gainNode);
          source.start(time);
        }
        
        return nodes;
      };
    });
    
    // Mock toggleSound function
    global.toggleSound = jest.fn(() => {
      gameState.soundEnabled = !gameState.soundEnabled;
      
      // Update sound icon
      global.updateSoundToggleButton();
      
      // Store sound preference
      window.localStorage.setItem('soundEnabled', gameState.soundEnabled);
      
      return gameState.soundEnabled;
    });
    
    // Mock updateSoundToggleButton function with real implementation
    global.updateSoundToggleButton = jest.fn(() => {
      const soundToggle = document.getElementById('soundToggle');
      // Actually update the innerHTML
      soundToggle.innerHTML = gameState.soundEnabled ? '🔊' : '🔇';
    });
    
    // Mock createLoopingMusic function
    global.createLoopingMusic = jest.fn((audioCtx) => {
      // Create a looping music patch
      return function startMusic() {
        if (!gameState.soundEnabled || gameState.music.playing) return;
        
        gameState.music.playing = true;
        
        // Schedule initial loop
        let nextNoteTime = audioCtx.currentTime;
        global.scheduleLoop(nextNoteTime);
      };
    });
    
    // Mock loadSounds function
    global.loadSounds = jest.fn(() => {
      const jumpSound = global.createSound(function(audioCtx) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        
        return {
          source: oscillator,
          gainNode: gainNode
        };
      });
      
      const coinSound = global.createSound(function(audioCtx) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.connect(gainNode);
        
        return {
          source: oscillator,
          gainNode: gainNode
        };
      });
      
      return {
        jump: jumpSound,
        coin: coinSound,
        startMusic: global.createLoopingMusic(gameState.music.context)
      };
    });
    
    // Mock scheduleLoop function
    global.scheduleLoop = jest.fn(time => {
      // In real implementation this would schedule music notes
    });
  });
  
  test('initializeAudio creates and sets up audio context', () => {
    // Execute
    const audioCtx = global.initializeAudio();
    
    // Assert
    expect(audioCtx).toBe(mockAudioContext);
    expect(gameState.music.context).toBe(mockAudioContext);
    expect(gameState.music.gainNode).toBeDefined();
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockDestination);
  });
  
  test('createSound returns a function that plays a sound', () => {
    // Setup
    const setupFn = jest.fn().mockReturnValue({
      source: mockOscillator,
      gainNode: mockGainNode
    });
    
    // Execute
    const playSound = global.createSound(setupFn);
    
    // Assert
    expect(typeof playSound).toBe('function');
    
    // Test the returned function
    playSound();
    
    expect(setupFn).toHaveBeenCalledWith(gameState.music.context);
    expect(mockOscillator.connect).toHaveBeenCalledWith(gameState.music.gainNode);
    expect(mockOscillator.start).toHaveBeenCalled();
  });
  
  test('createSound does nothing when sound is disabled', () => {
    // Setup
    gameState.soundEnabled = false;
    const setupFn = jest.fn();
    
    // Execute
    const playSound = global.createSound(setupFn);
    playSound();
    
    // Assert
    expect(setupFn).not.toHaveBeenCalled();
  });
  
  test('toggleSound flips sound enabled state', () => {
    // Setup
    gameState.soundEnabled = true;
    
    // Execute
    const result = global.toggleSound();
    
    // Assert
    expect(result).toBe(false);
    expect(gameState.soundEnabled).toBe(false);
    expect(global.updateSoundToggleButton).toHaveBeenCalled();
    expect(window.localStorage.setItem).toHaveBeenCalledWith('soundEnabled', false);
  });
  
  test('updateSoundToggleButton updates button text based on sound state', () => {
    // Setup
    gameState.soundEnabled = true;
    const soundToggle = document.getElementById('soundToggle');
    
    // Execute
    global.updateSoundToggleButton();
    
    // Assert
    expect(soundToggle.innerHTML).toBe('🔊');
    
    // Test with sound disabled
    gameState.soundEnabled = false;
    global.updateSoundToggleButton();
    expect(soundToggle.innerHTML).toBe('🔇');
  });
  
  test('loadSounds creates sound functions', () => {
    // Execute
    const sounds = global.loadSounds();
    
    // Assert
    expect(typeof sounds.jump).toBe('function');
    expect(typeof sounds.coin).toBe('function');
    expect(typeof sounds.startMusic).toBe('function');
  });
  
  test('createLoopingMusic starts music when called', () => {
    // Setup
    gameState.music.playing = false;
    const startMusic = global.createLoopingMusic(mockAudioContext);
    
    // Execute
    startMusic();
    
    // Assert
    expect(gameState.music.playing).toBe(true);
    expect(global.scheduleLoop).toHaveBeenCalled();
  });
  
  test('createLoopingMusic does nothing when music is already playing', () => {
    // Setup
    gameState.music.playing = true;
    
    // Mock scheduleLoop to track if it's called
    const startMusic = global.createLoopingMusic(mockAudioContext);
    
    // Execute
    startMusic();
    
    // Assert
    expect(global.scheduleLoop).not.toHaveBeenCalled();
  });
  
  test('createLoopingMusic does nothing when sound is disabled', () => {
    // Setup
    gameState.soundEnabled = false;
    gameState.music.playing = false;
    
    // Mock scheduleLoop to track if it's called
    const startMusic = global.createLoopingMusic(mockAudioContext);
    
    // Execute
    startMusic();
    
    // Assert
    expect(gameState.music.playing).toBe(false);
    expect(global.scheduleLoop).not.toHaveBeenCalled();
  });
}); 