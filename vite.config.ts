import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build works from any sub-path (GitHub Pages, static hosts).
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
