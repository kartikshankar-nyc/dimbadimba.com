import { Vector2D } from '../Vector2D'; // Update path as needed

describe('Vector2D', () => {
  test('constructor initializes with correct values', () => {
    const vector = new Vector2D(3, 4);
    expect(vector.x).toBe(3);
    expect(vector.y).toBe(4);
  });

  test('constructor defaults to (0,0)', () => {
    const vector = new Vector2D();
    expect(vector.x).toBe(0);
    expect(vector.y).toBe(0);
  });

  test('add returns a new Vector2D with summed components', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    const result = v1.add(v2);
    
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
    // Original vectors unchanged
    expect(v1.x).toBe(1);
    expect(v1.y).toBe(2);
  });

  test('subtract returns a new Vector2D with difference of components', () => {
    const v1 = new Vector2D(5, 7);
    const v2 = new Vector2D(2, 3);
    const result = v1.subtract(v2);
    
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  test('multiply returns a new Vector2D scaled by scalar', () => {
    const vector = new Vector2D(2, 3);
    const result = vector.multiply(2);
    
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  test('divide returns a new Vector2D divided by scalar', () => {
    const vector = new Vector2D(4, 6);
    const result = vector.divide(2);
    
    expect(result.x).toBe(2);
    expect(result.y).toBe(3);
  });

  test('divide throws error when dividing by zero', () => {
    const vector = new Vector2D(4, 6);
    expect(() => vector.divide(0)).toThrow('Division by zero');
  });

  test('magnitude calculates correctly', () => {
    const vector = new Vector2D(3, 4);
    expect(vector.magnitude()).toBe(5);
  });

  test('normalize returns a unit vector with same direction', () => {
    const vector = new Vector2D(3, 4);
    const normalized = vector.normalize();
    
    expect(normalized.magnitude()).toBeCloseTo(1);
    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
  });

  test('dot product calculates correctly', () => {
    const v1 = new Vector2D(2, 3);
    const v2 = new Vector2D(4, 5);
    
    expect(v1.dot(v2)).toBe(2 * 4 + 3 * 5);
  });

  test('clone creates a new identical vector', () => {
    const original = new Vector2D(5, 10);
    const clone = original.clone();
    
    expect(clone.x).toBe(5);
    expect(clone.y).toBe(10);
    
    // Ensure it's a new instance
    clone.x = 15;
    expect(original.x).toBe(5);
  });
}); 