// Import testing libraries
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
});

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Setup mock for canvas
beforeAll(() => {
  // Mock HTMLCanvasElement
  HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextId) => {
    if (contextId === '2d') {
      return {
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        fillText: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        fillStyle: null,
        font: null,
        textAlign: null
      };
    }
    return null;
  });

  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = jest.fn().mockImplementation(cb => setTimeout(cb, 0));
  global.cancelAnimationFrame = jest.fn().mockImplementation(id => clearTimeout(id));
});

// Setup Audio mocks
beforeEach(() => {
  // Mock Audio constructor
  global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    load: jest.fn(),
    currentTime: 0,
    volume: 1
  }));

  // Mock AudioContext
  global.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: jest.fn().mockReturnValue({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 }
    }),
    createGain: jest.fn().mockReturnValue({
      connect: jest.fn(),
      gain: { value: 0 }
    }),
    destination: {},
    currentTime: 0,
    close: jest.fn().mockResolvedValue(undefined)
  }));

  // For WebKit
  // @ts-ignore - webkitAudioContext may not exist on window type
  global.webkitAudioContext = global.AudioContext;
});

// Use fake timers for time-sensitive tests
jest.useFakeTimers();

// Clean mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
}); 