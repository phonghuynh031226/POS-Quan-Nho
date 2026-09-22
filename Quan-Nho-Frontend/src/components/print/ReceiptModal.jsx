import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Receipt, ChefHat, Layers } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../../constants'
import { orderApi } from '../../api/orderApi'
import { settingsApi } from '../../api/settingsApi'
import { DEFAULT_STORE_SETTINGS } from '../../constants'
import { useToast } from '../../context/ToastContext'

export default function ReceiptModal({
  isOpen,
  onClose,
  order,
  isReprint = false,
  initialPrintType, // 'customer' | 'kitchen' | 'both'
  onPrinted,
}) {
  const [storeSettings, setStoreSettings] = useState(DEFAULT_STORE_SETTINGS)
  const [paperSize, setPaperSize] = useState(() => storeSettings.defaultPaperSize || '80mm')
  const [printType, setPrintType] = useState(() => initialPrintType || storeSettings.defaultPrintMode || 'both')
  const toast = useToast()

  // Sync print type whenever modal opens or initialPrintType changes
  useEffect(() => {
    if (isOpen) {
      settingsApi.getSettings().then(setStoreSettings).catch(() => {})
      setPrintType(initialPrintType || storeSettings.defaultPrintMode || 'both')
      setPaperSize(storeSettings.defaultPaperSize || '80mm')
    }
  }, [isOpen, initialPrintType])

  if (!order) return null

  const handlePrint = async () => {
    try {
      if (isReprint) {
        await orderApi.markReprint(order.id)
      }
      toast.info('Đang mở hộp thoại in...')
      window.print()
      onPrinted?.()
    } catch (e) {
      toast.error('Lỗi khi in: ' + e.message)
    }
  }

  const paperWidthClass = paperSize === '58mm' ? 'max-w-[280px]' : 'max-w-[360px]'

  // Trích xuất an toàn danh sách món kể cả với dữ liệu snake_case hoặc camelCase
  const orderItems = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.order_items)
    ? order.order_items
    : []

  // Helper để lấy danh sách mô tả tùy chọn món
  const getItemOptionsList = (item) => {
    if (!item) return []
    if (Array.isArray(item.order_item_options) && item.order_item_options.length > 0) {
      return item.order_item_options.map((o) => {
        const extra = o.extra_price ?? o.extraPrice ?? 0
        const priceStr = extra > 0 ? ` (+${formatCurrency(extra)})` : ''
        return `${o.group_name || o.groupName ? `${o.group_name || o.groupName}: ` : ''}${o.option_name || o.optionName || o.name || ''}${priceStr}`
      })
    }
    if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
      return item.selectedOptions.map((o) => {
        const extra = o.extraPrice ?? o.extra_price ?? 0
        const priceStr = extra > 0 ? ` (+${formatCurrency(extra)})` : ''
        return `${o.groupName || o.group_name ? `${o.groupName || o.group_name}: ` : ''}${o.optionName || o.optionName || o.name || ''}${priceStr}`
      })
    }
    if (item.options && typeof item.options === 'object') {
      return Object.entries(item.options)
        .filter(([k, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
        .map(([k, v]) => (Array.isArray(v) ? v.map((t) => t?.name || String(t)).join(', ') : String(v)))
    }
    return []
  }

  // 1. Mẫu hóa đơn thanh toán cho khách hàng
  const renderCustomerReceipt = () => (
    <div className="space-y-3">
      {/* Store Header */}
      <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-400">
        <h2 className="text-base font-extrabold uppercase tracking-wider">
          {storeSettings.shop_name || storeSettings.storeName || 'QUÁN NHỎ'}
        </h2>
        {storeSettings.storeSubtitle && (
          <p className="text-[11px] text-stone-600">{storeSettings.storeSubtitle}</p>
        )}
        <p className="text-[10px] text-stone-500">Đ/c: {storeSettings.shop_address || storeSettings.address || '123 Nguyễn Văn A'}</p>
        <p className="text-[10px] text-stone-500">Hotline: {storeSettings.phone || '090 123 4567'}</p>
        {(storeSettings.show_wifi_on_receipt !== false && (storeSettings.wifi_name || storeSettings.wifiName)) && (
          <p className="text-[9px] text-stone-400 font-mono">
            Wi-Fi: {storeSettings.wifi_name || storeSettings.wifiName} {(storeSettings.wifi_password_encrypted || storeSettings.wifiPass) ? `| Pass: ${storeSettings.wifi_password_encrypted || storeSettings.wifiPass}` : ''}
          </p>
        )}

        <div className="inline-block mt-1 px-2 py-0.5 bg-white border border-stone-400 font-bold text-[10px] uppercase tracking-wider text-stone-700">
          {isReprint || order.isReprinted ? '** BẢN IN LẠI **' : 'HÓA ĐƠN THANH TOÁN (KHÁCH HÀNG)'}
        </div>
      </div>

      {/* Big Order Number */}
      <div className="text-center py-2.5 border-b border-dashed border-stone-400 bg-white my-1 rounded">
        <span className="text-[10px] uppercase tracking-wider block text-stone-600">
          SỐ PHIẾU NHẬN MÓN
        </span>
        <span className="text-3xl font-black tracking-tight text-black">
          {order.orderNumber || order.order_code}
        </span>
      </div>

      {/* Order meta info */}
      <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-stone-400">
        <div className="flex justify-between">
          <span>Ngày giờ:</span>
          <span className="font-semibold">{formatDateTime(order.createdAt || order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Thu ngân:</span>
          <span>{order.createdBy || 'Chủ quán'}</span>
        </div>
        <div className="flex justify-between">
          <span>Hình thức:</span>
          <span className="font-bold">
            {PAYMENT_METHOD[order.paymentMethod]?.label || order.paymentMethod}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Thanh toán:</span>
          <span className="font-bold">
            {PAYMENT_STATUS[order.paymentStatus]?.label || order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Item List */}
      <div className="py-2.5 border-b border-dashed border-stone-400 space-y-2">
        <div className="flex justify-between font-bold text-[11px] uppercase border-b border-stone-300 pb-1">
          <span>Tên món</span>
          <span>T.Tiền</span>
        </div>

        {orderItems.map((item, idx) => {
          const optList = getItemOptionsList(item)
          const qty = item.quantity || item.qty || 1
          const name = item.name || item.product_name || 'Món'
          const lineTotal = item.lineTotal ?? item.line_total ?? ((item.unitPrice || item.unit_price || 0) * qty)
          const notes = item.notes || item.customer_note || ''

          return (
            <div key={item.lineId || item.id || idx} className="space-y-0.5">
              <div className="flex justify-between items-start font-semibold">
                <span className="flex-1 pr-2">
                  {qty}x {name}
                </span>
                <span className="shrink-0">{formatCurrency(lineTotal)}</span>
              </div>

              {optList.length > 0 && (
                <div className="text-[10px] text-stone-600 pl-3 italic">
                  ↳ {optList.join(' • ')}
                </div>
              )}

              {notes && (
                <div className="text-[10px] text-stone-700 pl-3 font-bold">
                  Ghi chú: {notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Financial Summary */}
      <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
        <div className="flex justify-between text-sm font-bold pt-0.5">
          <span>TỔNG TIỀN:</span>
          <span className="text-base font-black">{formatCurrency(order.totalAmount ?? order.total_amount ?? 0)}</span>
        </div>

        {((order.paymentMethod === 'TIEN_MAT' || order.payment_method === 'CASH') && (order.cashGiven > 0 || order.cash_received > 0)) && (
          <>
            <div className="flex justify-between text-stone-600">
              <span>Tiền khách đưa:</span>
              <span>{formatCurrency(order.cashGiven ?? order.cash_received ?? 0)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Tiền thối lại:</span>
              <span>{formatCurrency(order.changeReturned ?? order.change_amount ?? 0)}</span>
            </div>
          </>
        )}
      </div>

      <p className="text-[10px] text-stone-600 pt-3 text-center font-semibold">
        {storeSettings.receipt_message || storeSettings.receiptFooterMessage || 'Cảm ơn Quý khách! Vui lòng giữ phiếu để nhận món.'}
      </p>
    </div>
  )

  // 2. Mẫu phiếu chế biến cho Bếp / Bar (không hiện giá tiền, số lượng và tùy chọn to rõ ràng)
  const renderKitchenTicket = () => (
    <div className="space-y-3">
      {/* Kitchen Ticket Header */}
      <div className="text-center space-y-1 pb-2.5 border-b-2 border-dashed border-stone-800">
        <div className="font-black text-sm uppercase tracking-wider bg-stone-900 text-white py-1 px-2 rounded">
          {storeSettings.kitchenTitle || '*** PHIẾU BÁO CHẾ BIẾN (BẾP / BAR) ***'}
        </div>
        <p className="text-[11px] text-stone-600 pt-1">
          Giờ vào đơn: <strong>{formatDateTime(order.createdAt || order.created_at)}</strong>
        </p>
        <p className="text-[10px] text-stone-500">
          Người tạo: <strong>{order.createdBy || 'Chủ quán'}</strong>
        </p>
      </div>

      {/* Very Big Order Number for Barista / Kitchen */}
      <div className="text-center py-2 border-b-2 border-dashed border-stone-800 bg-white rounded">
        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-600 block">
          SỐ PHIẾU LÀM MÓN
        </span>
        <span className="text-4xl font-black tracking-tight text-black">
          {order.orderNumber || order.order_code}
        </span>
      </div>

      {/* Kitchen Items List */}
      <div className="py-2 border-b-2 border-dashed border-stone-800 space-y-3">
        <div className="flex justify-between font-bold text-xs uppercase border-b border-stone-400 pb-1">
          <span>Tên món & Tùy chọn</span>
          <span>SL</span>
        </div>

        {orderItems.map((item, idx) => {
          const optList = getItemOptionsList(item)
          const notes = item.note || item.notes

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-sm text-black flex-1 pr-2">
                  {item.name || item.product_name}
                </span>
                <span className="shrink-0 text-base font-black px-1.5 py-0.5 bg-stone-900 text-white rounded">
                  x{item.quantity || item.qty || 1}
                </span>
              </div>

              {optList.length > 0 && (
                <div className="text-[11px] font-bold text-stone-800 pl-3">
                  ↳ {optList.join(' • ')}
                </div>
              )}

              {notes && (
                <div className="text-[11px] font-bold text-red-600 pl-3">
                  * Ghi chú: {notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total Quantity */}
      <div className="py-2 border-b border-dashed border-stone-400 text-xs flex justify-between items-center font-bold">
        <span>TỔNG SỐ PHẦN MÓN:</span>
        <span className="text-sm font-black px-2 py-0.5 bg-white rounded border border-stone-300">
          {orderItems.reduce((s, i) => s + (i.quantity || i.qty || 1), 0)} phần
        </span>
      </div>

      <div className="text-center pt-1 text-[10px] text-stone-500 font-bold italic tracking-wide">
        --- VUI LÒNG LÀM MÓN THEO THỨ TỰ GỌI ---
      </div>
    </div>
  )

  const renderAllContent = () => (
    <>
      {printType === 'customer' && renderCustomerReceipt()}
      {printType === 'kitchen' && renderKitchenTicket()}
      {printType === 'both' && (
        <div className="space-y-6">
          {/* Liên 1: Phiếu cho Bếp làm món */}
          {renderKitchenTicket()}

          {/* Đường cắt giấy giữa 2 liên */}
          <div className="py-3 border-y-2 border-dashed border-stone-800 text-center text-[10px] text-stone-600 font-mono font-bold tracking-widest my-4 bg-white page-break">
            ✂ - - - - CẮT GIẤY TẠI ĐÂY / TEAR HERE - - - - ✂
          </div>

          {/* Liên 2: Hóa đơn cho Khách hàng */}
          {renderCustomerReceipt()}
        </div>
      )}
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReprint ? 'In lại phiếu / hóa đơn' : 'Xem trước & In hóa đơn'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Print Type Selector */}
        <div className="bg-white p-2.5 rounded-xl border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Chọn mẫu in:
            </span>
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setPrintType('both')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  printType === 'both'
                    ? 'bg-[#3E2723] text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cả 2 liên</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintType('customer')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  printType === 'customer'
                    ? 'bg-[#3E2723] text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Khách hàng</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintType('kitchen')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  printType === 'kitchen'
                    ? 'bg-[#3E2723] text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Bếp làm món</span>
              </button>
            </div>
          </div>

          {/* Quick Paper & Tracking Bar */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/80">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">Khổ giấy:</span>
              <button
                type="button"
                onClick={() => setPaperSize('80mm')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  paperSize === '80mm'
                    ? 'bg-[#3E2723] text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                K80 (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('58mm')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  paperSize === '58mm'
                    ? 'bg-[#3E2723] text-white'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                K58 (58mm)
              </button>
            </div>
          </div>
        </div>

        {/* The Printable Receipt Box (Preview - Borderless for clean thermal roll look) */}
        <div className="flex justify-center bg-white p-2 sm:p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
          <div
            id="printable-receipt"
            className={`w-full ${paperWidthClass} bg-white text-black p-4 font-mono text-xs leading-relaxed`}
          >
            {renderAllContent()}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>

          <Button
            variant="accent"
            icon={Printer}
            onClick={handlePrint}
            className="px-6 shadow-md text-sm sm:text-base font-bold"
          >
            {printType === 'customer'
              ? 'In hóa đơn khách (Ctrl + P)'
              : printType === 'kitchen'
              ? 'In phiếu bếp làm (Ctrl + P)'
              : 'In cả 2 liên Khách & Bếp (Ctrl + P)'}
          </Button>
        </div>
      </div>

      {/* Render print area directly onto document.body to break out of modal clipping */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            id="pos-print-area"
            className={`${paperWidthClass} bg-white text-black p-2 font-mono text-xs leading-relaxed`}
          >
            {renderAllContent()}
          </div>,
          document.body
        )}
    </Modal>
  )
}
