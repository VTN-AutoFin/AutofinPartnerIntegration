import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dev: Vite :5174 — mọi request /api và /embedded đều forwarded sang proxy.
 * Cổng proxy đọc từ .env (PORT) — đổi .env là vite tự theo khi khởi động lại,
 * không phải sửa file này. Browser KHÔNG bao giờ thấy finserver / WebApp.
 *
 * Vite chỉ tự nạp biến có prefix VITE_* → đọc PORT thủ công. Proxy đọc cùng
 * biến (server/server.mjs) nên một chỗ khai báo, hai tiến trình theo.
 */
function readProxyPort(): number {
  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
    const match = raw.match(/^PORT=(\d+)\s*$/m);
    if (match) return Number(match[1]);
  } catch {
    /* .env thiếu → dùng cổng mặc định, trùng default của server.mjs */
  }
  return 5501;
}

const PROXY_PORT = readProxyPort();
const PROXY_TARGET = `http://localhost:${PROXY_PORT}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': PROXY_TARGET,
      '/embedded': PROXY_TARGET,
      '/static': PROXY_TARGET,
      '/demo': PROXY_TARGET,
      // fac-chat.js bundle build có VITE_API_BASE=/financial-agent → mọi API
      // call ra /financial-agent/api/v1/* — forward sang BFF (như /api).
      '/financial-agent': PROXY_TARGET,
    },
  },
  build: {
    outDir: 'dist',
  },
});
