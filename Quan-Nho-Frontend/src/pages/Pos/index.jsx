import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Ban, Utensils, Coffee, Menu } from 'lucide-react'
import { menuApi } from '../../api/menuApi'
import { formatCurrency } from '../../utils/formatters'
import { DISPLAY_STATES, sendDisplayState } from '../../utils/customerDisplaySync'
import CartSidebar from '../../components/pos/CartSidebar'
import ItemCustomizeModal from '../../components/pos/ItemCustomizeModal'
import PaymentModal from '../../components/pos/PaymentModal'
import ReceiptModal from '../../components/print/ReceiptModal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import ProductImage from '../../components/common/ProductImage'
import { useToast } from '../../context/ToastContext'

export default function PosPage() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const categoryMenuRef = useRef(null)

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

  useEffect(() => {
    const closeCategoryMenu = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (
        event.type === 'pointerdown' &&
        categoryMenuRef.current?.contains(event.target)
      ) {
        return
      }
      setIsCategoryMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeCategoryMenu)
    document.addEventListener('keydown', closeCategoryMenu)
    return () => {
      document.removeEventListener('pointerdown', closeCategoryMenu)
      document.removeEventListener('keydown', closeCategoryMenu)
    }
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
          <div className="flex items-center justify-between gap-3">
            <div data-search-category-row className="flex min-w-0 flex-1 items-center gap-2">
              {/* Search Input */}
              <div className="relative min-w-0 flex-1 max-w-md">
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

              {/* Floating category chooser */}
              <div ref={categoryMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  aria-label="Chọn danh mục"
                  aria-expanded={isCategoryMenuOpen}
                  aria-controls="pos-category-overlay"
                  onClick={() => setIsCategoryMenuOpen((open) => !open)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-all duration-200 cursor-pointer ${
                    isCategoryMenuOpen
                      ? 'border-[#3E2723] bg-[#3E2723] text-white'
                      : 'border-[#D4C7B8] bg-white text-[#3E2723] hover:bg-[#F5EFEB]'
                  }`}
                >
                  <Menu
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isCategoryMenuOpen ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                  <span className="hidden xs:inline sm:inline">Danh mục</span>
                </button>

                <div
                  id="pos-category-overlay"
                  data-category-overlay
                  aria-hidden={!isCategoryMenuOpen}
                  className={`absolute right-0 top-full z-30 mt-2 w-[min(32rem,calc(100vw-3rem))] origin-top-right rounded-2xl border border-[#D4C7B8] bg-white p-3 shadow-2xl transition-all duration-200 ease-out ${
                    isCategoryMenuOpen
                      ? 'pointer-events-auto opacity-100 scale-100 translate-y-0'
                      : 'pointer-events-none opacity-0 scale-95 -translate-y-2'
                  }`}
                >
                  <div className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-[#7A4A32]">
                    Chọn danh mục
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[{ id: 'ALL', name: 'Tất cả món' }, ...categories].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        tabIndex={isCategoryMenuOpen ? 0 : -1}
                        onClick={() => {
                          setSelectedCategory(cat.id)
                          setIsCategoryMenuOpen(false)
                        }}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'border-[#3E2723] bg-[#3E2723] text-white shadow-sm'
                            : 'border-[#E2D8CD] bg-[#FDFBF7] text-stone-700 hover:-translate-y-0.5 hover:border-[#C88A35] hover:bg-[#F5EFEB]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <div className="text-xs text-stone-500 font-medium whitespace-nowrap">
                Hiển thị: <strong>{filteredItems.length}</strong> món
              </div>
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
                const currentCategory = categories.find(
                  (c) =>
                    String(c.id) === String(item.category_id) ||
                    c.code === item.category ||
                    String(c.id) === String(item.category)
                )
                const isFood =
                  item.category === 'SNACKS' ||
                  currentCategory?.code === 'SNACKS' ||
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
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        imageClassName={`w-full h-full object-cover transition duration-300 ${
                          item.isAvailable ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                      />

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
