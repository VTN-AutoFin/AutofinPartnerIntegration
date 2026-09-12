# 01 — Kiến trúc & bảo mật

## Tổng quan

Đối tác tích hợp AUTOFIN Widget thông qua **một máy chủ trung gian (proxy/BFF)**
do đối tác vận hành. Browser của người dùng cuối **chỉ giao tiếp với proxy** —
không biết sự tồn tại của API nguồn.

```
┌──────────────────────────────┐
│  Browser (site đối tác)      │
│  — chỉ thấy domain proxy     │
└──────────┬───────────────────┘
           │  GET /embedded/autofin-embed.js   (SDK widget)
           │  GET|POST /api/gw/v1/*            (dữ liệu widget)
           ▼
┌──────────────────────────────┐
│  Proxy server (BFF) đối tác  │   ← server/server.mjs trong project này
│  1. Serve SDK (cache 5 phút) │
│  2. Chuyển tiếp /api/*       │
│  3. Tự gắn Bearer token      │
└──────┬───────────────┬───────┘
       │ /embed/*      │ /api/* (Authorization: Bearer)
       ▼               ▼
┌────────────┐  ┌──────────────┐
│ WebApp     │  │ finserver    │
│ (file SDK) │  │ (API nguồn)  │
└────────────┘  └──────────────┘
```

## Luồng dữ liệu

### 1. Nạp SDK

- Trang đối tác nhúng `<script src="https://<domain-proxy>/embedded/autofin-embed.js" defer>`.
- Proxy fetch file từ WebApp (`/embed/autofin-embed.js`), cache in-memory 5 phút,
  trả về nội dung — **không redirect**, browser không biết file đến từ đâu.

### 2. Mount widget

- `window.AutofinEmbed.mount({ el, productId, partnerCode, apiBase, ... })`.
- `apiBase` = domain proxy → mọi API widget đi về cùng domain với script (không CORS).

### 3. Gọi API qua proxy

- Widget gọi ví dụ `GET {apiBase}/api/gw/v1/market/index-all`.
- Proxy nhận request → lấy machine token (xem dưới) → gắn header
  `Authorization: Bearer <token>` → chuyển tiếp sang finserver.
- Header client gửi (`Authorization`, `Cookie`) luôn bị **ghi đè/bỏ**.

### 4. Machine token (server-side)

```
POST {FIN_UPSTREAM}/api/org/token
Authorization: Basic base64(ORG_CLIENT_ID:ORG_CLIENT_SECRET)

→ { data: { accessToken, tokenType: "Bearer", expiresIn: 3600, partnerCode, ... } }
```

- Token là JWT của tổ chức (scope `org_data`), hết hạn mặc định **1 giờ**.
- `token-manager.mjs` cache token đến (expiresIn − 60s); các request đồng thời
  dùng chung 1 lần fetch; khi finserver trả 401, proxy refresh token đúng 1 lần
  rồi retry.

## Vì sao API nguồn được giấu hoàn toàn

| Cơ chế | Chi tiết |
|---|---|
| Cùng origin | `apiBase` trống = cùng origin với trang → browser không thấy domain nào khác |
| Không redirect | Proxy trả nội dung SDK/API trực tiếp, không 30x lên nguồn |
| Sanitize header | Bỏ `server`, `via`, `x-powered-by`, `content-encoding` từ response nguồn |
| Lỗi không lộ nguồn | Message lỗi proxy không chứa URL finserver/WebApp |
| Token ở server | `ORG_CLIENT_ID/SECRET` chỉ nằm trong `.env` server; browser không giữ gì |

## Bảo mật khi đưa lên production

1. **HTTPS bắt buộc** cho domain proxy (ví dụ `https://api.tenmien-doitac.vn`).
2. **IP allowlist**: cấu hình trong console đối tác (tab *Kết nối hệ thống*) —
   finserver chỉ nhận machine token khi request token đến từ IP đã đăng ký của
   server proxy.
3. **Xoay secret**: `ORG_CLIENT_SECRET` được xem/rotated trong console đối tác;
   thay trong `.env` và restart proxy.
4. **Không truyền token vào widget**: `AutofinEmbed.mount()` không nhận bất kỳ
   token/secret nào — nếu truyền, SDK chủ động cảnh báo trên console.
5. Giới hạn tốc độ (rate-limit) tuỳ đối tác tự cấu hình ở tầng proxy/nginx.

## Danh sách API widget điển hình (đều qua proxy)

Tất cả nằm dưới `/api/gw/v1/*`, ví dụ:

| Nhóm | Endpoint |
|---|---|
| Phái sinh | `GET /api/gw/v1/derivative/days-info`, `POST /api/gw/v1/derivative/bid-ask`, `GET /api/gw/v1/derivative/ohlc` |
| Thị trường | `GET /api/gw/v1/market/index-all`, `/market/symbols`, `/market/symbol-detail`, `/market/candle-by-date` |
| Tín hiệu | `GET /api/gw/v1/signals`, `/signals/opening-signals`, `/signals/closing-signals`, `/signals/signal-deals` |
| Tin tức | `GET /api/gw/v1/news/*` |
| Dữ liệu/lọc | `GET /api/gw/v1/data/*`, `GET /api/gw/v1/search` |
