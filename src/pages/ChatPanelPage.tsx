import PageScaffold from './PageScaffold';

/**
 * FAC ChatPanel — Coming Soon.
 * Giai đoạn này chỉ có 1 tài khoản partner, chưa quản lý user nên FAC chat
 * chưa mở. Trang giữ chỗ thay cho tích hợp FAC (đã gỡ SDK + proxy).
 */
export default function ChatPanelPage() {
  return (
    <PageScaffold
      title="FAC Chat (chat AI)"
      intro={
        <>
          Tính năng đang được hoàn thiện và sẽ ra mắt sớm. Hãy quay lại sau để trải
          nghiệm chat AI của AUTOFIN.
        </>
      }
    >
      <div className="widget-card coming-soon-card">
        <div className="coming-soon-badge">Coming Soon</div>
        <div className="widget-card-title">FAC Chat (chat AI)</div>
        <p className="muted" style={{ marginTop: 8 }}>
          Widget chat AI đang trong quá trình tích hợp — chưa khả dụng ở giai đoạn
          này. Khi ra mắt, chat sẽ nhúng trực tiếp vào site đối tác qua domain proxy
          giống các widget khác.
        </p>
      </div>
    </PageScaffold>
  );
}
