# Pixel Runner Game Testing

This document describes the testing infrastructure for the Pixel Runner game.

## Test Coverage

We've implemented both unit tests and end-to-end tests to ensure the game functions correctly, with special focus on the pause/unpause functionality which was previously experiencing issues.

### Unit Tests (Jest)

Unit tests focus on testing individual functions in isolation:

- **toggle-pause.test.js**: Tests the debounce mechanism and state transitions of the pause toggle functionality.
- **animation-loop.test.js**: Tests the game animation loop's handling of pause/unpause, timing, and error recovery.

### End-to-End Tests (Playwright)

E2E tests validate the game's behavior from a user perspective:

- **pause-functionality.spec.js**: Verifies that rapidly toggling pause doesn't break the game.
- **game-basics.spec.js**: Ensures core game functionality works correctly.

## Running the Tests

Before running tests, install dependencies:

```bash
npm install
```

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode during development
npm run test:watch
```

### Running End-to-End Tests

```bash
# Install Playwright browsers (first time only)
npm run install:browsers

# Run all E2E tests headlessly
npm run test:e2e

# Run tests with visible browser (headed mode)
npm run test:e2e:headed

# Run tests with Playwright debugger
npm run test:e2e:debug

# Run only the pause functionality tests in headed mode
npm run test:e2e:pause-tests
```

## Key Fixes for Pause Functionality

The tests validate the following fixes that were implemented:

1. **Debounce Mechanism**: A cooldown period prevents rapid pause/unpause toggling that could cause timing conflicts.

2. **Animation Frame Management**: The `animationFrameId` is now properly tracked and old frames are canceled when appropriate.

3. **Delta Time Handling**: Default values are used when `lastTime` is zero, preventing physics jumps after unpausing.

4. **Timing Reset on Unpause**: `lastTime` is reset when unpausing to ensure smooth transitions.

The tests verify that these fixes prevent the bug where rapid pause toggling would cause the character to move in the opposite direction and break the game. 