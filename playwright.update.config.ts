import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Only run chromium to minimize dependencies
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Use list reporter for CI-friendly output
  reporter: 'list',
  use: {
    // No baseURL; tests use file:// URLs
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Only include our update test to avoid loading other spec files
  // by filtering via testMatch
  testMatch: ['tests/update.spec.ts'],
});

