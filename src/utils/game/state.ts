interface GameStateSettings {
  score?: number;
  lives?: number;
  level?: number;
  highScore?: number;
  difficulty?: number;
}

export class GameState {
  private _score: number;
  private _lives: number;
  private _level: number;
  private _highScore: number;
  private _difficulty: number;
  private _isGameOver: boolean;
  private _isPaused: boolean;
  private _lastUpdateTime: number;

  constructor(settings: GameStateSettings = {}) {
    this._score = settings.score ?? 0;
    this._lives = settings.lives ?? 3;
    this._level = settings.level ?? 1;
    this._highScore = settings.highScore ?? 0;
    this._difficulty = settings.difficulty ?? 1;
    this._isGameOver = false;
    this._isPaused = false;
    this._lastUpdateTime = 0;
    this.loadState();
  }

  get score(): number {
    return this._score;
  }

  set score(value: number) {
    this._score = Math.max(0, value);
    this.saveState();
  }

  get lives(): number {
    return this._lives;
  }

  set lives(value: number) {
    this._lives = Math.max(0, value);
    this.saveState();
  }

  get level(): number {
    return this._level;
  }

  set level(value: number) {
    this._level = value;
    this.saveState();
  }

  get highScore(): number {
    return this._highScore;
  }

  set highScore(value: number) {
    this._highScore = value;
    this.saveState();
  }

  get difficulty(): number {
    return this._difficulty;
  }

  set difficulty(value: number) {
    this._difficulty = value;
    this.saveState();
  }

  get isGameOver(): boolean {
    return this._isGameOver;
  }

  set isGameOver(value: boolean) {
    this._isGameOver = value;
    this.saveState();
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  set isPaused(value: boolean) {
    this._isPaused = value;
    this.saveState();
  }

  addPoints(points: number): void {
    if (points < 0) return;
    
    this._score += points;
    if (this._score > this._highScore) {
      this._highScore = this._score;
    }

    // Add extra life at score thresholds
    if (this._score % 1000 === 0) {
      this._lives++;
    }

    // Advance level at score thresholds
    if (this._score % 2000 === 0) {
      this._level++;
      this._difficulty *= 1.2;
    }

    this.checkLevelUp();
    this.saveState();
  }

  playerDied(): void {
    this._lives--;
    if (this._lives <= 0) {
      this._isGameOver = true;
    }
    this.saveState();
  }

  togglePause(): void {
    this._isPaused = !this._isPaused;
    this.saveState();
  }

  private checkLevelUp(): void {
    const newLevel = Math.floor(this._score / 2000) + 1;
    if (newLevel > this._level) {
      this._level = newLevel;
      this._difficulty = 1 + (this._level - 1) * 0.2;
    }
  }

  reset(): void {
    this._score = 0;
    this._lives = 3;
    this._level = 1;
    this._difficulty = 1;
    this._isGameOver = false;
    this._isPaused = false;
    this._lastUpdateTime = 0;
    this.saveState();
  }

  update(deltaTime: number): void {
    if (this._isPaused || this._isGameOver) return;

    // Update game state based on delta time
    this._lastUpdateTime += deltaTime;

    // Example: Add points over time based on difficulty
    if (this._lastUpdateTime >= 1000) { // Every second
      this.addPoints(Math.floor(10 * this._difficulty));
      this._lastUpdateTime = 0;
    }
  }

  saveState(): void {
    const state = {
      score: this._score,
      lives: this._lives,
      level: this._level,
      highScore: this._highScore,
      difficulty: this._difficulty,
      isPaused: this._isPaused,
      isGameOver: this._isGameOver,
    };
    localStorage.setItem('gameState', JSON.stringify(state));
  }

  loadState(): void {
    try {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        const state = JSON.parse(savedState);
        this._score = state.score ?? 0;
        this._lives = state.lives ?? 3;
        this._level = state.level ?? 1;
        this._highScore = state.highScore ?? 0;
        this._difficulty = state.difficulty ?? 1;
        this._isPaused = state.isPaused ?? false;
        this._isGameOver = state.isGameOver ?? false;
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      this.reset();
    }
  }
} 