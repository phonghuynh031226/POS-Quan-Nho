import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  Eye,
  Printer,
  XCircle,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  X,
  CreditCard,
  User,
  Coffee,
} from 'lucide-react'
import { orderApi } from '../../api/orderApi'
import { formatCurrency, formatDateTime, formatTime } from '../../utils/formatters'
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from '../../constants'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ReceiptModal from '../../components/print/ReceiptModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'CHO_LAM', label: 'Chờ làm' },
  { key: 'DANG_LAM', label: 'Đang làm' },
  { key: 'SAN_SANG', label: 'Sẵn sàng' },
  { key: 'DA_GIAO', label: 'Đã giao' },
  { key: 'DA_HUY', label: 'Đã hủy' },
]

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'

  // Modals
  const [viewingOrder, setViewingOrder] = useState(null)
  const [reprintingOrder, setReprintingOrder] = useState(null)
  const [cancellingOrder, setCancellingOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const { currentUser } = useAuth()
  const toast = useToast()

  const loadOrders = async () => {
    try {
      setLoading(true)
      const [filteredData, allData] = await Promise.all([
        orderApi.getOrders({
          search: searchQuery,
          fulfillmentStatus: statusFilter,
          date: selectedDate,
        }),
        orderApi.getOrders(),
      ])
      setOrders(filteredData || [])
      setAllOrders(allData || [])
    } catch (err) {
      toast.error('Lỗi tải lịch sử đơn: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter, selectedDate])

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    loadOrders()
  }

  // Quick Date Helpers
  const todayStr = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [])

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCount = allOrders.length
    const validOrders = allOrders.filter((o) => o.fulfillmentStatus !== 'DA_HUY')
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
    const completedCount = allOrders.filter((o) => o.fulfillmentStatus === 'DA_GIAO').length
    const cancelledOrders = allOrders.filter((o) => o.fulfillmentStatus === 'DA_HUY')
    const cancelledCount = cancelledOrders.length
    const totalRefund = cancelledOrders.reduce(
      (sum, o) => sum + (Number(o.refundAmount || o.totalAmount) || 0),
      0
    )

    // Counts per status
    const counts = {
      ALL: totalCount,
      CHO_LAM: allOrders.filter((o) => o.fulfillmentStatus === 'CHO_LAM').length,
      DANG_LAM: allOrders.filter((o) => o.fulfillmentStatus === 'DANG_LAM').length,
      SAN_SANG: allOrders.filter((o) => o.fulfillmentStatus === 'SAN_SANG').length,
      DA_GIAO: completedCount,
      DA_HUY: cancelledCount,
    }

    return {
      totalCount,
      validOrdersCount: validOrders.length,
      totalRevenue,
      completedCount,
      cancelledCount,
      totalRefund,
      counts,
    }
  }, [allOrders])

  // Cancel order & record refund
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Vui lòng nhập lý do hủy đơn hàng!')
      return
    }

    setIsCancelling(true)
    try {
      await orderApi.cancelOrder(cancellingOrder.id, cancelReason, cancellingOrder.totalAmount)
      toast.success(`Đã hủy đơn ${cancellingOrder.orderNumber} và ghi nhận hoàn tiền!`)
      setCancellingOrder(null)
      setCancelReason('')
      if (viewingOrder?.id === cancellingOrder.id) {
        setViewingOrder(null)
      }
      loadOrders()
    } catch (err) {
      toast.error('Lỗi hủy đơn: ' + err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
              Lịch Sử Đơn Hàng
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#D4C7B8] text-[11px] font-bold text-[#C88A35]">
              {orders.length} đơn hiển thị
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Tra cứu đơn hàng, theo dõi phục vụ, in lại hóa đơn pha chế và quản lý hoàn hủy
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-[#D4C7B8] rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#3E2723] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#3E2723] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng Bảng</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-[#D4C7B8] hover:bg-[#F5EFEB] text-stone-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C88A35]' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng đơn */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-[#C88A35] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Tổng số đơn
            </span>
            <div className="text-lg sm:text-xl font-black text-[#2D1B14] truncate">
              {stats.totalCount} <span className="text-xs font-normal text-stone-500">đơn</span>
            </div>
            <span className="text-[10px] text-stone-400 truncate block">Hóa đơn đã ghi nhận</span>
          </div>
        </div>

        {/* Card 2: Doanh thu thực nhận */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Doanh thu thực
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <span className="text-[10px] text-stone-400 truncate block">
              Từ {stats.validOrdersCount} đơn hợp lệ
            </span>
          </div>
        </div>

        {/* Card 3: Đã giao xong */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Đã giao xong
            </span>
            <div className="text-lg sm:text-xl font-black text-[#2D1B14] truncate">
              {stats.completedCount}{' '}
              <span className="text-xs font-normal text-stone-500">đơn</span>
            </div>
            <span className="text-[10px] text-stone-400 truncate block">Phục vụ thành công</span>
          </div>
        </div>

        {/* Card 4: Đơn đã hủy */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Đơn đã hủy
            </span>
            <div className="text-lg sm:text-xl font-black text-rose-700 truncate">
              {stats.cancelledCount}{' '}
              <span className="text-xs font-normal text-stone-500">đơn</span>
            </div>
            <span className="text-[10px] text-rose-500 truncate block font-medium">
              Hoàn: {formatCurrency(stats.totalRefund)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Status Tabs Pills & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-2xs space-y-3.5">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const count = stats.counts[tab.key] || 0
            const isActive = statusFilter === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#3E2723] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-[#C88A35] text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Date Controls Bar */}
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-2 border-t border-[#F2ECE4]">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm số đơn (QN-000001), tên món, người tạo..."
              className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-stone-50 border border-[#D4C7B8] rounded-xl text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  loadOrders()
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-[#C88A35] text-white border-[#C88A35]'
                  : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
              }`}
            >
              Hôm nay
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-600 border border-[#D4C7B8] hover:bg-stone-50 transition cursor-pointer"
              >
                Tất cả ngày
              </button>
            )}

            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-[#D4C7B8] bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C88A35] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Orders List Display */}
      {loading ? (
        <LoadingSpinner text="Đang tải danh sách lịch sử đơn..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Không có đơn nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại"
        />
      ) : viewMode === 'cards' ? (
        /* --- DẠNG THẺ (CARDS VIEW) --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
            const isCancelled = order.fulfillmentStatus === 'DA_HUY'

            return (
              <div
                key={order.id}
                onClick={() => setViewingOrder(order)}
                className={`bg-white rounded-2xl border transition shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer group ${
                  isCancelled
                    ? 'border-rose-200 bg-rose-50/30 opacity-85'
                    : 'border-[#E8DFD5] hover:border-[#C88A35]'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-[#F2ECE4] flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#2D1B14] group-hover:text-[#C88A35] transition">
                        {order.orderNumber}
                      </span>
                      {order.isReprinted && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold uppercase">
                          In x{order.reprintCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {formatDateTime(order.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3 text-stone-400" />
                        {order.createdBy || 'Chủ quán'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge statusKey={order.fulfillmentStatus} type="fulfillment" size="sm" />
                    <Badge statusKey={order.paymentStatus} type="payment" size="sm" />
                  </div>
                </div>

                {/* Card Items List */}
                <div className="p-4 flex-1 space-y-2">
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {order.items.map((item, idx) => {
                      const optCount = Array.isArray(item.selectedOptions)
                        ? item.selectedOptions.length
                        : 0

                      return (
                        <div
                          key={item.lineId || idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#FAF7F2] border border-[#F2ECE4]"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-[#3E2723] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-[#2D1B14] truncate">
                              {item.name}
                            </span>
                            {optCount > 0 && (
                              <span className="text-[9px] text-[#C88A35] bg-amber-50 px-1 py-0.2 rounded font-bold shrink-0">
                                +{optCount} tùy chọn
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-stone-600 shrink-0">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {isCancelled && order.refundReason && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                      <strong>Lý do hủy:</strong> {order.refundReason}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="p-3.5 bg-[#FAF7F2] border-t border-[#F2ECE4] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold block">
                      Tổng tiền ({itemCount} món)
                    </span>
                    <div className="text-sm font-black text-[#3E2723]">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    {order.refundAmount > 0 && (
                      <span className="text-[10px] text-rose-600 font-bold block">
                        Đã hoàn: {formatCurrency(order.refundAmount)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setViewingOrder(order)}
                      title="Xem chi tiết đơn"
                      className="p-2 rounded-xl bg-white border border-[#D4C7B8] hover:bg-stone-100 text-stone-700 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setReprintingOrder(order)}
                      title="In lại phiếu nhận món"
                      className="p-2 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {(currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') &&
                      !isCancelled && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrder(order)
                            setCancelReason('')
                          }}
                          title="Hủy đơn & hoàn tiền"
                          className="p-2 rounded-xl bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* --- DẠNG BẢNG (TABLE VIEW) --- */
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8F5F0] border-b border-[#E8DFD5] text-[#3E2723] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Số đơn</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Món đã đặt</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">Trạng thái phục vụ</th>
                  <th className="p-4">Thanh toán</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD5]">
                {orders.map((order) => {
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
                  const isCancelled = order.fulfillmentStatus === 'DA_HUY'

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setViewingOrder(order)}
                      className="hover:bg-[#FAF7F2] transition cursor-pointer group"
                    >
                      <td className="p-4 font-black text-[#2D1B14] text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="group-hover:text-[#C88A35] transition">
                            {order.orderNumber}
                          </span>
                          {order.isReprinted && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold uppercase">
                              In x{order.reprintCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 font-normal mt-0.5 flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {order.createdBy || 'Chủ quán'}
                        </div>
                      </td>

                      <td className="p-4 text-stone-600 text-xs">
                        <div className="font-semibold text-stone-800">
                          {formatTime(order.createdAt)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {formatDateTime(order.createdAt).split(' ')[1] || ''}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {order.items.slice(0, 3).map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#F2ECE4] text-[11px] font-semibold text-[#2D1B14]"
                            >
                              <strong className="text-[#C88A35]">{it.quantity}x</strong> {it.name}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-[11px] text-stone-400 font-bold px-1 py-0.5">
                              +{order.items.length - 3} món khác
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1 font-medium">
                          Tổng cộng {itemCount} món
                        </div>
                      </td>

                      <td className="p-4 font-black text-[#3E2723]">
                        <div className="text-sm">{formatCurrency(order.totalAmount)}</div>
                        {order.refundAmount > 0 && (
                          <div className="text-[10px] text-rose-600 font-bold">
                            Hoàn: {formatCurrency(order.refundAmount)}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <Badge statusKey={order.fulfillmentStatus} type="fulfillment" size="sm" />
                      </td>

                      <td className="p-4">
                        <Badge statusKey={order.paymentStatus} type="payment" size="sm" />
                      </td>

                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingOrder(order)}
                            title="Xem chi tiết"
                            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setReprintingOrder(order)}
                            title="In lại phiếu nhận món"
                            className="p-2 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {(currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') &&
                            !isCancelled && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingOrder(order)
                                  setCancelReason('')
                                }}
                                title="Hủy đơn & hoàn tiền"
                                className="p-2 rounded-xl bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL: CHI TIẾT ĐƠN HÀNG --- */}
      <Modal
        isOpen={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        title={`Chi tiết đơn hàng ${viewingOrder?.orderNumber}`}
        subtitle={`Tạo lúc ${formatDateTime(viewingOrder?.createdAt)} • Bởi ${
          viewingOrder?.createdBy || 'Chủ quán'
        }`}
        maxWidth="max-w-md"
      >
        {viewingOrder && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Statuses Cards */}
            <div className="flex justify-between items-center p-3 bg-[#F5EFEB] rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block mb-0.5">
                  Phục vụ
                </span>
                <Badge statusKey={viewingOrder.fulfillmentStatus} type="fulfillment" size="sm" />
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block mb-0.5">
                  Thanh toán
                </span>
                <Badge statusKey={viewingOrder.paymentStatus} type="payment" size="sm" />
              </div>
            </div>

            {/* Cancel notice */}
            {viewingOrder.fulfillmentStatus === 'DA_HUY' && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 space-y-1">
                <div className="font-bold text-xs">Đơn này đã bị hủy</div>
                <p className="text-xs">Lý do: {viewingOrder.refundReason}</p>
                <p className="text-xs font-semibold">
                  Số tiền hoàn: {formatCurrency(viewingOrder.refundAmount)}
                </p>
              </div>
            )}

            {/* Itemized list */}
            <div className="space-y-2 border-t border-b border-[#E8DFD5] py-3">
              <span className="font-bold text-[#3E2723] block text-xs uppercase tracking-wider">
                Danh sách món:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {viewingOrder.items.map((item, idx) => {
                  const optString =
                    Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0
                      ? item.selectedOptions
                          .map(
                            (o) =>
                              `${o.optionName}${
                                o.extraPrice > 0 ? ` (+${formatCurrency(o.extraPrice)})` : ''
                              }`
                          )
                          .join(' • ')
                      : item.options
                      ? Object.entries(item.options)
                          .filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
                          .map(([_, v]) =>
                            Array.isArray(v) ? v.map((t) => t.name).join(', ') : v
                          )
                          .join(' • ')
                      : ''

                  return (
                    <div key={item.lineId || idx} className="space-y-0.5">
                      <div className="flex justify-between font-semibold">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>{formatCurrency(item.lineTotal)}</span>
                      </div>
                      {optString && (
                        <p className="text-[11px] text-stone-500 italic pl-3">↳ {optString}</p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-stone-500 italic pl-3">↳ {item.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total breakdown */}
            <div className="flex justify-between items-baseline text-sm font-black pt-1">
              <span>TỔNG TIỀN:</span>
              <span className="text-base text-[#C88A35] font-black">
                {formatCurrency(viewingOrder.totalAmount)}
              </span>
            </div>

            {/* Action buttons inside detail modal */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Printer}
                  onClick={() => {
                    setReprintingOrder(viewingOrder)
                  }}
                  className="flex-1 text-xs"
                >
                  In lại phiếu
                </Button>

                {(currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') &&
                  viewingOrder.fulfillmentStatus !== 'DA_HUY' && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => {
                        setCancellingOrder(viewingOrder)
                        setCancelReason('')
                      }}
                      className="text-xs"
                    >
                      Hủy đơn
                    </Button>
                  )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL: XÁC NHẬN HỦY ĐƠN & HOÀN TIỀN --- */}
      <Modal
        isOpen={Boolean(cancellingOrder)}
        onClose={() => setCancellingOrder(null)}
        title="Xác nhận hủy đơn hàng & hoàn tiền"
        subtitle={`Đơn hàng: ${cancellingOrder?.orderNumber}`}
        maxWidth="max-w-md"
      >
        {cancellingOrder && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Lưu ý quan trọng:</strong> Thao tác này sẽ ghi nhận trạng thái hủy đơn và
                hoàn tiền trong báo cáo sổ sách. Hệ thống <strong>không</strong> tự động chuyển tiền
                ngân hàng về tài khoản khách; thu ngân vui lòng chủ động hoàn tiền mặt hoặc chuyển
                khoản trực tiếp cho khách.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                Lý do hủy đơn (bắt buộc)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách bận đột xuất muốn hủy, hết nguyên liệu pha chế..."
                rows={3}
                required
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] flex justify-between items-center text-xs">
              <span className="text-stone-600">Số tiền ghi nhận hoàn trả:</span>
              <span className="text-sm font-black text-rose-700">
                {formatCurrency(cancellingOrder.totalAmount)}
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCancellingOrder(null)}
                disabled={isCancelling}
              >
                Quay lại
              </Button>
              <Button
                variant="danger"
                loading={isCancelling}
                onClick={handleConfirmCancel}
                className="px-5 shadow-md"
              >
                Xác nhận hủy đơn
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- MODAL: IN LẠI PHIẾU NHẬN MÓN / HÓA ĐƠN --- */}
      <ReceiptModal
        isOpen={Boolean(reprintingOrder)}
        onClose={() => setReprintingOrder(null)}
        order={reprintingOrder}
        isReprint={true}
        onPrinted={() => {
          loadOrders()
        }}
      />
    </div>
  )
}
