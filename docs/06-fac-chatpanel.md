# 06 — FAC ChatPanel (chat AI widget)

FAC ChatPanel là widget **chat AI** dùng SDK **riêng biệt** với AutofinEmbed:

| | AutofinEmbed (thị trường) | FAC ChatPanel |
|---|---|---|
| Global | `window.AutofinEmbed` | `window.FacAgentChat` |
| Bundle | `autofin-embed.js` (WebApp) | `fac-chat.js` (FAC frontend, `/remote/fac-chat.js`) |
| Mount | `AutofinEmbed.mount({el, productId, partnerCode, apiBase…})` | `FacAgentChat.mount(el, {apiBase, locale, layout…})` |
| API | `/api/gw/v1/*` (finserver, machine token) | `/api/v1/*` (FAC backend, tự quản phiên) |
| Callback | `onPartnerAction` | `notify {notify, dismiss}` + `onClose` |

## Proxy cần forward gì

`server/server.mjs` đã cấu hình sẵn 2 route cho FAC:

| Route proxy | Nguồn (env) | Ý nghĩa |
|---|---|---|
| `GET /embedded/fac-chat.js` | `FAC_WEB_UPSTREAM` (mặc định `:5173`) + `/remote/fac-chat.js` | Bundle SDK (cache 5 phút, không redirect) |
| `ALL /api/v1/*` | `FAC_API_UPSTREAM` (mặc định `:8002`) | API chat/A2A/SSE của FAC |

Khác với route `/api/gw/*` của finserver: route FAC **không gắn machine token** —
FAC backend tự quản phiên đăng nhập; header `Authorization` của client (nếu có)
được forward nguyên vẹn.

## Nhúng 3 bước (HTML thuần)

```html
<!-- 1. Load bundle QUA PROXY -->
<script src="/embedded/fac-chat.js" defer crossorigin="anonymous"></script>

<!-- 2. Container -->
<div id="af-chatpanel" style="height:600px;width:100%"></div>

<!-- 3. Mount -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    window.FacAgentChat.mount(document.getElementById('af-chatpanel'), {
      apiBase: '',                 // cùng origin — proxy forward /api/v1/*
      locale: 'vi',
      layout: 'embedded',          // 1 cột gọn; 'full' = 2 pane + lịch sử
      collapsibleHistory: true,
      defaultHistoryCollapsed: true,
      hideAgentSelector: true,
      defaultAgentName: 'expert_stock_agent',
      notify: {
        notify: function (severity, message, opts) {
          // forward toast FAC ra hệ thống thông báo của trang đối tác
        },
        dismiss: function (id) { /* ... */ },
      },
    });
  });
</script>
```

`mount()` trả về `handle`:

- `handle.setProps({ theme: 'dark', locale: 'en' })` — đổi props đang chạy.
- `handle.unmount()` — gỡ widget.

## Props chính

| Prop | Mặc định | Ý nghĩa |
|---|---|---|
| `apiBase` | giá trị build | Để `''` = cùng origin (qua proxy) — khuyến nghị |
| `locale` | `'vi'` | `'vi'` \| `'en'` |
| `theme` | `'light'` | `'light'` \| `'dark'` |
| `layout` | `'full'` | `'embedded'` = 1 cột cho widget |
| `hideHeader` | `false` | Ẩn thanh tiêu đề chat |
| `hideAgentSelector` | `false` | Ẩn chọn agent |
| `defaultAgentName` | — | Agent mở mặc định (vd `expert_stock_agent`) |
| `collapsibleHistory` / `defaultHistoryCollapsed` | `true` / `false` | Panel lịch sử phiên |
| `historyPosition` | `'right'` | Vị trí panel lịch sử |
| `showAssetRail` | `false` | Thanh tài sản (Plan/Files/Links) |
| `hostCss` | — | Chuỗi CSS ghi đè token `--color-*` — đổi giao diện theo thương hiệu |
| `notify` | — | `{ notify, dismiss }` — điều hướng toast ra host |
| `onClose` | — | Callback khi user bấm đóng |

## React

Xem `src/lib/facChat.ts` (`useFacChat` hook — inject script 1 lần, mount vào
ref, unmount khi unmount) và trang `src/pages/ChatPanelPage.tsx`.

## Đổi giao diện theo thương hiệu (`hostCss`)

```js
hostCss = `
  :root {
    --color-primary: #0055aa;
    --color-bg-primary: #ffffff;
  }
`;
```

FAC áp chuỗi này vào trong Shadow DOM — không đụng CSS trang chủ; trang chủ
cũng không thấy CSS bên trong widget (cách ly 2 chiều).

## Chạy demo trong project này

```bash
# 1) FAC backend + frontend
cd FinancialAgentComposer && python run_server.py        # :8002
cd FinancialAgentComposer/frontend && npm run dev        # :5173 (serve /remote/fac-chat.js)

# 2) Proxy + example app
cd WidgetExample && npm run dev
# → mở http://localhost:5174/chatpanel
```

FAC build bundle lần đầu: `cd FinancialAgentComposer/frontend && npm run build:remote`
(xuất `dist-remote/fac-chat.js`).
