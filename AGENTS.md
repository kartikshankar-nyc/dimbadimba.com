# Agents

## Cursor Cloud specific instructions

### Project overview

Dimbadimba Pixel Runner — a client-side browser-based endless runner game built with vanilla JavaScript, HTML5 Canvas, and CSS. No backend, no database. All state (scores, preferences) lives in `localStorage`. It is a PWA.

### Running the app

Serve static files: `npx serve . -l 3000` (or `npm run serve`). Open `http://localhost:3000` in a browser.

### Testing

**Unit tests (Jest):** `npm test` runs all 48 unit tests (6 test suites). Config is in the `jest` key of `package.json`.

**E2E tests (Playwright):** `npm run test:e2e` runs 8 E2E tests. The webServer block auto-starts `npx serve . -l 3000`. Run `npx playwright install --with-deps` once to install browser binaries.

### Linting

ESLint is **not** in `devDependencies` and there is no `lint` script. The `.eslintrc.js` references React/TypeScript plugins that don't apply to this vanilla JS project. Linting is not configured.

### Key scripts (from `package.json`)

| Script | Command |
|--------|---------|
| `npm run serve` | `npx serve .` |
| `npm test` | `jest` (48 tests) |
| `npm run test:e2e` | `npx playwright test` (8 tests) |
| `npm run test:coverage` | `jest --coverage` |

### Codebase gotchas

- All game logic is in `script.js` (~5000 lines). The `src/` TypeScript files are unused by the running app.
- Font loading warnings in the console are expected (custom pixel font not served).
- The game has no backend — everything runs client-side with `localStorage` for persistence.
