import { Vector2D } from './Vector2D';
import { GameObject } from './GameState';

export enum CollisionType {
  None,
  Top,
  Bottom,
  Left,
  Right
}

export class Physics {
  private gravity: number = 9.81;
  private terminalVelocity: number = 20;

  constructor(private gameState: any) {}

  update(deltaTime: number): void {
    if (this.gameState.isPaused) return;

    const seconds = deltaTime / 1000;
    this.gameState.objects.forEach((obj: GameObject) => {
      if (obj.velocity) {
        // Apply gravity
        obj.velocity.y += this.gravity * seconds;
        
        // Clamp to terminal velocity
        obj.velocity.y = Math.min(obj.velocity.y, this.terminalVelocity);
        
        // Update position
        obj.x += obj.velocity.x * seconds;
        obj.y += obj.velocity.y * seconds;
      }
    });
  }

  checkCollision(obj1: GameObject, obj2: GameObject): CollisionType {
    if (!obj1 || !obj2) return CollisionType.None;

    const left = obj1.x < obj2.x + obj2.width;
    const right = obj1.x + obj1.width > obj2.x;
    const top = obj1.y < obj2.y + obj2.height;
    const bottom = obj1.y + obj1.height > obj2.y;

    if (left && right && top && bottom) {
      // Calculate collision side
      const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
      const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
      const width = (obj1.width + obj2.width) / 2;
      const height = (obj1.height + obj2.height) / 2;
      const crossWidth = width * dy;
      const crossHeight = height * dx;

      if (crossWidth > crossHeight) {
        return crossWidth > -crossHeight ? CollisionType.Bottom : CollisionType.Left;
      } else {
        return crossWidth > -crossHeight ? CollisionType.Right : CollisionType.Top;
      }
    }

    return CollisionType.None;
  }

  applyForce(object: GameObject, force: Vector2D): void {
    if (!object.velocity) {
      object.velocity = new Vector2D();
    }
    object.velocity.x += force.x;
    object.velocity.y += force.y;
  }

  resolveCollision(obj1: GameObject, obj2: GameObject, collisionType: CollisionType): void {
    if (!obj1.velocity) return;
    
    switch (collisionType) {
      case CollisionType.Top:
        obj1.y = obj2.y - obj1.height;
        obj1.velocity.y = 0;
        break;
      case CollisionType.Bottom:
        obj1.y = obj2.y + obj2.height;
        obj1.velocity.y = 0;
        break;
      case CollisionType.Left:
        obj1.x = obj2.x - obj1.width;
        obj1.velocity.x = 0;
        break;
      case CollisionType.Right:
        obj1.x = obj2.x + obj2.width;
        obj1.velocity.x = 0;
        break;
    }
  }
} 