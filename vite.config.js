import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: process.env.GITHUB_ACTIONS ? '/taiko-rating-app/' : '/',
  resolve: {
    alias: {}
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'terser'
  },
  server: {
    port: 5173,
    strictPort: false,
    headers: {
      // Pyodide 需要这些 headers
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  define: {
    'process.env.NODE_ENV': '"development"',
    global: 'globalThis'
  }
});
