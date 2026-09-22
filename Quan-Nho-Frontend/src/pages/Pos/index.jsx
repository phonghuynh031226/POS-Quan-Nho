import { useState, useEffect } from 'react'
import { Search, Plus, Ban, Utensils, Coffee } from 'lucide-react'
import { menuApi } from '../../api/menuApi'
import { formatCurrency } from '../../utils/formatters'
import { DISPLAY_STATES, sendDisplayState } from '../../utils/customerDisplaySync'
import CartSidebar from '../../components/pos/CartSidebar'
import ItemCustomizeModal from '../../components/pos/ItemCustomizeModal'
import PaymentModal from '../../components/pos/PaymentModal'
import ReceiptModal from '../../components/print/ReceiptModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { useToast } from '../../context/ToastContext'

export default function PosPage() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Cart state
  const [cart, setCart] = useState([])

  // Modals state
  const [customizingItem, setCustomizingItem] = useState(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [printedOrder, setPrintedOrder] = useState(null)
  const [printType, setPrintType] = useState('both') // 'customer' | 'kitchen' | 'both'

  const toast = useToast()

  // Realtime sync to Customer Facing Display
  useEffect(() => {
    if (isPaymentOpen) return // PaymentModal manages PAYMENT & SUCCESS state

    if (cart.length === 0) {
      sendDisplayState({ type: DISPLAY_STATES.IDLE })
    } else {
      const totalAmount = cart.reduce((sum, i) => sum + i.lineTotal, 0)
      const totalQuantity = cart.reduce((sum, i) => sum + (i.quantity || 1), 0)
      sendDisplayState({
        type: DISPLAY_STATES.ORDERING,
        items: cart,
        totalAmount,
        totalQuantity,
      })
    }
  }, [cart, isPaymentOpen])

  // Fetch menu and categories
  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, catData] = await Promise.all([
        menuApi.getMenu(),
        menuApi.getCategories(),
      ])
      setMenu(menuData)
      setCategories(catData)
    } catch (err) {
      toast.error('Lỗi tải thực đơn: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter items
  const filteredItems = menu.filter((item) => {
    const matchCategory =
      selectedCategory === 'ALL' ||
      item.category === selectedCategory ||
      item.category_id === selectedCategory ||
      String(item.category_id) === String(selectedCategory)
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    return matchCategory && matchSearch
  })

  // Handle adding customized item to cart
  const handleAddToCart = (customizedItem) => {
    // Generate an identity key based on itemId + selectedOptions snapshot + notes
    const optionsKey =
      (customizedItem.selectedOptions || [])
        .map((o) => `${o.optionGroupId}:${o.optionId}`)
        .sort()
        .join('|') + '::' + (customizedItem.notes || '')
    const cartLineId = `${customizedItem.menuItemId}__${optionsKey}`

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartLineId === cartLineId)
      if (existingIndex !== -1) {
        // Same item with exact same options and notes: increase quantity
        const updated = [...prev]
        const current = updated[existingIndex]
        const newQty = current.quantity + customizedItem.quantity
        const unitTotal = current.unitPrice + current.surcharge
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          lineTotal: unitTotal * newQty,
        }
        return updated
      } else {
        // Different options: create separate line!
        return [
          ...prev,
          {
            ...customizedItem,
            cartLineId,
          },
        ]
      }
    })

    toast.success(`Đã thêm "${customizedItem.name}" vào giỏ!`, 1800)
  }

  // Cart quantity controls
  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(index)
      return
    }
    setCart((prev) => {
      const updated = [...prev]
      const current = updated[index]
      const unitTotal = current.unitPrice + current.surcharge
      updated[index] = {
        ...current,
        quantity: newQuantity,
        lineTotal: unitTotal * newQuantity,
      }
      return updated
    })
  }

  const handleRemoveItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const handleClearCart = () => {
    setCart([])
    toast.info('Đã xóa toàn bộ giỏ hàng')
  }

  const handlePaymentSuccess = (createdOrder) => {
    setCart([])
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-none lg:flex-row lg:h-[calc(100dvh-4rem)] lg:min-h-0 overflow-hidden">
      {/* Left / Center Section: Menu selection */}
      <div className="flex-1 flex flex-col min-w-0 lg:min-h-0 bg-[#F8F5F0] overflow-y-auto">
        {/* Top bar: Category tabs & Search input */}
        <div className="p-4 sm:p-6 border-b border-[#E8DFD5] bg-[#FDFBF7] sticky top-0 z-10 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm món ăn, thức uống..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#D4C7B8] rounded-xl text-[#2D1B14] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Đã gỡ bỏ nút Màn hình khách: window.open('/display', 'CustomerDisplayWindow') */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-xs text-stone-500 hidden sm:block font-medium whitespace-nowrap">
                Hiển thị: <strong>{filteredItems.length}</strong> món
              </div>
            </div>
          </div>

          {/* Category Filter Pills & Item Counter */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              {[{ id: 'ALL', name: 'Tất cả món' }, ...categories].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#3E2723] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-[#D4C7B8] hover:bg-[#F5EFEB]'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Grid Content */}
        <div className="p-4 sm:p-6 flex-1">
          {loading ? (
            <LoadingSpinner text="Đang chuẩn bị thực đơn quán..." />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="Không tìm thấy món phù hợp"
              description="Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const currentCategory = categories.find((c) => c.id === item.category)
                const isFood =
                  item.category === 'SNACKS' ||
                  currentCategory?.type === 'FOOD' ||
                  item.optionsConfig?.spiceLevels?.length

                return (
                  <div
                    key={item.id}
                    onClick={() => item.isAvailable && setCustomizingItem(item)}
                    className={`group relative flex flex-col bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs transition-all duration-200 select-none ${
                      item.isAvailable
                        ? 'hover:border-[#C88A35] hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                        : 'opacity-60 cursor-not-allowed bg-stone-50'
                    }`}
                  >
                    {/* Item Image with Out-of-Stock Overlay */}
                    <div className="relative aspect-4/3 overflow-hidden bg-[#F5EFEB] flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`w-full h-full object-cover transition duration-300 ${
                            item.isAvailable ? 'group-hover:scale-105' : 'grayscale'
                          }`}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 select-none p-2 text-center">
                          {isFood ? (
                            <Utensils className="w-8 h-8 text-stone-300 mb-1" />
                          ) : (
                            <Coffee className="w-8 h-8 text-stone-300 mb-1" />
                          )}
                          <span className="text-[11px] font-medium text-stone-400">Chưa có ảnh</span>
                        </div>
                      )}

                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center p-2">
                          <span className="px-3 py-1 bg-rose-600 text-white text-[11px] font-extrabold uppercase rounded-full shadow-sm flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5" />
                            Hết món
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-bold text-xs sm:text-sm text-[#2D1B14] line-clamp-2 leading-snug group-hover:text-[#C88A35] transition">
                            {item.name}
                          </h3>
                        </div>
                        {item.hasOptions && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-stone-500 font-medium bg-[#F4EFEA] px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                              {isFood ? (
                                <Utensils className="w-2.5 h-2.5 text-amber-600" />
                              ) : (
                                <Coffee className="w-2.5 h-2.5 text-[#C88A35]" />
                              )}
                              <span>{isFood ? 'Món ăn' : 'Tùy chọn'}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#F1EBE3] flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black text-[#3E2723]">
                          {formatCurrency(item.price)}
                        </span>

                        {item.isAvailable && (
                          <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#D4C7B8] text-[#3E2723] group-hover:bg-[#C88A35] group-hover:text-white group-hover:border-[#C88A35] flex items-center justify-center transition">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Cart Sidebar */}
      <CartSidebar
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOpenPayment={() => setIsPaymentOpen(true)}
      />

      {/* Item Customization Modal */}
      <ItemCustomizeModal
        isOpen={Boolean(customizingItem)}
        onClose={() => setCustomizingItem(null)}
        item={customizingItem}
        onAddToCart={handleAddToCart}
      />

      {/* Payment Confirmation Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cart={cart}
        onPaymentSuccess={handlePaymentSuccess}
        onPrintOrder={(order, type = 'both') => {
          setIsPaymentOpen(false)
          setPrintedOrder(order)
          setPrintType(type)
        }}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={Boolean(printedOrder)}
        onClose={() => setPrintedOrder(null)}
        order={printedOrder}
        initialPrintType={printType}
        onPrinted={() => {}}
      />
    </div>
  )
}
