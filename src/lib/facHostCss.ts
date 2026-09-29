/**
 * CSS reskin cho panel FAC, tiêm vào shadow root của widget.
 *
 * Bản này copy từ `facHostOverrideCss.ts` của FinFE để giao diện khớp với web
 * AUTOFIN. Nó map design token của WebApp lên panel FAC: font Inter, mật độ
 * bình thường (FAC mặc định 80%, cỡ chữ gốc 11px), primary xanh lá, thang màu
 * grey trung tính.
 *
 * Vì sao dùng `:host` chứ không phải `.fac-theme-root`: FAC khai báo bảng màu
 * gốc và lớp token trung gian trên `:root, :host`. Chuỗi alias của custom
 * property được resolve TẠI `:host` rồi kế thừa xuống dưới dạng giá trị cụ thể,
 * nên phần tử con ghi đè bảng màu sẽ không resolve lại được. Sheet này nối SAU
 * style của FAC nên cùng độ ưu tiên thì bản này thắng.
 *
 * Muốn mang thương hiệu riêng thay vì giao diện AUTOFIN: vào console AUTOFIN,
 * tab *Thiết kế* của tổ chức, cấu hình rồi copy CSS sinh ra và thay toàn bộ
 * chuỗi dưới đây.
 *
 * Lưu ý: font Inter không được repo này nạp, nên sẽ rơi về font hệ thống trong
 * danh sách dự phòng. Thêm Google Fonts vào index.html nếu cần khớp tuyệt đối.
 */
export const FAC_HOST_CSS = `
/* ---------------------------------------------------------------------------
   Token NextUI mà sheet này cần.

   Bản gốc trong FinFE trông chờ trang chủ nhà (WebApp, có NextUI) cung cấp
   --nextui-background-default và --nextui-background-secondary; shadow host
   kế thừa chúng từ light DOM. Trang đối tác không có NextUI, nên chúng
   undefined và mọi khai báo hsl(var(--nextui-...)) trở thành không hợp lệ ở
   thời điểm tính giá trị — nền của khay nhập, header và vùng tin nhắn mất
   sạch, khiến ô nhập trông như biến mất.

   Giá trị lấy từ FinFE tailwind.config: background-default = greyPure.white
   (#FFFFFF), background-secondary = greyPure[75] (#F0F0F0); dark dùng
   greyPure[925] (#141414) và greyPure[1000] (#1A1A1A). Lưu dưới dạng ba kênh
   HSL vì sheet bọc chúng trong hsl().
   ------------------------------------------------------------------------- */
:host {
  --nextui-background-default: 0 0% 100%;
  --nextui-background-secondary: 0 0% 94.1%;
}
:host([data-theme="dark"]) {
  --nextui-background-default: 0 0% 7.8%;
  --nextui-background-secondary: 0 0% 10.2%;
}

:host {
  /* Font family — DIRECT decl to beat index.css ':host' Plus Jakarta */
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --font-family-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-family-body: var(--font-family-sans);
  --font-family-display: var(--font-family-sans);

  /* Typography scale -> WebApp density (px; rem/root irrelevant) */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;
  --font-size-4xl: 32px;

  /* Spacing -> WebApp density (~+45% over FAC 80%) */
  --spacing-2xs: 3px;
  --spacing-xs: 6px;
  --spacing-sm: 12px;
  --spacing-md: 18px;
  --spacing-lg: 22px;
  --spacing-xl: 28px;
  --spacing-2xl: 34px;
  --spacing-3xl: 40px;

  /* Border style/width (color derives from neutrals below) */
  --border-width-hairline: 1px;
  --border-width-default: 1px;
  --border-width-strong: 1px;     /* FAC 2px thick -> WebApp 1px */
  --border-style-default: solid;

  /* Shape / radius (slightly rounder to match WebApp) */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-sm: 10px;
  --radius-xl: 12px;

  /* Component metrics -> WebApp normal density */
  --button-height-sm: 32px;
  --button-height-md: 40px;
  --button-height-lg: 48px;
  --input-height-sm: 36px;
  --input-height: 40px;
  --input-height-lg: 48px;
  --touch-target-min: 40px;

  /* Icon sizes */
  --icon-size-xs: 10px;
  --icon-size-sm: 14px;
  --icon-size-md: 18px;
  --icon-size-lg: 20px;
  --icon-size-xl: 24px;
  --button-icon-size: var(--icon-size-md);

  /* Color theme: brand accent + status. Resolves at :host into the alias layer
     (--color-primary / --color-interactive-* / --color-accent-*) that FAC
     components consume, so accent + status follow the WebApp theme. */
  --color-accent: #33b46d;          /* WebApp brandPrimary 500 (FAC #10b981) */
  --color-accent-hover: #1d7e4b;    /* brandPrimary 600 */
  --color-accent-active: #17653e;   /* brandPrimary 700 */
  --color-accent-muted: #d8f3df;    /* brandPrimary 100 */
  --color-accent-subtle: rgba(51, 180, 109, 0.1);
  --border-focus: var(--color-accent);

  --status-success: #3bbd50;
  --status-warning: #f59e0b;
  --status-error: #ec3838;
  --status-info: #4265ff;
  --color-success: var(--status-success);
  --color-warning: var(--status-warning);
  --color-error: var(--status-error);
  --color-info: var(--status-info);

  /* LIGHT neutral palette -> WebApp pure grey (overrides FAC slate). Resolves
     at :host so every --surface-* / --border-* / --color-surface-* alias that
     references the neutral scale inherits WebApp grey. Dark mode re-declares
     these on .fac-theme-root, so this does not leak into dark. */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-150: #f0f0f0;     /* = WebApp background-secondary */
  --color-neutral-200: #ebebeb;
  --color-neutral-300: #cccccc;
  --color-neutral-400: #999999;
  --color-neutral-500: #808080;
  --color-neutral-600: #666666;
  --color-neutral-700: #4d4d4d;
  --color-neutral-800: #333333;
  --color-neutral-900: #1a1a1a;
  --color-neutral-950: #0f0f0f;

  /* Hardcoded (non-neutral-derived) text tokens -> WebApp greyText */
  --text-heading: #1a1a1a;         /* greyText 1000 */
  --text-muted: rgba(26, 26, 26, 0.62);
}

/* DARK: keep FAC zinc surfaces/text; ensure WebApp green accent reads.
   color-scheme: dark fixes system colors (scrollbars, form controls).
   Neutrals: let FAC's own [data-theme="dark"] cascade win (tokens.css defines
   0–950 including the previously-missing 0/150). No host override needed —
   redefining the full scale here inverted text (low-index neutrals = text must
   be light, surfaces dark; a naive dark-mirror mapping breaks text contrast). */
.fac-theme-root[data-theme="dark"] {
  color-scheme: dark;

  --color-accent: #33b46d;
  --color-accent-hover: #4fb87b;
  --color-accent-active: #1d7e4b;
  --color-accent-subtle: rgba(51, 180, 109, 0.18);
}

/* DARK surface split: NOT needed — the primary surfaces below resolve
   WebApp's NextUI background tokens (hsl(var(--nextui-background-*))).
   Custom properties INHERIT across the shadow boundary from WebApp's <html>,
   so they auto-flip with the WebApp theme: background-default = #ffffff
   (light) / #141414 (dark); background-secondary = #f0f0f0 / #050505. Cards
   (header, messages, input) ride background-default; the gutter (host, root,
   body, history column) rides background-secondary — the panel stays in
   sync with WebApp by construction, no [data-theme] branching. */

/* Composer input box (WebApp side-column mount): the box docks flush to the
   panel bottom edge. Focus keeps FAC's green accent border + glow. This sheet
   only loads in the WebApp mount, so standalone /chat is unaffected. Equal-
   specificity decls here win (appended after <style data-fac>). */
/* moat #40: WHITE input tray + rounded TOP corners. moat #36 section-split by
   tinting the tray grey (--color-neutral-150) and squaring its corners so it
   met the message area flush. moat #40 reverses that: the tray is now a WHITE
   slab (matching the white header + white .composer-chat-body card) whose TOP
   corners round toward the grey gap separating it from the body card above;
   bottom stays square/flush to the panel bottom. Focus indicator is the
   box-shadow ring (FAC :focus-within), independent of the border, so it
   survives. !important beats the FAC border/background on equal specificity. */
.chat-composer {
  border: none !important;
  background: hsl(var(--nextui-background-default)) !important;  /* input tray (WebApp bg-default) */
  border-top-left-radius: var(--radius-sm) !important;
  border-top-right-radius: var(--radius-sm) !important;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

/* Composer input font-size — FAC ships .chat-composer__textarea at
   --font-size-sm while message bubbles (.composer-chat-message-text) sit at
   --font-size-xs (one step smaller). In the standalone app the 1px gap is
   barely visible (sm 10px / xs 9px), but once this sheet inflates the tokens
   to WebApp density (sm 14px / xs 12px) the typed input reads noticeably
   larger than the messages above it. Match the input to the message-text size
   so injected text-size scaling keeps input + messages in lockstep.
   !important beats ChatComposer.css on equal specificity; sheet is remote-only
   (AgentChatRemoteLoader), so standalone /chat keeps its original sm sizing. */
.chat-composer__textarea {
  font-size: var(--font-size-xs) !important;
  min-height: calc(var(--font-size-xs) * 1.4);
}

/* Mobile (coarse pointer): prevent iOS Safari focus-zoom. iOS auto-zooms the
   viewport when a form field with computed font-size < 16px gains focus; the
   textarea above is pinned to --font-size-xs (12px), so tapping it on an
   iPhone zooms the whole chat in (keyboard shows AND page scales — the user
   wants ONLY the keyboard). Bump the textarea to 16px on touch devices only,
   which clears the threshold and stops the zoom. Desktop (hover) keeps xs so
   typed text stays size-matched to the message bubbles. Pinch-zoom stays
   available — no viewport user-scalable=no lock (preserves a11y).
   !important beats the xs clamp above + ChatComposer.css; scoped to coarse
   pointers so desktop is untouched; sheet is remote-only (AgentChatRemoteLoader),
   so standalone /chat keeps xs. */
@media (hover: none) and (pointer: coarse) {
  .chat-composer__textarea {
    font-size: 16px !important;
  }
}

/* Toolbar trigger buttons (moat #32): the textarea above is clamped to
   --font-size-xs, and .composer-control already declares font-size:
   var(--font-size-xs) — so the "Auto" (mode) + "Normal" (caveman) trigger
   labels already match the input size. But the textarea is pinned here
   explicitly while the triggers rely on FAC's .composer-control resolving the
   token through the shadow cascade. Pin the two triggers to the same token
   explicitly so the bottom buttons cannot drift off the input text size in the
   WebApp mount — symmetric with the textarea clamp above. !important beats any
   future FAC .composer-control change on equal specificity; sheet is
   remote-only (AgentChatRemoteLoader), so standalone /chat is unaffected. */
.chat-composer__mode-trigger,
.chat-composer__caveman-trigger {
  font-size: var(--font-size-xs) !important;
}

/* Caveman style dropdown — show all 4 modes (Off/Lite/Full/Ultra) without a
   scrollbar. FAC ships .composer-dropdown__menu capped at max-height:240px with
   overflow-y:auto (ChatComposer.css). That cap is for the agent list, which can
   grow long. The caveman selector always has exactly 4 fixed options, but in
   the WebApp mount the inflated spacing tokens (sm 12px) + wrapped Vietnamese
   mode descriptions push those 4 options past 240px, so the 4th ("Siêu cấp")
   lands under a scrollbar. Lift the cap for this menu only — scoped by the
   stable data-testid so the agent + mode dropdowns keep their scroll safety
   net. Equal-specificity attribute selector + this sheet appends AFTER every
   <style data-fac> (AgentChatRemoteLoader), so it wins; !important is bullet-
   proof against the dist-remote bundle lagging the source. Remote-only —
   standalone /chat keeps FAC's 240px cap. */
[data-testid="chat-composer-caveman-menu"] {
  max-height: none !important;
  overflow-y: visible !important;
}

/* Session header font — FAC ships the chat-column header elements with INLINE
   font-family: monospace (the session label + the token-stat chips). Inline
   styles beat the :host Inter decl above, so the header read as monospace
   instead of the WebApp font. Force Inter here so the remote header matches the
   host. Standalone /chat keeps FAC monospace — this sheet only loads in the
   WebApp mount (AgentChatRemoteLoader). !important is required to beat inline. */
[data-testid="a2a-session-display"],
[data-testid="session-stats-chips"] {
  font-family: var(--font-family-sans) !important;
}

/* Chat panel header (moat #40: WHITE slab + rounded bottom corners,
   superseding moat #36's grey blend). FAC's A2AChatPanel header bar carries a
   STABLE className .composer-chat-header (added in A2AChatPanel.tsx) — no more
   :has() structural guess. It ships an INLINE borderBottom '2px solid
   var(--color-border-primary)' + INLINE background var(--color-surface-
   secondary). In the WebApp side-column mount the divider is unwanted (moat
   #36) and the header is now a WHITE slab flush to the panel top whose BOTTOM
   corners round toward the grey gap separating it from the white
   .composer-chat-body card below. Inline styles beat any non-important rule,
   so !important is required. Standalone /chat is unaffected — this sheet only
   loads in the WebApp mount. */
.composer-chat-header {
  /* WebApp NextUI background-default: #ffffff light / #141414 dark (inherited
     across the shadow boundary, auto-flips — see DARK note above). */
  background: hsl(var(--nextui-background-default)) !important;
  border-bottom: none !important;
  border-bottom-left-radius: var(--radius-sm) !important;
  border-bottom-right-radius: var(--radius-sm) !important;
  /* Tighten the header bar vertically — FAC ships inline padding
     var(--spacing-xs) var(--spacing-sm) (6/12px here), and the inner
     new-chat + close buttons already sit ~26px tall, so the bar read as a
     bit too tall in the remote mount. Drop vertical to --spacing-2xs (3px)
     so the header is noticeably shorter while horizontal padding (12px) and
     the tappable button boxes are preserved. !important beats the inline
     padding shorthand; remote-only (AgentChatRemoteLoader), so standalone
     /chat keeps FAC's default padding. */
  padding: var(--spacing-2xs) var(--spacing-sm) !important;
}

/* Host frame (moat #36 follow-up: gray GLOBAL background UNDER the white
   chat panel). The shadow host (.agent-chat-remote) is the WebApp trailing-
   panel slot; it defaults to transparent, so the white .composer-chat sat
   flush on the WebApp white frame with no separation. Paint the host
   --color-neutral-150 (WebApp background-secondary grey) and inset it with
   padding so the white rounded .composer-chat below reads as a card floating
   on the grey global background. background !important guards against any
   host class; padding has no competitor. Remote-only — :host is the shadow
   host, styled only from inside this sheet (WebApp mount).
   DARK: the host sits outside .fac-theme-root, so a var() here would bake the
   LIGHT neutral scale (bug-5965 class). AgentChatRemoteLoader mirrors
   data-theme onto the host div — select it and pin the dark gutter directly. */
/* WebApp NextUI background-secondary: #f0f0f0 light / #050505 dark. Inherited
   across the shadow boundary from WebApp's <html>, so the host gutter flips
   with the WebApp theme WITHOUT a data-theme mirror or a var()-baking trap
   (bug-5965/5966 class) — NextUI tokens resolve OUTSIDE the shadow tree. */
:host {
  background: hsl(var(--nextui-background-secondary)) !important;
}

/* Chat panel ROOT = grey GLOBAL background (moat #36 follow-up: "global
   background under the chat panel is gray; chat panel on top white"). The
   root .composer-chat fills the host slot; paint it --color-neutral-150 (the
   same WebApp background-secondary grey as the :host frame) so the root
   blends seamlessly with the padded host frame into one grey global field.
   The white card is NOT the root — it is the main chat-area child below — so
   the root needs no radius/overflow. !important beats FAC's .composer-chat
   background-color (--color-bg-primary white) on equal specificity. Remote-
   only — this sheet only loads in the WebApp mount (AgentChatRemoteLoader). */
.composer-chat {
  background-color: hsl(var(--nextui-background-secondary)) !important;
}

/* White rounded CARD = the BODY section (moat #36 3-row refactor: header flush
   top -> body[messages + session history side-by-side] -> input flush bottom).
   The body now carries a STABLE className .composer-chat-body in
   A2AChatPanel.tsx and is a flex-row holding the messages scroll area AND the
   session-history column side-by-side. Header reaches the screen top and the
   input tray the screen bottom (both grey, flush, no radius), so the white
   rounded surface is the BODY ALONE - inset with margin so the grey global
   background (root .composer-chat + :host, both --color-neutral-150) shows
   around it on all four sides. overflow:hidden is inline on the body, so the
   border-radius clips children to the rounded card. !important on background
   beats any FAC bg; radius/margin have no inline competitor. Remote-only;
   standalone /chat keeps FAC's flat clear panel. */
.composer-chat-body {
  background-color: hsl(var(--nextui-background-secondary)) !important;  /* gutter around columns */
  border-radius: var(--radius-sm) !important;
  margin-top: var(--spacing-xs) !important;
  margin-bottom: var(--spacing-xs) !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

/* Messages scroll area (moat #36 3-row): transparent - it now sits INSIDE the
   white rounded .composer-chat-body card, so it inherits the card's white and
   must not paint its own bg/radius/margin (those moved to the body). Keep
   width:auto/max-width:none so it fills the flex-row body without overflow.
   Remote-only; standalone /chat keeps FAC's flat clear panel. */
.composer-chat-messages {
  background-color: hsl(var(--nextui-background-default)) !important;  /* messages card (WebApp bg-default) */
  border-radius: var(--radius-sm) !important;
  width: auto !important;
  max-width: none !important;
}

/* Session-history column - now INSIDE the white .composer-chat-body card
   (moat #36 3-row refactor: history is part of the messages section, beside
   the messages between header and input). FAC ships .session-history-column
   with an INLINE background var(--color-surface-secondary) (muted grey) and a
   first-child div holding the "Sessions" label + Plus new-session button.
   Make the column transparent so it shows the white card, drop the chat/
   history divider, and hide the redundant "Sessions" header (new sessions
   start from the chat flow; remote defaults to expert_stock_agent). Scope
   --color-bg-tertiary -> --color-neutral-150 so inactive session cards read
   as subtle grey cards on the white surface; the active card paints
   --color-interactive-primary (green) inline and stays green. Inline styles
   beat any non-important rule, so !important is required. This sheet only
   loads in the WebApp mount (AgentChatRemoteLoader); standalone /chat keeps
   FAC's grey panel + header. */
.session-history-column {
  background: hsl(var(--nextui-background-secondary)) !important;  /* gutter column */
  border-left: none !important;
  --color-bg-tertiary: hsl(var(--nextui-background-default));  /* inactive SessionItem cards resolve like cards; active keeps green */
}
.session-history-column .relative.group {
  margin-bottom: var(--spacing-xs) !important;  /* breathing room between cards; beats inline margin:2px 4px */
}
.session-history-column > div:first-child {
  display: none !important;
}

/* ── History overlay = FULL width (moat #123 override) ────────────────────
 *    "history view now has 50% width -> make it 100% width".
 *    OpenChat.css ships .composer-chat-history-overlay at width:50% so half
 *    the chat thread stays visible beside the overlay. That rule reaches the
 *    shadow via the fac-chat.css @import. The user wants the history view to
 *    cover the full message region, so widen it to 100%. Selecting a session
 *    still auto-collapses via onHistoryAutoCollapse (A2AChatPanel) to reclaim
 *    the scene. !important beats the imported 50% on equal specificity; this
 *    sheet appends AFTER every <style data-fac> and only loads in the WebApp
 *    mount (AgentChatRemoteLoader), so standalone /chat keeps its 50% overlay. */
.composer-chat-history-overlay {
  width: 100% !important;
  /* moat: dark-mode history overlay rendered WHITE. OpenChat.css ships
     background var(--color-surface-secondary) + border var(--color-border-
     primary) — semantic aliases declared on :host, which BAKE the LIGHT values
     and inherit as concrete values (bug-5965 class; the bug-5965 fix missed
     the --color-surface-* group). Until the rebuilt dist-remote carries the
     FAC-side dark re-declaration, pin the overlay to WebApp NextUI tokens
     here: they inherit across the shadow boundary from WebApp's <html> and
     auto-flip with the WebApp theme (same pattern as .composer-chat-header /
     .chat-composer above) — gutter surface in dark. */
  background: hsl(var(--nextui-background-secondary)) !important;
}
/* Dark: drop the side divider + shadow entirely. A zinc hairline (#27272a)
   on the #050505 gutter read as a bright edge strip ("white border"), and
   FAC's light 2px #e5e7eb border is worse — the overlay already separates
   from the messages card by its darker bg, so no divider is needed. */
.fac-theme-root[data-theme="dark"] .composer-chat-history-overlay--right {
  border-left: none !important;
  box-shadow: none !important;
}
.fac-theme-root[data-theme="dark"] .composer-chat-history-overlay--left {
  border-right: none !important;
  box-shadow: none !important;
}

/* ── Tool-call cards + group (moat #28: "Tool call styling broken in remote
 *    location") ──────────────────────────────────────────────────────────
 * ToolExecutionCard / ToolCallGroup ship as CSS MODULES (.module.css). In the
 * standalone app Vite hashes their classes and the component applies the
 * hashed names. But a module sheet is JS-imported → emitted to
 * dist-remote/frontend.css into document <head>, NOT the shadow root; the
 * shadow boundary blocks document stylesheets, so in the remote mount every
 * hashed rule is absent and the cards render RAW (black text, full-size,
 * transparent — no gray / mono / italic / compact row). The design tokens the
 * modules reference DO resolve here (:root,:host + this sheet), so we re-declare
 * the same rules against the stable data-testid hooks (class names are hashed
 * and unknowable, but the testids are literal). Token-driven → inherits the
 * WebApp density above automatically. Standalone /chat keeps the real module
 * sheet — this only loads in the WebApp mount (AgentChatRemoteLoader). */

/* Group container (mirrors ToolCallGroup.module.css .group) */
[data-testid="tool-call-group"] {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  gap: 0;
}

/* Collapsed state: pill + latest card share one line (.latestLine). The div is
   unnamed, so reach it via :has() on its toggle child (the file already uses
   :has above). Without this the pill stacks above the card. flex-wrap:nowrap
   guarantees the pill never drops to a second line beside the card. */
[data-testid="tool-call-group"] > div:has(> [data-testid="tool-call-group-toggle"]) {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  width: 100%;
  gap: 6px;
}
[data-testid="tool-call-group"] > div:has(> [data-testid="tool-call-group-toggle"]) > div:last-child {
  flex: 1 1 auto;
  min-width: 0;
}

/* "N earlier" / "collapse" toggle pill (.toggle) */
[data-testid="tool-call-group-toggle"] {
  flex: 0 0 auto;
  /* Stretch to the latest card's height, NOT flex-start. The card box renders
     ~40px (header + padding) while the pill's min-height is only
     --tool-card-row-height (25px); flex-start left the pill at 25 beside a 40px
     card -> the pair read as different heights / "not on the same line".
     Stretch makes the pill box match the card box; the pill is transparent so
     the only visible effect is the label centering (align-items:center below)
     within the taller box + a larger click target. */
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--spacing-sm);
  margin: var(--tool-card-pad-y) 0 0 0;
  min-height: var(--tool-card-row-height);
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  /* Match the card tool-name size (xs), NOT sm. This sheet inflates sm->14px
     but the latest card name resolves xs (12px), so a sm pill read one step
     BIGGER than the card and looked misaligned / off the card's line. xs +
     shared --tool-card-row-height (both 25px) keeps pill + card name on the
     same baseline. white-space:nowrap stops the icon+label from wrapping. */
  font-size: var(--font-size-xs);
  white-space: nowrap;
  /* Sans (Inter), NOT mono: --font-family-mono stack falls through to generic
     monospace -> Windows Courier New (slab SERIF) because WebApp ships no
     JetBrains Mono. Pill is a UI label, so use the injected WebApp sans to
     match the host font. Card tool-name stays mono (code identifier). */
  font-family: var(--font-family-sans);
  font-weight: 700;
  font-style: italic;
  /* Allow synthesis as a fallback in case the loaded Inter <link> lacks the
     bold-italic face; no visual cost when the real face is present. */
  font-synthesis: style weight;
  line-height: 1.2;
  cursor: pointer;
  border-radius: var(--radius-sm, 3px);
  transition: color 150ms ease, background 150ms ease;
}
[data-testid="tool-call-group-toggle"]:hover {
  color: var(--color-text-secondary);
  background: var(--surface-muted);
}

/* Card root (.toolCard — compact inline row) */
[data-testid="tool-execution-card"] {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--tool-card-pad-y) 6px;
  border: none;
  background: transparent;
  font-size: var(--font-size-xs);
  line-height: 1.2;
  margin: 0;
  max-width: 100%;
}

/* Header = first child (.toolCardHeader). Force the whole header subtree gray
   (icons + name + status badge) — replicates the module's forced-gray block
   that overrides the colored status-badge variants. */
[data-testid="tool-execution-card"] > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  min-height: var(--tool-card-row-height);
  color: var(--color-text-tertiary);
}
[data-testid="tool-execution-card"] > div:first-child,
[data-testid="tool-execution-card"] > div:first-child * {
  color: var(--color-text-tertiary);
}
[data-testid="tool-execution-card"] > div:first-child > div:first-child {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
[data-testid="tool-execution-card"] > div:first-child > div:last-child {
  display: flex;
  align-items: center;
  gap: 3px;
}
[data-testid="tool-execution-card"] > div:first-child svg {
  width: var(--font-size-xs);
  height: var(--font-size-xs);
}

/* Tool name = the text span in the header's left cluster (the icon span holds
   the svg, so :not(:has(svg)) singles out the name). Mono + italic per the
   module's .toolName (moat fc924817 "tool calls as italic style"). */
[data-testid="tool-execution-card"] > div:first-child > div:first-child span:not(:has(svg)) {
  font-family: var(--font-family-mono);
  font-style: italic;
  font-synthesis: style;
  font-weight: 500;
  font-size: var(--font-size-xs);
}

/* Expanded body = second child (.toolCardBody). Size + rhythm only; inner
   sections are hashed, so style the code blocks (pre) directly for legibility. */
[data-testid="tool-execution-card"] > div:nth-child(2) {
  width: 100%;
  margin-top: 4px;
  padding-top: 4px;
  font-size: var(--font-size-xs);
}
[data-testid="tool-execution-card"] pre {
  margin: 0;
  background: var(--surface-muted);
  color: var(--color-text-secondary);
  padding: 6px 10px;
  border-radius: 4px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

/* ── Tool-call cards: name-only (no expansion, no input/output) ─────────
 *    Hide the expanded body (params + result + chart + diff + search) and the
 *    chevron expand button so each tool call renders as a single compact row
 *    showing only the tool name. Remote-only — this sheet only loads in the
 *    WebApp mount (AgentChatRemoteLoader); standalone /chat keeps expansion. */
[data-testid="tool-execution-card"] > div:nth-child(2) {
  display: none !important;
}
[data-testid="tool-execution-card"] button.collapse-toggle--disclosure-vertical {
  display: none !important;
}

/* ── Section labels: "Tham số" (params) + "Kết quả" (result) ────────────
 *    "Tham Số và Kết quả font not aligned with webapp". ToolExecutionCard
 *    ships as a CSS MODULE (.sectionHeader / .sectionLabel in
 *    ToolExecutionCard.module.css). Module sheets are JS-imported -> emitted to
 *    dist-remote/frontend.css in document <head>, NOT the shadow root; the
 *    shadow boundary blocks them, so in the remote mount these two section
 *    labels render RAW — no weight / case / size, drifting off the host's
 *    Inter face + WebApp label convention. The block above restyles every OTHER
 *    tool-card part via stable data-testid hooks but skipped the labels.
 *    Redeclare the module's label rules HERE at WebApp density, pinned to the
 *    injected Inter font (--font-family-sans, set on :host above) so the params
 *    header + result label read as part of the host. Mirrors .sectionHeader /
 *    .sectionLabel in ToolExecutionCard.module.css. Stable testids added to
 *    ToolExecutionCard.tsx (hashed class names are unknowable from the shadow).
 *    Remote-only — this sheet only loads in the WebApp mount
 *    (AgentChatRemoteLoader); standalone /chat keeps the module sheet. */
/* Each label sits in a .sectionHeaderWithAction row (label left, copy btn
   right). That row's flex layout lives in the module too -> blocked by the
   shadow boundary, so in the remote mount the label + copy button stacked out
   of vertical alignment. Restore the row via :has() on the stable label testids
   (the row div is the direct parent). Scoped under the card to keep :has() cheap
   (the file already relies on :has() at [data-testid="tool-call-group"]). */
[data-testid="tool-execution-card"] :has(> [data-testid="tool-exec-params-header"]),
[data-testid="tool-execution-card"] :has(> [data-testid="tool-exec-result-label"]) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
/* Both labels: flex-centered icon + text on ONE baseline, identical line-height
   + min-height so the Parameters row and Result row share the same vertical
   rhythm (icons size=12 in both -> centering aligns them across rows).
   font-family pinned to the host Inter face. */
[data-testid="tool-exec-params-header"],
[data-testid="tool-exec-chart-header"],
[data-testid="tool-exec-result-label"],
[data-testid="tool-exec-search-label"],
[data-testid="tool-exec-file-edited-label"] {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.2;
  min-height: 18px;
  /* Neutralize <button> UA/global chrome (padding 8 + border + bg) that the
     shadow-blocked module .sectionHeader/.sectionLabel used to reset. Without
     this a <button> header (Params/Chart) keeps its padding while a <div> label
     (Result/Search/FileEdited) has none -> content baselines sit at different
     vertical offsets. Zero all so every section header/label shares one box;
     min-height above keeps the tap target. */
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
/* .sectionHeader toggle buttons (Params, Chart): normal case, medium weight. */
[data-testid="tool-exec-params-header"],
[data-testid="tool-exec-chart-header"] {
  font-weight: 500;
}
/* .sectionLabel divs (Result, Search, FileEdited): uppercase, semibold. */
[data-testid="tool-exec-result-label"],
[data-testid="tool-exec-search-label"],
[data-testid="tool-exec-file-edited-label"] {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── User message bubble: STRONG green fill + white text (moat #34) ─────
 *    "message now light green, make it stronger green, white text"
 *    The standalone FAC app paints the user bubble faint
 *    rgba(16,185,129,0.4) on dark text (ComposerChat.css). fac-chat.css
 *    already re-declares this under .fac-theme-root for the remote mount,
 *    but (a) the dist-remote bundle WebApp loads can lag that source, and
 *    (b) it relied on var(--color-accent-primary) which resolves faint
 *    with no !important, so it lost the cascade and the bubble rendered
 *    light green + dark text. Re-declare HERE — this sheet is the WebApp
 *    runtime hostCss, appended AFTER every <style data-fac>, so on equal
 *    specificity it wins; !important makes it bulletproof against the
 *    faint ComposerChat rule too. Explicit brandPrimary 600 (#1d7e4b)
 *    gives a strong green that carries white text at WCAG AA.
 *    Remote-only — this sheet only loads in the WebApp mount
 *    (AgentChatRemoteLoader); standalone /chat keeps FAC's faint bubble. */
.fac-theme-root .composer-chat-message-user .composer-chat-message-content {
  background-color: #33b46d !important;   /* WebApp brandPrimary 500 — lighter green */
  color: #ffffff !important;
  border: none !important;
}
.fac-theme-root .composer-chat-message-user .composer-chat-message-content .composer-chat-message-text,
.fac-theme-root .composer-chat-message-user .composer-chat-message-content p,
.fac-theme-root .composer-chat-message-user .composer-chat-message-content strong,
.fac-theme-root .composer-chat-message-user .composer-chat-message-content li {
  color: #ffffff !important;
}
.fac-theme-root .composer-chat-message-user .composer-chat-message-content a {
  color: #ffffff !important;
  text-decoration: underline;
}

/* ── Chat messages scrollbar -> WebApp app-scrollbar colors (moat #43) ─────
 *    "Make chat messages scroll bar the same color with Webapp".
 *    FAC's global shadow scrollbar (*::-webkit-scrollbar-thumb in index.css)
 *    paints the thumb var(--color-text-tertiary) — a slate grey that does NOT
 *    match the WebApp app-scrollbar (styles.scss .app-scrollbar). Mirror the
 *    WebApp tokens here so the messages scroll area reads as part of the host:
 *      thumb       = stroke-primary      = greyPure 300 = #B2B2B2
 *      thumb:hover = default-400         = greyPure 400 = #999999
 *      track       = surface-superstate  = greyPure  50 = #F5F5F5
 *    Width 10px + radius 6px (rounded-md) match .app-scrollbar. Scoped to
 *    .composer-chat-messages (the chat messages scroll area) so only that
 *    region is affected; specificity (.class + pseudo-element) beats FAC's '*'
 *    pseudo-element rule, and this sheet is appended after <style data-fac>.
 *    Remote-only — only loads in the WebApp mount (AgentChatRemoteLoader);
 *    standalone /chat keeps FAC's slate scrollbar. */
.composer-chat-messages {
  scrollbar-width: thin;
  scrollbar-color: #b2b2b2 #f5f5f5;
}
.composer-chat-messages::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.composer-chat-messages::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 6px;
}
.composer-chat-messages::-webkit-scrollbar-thumb {
  background: #b2b2b2;
  border-radius: 6px;
}
.composer-chat-messages::-webkit-scrollbar-thumb:hover {
  background: #999999;
}

/* Dark variant — darker thumb on a dark track so the bar still reads against
   FAC's zinc surfaces (mirrors WebApp dark app-scrollbar, same grey scale). */
.fac-theme-root[data-theme="dark"] .composer-chat-messages {
  scrollbar-color: #4d4d4d #1a1a1a;
}
.fac-theme-root[data-theme="dark"] .composer-chat-messages::-webkit-scrollbar-track {
  background: #1a1a1a;
}
.fac-theme-root[data-theme="dark"] .composer-chat-messages::-webkit-scrollbar-thumb {
  background: #4d4d4d;
}
.fac-theme-root[data-theme="dark"] .composer-chat-messages::-webkit-scrollbar-thumb:hover {
  background: #666666;
}

/* ── History sessions column scrollbar -> WebApp app-scrollbar colors (moat
 *    #43 follow-up: "scroll bar of history sessions column") ──────────────
 *    The session-history column scrolls inside .session-list (FAC
 *    SessionHistorySidebar.css: overflow-y:auto, width 5px, thumb
 *    var(--color-text-tertiary) = slate grey). Slate does not match the WebApp
 *    app-scrollbar grey, so recolor the thumb to the same WebApp tokens used
 *    for the messages area above:
 *      thumb       = stroke-primary      = greyPure 300 = #B2B2B2
 *      thumb:hover = default-400         = greyPure 400 = #999999
 *    Width stays 5px + transparent track (the column is a narrow grey rail;
 *    a thin floating thumb preserves the sidebar look while matching WebApp
 *    color). Scoped under .session-history-column .session-list so only the
 *    chat history list is affected; specificity (.class.class + pseudo-element)
 *    beats FAC's .session-list rule and this sheet is appended after
 *    <style data-fac>. Remote-only — only loads in the WebApp mount
 *    (AgentChatRemoteLoader); standalone /chat keeps FAC's slate scrollbar. */
.session-history-column .session-list {
  scrollbar-width: thin;
  scrollbar-color: #b2b2b2 transparent;
}
.session-history-column .session-list::-webkit-scrollbar {
  width: 5px;
}
.session-history-column .session-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}
.session-history-column .session-list::-webkit-scrollbar-thumb {
  background: #b2b2b2;
  border-radius: 10px;
}
.session-history-column .session-list::-webkit-scrollbar-thumb:hover {
  background: #999999;
}

/* Dark variant — lighter thumb on the dark zinc column. */
.fac-theme-root[data-theme="dark"] .session-history-column .session-list {
  scrollbar-color: #4d4d4d transparent;
}
.fac-theme-root[data-theme="dark"] .session-history-column .session-list::-webkit-scrollbar-thumb {
  background: #4d4d4d;
}
.fac-theme-root[data-theme="dark"] .session-history-column .session-list::-webkit-scrollbar-thumb:hover {
  background: #666666;
}

/* ── Markdown table in agent messages (moat #84: "better design the table in
 *    Chat Panel") ─────────────────────────────────────────────────────────
 *    FAC's ComposerChat.css ships a full 1px grid table that reads as a dense
 *    spreadsheet. The redesigned rules above (clean data-table: header
 *    underline + row dividers, zebra, hover, tabular-nums) reach the shadow
 *    via the dist-remote bundle, but (a) that bundle can lag the source, and
 *    (b) the semantic tokens (--color-bg-secondary/tertiary) it leans on
 *    resolve to FAC's slate scale, not WebApp's pure grey. Re-declare the
 *    redesign HERE against the stable .composer-chat-message-text wrapper
 *    using explicit WebApp neutrals + the brand accent on hover. This sheet
 *    appends AFTER every <style data-fac>, so on equal specificity it wins;
 *    !important makes it bulletproof against both the bundle lag and the FAC
 *    base rule. Token-sized via the spacing/font tokens inflated above, so the
 *    table breathes at WebApp normal density. Remote-only — standalone /chat
 *    keeps the ComposerChat.css redesign (same look, FAC slate neutrals). */
.composer-chat-message-text table {
  margin: var(--spacing-sm) 0 !important;
  border: 1px solid var(--color-neutral-200) !important;
  border-radius: var(--radius-sm) !important;
  overflow: hidden;
  line-height: 1.4;
  /* moat #126: "table not render css correctly with WebApp". mount.tsx inlines
     ONLY fac-chat.css?inline into the shadow root; ComposerChat.css (the plain
     sheet that declares the base table look) is JS-imported -> emitted to
     document <head>, so the shadow boundary BLOCKS it. Without these three
     decls the UA defaults win: border-collapse:separate leaves a border-spacing
     gap between every cell (disjoint double-bordered grid), width:auto shrinks
     the table to content, and the table inherits the bubble font instead of xs.
     Mirror ComposerChat.css's .composer-chat-message-text table base here so
     the WebApp mount matches standalone /chat. !important is bulletproof against
     the dist-remote bundle; remote-only (AgentChatRemoteLoader). */
  border-collapse: collapse !important;
  width: 100% !important;
  font-size: var(--font-size-xs) !important;
}
.composer-chat-message-text thead th {
  padding: var(--spacing-xs) var(--spacing-sm) !important;
  background-color: var(--color-neutral-150) !important;   /* WebApp bg-secondary grey */
  color: var(--text-muted) !important;                      /* greyText tertiary */
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-neutral-200) !important;
}
.composer-chat-message-text tbody td {
  padding: var(--spacing-xs) var(--spacing-sm) !important;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-neutral-200) !important;
  border-left: none !important;
  border-right: none !important;
  border-top: none !important;
  font-variant-numeric: tabular-nums;
}
.composer-chat-message-text tbody tr:last-child td {
  border-bottom: none !important;
}
.composer-chat-message-text tbody tr:nth-child(even) {
  background-color: var(--color-neutral-50) !important;    /* whisper zebra */
}
.composer-chat-message-text tbody tr:hover {
  background-color: var(--color-accent-muted) !important; /* WebApp brand tint on hover */
}

/* Dark variant — FAC zinc surfaces: header/zebra step one shade darker, hover
   stays the brand green tint (lighter for dark per the accent block above). */
.fac-theme-root[data-theme="dark"] .composer-chat-message-text thead th {
  background-color: var(--color-neutral-800) !important;
  color: var(--color-neutral-300) !important;
  border-bottom-color: var(--color-neutral-700) !important;
}
.fac-theme-root[data-theme="dark"] .composer-chat-message-text tbody td {
  border-bottom-color: var(--color-neutral-800) !important;
}
.fac-theme-root[data-theme="dark"] .composer-chat-message-text tbody tr:nth-child(even) {
  /* one step DARKER than the #141414 bg-default messages card */
  background-color: hsl(var(--nextui-background-secondary)) !important;
}

/* ── Chat panel fills the host width (moat #46) ──────────────────────────
 *    "In small screen, WebApp only show Agent chat, Please make the inner
 *    components extend to full page (parent)".
 *    OpenChat.css ships .open-chat-panel (the className ComposerPanelBody
 *    passes to A2AChatPanel → the .composer-chat root) as max-width:50vw +
 *    margin:0 auto — "default 50% centered when no viewport". On the desktop
 *    side-column mount the host is ~430px (< 50vw), so the cap never binds and
 *    the panel fills the host. But the mobile surface (FinityChatBotMobile) is
 *    a fixed inset-0 fullscreen overlay: the host IS the viewport, so 50vw
 *    caps the panel at half-width and margin:auto centers it → the chat thread
 *    + input render in a narrow column with large empty side gutters.
 *    Override here so the panel + every inner section (header / messages body
 *    card / input tray) extends edge-to-edge across the full host (parent).
 *    !important beats OpenChat.css on equal specificity; this sheet appends
 *    AFTER every <style data-fac>, and only loads in the WebApp mount
 *    (AgentChatRemoteLoader), so standalone /chat keeps its centered 50vw
 *    default. */
.open-chat-panel {
  max-width: none !important;
  margin: 0 !important;
}

/* ── Chat thread scrolls vertically inside the host (moat #88) ────────────
 *    "WebApp at start with a narrow window → only the chat column shows,
 *    the message text stacks in one column with NO vertical scroll."
 *    The FAC height chain (shadow host → .composer-panel-body height:100%
 *    → .open-chat-content → .composer-chat height:100% → .composer-chat-shell/
 *    main/body → .composer-chat-messages overflow:auto) is correct in source,
 *    BUT the dist-remote bundle the WebApp serves can lag the source, and at
 *    the initial narrow-window mount the panel can size to its CONTENT instead
 *    of the host: the thread then grows past the host, the fixed mobile overlay
 *    (FinityChatBotMobile, overflow-hidden + h-[100dvh]) clips the input
 *    off-screen, and no scrollbar appears on the messages region.
 *    Pin every link to the shadow-host height here so the thread is always
 *    bounded and the messages region always scrolls. The min-height:0 on each
 *    flex ancestor is the critical part — a flex item defaults to
 *    min-height:auto (won't shrink below its content), so without min-height:0
 *    the overflow:auto region never receives a bounded height and never
 *    scrolls. !important beats OpenChat.css / inline at equal specificity; this
 *    sheet appends AFTER every <style data-fac> and only loads in the WebApp
 *    mount (AgentChatRemoteLoader), so standalone /chat is unaffected.
 *
 *    ROOT CAUSE (confirmed from the built DOM): mount() wraps the React tree
 *    in .fac-theme-root { display: contents } (mount.tsx) so the wrapper
 *    generates NO box. .composer-panel-body's height:100% is then meant to
 *    resolve THROUGH it to the shadow host — but trans-display:contents
 *    percentage-height resolution is the single fragile link in the chain.
 *    When it fails, .composer-panel-body falls back to content height, the
 *    thread grows past the host, the fixed overlay clips the input, and no
 *    scrollbar appears. Force .fac-theme-root to be a real full-height box so
 *    height:100% resolves against IT (a definite-height ancestor) instead.
 *    This is the load-bearing rule; the min-height:0 rules below just guarantee
 *    each flex ancestor can shrink so the overflow:auto region gets bounded.
 *
 *    HARDENING (3rd attempt — two prior height-chain edits did not surface at
 *    runtime): mount() sets themeRoot.style.display='contents' INLINE. A
 *    display:contents box generates NO box, so .composer-panel-body height:100%
 *    has no definite ancestor to resolve against and falls back to content
 *    height. Rather than rely on trans-display:contents percentage resolution
 *    (fragile), pin .fac-theme-root with position:absolute + inset:0 so it fills
 *    the host box DIRECTLY — its height is then definite (derived from the
 *    host), independent of the contents display. :host gets position:relative so
 *    the absolute fill is bounded to the host, and height:100% so the host is
 *    definite (resolves to the WebApp wrapper h-full → 100dvh / flex-1). Then
 *    height:100% down the chain resolves against definite ancestors and the
 *    overflow:auto region finally scrolls. */
.fac-theme-root {
  display: block !important;
  position: absolute !important;
  inset: 0 !important;
}
:host {
  position: relative;
  height: 100%;
  /* moat f2ab0ac6: clip the shadow host. .fac-theme-root is position:absolute
     with :host as its containing block; without overflow:hidden here any spill
     from the FAC subtree (a frame ancestor lacking clip in a stale dist-remote
     bundle, or a child exceeding the pinned height) extends :host's scroll
     region and surfaces as a browser-level PAGE scrollbar. overflow:hidden on
     the host is the last line of defense — nothing escapes the shadow. */
  overflow: hidden !important;
}
.composer-panel-body,
.open-chat-content,
.composer-chat,
.composer-chat-shell {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  /* moat f2ab0ac6: the OUTER panel frame must NEVER scroll — only the inner
     chat (.composer-chat-messages) and history (.session-list) regions scroll.
     overflow:hidden on every frame link guarantees no intermediate ancestor
     shows a scrollbar, independent of whether the served dist-remote bundle
     carries A2AChatPanel.tsx's inline overflow:hidden yet. */
  overflow: hidden !important;
}
.composer-chat-main,
.composer-chat-body {
  min-height: 0 !important;
}
/* moat f2ab0ac6: ONLY these two regions may scroll — both are flex:1 +
   min-height:0 children bounded by the overflow:hidden frame above, so each
   receives a definite height and scrolls internally. The chat thread (left)
   and the session history list (right) scroll independently; the page does
   not. */
.composer-chat-messages {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
}
.session-history-column .session-list {
  overflow-y: auto !important;
}

/* ── Hide mode + caveman selectors; dock SEND inline with the textarea ──
 *    "hide these 2 buttons in WebApp, only the send button remain; send
 *    should stay inline with the input text, not in a lower line."
 *    FAC ships .chat-composer as a COLUMN: textarea on top, toolbar row below
 *    holding (mode selector · divider · caveman selector · spacer · send). In
 *    the WebApp remote mount the agent selector is already off, so the toolbar
 *    shows the "Auto" (mode) + "Bình thường" (caveman) dropdowns + send on a
 *    SEPARATE line under the textarea. The user wants those two dropdowns gone
 *    and the send button moved UP to sit on the same line as the typed text.
 *
 *    Reflow .chat-composer to a ROW: textarea flexes to fill, the toolbar
 *    collapses to content-width (just the send button — SpeakerIndicator only
 *    appears while streaming), and the row gap (var(--spacing-xs)) gives the
 *    breathing room between text and send. align-items:CENTER centers the 30px
 *    send button against the textarea vertically; the textarea min-height is
 *    raised to 28px (from ~17px = font-size-xs*1.4) so the input band is nearly
 *    as tall as the button — without it the button towered above a single-line
 *    input (flex-end anchored bottoms, leaving the button top well above the
 *    text). A grown multi-line textarea still pushes send down via center align.
 *    The mode/caveman triggers, their divider, and the now-empty spacer are
 *    hidden. !important beats ChatComposer.css on equal specificity; this sheet
 *    appends AFTER every <style data-fac> and only loads in the WebApp mount
 *    (AgentChatRemoteLoader), so standalone /chat keeps its column toolbar. */
.chat-composer {
  flex-direction: row !important;
  align-items: center !important;
}
.chat-composer__textarea {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  /* Raise the input band so single-line text centers level with the 30px send
     button (was calc(var(--font-size-xs) * 1.4) ≈ 17px — button towered above). */
  min-height: 28px !important;
}
.chat-composer__toolbar {
  flex: 0 0 auto !important;
  gap: 0 !important;
  min-height: 0 !important;
}
.chat-composer__mode,
.chat-composer__caveman,
.chat-composer__divider,
.chat-composer__spacer {
  display: none !important;
}

/* ── Link-preview cards (moat: "Wrongly rendering related files, cards") ──
 *    LinkPreviewStrip.css is a PLAIN (non-module) FAC sheet -> emitted to
 *    dist-remote/frontend.css in document <head>, NOT the shadow root; the
 *    shadow boundary blocks it, so in the remote mount every .link-preview-*
 *    rule is absent and each card renders RAW (a <button> with UA chrome only:
 *    default padding/border/background/font, no thumbnail frame, no ellipsis).
 *    Re-declare the strip + card rules HERE against the stable data-testid
 *    hooks (link-preview-strip / link-preview-card) + literal child classes,
 *    pinned to WebApp neutrals so they are bulletproof regardless of whether
 *    the semantic --color-bg-tertiary/--color-border-primary tokens resolve at
 *    :host. Token-driven spacing/font/radius -> inherits the WebApp density
 *    above. Mirrors LinkPreviewStrip.css 1:1. Remote-only — standalone /chat
 *    keeps the real sheet; this only loads in the WebApp mount
 *    (AgentChatRemoteLoader). */

[data-testid="link-preview-strip"] {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0 0 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
[data-testid="link-preview-strip"]::-webkit-scrollbar {
  display: none;
}

/* Card root = a <button>. Neutralize UA chrome (padding/border/bg/font) the
   shadow-blocked sheet used to reset, then paint the card frame. */
[data-testid="link-preview-card"] {
  display: flex;
  align-items: stretch;
  width: 180px;
  min-height: 48px;
  background-color: var(--color-neutral-100);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 0;
  margin: 0;
  flex-shrink: 0;
  text-align: left;
  color: var(--color-neutral-900);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  transition: background-color var(--transition-fast, 150ms ease),
    border-color var(--transition-fast, 150ms ease), transform 0.1s;
}
[data-testid="link-preview-card"]:hover {
  background-color: var(--color-neutral-150);
  border-color: var(--color-neutral-300);
}
[data-testid="link-preview-card"]:active {
  transform: scale(0.98);
}

/* Thumbnail area */
[data-testid="link-preview-card"] .link-preview-card-thumb {
  position: relative;
  width: 40px;
  min-height: 48px;
  flex-shrink: 0;
  overflow: hidden;
  border-right: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  background-color: var(--color-neutral-150);
}
[data-testid="link-preview-card"] .link-preview-card-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  z-index: 1;
}
[data-testid="link-preview-card"] .link-preview-card-placeholder.loading::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--color-neutral-0, #fff) 45%, transparent),
    transparent
  );
  animation: link-preview-shimmer 1.2s infinite;
}
@keyframes link-preview-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* PDF canvas / rasterized thumbnail (pdfjs page-1 render, moat #101). */
[data-testid="link-preview-card"] .link-preview-card-canvas,
[data-testid="link-preview-card"] .link-preview-card-pdf-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}
[data-testid="link-preview-card"] .link-preview-card-pdf-image {
  user-select: none;
}

/* Text info */
[data-testid="link-preview-card"] .link-preview-card-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding: var(--spacing-xs) var(--spacing-sm);
  min-width: 0;
  flex: 1;
}
[data-testid="link-preview-card"] .link-preview-card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-neutral-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
[data-testid="link-preview-card"] .link-preview-card-domain {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

/* Dark variant — FAC zinc surfaces step one shade darker; accent tint unchanged. */
.fac-theme-root[data-theme="dark"] [data-testid="link-preview-card"] {
  background-color: var(--color-neutral-800);
  border-color: var(--color-neutral-700);
  color: var(--color-neutral-100);
}
.fac-theme-root[data-theme="dark"] [data-testid="link-preview-card"]:hover {
  background-color: var(--color-neutral-700);
  border-color: var(--color-neutral-600);
}
.fac-theme-root[data-theme="dark"] [data-testid="link-preview-card"] .link-preview-card-thumb {
  background-color: var(--color-neutral-900);
  border-right-color: var(--color-neutral-700);
}
.fac-theme-root[data-theme="dark"] [data-testid="link-preview-card"] .link-preview-card-title {
  color: var(--color-neutral-100);
}

@media (max-width: 767px) {
  [data-testid="link-preview-card"] {
    width: 150px;
    min-height: 42px;
  }
  [data-testid="link-preview-card"] .link-preview-card-thumb {
    width: 34px;
    min-height: 42px;
  }
}

/* ── "Jump to latest" pill: arrow-only when the label would wrap ──────────
 *    "nếu thành 2 dòng -> chỉ hiện mũi tên, không hiện text". The pill is
 *    <ArrowDown/> + <span>{label}</span> (ComposerChat.css
 *    .composer-chat-jump-to-latest — no white-space:nowrap, no max-width).
 *    On the narrow mobile chat column the VI label "Về tin nhắn mới nhất"
 *    wraps to a 2nd line under the arrow. On touch devices drop the label
 *    entirely — arrow only. The button keeps aria-label={jumpToLatest}, so
 *    the meaning stays accessible (screen readers still announce it).
 *    Desktop (hover) keeps the full label. !important for parity with the
 *    rest of this sheet; remote-only (AgentChatRemoteLoader), so standalone
 *    /chat keeps the label on all widths. */
@media (hover: none) and (pointer: coarse) {
  .composer-chat-jump-to-latest span {
    display: none !important;
  }
}

/* ── Inline chart data-table (moat #126: "Bảng cân đối kế toán Q2/2026 not
 *    render css correctly with WebApp") ──────────────────────────────────
 *    The agent emits financial tables (balance sheet, debt, ratios) as the
 *    INLINE DataTable component — .chart-inline-container > .chart-preview--
 *    inline > .data-table — NOT a markdown GFM table. DataTable.css +
 *    ChartPreview.css are PLAIN (non-module) sheets -> JS-imported -> emitted
 *    to dist-remote/frontend.css in document <head>, NOT the shadow root; the
 *    shadow boundary blocks them, AND the semantic tokens they lean on
 *    (--color-surface-*, --color-border-*, --color-text-*) are declared in
 *    theme/index sheets that are shadow-blocked too. So in the WebApp mount
 *    every .data-table-* rule + token is absent and the table renders RAW:
 *    no flex column (so the 250px content region never bounds and cannot
 *    scroll), no borders, no header bg, no striping, UA border-collapse:
 *    separate gaps, sticky header gone.
 *    Re-declare the rules HERE at WebApp density using EXPLICIT neutrals
 *    (--color-neutral-*, defined on :host above) instead of the blocked
 *    semantic tokens, pinned to the injected Inter face. Mirrors DataTable.css
 *    + ChartPreview.css structure 1:1. Stable classes (non-hashed, literal).
 *    Remote-only — this sheet only loads in the WebApp mount
 *    (AgentChatRemoteLoader); standalone /chat keeps the real sheets. */

/* Inline chart wrapper (inline-styled width/margin already; just neutralize
   any inherited bg so the card sits on the white message bubble). */
.chart-inline-container {
  background: transparent;
}

/* ChartPreview base (transparent frame; content fills it). */
.chart-preview {
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  border-radius: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.chart-preview-content {
  width: 100%;
  flex: 1 1 0;
  min-height: 0;
  overflow: visible;
  position: relative;
}

/* DataTable card. */
.data-table {
  display: flex;
  flex-direction: column;
  background: var(--color-neutral-0) !important;
  border: 1px solid var(--color-neutral-200) !important;
  border-radius: var(--radius-sm) !important;
  overflow: hidden;
  font-size: var(--font-size-sm);
}
.data-table-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-neutral-200) !important;
  background: var(--color-neutral-150) !important;
  min-height: 24px;
}
.data-table-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-neutral-900) !important;
}
.data-table-content {
  flex: 1 1 0;
  overflow: auto;
  min-height: 0;
}
.data-table-table {
  width: 100%;
  border-collapse: collapse !important;
  table-layout: auto;
  font-size: var(--font-size-xs);
}

/* Header cells — sticky so the header survives the 250px body scroll. */
.data-table-th {
  padding: var(--spacing-xs) var(--spacing-sm);
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-neutral-600) !important;
  background: var(--color-neutral-150) !important;
  border-bottom: 2px solid var(--color-neutral-200) !important;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}
.data-table-th-label {
  display: inline;
}

/* Body cells. */
.data-table-td {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-neutral-200) !important;
  color: var(--color-neutral-900) !important;
  font-size: var(--font-size-xs);
  line-height: 1.4;
}
.data-table-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
/* Numeric variants -> right-aligned tabular; string -> left (the DOM marks
   every cell --string, but other tables use --number/--currency/--percentage). */
.data-table-td--currency,
.data-table-td--percentage,
.data-table-td--ratio,
.data-table-td--number,
.data-table-td--change {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.data-table-td--string {
  text-align: left;
}

/* Row striping + hover. */
.data-table-row--striped {
  background: var(--color-neutral-50) !important;
}
.data-table-row:hover {
  background: var(--color-accent-muted) !important;
}

/* Totals / footer row. */
.data-table-td--footer {
  font-weight: 600;
  border-top: 2px solid var(--color-neutral-200) !important;
  background: var(--color-neutral-150) !important;
}

/* Caption below the table (scientific-paper figure label). Skip the
   ::before "Figure N:" counter — counter-reset lives on a shadow-blocked
   sheet, so the counter would read 0; the caption text alone is enough. */
.chart-preview-caption {
  font-style: italic;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-600) !important;
  text-align: center;
  padding: var(--spacing-xs) 0 var(--spacing-sm);
  border-top: 1px solid var(--color-neutral-200) !important;
  margin-top: var(--spacing-xs);
  line-height: 1.4;
}

/* Recharts SVG charts (line/area/bar/scatter/pie/candlestick/indicators).
   ChartPreview.css ships two safety rules for the shadow-blocked bundle:
   (1) .chart-preview-content svg { display:block } — kills the 4px inline-
   element baseline gap under every Recharts SVG; without it the chart sits
   with a whitespace gap + the 250px ResponsiveContainer overflows its box.
   (2) .recharts-line/area/bar/scatter paths { opacity:1 } — Recharts mounts
   series at opacity:0 then animates in; if the animation is interrupted
   (streaming re-render, low-end GPU) elements stay invisible. Force visible.
   Both rules are shadow-blocked -> re-declare here. Scoped under the inline
   content wrapper so standalone /chat is unaffected (real sheet applies). */
.chart-preview-content svg {
  display: block !important;
}
.chart-preview-content .recharts-line path,
.chart-preview-content .recharts-area path,
.chart-preview-content .recharts-bar rect,
.chart-preview-content .recharts-scatter circle {
  opacity: 1 !important;
}
/* Recharts default tooltip uses inline styles already (self-contained), but
   pin its wrapper text to the host font so it does not fall back to Times. */
.chart-preview-content .recharts-tooltip-wrapper,
.chart-preview-content .recharts-default-tooltip {
  font-family: var(--font-family-sans) !important;
}

/* Unknown / no-data fallback box (chart_type default + financial-metrics miss).
   ChartPreview.css centers muted text; shadow-blocked -> re-declare so the
   fallback reads as intended instead of left-aligned UA text. */
.chart-preview-unknown {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--color-neutral-600) !important;
  font-size: var(--font-size-sm);
}
.chart-preview-unknown p {
  margin: 0;
}

/* ── DashboardGrid (chart_type 'performance-dashboard') ─────────────────────
 *    ChartPreview lazy-renders DashboardGrid.tsx inside the inline panel:
 *    .dashboard-grid > .dashboard-grid-panel (-header title+type / -content
 *    holding a nested ChartPreview). DashboardGrid.css is a PLAIN (non-module)
 *    FAC sheet -> emitted to dist-remote/frontend.css in document <head>, NOT
 *    the shadow root -> shadow-blocked -> the grid + every panel renders RAW
 *    (no grid, no borders, no header band, UA box only). Re-declare the full
 *    tree here against the literal .dashboard-grid* classes pinned to WebApp
 *    neutrals, mirroring DashboardGrid.css 1:1. Scoped under the inline content
 *    wrapper (.chart-inline-container) is unnecessary — these classes only
 *    exist in the inline mount, so standalone /chat is unaffected by them. */
.dashboard-grid {
  display: grid !important;
  gap: var(--spacing-sm) !important;
  padding: var(--spacing-xs) !important;
  background: var(--color-neutral-0) !important;
  border: 1px solid var(--color-neutral-200) !important;
  border-radius: var(--radius-sm) !important;
  overflow: hidden !important;
}
.dashboard-grid-panel {
  display: flex !important;
  flex-direction: column !important;
  border: 1px solid var(--color-neutral-200) !important;
  border-radius: var(--radius-sm) !important;
  background: var(--color-neutral-0) !important;
  overflow: hidden !important;
  min-height: 120px !important;
}
.dashboard-grid-panel-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 2px var(--spacing-sm) !important;
  border-bottom: 1px solid var(--color-neutral-200) !important;
  background: var(--color-neutral-100) !important;
  min-height: 22px !important;
}
.dashboard-grid-panel-title {
  font-size: var(--font-size-xs) !important;
  font-weight: 600 !important;
  color: var(--color-neutral-900) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.dashboard-grid-panel-type {
  font-size: 9px !important;
  color: var(--color-neutral-600) !important;
  background: var(--color-neutral-150) !important;
  padding: 1px var(--spacing-xs) !important;
  border-radius: 2px !important;
  text-transform: capitalize !important;
}
.dashboard-grid-panel-content {
  flex: 1 !important;
  min-height: 0 !important;
  padding: var(--spacing-xs) !important;
}
/* Nested ChartPreview fills its panel — flatten the inner card chrome. */
.dashboard-grid-panel-content .chart-preview {
  border: none !important;
  border-radius: 0 !important;
}
.dashboard-grid-panel-content .chart-preview-content {
  padding: 0 !important;
}

/* Dark variant — FAC zinc surfaces: card + header step one shade darker. */
.fac-theme-root[data-theme="dark"] .chart-preview-unknown {
  color: var(--color-neutral-400) !important;
}
.fac-theme-root[data-theme="dark"] .dashboard-grid {
  background: var(--color-neutral-900) !important;
  border-color: var(--color-neutral-700) !important;
}
.fac-theme-root[data-theme="dark"] .dashboard-grid-panel {
  background: var(--color-neutral-900) !important;
  border-color: var(--color-neutral-700) !important;
}
.fac-theme-root[data-theme="dark"] .dashboard-grid-panel-header {
  background: var(--color-neutral-800) !important;
  border-bottom-color: var(--color-neutral-700) !important;
}
.fac-theme-root[data-theme="dark"] .dashboard-grid-panel-title {
  color: var(--color-neutral-100) !important;
}
.fac-theme-root[data-theme="dark"] .dashboard-grid-panel-type {
  color: var(--color-neutral-400) !important;
  background: var(--color-neutral-800) !important;
}
.fac-theme-root[data-theme="dark"] .data-table {
  background: var(--color-neutral-900) !important;
  border-color: var(--color-neutral-700) !important;
}
.fac-theme-root[data-theme="dark"] .data-table-header,
.fac-theme-root[data-theme="dark"] .data-table-th {
  background: var(--color-neutral-800) !important;
  border-bottom-color: var(--color-neutral-700) !important;
}
.fac-theme-root[data-theme="dark"] .data-table-th {
  color: var(--color-neutral-300) !important;
}
.fac-theme-root[data-theme="dark"] .data-table-title,
.fac-theme-root[data-theme="dark"] .data-table-td {
  color: var(--color-neutral-100) !important;
  border-bottom-color: var(--color-neutral-800) !important;
}
.fac-theme-root[data-theme="dark"] .data-table-row--striped {
  background: var(--color-neutral-900) !important;
}
.fac-theme-root[data-theme="dark"] .chart-preview-caption {
  color: var(--color-neutral-300) !important;
  border-top-color: var(--color-neutral-800) !important;
}

/* ── Reasoning block (moat: "Reasoning block in FAC mount does not have good
 *    styling... font, font size, italic, gray color, dark / light mode") ────
 *    ThinkingBlock.tsx ships as a CSS MODULE (ThinkingBlock.module.css). The
 *    module sheet is JS-imported → emitted to dist-remote/frontend.css in
 *    document <head>, NOT the shadow root; the shadow boundary blocks it, so
 *    in the remote mount the reasoning block renders RAW (upright black
 *    full-size text, no gray/italic, no compact rhythm). Re-declare the
 *    module's rules HERE against the stable data-testid hooks
 *    (thinking-block / thinking-header / thinking-preview / thinking-content;
 *    the "Suy nghĩ" type label has no testid — it is always the FIRST span in
 *    the header-left cluster, the preview carries its own testid). Pinned to
 *    the injected Inter face + WebApp tokens; italic + mid-gray so reasoning
 *    recedes next to the upright answer, size matched to the message bubbles
 *    (xs). Dark variant lifts the gray to neutral-400 on FAC zinc surfaces
 *    (contrast on #141414). Mirrors ThinkingBlock.module.css 1:1 incl. the
 *    10-line scroll window. Remote-only — standalone /chat keeps the real
 *    module sheet; this only loads in the WebApp mount (AgentChatRemoteLoader). */

[data-testid="thinking-block"] {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
  width: 100%;
  margin: var(--spacing-2xs) 0;
  font-family: var(--font-family-sans);
  /* Align with the response text column. Agent message parts are SIBLINGS
     under .composer-chat-message: the text part wraps itself in
     .composer-chat-message-content (padding sm/md, LIVE in this mount —
     ComposerChat.css is @imported into fac-chat.css and inlined into the
     shadow), while ThinkingBlock renders bare at the message edge. Pad the
     block root by the same content padding so label + body share the answer
     text's left edge instead of hanging left of it. */
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
}

/* Header = collapsible row: label + collapsed preview left, chevron right. */
[data-testid="thinking-block"] [data-testid="thinking-header"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-2xs) 0;
  cursor: pointer;
  user-select: none;
  background: transparent;
  border: none;
  color: var(--color-neutral-500);
}

[data-testid="thinking-block"] [data-testid="thinking-header"] > div:first-child {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 0;
}

/* "Suy nghĩ" type label — first span in the left cluster. Italic mid-gray,
   one step bolder than the preview so the eye lands on it first. */
[data-testid="thinking-block"] [data-testid="thinking-header"] > div:first-child > span:first-child {
  font-size: var(--font-size-xs);
  font-weight: 500;
  font-style: italic;
  font-synthesis: style; /* index.css font-synthesis:none would keep it upright */
  color: var(--color-neutral-500);
  flex-shrink: 0;
  /* Left alignment comes from the block root (--spacing-md, matching the
     .composer-chat-message-content column) — keep the label itself at 0 so
     "Suy nghĩ" sits exactly on the answer text's left edge. */
  padding-left: 0;
}

/* Collapsed one-line preview: "- <first reasoning>…". Quieter than the label:
   lighter gray, ellipsis truncate. */
[data-testid="thinking-block"] [data-testid="thinking-preview"] {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  font-weight: 400;
  font-style: italic;
  font-synthesis: style;
  color: var(--color-neutral-500);
}

/* Chevron — small, gray; hover toward secondary (module .expandIcon). */
[data-testid="thinking-block"] [data-testid="thinking-header"] svg {
  width: var(--font-size-xs);
  height: var(--font-size-xs);
  color: var(--color-neutral-500);
  transition: color 150ms ease;
}
[data-testid="thinking-block"] [data-testid="thinking-header"]:hover svg {
  color: var(--color-neutral-700);
}

/* Expanded reasoning body: italic mid-gray, 10-line scroll window, bottom-
   pinned by the component's auto-scroll. Quiet by design — recedes next to
   the upright answer text. */
[data-testid="thinking-block"] [data-testid="thinking-content"] {
  /* Body inherits the root's column alignment — no extra padding here, so
     expanding/collapsing never shifts text horizontally. */
  padding: 0;
  font-size: var(--font-size-xs);
  font-style: italic;
  font-synthesis: style;
  line-height: 1.6;
  color: var(--color-neutral-500);
  max-height: calc(10 * 1.6em);
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  scrollbar-width: thin;
  scrollbar-color: #b2b2b2 transparent;
}
[data-testid="thinking-block"] [data-testid="thinking-content"]::-webkit-scrollbar {
  width: 5px;
}
[data-testid="thinking-block"] [data-testid="thinking-content"]::-webkit-scrollbar-thumb {
  background: #b2b2b2;
  border-radius: 10px;
}

/* DARK — FAC zinc surfaces: lift the gray one step so the italic text keeps
   ~4.5:1 on the #141414 messages card; chevron/hover follow. */
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-header"],
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-header"] > div:first-child > span:first-child,
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-preview"],
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-content"] {
  color: var(--color-neutral-400);
}
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-header"] svg {
  color: var(--color-neutral-400);
}
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-header"]:hover svg {
  color: var(--color-neutral-200);
}
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-content"] {
  scrollbar-color: #4d4d4d transparent;
}
.fac-theme-root[data-theme="dark"] [data-testid="thinking-block"] [data-testid="thinking-content"]::-webkit-scrollbar-thumb {
  background: #4d4d4d;
}

/* ── "Agent đang xử lý..." streaming indicator (moat: "Text there is too big
 *    compare to other text in chat panel") ─────────────────────────────────
 *    A2AChatPanel.tsx renders the task-running indicator label with INLINE
 *    fontSize: var(--font-size-sm). FAC ships sm = 12px = xs so standalone
 *    /chat shows label + messages at one size, but this sheet inflates the
 *    tokens to WebApp density (sm 14px / xs 12px) — the inline sm then reads
 *    one step BIGGER than the 12px message bubbles. Pin the indicator to xs
 *    so it matches the thread text. Inline styles beat any non-important
 *    rule, so !important is required. Stable data-testid
 *    (task-running-indicator) is on the indicator row. Remote-only — this
 *    sheet only loads in the WebApp mount (AgentChatRemoteLoader);
 *    standalone /chat keeps its sm sizing. */
[data-testid="task-running-indicator"] span {
  font-size: var(--font-size-xs) !important;
}
`;
