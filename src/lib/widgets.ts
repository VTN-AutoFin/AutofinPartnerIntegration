/**
 * Tên + mô tả hiển thị cho từng productId — header mỗi widget demo đọc từ đây
 * để các trang không phải lặp lại.
 */
export type WidgetInfo = { name: string; description: string };

export const WIDGETS: Record<string, WidgetInfo> = {
  'menu-derivatives': {
    name: 'Phái sinh',
    description:
      'Bản tin khuyến nghị hợp đồng tương lai: biên hỗ trợ / kháng cự và khoảng trống giá theo ngày.',
  },
  'menu-signals': {
    name: 'Tín hiệu — menu đầy đủ',
    description:
      'Danh sách tín hiệu theo nhóm (Đáng đầu tư, Rủi ro, Nắm giữ tốt…) kèm ô tìm kiếm mã.',
  },
  'comp-signals': {
    name: 'Tín hiệu — khối gọn',
    description: 'Khối tín hiệu thu gọn, đặt cạnh nội dung khác của trang.',
  },
  'menu-board': {
    name: 'Bảng điện',
    description:
      'Chỉ số thị trường và bảng giá theo sàn (HOSE, VN30, HNX, UPCOM), cập nhật realtime.',
  },
  'menu-news': {
    name: 'Tin tức thị trường',
    description:
      'Tin tức theo nhóm ngành kèm dòng tiền ngành; cuộn tới cuối để tải thêm.',
  },
  'menu-reports': {
    name: 'Báo cáo — menu đầy đủ',
    description:
      'Không gian báo cáo: người xem tự thêm và bố trí biểu đồ ngay trong widget.',
  },
  'comp-reports': {
    name: 'Báo cáo — khối gọn',
    description: 'Khối báo cáo thu gọn, cùng nội dung với bản menu đầy đủ.',
  },
  'comp-stock-detail': {
    name: 'Chi tiết cổ phiếu',
    description:
      'Biểu đồ giá, sổ lệnh, khớp lệnh và các tab tài chính / cổ đông / hồ sơ của một mã.',
  },
  'comp-financials': {
    name: 'Báo cáo tài chính',
    description: 'Bảng cân đối, kết quả kinh doanh, lưu chuyển tiền tệ theo quý / năm.',
  },
  'comp-shareholders': {
    name: 'Cổ đông',
    description: 'Cơ cấu sở hữu, cổ đông lớn và giao dịch nội bộ.',
  },
  'comp-profile': {
    name: 'Hồ sơ doanh nghiệp',
    description: 'Giới thiệu, thông tin niêm yết và danh sách công ty con.',
  },
  'comp-news': {
    name: 'Tin tức doanh nghiệp',
    description: 'Tin tức, báo cáo tài chính và văn bản công bố của doanh nghiệp.',
  },
  'overlay-stock-detail': {
    name: 'Drawer chi tiết cổ phiếu',
    description:
      'Mount là tự mở drawer Chi tiết cổ phiếu; khối host chỉ hiển thị trạng thái.',
  },
  'overlay-index-detail': {
    name: 'Chi tiết chỉ số',
    description: 'Biểu đồ chỉ số thị trường và bảng top cổ phiếu ảnh hưởng.',
  },
  'overlay-industry-detail': {
    name: 'Chi tiết ngành',
    description: 'Biểu đồ chỉ số ngành và bảng top cổ phiếu trong ngành.',
  },
  'stock-filter': {
    name: 'Bộ lọc cổ phiếu',
    description:
      'Lọc mã theo sàn và điều kiện kỹ thuật; chọn mã sẽ bắn sự kiện qua onPartnerAction.',
  },
};

export function widgetInfo(productId: string): WidgetInfo {
  return WIDGETS[productId] ?? { name: productId, description: '' };
}
