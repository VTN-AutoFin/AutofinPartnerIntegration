# 07 — Widget chi tiết doanh nghiệp & chỉ số thị trường

Nhóm widget mới (2026-10): nội dung giống popup "Chi tiết cổ phiếu" / drawer
chỉ số trong app AUTOFIN, nhưng mount **inline** thẳng vào trang đối tác.

## Widget theo mã chứng khoán — option `symbol`

Tất cả nhận `symbol` (mã CK, ví dụ `FPT`, `VCB`, `HNX`…). Đổi mã lúc chạy:

```js
const handle = AutofinEmbed.mount({
  el: '#af-widget-comp-stock-detail',
  productId: 'comp-stock-detail',
  locale: 'vi',
  partnerCode: 'DEMO',
  dataProviderId: 'AUTOFIN',
  apiBase: 'https://api.tenmien-doitac.vn',
  symbol: 'FPT',
});

// người dùng chọn mã khác trên site đối tác → không cần mount lại
handle.setProps({ symbol: 'VCB' });
```

| productId | Nội dung | Cao đề xuất |
|---|---|---|
| `comp-stock-detail` | Khối tab đầy đủ chi tiết cổ phiếu (giá, tài chính, công ty, tin tức…) | 720px |
| `comp-financials` | Báo cáo tài chính | 450px |
| `comp-shareholders` | Bảng cổ đông lớn | 450px |
| `comp-profile` | Hồ sơ doanh nghiệp | 450px |
| `comp-news` | Tin tức của doanh nghiệp | 450px |

Khối lớn (`comp-stock-detail`) dùng **720px** — thấp hơn sẽ mất scroll.

## Chỉ số thị trường & ngành — `overlay-index-detail` / `overlay-industry-detail`

Trước đây chỉ mở dưới overlay fullscreen; giờ mount inline như widget thường.
`symbol` nhận **id chỉ số** hoặc **id ngành**, không phải mã CK:

| productId | `symbol` | Mặc định khi bỏ trống |
|---|---|---|
| `overlay-index-detail` | id chỉ số: `VNINDEX`, `HNXINDEX`… | `VNINDEX` |
| `overlay-industry-detail` | id ngành: `INDUST_ALL`… | `INDUST_ALL` |

Cao đề xuất **900px** — bên trong có biểu đồ TradingView 600px + bảng top cổ
phiếu. Widget có giá live qua MQTT của AUTOFIN, không cần site đối tác làm gì.

```html
<div
  data-autofin-product="overlay-index-detail"
  data-symbol="VNINDEX"
  data-locale="vi"
  data-partner-code="DEMO"
  data-provider="AUTOFIN"
  data-api-base="https://api.tenmien-doitac.vn"
  style="height:900px"
></div>
```

## `overlay-stock-detail` — khác nhóm trên

`overlay-stock-detail` vẫn là overlay popup-only (không mount inline). Widget
bảng giá/bộ lọc tự mở nó khi bấm vào một mã. Muốn chặn popup và tự xử lý:
`features: { internalOverlays: false }` (xem [04](04-tich-hop-widget.md)) —
khi đó nhận mã qua `onPartnerAction` rồi `setProps({ symbol })` cho widget
inline tương ứng.

## Trang ví dụ

- `/company` — cả 5 widget theo mã, symbol `FPT`.
- `/market` — chỉ số + ngành, symbol `VNINDEX` / `INDUST_ALL`.

⚠️ Widget nhóm này cần SDK bundle mới (`autofin-embed.js` từ WebApp ≥ commit
`8f94c0dc`). Proxy cache SDK 5 phút — sau khi nâng cấp WebApp, đợi hết cache
hoặc khởi động lại proxy.
