# 05 — Callbacks (`onPartnerAction`)

Widget không xử lý đặt lệnh. Khi người dùng thao tác (bấm CTA đặt lệnh, mở chi
tiết mã…), SDK bắn sự kiện `partnerAction` — đối tác nhận để mở form/điều hướng
bằng hệ thống của chính mình.

Hai cách nhận:

```js
// 1) Theo từng widget (mount-scoped)
AutofinEmbed.mount({
  /* ... */
  onPartnerAction: function (event) { /* ... */ },
});

// 2) Toàn trang (late-bind, nhận cả event từ widget mount sau đó)
const off = AutofinEmbed.on('partnerAction', function (event) { /* ... */ });
// off() để hủy sub
```

## Cấu trúc `PartnerActionEvent`

```ts
{
  type: 'stock.order_cta',     // loại sự kiện (bảng dưới)
  partnerCode: 'DEMO',
  productId: 'comp-signals',
  locale: 'vi',
  symbol: 'VN30F1M',           // mã được thao tác
  exchange?: 'HNX',
  companyName?: 'Hợp đồng tương lai VN30',
  lastPrice?: 1234.5,
  changePercent?: 1.25,
  side?: 'BUY',                // với sự kiện đặt lệnh
  price?: 1230,                // giá CTA (nếu có)
  signalId?: 'sig-123',        // với sự kiện từ tín hiệu
  context?: { ... },           // dữ liệu phụ
  ts: 1699999999999,           // thời điểm (ms)
}
```

## Các `type` sự kiện

| type | Ý nghĩa | Hành động gợi ý |
|---|---|---|
| `stock.detail_open` | User mở chi tiết mã | Mặc định widget tự mở popup; nếu `features.internalOverlays: false` → tự chuyển trang `/chi-tiet/{symbol}` |
| `stock.order_cta` | User bấm đặt lệnh cổ phiếu | Mở form đặt lệnh của đối tác (`symbol`, `side`, `price`) |
| `signal.order_cta` | User bấm đặt lệnh từ tín hiệu | Mở form đặt lệnh kèm `signalId` |

## Ví dụ hoàn chỉnh — form đặt lệnh demo

Xem trang **Callbacks** trong project (`src/pages/CallbacksPage.tsx`). Bản JS thuần:

```js
AutofinEmbed.mount({
  el: '#af-widget',
  productId: 'comp-signals',
  locale: 'vi',
  partnerCode: 'DEMO',
  apiBase: 'https://api.tenmien-doitac.vn',
  // tắt popup nội bộ → mọi sự kiện đi qua callback
  features: { internalOverlays: false },

  onPartnerAction: function (event) {
    if (event.type === 'stock.order_cta' || event.type === 'signal.order_cta') {
      openYourOrderForm({
        symbol: event.symbol,
        side: event.side,
        price: event.price,
        signalId: event.signalId,
      });
    }

    if (event.type === 'stock.detail_open') {
      window.location.href = '/chi-tiet/' + event.symbol;
    }
  },
});
```

## Lưu ý

- Event **không chứa** token/secret hay dữ liệu nhạy cảm — chỉ dữ liệu hiển thị
  của mã được thao tác.
- `internalOverlays: true` (mặc định): widget tự mở popup chi tiết bên trong;
  `stock.detail_open` vẫn được bắn ra nếu muốn theo dõi.
- Demo log toàn cục: trang bất kỳ trong project đều có panel
  *partnerAction events* (dùng `AutofinEmbed.on`).
