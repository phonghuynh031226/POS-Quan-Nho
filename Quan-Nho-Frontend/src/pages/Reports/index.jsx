import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Banknote,
  Award,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  ShoppingBag,
  Clock,
  Eye,
  BarChart3,
  LineChart,
  Search,
} from 'lucide-react'
import { reportApi } from '../../api/reportApi'
import { settingsApi } from '../../api/settingsApi'
import { formatCurrency } from '../../utils/formatters'
import { formatLocalDate, parseLocalDate } from '../../utils/localDate'
import {
  buildReportFilename,
  buildReportWorkbook,
  saveReportWorkbook,
} from '../../utils/reportExcel'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Button from '../../components/common/Button'
import ReceiptModal from '../../components/print/ReceiptModal'
import { useToast } from '../../context/ToastContext'

export default function ReportsPage() {
  const todayStr = useMemo(() => formatLocalDate(new Date()), [])
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr])
  const currentYearStr = useMemo(() => todayStr.slice(0, 4), [todayStr])

  // Period mode: 'day' | 'week' | 'month' | 'year' | 'custom'
  const [periodType, setPeriodType] = useState('day')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [selectedYear, setSelectedYear] = useState(currentYearStr)
  const [fromDate, setFromDate] = useState(todayStr)
  const [toDate, setToDate] = useState(todayStr)

  // Report viewing mode: 'overview' | 'payments' | 'bestsellers' | 'performance' | 'transactions' | 'all'
  const [viewMode, setViewMode] = useState('overview')
  const [txFilter, setTxFilter] = useState('all') // 'all' | 'paid' | 'cancelled'
  const [txSearch, setTxSearch] = useState('')

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredTimelineIndex, setHoveredTimelineIndex] = useState(null)

  // Receipt modal state for viewing transactions
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null)

  const toast = useToast()

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportApi.getStats({
        periodType,
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear,
        fromDate,
        toDate,
      })
      setStats(data)
    } catch (err) {
      setError(err.message)
      toast.error('Lỗi tải báo cáo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [periodType, selectedDate, selectedMonth, selectedYear, fromDate, toDate])

  // Quick navigation: Previous / Next
  const handleNavigate = (direction) => {
    const delta = direction === 'prev' ? -1 : 1

    if (periodType === 'day' || periodType === 'week') {
      const daysToAdd = periodType === 'week' ? delta * 7 : delta
      const d = parseLocalDate(selectedDate)
      d.setDate(d.getDate() + daysToAdd)
      setSelectedDate(formatLocalDate(d))
    } else if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number)
      const newD = new Date(y, m - 1 + delta, 1)
      const newMonthStr = `${newD.getFullYear()}-${String(newD.getMonth() + 1).padStart(2, '0')}`
      setSelectedMonth(newMonthStr)
    } else if (periodType === 'year') {
      setSelectedYear((prev) => String(Number(prev) + delta))
    }
  }

  // Export report summary and orders to Excel (.xlsx)
  const handleExportExcel = async () => {
    if (!stats) return
    try {
      const settings = await settingsApi.getSettings().catch(() => ({}))
      const shopName = settings.storeName || settings.shop_name || ''
      const workbook = buildReportWorkbook({ shopName, stats })
      const filename = buildReportFilename({
        shopName,
        periodType,
        selectedDate,
        selectedMonth,
        selectedYear,
        fromDate: stats.fromDate || fromDate,
        toDate: stats.toDate || toDate,
      })

      saveReportWorkbook(workbook, filename)
      toast.success('Đã xuất báo cáo Excel (.xlsx) thành công!')
    } catch (err) {
      toast.error('Lỗi xuất file Excel: ' + err.message)
    }
  }

  // Maximum timeline value for chart scaling
  const maxTimelineRevenue = useMemo(() => {
    if (!stats?.timeline || stats.timeline.length === 0) return 1
    const maxVal = Math.max(...stats.timeline.map((t) => t.revenue || 0))
    return maxVal > 0 ? maxVal : 1
  }, [stats?.timeline])

  // SVG Line Chart Metrics
  const svgMetrics = useMemo(() => {
    const list = stats?.timeline || []
    const count = list.length
    if (count === 0) return null

    const width = 500
    const height = 180
    const padding = { top: 20, right: 25, bottom: 25, left: 45 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const maxVal = maxTimelineRevenue > 0 ? maxTimelineRevenue : 1

    const getX = (index) => {
      if (count <= 1) return padding.left + chartW / 2
      return padding.left + (index / (count - 1)) * chartW
    }

    const getY = (val) => {
      const clamped = Math.max(0, Number(val) || 0)
      return padding.top + (1 - clamped / maxVal) * chartH
    }

    const totalPoints = list.map((item, i) => `${getX(i).toFixed(1)},${getY(item.revenue).toFixed(1)}`).join(' ')
    const cashPoints = list.map((item, i) => `${getX(i).toFixed(1)},${getY(item.cashRevenue || 0).toFixed(1)}`).join(' ')
    const transferPoints = list.map((item, i) => `${getX(i).toFixed(1)},${getY(item.transferRevenue || 0).toFixed(1)}`).join(' ')

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      maxVal,
      getX,
      getY,
      totalPoints,
      cashPoints,
      transferPoints,
      count,
    }
  }, [stats?.timeline, maxTimelineRevenue])

  const filteredOrders = useMemo(() => {
    if (!stats?.orders) return []
    return stats.orders.filter((order) => {
      const isPaid =
        order.paymentStatus === 'DA_THANH_TOAN' || order.payment_status === 'PAID'
      const isCancelled =
        order.fulfillmentStatus === 'CANCELLED' ||
        order.status === 'CANCELLED' ||
        order.paymentStatus === 'DA_HOAN_TIEN'

      if (txFilter === 'paid' && !isPaid) return false
      if (txFilter === 'cancelled' && !isCancelled) return false

      if (txSearch.trim()) {
        const q = txSearch.trim().toLowerCase()
        const code = String(order.orderNumber || order.order_code || order.id || '').toLowerCase()
        const cashier = String(order.createdBy || '').toLowerCase()
        if (!code.includes(q) && !cashier.includes(q)) return false
      }

      return true
    })
  }, [stats?.orders, txFilter, txSearch])

  return (
    <div
      style={{ height: 'calc(100dvh - 4rem)', maxHeight: 'calc(100dvh - 4rem)' }}
      className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto w-full gap-3 sm:gap-4"
    >
      {/* Cụm Tiêu đề, Xuất Excel & Bộ lọc ngày (ĐỨNG YÊN HOÀN TOÀN Ở TRÊN) */}
      <div className="shrink-0 space-y-2.5 sm:space-y-3">
        {/* Top Header: Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
              Báo Cáo Doanh Thu & Bán Hàng
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFE9E0] text-[#3E2723] text-xs font-bold">
              {stats?.label || 'Đang tải...'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Phân tích số liệu kinh doanh đa chiều theo ngày, tuần, tháng và năm
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={FileSpreadsheet}
            onClick={handleExportExcel}
            disabled={loading || !stats}
            className="text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer shadow-xs"
          >
            Xuất file Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Period Selection Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD5] overflow-x-auto">
            {[
              { id: 'day', label: 'Theo Ngày' },
              { id: 'week', label: 'Theo Tuần' },
              { id: 'month', label: 'Theo Tháng' },
              { id: 'year', label: 'Theo Năm' },
              { id: 'custom', label: 'Tùy chọn' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  periodType === tab.id
                    ? 'bg-[#3E2723] text-white shadow-xs'
                    : 'text-stone-600 hover:text-[#2D1B14] hover:bg-stone-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time pickers with Prev / Next navigators */}
          <div className="flex items-center gap-2 flex-wrap">
            {periodType !== 'custom' && (
              <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('prev')}
                  title="Kỳ trước"
                  className="p-1 rounded-lg hover:bg-white text-stone-700 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (periodType === 'day' || periodType === 'week') setSelectedDate(todayStr)
                    else if (periodType === 'month') setSelectedMonth(currentMonthStr)
                    else if (periodType === 'year') setSelectedYear(currentYearStr)
                  }}
                  className="px-2 text-xs font-bold text-[#C88A35] hover:underline"
                >
                  Hiện tại
                </button>

                <button
                  type="button"
                  onClick={() => handleNavigate('next')}
                  title="Kỳ kế tiếp"
                  className="p-1 rounded-lg hover:bg-white text-stone-700 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Specific inputs */}
            {(periodType === 'day' || periodType === 'week') && (
              <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD5]">
                <Calendar className="w-4 h-4 text-[#C88A35]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs sm:text-sm font-bold text-[#2D1B14] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {periodType === 'month' && (
              <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD5]">
                <Calendar className="w-4 h-4 text-[#C88A35]" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs sm:text-sm font-bold text-[#2D1B14] bg-transparent focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {periodType === 'year' && (
              <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#E8DFD5]">
                <Calendar className="w-4 h-4 text-[#C88A35]" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs sm:text-sm font-bold text-[#2D1B14] bg-transparent focus:outline-none cursor-pointer pr-2"
                >
                  {[-2, -1, 0, 1].map((offset) => {
                    const yr = String(new Date().getFullYear() + offset)
                    return (
                      <option key={yr} value={yr}>
                        Năm {yr}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}

            {periodType === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-2.5 py-1.5 rounded-xl border border-[#E8DFD5] text-xs">
                  <span className="text-stone-500 font-semibold">Từ:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="font-bold text-[#2D1B14] bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-[#FAF7F2] px-2.5 py-1.5 rounded-xl border border-[#E8DFD5] text-xs">
                  <span className="text-stone-500 font-semibold">Đến:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="font-bold text-[#2D1B14] bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-16">
          <LoadingSpinner text="Đang tính toán số liệu doanh thu..." />
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-2xl border border-red-200 text-center space-y-3 shadow-xs">
          <p className="text-sm font-bold text-red-600">Lỗi tải dữ liệu báo cáo: {error}</p>
          <button
            type="button"
            onClick={loadReportData}
            className="px-4 py-2 bg-[#2D1B14] text-white rounded-xl text-xs font-bold hover:bg-[#3E2723] transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : !stats ? (
        <div className="text-center py-24 text-stone-500 text-sm">Không có dữ liệu báo cáo</div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 lg:gap-5 overflow-hidden items-start md:items-stretch">
          {/* Menu dọc (Sidebar vertical tabs) */}
          <div className="w-full md:w-64 lg:w-72 xl:w-80 shrink-0 h-full min-h-0 overflow-y-auto space-y-3 pr-0 md:pr-1">
            <div className="bg-white rounded-2xl border border-[#E8DFD5] p-2 sm:p-2.5 shadow-xs space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400">
                Chế độ xem báo cáo
              </div>

              {[
                {
                  id: 'overview',
                  label: 'Tổng quan doanh thu',
                  desc: 'KPIs & Biểu đồ doanh thu',
                  icon: BarChart3,
                  badge: `${stats.paidOrdersCount || 0} đơn`,
                },
                {
                  id: 'payments',
                  label: 'Phương thức thanh toán',
                  desc: 'Tiền mặt & VietQR',
                  icon: Banknote,
                  badge: `${stats.paidOrdersCount || 0} lượt`,
                },
                {
                  id: 'bestsellers',
                  label: 'Top món bán chạy',
                  desc: 'Sản phẩm bán chạy nhất',
                  icon: Award,
                  badge: `${stats.bestSellers?.length || 0} món`,
                },
                {
                  id: 'performance',
                  label: 'Hiệu suất & Vận hành',
                  desc: 'Tỷ lệ hoàn thành & Đơn hủy',
                  icon: Percent,
                  badge: stats.cancelledOrdersCount > 0 ? `${stats.cancelledOrdersCount} hủy` : null,
                },
                {
                  id: 'transactions',
                  label: 'Danh sách giao dịch',
                  desc: 'Chi tiết lịch sử hóa đơn',
                  icon: Receipt,
                  badge: `${stats.orders?.length || 0} đơn`,
                },
                {
                  id: 'all',
                  label: 'Xem tất cả',
                  desc: 'Báo cáo tổng hợp toàn bộ',
                  icon: Eye,
                },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = viewMode === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewMode(tab.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2D1B14] text-white shadow-xs'
                        : 'text-stone-600 hover:text-[#2D1B14] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#3E2723] text-[#E09F3E]'
                          : 'bg-[#FAF7F2] text-stone-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                          {tab.label}
                        </span>
                        {tab.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                              isActive
                                ? 'bg-[#3E2723] text-[#E09F3E]'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] truncate font-normal mt-0.5 ${
                          isActive ? 'text-stone-300' : 'text-stone-400'
                        }`}
                      >
                        {tab.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Khối tóm tắt nhanh ở dưới menu dọc */}
            <div className="hidden md:block p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs space-y-2.5">
              <div className="font-bold text-[#2D1B14] text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Tóm tắt nhanh</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="space-y-1.5 text-stone-600 text-xs">
                <div className="flex justify-between items-center">
                  <span>Doanh thu thực:</span>
                  <strong className="text-[#C88A35] font-black">{formatCurrency(stats.netRevenue)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Đơn thành công:</span>
                  <strong className="text-[#2D1B14]">{stats.paidOrdersCount} / {stats.totalOrdersCount}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Món phục vụ:</span>
                  <strong className="text-[#2D1B14]">{stats.totalItemsServed} ly/phần</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Vùng nội dung cuộn độc lập */}
          <div
            id="reports-content-scroll"
            tabIndex={0}
            className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto space-y-4 lg:space-y-5 pr-1 sm:pr-2 pb-12 outline-none focus:outline-none"
          >
            {/* 1. KHỐI THẺ KPI CHỦ LỰC (Hiển thị trong 'overview' và 'all') */}
            {(viewMode === 'overview' || viewMode === 'all') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
                {/* Net Revenue */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#3E2723] to-[#24130C] text-white shadow-md space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between opacity-85">
                    <span className="text-xs font-bold uppercase tracking-wider">Doanh thu thực</span>
                    <TrendingUp className="w-4 h-4 text-[#C88A35]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#FDFBF7]">
                    {formatCurrency(stats.netRevenue)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#D4C7B8] pt-1 border-t border-stone-700/50">
                    <span>Thu gộp: {formatCurrency(stats.totalGrossRevenue)}</span>
                    <span className="text-emerald-400 font-bold">{stats.paidOrdersCount} đơn</span>
                  </div>
                </div>

                {/* Average Order Value (AOV) */}
                <div className="p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Giá trị TB / Đơn (AOV)</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#2D1B14]">
                    {formatCurrency(stats.averageOrderValue)}
                  </div>
                  <p className="text-[11px] text-stone-500">Doanh thu trung bình trên mỗi hóa đơn</p>
                </div>

                {/* Total Items Sold */}
                <div className="p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Số phần món phục vụ</span>
                    <ShoppingBag className="w-4 h-4 text-[#C88A35]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#2D1B14]">
                    {stats.totalItemsServed}{' '}
                    <span className="text-sm font-semibold text-stone-500">ly/phần</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Tổng sản phẩm đã chế biến & giao</p>
                </div>

                {/* Refunded & Cancelled */}
                <div className="p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="text-xs font-bold uppercase tracking-wider">Hủy đơn & Hoàn trả</span>
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-600">
                    {formatCurrency(stats.totalRefundAmount)}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {stats.cancelledOrdersCount} đơn hủy / {stats.totalOrdersCount} tổng số đơn
                  </p>
                  <div className="pt-2 border-t border-rose-100 space-y-1 text-[11px]">
                    <div className="flex justify-between text-stone-600">
                      <span>Hủy không hao hụt</span>
                      <strong>{stats.noMaterialLossCancellationCount || 0} đơn</strong>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Hủy có hao hụt</span>
                      <strong>{stats.fullOrderLossCancellationCount || 0} đơn</strong>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>Tiền lỗ do đơn hủy</span>
                      <strong>{formatCurrency(stats.totalCancellationLoss || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BIỂU ĐỒ DOANH THU & PHƯƠNG THỨC THANH TOÁN (Cho 'overview', 'payments', 'all') */}
            {(viewMode === 'overview' || viewMode === 'payments' || viewMode === 'all') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in duration-150">
                {/* Biểu đồ SVG đường timeline */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-[#C88A35]" />
                      <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                        Biểu Đồ Đường Doanh Thu (
                        {periodType === 'day'
                          ? 'Theo giờ'
                          : periodType === 'week'
                          ? '7 ngày tuần'
                          : periodType === 'month'
                          ? 'Ngày trong tháng'
                          : periodType === 'year'
                          ? '12 tháng'
                          : 'Các ngày'}
                        )
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-stone-500">
                      Đỉnh: <strong className="text-[#2D1B14]">{formatCurrency(maxTimelineRevenue)}</strong>
                    </span>
                  </div>

                  {!svgMetrics || stats.timeline.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-12 text-center my-auto">
                      Không có dữ liệu biểu đồ cho kỳ này
                    </p>
                  ) : (
                    <div className="relative pt-2 pb-1 my-auto">
                      <svg
                        viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`}
                        className="w-full h-44 sm:h-52 overflow-visible"
                      >
                        {[1, 0.5, 0].map((ratio, idx) => {
                          const y = svgMetrics.padding.top + (1 - ratio) * svgMetrics.chartH
                          return (
                            <g key={idx}>
                              <line
                                x1={svgMetrics.padding.left}
                                y1={y}
                                x2={svgMetrics.width - svgMetrics.padding.right}
                                y2={y}
                                stroke="#E8DFD5"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                              <text
                                x={svgMetrics.padding.left - 6}
                                y={y + 3}
                                textAnchor="end"
                                className="text-[9px] fill-stone-400 font-mono"
                              >
                                {formatCurrency(Math.round(ratio * svgMetrics.maxVal))}
                              </text>
                            </g>
                          )
                        })}

                        {/* Tiền mặt */}
                        <polyline
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.2"
                          strokeDasharray="5 3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgMetrics.cashPoints}
                        />

                        {/* VietQR */}
                        <polyline
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgMetrics.transferPoints}
                        />

                        {/* Tổng Doanh Thu */}
                        <polyline
                          fill="none"
                          stroke="#C88A35"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgMetrics.totalPoints}
                        />

                        {stats.timeline.map((item, idx) => {
                          const cx = svgMetrics.getX(idx)
                          const cyTotal = svgMetrics.getY(item.revenue)
                          const isHovered = hoveredTimelineIndex === idx

                          return (
                            <g key={idx}>
                              {isHovered && (
                                <line
                                  x1={cx}
                                  y1={svgMetrics.padding.top}
                                  x2={cx}
                                  y2={svgMetrics.height - svgMetrics.padding.bottom}
                                  stroke="#C88A35"
                                  strokeWidth="1"
                                  strokeDasharray="2 2"
                                />
                              )}

                              <circle
                                cx={cx}
                                cy={cyTotal}
                                r={isHovered ? 5.5 : item.revenue > 0 ? 3.5 : 2}
                                fill={isHovered ? '#2D1B14' : '#C88A35'}
                                stroke="#FFFFFF"
                                strokeWidth={isHovered ? 2 : 1.5}
                                className="transition-all duration-200 cursor-pointer"
                              />

                              {(svgMetrics.count <= 14 || idx % Math.ceil(svgMetrics.count / 10) === 0) && (
                                <text
                                  x={cx}
                                  y={svgMetrics.height - 8}
                                  textAnchor="middle"
                                  className="text-[9px] sm:text-[10px] fill-stone-500 font-bold"
                                >
                                  {item.shortLabel || item.label}
                                </text>
                              )}

                              <rect
                                x={cx - 15}
                                y={0}
                                width={30}
                                height={svgMetrics.height}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredTimelineIndex(idx)}
                                onMouseLeave={() => setHoveredTimelineIndex(null)}
                              />
                            </g>
                          )
                        })}
                      </svg>

                      {hoveredTimelineIndex !== null && stats.timeline[hoveredTimelineIndex] && (
                        <div
                          className="absolute z-20 pointer-events-none bg-[#2D1B14] text-white text-[11px] rounded-xl px-3 py-2 shadow-xl border border-stone-700/60 space-y-1 transition-all"
                          style={{
                            left: `${Math.min(
                              70,
                              Math.max(
                                5,
                                (svgMetrics.getX(hoveredTimelineIndex) / svgMetrics.width) * 100 - 15
                              )
                            )}%`,
                            top: '-15px',
                          }}
                        >
                          <div className="font-bold text-stone-200 border-b border-stone-700 pb-1">
                            {stats.timeline[hoveredTimelineIndex].label}
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-[#C88A35] font-semibold">● Tổng thu:</span>
                            <span className="font-black text-white">
                              {formatCurrency(stats.timeline[hoveredTimelineIndex].revenue)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-emerald-400 font-semibold">● Tiền mặt:</span>
                            <span className="font-bold">
                              {formatCurrency(stats.timeline[hoveredTimelineIndex].cashRevenue || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-between">
                            <span className="text-sky-400 font-semibold">● VietQR:</span>
                            <span className="font-bold">
                              {formatCurrency(stats.timeline[hoveredTimelineIndex].transferRevenue || 0)}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 pt-0.5 border-t border-stone-800">
                            {stats.timeline[hoveredTimelineIndex].orders} đơn hàng
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 pt-2.5 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <span className="w-3 h-3 rounded-full bg-[#C88A35] inline-block shadow-xs" />
                      <span>Tổng thu:</span>
                      <span className="text-[#C88A35] font-black">{formatCurrency(stats.totalGrossRevenue)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <span className="w-3 h-1 border-t-2 border-dashed border-[#10B981] inline-block" />
                      <span>Tiền mặt:</span>
                      <span className="text-emerald-600 font-black">{formatCurrency(stats.cashRevenue)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-stone-800">
                      <span className="w-3 h-3 rounded-full bg-[#0284C7] inline-block shadow-xs" />
                      <span>VietQR:</span>
                      <span className="text-sky-600 font-black">{formatCurrency(stats.transferRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-[#C88A35]" />
                      <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                        Phương Thức Thanh Toán
                      </h3>
                    </div>
                    <span className="text-xs text-stone-500 font-medium">
                      {stats.paidOrdersCount} lượt thành công
                    </span>
                  </div>

                  <div className="space-y-4 my-auto">
                    {/* Tiền mặt */}
                    <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                            <Banknote className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-[#2D1B14]">Tiền mặt</div>
                            <div className="text-[11px] text-stone-500">{stats.cashCount} lượt giao dịch</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black text-[#3E2723]">
                            {formatCurrency(stats.cashRevenue)}
                          </div>
                          <div className="text-[10px] font-bold text-stone-500">
                            {stats.totalGrossRevenue > 0
                              ? Math.round((stats.cashRevenue / stats.totalGrossRevenue) * 100)
                              : 0}
                            % tổng thu
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats.totalGrossRevenue > 0
                                ? (stats.cashRevenue / stats.totalGrossRevenue) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* VietQR */}
                    <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs sm:text-sm text-[#2D1B14]">
                              Chuyển khoản VietQR
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {stats.transferCount} lượt giao dịch
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black text-[#3E2723]">
                            {formatCurrency(stats.transferRevenue)}
                          </div>
                          <div className="text-[10px] font-bold text-stone-500">
                            {stats.totalGrossRevenue > 0
                              ? Math.round((stats.transferRevenue / stats.totalGrossRevenue) * 100)
                              : 0}
                            % tổng thu
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats.totalGrossRevenue > 0
                                ? (stats.transferRevenue / stats.totalGrossRevenue) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                    <span>Tổng tiền thu: <strong>{formatCurrency(stats.totalGrossRevenue)}</strong></span>
                    <span>Hoàn trả: <strong className="text-rose-600">{formatCurrency(stats.totalRefundAmount)}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TOP MÓN BÁN CHẠY (Hiển thị riêng khi 'bestsellers' hoặc cùng 'all') */}
            {(viewMode === 'bestsellers' || viewMode === 'all') && (
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C88A35]" />
                    <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                      Top Món Bán Chạy Nhất ({stats.bestSellers?.length || 0} món)
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500 font-medium">Theo số lượng bán</span>
                </div>

                {/* Thẻ tóm tắt thêm khi ở riêng tab bestsellers */}
                {viewMode === 'bestsellers' && stats.bestSellers?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pb-2">
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                      <span className="text-amber-800 text-[11px] font-bold block uppercase tracking-wider">
                        🥇 Bán chạy #1
                      </span>
                      <div className="text-base sm:text-lg font-black text-[#2D1B14] truncate">
                        {stats.bestSellers[0].name}
                      </div>
                      <span className="text-xs text-amber-900 font-semibold">
                        {stats.bestSellers[0].totalQuantity} phần đã bán
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <span className="text-emerald-800 text-[11px] font-bold block uppercase tracking-wider">
                        💰 Doanh số cao nhất
                      </span>
                      <div className="text-base sm:text-lg font-black text-[#2D1B14]">
                        {formatCurrency(stats.bestSellers[0].totalSales)}
                      </div>
                      <span className="text-xs text-emerald-800 font-semibold">
                        {stats.bestSellers[0].percentage}% doanh thu quán
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <span className="text-stone-500 text-[11px] font-bold block uppercase tracking-wider">
                        📦 Tổng sản phẩm phục vụ
                      </span>
                      <div className="text-base sm:text-lg font-black text-[#2D1B14]">
                        {stats.totalItemsServed} ly/phần
                      </div>
                      <span className="text-xs text-stone-500">
                        {stats.totalItemsSold} ly tính tiền
                      </span>
                    </div>
                  </div>
                )}

                {stats.bestSellers.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-10 text-center">
                    Chưa có món nào được bán trong kỳ báo cáo này
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {stats.bestSellers.map((item, index) => {
                      const rankColor =
                        index === 0
                          ? 'bg-amber-500 text-white'
                          : index === 1
                          ? 'bg-stone-400 text-white'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-200 text-stone-700'

                      return (
                        <div
                          key={item.name}
                          className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${rankColor}`}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <div className="font-bold text-xs sm:text-sm text-[#2D1B14]">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-stone-500">
                                  Đã bán: <strong>{item.totalQuantity}</strong> phần
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs sm:text-sm font-black text-[#3E2723]">
                                {formatCurrency(item.totalSales)}
                              </div>
                              <div className="text-[10px] text-[#C88A35] font-bold">
                                {item.percentage}% doanh thu
                              </div>
                            </div>
                          </div>

                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#C88A35] rounded-full"
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. HIỆU SUẤT HOẠT ĐỘNG (Hiển thị riêng khi 'performance' hoặc cùng 'all') */}
            {(viewMode === 'performance' || viewMode === 'all') && (
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-[#C88A35]" />
                    <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                      Hiệu Suất Hoạt Động & Cơ Cấu Đơn Hàng
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500 font-medium">Chỉ số vận hành</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {/* Tỷ lệ hoàn thành */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                    <span className="text-stone-500 text-[11px] font-semibold block">
                      Tỷ lệ hoàn thành
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700">
                      {stats.totalOrdersCount > 0
                        ? Math.round((stats.completedOrdersCount / stats.totalOrdersCount) * 100)
                        : 100}
                      %
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {stats.completedOrdersCount} / {stats.totalOrdersCount} đơn đã giao
                    </span>
                  </div>

                  {/* Tỷ lệ Chuyển khoản */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                    <span className="text-stone-500 text-[11px] font-semibold block">
                      Tỷ lệ Chuyển khoản
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-sky-700">
                      {stats.totalGrossRevenue > 0
                        ? Math.round((stats.transferRevenue / stats.totalGrossRevenue) * 100)
                        : 0}
                      %
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {stats.transferCount} lượt chuyển VietQR
                    </span>
                  </div>

                  {/* Giá TB / Phần món */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                    <span className="text-stone-500 text-[11px] font-semibold block">
                      Giá TB / Phần món
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-[#2D1B14]">
                      {formatCurrency(
                        stats.totalItemsSold > 0
                          ? Math.round(stats.totalGrossRevenue / stats.totalItemsSold)
                          : 0
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      Trên {stats.totalItemsSold} ly/món bán
                    </span>
                  </div>

                  {/* Đơn cao nhất kỳ */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                    <span className="text-stone-500 text-[11px] font-semibold block">
                      Đơn cao nhất kỳ
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-[#C88A35]">
                      {formatCurrency(
                        stats.orders && stats.orders.length > 0
                          ? Math.max(...stats.orders.map((o) => Number(o.totalAmount || 0)))
                          : 0
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      Hóa đơn lớn nhất
                    </span>
                  </div>
                </div>

                {/* Phân tích hao hụt & hủy đơn chi tiết */}
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      Chi tiết hủy đơn & Hao hụt nguyên vật liệu
                    </span>
                    <span>{stats.cancelledOrdersCount} đơn hủy</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-white/90 border border-rose-100">
                      <span className="text-stone-500 text-[11px]">Hủy không hao hụt:</span>
                      <strong className="block text-stone-800 text-sm mt-0.5">{stats.noMaterialLossCancellationCount || 0} đơn</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/90 border border-rose-100">
                      <span className="text-stone-500 text-[11px]">Hủy có hao hụt:</span>
                      <strong className="block text-stone-800 text-sm mt-0.5">{stats.fullOrderLossCancellationCount || 0} đơn</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/90 border border-rose-100">
                      <span className="text-rose-700 text-[11px]">Tiền lỗ do đơn hủy:</span>
                      <strong className="block text-rose-700 text-sm mt-0.5">{formatCurrency(stats.totalCancellationLoss || 0)}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-[#2D1B14] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C88A35] shrink-0" />
                  <span>
                    Báo cáo tự động tổng hợp từ dữ liệu bán hàng thực tế của quán theo thời gian thực.
                  </span>
                </div>
              </div>
            )}

            {/* 5. DANH SÁCH GIAO DỊCH (Hiển thị khi 'transactions' hoặc cùng 'all') */}
            {(viewMode === 'transactions' || viewMode === 'all') && (
              <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden space-y-3 animate-in fade-in duration-150">
                <div className="p-4 sm:p-5 border-b border-[#E8DFD5] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                      Danh Sách Giao Dịch Trong Kỳ ({filteredOrders.length} / {stats.orders?.length || 0} đơn)
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Chi tiết tất cả hóa đơn bán hàng phát sinh trong khoảng thời gian đã chọn
                    </p>
                  </div>

                  {/* Bộ lọc trạng thái & tìm kiếm */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={txSearch}
                        onChange={(e) => setTxSearch(e.target.value)}
                        placeholder="Tìm mã đơn, thu ngân..."
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C88A35] w-40 sm:w-48"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD5] text-xs">
                      {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'paid', label: 'Đã thu' },
                        { id: 'cancelled', label: 'Đã hủy' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTxFilter(f.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            txFilter === f.id
                              ? 'bg-[#2D1B14] text-white shadow-xs'
                              : 'text-stone-600 hover:text-[#2D1B14]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {(!stats.orders || stats.orders.length === 0) ? (
                  <p className="text-xs text-stone-400 italic py-12 text-center">
                    Không phát sinh đơn hàng nào trong khoảng thời gian này
                  </p>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-12 text-center">
                    Không có đơn hàng nào khớp với điều kiện tìm kiếm
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#FAF7F2] text-stone-600 font-bold border-b border-[#E8DFD5]">
                          <th className="py-3 px-4">Mã đơn</th>
                          <th className="py-3 px-4">Thời gian</th>
                          <th className="py-3 px-4">Thu ngân</th>
                          <th className="py-3 px-4">Phương thức</th>
                          <th className="py-3 px-4">Trạng thái</th>
                          <th className="py-3 px-4 text-right">Tổng tiền</th>
                          <th className="py-3 px-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredOrders.map((order) => {
                          const isPaid =
                            order.paymentStatus === 'DA_THANH_TOAN' || order.payment_status === 'PAID'
                          const isCancelled =
                            order.fulfillmentStatus === 'CANCELLED' ||
                            order.status === 'CANCELLED' ||
                            order.paymentStatus === 'DA_HOAN_TIEN'

                          return (
                            <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition">
                              <td className="py-3 px-4 font-extrabold text-[#2D1B14]">
                                {order.orderNumber || order.order_code || order.id}
                              </td>
                              <td className="py-3 px-4 text-stone-600">
                                {formatDateTime(order.createdAt || order.created_at)}
                              </td>
                              <td className="py-3 px-4 text-stone-700">
                                {order.createdBy || 'Chủ quán'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-semibold">
                                  {order.paymentMethod === 'TIEN_MAT' || order.payment_method === 'CASH' ? (
                                    <>
                                      <Banknote className="w-3 h-3 text-emerald-600" />
                                      <span>Tiền mặt</span>
                                    </>
                                  ) : (
                                    <>
                                      <QrCode className="w-3 h-3 text-sky-600" />
                                      <span>VietQR</span>
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                    isPaid
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isCancelled
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isPaid ? 'Đã thanh toán' : isCancelled ? 'Đã hủy / Hoàn tiền' : 'Chờ xử lý'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-[#2D1B14]">
                                {formatCurrency(order.totalAmount ?? order.total_amount ?? 0)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForReceipt(order)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-[#3E2723] hover:text-white text-stone-700 text-xs font-bold transition cursor-pointer"
                                  title="Xem hóa đơn & in lại"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem</span>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal for Viewing/Reprinting Selected Order */}
      {selectedOrderForReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedOrderForReceipt)}
          onClose={() => setSelectedOrderForReceipt(null)}
          order={selectedOrderForReceipt}
          isReprint={true}
        />
      )}
    </div>
  )
}
