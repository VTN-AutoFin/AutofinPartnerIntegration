# Changelog

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/); project này
không phát hành npm nên dùng version tài liệu (doc vX.Y).

## [Doc v0.1] — 2026-09-16

### Added
- **Khởi tạo project ví dụ đầy đủ** — tích hợp AUTOFIN Widget cho đối tác:
  - Proxy server (BFF) `server/server.mjs` :5501 — điểm tiếp xúc duy nhất của
    browser: serve SDK widget (`/embedded/autofin-embed.js`, cache 5 phút),
    forward `/api/*` sang finserver kèm Bearer token server-side, passthrough
    `/static/charting_library/*`, `/healthz`, serve `dist/` + SPA fallback.
  - Token manager `server/token-manager.mjs` — partner auto-login
    (`PARTNER_CODE/CLIENT_ID/CLIENT_SECRET`), cache đến `expiresIn - 60s`,
    refresh bắt buộc khi 401; fallback org machine token khi chưa cấu hình
    partner.
  - Example app Vite + React :5174 — 6 trang ví dụ: phái sinh, tín hiệu,
    bảng điện, tin tức, bộ lọc cổ phiếu, callbacks đặt lệnh (`onPartnerAction`
    → form đặt lệnh mẫu).
  - Tài liệu tiếng Việt `docs/01…06` + README.

### Changed
- **Chuyển toàn bộ upstream từ SIT sang PRODUCTION** (đã verify bằng curl):
  - `WEBAPP_UPSTREAM=https://www.autofin.vn` — bundle `/embed/autofin-embed.js`
    10.4MB shadow-always (không còn cảnh báo bundle-cũ 159KB của SIT).
  - `FIN_UPSTREAM`/`AUTH_API_BASE=https://api.autofin.vn/gateway/api` —
    partner-sign-in POST 200 + JWT với credential thật.
  - Partner credential đặt trong `.env`.
- Smoke test qua proxy PASS: SDK 200 (10.4MB), `/api/gw/v1/derivative/days-info`
  200, `/api/gw/v1/data/company/search/VNM` 200 dữ liệu thật.

### Removed
- **Gỡ FAC Chat integration khỏi example app** (SDK + proxy
  `/financial-agent` + route/nav `/chatpanel` + `FAC_WEB_UPSTREAM`/
  `FAC_API_UPSTREAM`). Chat AI chỉ còn giữ dạng tài liệu
  [docs/06-chat-ai.md](docs/06-chat-ai.md) — **Coming Soon** (1 tài khoản
  partner, chưa quản lý user).

[Doc v0.1]: https://www.autofin.vn/
