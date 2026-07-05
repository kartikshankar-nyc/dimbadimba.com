const { test, expect } = require('@playwright/test');

test.describe('Background music rotation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');

    const dismissOrientation = page.locator('#dismiss-orientation');
    if (await dismissOrientation.isVisible().catch(() => false)) {
      await dismissOrientation.click();
    }

    await page.waitForSelector('#startButton');
    await page.click('#startButton');
    await page.waitForFunction(() => (
      typeof sounds !== 'undefined' &&
      sounds.backgroundMusic &&
      typeof sounds.backgroundMusic.getDebugState === 'function' &&
      sounds.backgroundMusic.getDebugState().trackName !== null
    ));
  });

  test('rotates between multiple day tracks across restarts', async ({ page }) => {
    const states = await page.evaluate(async () => {
      const snapshots = [sounds.backgroundMusic.getDebugState()];

      sounds.backgroundMusic.stop();
      await new Promise(resolve => setTimeout(resolve, 80));
      sounds.backgroundMusic.play();
      await new Promise(resolve => setTimeout(resolve, 80));
      snapshots.push(sounds.backgroundMusic.getDebugState());

      sounds.backgroundMusic.stop();
      await new Promise(resolve => setTimeout(resolve, 80));
      sounds.backgroundMusic.play();
      await new Promise(resolve => setTimeout(resolve, 80));
      snapshots.push(sounds.backgroundMusic.getDebugState());

      return snapshots;
    });

    const uniqueTrackNames = [...new Set(states.map(state => state.trackName))];

    expect(uniqueTrackNames.length).toBeGreaterThan(1);
    states.forEach(state => expect(state.modeKey).toBe('day'));
  });

  test('switches to a night track when the theme changes', async ({ page }) => {
    const states = await page.evaluate(async () => {
      const before = sounds.backgroundMusic.getDebugState();

      toggleDayNightMode(false);
      await new Promise(resolve => setTimeout(resolve, 100));

      const after = sounds.backgroundMusic.getDebugState();
      return { before, after };
    });

    expect(states.before.modeKey).toBe('day');
    expect(states.before.trackName).toBeTruthy();
    expect(states.after.modeKey).toBe('night');
    expect(states.after.trackName).toBeTruthy();
  });
});
