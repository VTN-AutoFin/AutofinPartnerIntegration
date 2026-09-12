# 02 — Cài đặt & chạy

## Yêu cầu

- **Node.js 18+** (dùng `fetch` toàn cục).
- **finserver** (API nguồn) chạy ở `:3000` — repo `Admin`: `npm run finserver:dev`.
- **WebApp** chạy ở `:4200` — repo `WebApp`: `npm run autofin:dev`
  (proxy cần WebApp để lấy file SDK `/embed/autofin-embed.js`).

## 1. Cấu hình `.env`

```bash
cp .env.example .env
```

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `5501` | Cổng proxy công khai |
| `FIN_UPSTREAM` | `http://localhost:3000` | API nguồn (finserver) — chỉ server biết |
| `WEBAPP_UPSTREAM` | `http://localhost:4200` | Nguồn file SDK |
| `ORG_CLIENT_ID` | — | Credential tổ chức, ví dụ `DEMO_svc` |
| `ORG_CLIENT_SECRET` | — | Secret tổ chức (không xuống browser) |
| `VITE_API_BASE` | (trống) | Build-time: để trống = cùng origin (khuyến nghị) |

## 2. Lấy `ORG_CLIENT_ID` / `ORG_CLIENT_SECRET`

Hai cách:

1. **Console đối tác AUTOFIN** — đăng nhập tài khoản tổ chức → trang
   *Tổ chức → Kết nối hệ thống*: thấy `clientId` (mặc định `<partnerCode>_svc`)
   và secret (hiện một lần khi tạo/rotate). Đồng thời khai báo:
   - *Domain API công khai* — domain proxy của bạn, ví dụ `https://api.tenmien-doitac.vn`;
   - *Đường dẫn script nhúng* — mặc định `/embedded/autofin-embed.js`;
   - *IP allowlist* — IP public của server proxy.
2. **Do AUTOFIN cấp trực tiếp** khi mở khóa widget cho tổ chức.

## 3. Chạy dev

```bash
npm install
npm run dev
```

- Proxy: `http://localhost:5501`
- Example app: `http://localhost:5174` (Vite forward `/api` + `/embedded` sang proxy)

Kiểm tra nhanh proxy đã sống:

```bash
curl http://localhost:5501/healthz
# {"ok":true,"token":{...},"mode":"dev (chỉ proxy — chạy vite riêng)"}

curl -i http://localhost:5501/embedded/autofin-embed.js   # 200, application/javascript
curl http://localhost:5501/api/gw/v1/market/index-all      # 200 JSON (token tự gắn)
```

Nếu `/healthz` báo thiếu credential → kiểm tra `.env`; nếu 502 khi gọi API →
finserver chưa chạy `:3000`.

## 4. Build & chạy prod

```bash
npm run build     # example app → dist/
npm start         # proxy :5501 tự phục vụ dist/ (SPA fallback)
```

Trên production, thay `localhost:5501` bằng domain proxy công khai
(`https://api.tenmien-doitac.vn`) và đặt phía sau nginx/HTTPS. Xem
[03-proxy-server.md](03-proxy-server.md).

## Sự cố thường gặp

| Hiện tượng | Nguyên nhân |
|---|---|
| `Thiếu ORG_CLIENT_ID / ORG_CLIENT_SECRET` | Chưa tạo `.env` hoặc thiếu biến |
| `Khong tai duoc SDK widget` | WebApp `:4200` chưa chạy (hoặc sai `WEBAPP_UPSTREAM`) |
| `Proxy chua lay duoc machine token` | sai credential, hoặc IP server chưa có trong allowlist, hoặc finserver chưa chạy |
| Widget hiện "parity" placeholder | SDK bản hiện tại cần shell AUTOFIN để render UI đầy đủ (xem README) |
| 401 liên tục trên `/api/*` | Token hết hạn + refresh lỗi → kiểm tra credential/allowlist |
