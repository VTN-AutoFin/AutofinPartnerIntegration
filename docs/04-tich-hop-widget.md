# 04 — Tích hợp widget vào site đối tác

## Nguyên tắc

1. Script nhúng tải từ **domain proxy** của đối tác:
   `<script src="https://<domain-proxy>/embedded/autofin-embed.js" defer></script>`
2. `apiBase` truyền vào `mount()` cũng là **domain proxy** → mọi API đi cùng nơi,
   không CORS, không lộ nguồn.
3. Không truyền token/secret vào widget — proxy đã gắn token server-side.

## Cách 1 — mount thủ công (khuyến nghị)

```html
<!-- 1. Load SDK từ domain proxy -->
<script src="https://api.tenmien-doitac.vn/embedded/autofin-embed.js" defer></script>

<!-- 2. Khối chứa widget -->
<div id="af-widget-menu-derivatives" style="height:450px;width:100%"></div>

<!-- 3. Mount -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.AutofinEmbed || !window.AutofinEmbed.mount) {
      console.error('[AUTOFIN] Không nạp được SDK');
      return;
    }

    window.AutofinEmbed.mount({
      el: '#af-widget-menu-derivatives',
      productId: 'menu-derivatives',
      locale: 'vi',                          // 'vi' | 'en'
      partnerCode: 'DEMO',                   // mã tổ chức của bạn
      dataProviderId: 'AUTOFIN',
      apiBase: 'https://api.tenmien-doitac.vn',

      onPartnerAction: function (event) {
        console.log('[AUTOFIN]', event);     // xem docs/05-callbacks.md
      },
    });
  });
</script>
```

`mount()` trả về **handle**:

| Thuộc tính/hàm | Ý nghĩa |
|---|---|
| `handle.unmount()` | Gỡ widget (dọn shadow DOM + listener) |
| `handle.setProps({ locale: 'en' })` | Đổi props ngay không cần mount lại |
| `handle.el` / `handle.shadow` | Element host / shadow root |

Snippet tương tự cho từng sản phẩm — xem thư mục `src/pages/` của project này
(mỗi trang có nút Copy mã nhúng).

## Cách 2 — autoMount (site tĩnh/CMS, không cần code mount)

```html
<script src="https://api.tenmien-doitac.vn/embedded/autofin-embed.js" defer></script>

<div
  data-autofin-product="menu-news"
  data-locale="vi"
  data-partner-code="DEMO"
  data-provider="AUTOFIN"
  data-api-base="https://api.tenmien-doitac.vn"
  style="height:480px"
></div>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    window.AutofinEmbed && window.AutofinEmbed.autoMount(); // quét mọi [data-autofin-product]
  });
</script>
```

## Danh sách `productId`

| productId | Mô tả |
|---|---|
| `menu-derivatives` | Menu bảng giá phái sinh (full menu) |
| `menu-signals` | Menu tín hiệu giao dịch |
| `menu-reports` | Menu báo cáo |
| `menu-news` | Tin tức thị trường |
| `menu-board` | Bảng điện thị trường |
| `stock-filter` | Bộ lọc cổ phiếu |
| `comp-signals` | Khối tín hiệu gọn |
| `comp-reports` | Khối báo cáo gọn |
| `overlay-stock-detail` / `overlay-index-detail` / `overlay-industry-detail` | Overlay chi tiết (stock/index/ngành) |

## Các option của `mount()`

| Option | Bắt buộc | Mô tả |
|---|---|---|
| `el` | ✓ | CSS selector hoặc HTMLElement chứa widget |
| `productId` | ✓ | Xem bảng trên |
| `partnerCode` | ✓ | Mã tổ chức (cấp trong console) |
| `apiBase` | ✓ (prod) | Domain proxy. Bỏ trống = mặc định theo origin của script |
| `locale` | | `'vi'` (mặc định) hoặc `'en'` |
| `theme` | | `'light'` \| `'dark'` |
| `dataProviderId` | | Mặc định `AUTOFIN` |
| `onPartnerAction` | | Callback sự kiện — xem [05-callbacks.md](05-callbacks.md) |
| `features.internalOverlays` | | `false` = widget không tự mở popup chi tiết, mọi sự kiện đi qua callback |

## Nhiều widget trên một trang

Gọi `mount()` nhiều lần với `el` khác nhau — hoàn toàn độc lập:

```js
const common = {
  locale: 'vi', partnerCode: 'DEMO', dataProviderId: 'AUTOFIN',
  apiBase: 'https://api.tenmien-doitac.vn',
  onPartnerAction: handleAction,
};
AutofinEmbed.mount({ ...common, el: '#w-board', productId: 'menu-board' });
AutofinEmbed.mount({ ...common, el: '#w-signals', productId: 'comp-signals' });
AutofinEmbed.mount({ ...common, el: '#w-news', productId: 'menu-news' });
```

Chỉ cần load script SDK **một lần** cho cả trang.

## React / Next.js

Project này dùng React — xem `src/lib/embed.ts` (`useAutofinEmbed` hook):
inject script một lần, mount vào ref, unmount khi component unmount. Áp dụng
nguyên tắc: script load 1 lần toàn app; `mount()` trong `useEffect`; `unmount()`
trong cleanup.
