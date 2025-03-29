import { Physics, CollisionType } from '../Physics'; // Update path as needed
import { Vector2D } from '../Vector2D'; // Update path as needed
import { createMockGameState, createMockGameObject } from '../../test/utils/testUtils';
import { GameObject } from '../GameState';

describe('Physics Engine', () => {
  let physics: Physics;
  let mockGameState: ReturnType<typeof createMockGameState>;

  beforeEach(() => {
    mockGameState = createMockGameState();
    physics = new Physics(mockGameState);
  });

  describe('update', () => {
    test('applies gravity and updates object positions', () => {
      // Create a test object with guaranteed velocity
      const testObject = createMockGameObject({
        x: 100,
        y: 100,
        velocity: new Vector2D(10, 0)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!testObject.velocity) {
        testObject.velocity = new Vector2D(10, 0);
      }
      
      mockGameState.objects = [testObject];
      mockGameState.isPaused = false;
      
      // Update with a 1-second delta time
      physics.update(1000);
      
      // Verify gravity applied (9.81 m/s²)
      expect(testObject.velocity.y).toBeCloseTo(9.81);
      
      // Verify position updated - use integer comparison due to floating point
      expect(Math.round(testObject.x)).toBe(110);
      expect(Math.round(testObject.y)).toBe(105); // Rounded from 104.905
    });

    test('does nothing when game is paused', () => {
      const testObject = createMockGameObject({
        x: 100,
        y: 100,
        velocity: new Vector2D(10, 0)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!testObject.velocity) {
        testObject.velocity = new Vector2D(10, 0);
      }
      
      mockGameState.objects = [testObject];
      mockGameState.isPaused = true;
      
      physics.update(1000);
      
      // Verify object unchanged
      expect(testObject.x).toBe(100);
      expect(testObject.y).toBe(100);
      expect(testObject.velocity.x).toBe(10);
      expect(testObject.velocity.y).toBe(0);
    });

    test('clamps vertical velocity to terminal velocity', () => {
      const testObject = createMockGameObject({
        velocity: new Vector2D(0, 15)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!testObject.velocity) {
        testObject.velocity = new Vector2D(0, 15);
      }
      
      mockGameState.objects = [testObject];
      mockGameState.isPaused = false;
      
      // Update with a 1-second delta time
      physics.update(1000);
      
      // Verify vertical velocity clamped (assuming terminal velocity is 20)
      expect(testObject.velocity.y).toBeLessThanOrEqual(20);
    });
  });

  describe('collision detection', () => {
    test('detects collision between two objects', () => {
      const obj1 = createMockGameObject({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      });
      
      const obj2 = createMockGameObject({
        x: 5,
        y: 5,
        width: 10,
        height: 10
      });
      
      const collision = physics.checkCollision(obj1, obj2);
      
      // Objects are overlapping, so collision should be detected
      expect(collision).not.toBe(CollisionType.None);
    });

    test('returns None when objects do not collide', () => {
      const obj1 = createMockGameObject({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      });
      
      const obj2 = createMockGameObject({
        x: 20,
        y: 20,
        width: 10,
        height: 10
      });
      
      const collision = physics.checkCollision(obj1, obj2);
      
      // Objects are not overlapping
      expect(collision).toBe(CollisionType.None);
    });

    test('detects collisions from different directions', () => {
      // Object 1 is stationary
      const obj1 = createMockGameObject({
        x: 10,
        y: 10,
        width: 10,
        height: 10
      });
      
      // Test various collision scenarios
      // From above
      let obj2 = createMockGameObject({
        x: 12,
        y: 5,
        width: 6,
        height: 6
      });
      
      let collision = physics.checkCollision(obj1, obj2);
      expect(collision).not.toBe(CollisionType.None);
      
      // From below
      obj2 = createMockGameObject({
        x: 12,
        y: 19,
        width: 6,
        height: 6
      });
      collision = physics.checkCollision(obj1, obj2);
      expect(collision).not.toBe(CollisionType.None);
      
      // From left
      obj2 = createMockGameObject({
        x: 5,
        y: 12,
        width: 6,
        height: 6
      });
      collision = physics.checkCollision(obj1, obj2);
      expect(collision).not.toBe(CollisionType.None);
      
      // From right
      obj2 = createMockGameObject({
        x: 19,
        y: 12,
        width: 6,
        height: 6
      });
      collision = physics.checkCollision(obj1, obj2);
      expect(collision).not.toBe(CollisionType.None);
    });
  });

  describe('force application', () => {
    test('applyForce updates object velocity', () => {
      const object = createMockGameObject({
        velocity: new Vector2D(5, 10)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!object.velocity) {
        object.velocity = new Vector2D(5, 10);
      }
      
      const force = new Vector2D(2, 3);
      
      physics.applyForce(object, force);
      
      expect(object.velocity.x).toBe(7);
      expect(object.velocity.y).toBe(13);
    });

    test('applyForce creates velocity if none exists', () => {
      const object = createMockGameObject({
        velocity: undefined
      }) as GameObject & { velocity?: Vector2D };
      
      const force = new Vector2D(2, 3);
      
      physics.applyForce(object, force);
      
      expect(object.velocity).toBeDefined();
      expect(object.velocity!.x).toBe(2);
      expect(object.velocity!.y).toBe(3);
    });
  });

  describe('collision resolution', () => {
    test('resolveCollision correctly handles top collision', () => {
      const obj1 = createMockGameObject({
        x: 0,
        y: 5,
        height: 10,
        velocity: new Vector2D(0, 5)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!obj1.velocity) {
        obj1.velocity = new Vector2D(0, 5);
      }
      
      const obj2 = createMockGameObject({
        x: 0,
        y: 10,
        height: 10
      });
      
      physics.resolveCollision(obj1, obj2, CollisionType.Top);
      
      // Object should be positioned above obj2
      expect(obj1.y).toBe(0); // obj2.y - obj1.height
      // Vertical velocity should be zeroed
      expect(obj1.velocity.y).toBe(0);
    });

    test('resolveCollision correctly handles bottom collision', () => {
      const obj1 = createMockGameObject({
        x: 0,
        y: 15,
        velocity: new Vector2D(0, -5)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!obj1.velocity) {
        obj1.velocity = new Vector2D(0, -5);
      }
      
      const obj2 = createMockGameObject({
        x: 0,
        y: 0,
        height: 10
      });
      
      physics.resolveCollision(obj1, obj2, CollisionType.Bottom);
      
      // Object should be positioned below obj2
      expect(obj1.y).toBe(10); // obj2.y + obj2.height
      // Vertical velocity should be zeroed
      expect(obj1.velocity.y).toBe(0);
    });

    test('resolveCollision correctly handles left collision', () => {
      const obj1 = createMockGameObject({
        x: 5,
        y: 0,
        width: 10,
        velocity: new Vector2D(5, 0)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!obj1.velocity) {
        obj1.velocity = new Vector2D(5, 0);
      }
      
      const obj2 = createMockGameObject({
        x: 10,
        y: 0,
        width: 10
      });
      
      physics.resolveCollision(obj1, obj2, CollisionType.Left);
      
      // Object should be positioned to the left of obj2
      expect(obj1.x).toBe(0); // obj2.x - obj1.width
      // Horizontal velocity should be zeroed
      expect(obj1.velocity.x).toBe(0);
    });

    test('resolveCollision correctly handles right collision', () => {
      const obj1 = createMockGameObject({
        x: 15,
        y: 0,
        velocity: new Vector2D(-5, 0)
      });
      
      // Ensure velocity is not undefined for TypeScript
      if (!obj1.velocity) {
        obj1.velocity = new Vector2D(-5, 0);
      }
      
      const obj2 = createMockGameObject({
        x: 0,
        y: 0,
        width: 10
      });
      
      physics.resolveCollision(obj1, obj2, CollisionType.Right);
      
      // Object should be positioned to the right of obj2
      expect(obj1.x).toBe(10); // obj2.x + obj2.width
      // Horizontal velocity should be zeroed
      expect(obj1.velocity.x).toBe(0);
    });
  });
}); 