import { Vector2D } from './Vector2D';

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity?: Vector2D;
  color?: string;
  update?: (deltaTime: number) => void;
}

export class GameState {
  public score: number = 0;
  public highScore: number = 0;
  public lives: number = 3;
  public level: number = 1;
  public isGameOver: boolean = false;
  public isPaused: boolean = false;
  public running: boolean = false;
  public soundEnabled: boolean = true;
  public difficulty: number = 1.0;
  public player: GameObject = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    velocity: new Vector2D()
  };
  public objects: GameObject[] = [];

  constructor() {
    this.loadState();
  }

  public loadState(): void {
    try {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        const state = JSON.parse(savedState);
        Object.assign(this, state);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      this.reset();
    }
  }

  public saveState(): void {
    try {
      localStorage.setItem('gameState', JSON.stringify({
        score: this.score,
        highScore: this.highScore,
        lives: this.lives,
        level: this.level,
        isGameOver: this.isGameOver,
        isPaused: this.isPaused,
        running: this.running,
        soundEnabled: this.soundEnabled,
        difficulty: this.difficulty
      }));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  public addPoints(points: number): void {
    this.score = Math.max(0, this.score + points);
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    
    // Add extra life at score threshold
    if (this.score % 1000 === 0) {
      this.lives++;
    }
    
    // Increase difficulty with each level
    if (this.score % 2000 === 0) {
      this.level++;
      this.difficulty = 1 + (this.level - 1) * 0.2;
    }
    
    this.saveState();
  }

  public pause(): void {
    this.isPaused = true;
    this.running = false;
    this.saveState();
  }

  public resume(): void {
    this.isPaused = false;
    this.running = true;
    this.saveState();
  }

  public playerDied(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.isGameOver = true;
      this.running = false;
    }
    this.saveState();
  }

  public addObject(object: GameObject): void {
    this.objects.push(object);
  }

  public removeObject(object: GameObject): void {
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  public reset(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.running = false;
    this.difficulty = 1.0;
    this.objects = [];
    this.saveState();
  }
} 