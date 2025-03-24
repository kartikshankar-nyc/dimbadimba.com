# Dimbadimba Game E2E Tests

This directory contains end-to-end tests for the Dimbadimba game using Playwright.

## Test Structure

The tests are organized into three main files:

1. **game.spec.js**: Tests for core game functionality including initialization, player movement, controls, and game mechanics.
2. **mobile.spec.js**: Tests for mobile-specific features like orientation handling, touch controls, and responsive layout.
3. **visual.spec.js**: Tests for visual effects, animations, audio, and UI elements.

## Running the Tests

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

Make sure you have installed all dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npm run install:browsers
```

### Running Tests

Run all E2E tests:

```bash
npm run test:e2e
```

Run with UI mode (useful for debugging):

```bash
npm run test:e2e:ui
```

Run in debug mode:

```bash
npm run test:e2e:debug
```

Run specific test file:

```bash
npx playwright test tests/e2e/game.spec.js
```

### Test Reports

After running the tests, an HTML report will be generated. You can view it with:

```bash
npx playwright show-report
```

## Test Configuration

The tests are configured to run against a local server on port 3000. The server is automatically started when running the tests, serving the files from the project root.

Tests run on multiple browsers:
- Chromium
- Firefox
- WebKit
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## Modifying Tests

When modifying or adding tests, keep in mind:

1. Tests should be isolated and not depend on each other
2. Use page.evaluate() for accessing browser-specific functionality
3. For testing touch events and mobile features, use the mobile projects
4. Remember to clean up any modifications to the DOM or global state

## Known Limitations

- Animation frame rate tests may vary based on the machine running the tests
- Audio tests may behave differently in CI environments where audio is not available
- Some mobile tests may require specific viewport sizes to correctly simulate devices 