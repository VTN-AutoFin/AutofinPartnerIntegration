/**
 * FAC app (partner account): login bằng API local (/api/v1/auth/login —
 * trang /login chỉ có nút SSO), set localStorage auth_token, mở /org/users,
 * verify khách kh-001 trong danh sách user của Partner org DEMO.
 */
import { chromium } from 'playwright';

const EMAIL = process.argv[2] || 'demo@partner.local';
const PASSWORD = process.argv[3] || 'demo123456';
const BASE = 'http://localhost:5173';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// 1. Login API local (bypass trang SSO-only)
const res = await ctx.request.post('http://localhost:8002/api/v1/auth/login', {
  data: { email: EMAIL, password: PASSWORD },
});
const body = await res.json().catch(() => ({}));
console.log('login API:', res.status(), body?.user?.email || JSON.stringify(body).slice(0, 200));
if (!res.ok()) { await browser.close(); process.exit(1); }
const token = body.access_token || body.token;

// 2. Inject token + mở app
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate((t) => localStorage.setItem('auth_token', t), token);
await page.goto(`${BASE}/org/users`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
console.log('url:', page.url());

await page.screenshot({ path: '../_fac_org_users.png', fullPage: true });

const text = await page.evaluate(() => document.body.innerText);
console.log('--- has kh-001:', text.includes('kh-001'));
console.log('--- has Visitor kh-001:', /visitor\s*kh-001/i.test(text));
console.log('--- has end-user domain:', text.includes('end-user.p1.fac.autofin'));
console.log('--- has partner owner demo:', text.includes('demo@partner.local'));

// Bảng user — lọc dòng liên quan khách
const rows = text.split('\n').filter((l) => /kh-00|visitor|Visitor|demo@partner/i.test(l));
console.log('--- matching rows:', JSON.stringify(rows.slice(0, 15), null, 1));
await browser.close();
console.log('DONE');
