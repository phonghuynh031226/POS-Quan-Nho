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
  Delete,
  X,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Maximize2,
} from 'lucide-react'
import { orderApi } from '../../api/orderApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { DEFAULT_STORE_SETTINGS } from '../../constants'
import { settingsApi } from '../../api/settingsApi'
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
  const storeSettings = DEFAULT_STORE_SETTINGS

  const totalAmount = cart.reduce((sum, i) => sum + i.lineTotal, 0)

  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT') // 'TIEN_MAT' | 'CHUYEN_KHOAN'
  const [cashGiven, setCashGiven] = useState(totalAmount)
  const [cashInputText, setCashInputText] = useState(String(totalAmount))
  const [isFirstInput, setIsFirstInput] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [autoPrint, setAutoPrint] = useState(() => storeSettings.autoOpenPrint ?? true)
  const [defaultPrintType, setDefaultPrintType] = useState(
    () => storeSettings.defaultPrintMode || 'both'
  ) // 'customer' | 'kitchen' | 'both'

  // Transfer verification states
  const [transferPaid, setTransferPaid] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [transferTxId, setTransferTxId] = useState(null)
  const [transferContentCode, setTransferContentCode] = useState(
    () => `QN${Date.now().toString().slice(-4)}`
  )
  const [copiedCode, setCopiedCode] = useState(false)
  const [isQrZoomed, setIsQrZoomed] = useState(false)

  // Sync cash default whenever modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      const currentSettings = DEFAULT_STORE_SETTINGS
      settingsApi.getSettings().then((saved) => {
        setAutoPrint(saved.autoOpenPrint ?? true)
        setDefaultPrintType(saved.defaultPrintMode || 'both')
      }).catch(() => {})
      setCashGiven(totalAmount)
      setCashInputText(String(totalAmount))
      setIsFirstInput(true)
      setPaymentMethod('TIEN_MAT')
      setCreatedOrder(null)
      setErrorMessage('')
      setIsSubmitting(false)
      setAutoPrint(currentSettings.autoOpenPrint ?? true)
      setDefaultPrintType(currentSettings.defaultPrintMode || 'both')
      setTransferPaid(false)
      setIsCheckingPayment(false)
      setTransferTxId(null)
      setCopiedCode(false)
      setTransferContentCode(`QN${Date.now().toString().slice(-4)}`)
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

  // Numpad input handlers
  const handleNumpadDigit = (digit) => {
    let nextText = ''
    if (isFirstInput || cashInputText === '0' || !cashInputText) {
      nextText = String(digit)
      setIsFirstInput(false)
    } else {
      nextText = cashInputText + String(digit)
    }
    if (nextText.length > 10) return
    const numeric = parseInt(nextText, 10) || 0
    setCashGiven(numeric)
    setCashInputText(nextText)
    setErrorMessage('')
  }

  const handleNumpadTripleZero = () => {
    if (isFirstInput || cashInputText === '0' || !cashInputText) {
      return
    }
    const nextText = cashInputText + '000'
    if (nextText.length > 10) return
    const numeric = parseInt(nextText, 10) || 0
    setCashGiven(numeric)
    setCashInputText(nextText)
    setErrorMessage('')
  }

  const handleNumpadBackspace = () => {
    setIsFirstInput(false)
    if (!cashInputText || cashInputText.length <= 1) {
      setCashGiven(0)
      setCashInputText('0')
      return
    }
    const nextText = cashInputText.slice(0, -1)
    const numeric = parseInt(nextText, 10) || 0
    setCashGiven(numeric)
    setCashInputText(nextText)
    setErrorMessage('')
  }

  const handleNumpadClear = () => {
    setCashGiven(0)
    setCashInputText('0')
    setIsFirstInput(true)
    setErrorMessage('')
  }

  const handleNumpadAdd = (amountToAdd) => {
    setIsFirstInput(false)
    const nextValue = (cashGiven || 0) + amountToAdd
    setCashGiven(nextValue)
    setCashInputText(String(nextValue))
    setErrorMessage('')
  }

  const handleCashChange = (val) => {
    setIsFirstInput(false)
    const numeric = parseInt(val.replace(/\D/g, ''), 10) || 0
    setCashGiven(numeric)
    setCashInputText(String(numeric))
    setErrorMessage('')
  }

  const setExactCash = (amount) => {
    setCashGiven(amount)
    setCashInputText(String(amount))
    setIsFirstInput(true)
    setErrorMessage('')
  }

  // Chuyển khoản: Kiểm tra giao dịch SePay/Ngân hàng
  const handleCheckTransfer = () => {
    toast.error('Chưa kết nối SePay; không thể xác nhận chuyển khoản')
  }

  // Chuyển khoản: Thu ngân xác nhận thủ công đã nhận tiền
  const handleToggleTransferPaid = () => {
    toast.error('Chưa kết nối SePay; không thể xác nhận chuyển khoản')
  }

  // Sao chép nội dung chuyển khoản
  const handleCopyCode = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(transferContentCode)
    }
    setCopiedCode(true)
    toast.success(`Đã sao chép: ${transferContentCode}`)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleConfirmPayment = async () => {
    if (isSubmitting) return // Anti double-click
    setErrorMessage('')

    if (paymentMethod !== 'TIEN_MAT') {
      setErrorMessage('Chuyển khoản chưa kết nối SePay. Vui lòng chọn tiền mặt.')
      return
    }

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
        sepay_transaction_id: null,
        transfer_content: null,
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
      setErrorMessage(
        err.message || 'Lỗi khi tạo đơn hàng. Dữ liệu đã được giữ nguyên để thử lại.'
      )
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
      maxWidth="max-w-3xl"
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
                className="p-3.5 rounded-xl border border-[#D4C7B8] bg-white hover:bg-[#FAF7F2] hover:border-[#C88A35] text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#2D1B14] group-hover:text-[#C88A35]">
                  <Receipt className="w-4.5 h-4.5 text-[#C88A35]" />
                  <span>1. In hóa đơn khách</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Đầy đủ giá tiền, tiền thối & QR tra cứu
                </p>
              </button>

              <button
                type="button"
                onClick={() => onPrintOrder(createdOrder, 'kitchen')}
                className="p-3.5 rounded-xl border border-[#D4C7B8] bg-white hover:bg-[#FAF7F2] hover:border-[#C88A35] text-left transition cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#2D1B14] group-hover:text-[#C88A35]">
                  <ChefHat className="w-4.5 h-4.5 text-[#C88A35]" />
                  <span>2. In phiếu cho bếp</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Chữ to, số lượng, tùy chọn & ghi chú
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onPrintOrder(createdOrder, 'both')}
              className="w-full py-3 px-4 rounded-xl bg-[#2D1B14] hover:bg-[#3E2723] text-white font-bold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs"
            >
              <Layers className="w-4.5 h-4.5 text-[#E09F3E]" />
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
        <div className="space-y-4">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#EFE9E0] rounded-xl">
            <button
              type="button"
              onClick={() => setPaymentMethod('TIEN_MAT')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer ${
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
              disabled
              title="Chuyển khoản đang chờ kết nối SePay"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer ${
                paymentMethod === 'CHUYEN_KHOAN'
                  ? 'bg-[#3E2723] text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Chuyển khoản (chưa hỗ trợ)</span>
            </button>
          </div>

          {/* Cash Payment Flow with On-Screen Numpad */}
          {paymentMethod === 'TIEN_MAT' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* CỘT TRÁI (6/12): Ô NHẬP TIỀN & BÀN PHÍM SỐ NUMPAD */}
              <div className="md:col-span-6 space-y-3">
                {/* Input Display */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                      Tiền khách đưa (VNĐ)
                    </label>
                    <span className="text-xs font-bold text-[#C88A35]">
                      {formatCurrency(cashGiven || 0)}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={cashInputText}
                      onChange={(e) => handleCashChange(e.target.value)}
                      className="w-full text-2xl font-black pl-4 pr-12 py-2.5 rounded-xl border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-stone-400">₫</span>
                      {cashInputText && cashInputText !== '0' && (
                        <button
                          type="button"
                          onClick={handleNumpadClear}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
                          title="Xóa ô nhập"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* BÀN PHÍM SỐ NUMPAD */}
                <div className="p-2.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] shadow-2xs space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Hàng 1: 1, 2, 3, ⌫ */}
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(1)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(2)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(3)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      3
                    </button>
                    <button
                      type="button"
                      onClick={handleNumpadBackspace}
                      className="h-11 rounded-xl bg-[#F4EFEA] border border-[#D4C7B8] text-stone-700 hover:bg-stone-200 active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                      title="Xóa 1 ký tự"
                    >
                      <Delete className="w-5 h-5" />
                    </button>

                    {/* Hàng 2: 4, 5, 6, +10k */}
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(4)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      4
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(5)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(6)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      6
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadAdd(10000)}
                      className="h-11 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-[#7A5A43] hover:bg-amber-100 active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      +10k
                    </button>

                    {/* Hàng 3: 7, 8, 9, +50k */}
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(7)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      7
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(8)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      8
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(9)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      9
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadAdd(50000)}
                      className="h-11 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-[#7A5A43] hover:bg-amber-100 active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      +50k
                    </button>

                    {/* Hàng 4: C, 0, 000, +100k */}
                    <button
                      type="button"
                      onClick={handleNumpadClear}
                      className="h-11 rounded-xl bg-rose-50 border border-rose-200 text-sm font-black text-rose-700 hover:bg-rose-100 active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadDigit(0)}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-lg font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleNumpadTripleZero}
                      className="h-11 rounded-xl bg-white border border-[#D4C7B8] text-sm font-black text-[#2D1B14] hover:bg-[#F5EFEB] hover:border-[#C88A35] active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadAdd(100000)}
                      className="h-11 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-[#7A5A43] hover:bg-amber-100 active:scale-95 transition shadow-2xs cursor-pointer flex items-center justify-center"
                    >
                      +100k
                    </button>
                  </div>
                </div>

                {/* Quick suggestions pills */}
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExactCash(totalAmount)}
                      className="px-2.5 py-1 rounded-lg border border-[#C88A35] bg-[#FDFBF7] text-[#C88A35] text-xs font-bold hover:bg-[#F5EFEB] cursor-pointer shadow-2xs"
                    >
                      Vừa đủ ({formatCurrency(totalAmount)})
                    </button>
                    {[100000, 200000, 500000]
                      .filter((amt) => amt >= totalAmount)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setExactCash(amt)}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer shadow-2xs"
                        >
                          {formatCurrency(amt)}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (6/12): BẢNG TÍNH TIỀN, TỰ ĐỘNG IN & NÚT XÁC NHẬN */}
              <div className="md:col-span-6 space-y-3 flex flex-col">
                {/* Calculated Change */}
                <div className="p-3.5 rounded-2xl bg-[#F5EFEB] border border-[#E8DFD5] space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Tiền cần thanh toán:</span>
                    <span className="font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>Khách đưa:</span>
                    <span className="font-bold">{formatCurrency(cashGiven || 0)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#D4C7B8] text-xs">
                    <span className="font-bold text-[#3E2723]">Tiền thối lại:</span>
                    <span
                      className={`text-xl font-black ${
                        isCashInsufficient ? 'text-rose-600' : 'text-[#C88A35]'
                      }`}
                    >
                      {isCashInsufficient
                        ? `Thiếu ${formatCurrency(totalAmount - (cashGiven || 0))}`
                        : formatCurrency(changeReturned)}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Auto-print Configuration (Lớn, rõ ràng, dễ bấm) */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 font-bold text-sm text-[#2D1B14] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoPrint}
                        onChange={(e) => setAutoPrint(e.target.checked)}
                        className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35] cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <Printer className="w-4 h-4 text-[#C88A35]" />
                        Tự động mở in hóa đơn
                      </span>
                    </label>
                    {autoPrint && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Bật
                      </span>
                    )}
                  </div>

                  {autoPrint && (
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setDefaultPrintType('customer')}
                        className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                          defaultPrintType === 'customer'
                            ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        <Receipt className={`w-4 h-4 ${defaultPrintType === 'customer' ? 'text-[#E09F3E]' : 'text-[#C88A35]'}`} />
                        <span>1. Khách</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDefaultPrintType('kitchen')}
                        className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                          defaultPrintType === 'kitchen'
                            ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        <ChefHat className={`w-4 h-4 ${defaultPrintType === 'kitchen' ? 'text-[#E09F3E]' : 'text-[#C88A35]'}`} />
                        <span>2. Cho Bếp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDefaultPrintType('both')}
                        className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                          defaultPrintType === 'both'
                            ? 'bg-[#C88A35] text-white border-[#C88A35] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        <Layers className={`w-4 h-4 ${defaultPrintType === 'both' ? 'text-white' : 'text-[#C88A35]'}`} />
                        <span>Cả 2 liên</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-1 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isSubmitting || isCashInsufficient}
                    onClick={handleConfirmPayment}
                    className="w-full bg-[#2D1B14] hover:bg-[#3E2723] shadow-md text-sm font-bold py-3"
                  >
                    <Printer className="w-4 h-4 mr-1.5 text-[#E09F3E]" />
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full text-xs text-stone-500 hover:text-stone-800"
                  >
                    Quay lại giỏ
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Payment Flow (Gọn gàng 2 cột & có khu vực kiểm tra trạng thái thanh toán) */}
          {paymentMethod === 'CHUYEN_KHOAN' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* CỘT TRÁI (6/12): KHUNG MÃ VIETQR TO RÕ & DỄ QUÉT */}
              <div className="md:col-span-6 bg-white rounded-2xl border border-[#E8DFD5] p-3.5 flex flex-col items-center justify-between text-center shadow-2xs space-y-2.5">
                <div className="w-full flex flex-col items-center">
                  {/* Header VietQR & Nút Phóng to */}
                  <div className="flex items-center justify-between w-full pb-1.5 mb-1.5 border-b border-stone-200 text-xs">
                    <div className="flex items-center gap-1.5 font-black text-[#2D1B14]">
                      <span className="px-1.5 py-0.5 rounded bg-[#C88A35] text-white text-[10px] font-black uppercase">
                        VietQR
                      </span>
                      <span>Mã Quán Nhỏ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQrZoomed(true)}
                      className="text-[11px] font-bold text-[#C88A35] hover:text-[#9C6520] flex items-center gap-1 cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Phóng to</span>
                    </button>
                  </div>

                  {/* QR Image Box - TO RÕ BẢN CHUẨN qr_only.png (100% DIỆN TÍCH LÀ MA TRẬN QR) */}
                  <div
                    onClick={() => setIsQrZoomed(true)}
                    className="p-2.5 bg-[#FAF7F2] border-2 border-[#E8DFD5] hover:border-[#C88A35] rounded-2xl cursor-pointer transition flex flex-col items-center justify-center w-full max-w-[250px] shadow-2xs group"
                  >
                    <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-xl flex items-center justify-center p-2 relative overflow-hidden border border-stone-200">
                      <img
                        src={`https://img.vietqr.io/image/${
                          storeSettings?.bankName?.includes('MB') ? 'MB' : 'VCB'
                        }-${storeSettings?.bankAccountNumber || '0901234567'}-qr_only.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
                          transferContentCode
                        )}`}
                        alt="Mã VietQR"
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-150"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex'
                          }
                        }}
                      />
                      <div
                        style={{ display: 'none' }}
                        className="w-full h-full flex-col items-center justify-center"
                      >
                        <QrCode className="w-28 h-28 text-[#3E2723] mb-1" />
                        <span className="text-[9px] font-bold text-stone-600 uppercase">
                          VietQR Quán Nhỏ
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 font-medium flex items-center gap-1">
                      <Maximize2 className="w-2.5 h-2.5" /> Chạm để phóng to
                    </span>
                  </div>

                  {/* Số tiền cần thanh toán */}
                  <div className="mt-2">
                    <span className="text-[11px] text-stone-500 font-medium block">Số tiền cần quét:</span>
                    <span className="text-xl font-black text-[#C88A35] tracking-tight block">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Thông tin tài khoản & nội dung chuyển khoản */}
                <div className="w-full bg-[#FAF7F2] rounded-xl p-2.5 border border-[#E8DFD5] space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                    <span>Ngân hàng:</span>
                    <span className="font-bold text-[#2D1B14]">
                      {storeSettings?.bankName || 'MB Bank'} • {storeSettings?.bankAccountNumber || '0901234567'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#D4C7B8]">
                    <span className="font-mono font-black text-xs text-[#2D1B14] tracking-wider">
                      {transferContentCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#C88A35] hover:text-[#9C6520] cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (6/12): TRẠNG THÁI THANH TOÁN & CẤU HÌNH IN HÓA ĐƠN */}
              <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
                {/* 1. CHỖ KIỂM TRA THANH TOÁN THÀNH CÔNG HAY CHƯA */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all shadow-2xs ${
                    transferPaid
                      ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-200'
                      : 'bg-amber-50/80 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Trạng thái thanh toán:
                    </span>
                    {transferPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ĐÃ THANH TOÁN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        CHƯA THANH TOÁN
                      </span>
                    )}
                  </div>

                  {transferPaid ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">
                            Đã nhận đủ {formatCurrency(totalAmount)}
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            Mã GD: {transferTxId || `SP${Date.now().toString().slice(-6)}`} • Đã khớp tài khoản quán
                          </p>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleToggleTransferPaid}
                          className="text-[11px] font-semibold text-stone-500 hover:text-rose-600 cursor-pointer"
                        >
                          Đổi lại: Chưa nhận tiền
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs text-stone-700 leading-snug">
                        Khách đang quét mã. Sau khi có thông báo tài khoản hoặc biến động số dư, thu ngân bấm xác nhận:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleCheckTransfer}
                          disabled={isCheckingPayment}
                          className="py-2 px-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-[#C88A35] ${
                              isCheckingPayment ? 'animate-spin' : ''
                            }`}
                          />
                          <span>{isCheckingPayment ? 'Đang kiểm tra...' : 'Kiểm tra biến động'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleTransferPaid}
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nhận tiền</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* 2. Auto-print Configuration (Lớn, rõ ràng, dễ bấm) */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 font-bold text-sm text-[#2D1B14] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoPrint}
                        onChange={(e) => setAutoPrint(e.target.checked)}
                        className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35] cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <Printer className="w-4 h-4 text-[#C88A35]" />
                        Tự động mở in hóa đơn
                      </span>
                    </label>
                    {autoPrint && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Bật
                      </span>
                    )}
                  </div>

                  {autoPrint && (
                    <div className="grid grid-cols-3 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setDefaultPrintType('customer')}
                        className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                          defaultPrintType === 'customer'
                            ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        <Receipt
                          className={`w-4 h-4 ${
                            defaultPrintType === 'customer' ? 'text-[#E09F3E]' : 'text-[#C88A35]'
                          }`}
                        />
                        <span>1. Khách</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDefaultPrintType('kitchen')}
                        className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                          defaultPrintType === 'kitchen'
                            ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        <ChefHat
                          className={`w-4 h-4 ${
                            defaultPrintType === 'kitchen' ? 'text-[#E09F3E]' : 'text-[#C88A35]'
                          }`}
                        />
                        <span>2. Cho Bếp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDefaultPrintType('both')}
                        className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                          defaultPrintType === 'both'
                            ? 'bg-[#C88A35] text-white border-[#C88A35] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        <Layers
                          className={`w-4 h-4 ${
                            defaultPrintType === 'both' ? 'text-white' : 'text-[#C88A35]'
                          }`}
                        />
                        <span>Cả 2 liên</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Actions: Nút xác nhận & Quay lại giỏ */}
                <div className="pt-1 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onClick={handleConfirmPayment}
                    className={`w-full shadow-md text-sm font-bold py-3 transition ${
                      transferPaid
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-[#2D1B14] hover:bg-[#3E2723] text-white'
                    }`}
                  >
                    <Printer className="w-4 h-4 mr-1.5 text-[#E09F3E]" />
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

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full text-xs text-stone-500 hover:text-stone-800"
                  >
                    Quay lại giỏ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Zoom Lightbox Modal (Phóng to cực đại cho khách quét từ xa) */}
      {isQrZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsQrZoomed(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-3 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#C88A35] text-white text-xs font-black uppercase">
                VietQR
              </span>
              <span className="font-bold text-sm text-[#2D1B14]">Quán Nhỏ • Quét Mã</span>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border-2 border-[#C88A35] shadow-sm">
              <img
                src={`https://img.vietqr.io/image/${
                  storeSettings?.bankName?.includes('MB') ? 'MB' : 'VCB'
                }-${storeSettings?.bankAccountNumber || '0901234567'}-qr_only.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
                  transferContentCode
                )}`}
                alt="Mã VietQR Phóng To"
                className="w-72 h-72 object-contain rounded-xl bg-white p-2"
              />
            </div>

            <div>
              <span className="text-2xl font-black text-[#C88A35] block">
                {formatCurrency(totalAmount)}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                ND: <strong className="font-mono text-stone-800">{transferContentCode}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsQrZoomed(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2D1B14] hover:bg-[#3E2723] text-white font-bold text-xs cursor-pointer"
            >
              Đóng phóng to
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
