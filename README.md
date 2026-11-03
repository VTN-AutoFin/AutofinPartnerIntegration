# AUTOFIN Widget — Ví dụ tích hợp cho đối tác

> **Đây là project VÍ DỤ (example)** — mục đích: đối tác đọc code + docs rồi tự
> tích hợp vào hệ thống của mình. Các chi tiết chỉ có ở demo (trang ví dụ,
> `/demo/login`, biến `VITE_ORG_END_USER_ID`) **không mang sang production**.

Project mẫu giúp đối tác tích hợp **AUTOFIN Widget** vào hệ thống của mình:

1. **Proxy server (Backend-for-Frontend)** — điểm tiếp xúc duy nhất của browser. Server này:
   - phục vụ SDK widget tại `/embedded/autofin-embed.js`;
   - chuyển tiếp mọi `/api/*` sang API nguồn **và tự gắn machine token** —
     browser **không bao giờ** biết API nguồn cũng như không giữ token/secret nào.
2. **Example app (Vite + React)** — nhiều trang, mỗi trang mount một widget ví dụ
   (phái sinh, tín hiệu, bảng điện, tin tức, bộ lọc cổ phiếu, callbacks đặt lệnh).
3. **Tài liệu tiếng Việt** trong [`docs/`](docs/).

## Id khách (end user) — nguyên tắc quan trọng nhất

- **Không đặt id khách trong `.env` khi tích hợp thật.** `VITE_ORG_END_USER_ID`
  chỉ là tiện ích demo của project này (proxy KHÔNG có fallback env — id phải
  được gửi tường minh).
- **Backend đối tác quyết định id khách trong code**: lấy id từ phiên đăng nhập
  thật của hệ họ (user id trong session/JWT nội bộ) rồi server-side mới gọi
  `/api/org/token {externalUserId}` hoặc đặt cookie phiên khách.
- Id khách luôn đến từ **phiên phía SERVER** — không bao giờ nhận từ
  header/query/body do browser gửi (browser không thể tự nhận mình là khách
  khác, vì AUTOFIN ký `externalUserId` vào token).

### Hai góc nhìn của trang chat (chọn bằng `VITE_ORG_END_USER_ID`)

| `VITE_ORG_END_USER_ID` (build time) | Góc nhìn | Hành vi |
|---|---|---|
| **CÓ giá trị** (vd `kh-001`) | **End-user** | Trang tự đăng nhập id đó (`/demo/login`) → chat per-visitor: mỗi khách lịch sử + workspace riêng trong org |
| **Trống** | **Partner** | Không tạo phiên khách — proxy forward nguyên vẹn `Authorization`, staff/partner đăng nhập FAC tự quản phiên panel |

## Kiến trúc

```
Browser (site đối tác)
   │  chỉ thấy domain proxy
   ▼
Proxy server :5501 ── /embedded/autofin-embed.js ──► WebApp (file SDK, có cache)
        │
        └── /api/gw/* + Bearer machine token ──► finserver (API thị trường)
                  POST /api/org/token (Basic clientId:clientSecret, 1h, tự refresh)
```

## Quick start

```bash
# 0) Yêu cầu: Node 22 (file .node-version dùng với fnm) + IP máy nằm trong
#    partner allowlist của AUTOFIN (console, tab "Kết nối hệ thống").
#    Thiếu allowlist → mọi lần mint token trả 403 "Caller IP/host is not on
#    the partner allowlist" (API thị trường public vẫn chạy ẩn danh, chat thì chết).

# 1) Cấu hình .env
cp .env.example .env
#
# Các biến server proxy đọc lúc khởi động:
#   PORT               cổng proxy — mặc định 5501. Vite đọc cùng biến khi
#                      khởi động và tự forward /api, /embedded, /static, /demo,
#                      /financial-agent sang cổng này (không cần sửa vite.config.ts;
#                      restart CẢ HAI sau khi đổi)
#   FIN_UPSTREAM       API nguồn — PHẢI gồm đủ prefix
#                      (vd https://api.autofin.vn/gateway/api)
#   WEBAPP_UPSTREAM    nguồn SDK widget (/embed/autofin-embed.js)
#   FAC_WEB_UPSTREAM   nguồn fac-chat.js — bundle ChatPanel (/remote/fac-chat.js)
#   FAC_API_UPSTREAM   FAC API (/api/v1/* + /financial-agent/api/*)
#   ORG_CLIENT_ID / ORG_CLIENT_SECRET   machine token — BẮT BUỘC
#
# Các biến VITE_* chỉ Vite đọc lúc start (build time):
#   VITE_PARTNER_CODE, VITE_ORG_END_USER_ID, VITE_API_BASE
#
# Một cách duy nhất: ORG machine token — API thị trường (org token) +
# chat per-visitor (end-user token từ org token) + FAC (exchange từ end-user).

# 2) Cài đặt + chạy dev (proxy :5501 + web :5174)
npm install
npm run dev
```

Mở **http://localhost:5174** — mở DevTools → Network: mọi request chỉ tới
origin proxy, không có request nào tới API nguồn.

### Đổi `.env` → phải restart

Cả hai tiến trình chỉ đọc `.env` **một lần lúc khởi động**:

| Đổi biến nào | Restart gì |
|---|---|
| `PORT`, `*_UPSTREAM`, `ORG_*` | **Proxy** (`npm run dev:proxy`) |
| `VITE_*` | **Vite** (`npm run dev:web`) — proxy không đọc `VITE_*` |

Kiểm tra proxy đang chạy config gì: mở **`/healthz`** trên proxy — mục
`upstreams` in đúng giá trị đã nạp; kèm `dnsCache` + `upstreamHealth`
(chẩn đoán flake mạng: DNS, latency, lỗi gần nhất theo từng upstream).

## Script

| Script | Ý nghĩa |
|---|---|
| `npm run dev` | Proxy + Vite dev server song song |
| `npm run dev:proxy` | Chỉ proxy :5501 |
| `npm run dev:web` | Chỉ example app :5174 (forward `/api`, `/embedded`, `/static`, `/demo`, `/financial-agent` sang :5501) |
| `npm run build` | Build example app → `dist/` |
| `npm start` | Chỉ proxy :5501 — tự phục vụ `dist/` nếu đã build (prod) |
| `curl :5501/healthz` | Trạng thái proxy: token đã cache, config upstream, DNS cache, lỗi mạng gần nhất |

### Lệnh gốc (tương đương các script trên)

Chạy từ thư mục project, biến môi trường nạp từ `.env`:

```bash
# Backend — proxy server (Node 22 đọc .env qua --env-file)
node --env-file=.env server/server.mjs

# Frontend — Vite dev server (--host = bind cả LAN, không chỉ localhost)
npx vite --host

# Chạy nền + log ra file (mỗi tiến trình một tab/log riêng — tiện khi đọc log
# proxy và web tách biệt thay vì trộn như `npm run dev`):
node --env-file=.env server/server.mjs > /tmp/autofin-proxy.log 2>&1 &
npx vite --host > /tmp/autofin-web.log 2>&1 &

# Dừng theo cổng (khi process mồ côi giữ cổng sau terminal đóng đột ngột):
fuser -k 5501/tcp 5174/tcp
```

## Tài liệu

1. [Kiến trúc & bảo mật](docs/01-kien-truc.md) — luồng request/token, vì sao API nguồn bị giấu.
2. [Cài đặt & chạy](docs/02-cai-dat-chay.md) — env, lấy `ORG_CLIENT_ID/SECRET`, dev/prod.
3. [Proxy server](docs/03-proxy-server.md) — từng route, token cache/refresh, deploy.
4. [Tích hợp widget](docs/04-tich-hop-widget.md) — script tag, mount option, từng loại widget.
5. [Callbacks](docs/05-callbacks.md) — `onPartnerAction`, mở form đặt lệnh từ event.
6. [Chat AI (FAC ChatPanel)](docs/06-fac-chatpanel.md) — SDK riêng `FacAgentChat`, API `/api/v1/*` qua proxy; khách (phiên `demo_visitor`) tự gắn JWT FAC per-visitor (T5), staff forward Authorization nguyên vẹn.
7. [Widget chi tiết doanh nghiệp & chỉ số](docs/07-widget-chi-tiet.md) — nhóm `comp-*` theo mã (`symbol`), chỉ số/ngành inline 900px, `setProps` đổi mã lúc chạy.

Lịch sử thay đổi: [CHANGELOG.md](CHANGELOG.md) — nhánh này: per-visitor token + FAC exchange (T5 partner visitor) + FAC ChatPanel mount.

## Lưu ý hiện trạng SDK

SDK widget bản hiện tại khi chạy **standalone** (site không có shell AUTOFIN) hiển thị
bản *parity placeholder* — UI đầy đủ cần shell AUTOFIN. Toàn bộ luồng kỹ thuật
(nạp SDK → mount → callback → gọi API qua proxy) vẫn chạy đầy đủ và đúng contract;
khi bản SDK tự-chứa-UI phát hành, các trang ví dụ này hiển thị UI thật **không cần
sửa code**.

> Bảo mật: `ORG_CLIENT_ID` / `ORG_CLIENT_SECRET` chỉ tồn tại server-side (`.env`).
> Không bao giờ truyền token/secret vào `AutofinEmbed.mount()` — SDK sẽ cảnh báo.
