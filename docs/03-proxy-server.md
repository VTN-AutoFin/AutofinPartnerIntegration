# 03 — Proxy server (BFF)

Toàn bộ mã: [`server/server.mjs`](../server/server.mjs) + [`server/token-manager.mjs`](../server/token-manager.mjs).
Chỉ dùng Express + `fetch` toàn cục (Node 18+) — không thêm dependency proxy nào,
dễ đọc và tự sở hữu.

## Các route

### `GET /embedded/autofin-embed.js` (và `.js.map`)

- Fetch `${WEBAPP_UPSTREAM}/embed/autofin-embed.js`, cache in-memory **5 phút**
  (`sdkCache`), trả về với `Content-Type: application/javascript`.
- Không redirect → browser không biết file đến từ đâu.
- Cache-Control 5 phút cho browser.

### `ALL /api/*` (mọi method)

1. Bỏ header client không được chuyển tiếp: `authorization`, `cookie`,
   hop-by-hop (`connection`, `keep-alive`, `transfer-encoding`, …), `content-length`.
2. Lấy machine token từ `token-manager` → đặt `Authorization: Bearer <token>`
   (ghi đè bất kỳ gì client gửi).
3. `fetch(`${FIN_UPSTREAM}${req.originalUrl}`)` giữ nguyên method/path/query/body.
4. Nếu upstream trả **401** → `refreshAccessToken()` và retry **đúng 1 lần**.
5. Response: strip `server`, `via`, `x-powered-by`, `content-encoding`…;
   lỗi 502 trả message tổng quát — **không chứa URL nguồn**.

### `GET /healthz`

```json
{
  "ok": true,
  "token": { "cached": true, "expiresInSeconds": 3120 },
  "mode": "prod (dist/)"
}
```

### Static `dist/` (prod)

Nếu `dist/` tồn tại: serve example app build + SPA fallback về `index.html`
(trừ `/api`, `/embedded`).

## Token manager

```
getAccessToken()      → cache còn hạn: trả ngay; hết hạn: fetch mới (dedup concurrent)
refreshAccessToken()  → bỏ cache, fetch bắt buộc (gọi khi upstream 401)
tokenStatus()         → trạng thái cho /healthz, không tự fetch
```

- Token endpoint: `POST {FIN_UPSTREAM}/api/org/token` với
  `Authorization: Basic base64(clientId:clientSecret)`.
- Cache đến `expiresIn − 60s` (mặc định 1 giờ → cache ~59 phút).
- Credential đọc từ env `ORG_CLIENT_ID` / `ORG_CLIENT_SECRET` — **chỉ server**.

## Tuỳ biến

| Muốn | Làm gì |
|---|---|
| Đổi cổng proxy | `PORT` trong `.env` (đổi cả `vite.config.ts` dev proxy target) |
| Đổi nguồn API | `FIN_UPSTREAM` |
| Đổi nguồn SDK | `WEBAPP_UPSTREAM` |
| Cache SDK lâu hơn | `SDK_CACHE_TTL_MS` trong `server.mjs` |
| Thêm route riêng (vd chuyển đổi LOGOUT) | Thêm `app.post('/api/...')` trước route `ALL /api/*` |

## Deploy production

1. Build example app: `npm run build`.
2. Chỉnh `.env` prod (`FIN_UPSTREAM`/`WEBAPP_UPSTREAM` trỏ tới nguồn thật,
   `ORG_CLIENT_ID/SECRET` thật).
3. `npm start` (chạy dưới pm2/systemd/container).
4. Đặt HTTPS phía trước (nginx/Caddy/CDN) với domain công khai
   `https://api.tenmien-doitac.vn`.
5. Đăng ký **IP public của server** vào allowlist trong console đối tác —
   finserver từ chối cấp token nếu request đến từ IP lạ.
6. Cập nhật *Domain API công khai* + *Đường dẫn script nhúng* trong console
   đối tác để snippet trên console khớp với domain thật.

### Nginx mẫu (tùy chọn, đặt trước Node)

```nginx
server {
  listen 443 ssl;
  server_name api.tenmien-doitac.vn;

  location / {
    proxy_pass http://127.0.0.1:5501;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
```

> Sau nginx, request đến finserver vẫn đi qua `server.mjs` để được gắn token —
> nginx **không** được route thẳng sang `FIN_UPSTREAM`.
