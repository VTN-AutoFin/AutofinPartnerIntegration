# Changelog

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/); project này
không phát hành npm nên dùng version tài liệu (doc vX.Y).

## [Doc v0.1] — 2026-09-16

### Added
- **Khởi tạo project ví dụ tích hợp AUTOFIN Widget cho đối tác**, gồm:
  - **Proxy server (Backend-for-Frontend)** `server/server.mjs` :5501 — điểm
    tiếp xúc duy nhất của browser: phục vụ SDK widget
    (`/embedded/autofin-embed.js`), chuyển tiếp `/api/*` sang API nguồn kèm
    token gắn tự động phía server, passthrough thư viện chart
    (`/static/charting_library/*`), `/healthz`, phục vụ bản build `dist/`.
  - **Example app (Vite + React)** :5174 — 6 trang ví dụ: phái sinh, tín hiệu,
    bảng điện, tin tức, bộ lọc cổ phiếu, callbacks đặt lệnh
    (`onPartnerAction` → form đặt lệnh mẫu).
  - **Tài liệu tiếng Việt** `docs/01…06` + README + CHANGELOG.

[Doc v0.1]: https://www.autofin.vn/
