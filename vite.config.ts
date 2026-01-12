import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5000,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
});