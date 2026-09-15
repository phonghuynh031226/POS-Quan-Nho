import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Eye,
  Printer,
  XCircle,
  AlertTriangle,
  RotateCw,
  ExternalLink,
} from 'lucide-react'
import { orderApi } from '../../api/orderApi'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from '../../constants'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ReceiptModal from '../../components/print/ReceiptModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState('')

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
      const data = await orderApi.getOrders({
        search: searchQuery,
        fulfillmentStatus: statusFilter,
        date: selectedDate,
      })
      setOrders(data)
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

  // Cancel order & record refund
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Vui lòng nhập lý do hủy đơn hàng!')
      return
    }

    setIsCancelling(true)
    try {
      await orderApi.cancelOrder(
        cancellingOrder.id,
        cancelReason,
        cancellingOrder.totalAmount
      )
      toast.success(`Đã hủy đơn ${cancellingOrder.orderNumber} và ghi nhận hoàn tiền!`)
      setCancellingOrder(null)
      setCancelReason('')
      loadOrders()
    } catch (err) {
      toast.error('Lỗi hủy đơn: ' + err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
            Lịch Sử Đơn Hàng
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Tra cứu đơn hàng, xem chi tiết, in lại phiếu nhận món và quản lý hủy đơn
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="self-start sm:self-auto p-2.5 rounded-xl bg-white border border-[#D4C7B8] hover:bg-[#F5EFEB] text-stone-700 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo số đơn (QN-101), tên món..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-[#D4C7B8] rounded-xl text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-[#D4C7B8] bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CHO_LAM">Chờ làm</option>
            <option value="DANG_LAM">Đang làm</option>
            <option value="SAN_SANG">Sẵn sàng nhận</option>
            <option value="DA_GIAO">Đã giao</option>
            <option value="DA_HUY">Đã hủy</option>
          </select>

          {/* Date filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-xl border border-[#D4C7B8] bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
          />

          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className="text-xs text-stone-500 hover:text-stone-800 underline"
            >
              Hủy lọc ngày
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner text="Đang tải danh sách lịch sử đơn..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Không tìm thấy đơn hàng"
          description="Không có đơn nào khớp với điều kiện tìm kiếm hoặc bộ lọc"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
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

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF7F2] transition">
                      <td className="p-4 font-black text-[#2D1B14] text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {order.isReprinted && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-300 font-bold uppercase">
                              In lại x{order.reprintCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 font-normal">
                          {order.createdBy}
                        </div>
                      </td>

                      <td className="p-4 text-stone-600 text-xs">
                        {formatDateTime(order.createdAt)}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-stone-800 line-clamp-1">
                          {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                        <div className="text-[11px] text-stone-400 font-medium">
                          {itemCount} món
                        </div>
                      </td>

                      <td className="p-4 font-black text-[#3E2723]">
                        <div>{formatCurrency(order.totalAmount)}</div>
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

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setViewingOrder(order)}
                            title="Xem chi tiết"
                            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Reprint receipt */}
                          <button
                            type="button"
                            onClick={() => setReprintingOrder(order)}
                            title="In lại phiếu nhận món"
                            className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel order (Admin/Owner only & not yet cancelled) */}
                          {(currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') && order.fulfillmentStatus !== 'DA_HUY' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrder(order)
                                setCancelReason('')
                              }}
                              title="Hủy đơn & hoàn tiền"
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
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

      {/* View Details Modal */}
      <Modal
        isOpen={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        title={`Chi tiết đơn hàng ${viewingOrder?.orderNumber}`}
        subtitle={`Tạo lúc ${formatDateTime(viewingOrder?.createdAt)} • Bởi ${viewingOrder?.createdBy}`}
        maxWidth="max-w-md"
      >
        {viewingOrder && (
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Statuses */}
            <div className="flex justify-between items-center p-3 bg-[#F5EFEB] rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Phục vụ
                </span>
                <Badge statusKey={viewingOrder.fulfillmentStatus} type="fulfillment" size="sm" />
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Thanh toán
                </span>
                <Badge statusKey={viewingOrder.paymentStatus} type="payment" size="sm" />
              </div>
            </div>

            {/* Cancel reason notice if cancelled */}
            {viewingOrder.fulfillmentStatus === 'DA_HUY' && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 space-y-1">
                <div className="font-bold text-xs">Đơn đã bị hủy</div>
                <p className="text-xs">Lý do: {viewingOrder.refundReason}</p>
                <p className="text-xs font-semibold">
                  Số tiền hoàn: {formatCurrency(viewingOrder.refundAmount)}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2 border-t border-b border-[#E8DFD5] py-3">
              <span className="font-bold text-[#3E2723] block text-xs uppercase tracking-wider">
                Danh sách món:
              </span>
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
                        .map(([_, v]) => (Array.isArray(v) ? v.map((t) => t.name).join(', ') : v))
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

            {/* Total */}
            <div className="flex justify-between items-baseline text-sm font-black pt-1">
              <span>TỔNG TIỀN:</span>
              <span className="text-base text-[#3E2723]">
                {formatCurrency(viewingOrder.totalAmount)}
              </span>
            </div>

            {/* Public track link */}
            <div className="pt-2">
              <a
                href={`${window.location.origin}/track/${viewingOrder.token}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition"
              >
                <span>Xem trang QR khách theo dõi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
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

      {/* Thermal Receipt Reprint Modal */}
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
