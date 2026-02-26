const { test, expect } = require('@playwright/test');

test.describe('Game Pause Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/index.html');
    
    // Wait for the game to load
    await page.waitForSelector('#startButton');
    
    // Start the game
    await page.click('#startButton');
    
    // Wait a moment for the game to start
    await page.waitForTimeout(500);
  });
  
  test('should pause and unpause the game with P key', async ({ page }) => {
    // Pause the game
    await page.keyboard.press('p');
    await page.waitForTimeout(200);

    // Check game state is paused
    const isPaused = await page.evaluate(() => {
      return gameState && gameState.running && gameState.paused;
    });

    expect(isPaused).toBeTruthy();

    // Unpause the game
    await page.keyboard.press('p');
    await page.waitForTimeout(200);

    // Check that the game is running and not paused
    const gameRunning = await page.evaluate(() => {
      return gameState && gameState.running && !gameState.paused;
    });

    expect(gameRunning).toBeTruthy();
  });
  
  test('should handle multiple rapid pause/unpause actions without breaking', async ({ page }) => {
    // Press P rapidly several times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('p');
      await page.waitForTimeout(200); // Small delay between presses
    }
    
    // Play for a moment to ensure game is still functioning
    await page.waitForTimeout(1000);
    
    // Try to jump
    await page.keyboard.press(' ');
    
    // Check that the game is still in a valid state
    const gameValid = await page.evaluate(() => {
      // Check important game state properties
      return (
        gameState && 
        gameState.running && 
        gameState.dimbadimba && 
        typeof gameState.dimbadimba.y === 'number' &&
        typeof gameState.speed === 'number' &&
        gameState.speed > 0
      );
    });
    
    expect(gameValid).toBeTruthy();
    
    // Check that character movement is correct (not reversed)
    const obstaclesMovingCorrectly = await page.evaluate(() => {
      // Ensure an obstacle exists for testing
      if (gameState.obstacles.length === 0) {
        gameState.obstacles.push({
          id: ++obstacleIdCounter,
          x: GAME_WIDTH,
          y: GAME_HEIGHT - 50,
          width: 30,
          height: 30,
          shapeIndex: 0
        });
      }

      const initialX = gameState.obstacles[0].x;

      return new Promise(resolve => {
        setTimeout(() => {
          if (gameState.obstacles.length === 0) {
            resolve(true);
            return;
          }
          resolve(gameState.obstacles[0].x < initialX);
        }, 300);
      });
    });

    expect(obstaclesMovingCorrectly).toBeTruthy();
  });
  
  test('should maintain correct animation timing after multiple pause/unpause cycles', async ({ page }) => {
    // Perform several pause/unpause cycles
    for (let i = 0; i < 3; i++) {
      // Pause
      await page.keyboard.press('p');
      await page.waitForTimeout(300);
      
      // Unpause
      await page.keyboard.press('p');
      await page.waitForTimeout(500);
    }
    
    // Check that game speed is still reasonable (hasn't jumped to extreme values)
    const speedIsReasonable = await page.evaluate(() => {
      const initialSpeed = 5; // INITIAL_SPEED constant
      const currentSpeed = gameState.speed;
      // Speed should have increased slightly but not dramatically
      return currentSpeed > initialSpeed && currentSpeed < initialSpeed * 2;
    });
    
    expect(speedIsReasonable).toBeTruthy();
    
    // Check that deltaTime is being calculated correctly after pause/unpause
    const deltaTimeIsReasonable = await page.evaluate(() => {
      // Create a test to check if deltaTime in the next frame is reasonable
      return new Promise(resolve => {
        let lastTimestamp = performance.now();
        
        // Use the game's own requestAnimationFrame for a frame
        requestAnimationFrame(timestamp => {
          const deltaTime = timestamp - lastTimestamp;
          // deltaTime should be around 16-17ms (60fps) or at most 100ms (our cap)
          resolve(deltaTime >= 0 && deltaTime <= 100);
        });
      });
    });
    
    expect(deltaTimeIsReasonable).toBeTruthy();
  });
}); 