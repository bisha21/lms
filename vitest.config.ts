import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    hookTimeout: 60_000, // mongodb-memory-server downloads its binary on first run
    testTimeout: 20_000,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
  },
});
