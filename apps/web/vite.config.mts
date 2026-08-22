import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';

export default defineConfig({
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
