import { GameState } from './state';
import { AudioManager } from '../audio';

export class GameLoop {
  private isRunning: boolean;
  private lastTime: number;
  private animationFrameId: number | null;

  constructor(
    private gameState: GameState,
    private audioManager: AudioManager
  ) {
    this.isRunning = false;
    this.lastTime = 0;
    this.animationFrameId = null;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.update(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audioManager.cleanup();
  }

  update(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update game state
    this.gameState.update(deltaTime);

    // Request next frame
    this.animationFrameId = window.requestAnimationFrame((time) => this.update(time));
  }
} 