import { useState } from 'react'
import {
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  X,
  Tag,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { menuApi } from '../../api/menuApi'
import { useToast } from '../../context/ToastContext'

export default function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
  menuItems = [],
}) {
  const [newCatName, setNewCatName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Editing category
  const [editingCatId, setEditingCatId] = useState(null)
  const [editingCatName, setEditingCatName] = useState('')

  // Deleting category confirmation
  const [catToDelete, setCatToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toast = useToast()

  const handleAddCategory = async (e) => {
    e?.preventDefault()
    if (!newCatName.trim()) {
      toast.error('Vui lòng nhập tên danh mục')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await menuApi.saveCategory({
        name: newCatName.trim(),
      })
      onCategoriesUpdated?.(updated)
      toast.success(`Đã thêm danh mục "${newCatName.trim()}"!`)
      setNewCatName('')
    } catch (err) {
      toast.error('Lỗi thêm danh mục: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (cat) => {
    setEditingCatId(cat.id)
    setEditingCatName(cat.name)
  }

  const handleSaveEdit = async (cat) => {
    if (!editingCatName.trim()) {
      toast.error('Tên danh mục không được để trống')
      return
    }

    try {
      const updated = await menuApi.saveCategory({
        ...cat,
        name: editingCatName.trim(),
      })
      onCategoriesUpdated?.(updated)
      toast.success('Đã cập nhật tên danh mục!')
      setEditingCatId(null)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const handleConfirmDelete = async () => {
    if (!catToDelete) return
    setIsDeleting(true)
    try {
      const updated = await menuApi.deleteCategory(catToDelete.id)
      onCategoriesUpdated?.(updated)
      toast.success(`Đã xóa danh mục "${catToDelete.name}"!`)
      setCatToDelete(null)
    } catch (err) {
      toast.error('Lỗi xóa: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản Lý Danh Mục Món"
      subtitle="Thêm, sửa tên hoặc xóa các danh mục trong thực đơn của quán"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Form Thêm danh mục mới */}
        <form
          onSubmit={handleAddCategory}
          className="p-4 bg-white rounded-xl border border-[#E8DFD5] space-y-3"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-[#C88A35]" />
            <span>Thêm danh mục mới</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nhập tên danh mục (ví dụ: Trà sữa, Bánh ngọt, Sinh tố...)"
              className="flex-1 text-xs sm:text-sm py-2.5 px-3.5 rounded-xl border border-[#D4C7B8] bg-stone-50 focus:bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
              autoFocus
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

        {/* Danh sách danh mục hiện tại */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center justify-between">
            <span>Danh mục hiện có ({categories.length})</span>
            <span className="text-[11px] font-normal text-stone-500">
              Số món đang có
            </span>
          </div>

          <div className="divide-y divide-[#E8DFD5] border border-[#E8DFD5] rounded-xl overflow-hidden bg-white max-h-72 overflow-y-auto">
            {categories.map((cat) => {
              const itemCount = menuItems.filter((m) => m.category === cat.id).length
              const isEditing = editingCatId === cat.id

              return (
                <div
                  key={cat.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F2] transition"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#F5EFEB] flex items-center justify-center shrink-0 text-[#C88A35]">
                      <Tag className="w-4 h-4" />
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="flex-1 text-xs py-1 px-2.5 rounded-lg border border-[#C88A35] bg-white text-[#2D1B14] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          title="Lưu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="p-1.5 rounded-lg bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-[#2D1B14] truncate">
                          {cat.name}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {itemCount} món trong thực đơn
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-[#3E2723] hover:bg-stone-100 transition cursor-pointer"
                        title="Sửa tên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatToDelete(cat)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa danh mục"
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

        {/* Modal xác nhận xóa danh mục */}
        {catToDelete && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
            <div className="flex items-start gap-2 text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Bạn có chắc chắn muốn xóa danh mục <strong>"{catToDelete.name}"</strong>?
                {menuItems.filter((m) => m.category === catToDelete.id).length > 0 && (
                  <div className="mt-1 text-rose-700 font-semibold">
                    Lưu ý: Có{' '}
                    {menuItems.filter((m) => m.category === catToDelete.id).length} món đang thuộc
                    danh mục này!
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
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
