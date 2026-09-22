import { useState, useEffect } from 'react'
import {
  SlidersHorizontal,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  Ban,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { optionGroupApi } from '../../api/optionGroupApi'
import { formatCurrency } from '../../utils/formatters'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import OptionGroupModal from '../../components/options/OptionGroupModal'
import { useToast } from '../../context/ToastContext'

export default function OptionGroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL') // 'ALL' | 'SINGLE' | 'MULTIPLE'

  // Modal create/edit
  const [editingGroup, setEditingGroup] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete modal
  const [groupToDelete, setGroupToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toast = useToast()

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await optionGroupApi.getOptionGroups()
      setGroups(data)
    } catch (err) {
      toast.error('Lỗi tải nhóm tùy chọn: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleOpenAddModal = () => {
    setEditingGroup(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (group) => {
    setEditingGroup({ ...group })
    setIsModalOpen(true)
  }

  const handleSaveGroup = async (groupData) => {
    setIsSubmitting(true)
    try {
      await optionGroupApi.saveOptionGroup(groupData)
      await loadGroups()
      toast.success(
        groupData.id
          ? 'Cập nhật nhóm tùy chọn thành công!'
          : 'Đã tạo nhóm tùy chọn dùng chung mới!'
      )
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Lỗi lưu nhóm tùy chọn: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (group) => {
    try {
      await optionGroupApi.saveOptionGroup({
        ...group,
        isActive: !group.isActive,
      })
      await loadGroups()
      toast.success(
        group.isActive ? 'Đã tắt nhóm tùy chọn!' : 'Đã kích hoạt nhóm tùy chọn!'
      )
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return
    setIsDeleting(true)
    try {
      await optionGroupApi.deleteOptionGroup(groupToDelete.id)
      await loadGroups()
      toast.success(`Đã xóa nhóm tùy chọn "${groupToDelete.name}"!`)
      setGroupToDelete(null)
    } catch (err) {
      toast.error('Lỗi xóa: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredGroups = groups.filter((g) => {
    const matchType =
      selectedTypeFilter === 'ALL' || g.selectionType === selectedTypeFilter
    const matchSearch =
      g.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (g.code && g.code.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    return matchType && matchSearch
  })

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-[#C88A35]" />
            <span>Quản Lý Nhóm Tùy Chọn Dùng Chung</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Tạo và cấu hình các nhóm tùy chọn (Size, Nhiệt độ, Đường, Đá, Topping...) áp dụng linh hoạt cho toàn bộ thực đơn
          </p>
        </div>

        <Button
          variant="accent"
          icon={Plus}
          onClick={handleOpenAddModal}
          className="shadow-md cursor-pointer self-start sm:self-auto"
        >
          Thêm nhóm tùy chọn
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-white rounded-2xl border border-[#E8DFD5] shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên nhóm hoặc mã (SIZE, ICE...)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-[#D4C7B8] rounded-xl text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedTypeFilter === 'ALL'
                ? 'bg-[#3E2723] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Tất cả ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('SINGLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedTypeFilter === 'SINGLE'
                ? 'bg-[#3E2723] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Circle className="w-3 h-3" />
            <span>Chọn một (SINGLE)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('MULTIPLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              selectedTypeFilter === 'MULTIPLE'
                ? 'bg-[#3E2723] text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Chọn nhiều (MULTIPLE)</span>
          </button>
        </div>
      </div>

      {/* Content list */}
      {loading ? (
        <LoadingSpinner text="Đang tải danh sách nhóm tùy chọn..." />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhóm tùy chọn nào"
          description="Hãy tạo nhóm tùy chọn mới hoặc thay đổi bộ lọc tìm kiếm"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const isSingle = group.selectionType === 'SINGLE'
            const activeOptions = (group.options || []).filter((o) => o.isActive !== false)

            return (
              <div
                key={group.id}
                onClick={() => handleOpenEditModal(group)}
                className={`bg-white rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md ${
                  group.isActive !== false
                    ? 'border-[#E8DFD5] hover:border-[#C88A35]'
                    : 'border-stone-200 opacity-60 bg-stone-50'
                }`}
              >
                <div className="p-5 space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                          {group.name}
                        </h3>
                        {group.code && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-300">
                            {group.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] inline-flex items-center gap-1 ${
                            isSingle
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {isSingle ? (
                            <>
                              <Circle className="w-2.5 h-2.5" />
                              <span>Chọn 1 (SINGLE)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Chọn nhiều (Tối đa {group.maxSelect || 'không giới hạn'})</span>
                            </>
                          )}
                        </span>

                        {group.required && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                            Bắt buộc
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active toggle button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleActive(group)
                      }}
                      title={group.isActive !== false ? 'Đang bật' : 'Đã tắt'}
                      className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        group.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      {group.isActive !== false ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Ban className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Options Chips */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                      Lựa chọn ({activeOptions.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {group.options && group.options.length > 0 ? (
                        group.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                              opt.isDefault
                                ? 'bg-[#3E2723] text-white border-[#3E2723]'
                                : 'bg-[#FAF7F2] text-[#2D1B14] border-[#E8DFD5]'
                            }`}
                          >
                            <span>{opt.name}</span>
                            {opt.extraPrice > 0 && (
                              <span
                                className={
                                  opt.isDefault ? 'text-[#E09F3E]' : 'text-emerald-700 font-bold'
                                }
                              >
                                +{formatCurrency(opt.extraPrice)}
                              </span>
                            )}
                            {opt.isDefault && (
                              <span className="text-[9px] bg-white/20 px-1 rounded uppercase tracking-wider">
                                Mặc định
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">Chưa có lựa chọn nào</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-5 py-3 bg-[#FDFBF7] border-t border-[#E8DFD5] flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    Thứ tự: <strong>#{group.displayOrder || 1}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEditModal(group)
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation()
                        setGroupToDelete(group)
                      }}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Add / Edit Option Group */}
      <OptionGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialGroup={editingGroup}
        onSave={handleSaveGroup}
        isSubmitting={isSubmitting}
      />

      {/* Modal Delete Confirmation */}
      <Modal
        isOpen={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        title="Xác nhận xóa nhóm tùy chọn"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              Bạn có chắc chắn muốn xóa nhóm tùy chọn{' '}
              <strong className="font-black text-rose-950">"{groupToDelete?.name}"</strong>?
              Thao tác này sẽ gỡ nhóm khỏi tất cả các sản phẩm đang liên kết.
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupToDelete(null)}
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
