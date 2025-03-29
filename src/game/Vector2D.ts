export class Vector2D {
  constructor(public x: number = 0, public y: number = 0) {}

  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2D {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D();
    return this.divide(mag);
  }

  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }
} 