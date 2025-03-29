import { GameState } from './GameState';
import { AudioManager } from '../audio/AudioManager';

export class GameLoop {
  private _isRunning: boolean = false;
  private _lastTime: number = 0;
  private _frameCount: number = 0;
  private _fps: number = 60;
  private _frameTime: number = 1000 / this._fps;
  private _animationFrameId: number = 0;
  private _maxDeltaTime: number = 100; // Cap delta time to prevent physics issues

  constructor(private gameState: GameState, private audioManager: AudioManager) {}

  start(): void {
    if (!this._isRunning) {
      this._isRunning = true;
      this._lastTime = performance.now();
      this._frameCount = 0;
      this.update(this._lastTime);
    }
  }

  stop(): void {
    this._isRunning = false;
    if (this.audioManager) {
      this.audioManager.cleanup();
    }
    cancelAnimationFrame(this._animationFrameId);
  }

  update(currentTime: number): void {
    if (!this._isRunning || this.gameState.isPaused) return;

    // Calculate time since last frame
    let deltaTime = currentTime - this._lastTime;
    
    // Cap delta time to prevent physics glitches after tab inactivity
    deltaTime = Math.min(deltaTime, this._maxDeltaTime);
    
    this._lastTime = currentTime;
    this._frameCount++;

    // Update game state
    if (this.gameState.isGameOver) {
      this.stop();
      return;
    }

    // Update all game objects
    this.gameState.objects.forEach(obj => {
      if (obj.update) {
        obj.update(deltaTime);
      }
    });

    // Request next frame
    if (this._isRunning) {
      this._animationFrameId = requestAnimationFrame((time) => this.update(time));
    }
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get fps(): number {
    return this._fps;
  }

  get frameTime(): number {
    return this._frameTime;
  }
} 