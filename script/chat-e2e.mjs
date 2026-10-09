/**
 * Browser E2E — chatpanel trên WidgetExample với phiên khách (visitor).
 * Chạy: node script/chat-e2e.mjs [visitorId]
 */
import { chromium } from 'playwright';

const VISITOR = process.argv[2] || 'kh-e2e-browser';
const BASE = 'http://localhost:5174';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrors = [];
const failedRequests = [];
const chatRequests = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
});
page.on('requestfailed', (r) => failedRequests.push(`${r.url().slice(0, 120)} :: ${r.failure()?.errorText}`));
page.on('response', (r) => {
  if (r.status() >= 400) failedRequests.push(`RESP ${r.status()} ${r.url().slice(0, 140)}`);
});
page.on('request', (r) => {
  if (r.url().includes('message:stream') || r.url().includes('/api/v1/a2a')) {
    chatRequests.push(`${r.method()} ${r.url().slice(0, 140)}`);
  }
});

// 1. Login khách (cookie demo_visitor do proxy đặt)
const login = await ctx.request.post(`${BASE.replace('5174', '5501')}/demo/login`, {
  data: { visitorId: VISITOR },
});
console.log('login:', login.status(), await login.text());

// 2. Mở /chatpanel
await page.goto(`${BASE}/chatpanel`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000); // bundle 8MB + mount

// Shadow DOM của FAC panel
const host = page.locator('fac-agent-chat, [class*=fac], .fac-chat-host, #fac-chat-root').first();
let panel = null;
for (const sel of ['fac-agent-chat', '.fac-chat-host', '[id*=fac]', '[class*=chat]']) {
  const el = page.locator(sel).first();
  if (await el.count()) { panel = el; console.log('host element:', sel); break; }
}
if (!panel) {
  console.log('BODY snippet:', (await page.locator('body').innerText()).slice(0, 300));
}

// 3. Ảnh trang để xem UI
await page.screenshot({ path: '../_chatpanel_initial.png', fullPage: false });

// 4. Tìm ô nhập chat trong shadow DOM (nếu có) và gửi tin nhắn
const chatInput = page
  .locator('textarea, [contenteditable=true], input[type=text]')
  .first();
const inputVisible = await chatInput.count();
console.log('input found (light DOM):', inputVisible);

// Panel render trong shadow root — probe qua JS
const shadowProbe = await page.evaluate(() => {
  const roots = [];
  const walk = (el) => {
    if (el.shadowRoot) {
      roots.push(el.tagName.toLowerCase());
      el.querySelectorAll('*').forEach(walk);
    }
  };
  document.querySelectorAll('*').forEach(walk);
  return roots;
});
console.log('shadow roots:', shadowProbe);

let sent = false;
if (shadowProbe.length) {
  sent = await page.evaluate(async (visitor) => {
    const findHost = () => {
      const hosts = [];
      const walk = (el) => {
        if (el.shadowRoot) { hosts.push(el); el.querySelectorAll('*').forEach(walk); }
      };
      document.querySelectorAll('*').forEach(walk);
      return hosts;
    };
    const hosts = findHost();
    for (const h of hosts) {
      const doc = h.shadowRoot;
      const ta = doc.querySelector('textarea, [contenteditable=true]');
      if (ta) {
        ta.focus();
        if (ta.tagName === 'TEXTAREA') {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
          ).set;
          setter.call(ta, `Xin chào, tôi là khách ${visitor}. Cho tôi 1 gợi ý đầu tư ngắn hạn.`);
        } else {
          ta.textContent = `Xin chào, tôi là khách ${visitor}. Cho tôi 1 gợi ý đầu tư ngắn hạn.`;
        }
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 300));
        const btn =
          doc.querySelector('button[type=submit]') ||
          [...doc.querySelectorAll('button')].find((b) => {
            const t = (b.textContent || '').trim();
            return /gửi|send|►|➤/i.test(t) || b.querySelector('svg');
          });
        if (btn) { btn.click(); return 'clicked'; }
        ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        return 'enter';
      }
    }
    return null;
  }, VISITOR);
}
console.log('send:', sent);

// 5. Chờ phản hồi stream
await page.waitForTimeout(20000);
await page.screenshot({ path: '../_chatpanel_after.png', fullPage: false });

const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
console.log('--- chat requests:', JSON.stringify(chatRequests, null, 1));
console.log('--- failed requests:', failedRequests.slice(0, 5));
console.log('--- console errors:', consoleErrors.slice(0, 5));

// 6. Check response text trong shadow DOM
const replyProbe = await page.evaluate(() => {
  const texts = [];
  const walk = (el) => {
    if (el.shadowRoot) {
      const t = el.shadowRoot.textContent || '';
      if (t.length > 50) texts.push(t.slice(-600));
      el.querySelectorAll('*').forEach(walk);
    }
  };
  document.querySelectorAll('*').forEach(walk);
  return texts;
});
console.log('--- shadow reply tail:', JSON.stringify(replyProbe).slice(0, 800));

await browser.close();
console.log('DONE visitor=', VISITOR);
