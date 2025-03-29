import { GameState } from '../utils/game/state';
import { AudioManager } from '../utils/audio';
import { Component } from './Component';
import { PhysicsEngine } from '../utils/physics';

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
}

export class GameBoard extends Component {
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private gameState: GameState;
  private audioManager: AudioManager;
  private physicsEngine: PhysicsEngine;
  private player: GameObject;

  constructor(container: HTMLElement, gameState: GameState, audioManager: AudioManager) {
    super(container);
    this.gameState = gameState;
    this.audioManager = audioManager;
    this.physicsEngine = new PhysicsEngine();
    this.player = {
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      velocityX: 0,
      velocityY: 0
    };
    this.setupCanvas();
    this.setupEventListeners();
  }

  private setupCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.element.appendChild(this.canvas);
    this.resize();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
        this.player.velocityX = -5;
        break;
      case 'ArrowRight':
        this.player.velocityX = 5;
        break;
      case ' ':
        if (this.player.velocityY === 0) {
          this.player.velocityY = -10;
          this.audioManager.playSound('jump');
        }
        break;
      case 'Escape':
        this.gameState.togglePause();
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.player.velocityX = 0;
        break;
      case ' ':
        if (this.player.velocityY < 0) {
          this.player.velocityY = 0;
        }
        break;
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < this.canvas.width / 2) {
      this.player.velocityX = -5;
    } else {
      this.player.velocityX = 5;
    }

    if (this.player.velocityY === 0) {
      this.player.velocityY = -10;
      this.audioManager.playSound('jump');
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.player.velocityX = 0;
    if (this.player.velocityY < 0) {
      this.player.velocityY = 0;
    }
  }

  private resize(): void {
    const aspectRatio = 16 / 9;
    const width = Math.min(window.innerWidth, 800);
    const height = width / aspectRatio;

    this.canvas.width = width;
    this.canvas.height = height;
  }

  public updateFrame(currentTime: number): void {
    if (this.gameState.isPaused) return;

    this.physicsEngine.update(this.player, 16.67);
    this.render();
    requestAnimationFrame((time) => this.updateFrame(time));
  }

  private render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw player
    this.context.fillStyle = '#ff0000';
    this.context.fillRect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height
    );
  }

  protected update(): void {
    this.updateFrame(0);
  }
} 