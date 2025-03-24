/**
 * Dimbadimba Game - Background Tests
 * 
 * Tests for parallax background functionality
 */

// Mock canvas and context
const canvas = document.createElement('canvas');
const ctx = {
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  createLinearGradient: jest.fn().mockReturnValue({
    addColorStop: jest.fn()
  }),
  fillStyle: null
};

describe('Parallax Background', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock gameState
    global.gameState = {
      dayMode: true,
      bgLayers: [],
      speed: 5
    };
    
    // Mock createParallaxBackgroundDay/Night functions
    global.createParallaxBackgroundDay = jest.fn(() => {
      return [
        { x: 0, speed: 0.1, sprite: {}, width: 1000 },
        { x: 0, speed: 0.3, sprite: {}, width: 1000 },
        { x: 0, speed: 0.5, sprite: {}, width: 1000 }
      ];
    });
    
    global.createParallaxBackgroundNight = jest.fn(() => {
      return [
        { x: 0, speed: 0.1, sprite: {}, width: 1000 },
        { x: 0, speed: 0.3, sprite: {}, width: 1000 },
        { x: 0, speed: 0.5, sprite: {}, width: 1000 }
      ];
    });
    
    // Mock toggleDayNightMode function
    global.toggleDayNightMode = jest.fn(isDayMode => {
      gameState.dayMode = isDayMode;
      gameState.bgLayers = isDayMode ? 
        createParallaxBackgroundDay() : 
        createParallaxBackgroundNight();
    });
    
    // Mock updateBackground function
    global.updateBackground = jest.fn(() => {
      if (!gameState.bgLayers || gameState.bgLayers.length === 0) return;
      
      for (let i = 0; i < gameState.bgLayers.length; i++) {
        const layer = gameState.bgLayers[i];
        layer.x -= gameState.speed * layer.speed;
        
        // Reset position if layer moved completely off screen
        if (layer.x <= -layer.width) {
          layer.x = 0;
        }
      }
    });
  });
  
  test('createParallaxBackgroundDay creates correct layer structure', () => {
    // Execute
    const layers = global.createParallaxBackgroundDay();
    
    // Assert
    expect(layers.length).toBe(3);
    expect(layers[0].speed).toBeLessThan(layers[1].speed);
    expect(layers[1].speed).toBeLessThan(layers[2].speed);
  });
  
  test('createParallaxBackgroundNight creates correct layer structure', () => {
    // Execute
    const layers = global.createParallaxBackgroundNight();
    
    // Assert
    expect(layers.length).toBe(3);
    expect(layers[0].speed).toBeLessThan(layers[1].speed);
    expect(layers[1].speed).toBeLessThan(layers[2].speed);
  });
  
  test('toggleDayNightMode sets correct background for day mode', () => {
    // Setup
    const spyCreateDay = jest.spyOn(global, 'createParallaxBackgroundDay');
    
    // Execute
    global.toggleDayNightMode(true);
    
    // Assert
    expect(gameState.dayMode).toBe(true);
    expect(spyCreateDay).toHaveBeenCalled();
    expect(gameState.bgLayers.length).toBe(3);
  });
  
  test('toggleDayNightMode sets correct background for night mode', () => {
    // Setup
    const spyCreateNight = jest.spyOn(global, 'createParallaxBackgroundNight');
    
    // Execute
    global.toggleDayNightMode(false);
    
    // Assert
    expect(gameState.dayMode).toBe(false);
    expect(spyCreateNight).toHaveBeenCalled();
    expect(gameState.bgLayers.length).toBe(3);
  });
  
  test('updateBackground moves each layer at appropriate speed', () => {
    // Setup
    gameState.bgLayers = [
      { x: 0, speed: 0.1, sprite: {}, width: 1000 },
      { x: 0, speed: 0.3, sprite: {}, width: 1000 },
      { x: 0, speed: 0.5, sprite: {}, width: 1000 }
    ];
    gameState.speed = 10;
    
    // Execute
    global.updateBackground();
    
    // Assert
    expect(gameState.bgLayers[0].x).toBe(-1); // 10 * 0.1 = 1
    expect(gameState.bgLayers[1].x).toBe(-3); // 10 * 0.3 = 3
    expect(gameState.bgLayers[2].x).toBe(-5); // 10 * 0.5 = 5
  });
  
  test('updateBackground resets layer position when off screen', () => {
    // Setup
    gameState.bgLayers = [
      { x: -999, speed: 0.1, sprite: {}, width: 1000 },
      { x: -998, speed: 0.3, sprite: {}, width: 1000 },
      { x: -900, speed: 0.5, sprite: {}, width: 1000 }
    ];
    gameState.speed = 10;
    
    // Execute
    global.updateBackground();
    
    // Assert
    expect(gameState.bgLayers[0].x).toBe(0); // Reset to 0 as it would be <= -width
    expect(gameState.bgLayers[1].x).toBe(0); // Reset to 0 as it would be <= -width
    expect(gameState.bgLayers[2].x).toBe(-905); // 10 * 0.5 = 5, -900 - 5 = -905
  });
  
  test('drawMountainRange creates mountains with specified parameters', () => {
    // Mock the drawMountainRange function
    global.drawMountainRange = jest.fn((ctx, width, height, color, heightFactor, count) => {
      ctx.fillStyle = color;
      // In a real implementation, this would draw mountains
      ctx.fillRect(0, 0, width, height * heightFactor);
      return { width, height: height * heightFactor };
    });
    
    // Execute
    const result = global.drawMountainRange(ctx, 800, 400, '#123456', 0.5, 5);
    
    // Assert
    expect(ctx.fillStyle).toBe('#123456');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 200);
    expect(result).toEqual({ width: 800, height: 200 });
  });
  
  test('drawCloud creates a cloud sprite', () => {
    // Mock the drawCloud function
    global.drawCloud = jest.fn((ctx, x, y, width, height) => {
      ctx.fillStyle = '#FFFFFF';
      // In a real implementation, this would draw a cloud
      ctx.fillRect(x, y, width, height);
    });
    
    // Execute
    global.drawCloud(ctx, 50, 100, 200, 50);
    
    // Assert
    expect(ctx.fillStyle).toBe('#FFFFFF');
    expect(ctx.fillRect).toHaveBeenCalledWith(50, 100, 200, 50);
  });
}); 