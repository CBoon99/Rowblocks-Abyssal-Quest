import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Plugin to rename index-3d.html to index.html after build
const renameIndexPlugin = () => {
  return {
    name: 'rename-index',
    closeBundle() {
      try {
        const distPath = resolve(process.cwd(), 'dist');
        const oldPath = resolve(distPath, 'index-3d.html');
        const newPath = resolve(distPath, 'index.html');
        
        if (existsSync(oldPath)) {
          const content = readFileSync(oldPath, 'utf-8');
          writeFileSync(newPath, content);
          console.log('✅ Renamed index-3d.html to index.html for Netlify');
          console.log('📦 Build output verified: index.html created successfully');
        } else {
          console.warn('⚠️ index-3d.html not found in dist, cannot rename');
        }
      } catch (error) {
        console.warn('Could not rename index file:', error);
      }
    }
  };
};

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/', // Ensure base path for Netlify
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
  plugins: [renameIndexPlugin()],
  optimizeDeps: {
    include: ['three', 'cannon-es', 'howler']
  }
});
