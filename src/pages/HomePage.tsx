import { Link } from 'react-router-dom';
import PageScaffold from './PageScaffold';

const ARCH = `┌──────────────────────────────┐
│  Browser (site đối tác)      │
│  — chỉ thấy domain proxy     │
└──────────┬───────────────────┘
           │  /embedded/autofin-embed.js
           │  /api/gw/v1/*
           ▼
┌──────────────────────────────┐
│  Proxy server (BFF)          │   ← project này: server/server.mjs
│  — serve SDK (cache)         │
│  — tự gắn Bearer machine     │
│    token (ORG_CLIENT_ID/     │
│    SECRET không xuống        │
│    browser)                  │
└──────┬───────────────┬───────┘
       │ /embed/*      │ /api/* (Bearer)
       ▼               ▼
┌────────────┐  ┌──────────────┐
│ WebApp     │  │ finserver    │
│ (SDK file) │  │ (API nguồn)  │
└────────────┘  └──────────────┘`;

const WIDGETS: Array<{ to: string; label: string; desc: string }> = [
  { to: '/derivatives', label: 'menu-derivatives', desc: 'Bảng giá hợp đồng tương lai/phái sinh' },
  { to: '/signals', label: 'comp-signals · menu-signals', desc: 'Khối và menu tín hiệu giao dịch' },
  { to: '/board', label: 'menu-board', desc: 'Bảng điện thị trường' },
  { to: '/news', label: 'menu-news', desc: 'Tin tức thị trường (autoMount)' },
  { to: '/stock-filter', label: 'stock-filter', desc: 'Bộ lọc cổ phiếu (tắt overlay nội bộ)' },
  { to: '/callbacks', label: 'onPartnerAction', desc: 'Bắt sự kiện → mở form đặt lệnh mẫu' },
];

export default function HomePage() {
  return (
    <PageScaffold
      title="Tổng quan"
      intro={
        <>
          Project ví dụ tích hợp <strong>AUTOFIN Widget</strong> vào site đối tác:
          một <strong>proxy server</strong> là điểm tiếp xúc duy nhất (giấu toàn bộ API nguồn),
          và nhiều trang ví dụ — mỗi trang mount một widget qua domain proxy.
          Xem <code>docs/</code> để biết chi tiết.
        </>
      }
    >
      <div className="widget-card">
        <div className="widget-card-title">Kiến trúc</div>
        <pre className="code-block">{ARCH}</pre>
      </div>

      <div className="widget-card">
        <div className="widget-card-title">Các widget ví dụ</div>
        <div className="widget-grid">
          {WIDGETS.map((w) => (
            <Link key={w.to} to={w.to} className="widget-link">
              <code>{w.label}</code>
              <span>{w.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="widget-card">
        <div className="widget-card-title">Quick start</div>
        <pre className="code-block">{`# 1) Cấu hình credential tổ chức
cp .env.example .env     # điền ORG_CLIENT_ID / ORG_CLIENT_SECRET

# 2) Chạy proxy + example app (dev)
npm install
npm run dev              # proxy :5501 + web :5174

# 3) Mở http://localhost:5174 — DevTools Network chỉ thấy origin này`}</pre>
        <p className="muted">
          Lưu ý: SDK hiện tại render bản parity (UI đầy đủ cần shell AUTOFIN). Luồng
          nạp SDK → mount → callback → gọi API qua proxy chạy đầy đủ ở mọi trang.
        </p>
      </div>
    </PageScaffold>
  );
}
