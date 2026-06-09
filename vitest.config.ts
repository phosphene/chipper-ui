import { defineConfig } from 'vite';
import path from 'path';

// Store tests are pure TypeScript — no React plugin needed.
// React plugin added when component tests are introduced (T-283).
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['store/**/*.test.ts', 'hooks/**/*.test.ts', 'lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['store/**/*.ts', 'hooks/**/*.ts'],
      exclude: ['store/**/*.types.ts', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
} as any);
