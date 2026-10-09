/**
 * Integrated-app test: login khách DEMO (fallback DEMO_VISITOR_ID), chat,
 * verify kh-001 materialize trong FAC.
 */
import { chromium } from 'playwright';

const VISITOR = process.argv[2] || ''; // rỗng → dùng DEMO_VISITOR_ID ở proxy
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const bad = [];
const chatUrls = [];
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 130)}`); });
page.on('request', (r) => { if (r.url().includes('message:stream')) chatUrls.push(r.url().slice(0, 130)); });

// 1. /demo/login với body RỖNG → proxy fallback DEMO_VISITOR_ID (kh-001)
const login = await ctx.request.post('http://localhost:5501/demo/login', { data: {} });
const lj = await login.json();
console.log('login (empty body):', login.status(), JSON.stringify(lj));
const visitorId = lj.visitorId;

// 2. Mở chatpanel + gửi tin
await page.goto('http://localhost:5174/chatpanel', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
const sent = await page.evaluate(async (v) => {
  const hosts = [];
  const walk = (el) => { if (el.shadowRoot) { hosts.push(el); el.querySelectorAll('*').forEach(walk); } };
  document.querySelectorAll('*').forEach(walk);
  for (const h of hosts) {
    const ta = h.shadowRoot.querySelector('textarea, [contenteditable=true]');
    if (ta) {
      ta.focus();
      const text = `Khach ${v} here — mot cau loi khuyen dau tu ngan han?`;
      if (ta.tagName === 'TEXTAREA') {
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, text);
      } else { ta.textContent = text; }
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 400));
      const btn = h.shadowRoot.querySelector('button[type=submit]');
      if (btn) { btn.click(); return 'submit-btn'; }
      ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      return 'enter';
    }
  }
  return null;
}, visitorId);
console.log('send:', sent);

// 3. Chờ stream chạy (thinking + tools)
await page.waitForTimeout(30000);
await page.screenshot({ path: '../_integrated_kh001.png' });

// 4. Reply text từ shadow DOM
const tail = await page.evaluate(() => {
  const out = [];
  const walk = (el) => {
    if (el.shadowRoot) {
      const t = el.shadowRoot.textContent || '';
      if (t.length > 100) out.push(t.slice(-900));
      el.querySelectorAll('*').forEach(walk);
    }
  };
  document.querySelectorAll('*').forEach(walk);
  return out;
});
console.log('--- stream POST:', chatUrls);
console.log('--- 4xx:', bad);
console.log('--- tail:', JSON.stringify(tail).slice(0, 900));
await browser.close();
console.log('DONE visitor=', visitorId);
