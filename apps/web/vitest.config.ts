import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  plugins: [react()],
  test: {
    name: '@jostle/web',
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    watch: false,
    // The app is thin wiring (routes + BrowserRouter); the actual
    // transition logic is tested in @jostle/router. No spec files yet.
    passWithNoTests: true,
  },
});
