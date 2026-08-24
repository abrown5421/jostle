import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/api',
  test: {
    name: '@jostle/api',
    environment: 'node',
    watch: false,
  },
});
