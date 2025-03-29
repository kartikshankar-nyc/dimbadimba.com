import { GameState } from '../utils/game/state';
import { Component } from './Component';

export class LivesDisplay extends Component {
  private livesElement!: HTMLElement;

  constructor(
    private gameState: GameState,
    container: HTMLElement
  ) {
    super(container);
    this.setupElements();
    this.update();
  }

  private setupElements(): void {
    this.element.className = 'lives-display';
    
    this.livesElement = document.createElement('div');
    this.livesElement.className = 'lives';
    this.element.appendChild(this.livesElement);
  }

  protected update(): void {
    this.livesElement.textContent = this.gameState.lives.toString();

    if (this.gameState.lives <= 0) {
      this.livesElement.classList.add('game-over');
    } else if (this.gameState.lives > 3) {
      this.livesElement.classList.add('animate');
      setTimeout(() => {
        this.livesElement.classList.remove('animate');
      }, 500);
    }
  }
} 