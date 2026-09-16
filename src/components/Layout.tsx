import { NavLink, Outlet } from 'react-router-dom';
import { API_BASE } from '../lib/embed';

const NAV = [
  { to: '/', label: 'Tổng quan', end: true },
  { to: '/derivatives', label: 'Phái sinh' },
  { to: '/signals', label: 'Tín hiệu' },
  { to: '/board', label: 'Bảng điện' },
  { to: '/news', label: 'Tin tức' },
  { to: '/stock-filter', label: 'Bộ lọc cổ phiếu' },
  { to: '/callbacks', label: 'Callbacks (đặt lệnh)' },
];

export default function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-name">AUTOFIN Widget</div>
            <div className="brand-sub">Ví dụ tích hợp đối tác</div>
          </div>
        </div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div>
            apiBase: <code>{API_BASE || <>(cùng origin)</>}</code>
          </div>
          <div className="muted">SDK: /embedded/autofin-embed.js</div>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
