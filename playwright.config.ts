import { defineConfig } from '@playwright/test';

// Cross-browser/Chromium smoke tests: these load the real production
// build (`dist/`) as an unpacked extension in real Chromium, unlike the
// Vitest suite which renders components in jsdom. See ROADMAP.md Stage 7.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 30_000,
});
