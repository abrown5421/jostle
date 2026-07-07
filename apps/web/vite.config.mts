/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = env.VITE_API_ORIGIN || 'http://localhost:3000';

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/web',
    server: {
      port: 5173,
      host: 'localhost',
    },
    preview: {
      port: 5173,
      host: 'localhost',
    },
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      tsconfigPaths: true,
      conditions: ['@inithium/source', 'import', 'module', 'browser', 'default']
    },
    envPrefix: ['VITE_', 'API_', 'PORT', 'HOST'],
    define: {
      'process.env': {}
    },
    build: {
      outDir: './dist',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});