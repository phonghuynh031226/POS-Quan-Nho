import { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  RotateCcw,
  Banknote,
  QrCode,
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  ShoppingBag,
  Clock,
  Eye,
  BarChart3,
  LineChart,
  Percent,
} from 'lucide-react'
import { reportApi } from '../../api/reportApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Button from '../../components/common/Button'
import ReceiptModal from '../../components/print/ReceiptModal'
import { useToast } from '../../context/ToastContext'

export default function ReportsPage() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const currentYearStr = useMemo(() => String(new Date().getFullYear()), [])

  // Period mode: 'day' | 'week' | 'month' | 'year' | 'custom'
  const [periodType, setPeriodType] = useState('day')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr)
  const [selectedYear, setSelectedYear] = useState(currentYearStr)
  const [fromDate, setFromDate] = useState(todayStr)
  const [toDate, setToDate] = useState(todayStr)

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
      const d = new Date(selectedDate)
      d.setDate(d.getDate() + daysToAdd)
      setSelectedDate(d.toISOString().slice(0, 10))
    } else if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number)
      const newD = new Date(y, m - 1 + delta, 1)
      const newMonthStr = `${newD.getFullYear()}-${String(newD.getMonth() + 1).padStart(2, '0')}`
      setSelectedMonth(newMonthStr)
    } else if (periodType === 'year') {
      setSelectedYear((prev) => String(Number(prev) + delta))
    }
  }

  // Export report summary and orders to CSV
  const handleExportCSV = () => {
    if (!stats) return
    try {
      const headers = ['Mã đơn', 'Thời gian', 'Thu ngân', 'Phương thức', 'Trạng thái', 'Tổng tiền (VNĐ)']
      const rows = (stats.orders || []).map((o) => [
        `"${o.orderNumber || o.order_code || o.id}"`,
        `"${formatDateTime(o.createdAt || o.created_at)}"`,
        `"${o.createdBy || 'Chủ quán'}"`,
        `"${o.paymentMethod === 'TIEN_MAT' || o.payment_method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản VietQR'}"`,
        `"${o.paymentStatus === 'DA_THANH_TOAN' || o.payment_status === 'PAID' ? 'Đã thanh toán' : o.paymentStatus}"`,
        Number(o.totalAmount ?? o.total_amount ?? 0),
      ])

      const summaryLines = [
        ['BÁO CÁO DOANH THU QUÁN NHỎ'],
        [`Kỳ báo cáo: ${stats.label}`],
        [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
        [],
        ['CHỈ SỐ CHÍNH'],
        ['Doanh thu thực:', stats.netRevenue],
        ['Tổng doanh thu gộp:', stats.totalGrossRevenue],
        ['Tiền hoàn hủy đơn:', stats.totalRefundAmount],
        ['Tổng số đơn:', stats.totalOrdersCount],
        ['Đơn thành công:', stats.paidOrdersCount],
        ['Giá trị trung bình đơn (AOV):', stats.averageOrderValue],
        ['Tổng số phần món:', stats.totalItemsSold],
        ['Doanh thu Tiền mặt:', stats.cashRevenue],
        ['Doanh thu Chuyển khoản:', stats.transferRevenue],
        [],
        ['DANH SÁCH GIAO DỊCH CHI TIẾT'],
        headers,
        ...rows,
      ]

      const csvContent =
        '\uFEFF' + summaryLines.map((e) => (Array.isArray(e) ? e.join(',') : e)).join('\r\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `BaoCao_QuanNho_${periodType}_${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Đã xuất báo cáo CSV thành công!')
    } catch (err) {
      toast.error('Lỗi xuất file: ' + err.message)
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

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header: Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
            icon={Download}
            onClick={handleExportCSV}
            disabled={loading || !stats}
            className="text-xs font-bold bg-white"
          >
            Xuất file CSV
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

      {loading ? (
        <div className="py-24 flex justify-center">
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
        <div className="space-y-6">
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {stats.totalItemsSold}{' '}
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
            </div>
          </div>

          {/* ROW 1: 2-COLUMN BALANCED LAYOUT (Left: Timeline Chart | Right: Payment Distribution) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: Multi-Line SVG Chart */}
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

              {/* Multi-Line SVG Chart with Interactive Points */}
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
                    {/* Horizontal Grid Lines */}
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

                    {/* Line 2: Doanh thu Tiền mặt (Màu Xanh lá - Emerald) */}
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.2"
                      strokeDasharray="5 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgMetrics.cashPoints}
                    />

                    {/* Line 3: Doanh thu Chuyển khoản VietQR (Màu Xanh lam - Sky) */}
                    <polyline
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgMetrics.transferPoints}
                    />

                    {/* Line 1: Tổng Doanh Thu (Màu Cam hổ phách - Amber/Brown) */}
                    <polyline
                      fill="none"
                      stroke="#C88A35"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgMetrics.totalPoints}
                    />

                    {/* Interactive Data Points & Vertical Hover Line */}
                    {stats.timeline.map((item, idx) => {
                      const cx = svgMetrics.getX(idx)
                      const cyTotal = svgMetrics.getY(item.revenue)
                      const isHovered = hoveredTimelineIndex === idx

                      return (
                        <g key={idx}>
                          {/* Vertical guide line on hover */}
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

                          {/* Point on Total Revenue line */}
                          <circle
                            cx={cx}
                            cy={cyTotal}
                            r={isHovered ? 5.5 : item.revenue > 0 ? 3.5 : 2}
                            fill={isHovered ? '#2D1B14' : '#C88A35'}
                            stroke="#FFFFFF"
                            strokeWidth={isHovered ? 2 : 1.5}
                            className="transition-all duration-200 cursor-pointer"
                          />

                          {/* X-axis label */}
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

                          {/* Invisible hover hotspot area */}
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

                  {/* Dynamic Floating Tooltip */}
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

              {/* Color Legend below chart as requested */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 pt-2.5 border-t border-stone-100 text-xs">
                {/* Legend: Total Revenue */}
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <span className="w-3 h-3 rounded-full bg-[#C88A35] inline-block shadow-xs" />
                  <span>Tổng thu:</span>
                  <span className="text-[#C88A35] font-black">{formatCurrency(stats.totalGrossRevenue)}</span>
                </div>

                {/* Legend: Cash */}
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <span className="w-3 h-1 border-t-2 border-dashed border-[#10B981] inline-block" />
                  <span>Tiền mặt:</span>
                  <span className="text-emerald-600 font-black">{formatCurrency(stats.cashRevenue)}</span>
                </div>

                {/* Legend: Transfer */}
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <span className="w-3 h-3 rounded-full bg-[#0284C7] inline-block shadow-xs" />
                  <span>VietQR:</span>
                  <span className="text-sky-600 font-black">{formatCurrency(stats.transferRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method Distribution */}
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
                {/* Cash */}
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

                  {/* Percentage Bar */}
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

                {/* Transfer */}
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

                  {/* Percentage Bar */}
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

          {/* ROW 2: 2-COLUMN BALANCED LAYOUT (Left: Top Best Sellers | Right: Operational Performance Summary) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Top Best Sellers */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#C88A35]" />
                  <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                    Top Món Bán Chạy Nhất
                  </h3>
                </div>
                <span className="text-xs text-stone-500 font-medium">Theo số lượng bán</span>
              </div>

              {stats.bestSellers.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-10 text-center">
                  Chưa có món nào được bán trong kỳ báo cáo này
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
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
                        className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1.5"
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

                        {/* Proportion bar */}
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

            {/* Right: Operational Performance Summary Cards */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-[#C88A35]" />
                  <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                    Hiệu Suất Hoạt Động & Cơ Cấu
                  </h3>
                </div>
                <span className="text-xs text-stone-500 font-medium">Chỉ số vận hành</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 my-auto">
                {/* Success Rate */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-1">
                  <span className="text-stone-500 text-[11px] font-semibold block">
                    Tỷ lệ hoàn thành
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700">
                    {stats.totalOrdersCount > 0
                      ? Math.round((stats.paidOrdersCount / stats.totalOrdersCount) * 100)
                      : 100}
                    %
                  </div>
                  <span className="text-[10px] text-stone-400">
                    {stats.paidOrdersCount} / {stats.totalOrdersCount} đơn thành công
                  </span>
                </div>

                {/* Transfer Ratio */}
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

                {/* Average Price Per Item */}
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
                    Trên {stats.totalItemsSold} ly/món phục vụ
                  </span>
                </div>

                {/* Max Order in Period */}
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
                    Hóa đơn có giá trị lớn nhất
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-[#2D1B14] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C88A35] shrink-0" />
                <span>
                  Báo cáo tự động tổng hợp từ dữ liệu bán hàng thực tế của quán theo thời gian thực.
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Table: All Orders within Period */}
          <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden space-y-3">
            <div className="p-5 border-b border-[#E8DFD5] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                  Danh Sách Giao Dịch Trong Kỳ ({stats.orders?.length || 0} đơn)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Chi tiết tất cả hóa đơn bán hàng phát sinh trong khoảng thời gian đã chọn
                </p>
              </div>
            </div>

            {(!stats.orders || stats.orders.length === 0) ? (
              <p className="text-xs text-stone-400 italic py-12 text-center">
                Không phát sinh đơn hàng nào trong khoảng thời gian này
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
                    {stats.orders.map((order) => {
                      const isPaid =
                        order.paymentStatus === 'DA_THANH_TOAN' || order.payment_status === 'PAID'
                      const isCancelled =
                        order.fulfillmentStatus === 'DA_HUY' ||
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
