import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Coffee,
  Clock,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  Sparkles,
  RotateCw,
  BellRing,
} from 'lucide-react'
import { orderApi } from '../../api/orderApi'
import { formatTime, formatCurrency } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function TrackingPage() {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(new Date())

  const intervalRef = useRef(null)

  const fetchTrackingOrder = async (silent = false) => {
    if (!token) {
      setError('Mã tra cứu không hợp lệ')
      setLoading(false)
      return
    }

    try {
      const data = await orderApi.getOrderByToken(token)
      setOrder(data)
      setError(null)
      setLastChecked(new Date())
    } catch (err) {
      setError(err.message || 'Không tìm thấy thông tin đơn hàng này')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrackingOrder(false)

    // Polling every 3.5 seconds
    intervalRef.current = setInterval(() => {
      fetchTrackingOrder(true)
    }, 3500)

    // Multi-tab reactive sync
    const unsubscribe = orderApi.subscribe(() => {
      fetchTrackingOrder(true)
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      unsubscribe()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-4">
        <LoadingSpinner text="Đang tra cứu tiến độ đơn hàng..." />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg border border-[#E8DFD5] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#2D1B14]">Không tìm thấy đơn hàng</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            {error || 'Mã tra cứu này không tồn tại hoặc đã hết hạn.'}
          </p>
          <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-200">
            Vui lòng kiểm tra lại mã QR trên phiếu nhận món của bạn hoặc hỏi nhân viên tại quầy.
          </div>
        </div>
      </div>
    )
  }

  // Determine stage index
  // 0: CHO_LAM, 1: DANG_LAM, 2: SAN_SANG, 3: DA_GIAO
  const stages = [
    { key: 'CHO_LAM', label: 'Chờ làm', icon: Clock },
    { key: 'DANG_LAM', label: 'Đang pha chế', icon: Coffee },
    { key: 'SAN_SANG', label: 'Sẵn sàng nhận', icon: CheckCircle2 },
    { key: 'DA_GIAO', label: 'Đã nhận món', icon: CheckCheck },
  ]

  let currentStageIndex = 0
  if (order.fulfillmentStatus === 'DANG_LAM') currentStageIndex = 1
  else if (order.fulfillmentStatus === 'SAN_SANG') currentStageIndex = 2
  else if (order.fulfillmentStatus === 'DA_GIAO') currentStageIndex = 3

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#2D1B14] flex flex-col items-center justify-start p-4 sm:p-6 select-none">
      {/* Container - Mobile first max-w-md */}
      <div className="w-full max-w-md space-y-4">
        {/* Brand Header */}
        <div className="text-center pt-2 pb-1 space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#3E2723] text-white shadow-md mb-2">
            <Coffee className="w-6 h-6 text-[#C88A35]" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-[#2D1B14]">QUÁN NHỎ</h1>
          <p className="text-xs text-stone-500">Trang tra cứu tiến độ đơn hàng</p>
        </div>

        {/* Big Order Status Card */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E8DFD5] space-y-6 text-center relative overflow-hidden">
          {/* Status banner */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              SỐ ĐƠN CỦA BẠN
            </span>
            <div className="text-4xl font-black text-[#3E2723] tracking-tight">
              {order.orderNumber}
            </div>
            <p className="text-xs text-stone-500">
              Đặt lúc {formatTime(order.createdAt)} • Thu ngân: {order.createdBy || 'Quán Nhỏ'}
            </p>
          </div>

          {/* Special Prominent Callout when Ready */}
          {order.fulfillmentStatus === 'SAN_SANG' && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-emerald-950 animate-pulse space-y-1">
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-extrabold text-sm uppercase">
                <BellRing className="w-5 h-5 animate-bounce" />
                <span>MỜI BẠN ĐẾN QUẦY NHẬN MÓN!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Tất cả món đã hoàn thành thơm ngon. Xin vui lòng đưa phiếu có số đơn{' '}
                <strong>{order.orderNumber}</strong> cho nhân viên quầy.
              </p>
            </div>
          )}

          {/* Delivered Banner */}
          {order.fulfillmentStatus === 'DA_GIAO' && (
            <div className="bg-stone-100 border border-stone-300 rounded-2xl p-4 text-stone-700 space-y-1">
              <div className="flex items-center justify-center gap-2 text-stone-800 font-bold text-sm">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <span>ĐƠN HÀNG ĐÃ ĐƯỢC GIAO</span>
              </div>
              <p className="text-xs text-stone-600">
                Chúc bạn có những phút giây thư giãn và ngon miệng tại Quán Nhỏ!
              </p>
            </div>
          )}

          {/* Cancelled Banner */}
          {order.fulfillmentStatus === 'DA_HUY' && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-rose-900 space-y-1">
              <div className="font-bold text-sm">ĐƠN HÀNG ĐÃ BỊ HỦY</div>
              <p className="text-xs">{order.refundReason || 'Đã ghi nhận hoàn tiền'}</p>
            </div>
          )}

          {/* Stepper Progress */}
          {order.fulfillmentStatus !== 'DA_HUY' && (
            <div className="pt-2">
              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-[#E8DFD5] -z-0" />
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-[#C88A35] transition-all duration-500 -z-0"
                  style={{
                    width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
                  }}
                />

                {/* Steps */}
                {stages.map((stg, idx) => {
                  const Icon = stg.icon
                  const isDone = idx <= currentStageIndex
                  const isCurrent = idx === currentStageIndex

                  return (
                    <div key={stg.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCurrent
                            ? 'bg-[#C88A35] text-white shadow-md ring-4 ring-[#F5E6D0] scale-110'
                            : isDone
                            ? 'bg-[#3E2723] text-white'
                            : 'bg-white border-2 border-[#D4C7B8] text-stone-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${
                          isCurrent
                            ? 'text-[#C88A35]'
                            : isDone
                            ? 'text-[#3E2723]'
                            : 'text-stone-400'
                        }`}
                      >
                        {stg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ordered Items List Card */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E8DFD5] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
            <h3 className="font-bold text-sm text-[#2D1B14]">Chi tiết món bạn đã chọn</h3>
            <span className="text-xs text-stone-500">
              {order.items.reduce((s, i) => s + i.quantity, 0)} món
            </span>
          </div>

          <div className="space-y-3 divide-y divide-[#F0EAE1]">
            {order.items.map((item, idx) => {
              let optString = ''
              if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
                optString = item.selectedOptions
                  .map(
                    (o) =>
                      `${o.optionName}${
                        o.extraPrice > 0 ? ` (+${formatCurrency(o.extraPrice)})` : ''
                      }`
                  )
                  .join(' • ')
              } else if (item.options) {
                optString = Object.entries(item.options)
                  .filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
                  .map(([_, v]) => (Array.isArray(v) ? v.map((t) => t.name).join(', ') : v))
                  .join(' • ')
              }

              return (
                <div key={item.lineId || idx} className="pt-2.5 first:pt-0 space-y-1">
                  <div className="flex justify-between items-baseline font-bold text-xs sm:text-sm text-[#2D1B14]">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-stone-600 font-semibold text-xs">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>

                  {optString && (
                    <p className="text-[11px] text-stone-500 italic">↳ {optString}</p>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-[#B45309] font-medium">
                      Ghi chú: {item.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] flex justify-between items-baseline">
            <span className="text-xs font-bold text-stone-500 uppercase">Tổng thanh toán:</span>
            <span className="text-base font-black text-[#2D1B14]">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Polling Notice Footer */}
        <div className="text-center text-[11px] text-stone-400 space-y-1 pt-2 pb-6">
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Đang tự động cập nhật mỗi 3s • Lúc {lastChecked.toLocaleTimeString()}</span>
          </div>
          <p className="italic text-[10px]">
            * Lưu ý: Vui lòng giữ màn hình sáng để theo dõi tiến độ chính xác nhất.
          </p>
        </div>
      </div>
    </div>
  )
}
