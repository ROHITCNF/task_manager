import { defineConfig, devices } from '@playwright/test';

// Settings from docs/lld/testing.md §4.
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    timezoneId: 'Asia/Kolkata',
    locale: 'en-GB',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  projects: [
    { name: 'e2e', testDir: 'tests/e2e', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'visual',
      testDir: 'tests/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1720, height: 950 }, deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
