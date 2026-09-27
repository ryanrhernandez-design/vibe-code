import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Relative asset paths so the build works from any sub-path (GitHub Pages, static hosts).
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    // `vite build --mode single` inlines all art so the game can ship as one self-contained HTML file.
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
}));
