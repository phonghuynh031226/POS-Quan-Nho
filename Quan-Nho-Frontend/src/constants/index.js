export const ORDER_STATUS = {
  // Chuẩn Database: status (PENDING_PAYMENT, COMPLETED, CANCELLED)
  PENDING_PAYMENT: {
    key: 'PENDING_PAYMENT',
    label: 'Chờ thanh toán',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconName: 'Clock',
    description: 'Đơn đang chờ thanh toán',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'Hoàn thành',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    iconName: 'CheckCircle2',
    description: 'Đơn hàng đã hoàn thành và nhận món',
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Đã hủy',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    iconName: 'XCircle',
    description: 'Đơn đã bị hủy bỏ',
  },

  // Tương thích ngược với các components cũ
  CHO_LAM: {
    key: 'CHO_LAM',
    label: 'Chờ làm',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    iconName: 'Clock',
    description: 'Đơn mới tạo, đang chờ quầy pha chế nhận đơn',
  },
  DANG_LAM: {
    key: 'DANG_LAM',
    label: 'Đang làm',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    iconName: 'Coffee',
    description: 'Barista đang pha chế / chuẩn bị món',
  },
  SAN_SANG: {
    key: 'SAN_SANG',
    label: 'Sẵn sàng nhận',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold animate-pulse',
    iconName: 'CheckCircle2',
    description: 'Đã xong toàn bộ món! Mời khách tới quầy nhận',
  },
  DA_GIAO: {
    key: 'DA_GIAO',
    label: 'Đã giao',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-300',
    iconName: 'CheckCheck',
    description: 'Khách đã nhận món đầy đủ',
  },
  DA_HUY: {
    key: 'DA_HUY',
    label: 'Đã hủy',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    iconName: 'XCircle',
    description: 'Đơn đã bị hủy bỏ',
  },
}

export const PAYMENT_STATUS = {
  // Chuẩn Database: payment_status (UNPAID, PAID, REFUNDED, PARTIALLY_REFUNDED)
  UNPAID: {
    key: 'UNPAID',
    label: 'Chưa thanh toán',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  PAID: {
    key: 'PAID',
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  REFUNDED: {
    key: 'REFUNDED',
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  PARTIALLY_REFUNDED: {
    key: 'PARTIALLY_REFUNDED',
    label: 'Hoàn tiền 1 phần',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },

  // Tương thích ngược
  CHUA_THANH_TOAN: {
    key: 'CHUA_THANH_TOAN',
    label: 'Chưa thanh toán',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  DA_THANH_TOAN: {
    key: 'DA_THANH_TOAN',
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  DA_HOAN_TIEN: {
    key: 'DA_HOAN_TIEN',
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
}

export const PAYMENT_METHOD = {
  // Chuẩn Database: payment_method (CASH, BANK_TRANSFER)
  CASH: {
    key: 'CASH',
    label: 'Tiền mặt',
  },
  BANK_TRANSFER: {
    key: 'BANK_TRANSFER',
    label: 'Chuyển khoản VietQR / SePay',
  },

  // Tương thích ngược
  TIEN_MAT: {
    key: 'TIEN_MAT',
    label: 'Tiền mặt',
  },
  CHUYEN_KHOAN: {
    key: 'CHUYEN_KHOAN',
    label: 'Chuyển khoản VietQR',
  },
}

export const ROLES = {
  // Chuẩn Database: role = 'OWNER'
  OWNER: {
    key: 'OWNER',
    name: 'Chủ quán',
    allowedPaths: ['/pos', '/orders', '/menu', '/options', '/reports', '/settings'],
  },
  // Tương thích test và role ADMIN hiện hữu
  ADMIN: {
    key: 'ADMIN',
    name: 'Chủ quán',
    allowedPaths: ['/pos', '/orders', '/menu', '/options', '/reports', '/settings'],
  },
}

export const CATEGORIES = [
  { id: 'ALL', code: 'ALL', name: 'Tất cả món', icon: 'LayoutGrid' },
  { id: 1, code: 'COFFEE', name: 'Cà phê', icon: 'Coffee', display_order: 1 },
  { id: 2, code: 'OTHER_DRINKS', name: 'Trà & Nước khác', icon: 'CupSoda', display_order: 2 },
  { id: 3, code: 'MILK_TEA', name: 'Trà sữa', icon: 'CupSoda', display_order: 3 },
  { id: 4, code: 'SNACKS', name: 'Đồ ăn vặt', icon: 'Utensils', display_order: 4 },
  { id: 5, code: 'BAKERY', name: 'Bánh ngọt & Điểm tâm', icon: 'Sparkles', display_order: 5 },
]

export const DEMO_ACCOUNTS = [
  {
    id: 1,
    username: 'admin',
    full_name: 'Chủ quán',
    name: 'Chủ quán',
    role: 'ADMIN',
    role_db: 'OWNER',
    roleName: 'Chủ quán',
    is_active: true,
    description: 'Chủ quán (OWNER) - Toàn quyền quản trị bán hàng, thực đơn, cài đặt',
  },
]

// Chuẩn bảng shop_settings trong Database (chỉ phục vụ in bill)
export const DEFAULT_SHOP_SETTINGS = {
  id: 1,
  shop_name: 'Quán Nhỏ',
  shop_address: '123 Nguyễn Văn A',
  wifi_name: 'QUAN_NHO_WIFI',
  wifi_password_encrypted: 'quannho888',
  receipt_message: 'Cảm ơn quý khách, hẹn gặp lại!',
  show_wifi_on_receipt: true,
}

// Chuẩn bảng sepay_settings trong Database (chỉ lưu & cấu hình API Key)
export const DEFAULT_SEPAY_SETTINGS = {
  id: 1,
  api_key_encrypted: null,
  api_key_last4: null,
  is_configured: false,
}

// Store settings tổng hợp phục vụ in ấn và hiển thị POS
export const DEFAULT_STORE_SETTINGS = {
  // 1. Thông tin chung quán (Map trực tiếp từ shop_settings)
  storeName: 'Quán Nhỏ',
  shop_name: 'Quán Nhỏ',
  storeSubtitle: 'Cà phê & Đồ ăn vặt',
  address: '123 Nguyễn Văn A',
  shop_address: '123 Nguyễn Văn A',
  phone: '090 123 4567',
  wifiName: 'QUAN_NHO_WIFI',
  wifi_name: 'QUAN_NHO_WIFI',
  wifiPass: 'quannho888',
  wifi_password_encrypted: 'quannho888',
  show_wifi_on_receipt: true,
  receipt_message: 'Cảm ơn quý khách, hẹn gặp lại!',
  receiptFooterMessage: 'Cảm ơn quý khách, hẹn gặp lại!',

  // 2. SePay & VietQR
  sepay_configured: false,
  sepay_last4: null,
  bankName: 'MB Bank',
  bankAccountNumber: '0901234567',
  bankAccountName: 'QUAN NHO COFFEE',
  transferContentPrefix: 'QUAN NHO',

  // 3. Cấu hình in hóa đơn
  defaultPaperSize: '80mm',
  defaultPrintMode: 'both',
  autoOpenPrint: true,
  kitchenTitle: '*** PHIẾU BÁO CHẾ BIẾN (BẾP / BAR) ***',
  showQrOnReceipt: true,

  // 4. Màn hình khách (Customer Display)
  customerDisplayWelcomeTitle: 'Hương vị thân quen, Gửi trọn yêu thương',
  customerDisplaySubtitle: 'Vui lòng xem menu và gọi món tại quầy. Chúng tôi luôn sẵn sàng phục vụ bạn!',
  autoResetDelaySeconds: 5,
  showFeaturedItems: true,
}
