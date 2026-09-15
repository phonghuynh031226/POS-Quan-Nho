import { useState, useEffect } from 'react'
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  RotateCcw,
  Banknote,
  QrCode,
  Award,
} from 'lucide-react'
import { reportApi } from '../../api/reportApi'
import { formatCurrency } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useToast } from '../../context/ToastContext'

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const toast = useToast()

  const loadStats = async (date) => {
    try {
      setLoading(true)
      const data = await reportApi.getDailyStats(date)
      setStats(data)
    } catch (err) {
      toast.error('Lỗi tải báo cáo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats(selectedDate)
  }, [selectedDate])

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Title & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
            Báo Cáo Doanh Thu Quán
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Dữ liệu tổng hợp trực tiếp từ lịch sử hóa đơn bán hàng
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#E8DFD5] shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-[#C88A35] ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs sm:text-sm font-bold text-[#2D1B14] bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {loading || !stats ? (
        <LoadingSpinner text="Đang tính toán số liệu doanh thu..." />
      ) : (
        <div className="space-y-6">
          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Revenue */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#3E2723] to-[#2D1B14] text-white shadow-md space-y-2">
              <div className="flex items-center justify-between opacity-80">
                <span className="text-xs font-bold uppercase tracking-wider">Doanh thu thực</span>
                <TrendingUp className="w-4 h-4 text-[#C88A35]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#FDFBF7]">
                {formatCurrency(stats.netRevenue)}
              </div>
              <p className="text-[11px] text-[#D4C7B8]">Đã trừ tiền hoàn trả</p>
            </div>

            {/* Gross Revenue */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Tổng tiền thu</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2D1B14]">
                {formatCurrency(stats.totalGrossRevenue)}
              </div>
              <p className="text-[11px] text-stone-500">{stats.paidOrdersCount} đơn thanh toán</p>
            </div>

            {/* Refunded Amount */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Tiền hoàn hủy đơn</span>
                <RotateCcw className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600">
                {formatCurrency(stats.totalRefundAmount)}
              </div>
              <p className="text-[11px] text-stone-500">{stats.cancelledOrdersCount} đơn hủy</p>
            </div>

            {/* Total Orders */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-xs font-bold uppercase tracking-wider">Tổng số đơn</span>
                <Receipt className="w-4 h-4 text-[#C88A35]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#2D1B14]">
                {stats.totalOrdersCount}
              </div>
              <p className="text-[11px] text-stone-500">Tất cả giao dịch phát sinh</p>
            </div>
          </div>

          {/* Breakdown & Best Sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-5">
              <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                Phân bổ Phương thức Thanh toán
              </h3>

              <div className="space-y-4">
                {/* Cash */}
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#2D1B14]">Tiền mặt</div>
                        <div className="text-[11px] text-stone-500">{stats.cashCount} lượt</div>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base font-black text-[#3E2723]">
                      {formatCurrency(stats.cashRevenue)}
                    </div>
                  </div>

                  {/* Percentage Bar */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
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
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#2D1B14]">
                          Chuyển khoản VietQR
                        </div>
                        <div className="text-[11px] text-stone-500">{stats.transferCount} lượt</div>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base font-black text-[#3E2723]">
                      {formatCurrency(stats.transferRevenue)}
                    </div>
                  </div>

                  {/* Percentage Bar */}
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
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
            </div>

            {/* Top Best Sellers */}
            <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C88A35]" />
                <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                  Top 5 Món Bán Chạy Trong Ngày
                </h3>
              </div>

              {stats.bestSellers.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-6 text-center">
                  Chưa có món nào được bán trong ngày này
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.bestSellers.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#3E2723] text-white flex items-center justify-center text-xs font-black">
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

                      <div className="text-xs sm:text-sm font-black text-[#C88A35]">
                        {formatCurrency(item.totalSales)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
