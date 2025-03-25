/**
 * E2E test for button visibility in different screen orientations
 */

const { test, expect } = require('@playwright/test');

test.describe('Button Visibility Tests', () => {
  test('Start button is visible in portrait mode', async ({ page }) => {
    // Set viewport to portrait phone dimensions
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to the game
    await page.goto('/');
    
    // Wait for the start screen to be visible
    await page.waitForSelector('#startScreen', { state: 'visible' });
    
    // Check if the start button is visible
    const startButton = await page.locator('#startButton');
    
    // Verify the button is visible
    await expect(startButton).toBeVisible();
    
    // Check if the button is within viewport
    const isButtonInViewport = await page.evaluate(async () => {
      const button = document.getElementById('startButton');
      if (!button) return false;
      
      const rect = button.getBoundingClientRect();
      
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    });
    
    expect(isButtonInViewport).toBe(true);
  });
  
  test('Start button is visible in landscape mode', async ({ page }) => {
    // Set viewport to landscape phone dimensions
    await page.setViewportSize({ width: 844, height: 390 });
    
    // Navigate to the game
    await page.goto('/');
    
    // Wait for the start screen to be visible
    await page.waitForSelector('#startScreen', { state: 'visible' });
    
    // Check if the start button is visible
    const startButton = await page.locator('#startButton');
    
    // Wait a moment for any auto-scrolling to complete
    await page.waitForTimeout(500);
    
    // Verify the button is visible
    await expect(startButton).toBeVisible();
    
    // Check if the button is within viewport
    const isButtonInViewport = await page.evaluate(async () => {
      const button = document.getElementById('startButton');
      if (!button) return false;
      
      const rect = button.getBoundingClientRect();
      
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    });
    
    expect(isButtonInViewport).toBe(true);
  });
  
  // Test extreme case - very short viewport height
  test('Start button is accessible in extreme landscape mode', async ({ page }) => {
    // Set viewport to extreme landscape dimensions (very short height)
    await page.setViewportSize({ width: 900, height: 300 });
    
    // Navigate to the game
    await page.goto('/');
    
    // Wait for the start screen to be visible
    await page.waitForSelector('#startScreen', { state: 'visible' });
    
    // Wait a moment for any auto-scrolling to complete
    await page.waitForTimeout(500);
    
    // Verify we can at least scroll to the button
    const canScrollToButton = await page.evaluate(async () => {
      const button = document.getElementById('startButton');
      if (!button) return false;
      
      // Try to scroll to the button
      button.scrollIntoView({ behavior: 'instant', block: 'center' });
      
      // Wait a short moment for the scroll to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if button is now in viewport
      const rect = button.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight
      );
    });
    
    expect(canScrollToButton).toBe(true);
  });
}); 