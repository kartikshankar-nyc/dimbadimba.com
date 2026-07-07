const { test, expect } = require('@playwright/test');

// E2E coverage for the GAME_ANALYSIS.md enhancement set:
// game modes (time attack / endless+), flying obstacles, double jump input,
// milestones, achievements, daily challenges, screen shake, particle bursts,
// ghost runs and the local leaderboard.
test.describe('Enhancement features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');

    const dismissOrientation = page.locator('#dismiss-orientation');
    if (await dismissOrientation.isVisible().catch(() => false)) {
      await dismissOrientation.click();
    }

    await page.waitForFunction(() => window.__dimbadimbaReady === true);
  });

  test('start screen shows game type selector, daily challenge and achievements panel', async ({ page }) => {
    await expect(page.locator('#endlessModeBtn')).toBeVisible();
    await expect(page.locator('#timeAttackModeBtn')).toBeVisible();
    await expect(page.locator('#endlessPlusModeBtn')).toBeVisible();

    // Daily challenge box is populated deterministically for today
    await expect(page.locator('#dailyChallengeBox')).toBeVisible();
    const challengeText = await page.locator('#dailyChallengeBox').textContent();
    expect(challengeText).toContain('Daily Challenge');

    // Achievements panel toggles open with the full list
    await page.click('#achievementsToggleBtn');
    await expect(page.locator('#achievementsPanel')).toBeVisible();
    const achievementCount = await page.locator('#achievementsPanel .achievement-item').count();
    expect(achievementCount).toBe(10);
  });

  test('daily challenge is deterministic for a given date', async ({ page }) => {
    const [first, second, otherDay] = await page.evaluate(() => [
      getDailyChallenge('Tue Jul 07 2026'),
      getDailyChallenge('Tue Jul 07 2026'),
      getDailyChallenge('Wed Jul 08 2026')
    ]);

    expect(first.id).toBe(second.id);
    expect(first.target).toBe(second.target);
    expect(first.desc).toBe(second.desc);
    // A different date should produce a valid (usually different) challenge
    expect(otherDay.target).toBeGreaterThan(0);
  });

  test('time attack mode counts down and coins add bonus time', async ({ page }) => {
    await page.click('#timeAttackModeBtn');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    expect(await page.evaluate(() => gameState.gameMode)).toBe('timeAttack');

    const initialTime = await page.evaluate(() => gameState.timeAttack.timeRemaining);
    await page.waitForFunction(
      (start) => gameState.timeAttack.timeRemaining < start,
      initialTime
    );

    // Collect a coin directly on the player and verify bonus time is granted
    const result = await page.evaluate(() => {
      const before = gameState.timeAttack.timeRemaining;
      gameState.coins.push({
        x: gameState.dimbadimba.x,
        y: gameState.dimbadimba.y,
        width: 30,
        height: 30,
        rotation: 0,
        magnetized: false,
        specialType: null,
        pulseOffset: 0
      });
      checkCoinCollisions();
      return {
        before: before,
        after: gameState.timeAttack.timeRemaining,
        coins: gameState.runStats.coinsCollected
      };
    });

    expect(result.after).toBeGreaterThan(result.before);
    expect(result.coins).toBe(1);
  });

  test('time attack run ends with game over when the timer expires', async ({ page }) => {
    await page.click('#timeAttackModeBtn');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    await page.evaluate(() => {
      gameState.timeAttack.timeRemaining = 50; // let the loop drain it
    });

    await page.waitForSelector('#game-over:not(.hidden)', { timeout: 5000 });
    expect(await page.evaluate(() => gameState.running)).toBeFalsy();
  });

  test('endless+ mode uses one life and grows the survival multiplier', async ({ page }) => {
    await page.click('#endlessPlusModeBtn');
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const state = await page.evaluate(() => ({
      mode: gameState.gameMode,
      lives: gameState.lives
    }));
    expect(state.mode).toBe('endlessPlus');
    expect(state.lives).toBe(1);

    // Simulate 10s of survival through the mode updater. Reset the counters and
    // read both values in one evaluate so the live game loop (which also calls
    // updateGameMode each frame) cannot interleave and skew the assertions.
    const result = await page.evaluate(() => {
      gameState.scoreMultiplier = 1.0;
      gameState.endlessPlus.survivalMultiplier = 1.0;
      gameState.endlessPlus.elapsedSinceIncrease = 0;
      updateGameMode(10000);
      return {
        multiplier: gameState.endlessPlus.survivalMultiplier,
        scoreMult: getTotalScoreMultiplier()
      };
    });
    expect(result.multiplier).toBeCloseTo(1.1, 5);
    expect(result.scoreMult).toBeCloseTo(1.1, 5);

    // A single hit ends the run
    await page.evaluate(() => {
      gameState.isInvincible = false;
      gameState.obstacles.push({
        id: ++obstacleIdCounter,
        x: gameState.dimbadimba.x + 5,
        previousX: gameState.dimbadimba.x + 5,
        y: gameState.dimbadimba.y,
        width: 30,
        height: 50,
        shapeIndex: 0
      });
      checkCollisions();
    });

    await page.waitForSelector('#game-over:not(.hidden)', { timeout: 5000 });
  });

  test('flying obstacles spawn in the safe band, move, and can hit a jumping player', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    // Force a spawn and validate placement above a grounded player
    const spawn = await page.evaluate(() => {
      spawnFlyingObstacle();
      const flyer = gameState.flyingObstacles[0];
      const groundTop = GAME_HEIGHT - GROUND_HEIGHT;
      const standingPlayerTop = groundTop - PLAYER_HEIGHT;
      return {
        count: gameState.flyingObstacles.length,
        x: flyer.x,
        bottom: flyer.y + flyer.height,
        standingPlayerTop: standingPlayerTop,
        pattern: flyer.pattern
      };
    });

    expect(spawn.count).toBe(1);
    // Grounded players are always safe: flyer bottom stays above standing head height
    expect(spawn.bottom).toBeLessThan(spawn.standingPlayerTop);
    expect(['sine_wave', 'straight', 'dive_bomb']).toContain(spawn.pattern);

    // Flyer moves left over time
    await page.waitForFunction(
      (startX) => gameState.flyingObstacles.length === 0 || gameState.flyingObstacles[0].x < startX,
      spawn.x
    );

    // A flyer overlapping the player registers a hit (life lost)
    const hitResult = await page.evaluate(() => {
      gameState.flyingObstacles.length = 0;
      gameState.isInvincible = false;
      const livesBefore = gameState.lives;
      gameState.flyingObstacles.push({
        id: ++obstacleIdCounter,
        x: gameState.dimbadimba.x + 15,
        y: gameState.dimbadimba.y + 15,
        baseY: gameState.dimbadimba.y + 15,
        width: 46,
        height: 34,
        pattern: 'straight',
        phase: 0,
        frameTimer: 0,
        frameIndex: 0
      });
      checkFlyingObstacleCollisions();
      return { livesBefore: livesBefore, livesAfter: gameState.lives };
    });

    expect(hitResult.livesAfter).toBe(hitResult.livesBefore - 1);
  });

  test('space bar performs an air jump when the player has one available', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    // First jump from the ground
    await page.keyboard.press('Space');
    await page.waitForFunction(() => gameState.dimbadimba.jumping === true);

    // Give the player an air jump mid-air (like the AIR JUMP special coin)
    await page.evaluate(() => {
      activateSpecialCoinEffect('airjump');
      gameState.airJumpsRemaining = 1;
    });

    // Wait until the player is falling, then press space again mid-air
    await page.waitForFunction(() => gameState.dimbadimba.velocityY > 0);
    const velocityBefore = await page.evaluate(() => gameState.dimbadimba.velocityY);
    await page.keyboard.press('Space');

    await page.waitForFunction(
      (before) => gameState.dimbadimba.velocityY < before,
      velocityBefore
    );
    expect(await page.evaluate(() => gameState.airJumpsRemaining)).toBe(0);
  });

  test('milestones apply stage, speed bonus and celebration', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const result = await page.evaluate(() => {
      gameState.score = 300;
      checkMilestone();
      return {
        milestoneIndex: gameState.currentMilestoneIndex,
        milestoneName: getCurrentMilestone().name,
        speedBonus: gameState.milestoneSpeedBonus,
        banner: gameState.pointIndicators.some(indicator =>
          (indicator.displayText || '').includes('DESERT')),
        particles: gameState.particles.length
      };
    });

    expect(result.milestoneIndex).toBe(1);
    expect(result.milestoneName).toBe('Desert');
    expect(result.speedBonus).toBe(0.5);
    expect(result.banner).toBeTruthy();
    expect(result.particles).toBeGreaterThan(0);
  });

  test('achievements unlock, persist to localStorage and show a toast', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    await page.evaluate(() => {
      gameState.score = 120;
      checkAchievements();
    });

    // Toast is displayed
    await expect(page.locator('.achievement-toast')).toBeVisible();
    const toastText = await page.locator('.achievement-toast').first().textContent();
    expect(toastText).toContain('Centurion');

    // Persisted in localStorage
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pixelRunnerAchievements') || '{}')
    );
    expect(stored.score_100).toBeTruthy();

    // Doesn't re-unlock on subsequent checks
    const toastCount = await page.evaluate(() => {
      checkAchievements();
      return document.querySelectorAll('.achievement-toast').length;
    });
    expect(toastCount).toBe(1);
  });

  test('daily challenge completion grants bonus points and persists', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const result = await page.evaluate(() => {
      // Force today's challenge to a state the run has already satisfied
      dailyChallenge.completed = false;
      dailyChallenge.metric = 'coins';
      dailyChallenge.target = 2;
      gameState.runStats.coinsCollected = 2;
      const scoreBefore = gameState.score;
      updateDailyChallengeProgress();
      return {
        scoreBefore: scoreBefore,
        scoreAfter: gameState.score,
        completed: dailyChallenge.completed,
        stored: JSON.parse(localStorage.getItem('pixelRunnerDailyChallenge') || 'null')
      };
    });

    expect(result.completed).toBeTruthy();
    expect(result.scoreAfter).toBe(result.scoreBefore + 250);
    expect(result.stored && result.stored.completed).toBeTruthy();
  });

  test('screen shake activates on demand and decays back to zero', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const active = await page.evaluate(() => {
      triggerScreenShake(10, 300);
      updateScreenShake(16);
      return {
        intensity: gameState.screenShake.intensity,
        hasOffset: gameState.screenShake.offsetX !== 0 || gameState.screenShake.offsetY !== 0,
        duration: gameState.screenShake.duration
      };
    });
    expect(active.intensity).toBe(10);
    expect(active.duration).toBeGreaterThan(0);

    const decayed = await page.evaluate(() => {
      updateScreenShake(1000);
      return gameState.screenShake;
    });
    expect(decayed.intensity).toBe(0);
    expect(decayed.offsetX).toBe(0);
    expect(decayed.offsetY).toBe(0);
  });

  test('hit feedback: particles burst, screen shakes and damage is tracked', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const result = await page.evaluate(() => {
      gameState.particles.length = 0;
      handleCollision();
      return {
        particles: gameState.particles.length,
        shakeDuration: gameState.screenShake.duration,
        damage: gameState.runStats.damageTaken,
        lives: gameState.lives
      };
    });

    expect(result.particles).toBeGreaterThan(0);
    expect(result.shakeDuration).toBeGreaterThan(0);
    expect(result.damage).toBe(1);
    expect(result.lives).toBe(2);
  });

  test('game over stores leaderboard entries and best-run ghost', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    // Play long enough to record some ghost frames
    await page.waitForFunction(() => gameState.ghost.recording.length >= 3);

    const result = await page.evaluate(() => {
      gameState.score = 420;
      gameOver();
      return {
        leaderboard: JSON.parse(localStorage.getItem('pixelRunnerLeaderboard') || '[]'),
        ghost: JSON.parse(localStorage.getItem('pixelRunnerGhost_endless') || 'null'),
        leaderboardHtml: document.getElementById('leaderboardContainer').innerHTML
      };
    });

    expect(result.leaderboard.length).toBeGreaterThan(0);
    expect(result.leaderboard[0].score).toBe(420);
    expect(result.leaderboard[0].mode).toBe('endless');
    expect(result.ghost).toBeTruthy();
    expect(result.ghost.score).toBe(420);
    expect(result.ghost.frames.length).toBeGreaterThanOrEqual(3);
    expect(result.leaderboardHtml).toContain('Best Runs');

    // A restarted run should load the saved ghost for playback
    await page.click('#restartButton');
    await page.waitForFunction(() => gameState.running === true);
    const ghostLoaded = await page.evaluate(() => ({
      hasPlayback: Array.isArray(gameState.ghost.playback),
      playbackScore: gameState.ghost.playbackScore
    }));
    expect(ghostLoaded.hasPlayback).toBeTruthy();
    expect(ghostLoaded.playbackScore).toBe(420);
  });

  test('dynamic music layers switch on with score', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const layers = await page.evaluate(() => {
      gameState.score = 50;
      updateMusicLayers();
      const low = { ...musicLayerState };
      gameState.score = 150;
      updateMusicLayers();
      const mid = { ...musicLayerState };
      gameState.score = 350;
      updateMusicLayers();
      const high = { ...musicLayerState };
      return { low, mid, high };
    });

    expect(layers.low.percussion).toBeFalsy();
    expect(layers.mid.percussion).toBeTruthy();
    expect(layers.mid.kick).toBeFalsy();
    expect(layers.high.percussion).toBeTruthy();
    expect(layers.high.kick).toBeTruthy();
  });

  test('game mode preference persists across reloads', async ({ page }) => {
    await page.click('#timeAttackModeBtn');
    expect(await page.evaluate(() => localStorage.getItem('pixelRunnerGameMode'))).toBe('timeAttack');

    await page.reload();
    await page.waitForFunction(() => window.__dimbadimbaReady === true);

    expect(await page.evaluate(() => gameState.gameMode)).toBe('timeAttack');
    await expect(page.locator('#timeAttackModeBtn')).toHaveClass(/selected/);
  });

  test('particle pool reuses released particle objects', async ({ page }) => {
    await page.evaluate(() => startGame());
    await page.waitForFunction(() => gameState.running === true);

    const result = await page.evaluate(() => {
      releaseAllParticles();
      const poolBefore = particlePool.pool.length;
      createParticleBurst(200, 200, 'coinCollect');
      const active = gameState.particles.length;
      const poolAfterSpawn = particlePool.pool.length;
      // Age out all particles so they return to the pool
      updateParticles(100000);
      return {
        poolBefore: poolBefore,
        active: active,
        poolAfterSpawn: poolAfterSpawn,
        poolAfterExpiry: particlePool.pool.length,
        remaining: gameState.particles.length
      };
    });

    expect(result.active).toBe(10);
    expect(result.poolAfterSpawn).toBe(result.poolBefore - 10);
    expect(result.remaining).toBe(0);
    expect(result.poolAfterExpiry).toBe(result.poolBefore);
  });
});
