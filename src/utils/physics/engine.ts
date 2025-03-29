import { GameState } from '../game/state';
import { checkCollision } from './collision';

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}

type GameObject = (Rectangle | Circle) & {
  velocityX?: number;
  velocityY?: number;
};

interface Bounds {
  width: number;
  height: number;
}

export class PhysicsEngine {
  private _isActive: boolean;
  private _gravity: number;
  private _objects: GameObject[];
  private _bounds: Bounds;

  constructor(
    private gameState: GameState,
    settings: { gravity?: number; bounds?: Bounds } = {}
  ) {
    this._isActive = true;
    this._gravity = settings.gravity ?? 9.81;
    this._objects = [];
    this._bounds = settings.bounds ?? { width: 800, height: 600 };
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get gravity(): number {
    return this._gravity;
  }

  get objects(): GameObject[] {
    return this._objects;
  }

  get bounds(): Bounds {
    return this._bounds;
  }

  addObject(object: GameObject): void {
    this._objects.push(object);
  }

  removeObject(object: GameObject): void {
    const index = this._objects.indexOf(object);
    if (index !== -1) {
      this._objects.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    if (!this._isActive || this.gameState.isPaused) return;

    const seconds = deltaTime / 1000;

    this._objects.forEach(object => {
      // Update position based on velocity
      if (object.velocityX !== undefined) {
        object.x += object.velocityX * seconds;
      }
      if (object.velocityY !== undefined) {
        object.y += object.velocityY * seconds;
      }

      // Apply gravity
      if (object.velocityY !== undefined) {
        object.velocityY += this._gravity * seconds;
      }

      // Handle boundaries
      if ('width' in object) {
        object.x = Math.max(0, Math.min(object.x, this._bounds.width - object.width));
        object.y = Math.max(0, Math.min(object.y, this._bounds.height - object.height));
      } else {
        object.x = Math.max(object.radius, Math.min(object.x, this._bounds.width - object.radius));
        object.y = Math.max(object.radius, Math.min(object.y, this._bounds.height - object.radius));
      }
    });

    // Check collisions
    this._checkCollisions();
  }

  private _checkCollisions(): void {
    for (let i = 0; i < this._objects.length; i++) {
      for (let j = i + 1; j < this._objects.length; j++) {
        const obj1 = this._objects[i];
        const obj2 = this._objects[j];

        if (checkCollision(obj1, obj2)) {
          this._handleCollision(obj1, obj2);
        }
      }
    }
  }

  private _handleCollision(obj1: GameObject, obj2: GameObject): void {
    // Simple elastic collision response
    if (obj1.velocityX !== undefined && obj2.velocityX !== undefined) {
      const temp = obj1.velocityX;
      obj1.velocityX = obj2.velocityX;
      obj2.velocityX = temp;
    }

    if (obj1.velocityY !== undefined && obj2.velocityY !== undefined) {
      const temp = obj1.velocityY;
      obj1.velocityY = obj2.velocityY;
      obj2.velocityY = temp;
    }

    // Update game state based on collision
    this.gameState.addPoints(10);
  }

  pause(): void {
    this._isActive = false;
  }

  resume(): void {
    this._isActive = true;
  }

  cleanup(): void {
    this._objects = [];
  }
} 