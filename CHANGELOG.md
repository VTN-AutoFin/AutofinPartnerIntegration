# Changelog

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/); project này
không phát hành npm nên dùng version tài liệu (doc vX.Y).

## [Doc v0.3] — 2026-10-23

### Added
- **Widget chi tiết doanh nghiệp** (`/company`): `comp-stock-detail` (720px),
  `comp-financials`, `comp-shareholders`, `comp-profile`, `comp-news` — tất cả
  nhận mount option `symbol` (mã CK), demo `handle.setProps({ symbol })` đổi
  mã lúc chạy. Cần SDK bundle WebApp ≥ commit `8f94c0dc` (nhóm surface inline
  mới; `comp-fa-metrics` đã bị xoá thay bằng 4 widget riêng).
- **Widget chỉ số & ngành** (`/market`): `overlay-index-detail` /
  `overlay-industry-detail` mount được inline (trước đây chỉ mở overlay),
  `symbol` = id chỉ số/ngành (`VNINDEX` / `INDUST_ALL`), cao đề xuất 900px.
- `docs/07-widget-chi-tiet.md` + bảng `productId`/option `symbol` trong
  `docs/04-tich-hop-widget.md` (kèm ví dụ `data-symbol` cho autoMount).
- `src/lib/snippet.ts`: snippet tự lấy chiều cao theo product
  (720/900/450) và phát dòng `symbol` khi có.

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

## [Doc v0.2] — 2026-10-03

### Added
- **Tích hợp lại FAC Chat (AI)** trên upstream PROD: SDK `FacAgentChat`
  (`/embedded/fac-chat.js` ← `FAC_WEB_UPSTREAM`), API `/api/v1/*` qua proxy
  (`FAC_API_UPSTREAM`), trang ví dụ `/chatpanel`, Vite dev proxy
  `/financial-agent`.

[Doc v0.2]: https://www.autofin.vn/
