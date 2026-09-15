import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Printer, ExternalLink, Receipt, ChefHat, Layers } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../../constants'
import { orderApi } from '../../api/orderApi'
import { mockDb } from '../../api/mockDb'
import { useToast } from '../../context/ToastContext'

export default function ReceiptModal({
  isOpen,
  onClose,
  order,
  isReprint = false,
  initialPrintType, // 'customer' | 'kitchen' | 'both'
  onPrinted,
}) {
  const storeSettings = mockDb.getStoreSettings()
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [paperSize, setPaperSize] = useState(() => storeSettings.defaultPaperSize || '80mm')
  const [printType, setPrintType] = useState(() => initialPrintType || storeSettings.defaultPrintMode || 'both')
  const toast = useToast()

  const trackingUrl = order?.token
    ? `${window.location.origin}/track/${order.token}`
    : ''

  // Sync print type whenever modal opens or initialPrintType changes
  useEffect(() => {
    if (isOpen) {
      setPrintType(initialPrintType || storeSettings.defaultPrintMode || 'both')
      setPaperSize(storeSettings.defaultPaperSize || '80mm')
    }
  }, [isOpen, initialPrintType])

  useEffect(() => {
    if (trackingUrl) {
      QRCode.toDataURL(trackingUrl, {
        width: 160,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR:', err))
    }
  }, [trackingUrl])

  if (!order) return null

  const handlePrint = async () => {
    try {
      if (isReprint) {
        await orderApi.markReprint(order.id)
      }
      toast.info('Đang mở hộp thoại in của trình duyệt...')
      window.print()
      onPrinted?.()
    } catch (e) {
      toast.error('Có lỗi xảy ra khi gọi lệnh in: ' + e.message)
    }
  }

  const paperWidthClass = paperSize === '58mm' ? 'max-w-[280px]' : 'max-w-[360px]'

  // Helper để lấy danh sách mô tả tùy chọn món
  const getItemOptionsList = (item) => {
    if (Array.isArray(item.order_item_options) && item.order_item_options.length > 0) {
      return item.order_item_options.map((o) => {
        const priceStr = o.extra_price > 0 ? ` (+${formatCurrency(o.extra_price)})` : ''
        return `${o.group_name ? `${o.group_name}: ` : ''}${o.option_name}${priceStr}`
      })
    }
    if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
      return item.selectedOptions.map((o) => {
        const priceStr = o.extraPrice > 0 ? ` (+${formatCurrency(o.extraPrice)})` : ''
        return `${o.groupName ? `${o.groupName}: ` : ''}${o.optionName}${priceStr}`
      })
    }
    if (item.options) {
      return Object.entries(item.options)
        .filter(([k, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
        .map(([k, v]) => (Array.isArray(v) ? v.map((t) => t.name).join(', ') : v))
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

        <div className="inline-block mt-1 px-2 py-0.5 bg-stone-100 border border-stone-400 font-bold text-[10px] uppercase tracking-wider text-stone-700">
          {isReprint || order.isReprinted ? '** BẢN IN LẠI **' : 'HÓA ĐƠN THANH TOÁN (KHÁCH HÀNG)'}
        </div>
      </div>

      {/* Big Order Number */}
      <div className="text-center py-2.5 border-b border-dashed border-stone-400 bg-stone-50 my-1 rounded">
        <span className="text-[10px] uppercase tracking-wider block text-stone-600">
          SỐ PHIẾU NHẬN MÓN
        </span>
        <span className="text-3xl font-black tracking-tight text-black">
          {order.orderNumber}
        </span>
      </div>

      {/* Order meta info */}
      <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-stone-400">
        <div className="flex justify-between">
          <span>Ngày giờ:</span>
          <span className="font-semibold">{formatDateTime(order.createdAt)}</span>
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

        {order.items.map((item, idx) => {
          const optList = getItemOptionsList(item)

          return (
            <div key={item.lineId || idx} className="space-y-0.5">
              <div className="flex justify-between items-start font-semibold">
                <span className="flex-1 pr-2">
                  {item.quantity}x {item.name}
                </span>
                <span className="shrink-0">{formatCurrency(item.lineTotal)}</span>
              </div>

              {optList.length > 0 && (
                <div className="text-[10px] text-stone-600 pl-3 italic">
                  ↳ {optList.join(' • ')}
                </div>
              )}

              {item.notes && (
                <div className="text-[10px] text-stone-700 pl-3 font-bold">
                  Ghi chú: {item.notes}
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
          <span className="text-base font-black">{formatCurrency(order.totalAmount)}</span>
        </div>

        {order.paymentMethod === 'TIEN_MAT' && order.cashGiven > 0 && (
          <>
            <div className="flex justify-between text-stone-600">
              <span>Tiền khách đưa:</span>
              <span>{formatCurrency(order.cashGiven)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Tiền thối lại:</span>
              <span>{formatCurrency(order.changeReturned || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Real QR Code for Tracking */}
      {storeSettings.showQrOnReceipt !== false && (
        <div className="text-center pt-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
            Quét mã để theo dõi tiến độ pha chế:
          </p>
          {qrCodeUrl && (
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt={`QR Code tra cứu đơn ${order.orderNumber}`}
                className="w-28 h-28 border border-stone-300 p-1 rounded"
              />
            </div>
          )}
          <p className="text-[9px] text-stone-500 break-all">{trackingUrl}</p>
        </div>
      )}

      <p className="text-[10px] text-stone-600 pt-2 text-center font-semibold">
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
          Giờ vào đơn: <strong>{formatDateTime(order.createdAt)}</strong>
        </p>
        <p className="text-[10px] text-stone-500">
          Người tạo: <strong>{order.createdBy || 'Chủ quán'}</strong>
        </p>
      </div>

      {/* Very Big Order Number for Barista / Kitchen */}
      <div className="text-center py-2 border-b-2 border-dashed border-stone-800 bg-stone-100 rounded">
        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-600 block">
          SỐ PHIẾU LÀM MÓN
        </span>
        <span className="text-4xl font-black tracking-tight text-black">
          {order.orderNumber}
        </span>
      </div>

      {/* Kitchen Items List */}
      <div className="py-2 border-b-2 border-dashed border-stone-800 space-y-3">
        <div className="flex justify-between font-bold text-xs uppercase border-b border-stone-400 pb-1">
          <span>Tên món & Tùy chọn</span>
          <span>SL</span>
        </div>

        {order.items.map((item, idx) => {
          const optList = getItemOptionsList(item)

          return (
            <div
              key={item.lineId || idx}
              className="space-y-1 pb-2.5 border-b border-dotted border-stone-300 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-sm text-black flex-1 pr-2 leading-tight">
                  {item.name}
                </span>
                <span className="text-base font-black px-2.5 py-0.5 bg-stone-900 text-white rounded shrink-0">
                  x{item.quantity}
                </span>
              </div>

              {/* Chi tiết từng tùy chọn được gạch đầu dòng rõ ràng */}
              {optList.length > 0 && (
                <div className="text-xs text-stone-800 pl-2 font-medium space-y-0.5">
                  {optList.map((opt, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-stone-500 font-bold">•</span>
                      <span className="font-semibold">{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ghi chú đặc biệt cho bếp */}
              {item.notes && (
                <div className="mt-1 p-1.5 bg-amber-50 border border-amber-300 rounded text-xs font-bold text-amber-950">
                  ⚠️ Ghi chú: {item.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total Quantity */}
      <div className="py-2 border-b border-dashed border-stone-400 text-xs flex justify-between items-center font-bold">
        <span>TỔNG SỐ PHẦN MÓN:</span>
        <span className="text-sm font-black px-2 py-0.5 bg-stone-100 rounded border border-stone-300">
          {order.items.reduce((s, i) => s + (i.quantity || 1), 0)} phần
        </span>
      </div>

      <div className="text-center pt-1 text-[10px] text-stone-500 font-bold italic tracking-wide">
        --- VUI LÒNG LÀM MÓN THEO THỨ TỰ GỌI ---
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="In hóa đơn & Phiếu chế biến"
      subtitle={`Đơn hàng ${order.orderNumber} • Bản xem trước in nhiệt`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Controls: Select print type tabs */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EFE9E0] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setPrintType('customer')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                printType === 'customer'
                  ? 'bg-[#3E2723] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1. Hóa đơn</span>
              <span>Khách</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintType('kitchen')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                printType === 'kitchen'
                  ? 'bg-[#3E2723] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2. Phiếu</span>
              <span>Bếp làm</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintType('both')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition cursor-pointer ${
                printType === 'both'
                  ? 'bg-[#C88A35] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cả 2 liên</span>
            </button>
          </div>

          {/* Paper size controls & QR link */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-[#F8F5F0] rounded-xl text-xs font-semibold border border-[#E8DFD5]">
            <div className="flex items-center gap-2">
              <span className="text-[#3E2723]">Khổ giấy:</span>
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

            <div className="flex items-center gap-2">
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#C88A35] hover:underline text-xs"
              >
                <span>Xem trang QR khách</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* The Printable Receipt Box (Captured by window.print()) */}
        <div className="flex justify-center bg-stone-200/60 p-4 sm:p-6 rounded-2xl overflow-x-auto max-h-[60vh] overflow-y-auto">
          <div
            id="printable-receipt"
            className={`w-full ${paperWidthClass} bg-white text-black p-6 rounded-lg shadow-md border border-stone-300 font-mono text-xs leading-relaxed`}
          >
            {printType === 'customer' && renderCustomerReceipt()}
            {printType === 'kitchen' && renderKitchenTicket()}
            {printType === 'both' && (
              <div className="space-y-6">
                {/* Liên 1: Phiếu cho Bếp làm món */}
                {renderKitchenTicket()}

                {/* Đường cắt giấy giữa 2 liên */}
                <div className="py-3 border-y-2 border-dashed border-stone-800 text-center text-[10px] text-stone-600 font-mono font-bold tracking-widest my-4 bg-stone-50">
                  ✂ - - - - CẮT GIẤY TẠI ĐÂY / TEAR HERE - - - - ✂
                </div>

                {/* Liên 2: Hóa đơn cho Khách hàng */}
                {renderCustomerReceipt()}
              </div>
            )}
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
    </Modal>
  )
}
