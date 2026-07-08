const { test, expect, devices } = require('@playwright/test');

test.use({
  ...devices['iPhone 13'],
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true
});

test.describe('Mobile night mode character visibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');

    const dismissOrientation = page.locator('#dismiss-orientation');
    if (await dismissOrientation.isVisible().catch(() => false)) {
      await dismissOrientation.click();
    }

    await page.waitForSelector('#startButton');
  });

  test('keeps the character preview onscreen after selecting night mode', async ({ page }) => {
    const characterDisplay = page.locator('#dimbadimbaDisplay');
    await expect(characterDisplay).toBeVisible();

    await page.locator('#nightModeBtn').click();

    const rect = await characterDisplay.evaluate((node) => {
      const { top, bottom, height } = node.getBoundingClientRect();
      return { top, bottom, height };
    });

    expect(rect.top).toBeGreaterThanOrEqual(0);
    expect(rect.bottom).toBeLessThanOrEqual(390);
    expect(rect.height).toBeGreaterThan(0);
  });
});
