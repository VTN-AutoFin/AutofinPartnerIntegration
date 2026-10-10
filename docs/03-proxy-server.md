# 03 — Proxy server (Backend-for-Frontend)

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
2. Chọn token theo route (từ `token-manager`), ghi đè bất kỳ gì client gửi:
   - **Route chat** (`/api/gw/v1/chat/*`) + có cookie khách → **end-user token
     per-visitor** (`POST /api/org/token {externalUserId}`).
   - Còn lại → **machine token tổ chức** (`ORG_CLIENT_ID/SECRET` — danh tính
     duy nhất cho API thị trường; partner user login `PARTNER_*` đã bỏ).
3. `fetch(`${FIN_UPSTREAM}${req.originalUrl}`)` giữ nguyên method/path/query/body.
4. Nếu upstream trả **401** → refresh token và retry **đúng 1 lần**.
5. Response: strip `server`, `via`, `x-powered-by`, `content-encoding`…;
   lỗi 502 trả message tổng quát — **không chứa URL nguồn**.

### `GET /embedded/fac-chat.js`

- Fetch `${FAC_WEB_UPSTREAM}/remote/fac-chat.js`, cache 5 phút — bundle chat AI.
- Chi tiết mount: [FAC ChatPanel](06-fac-chatpanel.md).

### `ALL /financial-agent/api/*` (STREAM)

- Forward nguyên suffix sang `${FAC_API_UPSTREAM}` bằng **pipe** (SSE
  `/message:stream` không được buffer).
- Auth theo phiên khách (cookie `demo_visitor`, xem dưới):
  - **Có khách** → proxy tự gắn JWT FAC per-visitor, ghi đè mọi
    `Authorization` client gửi.
  - **Không khách** → forward nguyên vẹn (staff/partner dùng panel trực tiếp).

### `ALL /api/v1/*` (buffered)

- Cùng logic auth như trên, forward sang `${FAC_API_UPSTREAM}`.
- JWT FAC per-visitor: proxy đổi end-user token lấy JWT tại
  `POST {FAC_API_UPSTREAM}/api/v1/auth/central/exchange`, cache **25 phút**
  (T5 partner visitor — FAC tự materialize user khách vào org đối tác).

### `POST /demo/login` / `POST /demo/logout` / `GET /demo/me`

Phiên khách **demo** — thay cho hệ thống đăng nhập thật của đối tác:

- `/demo/login` nhận `{visitorId}` (tuỳ chọn) và đặt cookie **ký** 
  `demo_visitor` phía server; browser không tự chọn được mình là khách nào ở
  tầng API.
- Fallback `ORG_END_USER_ID` trong `.env` **chỉ để demo**.

> **Project VÍ DỤ — production KHÔNG dùng `/demo/login` và KHÔNG đặt id khách
> trong env.** Backend đối tác tự quyết định id khách **trong code**: lấy id từ
> phiên đăng nhập thật của hệ họ (session/JWT nội bộ) rồi đặt cookie phiên
> khách (hoặc tự gọi `/api/org/token`) ngay tại server của mình. Nguyên tắc
> bất di bất dịch: id khách luôn đến từ phiên phía SERVER, không bao giờ từ
> header/query/body trình duyệt.

### `GET /healthz`

```json
{
  "ok": true,
  "token": { "cached": true, "expiresInSeconds": 3120 },
  "endUserTokens": { "cached": 1, "inflight": 0 },
  "facTokens": { "cached": 1, "inflight": 0 },
  "upstreams": { "finserver": "...", "webapp": "...", "facWeb": "...", "facApi": "..." }
}
```

### Static `dist/` (prod)

Nếu `dist/` tồn tại: serve example app build + SPA fallback về `index.html`
(trừ `/api`, `/embedded`).

## Token manager

Machine token tổ chức:

```
getAccessToken()      → cache còn hạn: trả ngay; hết hạn: fetch mới (dedup concurrent)
refreshAccessToken()  → bỏ cache, fetch bắt buộc (gọi khi upstream 401)
tokenStatus()         → trạng thái cho /healthz, không tự fetch
```

- Token endpoint: `POST {FIN_UPSTREAM}/api/org/token` với
  `Authorization: Basic base64(clientId:clientSecret)`.
- Cache đến `expiresIn − 60s` (mặc định 1 giờ → cache ~59 phút).
- Credential đọc từ env `ORG_CLIENT_ID` / `ORG_CLIENT_SECRET` — **chỉ server**.

End-user token theo khách (chat) + JWT FAC (T5):

```
getEndUserToken(visitorId)  → token scope "org_data end_user" cho 1 khách, cache riêng từng khách
getFacToken(visitorId)      → đổi end-user token lấy JWT FAC ở /auth/central/exchange, cache 25'
```

- Key cache = `visitorId` đến từ cookie phiên khách (server-side) — có cap số
  lượng khách giữ token để không phình memory.

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
