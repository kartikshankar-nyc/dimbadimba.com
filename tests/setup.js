/**
 * Test Setup for Dimbadimba Game
 * 
 * This file sets up the testing environment including mock browser APIs
 */

// Create some basic DOM elements that the game needs
document.body.innerHTML = `
<div class="game-container">
  <div class="game-header">
    <div class="game-title">DIMBADIMBA - PIXEL RUNNER</div>
    <div class="score-container">
      <div>SCORE: <span id="score">0</span></div>
      <div>HIGH: <span id="highScore">0</span></div>
    </div>
    <button id="soundToggle" class="sound-toggle">🔊</button>
  </div>
  <div class="game-area">
    <canvas id="gameCanvas"></canvas>
    <div id="startScreen" class="overlay">
      <h1>DIMBADIMBA - PIXEL RUNNER</h1>
      <div class="character-intro">
        <div class="character-display" id="characterDisplay"></div>
        <p class="game-description">
          Help Dimbadimba navigate through obstacles by jumping over them. 
          Collect coins to increase your score!
        </p>
      </div>
      <div class="mode-selection">
        <p>SELECT MODE:</p>
        <div class="mode-buttons">
          <button id="dayModeBtn" class="selected">
            <div class="mode-icon">☀️</div>
            <div class="mode-text">DAY</div>
          </button>
          <button id="nightModeBtn">
            <div class="mode-icon">🌙</div>
            <div class="mode-text">NIGHT</div>
          </button>
        </div>
      </div>
      <button id="startButton">START GAME</button>
      <div class="instructions">
        Press SPACE to jump or tap the screen on mobile.
      </div>
    </div>
    <div id="gameOverScreen" class="overlay hidden">
      <h1>GAME OVER</h1>
      <h2>FINAL SCORE:</h2>
      <div id="finalScore">0</div>
      <button id="restartButton">PLAY AGAIN</button>
    </div>
    <div id="orientation-message" class="hidden"></div>
    <div class="controls">
      SPACE = Jump<br>
      P = Pause
    </div>
  </div>
</div>
`;

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    },
    removeItem: function(key) {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock canvas methods
window.HTMLCanvasElement.prototype.getContext = function() {
  return {
    canvas: this,
    fillStyle: '',
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray(4 * 100 * 100).fill(0),
      width: 100,
      height: 100
    }),
    putImageData: jest.fn(),
    createLinearGradient: jest.fn().mockReturnValue({
      addColorStop: jest.fn()
    })
  };
};

// Mock browser requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Mock Audio API
class AudioMock {
  constructor() {
    this.paused = true;
    this.volume = 1;
    this.muted = false;
    this.currentTime = 0;
    this.duration = 0;
    this.src = '';
    this.loop = false;
    this.play = jest.fn().mockImplementation(() => {
      this.paused = false;
      return Promise.resolve();
    });
    this.pause = jest.fn().mockImplementation(() => {
      this.paused = true;
    });
  }
}

global.Audio = AudioMock;

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation(query => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
});

// Mock console methods
global.console = {
  ...global.console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Set up custom test utilities
global.testUtils = {
  triggerKeyEvent: function(eventType, keyCode, target = document) {
    const event = new KeyboardEvent(eventType, {
      bubbles: true,
      cancelable: true,
      keyCode: keyCode
    });
    target.dispatchEvent(event);
  },
  
  triggerMouseEvent: function(eventType, target = document) {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(event);
  },
  
  triggerTouchEvent: function(eventType, target = document) {
    const touchEvent = new Event(eventType, {
      bubbles: true,
      cancelable: true
    });
    
    touchEvent.touches = [{
      clientX: 100,
      clientY: 100
    }];
    
    target.dispatchEvent(touchEvent);
  },
  
  resizeWindow: function(width, height) {
    global.innerWidth = width;
    global.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  },
  
  advanceTimers: function(time) {
    jest.advanceTimersByTime(time);
  }
};

// Set up mocked time for testing animations
jest.useFakeTimers(); 