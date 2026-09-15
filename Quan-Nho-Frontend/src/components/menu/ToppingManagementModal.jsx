import { useState } from 'react'
import {
  Sparkles,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { menuApi } from '../../api/menuApi'
import { formatCurrency } from '../../utils/formatters'
import { useToast } from '../../context/ToastContext'

export default function ToppingManagementModal({
  isOpen,
  onClose,
  toppings = [],
  onToppingsUpdated,
}) {
  const [newTopName, setNewTopName] = useState('')
  const [newTopPrice, setNewTopPrice] = useState(6000)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Editing state
  const [editingTopId, setEditingTopId] = useState(null)
  const [editingTopName, setEditingTopName] = useState('')
  const [editingTopPrice, setEditingTopPrice] = useState(0)

  // Deleting state
  const [topToDelete, setTopToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toast = useToast()

  const handleAddTopping = async (e) => {
    e?.preventDefault()
    if (!newTopName.trim()) {
      toast.error('Vui lòng nhập tên topping')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await menuApi.saveTopping({
        name: newTopName.trim(),
        price: Number(newTopPrice) || 0,
      })
      onToppingsUpdated?.(updated)
      toast.success(`Đã thêm topping "${newTopName.trim()}"!`)
      setNewTopName('')
      setNewTopPrice(6000)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (top) => {
    setEditingTopId(top.id)
    setEditingTopName(top.name)
    setEditingTopPrice(top.price)
  }

  const handleSaveEdit = async (top) => {
    if (!editingTopName.trim()) {
      toast.error('Tên topping không được để trống')
      return
    }

    try {
      const updated = await menuApi.saveTopping({
        ...top,
        name: editingTopName.trim(),
        price: Number(editingTopPrice) || 0,
      })
      onToppingsUpdated?.(updated)
      toast.success('Đã cập nhật topping!')
      setEditingTopId(null)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const handleConfirmDelete = async () => {
    if (!topToDelete) return
    setIsDeleting(true)
    try {
      const updated = await menuApi.deleteTopping(topToDelete.id)
      onToppingsUpdated?.(updated)
      toast.success(`Đã xóa topping "${topToDelete.name}"!`)
      setTopToDelete(null)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản Lý Danh Sách Topping"
      subtitle="Thiết lập các loại topping, món kèm thêm dùng chung cho toàn bộ thực đơn quán"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Form thêm Topping mới */}
        <form
          onSubmit={handleAddTopping}
          className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-3"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C88A35]" />
            <span>Thêm topping mới vào kho</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTopName}
              onChange={(e) => setNewTopName(e.target.value)}
              placeholder="Tên topping (ví dụ: Trân châu trắng, Kem cheese...)"
              className="flex-1 text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-[#D4C7B8] bg-stone-50 focus:bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
              autoFocus
            />

            <input
              type="number"
              step="1000"
              value={newTopPrice}
              onChange={(e) => setNewTopPrice(e.target.value)}
              placeholder="Giá (₫)"
              className="w-24 text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
            />

            <Button
              type="submit"
              variant="accent"
              size="sm"
              icon={Plus}
              loading={isSubmitting}
              className="whitespace-nowrap shadow-xs cursor-pointer px-4"
            >
              Thêm
            </Button>
          </div>
        </form>

        {/* Danh sách topping hiện tại */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center justify-between">
            <span>Topping hiện có ({toppings.length})</span>
            <span className="text-[11px] font-normal text-stone-500">
              Đơn giá phụ thu
            </span>
          </div>

          <div className="divide-y divide-[#E8DFD5] border border-[#E8DFD5] rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
            {toppings.map((top) => {
              const isEditing = editingTopId === top.id

              return (
                <div
                  key={top.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F2] transition"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTopName}
                        onChange={(e) => setEditingTopName(e.target.value)}
                        className="flex-1 text-xs py-1.5 px-2.5 rounded-lg border border-[#C88A35] bg-white text-[#2D1B14] focus:outline-none"
                        autoFocus
                      />
                      <input
                        type="number"
                        step="1000"
                        value={editingTopPrice}
                        onChange={(e) => setEditingTopPrice(e.target.value)}
                        className="w-20 text-xs py-1.5 px-2 rounded-lg border border-[#C88A35] bg-white text-[#2D1B14] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(top)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        title="Lưu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTopId(null)}
                        className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 flex items-center justify-between pr-2">
                      <div className="font-bold text-xs sm:text-sm text-[#2D1B14] truncate">
                        {top.name}
                      </div>
                      <div className="text-xs font-bold text-emerald-700">
                        +{formatCurrency(top.price)}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(top)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#3E2723] hover:bg-stone-100 transition cursor-pointer"
                        title="Sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopToDelete(top)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal xác nhận xóa topping */}
        {topToDelete && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
            <div className="flex items-start gap-2 text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Bạn có chắc chắn muốn xóa topping <strong>"{topToDelete.name}"</strong> khỏi kho dữ liệu?
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTopToDelete(null)}
                className="px-3 py-1 rounded-lg bg-white border border-stone-300 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#E8DFD5] flex justify-end">
          <Button variant="accent" onClick={onClose} className="px-6">
            Hoàn tất
          </Button>
        </div>
      </div>
    </Modal>
  )
}
