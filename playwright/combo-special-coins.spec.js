const { test, expect } = require('@playwright/test');

test.describe('Combo and special coin mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#startButton');
    await page.click('#startButton');
    await page.waitForTimeout(400);
  });

  test('near-miss awards points and combo only once per obstacle', async ({ page }) => {
    const result = await page.evaluate(() => {
      gameState.paused = true;
      gameState.checkedObstacleIds = new Set();
      gameState.combo.count = 0;
      gameState.combo.multiplier = 1;
      gameState.nearMissCount = 0;
      gameState.score = 0;

      const playerRight = gameState.dimbadimba.x + gameState.dimbadimba.width;
      const playerBottom = gameState.dimbadimba.y + gameState.dimbadimba.height;
      const obstacle = {
        id: 999001,
        x: playerRight - 2,
        previousX: playerRight + 10,
        y: playerBottom - 6,
        width: 35,
        height: 55
      };

      checkNearMiss(obstacle);
      checkNearMiss(obstacle);

      return {
        nearMissCount: gameState.nearMissCount,
        comboCount: gameState.combo.count,
        comboMultiplier: gameState.combo.multiplier,
        score: gameState.score,
        checkedSize: gameState.checkedObstacleIds.size
      };
    });

    expect(result.nearMissCount).toBe(1);
    expect(result.comboCount).toBe(1);
    expect(result.comboMultiplier).toBeGreaterThan(1);
    expect(result.score).toBeGreaterThan(0);
    expect(result.checkedSize).toBe(1);
  });

  test('combo resets after timeout window', async ({ page }) => {
    const result = await page.evaluate(() => {
      gameState.combo.count = 4;
      gameState.combo.multiplier = 1.8;
      gameState.combo.lastActionTime = 1000;

      updateCombo(1000 + COMBO_TIMEOUT + 1);

      return {
        count: gameState.combo.count,
        multiplier: gameState.combo.multiplier,
        lastActionTime: gameState.combo.lastActionTime
      };
    });

    expect(result.count).toBe(0);
    expect(result.multiplier).toBe(1);
    expect(result.lastActionTime).toBe(0);
  });

  test('special coins activate jump and airtime powers correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      gameState.paused = true;
      gameState.powerups = [];
      gameState.coins = [];
      gameState.activePowerups = {};
      gameState.score = 0;
      gameState.combo.count = 0;
      gameState.combo.multiplier = 1;
      gameState.airJumpsRemaining = 0;

      const player = gameState.dimbadimba;
      const baseJumpForce = gameState.jumpForce;
      const baseGravity = gameState.gravity;

      function resetPlayerForJump() {
        player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
        player.velocityY = 0;
        player.jumping = false;
        gameState.airJumpsRemaining = 0;
      }

      function simulateJumpWithPower(type) {
        gameState.activePowerups = {};
        resetPlayerForJump();

        if (type) {
          activateSpecialCoinEffect(type);
        }

        jump();
        const initialVelocity = player.velocityY;
        const initialProjection = getLandingProjection();
        let minTop = getPlayerVisualBounds().top;

        for (let frame = 0; frame < 180; frame++) {
          updatePlayer(16);
          minTop = Math.min(minTop, getPlayerVisualBounds().top);
          if (!player.jumping && frame > 0) {
            break;
          }
        }

        return {
          initialVelocity,
          landingDistance: initialProjection ? initialProjection.groundDistance : 0,
          minTop,
          landed: !player.jumping
        };
      }

      function collectSpecialCoin(type) {
        gameState.coins.push({
          x: player.x + 2,
          y: player.y + 2,
          width: COIN_SIZE,
          height: COIN_SIZE,
          rotation: 0,
          magnetized: false,
          specialType: type,
          pulseOffset: 0
        });
        checkCoinCollisions();
      }

      const baseJump = simulateJumpWithPower(null);

      collectSpecialCoin(POWERUP_TYPES.JUMP_2X);
      const jump2Active = !!gameState.activePowerups[POWERUP_TYPES.JUMP_2X];
      const jump2 = simulateJumpWithPower(POWERUP_TYPES.JUMP_2X);

      collectSpecialCoin(POWERUP_TYPES.JUMP_3X);
      const jump3Active = !!gameState.activePowerups[POWERUP_TYPES.JUMP_3X];
      const jump2StillActive = !!gameState.activePowerups[POWERUP_TYPES.JUMP_2X];
      const jump3 = simulateJumpWithPower(POWERUP_TYPES.JUMP_3X);

      collectSpecialCoin(POWERUP_TYPES.HANGTIME);
      const hangtimeActive = !!gameState.activePowerups[POWERUP_TYPES.HANGTIME];
      const effectiveGravity = getEffectiveGravity();

      collectSpecialCoin(POWERUP_TYPES.AIR_JUMP);
      const airJumpActive = !!gameState.activePowerups[POWERUP_TYPES.AIR_JUMP];

      player.jumping = false;
      player.velocityY = 0;
      jump();
      const airJumpsAfterFirstJump = gameState.airJumpsRemaining;

      player.jumping = true;
      player.velocityY = -2;
      jump();
      const airJumpsAfterSecondJump = gameState.airJumpsRemaining;
      const secondJumpVelocity = player.velocityY;

      gameState.activePowerups[POWERUP_TYPES.JUMP_3X].timeLeft = 1;
      updatePowerups(20);
      const jump3Expired = !gameState.activePowerups[POWERUP_TYPES.JUMP_3X];

      return {
        baseJump,
        jump2Active,
        jump2,
        jump3Active,
        jump3,
        jump2StillActive,
        hangtimeActive,
        baseGravity,
        effectiveGravity,
        airJumpActive,
        airJumpsAfterFirstJump,
        airJumpsAfterSecondJump,
        secondJumpVelocity,
        jump3Expired,
        baseJumpForce,
        playerTopSafeMargin: PLAYER_TOP_SAFE_MARGIN
      };
    });

    expect(result.jump2Active).toBeTruthy();
    expect(result.baseJump.landed).toBeTruthy();
    expect(result.jump2.landed).toBeTruthy();
    expect(result.jump3.landed).toBeTruthy();
    expect(result.jump2.initialVelocity).toBeLessThan(result.baseJump.initialVelocity);
    expect(result.jump3Active).toBeTruthy();
    expect(result.jump2StillActive).toBeFalsy();
    expect(result.jump3.initialVelocity).toBeLessThan(result.baseJump.initialVelocity);
    expect(result.jump2.landingDistance).toBeGreaterThan(result.baseJump.landingDistance);
    expect(result.jump3.landingDistance).toBeGreaterThan(result.jump2.landingDistance);
    expect(result.baseJump.minTop).toBeGreaterThanOrEqual(result.playerTopSafeMargin);
    expect(result.jump2.minTop).toBeGreaterThanOrEqual(result.playerTopSafeMargin);
    expect(result.jump3.minTop).toBeGreaterThanOrEqual(result.playerTopSafeMargin);
    expect(result.hangtimeActive).toBeTruthy();
    expect(result.effectiveGravity).toBeLessThan(result.baseGravity);
    expect(result.airJumpActive).toBeTruthy();
    expect(result.airJumpsAfterFirstJump).toBeGreaterThanOrEqual(1);
    expect(result.airJumpsAfterSecondJump).toBe(result.airJumpsAfterFirstJump - 1);
    expect(result.secondJumpVelocity).toBeLessThan(-2);
    expect(result.jump3Expired).toBeTruthy();
  });
});
