import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/formatters'
import {
  Banknote,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCcw,
  Receipt,
  ChefHat,
  Layers,
} from 'lucide-react'
import { orderApi } from '../../api/orderApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { mockDb } from '../../api/mockDb'
import { DISPLAY_STATES, sendDisplayState } from '../../utils/customerDisplaySync'

export default function PaymentModal({
  isOpen,
  onClose,
  cart,
  onPaymentSuccess,
  onPrintOrder,
}) {
  const { currentUser } = useAuth()
  const toast = useToast()
  const storeSettings = mockDb.getStoreSettings()

  const totalAmount = cart.reduce((sum, i) => sum + i.lineTotal, 0)

  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT') // 'TIEN_MAT' | 'CHUYEN_KHOAN'
  const [cashGiven, setCashGiven] = useState(totalAmount)
  const [cashInputText, setCashInputText] = useState(String(totalAmount))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [autoPrint, setAutoPrint] = useState(() => storeSettings.autoOpenPrint ?? true)
  const [defaultPrintType, setDefaultPrintType] = useState(() => storeSettings.defaultPrintMode || 'both') // 'customer' | 'kitchen' | 'both'

  // Sync cash default whenever modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      const currentSettings = mockDb.getStoreSettings()
      setCashGiven(totalAmount)
      setCashInputText(String(totalAmount))
      setPaymentMethod('TIEN_MAT')
      setCreatedOrder(null)
      setErrorMessage('')
      setIsSubmitting(false)
      setAutoPrint(currentSettings.autoOpenPrint ?? true)
      setDefaultPrintType(currentSettings.defaultPrintMode || 'both')
    }
  }, [isOpen, totalAmount])

  const changeReturned = Math.max(0, (cashGiven || 0) - totalAmount)
  const isCashInsufficient = paymentMethod === 'TIEN_MAT' && (cashGiven || 0) < totalAmount

  // Realtime sync to Customer Facing Display during payment
  useEffect(() => {
    if (!isOpen) return
    if (createdOrder) {
      sendDisplayState({
        type: DISPLAY_STATES.SUCCESS,
        orderNumber: createdOrder.orderNumber,
        totalAmount: createdOrder.totalAmount,
        paymentMethod: createdOrder.paymentMethod,
        changeReturned: createdOrder.changeReturned,
      })
    } else {
      sendDisplayState({
        type: DISPLAY_STATES.PAYMENT,
        paymentMethod,
        totalAmount,
        cashGiven,
        changeReturned,
        items: cart,
      })
    }
  }, [isOpen, createdOrder, paymentMethod, totalAmount, cashGiven, changeReturned, cart])

  const handleCashChange = (val) => {
    const numeric = parseInt(val.replace(/\D/g, ''), 10) || 0
    setCashGiven(numeric)
    setCashInputText(String(numeric))
    setErrorMessage('')
  }

  const setExactCash = (amount) => {
    setCashGiven(amount)
    setCashInputText(String(amount))
    setErrorMessage('')
  }

  const handleConfirmPayment = async () => {
    if (isSubmitting) return // Anti double-click
    setErrorMessage('')

    if (isCashInsufficient) {
      setErrorMessage('Tiền khách đưa chưa đủ để thanh toán!')
      return
    }

    setIsSubmitting(true)
    try {
      const orderPayload = {
        createdBy: currentUser?.name || 'Chủ quán',
        paymentMethod,
        totalAmount,
        cashGiven: paymentMethod === 'TIEN_MAT' ? cashGiven : totalAmount,
        changeReturned: paymentMethod === 'TIEN_MAT' ? changeReturned : 0,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          unitPrice: item.unitPrice,
          surcharge: item.surcharge,
          lineTotal: item.lineTotal,
          quantity: item.quantity,
          options: item.options,
          selectedOptions: item.selectedOptions || [],
          notes: item.notes,
        })),
      }

      const order = await orderApi.createOrder(orderPayload)
      toast.success(`Tạo đơn ${order.orderNumber} thành công!`)
      onPaymentSuccess(order)

      if (autoPrint) {
        // Tự động mở ngay màn hình in với liên đã chọn
        onPrintOrder(order, defaultPrintType)
      } else {
        setCreatedOrder(order)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi tạo đơn hàng. Dữ liệu đã được giữ nguyên để thử lại.')
      toast.error(err.message || 'Lỗi tạo đơn')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateNextOrder = () => {
    setCreatedOrder(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={createdOrder ? handleCreateNextOrder : onClose}
      title={createdOrder ? 'Thanh toán thành công!' : 'Xác nhận thanh toán'}
      subtitle={
        createdOrder
          ? `Đơn ${createdOrder.orderNumber} đã ghi nhận thành công vào hệ thống`
          : `Tổng thanh toán: ${formatCurrency(totalAmount)}`
      }
      maxWidth="max-w-lg"
      showClose={!isSubmitting}
    >
      {/* If order created successfully, show success receipt card with dual-print buttons */}
      {createdOrder ? (
        <div className="text-center space-y-5 py-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase font-bold text-stone-500 tracking-wider">
              MÃ SỐ ĐƠN HÀNG
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#2D1B14] mt-1 tracking-tight">
              {createdOrder.orderNumber}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Hình thức: {paymentMethod === 'TIEN_MAT' ? 'Tiền mặt' : 'Chuyển khoản VietQR'} • Tổng:{' '}
              {formatCurrency(createdOrder.totalAmount)}
            </p>
          </div>

          {paymentMethod === 'TIEN_MAT' && createdOrder.changeReturned > 0 && (
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DFD5] text-center">
              <span className="text-xs text-stone-500 block">Tiền cần thối lại cho khách:</span>
              <span className="text-xl font-black text-[#C88A35]">
                {formatCurrency(createdOrder.changeReturned)}
              </span>
            </div>
          )}

          {/* Quick print selection cards */}
          <div className="p-3 bg-[#F8F5F0] rounded-2xl border border-[#E8DFD5] text-left space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#7A5A43] flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-[#C88A35]" />
              <span>Tùy chọn in hóa đơn & phiếu làm món:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onPrintOrder(createdOrder, 'customer')}
                className="p-3 rounded-xl border border-[#D4C7B8] bg-white hover:bg-[#FAF7F2] hover:border-[#C88A35] text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#2D1B14] group-hover:text-[#C88A35]">
                  <Receipt className="w-4 h-4 text-[#C88A35]" />
                  <span>1. In hóa đơn khách</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Đầy đủ giá tiền, tiền thối & QR tra cứu
                </p>
              </button>

              <button
                type="button"
                onClick={() => onPrintOrder(createdOrder, 'kitchen')}
                className="p-3 rounded-xl border border-[#D4C7B8] bg-white hover:bg-[#FAF7F2] hover:border-[#C88A35] text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#2D1B14] group-hover:text-[#C88A35]">
                  <ChefHat className="w-4 h-4 text-[#C88A35]" />
                  <span>2. In phiếu cho bếp</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Chữ to, số lượng, tùy chọn & ghi chú
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onPrintOrder(createdOrder, 'both')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#2D1B14] hover:bg-[#3E2723] text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Layers className="w-4 h-4 text-[#E09F3E]" />
              <span>In cả 2 liên (Khách + Bếp làm món)</span>
            </button>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="lg"
              icon={RotateCcw}
              onClick={handleCreateNextOrder}
              className="w-full"
            >
              Tạo đơn tiếp theo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#EFE9E0] rounded-xl">
            <button
              type="button"
              onClick={() => setPaymentMethod('TIEN_MAT')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition cursor-pointer ${
                paymentMethod === 'TIEN_MAT'
                  ? 'bg-[#3E2723] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tiền mặt</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CHUYEN_KHOAN')}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition cursor-pointer ${
                paymentMethod === 'CHUYEN_KHOAN'
                  ? 'bg-[#3E2723] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Chuyển khoản</span>
            </button>
          </div>

          {/* Cash Payment Flow */}
          {paymentMethod === 'TIEN_MAT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                  Tiền khách đưa (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cashInputText}
                    onChange={(e) => handleCashChange(e.target.value)}
                    className="w-full text-2xl font-black px-4 py-3 rounded-xl border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                    ₫
                  </span>
                </div>
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="block text-xs text-stone-500 mb-2">Gợi ý mệnh giá nhanh:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExactCash(totalAmount)}
                    className="px-3 py-1.5 rounded-lg border border-[#C88A35] bg-[#FDFBF7] text-[#C88A35] text-xs font-bold hover:bg-[#F5EFEB] cursor-pointer"
                  >
                    Vừa đủ ({formatCurrency(totalAmount)})
                  </button>
                  {[50000, 100000, 200000, 500000]
                    .filter((amt) => amt >= totalAmount)
                    .map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setExactCash(amt)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                </div>
              </div>

              {/* Calculated Change */}
              <div className="p-4 rounded-xl bg-[#F5EFEB] border border-[#E8DFD5] space-y-1">
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Tiền cần thanh toán:</span>
                  <span className="font-bold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-600">
                  <span>Khách đưa:</span>
                  <span className="font-bold">{formatCurrency(cashGiven || 0)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#D4C7B8] text-sm">
                  <span className="font-bold text-[#3E2723]">Tiền thối lại:</span>
                  <span
                    className={`text-xl font-black ${
                      isCashInsufficient ? 'text-rose-600' : 'text-[#C88A35]'
                    }`}
                  >
                    {isCashInsufficient
                      ? `Còn thiếu ${formatCurrency(totalAmount - (cashGiven || 0))}`
                      : formatCurrency(changeReturned)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Payment Flow */}
          {paymentMethod === 'CHUYEN_KHOAN' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">Lưu ý cho nhân viên thu ngân:</p>
                  <p>
                    Vui lòng hướng dẫn khách quét mã và <strong>chỉ bấm xác nhận</strong> sau khi
                    bạn đã kiểm tra thông báo biến động số dư hoặc tin nhắn tài khoản của quán.
                  </p>
                </div>
              </div>

              {/* Demo VietQR Display */}
              <div className="p-4 bg-white rounded-xl border border-stone-300 inline-block shadow-sm">
                <div className="w-44 h-44 bg-stone-100 border border-stone-200 rounded-lg flex flex-col items-center justify-center p-2 mx-auto">
                  <QrCode className="w-24 h-24 text-[#3E2723] mb-2" />
                  <span className="text-[10px] font-bold text-stone-600 uppercase">
                    VietQR Quán Nhỏ
                  </span>
                  <span className="text-xs font-black text-[#C88A35]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-2 font-mono">
                  ND: QUAN NHO {Date.now().toString().slice(-4)}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Auto-print Configuration */}
          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-bold text-xs text-[#2D1B14] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35]"
                />
                <span>Tự động mở in hóa đơn sau khi bấm xác nhận</span>
              </label>
              {autoPrint && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Mở in ngay
                </span>
              )}
            </div>

            {autoPrint && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDefaultPrintType('customer')}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    defaultPrintType === 'customer'
                      ? 'bg-[#3E2723] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-[#D4C7B8] hover:bg-stone-50'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>1. Khách</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultPrintType('kitchen')}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    defaultPrintType === 'kitchen'
                      ? 'bg-[#3E2723] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-[#D4C7B8] hover:bg-stone-50'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>2. Cho Bếp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDefaultPrintType('both')}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    defaultPrintType === 'both'
                      ? 'bg-[#C88A35] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-[#D4C7B8] hover:bg-stone-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cả 2 liên</span>
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Quay lại giỏ
            </Button>

            <Button
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting || isCashInsufficient}
              onClick={handleConfirmPayment}
              className="flex-1 bg-[#2D1B14] hover:bg-[#3E2723] shadow-md text-sm sm:text-base font-bold"
            >
              <Printer className="w-4 h-4 mr-1 text-[#E09F3E]" />
              <span>
                {autoPrint
                  ? defaultPrintType === 'customer'
                    ? 'Xác nhận & In đơn khách'
                    : defaultPrintType === 'kitchen'
                    ? 'Xác nhận & In phiếu bếp'
                    : 'Xác nhận & In cả 2 liên'
                  : 'Xác nhận & Lưu đơn'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
