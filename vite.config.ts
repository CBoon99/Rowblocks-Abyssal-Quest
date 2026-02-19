import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: '/index-3d.html'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index-3d.html'
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'cannon-es', 'howler']
  }
});
