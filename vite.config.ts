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
      '/static': 'http://localhost:5501',
      // fac-chat.js bundle SIT build có VITE_API_BASE=/financial-agent → mọi API
      // call ra /financial-agent/api/v1/* — forward sang BFF :5501 (như /api).
      '/financial-agent': 'http://localhost:5501',
    },
  },
  build: {
    outDir: 'dist',
  },
});
