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

}

export const FULFILLMENT_STATUS = {
  NEW: {
    key: 'NEW',
    label: 'Mới nhận',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Đơn vừa được thanh toán và đang chờ bắt đầu làm',
  },
  PREPARING: {
    key: 'PREPARING',
    label: 'Đang chuẩn bị',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    description: 'Quán đang chuẩn bị món',
  },
  READY_FOR_PICKUP: {
    key: 'READY_FOR_PICKUP',
    label: 'Chờ khách nhận',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    description: 'Món đã xong và đang chờ gọi khách nhận',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'Hoàn tất',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-300',
    description: 'Khách đã nhận món',
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Đã hủy',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Đơn đã bị hủy',
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

// UI preferences use safe behavior defaults; business details come from PostgreSQL.
export const DEFAULT_STORE_SETTINGS = {
  storeName: '',
  shop_name: '',
  storeSubtitle: '',
  address: '',
  shop_address: '',
  phone: '',
  wifiName: '',
  wifi_name: '',
  wifiPass: '',
  wifi_password_encrypted: '',
  show_wifi_on_receipt: true,
  receipt_message: '',
  receiptFooterMessage: '',
  sepay_configured: false,
  sepay_last4: null,
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
  transferContentPrefix: '',
  defaultPaperSize: '80mm',
  defaultPrintMode: 'both',
  autoOpenPrint: true,
  kitchenTitle: '',
  showQrOnReceipt: true,
  customerDisplayWelcomeTitle: '',
  customerDisplaySubtitle: '',
  autoResetDelaySeconds: 5,
  showFeaturedItems: false,
}
