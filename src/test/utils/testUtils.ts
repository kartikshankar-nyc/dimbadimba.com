import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { GameObject } from '../../game/GameState';
import { Vector2D } from '../../game/Vector2D';

// Custom render function for components
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { ...options });

// Create a GameState mock factory
export const createMockGameState = () => ({
  score: 0,
  highScore: 0,
  lives: 3,
  level: 1,
  isGameOver: false,
  isPaused: false,
  running: false,
  soundEnabled: true,
  difficulty: 1.0,
  player: {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    velocity: new Vector2D(0, 0)
  } as GameObject,
  objects: [] as GameObject[],
  addPoints: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  playerDied: jest.fn(),
  addObject: jest.fn(),
  removeObject: jest.fn(),
  reset: jest.fn(),
  loadState: jest.fn(),
  saveState: jest.fn()
});

// Create a mock for AudioManager
export const createMockAudioManager = () => ({
  loadSound: jest.fn().mockResolvedValue(undefined),
  playSound: jest.fn(),
  stopSound: jest.fn(),
  setVolume: jest.fn(),
  cleanup: jest.fn(),
  createOscillator: jest.fn(),
  volume: 1.0,
  sounds: new Map(),
  context: null
});

// Create a mock for PhysicsEngine
export const createMockPhysicsEngine = () => ({
  update: jest.fn(),
  checkCollision: jest.fn(),
  applyForce: jest.fn(),
  resolveCollision: jest.fn(),
  isActive: true,
  start: jest.fn(),
  stop: jest.fn()
});

// Create a function to generate mock game objects
export const createMockGameObject = (overrides = {}): GameObject => ({
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  velocity: new Vector2D(0, 0),
  color: '#000',
  update: jest.fn(),
  ...overrides
});

// Mock time functions
export const advanceByTime = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

// Mock animation frame
export const advanceByFrame = (frames = 1) => {
  for (let i = 0; i < frames; i++) {
    jest.runOnlyPendingTimers();
  }
};

export * from '@testing-library/react';
export { customRender as render }; 