import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    // Fixed port, matching game-backend's CORS_ORIGIN default exactly — and
    // NOT 3000, which game-backend's own server also defaults to. strictPort
    // fails loudly on a collision instead of silently drifting to 3001/3002/
    // etc., which was causing "Failed to fetch" (CORS mismatch) whenever the
    // game ended up on a port CORS_ORIGIN didn't expect.
    port: 8080,
    strictPort: true,
    open: true
  }
});
