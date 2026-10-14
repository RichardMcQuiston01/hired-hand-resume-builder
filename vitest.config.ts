import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    // e2e/ holds Playwright specs (a separate test runner, `npm run
    // test:e2e`) — Vitest's default glob would otherwise also pick them up.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
