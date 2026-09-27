# Changelog

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/); project này
không phát hành npm nên dùng version tài liệu (doc vX.Y).

## [Doc v0.2] — 2026-09-25

### Added
- **Widget Chat AI** — lịch sử chat riêng cho từng khách của đối tác:
  - `getEndUserToken(externalUserId)` trong `server/token-manager.mjs` — xin
    token đã ký sẵn id khách, cache riêng theo từng khách (trần 5000), gộp
    request đồng thời, refresh một lần khi gặp 401.
  - Proxy dùng token theo khách cho `/api/gw/v1/chat/*`, token tổ chức cho các
    route còn lại. Chưa có phiên khách → `401 VISITOR_SESSION_REQUIRED`.
  - Phiên khách mẫu: `POST /demo/login`, `POST /demo/logout`, `GET /demo/me`.
    Thay bằng phiên đăng nhập thật khi áp dụng — id khách phải lấy từ phía
    server, không bao giờ từ dữ liệu trình duyệt gửi lên.
  - Trang **Chat AI** trong app ví dụ: đăng nhập khách, tạo phiên, gửi tin, xem
    lịch sử, và nút thử mạo danh để thấy `user_id` client gửi bị bỏ qua.

### Changed
- `.env.example`: `ORG_CLIENT_ID/SECRET` thành đường được khuyến nghị và là
  đường duy nhất dùng được cho chat; `PARTNER_*` chuyển thành tuỳ chọn kèm cảnh
  báo mọi khách sẽ chia sẻ chung lịch sử chat nếu dùng nó.

### Fixed
- Header `Authorization` do browser gửi không còn lọt lên API nguồn ở nhánh
  forward ẩn danh — giờ luôn bị xoá trước khi forward.

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

[Doc v0.2]: https://www.autofin.vn/
[Doc v0.1]: https://www.autofin.vn/
