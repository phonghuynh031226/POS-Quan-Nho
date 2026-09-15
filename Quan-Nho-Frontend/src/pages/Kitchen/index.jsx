import { useState, useEffect, useRef } from 'react'
import {
  Clock,
  Coffee,
  CheckCircle2,
  CheckCheck,
  RotateCw,
  AlertCircle,
  Flame,
  Check,
  Sparkles,
} from 'lucide-react'
import { orderApi } from '../../api/orderApi'
import { formatTime, getElapsedMinutes } from '../../utils/formatters'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectionError, setConnectionError] = useState(null)

  const { currentUser } = useAuth()
  const toast = useToast()

  const pollIntervalRef = useRef(null)
  const isFetchingRef = useRef(false)

  // Fetch active kitchen orders
  const loadKitchenOrders = async (silent = false) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    if (!silent) setIsRefreshing(true)

    try {
      // Get all orders then filter out completed/cancelled
      const allOrders = await orderApi.getOrders()
      // Filter out DA_GIAO and DA_HUY
      const active = allOrders.filter(
        (o) => o.fulfillmentStatus !== 'DA_GIAO' && o.fulfillmentStatus !== 'DA_HUY'
      )

      // Sort by creation time ascending (FIFO - older orders first)
      active.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      setOrders(active)
      setLastUpdated(new Date())
      setConnectionError(null)
    } catch (err) {
      setConnectionError('Mất kết nối với máy chủ. Đang tự động kết nối lại...')
    } finally {
      if (!silent) setIsRefreshing(false)
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  // Set up 3.5s polling with clean unmount
  useEffect(() => {
    loadKitchenOrders(false)

    pollIntervalRef.current = setInterval(() => {
      loadKitchenOrders(true)
    }, 3500)

    // Listen to reactive DB updates for instant sync!
    const unsubscribe = orderApi.subscribe(() => {
      loadKitchenOrders(true)
    })

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      unsubscribe()
    }
  }, [])

  // Start preparing order (CHO_LAM -> DANG_LAM)
  const handleStartCooking = async (orderId) => {
    try {
      await orderApi.updateFulfillmentStatus(orderId, 'DANG_LAM')
      toast.info('Bắt đầu pha chế đơn hàng!')
      loadKitchenOrders(true)
    } catch (e) {
      toast.error('Lỗi: ' + e.message)
    }
  }

  // Toggle item completed status
  const handleToggleItemDone = async (orderId, lineId) => {
    try {
      await orderApi.toggleKitchenItemDone(orderId, lineId)
      loadKitchenOrders(true)
    } catch (e) {
      toast.error('Lỗi: ' + e.message)
    }
  }

  // Ready for pickup (DANG_LAM -> SAN_SANG)
  const handleMarkReady = async (order) => {
    const allItemsDone = order.items.every((i) => i.isCompletedInKitchen)
    if (!allItemsDone) {
      toast.warning('Vui lòng đánh dấu hoàn tất tất cả các món trước khi báo Sẵn sàng!')
      return
    }

    try {
      await orderApi.updateFulfillmentStatus(order.id, 'SAN_SANG')
      toast.success(`Đơn ${order.orderNumber} đã sẵn sàng nhận!`)
      loadKitchenOrders(true)
    } catch (e) {
      toast.error('Lỗi: ' + e.message)
    }
  }

  // Complete & Delivered (SAN_SANG -> DA_GIAO)
  const handleMarkDelivered = async (orderId) => {
    try {
      await orderApi.updateFulfillmentStatus(orderId, 'DA_GIAO')
      toast.success('Đã giao món thành công!')
      loadKitchenOrders(true)
    } catch (e) {
      toast.error('Lỗi: ' + e.message)
    }
  }

  // Group active orders into 3 columns
  const waitingOrders = orders.filter((o) => o.fulfillmentStatus === 'CHO_LAM')
  const inProgressOrders = orders.filter((o) => o.fulfillmentStatus === 'DANG_LAM')
  const readyOrders = orders.filter((o) => o.fulfillmentStatus === 'SAN_SANG')

  return (
    <div className="flex-1 flex flex-col bg-[#F8F5F0] overflow-hidden">
      {/* Top Header / KDS Status bar */}
      <div className="px-6 py-3 border-b border-[#E8DFD5] bg-[#FDFBF7] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3E2723] text-white flex items-center justify-center font-bold">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#2D1B14] flex items-center gap-2">
              <span>Màn Hình Pha Chế & Bếp (KDS)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFE9E0] text-[#543828] font-bold">
                {orders.length} đơn đang chờ
              </span>
            </h1>
            <p className="text-[11px] text-stone-500">
              Tự động cập nhật mỗi 3s • Thứ tự ưu tiên đơn đặt trước
            </p>
          </div>
        </div>

        {/* Sync & Connection Status */}
        <div className="flex items-center gap-4 text-xs">
          {connectionError ? (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-semibold animate-pulse">
              <AlertCircle className="w-4 h-4" />
              <span>{connectionError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-stone-500 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Đang kết nối realtime • Cập nhật lúc {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadKitchenOrders(false)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-[#D4C7B8] hover:bg-[#F5EFEB] text-stone-700 transition cursor-pointer"
            title="Làm mới ngay"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#C88A35]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3-Column Horizontal Tablet Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6 overflow-hidden">
        {/* Column 1: Chờ làm */}
        <div className="flex flex-col rounded-2xl bg-[#F4EFEA] border border-[#E8DFD5] overflow-hidden">
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>CHỜ LÀM ({waitingOrders.length})</span>
            </div>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200/70 px-2 py-0.5 rounded-full">
              Chờ nhận đơn
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {waitingOrders.length === 0 ? (
              <EmptyState
                title="Không có đơn chờ"
                description="Tất cả đơn mới đã được bắt đầu làm"
                className="py-12"
              />
            ) : (
              waitingOrders.map((order) => (
                <KitchenCard
                  key={order.id}
                  order={order}
                  columnType="CHO_LAM"
                  onStartCooking={handleStartCooking}
                  onToggleItemDone={handleToggleItemDone}
                  onMarkReady={handleMarkReady}
                  onMarkDelivered={handleMarkDelivered}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Đang làm */}
        <div className="flex flex-col rounded-2xl bg-[#F4EFEA] border border-[#E8DFD5] overflow-hidden">
          <div className="p-3.5 bg-sky-50 border-b border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sky-900 text-sm">
              <Flame className="w-4 h-4 text-sky-600" />
              <span>ĐANG LÀM ({inProgressOrders.length})</span>
            </div>
            <span className="text-[10px] text-sky-800 font-bold bg-sky-200/70 px-2 py-0.5 rounded-full">
              Pha chế / Ra món
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {inProgressOrders.length === 0 ? (
              <EmptyState
                title="Bếp đang rảnh"
                description="Bấm 'Bắt đầu làm' ở cột Chờ làm để nhận đơn"
                className="py-12"
              />
            ) : (
              inProgressOrders.map((order) => (
                <KitchenCard
                  key={order.id}
                  order={order}
                  columnType="DANG_LAM"
                  onStartCooking={handleStartCooking}
                  onToggleItemDone={handleToggleItemDone}
                  onMarkReady={handleMarkReady}
                  onMarkDelivered={handleMarkDelivered}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Sẵn sàng nhận */}
        <div className="flex flex-col rounded-2xl bg-[#F4EFEA] border border-[#E8DFD5] overflow-hidden">
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SẴN SÀNG NHẬN ({readyOrders.length})</span>
            </div>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-200/70 px-2 py-0.5 rounded-full animate-pulse">
              Mời khách nhận món
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {readyOrders.length === 0 ? (
              <EmptyState
                title="Chưa có món sẵn sàng"
                description="Khi hoàn tất các món, đơn sẽ hiển thị ở đây"
                className="py-12"
              />
            ) : (
              readyOrders.map((order) => (
                <KitchenCard
                  key={order.id}
                  order={order}
                  columnType="SAN_SANG"
                  onStartCooking={handleStartCooking}
                  onToggleItemDone={handleToggleItemDone}
                  onMarkReady={handleMarkReady}
                  onMarkDelivered={handleMarkDelivered}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-component for individual kitchen order card
function KitchenCard({
  order,
  columnType,
  onStartCooking,
  onToggleItemDone,
  onMarkReady,
  onMarkDelivered,
  currentUser,
}) {
  const elapsedMinutes = getElapsedMinutes(order.createdAt)
  const isUrgent = elapsedMinutes >= 10
  const allItemsDone = order.items.every((i) => i.isCompletedInKitchen)

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-xs space-y-3 transition-all ${
        isUrgent ? 'border-rose-400 ring-2 ring-rose-200' : 'border-[#E8DFD5]'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#F0EAE1] pb-2.5">
        <div>
          <span className="text-2xl font-black text-[#2D1B14] tracking-tight">
            {order.orderNumber}
          </span>
          <div className="text-[11px] text-stone-500 font-medium">
            Đặt lúc: {formatTime(order.createdAt)}
          </div>
        </div>

        {/* Wait time badge */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
            isUrgent
              ? 'bg-rose-100 text-rose-800 animate-pulse'
              : 'bg-[#FAF7F2] text-stone-700 border border-[#E8DFD5]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{elapsedMinutes} phút</span>
        </div>
      </div>

      {/* Item Checklist */}
      <div className="space-y-2">
        {order.items.map((item) => {
          let optString = ''
          if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
            optString = item.selectedOptions
              .map((o) => `${o.groupName}: ${o.optionName}`)
              .join(' • ')
          } else if (item.options) {
            optString = Object.entries(item.options)
              .filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
              .map(([_, v]) => (Array.isArray(v) ? v.map((t) => t.name).join(', ') : v))
              .join(' • ')
          }

          return (
            <div
              key={item.lineId}
              onClick={() => onToggleItemDone(order.id, item.lineId)}
              className={`p-2.5 rounded-xl border transition select-none cursor-pointer flex items-start gap-2.5 ${
                item.isCompletedInKitchen
                  ? 'bg-emerald-50/60 border-emerald-300 text-stone-500'
                  : 'bg-[#FAF7F2] border-[#E8DFD5] text-[#2D1B14] hover:border-[#C88A35]'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition shrink-0 ${
                  item.isCompletedInKitchen
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-stone-400 bg-white'
                }`}
              >
                {item.isCompletedInKitchen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Item Info */}
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      item.isCompletedInKitchen ? 'line-through text-stone-400' : 'text-[#2D1B14]'
                    }`}
                  >
                    {item.quantity}x {item.name}
                  </span>
                </div>

                {optString && (
                  <p className="text-[11px] text-stone-600 italic mt-0.5 font-medium">
                    ↳ {optString}
                  </p>
                )}

                {item.notes && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 font-bold inline-block">
                    Ghi chú: {item.notes}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-[#F0EAE1]">
        {columnType === 'CHO_LAM' && (
          <Button
            variant="accent"
            size="md"
            icon={Flame}
            onClick={() => onStartCooking(order.id)}
            className="w-full shadow-xs"
          >
            Bắt đầu làm
          </Button>
        )}

        {columnType === 'DANG_LAM' && (
          <Button
            variant={allItemsDone ? 'primary' : 'outline'}
            size="md"
            icon={CheckCircle2}
            disabled={!allItemsDone}
            onClick={() => onMarkReady(order)}
            className={`w-full ${
              allItemsDone
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md'
                : 'text-stone-400 border-stone-300'
            }`}
          >
            {allItemsDone ? 'Xong tất cả ➔ Sẵn sàng nhận' : 'Cần tick xong tất cả món'}
          </Button>
        )}

        {columnType === 'SAN_SANG' && (
          <Button
            variant="primary"
            size="md"
            icon={CheckCheck}
            onClick={() => onMarkDelivered(order.id)}
            className="w-full bg-[#3E2723] hover:bg-[#2D1B14] shadow-md"
          >
            Đã giao cho khách
          </Button>
        )}
      </div>
    </div>
  )
}
