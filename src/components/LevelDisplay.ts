import { GameState } from '../utils/game/state';
import { Component } from './Component';

export class LevelDisplay extends Component {
  private levelElement!: HTMLElement;
  private difficultyElement!: HTMLElement;

  constructor(
    private gameState: GameState,
    container: HTMLElement
  ) {
    super(container);
    this.setupElements();
    this.update();
  }

  private setupElements(): void {
    this.element.className = 'level-display';
    
    this.levelElement = document.createElement('div');
    this.levelElement.className = 'level';
    this.element.appendChild(this.levelElement);

    this.difficultyElement = document.createElement('div');
    this.difficultyElement.className = 'difficulty';
    this.element.appendChild(this.difficultyElement);
  }

  protected update(): void {
    this.levelElement.textContent = this.gameState.level.toString();
    this.difficultyElement.textContent = `${this.gameState.difficulty.toFixed(1)}x`;

    if (this.gameState.level > 1) {
      this.levelElement.classList.add('animate');
      setTimeout(() => {
        this.levelElement.classList.remove('animate');
      }, 500);
    }
  }
} 