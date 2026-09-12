import type { ReactNode } from 'react';

/** Khung chung cho trang ví dụ: mô tả + nội dung. */
export default function PageScaffold({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page">
      <h1>{title}</h1>
      {intro ? <p className="page-intro">{intro}</p> : null}
      <div className="page-body">{children}</div>
    </div>
  );
}
