// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 120 * 1000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 30000,
    navigationTimeout: 45000,
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          slowMo: 100,
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        launchOptions: {
          slowMo: 100,
        }
      },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        launchOptions: {
          slowMo: 200,
        }
      },
    },
  ],

  webServer: {
    command: 'npx serve . -l 3000',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
}); 