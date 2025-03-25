const { test, expect } = require('@playwright/test');

test.describe('Pixel Runner Game Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/index.html');
    
    // Wait for the game to load
    await page.waitForSelector('#startButton');
  });
  
  test('should start the game when start button is clicked', async ({ page }) => {
    // Click the start button
    await page.click('#startButton');
    
    // Check that the game is running
    const gameRunning = await page.evaluate(() => {
      return gameState && gameState.running === true;
    });
    
    expect(gameRunning).toBeTruthy();
    
    // Check that the start screen is hidden
    const startScreenHidden = await page.evaluate(() => {
      const startScreen = document.getElementById('startScreen');
      return startScreen.classList.contains('hidden');
    });
    
    expect(startScreenHidden).toBeTruthy();
  });
  
  test('should make character jump when space key is pressed', async ({ page }) => {
    // Start the game
    await page.click('#startButton');
    await page.waitForTimeout(500);
    
    // Get initial y position of player
    const initialY = await page.evaluate(() => {
      return gameState.dimbadimba.y;
    });
    
    // Press space to jump
    await page.keyboard.press(' ');
    
    // Wait a short time for the jump to start
    await page.waitForTimeout(100);
    
    // Get the new y position
    const jumpingY = await page.evaluate(() => {
      return gameState.dimbadimba.y;
    });
    
    // Player should have moved upward (y decreases as you go up)
    expect(jumpingY).toBeLessThan(initialY);
    
    // Check that jumping state is set
    const isJumping = await page.evaluate(() => {
      return gameState.dimbadimba.jumping === true;
    });
    
    expect(isJumping).toBeTruthy();
  });
  
  test('should toggle sound when sound button is clicked', async ({ page }) => {
    // Get initial sound state
    const initialSoundEnabled = await page.evaluate(() => {
      return gameState.soundEnabled;
    });
    
    // Click the sound toggle button
    await page.click('#soundToggle');
    
    // Get new sound state
    const newSoundEnabled = await page.evaluate(() => {
      return gameState.soundEnabled;
    });
    
    // Sound state should have toggled
    expect(newSoundEnabled).not.toEqual(initialSoundEnabled);
    
    // Check button text updated
    const buttonText = await page.evaluate(() => {
      return document.getElementById('soundToggle').textContent;
    });
    
    expect(buttonText).toEqual(newSoundEnabled ? '🔊' : '🔇');
  });
  
  test('should show game over screen when player collides with obstacle', async ({ page }) => {
    // Start the game
    await page.click('#startButton');
    await page.waitForTimeout(500);
    
    // Force a collision by manipulating game state directly
    await page.evaluate(() => {
      // Create an obstacle right in front of the player
      gameState.obstacles.push({
        x: gameState.dimbadimba.x + 5, // Just ahead of player
        y: gameState.dimbadimba.y,
        width: 30,
        height: 50,
        shapeIndex: 0
      });
      
      // Update to trigger collision check
      checkCollisions();
    });
    
    // Wait for game over screen to appear
    await page.waitForSelector('#game-over:not(.hidden)', { timeout: 5000 });
    
    // Check that game is no longer running
    const gameRunning = await page.evaluate(() => {
      return gameState.running;
    });
    
    expect(gameRunning).toBeFalsy();
  });
  
  test('should restart game when restart button is clicked', async ({ page }) => {
    // Start the game
    await page.click('#startButton');
    await page.waitForTimeout(500);
    
    // Force game over
    await page.evaluate(() => {
      gameOver();
    });
    
    // Wait for game over screen
    await page.waitForSelector('#game-over:not(.hidden)');
    
    // Click restart button
    await page.click('#restartButton');
    
    // Check that game is running again
    const gameRunning = await page.evaluate(() => {
      return gameState.running === true;
    });
    
    expect(gameRunning).toBeTruthy();
    
    // Check that game over screen is hidden
    const gameOverHidden = await page.evaluate(() => {
      return document.getElementById('game-over').classList.contains('hidden');
    });
    
    expect(gameOverHidden).toBeTruthy();
    
    // Check that score was reset
    const score = await page.evaluate(() => {
      return gameState.score;
    });
    
    expect(score).toBe(0);
  });
}); 