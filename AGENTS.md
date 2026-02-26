# Agents

## Cursor Cloud specific instructions

### Project overview

Dimbadimba Pixel Runner — a client-side browser-based endless runner game built with vanilla JavaScript, HTML5 Canvas, and CSS. No backend, no database. All state (scores, preferences) lives in `localStorage`. It is a PWA.

### Running the app

Serve static files: `npx serve . -l 3000` (or `npm run serve`). Open `http://localhost:3000` in a browser.

### Testing

**Unit tests (Jest):** There are two Jest configs (`jest.config.js` and the `jest` key in `package.json`). Running bare `npm test` fails with "Multiple configurations found". Use `npx jest --config package.json` to run the main JS unit tests. One pre-existing test failure in `tests/unit/button-visibility.test.js` (jsdom limitation with `scrollTop`).

**E2E tests (Playwright):** `npm run test:e2e`. The `playwright.config.js` has a pre-existing issue: `baseURL` is set to `file:// + __dirname` instead of `http://localhost:3000`, causing all E2E tests to fail with `ERR_FILE_NOT_FOUND`. The webServer block correctly starts `npx serve . -l 3000` on port 3000, but the tests navigate to `file://` URLs. This needs to be fixed in the codebase before E2E tests will pass.

**Playwright browsers:** Must be installed once with `npx playwright install --with-deps`.

### Linting

ESLint is **not** in `devDependencies` and there is no `lint` script in `package.json`. The `.eslintrc.js` references React/TypeScript plugins that don't apply to this vanilla JS project. Linting is effectively not configured for this codebase.

### Key scripts (from `package.json`)

| Script | Command |
|--------|---------|
| `npm run serve` | `npx serve .` |
| `npm test` | `jest` (fails due to dual config; use `npx jest --config package.json`) |
| `npm run test:e2e` | `npx playwright test` (pre-existing baseURL issue) |
| `npm run test:coverage` | `jest --coverage` |
