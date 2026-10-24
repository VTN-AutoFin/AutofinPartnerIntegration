import { useState } from 'react';

/** Hiển thị code snippet + nút copy. */
export default function CodeBlock({ code, lang = 'html' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard chặn — user tự chọn */
    }
  };

  return (
    <div className="code-wrap">
      <div className="code-title">
        <span className="code-lang">{lang}</span>
        <button className="btn" onClick={copy}>
          {copied ? 'Đã copy ✓' : 'Copy'}
        </button>
      </div>
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </div>
  );
}
