import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// React plugin enables RTL component testing (T-364).
// React 19 only exports act() from the development CJS build.
// Force Vite to use development conditions so RTL can find React.act.
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['store/**/*.test.ts', 'hooks/**/*.test.ts', 'lib/**/*.test.ts', 'components/**/*.test.tsx'],
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
