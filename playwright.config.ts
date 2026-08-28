import { defineConfig, devices } from '@playwright/test';

// Maps tenant subdomains to localhost so storefront E2E works without
// /etc/hosts changes (local AND CI). Host header is preserved, so the
// middleware/API tenant resolution behaves exactly like production.
const TENANT_HOST_RULES = [
  'MAP acme.saabiz.com 127.0.0.1',
  'MAP globex.saabiz.com 127.0.0.1',
].join(', ');

// In CI the servers are started by the workflow (built artifacts);
// locally Playwright starts the dev servers unless they're already managed
// (E2E_NO_WEBSERVER=1 → run against your own servers, e.g. `pnpm dev:api`
// and `pnpm dev:web` in separate terminals).
const webServer =
  process.env.CI || process.env.E2E_NO_WEBSERVER
    ? []
    : [
        {
          command: 'pnpm dev:api',
          port: 3001,
          reuseExistingServer: true,
          timeout: 600 * 1000,
        },
        {
          command: 'pnpm dev:web',
          port: 3000,
          reuseExistingServer: true,
          timeout: 600 * 1000,
        },
      ];

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  // This dev box is slow (multi-second per request); give assertions room.
  expect: { timeout: 30_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: [`--host-resolver-rules=${TENANT_HOST_RULES}`],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the locally installed Chrome to avoid browser downloads;
        // CI installs Playwright's own Chromium.
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
  ],
  webServer,
});