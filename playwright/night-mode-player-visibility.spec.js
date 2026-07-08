const { test, expect } = require('@playwright/test');

test.describe('Night mode player visibility', () => {
  test('renders a visible fallback player while image asset is still loading', async ({ page }) => {
    await page.route('**/images/dimbadimba.png', async route => {
      await new Promise(resolve => setTimeout(resolve, 8000));
      await route.continue();
    });

    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__dimbadimbaReady === true);

    await page.evaluate(() => {
      toggleDayNightMode(false);
      startGame();
    });

    await page.waitForTimeout(600);

    const contrastDelta = await page.evaluate(() => {
      const canvas = document.getElementById('gameCanvas');
      const context = canvas.getContext('2d');
      const { x, y, width, height } = gameState.dimbadimba;

      const sample = (sampleX) => {
        const pixels = context.getImageData(Math.round(sampleX), Math.round(y), Math.round(width), Math.round(height)).data;
        let r = 0;
        let g = 0;
        let b = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
        }

        const count = pixels.length / 4;
        return { r: r / count, g: g / count, b: b / count };
      };

      const playerRegion = sample(x);
      const nearbyRegion = sample(Math.max(0, x - 10));

      return Math.abs(playerRegion.r - nearbyRegion.r)
        + Math.abs(playerRegion.g - nearbyRegion.g)
        + Math.abs(playerRegion.b - nearbyRegion.b);
    });

    expect(contrastDelta).toBeGreaterThan(2);
  });
});
