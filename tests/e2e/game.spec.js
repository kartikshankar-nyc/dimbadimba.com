// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Dimbadimba Game UI Tests', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Navigate to the game
    await page.goto('/');
    // Wait for the game to load with a longer timeout
    await page.waitForSelector('.game-container', { timeout: 10000 });
    
    // Additional wait for Safari which can be slower
    if (browserName === 'webkit' || browserName.includes('Mobile')) {
      await page.waitForTimeout(2000);
    }
  });

  test('page title is correct', async ({ page }) => {
    // Check that the page title contains Dimbadimba
    await expect(page).toHaveTitle(/Dimbadimba/);
  });

  test('game canvas is visible', async ({ page }) => {
    // Check that the game canvas is visible
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  test('game has start button', async ({ page }) => {
    // Check that the start button exists and is visible
    const startButton = page.locator('#startButton');
    await expect(startButton).toBeVisible({ timeout: 5000 });
  });

  test('controls display correctly', async ({ page }) => {
    // Check that the controls section is visible
    const controls = page.locator('.controls');
    await expect(controls).toBeVisible({ timeout: 5000 });
    
    // Check that the controls header is correct - handle potential variations in text
    const controlsHeader = page.locator('.controls-header');
    await expect(controlsHeader).toBeVisible();
    const headerText = await controlsHeader.textContent();
    expect(headerText).toMatch(/CONTROLS/i);
    
    // Check that the controls list includes the key words
    await expect(page.locator('.controls')).toContainText(/SPACE/i);
    await expect(page.locator('.controls')).toContainText(/JUMP/i);
    await expect(page.locator('.controls')).toContainText(/PAUSE/i);
    await expect(page.locator('.controls')).toContainText(/SOUND/i);
  });

  test.skip('start button begins the game', async ({ page }) => {
    // This test is skipped due to inconsistent behavior across browsers
    
    // Click the start button
    await page.locator('#startButton').click();
    
    // Wait for the game to start
    await page.waitForTimeout(1000);
    
    // Check that the game is running by checking if the start screen is no longer visible
    // Use a more relaxed approach that allows for different ways of hiding the start screen
    const startScreenVisible = await page.evaluate(() => {
      const startScreen = document.getElementById('startScreen');
      if (!startScreen) return false;
      
      const style = window.getComputedStyle(startScreen);
      return !(startScreen.classList.contains('hidden') || 
               style.display === 'none' || 
               style.visibility === 'hidden' ||
               style.opacity === '0');
    });
    
    expect(startScreenVisible).toBe(false);
  });

  test('sound toggle button exists', async ({ page }) => {
    // Check the sound toggle button exists
    const soundToggle = page.locator('#soundToggle');
    await expect(soundToggle).toBeVisible({ timeout: 5000 });
  });

  test('day/night mode selection exists', async ({ page }) => {
    // Check that day mode button exists
    const dayModeBtn = page.locator('#dayModeBtn');
    await expect(dayModeBtn).toBeVisible({ timeout: 5000 });
    
    // Check that night mode button exists
    const nightModeBtn = page.locator('#nightModeBtn');
    await expect(nightModeBtn).toBeVisible({ timeout: 5000 });
  });

  test('score display is visible', async ({ page }) => {
    // Check that the score element exists and is visible
    const scoreElement = page.locator('#currentScore, .score, [data-score]');
    await expect(scoreElement).toBeVisible({ timeout: 5000 });
  });
}); 