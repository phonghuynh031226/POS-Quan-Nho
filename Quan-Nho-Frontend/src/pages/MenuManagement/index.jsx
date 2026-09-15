import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit2,
  Check,
  Ban,
  Coffee,
  Utensils,
  Trash2,
  AlertTriangle,
  Sparkles,
  Tags,
  SlidersHorizontal,
} from 'lucide-react'
import { menuApi } from '../../api/menuApi'
import { optionGroupApi } from '../../api/optionGroupApi'
import { formatCurrency } from '../../utils/formatters'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import MenuItemModal from '../../components/menu/MenuItemModal'
import CategoryManagementModal from '../../components/menu/CategoryManagementModal'
import ToppingManagementModal from '../../components/menu/ToppingManagementModal'
import { useToast } from '../../context/ToastContext'

export default function MenuManagementPage() {
  const navigate = useNavigate()
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [toppings, setToppings] = useState([])
  const [optionGroups, setOptionGroups] = useState([])
  const [productRelations, setProductRelations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // Edit / Add modal
  const [editingItem, setEditingItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Category & Topping Manager modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false)

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toast = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, catData, topData, optGroupData, relationsData] = await Promise.all([
        menuApi.getMenu(),
        menuApi.getCategories(),
        menuApi.getToppings(),
        optionGroupApi.getOptionGroups(),
        optionGroupApi.getProductOptionGroups(),
      ])
      setMenu(menuData)
      setCategories(catData)
      setToppings(topData)
      setOptionGroups(optGroupData)
      setProductRelations(relationsData)
    } catch (err) {
      toast.error('Lỗi tải dữ liệu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleAvailability = async (id) => {
    try {
      const updated = await menuApi.toggleAvailability(id)
      setMenu(updated)
      toast.success('Đã cập nhật trạng thái bán món!')
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItem({ ...item })
    setIsModalOpen(true)
  }

  const handleSaveItem = async (itemData, optionGroupRelations = []) => {
    setIsSubmitting(true)
    try {
      const targetId = itemData.id || ('m_' + Date.now())
      const itemToSave = { ...itemData, id: targetId }
      const updated = await menuApi.saveItem(itemToSave)
      await optionGroupApi.saveProductOptionGroups(targetId, optionGroupRelations)
      setMenu(updated)
      await loadData()
      toast.success(itemData.id ? 'Cập nhật món thành công!' : 'Đã thêm món mới vào thực đơn!')
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Lỗi lưu món: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      const updated = await menuApi.deleteItem(itemToDelete.id)
      setMenu(updated)
      toast.success(`Đã xóa món "${itemToDelete.name}" khỏi thực đơn!`)
      setItemToDelete(null)
    } catch (err) {
      toast.error('Lỗi xóa món: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCategoriesUpdated = (updatedCats) => {
    setCategories(updatedCats)
  }

  const filteredItems = menu.filter((item) => {
    const matchCat =
      selectedCategory === 'ALL' ||
      item.category === selectedCategory ||
      item.category_id === selectedCategory ||
      String(item.category_id) === String(selectedCategory)
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    return matchCat && matchSearch
  })

  // Full category list with ALL option for filter bar
  const filterCategories = [
    { id: 'ALL', name: 'Tất cả món' },
    ...categories,
  ]

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
            Quản Lý Thực Đơn Quán
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Cập nhật món ăn, đồ uống, danh mục bán, đơn giá và các nhóm tùy chọn dùng chung
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            icon={SlidersHorizontal}
            onClick={() => navigate('/options')}
            className="bg-white border-[#D4C7B8] hover:bg-[#FAF7F2] text-[#2D1B14] cursor-pointer shadow-xs"
          >
            Quản lý tùy chọn
          </Button>

          <Button
            variant="outline"
            icon={Tags}
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border-[#D4C7B8] hover:bg-[#FAF7F2] text-[#2D1B14] cursor-pointer shadow-xs"
          >
            Quản lý danh mục
          </Button>

          <Button
            variant="accent"
            icon={Plus}
            onClick={handleOpenAddModal}
            className="shadow-md cursor-pointer"
          >
            Thêm món mới
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-white rounded-2xl border border-[#E8DFD5] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm món trong thực đơn..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-[#D4C7B8] rounded-xl text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
          />
        </div>

        {/* Dynamic categories filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#3E2723] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table / Cards */}
      {loading ? (
        <LoadingSpinner text="Đang tải danh sách món..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="Không tìm thấy món nào"
          description="Hãy tạo món mới hoặc thay đổi bộ lọc tìm kiếm"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8F5F0] border-b border-[#E8DFD5] text-[#3E2723] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Hình ảnh</th>
                  <th className="p-4">Tên món & Tùy chọn</th>
                  <th className="p-4">Danh mục</th>
                  <th className="p-4">Đơn giá cơ bản</th>
                  <th className="p-4 text-center">Trạng thái bán</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD5]">
                {filteredItems.map((item) => {
                  const currentCategory = categories.find((c) => c.id === item.category)
                  const isFood = item.category === 'SNACKS' || currentCategory?.type === 'FOOD'
                  const itemRelations = productRelations.filter((r) => r.productId === item.id)
                  const itemGroupNames = itemRelations
                    .map((r) => optionGroups.find((g) => g.id === r.optionGroupId)?.name)
                    .filter(Boolean)

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF7F2] transition">
                      <td className="p-4 w-16">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E8DFD5]"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60'
                          }}
                        />
                      </td>

                      <td className="p-4 font-semibold text-[#2D1B14]">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {itemGroupNames.length > 0 && (
                            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              {itemGroupNames.length} nhóm tùy chọn
                            </span>
                          )}
                        </div>
                        {/* Option groups badges */}
                        {itemGroupNames.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                            {itemGroupNames.map((grpName, i) => (
                              <span
                                key={i}
                                className="bg-[#EFE9E0] text-[#3E2723] px-1.5 py-0.5 rounded font-medium"
                              >
                                {grpName}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-[#EFE9E0] text-[#3E2723] text-xs font-bold inline-flex items-center gap-1">
                          {isFood ? (
                            <Utensils className="w-3 h-3 text-amber-600" />
                          ) : (
                            <Coffee className="w-3 h-3 text-[#C88A35]" />
                          )}
                          <span>
                            {currentCategory?.name || item.category}
                          </span>
                        </span>
                      </td>

                      <td className="p-4 font-black text-[#3E2723] text-sm">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {item.isAvailable ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đang bán</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Hết món</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEditModal(item)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setItemToDelete(item)}
                            className="text-rose-600 hover:bg-rose-50 border-rose-200"
                            title="Xóa món"
                          >
                            Xóa
                          </Button>
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

      {/* Edit / Add Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialItem={editingItem}
        onSave={handleSaveItem}
        isSubmitting={isSubmitting}
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        optionGroups={optionGroups}
        onOpenOptionGroupManager={() => navigate('/options')}
      />

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={handleCategoriesUpdated}
        menuItems={menu}
      />

      {/* Topping Management Modal */}
      <ToppingManagementModal
        isOpen={isToppingModalOpen}
        onClose={() => setIsToppingModalOpen(false)}
        toppings={toppings}
        onToppingsUpdated={setToppings}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Xác nhận xóa món"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              Bạn có chắc chắn muốn xóa món{' '}
              <strong className="font-black text-rose-950">"{itemToDelete?.name}"</strong> khỏi
              thực đơn? Thao tác này sẽ xóa món khỏi danh sách bán hàng POS.
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="accent"
              size="sm"
              icon={Trash2}
              loading={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
