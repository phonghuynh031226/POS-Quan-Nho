import { ShoppingBag, Trash2, Plus, Minus, Receipt } from 'lucide-react'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/formatters'

export default function CartSidebar({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenPayment,
}) {
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = cart.reduce((sum, item) => sum + item.lineTotal, 0)

  return (
    <aside className="w-full lg:w-96 flex flex-col bg-white border-l border-[#E8DFD5] shadow-xs h-full lg:h-full lg:min-h-0 lg:overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 border-b border-[#E8DFD5] flex items-center justify-between bg-[#FDFBF7]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EFE9E0] text-[#3E2723] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2D1B14]">Đơn Hàng Hiện Tại</h2>
            <p className="text-[11px] text-stone-500">{totalQuantity} món trong giỏ</p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            title="Xóa toàn bộ giỏ"
            className="text-xs text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa hết</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F5F0] flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7 text-stone-300" />
            </div>
            <p className="text-sm font-semibold text-stone-600 mb-1">Giỏ hàng đang trống</p>
            <p className="text-xs text-stone-400 max-w-[200px]">
              Chạm vào món ăn ở danh mục bên trái để thêm vào đơn hàng
            </p>
          </div>
        ) : (
          cart.map((item, index) => {
            let optList = ''
            if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
              optList = item.selectedOptions
                .map(
                  (o) =>
                    `${o.optionName}${
                      o.extraPrice > 0 ? ` (+${formatCurrency(o.extraPrice)})` : ''
                    }`
                )
                .join(' • ')
            } else if (item.options) {
              optList = Object.entries(item.options)
                .filter(([_, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
                .map(([_, v]) => (Array.isArray(v) ? v.map((t) => t.name).join(', ') : v))
                .join(' • ')
            }

            return (
              <div
                key={item.cartLineId || index}
                className="p-3 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] space-y-2 relative group hover:border-[#C88A35] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 pr-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#2D1B14] leading-snug">
                      {item.name}
                    </h4>

                    {optList && (
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-tight italic">
                        {optList}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-[#B45309] font-semibold mt-0.5">
                        Ghi chú: {item.notes}
                      </p>
                    )}

                    <div className="text-[11px] text-stone-500 mt-1">
                      Đơn giá: {formatCurrency(item.unitPrice)}
                      {item.surcharge > 0 && ` + ${formatCurrency(item.surcharge)}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-extrabold text-[#3E2723]">
                      {formatCurrency(item.lineTotal)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="text-stone-400 hover:text-rose-600 p-1 mt-1 transition cursor-pointer"
                      title="Xóa món này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quantity adjustments */}
                <div className="flex items-center justify-between pt-1 border-t border-[#E8DFD5]/70">
                  <span className="text-[11px] text-stone-500 font-medium">Số lượng:</span>
                  <div className="flex items-center border border-[#D4C7B8] rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      className="p-1.5 text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold min-w-[24px] text-center text-[#2D1B14]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="p-1.5 text-stone-600 hover:bg-stone-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Cart Summary & Checkout button */}
      <div className="p-4 border-t border-[#E8DFD5] bg-[#FDFBF7] space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Tổng cộng:
          </span>
          <span className="text-xl font-black text-[#2D1B14]">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={cart.length === 0}
          onClick={onOpenPayment}
          icon={Receipt}
          className="w-full text-base font-extrabold shadow-md bg-[#2D1B14] hover:bg-[#3E2723]"
        >
          <span>Thanh toán đơn ({totalQuantity})</span>
        </Button>
      </div>
    </aside>
  )
}
