import { defineConfig } from 'vitest/config';

export default defineConfig({
  // No @vitejs/plugin-react: it wires up Fast Refresh, which only matters
  // for a dev server. Vite's built-in transform already turns JSX into JS,
  // which is all a test run needs.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    watch: false,
  },
});
