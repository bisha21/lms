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
    // Each worker spins up its own mongodb-memory-server instance (see tests/setup.ts);
    // too many in parallel can exceed that instance's own internal startup timeout on
    // constrained machines/CI runners. Capping worker count trades some wall-clock time
    // for reliability.
    maxWorkers: 4,
  },
});
