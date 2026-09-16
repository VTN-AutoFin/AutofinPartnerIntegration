# AUTOFIN Widget — Ví dụ tích hợp cho đối tác

Project mẫu giúp đối tác tích hợp **AUTOFIN Widget** vào hệ thống của mình:

1. **Proxy server (Backend-for-Frontend)** — điểm tiếp xúc duy nhất của browser. Server này:
   - phục vụ SDK widget tại `/embedded/autofin-embed.js`;
   - chuyển tiếp mọi `/api/*` sang API nguồn **và tự gắn machine token** —
     browser **không bao giờ** biết API nguồn cũng như không giữ token/secret nào.
2. **Example app (Vite + React)** — nhiều trang, mỗi trang mount một widget ví dụ
   (phái sinh, tín hiệu, bảng điện, tin tức, bộ lọc cổ phiếu, callbacks đặt lệnh).
3. **Tài liệu tiếng Việt** trong [`docs/`](docs/).

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
# 0) Yêu cầu: Node 22 (file .node-version dùng với fnm), finserver đang chạy :3000 (Admin repo), WebApp :4200 (tuỳ chọn — cần khi lấy SDK)

# 1) Cấu hình credential tổ chức
cp .env.example .env
# điền ORG_CLIENT_ID / ORG_CLIENT_SECRET (xem docs/02-cai-dat-chay.md)

# 2) Cài đặt + chạy dev (proxy :5501 + web :5174)
npm install
npm run dev
```

Mở **http://localhost:5174** — mở DevTools → Network: mọi request chỉ tới
origin proxy, không có request nào tới API nguồn.

## Script

| Script | Ý nghĩa |
|---|---|
| `npm run dev` | Proxy + Vite dev server song song |
| `npm run dev:proxy` | Chỉ proxy :5501 |
| `npm run dev:web` | Chỉ example app :5174 (forward `/api`, `/embedded` sang :5501) |
| `npm run build` | Build example app → `dist/` |
| `npm start` | Chỉ proxy :5501 — tự phục vụ `dist/` nếu đã build (prod) |

## Tài liệu

1. [Kiến trúc & bảo mật](docs/01-kien-truc.md) — luồng request/token, vì sao API nguồn bị giấu.
2. [Cài đặt & chạy](docs/02-cai-dat-chay.md) — env, lấy `ORG_CLIENT_ID/SECRET`, dev/prod.
3. [Proxy server](docs/03-proxy-server.md) — từng route, token cache/refresh, deploy.
4. [Tích hợp widget](docs/04-tich-hop-widget.md) — script tag, mount option, từng loại widget.
5. [Callbacks](docs/05-callbacks.md) — `onPartnerAction`, mở form đặt lệnh từ event.
6. [Chat AI](docs/06-chat-ai.md) — **Coming Soon**: chat AI chưa khả dụng ở giai đoạn này (1 tài khoản partner, chưa quản lý user).

Lịch sử thay đổi: [CHANGELOG.md](CHANGELOG.md) — hiện tại **Doc v0.1** (khởi tạo project ví dụ đầy đủ, upstream PROD, gỡ FAC Chat).

## Lưu ý hiện trạng SDK

SDK widget bản hiện tại khi chạy **standalone** (site không có shell AUTOFIN) hiển thị
bản *parity placeholder* — UI đầy đủ cần shell AUTOFIN. Toàn bộ luồng kỹ thuật
(nạp SDK → mount → callback → gọi API qua proxy) vẫn chạy đầy đủ và đúng contract;
khi bản SDK tự-chứa-UI phát hành, các trang ví dụ này hiển thị UI thật **không cần
sửa code**.

> Bảo mật: `ORG_CLIENT_ID` / `ORG_CLIENT_SECRET` chỉ tồn tại server-side (`.env`).
> Không bao giờ truyền token/secret vào `AutofinEmbed.mount()` — SDK sẽ cảnh báo.
