// Mock canvas and context
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  createPattern: jest.fn(() => ({})),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => {
  return setTimeout(() => callback(performance.now()), 0);
});

global.cancelAnimationFrame = jest.fn(id => {
  clearTimeout(id);
});

// Mock performance.now()
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock AudioContext and related audio APIs
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
    this.sampleRate = 44100;
  }
  
  createOscillator() {
    return {
      type: '',
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  
  createGain() {
    return {
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
  }
  
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(1024),
    };
  }
  
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document methods used in the game
document.createElement = tag => {
  const element = {
    style: {},
    className: '',
    id: '',
    innerHTML: '',
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
    },
    getContext: HTMLCanvasElement.prototype.getContext,
    width: 800,
    height: 600,
  };
  return element;
};

document.getElementById = jest.fn(() => ({
  style: {},
  textContent: '',
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
  addEventListener: jest.fn(),
  appendChild: jest.fn(),
  innerHTML: '',
}));

document.querySelector = jest.fn(() => ({
  style: {},
  appendChild: jest.fn(),
  offsetHeight: 100,
}));

// Mock window.innerWidth and window.innerHeight
Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
});

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
}); 