import { useRef } from 'react';
import type { ReactNode } from 'react';
import CodeBlock from './CodeBlock';

type WidgetHeaderProps = {
  name: string;
  /** productId (hoặc tên SDK) hiển thị dạng chip cạnh tên. */
  id: string;
  description?: ReactNode;
  /** Chip phụ, ví dụ `symbol: FPT`. */
  tags?: string[];
  code: string;
  lang?: string;
};

/**
 * Header mỗi widget demo: tên + productId + mô tả bên trái, nút "Xem mã nhúng"
 * bên phải mở dialog chứa snippet của đúng widget đó.
 */
export default function WidgetHeader({ name, id, description, tags = [], code, lang }: WidgetHeaderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="widget-head">
      <div className="widget-head-main">
        <div className="widget-head-title">
          <h2>{name}</h2>
          <code>{id}</code>
          {tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        {description ? <p className="widget-head-desc">{description}</p> : null}
      </div>
      <button className="btn" onClick={() => dialogRef.current?.showModal()}>
        <span aria-hidden="true">&lt;/&gt;</span> Xem mã nhúng
      </button>

      <dialog
        ref={dialogRef}
        className="code-dialog"
        aria-label={`Mã nhúng ${id}`}
        // Bấm vào backdrop (chính phần tử dialog, ngoài khung nội dung) để đóng.
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
      >
        <div className="code-dialog-inner">
          <div className="code-dialog-head">
            <div>
              <div className="code-dialog-title">Mã nhúng · {name}</div>
              <div className="muted">
                Dán vào trang đối tác — SDK nạp qua domain proxy, không lộ API nguồn.
              </div>
            </div>
            <button
              className="icon-btn"
              aria-label="Đóng"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <CodeBlock code={code} lang={lang} />
        </div>
      </dialog>
    </div>
  );
}
