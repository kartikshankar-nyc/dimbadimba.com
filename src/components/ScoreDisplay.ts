import { GameState } from '../utils/game/state';
import { Component } from './Component';

export class ScoreDisplay extends Component {
  private scoreElement!: HTMLElement;
  private highScoreElement!: HTMLElement;

  constructor(
    private gameState: GameState,
    container: HTMLElement
  ) {
    super(container);
    this.setupElements();
    this.update();
  }

  private setupElements(): void {
    this.element.className = 'score-display';
    
    this.scoreElement = document.createElement('div');
    this.scoreElement.className = 'score';
    this.element.appendChild(this.scoreElement);

    this.highScoreElement = document.createElement('div');
    this.highScoreElement.className = 'high-score';
    this.element.appendChild(this.highScoreElement);
  }

  protected update(): void {
    this.scoreElement.textContent = this.gameState.score.toString();
    this.highScoreElement.textContent = this.gameState.highScore.toString();

    if (this.gameState.score > 0) {
      this.scoreElement.classList.add('animate');
      setTimeout(() => {
        this.scoreElement.classList.remove('animate');
      }, 500);
    }
  }
} 