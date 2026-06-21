import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for chipper-ui.
 *
 * Two modes:
 *  - Local dev: BASE_URL=http://localhost:3000 (default)
 *  - CI/live:   BASE_URL=https://chipper-ui.fly.dev (set in CI)
 *
 * Run: npx playwright test
 * Run against live: BASE_URL=https://chipper-ui.fly.dev npx playwright test
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },

  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Start local Next.js dev server when running locally (not in CI against live)
  ...(BASE_URL.includes('localhost') && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  }),
});
