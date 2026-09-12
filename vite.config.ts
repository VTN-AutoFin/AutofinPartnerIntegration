import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev: Vite :5174 — mọi request /api và /embedded đều forwarded sang proxy
 * :5501. Browser KHÔNG bao giờ thấy finserver / WebApp.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:5501',
      '/embedded': 'http://localhost:5501',
    },
  },
  build: {
    outDir: 'dist',
  },
});
