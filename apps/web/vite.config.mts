import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  // @jostle/assets/public is the single source of truth for static
  // assets — pointing publicDir there instead of a local apps/web/public
  // means there's no copy step and no second place files could live.
  publicDir: '../../packages/assets/public',
  server: {
    port: 5173,
    host: 'localhost',
    // The API mounts auth and notifications routes directly (not under
    // /api), so those are what's proxied — same-origin from the browser's
    // point of view, which is what lets the httpOnly session cookie
    // round-trip in dev.
    proxy: {
      '/auth': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/notifications': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: 'localhost',
  },
  // @tailwindcss/vite has no vitest dependency of its own, so npm hoists a
  // single copy resolved against the root's vite@8, while this file's own
  // `vite` import resolves the locally-nested vite@7 (forced by the
  // workspace's vitest ~3.2.7 pin, which caps its own vite range below 8).
  // Confirmed at runtime (dev server +
  // browser screenshots) that Tailwind processes correctly either way;
  // this cast only clears the resulting cross-version Plugin type mismatch.
  plugins: [react(), tailwindcss() as PluginOption],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
