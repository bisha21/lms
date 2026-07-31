import { defineConfig, devices } from '@playwright/test';

// Requires MONGOOSE_URI (a disposable Mongo instance — a GitHub Actions `services: mongodb`
// container in CI, or a local MongoDB in dev) and, for the checkout/webhook spec,
// STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET test-mode keys. See e2e/global-setup.ts.
const BASE_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // specs share one seeded Mongo instance
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
