# 06 — Chat AI widget

Widget chat giữ **lịch sử riêng cho từng khách** của đối tác. Đó là điểm khác biệt
duy nhất nhưng quan trọng so với các widget còn lại: những widget kia trả cùng một
dữ liệu cho mọi người, nên một token cấp tổ chức là đủ; chat thì cần biết đang nói
chuyện với ai.

## Nguyên tắc bắt buộc

> **Id khách phải lấy từ phiên đăng nhập phía server của đối tác.**
> Không lấy từ header, query hay body mà trình duyệt gửi lên.

Nếu lấy từ dữ liệu trình duyệt gửi, khách chỉ cần đổi một tham số là đọc được hội
thoại của khách khác. Proxy mẫu trong repo này đọc id khách từ cookie phiên
(`readVisitorId` trong [server/server.mjs](../server/server.mjs)) — khi chuyển sang
hệ thống thật, thay bằng phiên đăng nhập sẵn có của bạn và giữ nguyên nguyên tắc.

AUTOFIN **ký id khách vào token**, nên sau khi proxy đã lấy token thì trình duyệt
không thể đổi sang khách khác nữa. Mọi `user_id` client gửi kèm đều bị finserver bỏ
đi và ghi lại bằng giá trị lấy từ token.

## Cấu hình

Chat chỉ chạy trên đường **org machine token**:

```
ORG_CLIENT_ID=...
ORG_CLIENT_SECRET=...
```

Đường `PARTNER_CODE` / `PARTNER_CLIENT_ID` / `PARTNER_CLIENT_SECRET`
(auto-login bằng một tài khoản người dùng) **không dùng được cho chat**: mọi khách
sẽ mang danh tính của đúng tài khoản đó và chia sẻ chung một lịch sử. Proxy vì thế
luôn dùng `ORG_*` cho các route `/api/gw/v1/chat/*`, kể cả khi `PARTNER_*` có mặt.

## Luồng

```
Khách đăng nhập vào site đối tác
   │
   ▼
Proxy đối tác  ──POST {FIN_UPSTREAM}/org/token──────────────► finserver
   │  Authorization: Basic base64(clientId:clientSecret)      │ kiểm tra secret,
   │  body: { "externalUserId": "<id khách trong hệ đối tác>" }│ allowlist, hợp đồng
   │  ◄──── { data: { accessToken, expiresIn, scope } } ───────┘
   │        scope = "org_data end_user"
   ▼
Proxy cache token THEO TỪNG KHÁCH, gắn Bearer vào /api/gw/v1/chat/*
   │
   ▼
finserver giải id khách từ token, ghép với partner code, hash lại,
rồi truyền xuống chat service làm user_id
```

Giá trị `user_id` mà chat service nhận là `HMAC(secret, "<partnerCode>:<externalUserId>")`.
Id thô của đối tác **không bao giờ** rời khỏi finserver, nên nếu id của bạn là email
hay số điện thoại thì dữ liệu đó cũng không đi xa hơn.

## Token theo khách

[server/token-manager.mjs](../server/token-manager.mjs) giữ hai loại cache:

| Hàm | Dùng cho | Cache |
|---|---|---|
| `getAccessToken()` | widget dữ liệu chung | một bản dùng chung |
| `getEndUserToken(externalUserId)` | chat | một bản cho mỗi khách |

Cả hai đều cache đến `expiresIn − 60s`, gộp request đồng thời vào một lần fetch, và
refresh đúng một lần khi finserver trả 401. Cache theo khách có trần
`MAX_END_USER_ENTRIES` (5000) để site đông khách không phình bộ nhớ vô hạn.

## API

Mọi route đi qua proxy, cùng origin với trang. **Không gửi `user_id`** — finserver tự
điền:

| Việc | Endpoint |
|---|---|
| Tạo phiên | `POST /api/gw/v1/chat/session` |
| Danh sách phiên | `GET /api/gw/v1/chat/session?offset=0&limit=20` |
| Gửi tin | `POST /api/gw/v1/chat/direct?session_id=...` body `{ "message": "..." }` |
| Lịch sử | `GET /api/gw/v1/chat/history?session_id=...` |
| Hạn mức còn lại | `GET /api/gw/v1/chat/quota-remain` |

Hạn mức tính theo từng khách, nên mỗi khách của bạn có hạn mức riêng.

Nếu chưa có phiên khách, proxy trả `401` với `errorCode: VISITOR_SESSION_REQUIRED`.

## Thử trên máy

Trang **Chat AI** trong app ví dụ có sẵn phần đăng nhập khách giả lập:

1. Đăng nhập `kh-001`, bấm *Xem danh tính* — ghi lại `user_id` trả về (một
   chuỗi hex 64 ký tự).
2. Bấm *Thử mạo danh*: cùng endpoint nhưng gửi kèm `user_id` của người khác.
   Kết quả phải là **đúng chuỗi ở bước 1**.
3. Đăng xuất, đăng nhập `kh-002`, bấm *Xem danh tính* — phải ra chuỗi **khác**.

> Lời gọi mạo danh vẫn trả 200, và đó là đúng. Cơ chế bảo vệ là **ghi đè danh
> tính**, không phải từ chối request. Bằng chứng nằm ở `user_id` trả về, không
> nằm ở mã HTTP.

Khi `POST /chat/session` dùng được, kiểm tra thêm: tạo phiên và gửi tin với
`kh-001`, rồi đổi sang `kh-002` và bấm *Danh sách phiên* — phải trống.

## Chưa hỗ trợ

`POST /api/gw/v1/chat/session/share` nhận `session_id` mà không kèm danh tính, nên
ai có `session_id` là xem được phiên đó. Tính năng chia sẻ phiên vì thế **chưa dùng
được cho khách của đối tác** cho tới khi chat service phân vùng theo tổ chức.
