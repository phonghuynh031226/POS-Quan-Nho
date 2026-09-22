import { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Save,
  SlidersHorizontal,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/formatters'

export default function OptionGroupModal({
  isOpen,
  onClose,
  initialGroup,
  onSave,
  isSubmitting,
}) {
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [selectionType, setSelectionType] = useState('SINGLE') // 'SINGLE' | 'MULTIPLE'
  const [required, setRequired] = useState(false)
  const [maxSelect, setMaxSelect] = useState(1)
  const [displayOrder, setDisplayOrder] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [options, setOptions] = useState([])

  // Sub-form for adding a new option
  const [newOptName, setNewOptName] = useState('')
  const [newOptPrice, setNewOptPrice] = useState(0)

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (!isOpen) return

    setFormErrors({})
    setNewOptName('')
    setNewOptPrice(0)

    if (initialGroup && initialGroup.name) {
      setId(initialGroup.id || '')
      setName(initialGroup.name || '')
      setCode(initialGroup.code || '')
      setSelectionType(initialGroup.selectionType || 'SINGLE')
      setRequired(Boolean(initialGroup.required))
      setMaxSelect(initialGroup.maxSelect || 1)
      setDisplayOrder(initialGroup.displayOrder || 1)
      setIsActive(initialGroup.isActive !== false)
      setOptions(
        Array.isArray(initialGroup.options)
          ? initialGroup.options.map((opt) => ({
              id: opt.id || 'opt_' + Math.random().toString(36).substr(2, 9),
              name: opt.name || '',
              extraPrice: Number(opt.extraPrice) || 0,
              isDefault: Boolean(opt.isDefault),
              isActive: opt.isActive !== false,
            }))
          : []
      )
    } else {
      setId('')
      setName('')
      setCode('')
      setSelectionType('SINGLE')
      setRequired(false)
      setMaxSelect(1)
      setDisplayOrder(1)
      setIsActive(true)
      setOptions([])
    }
  }, [isOpen, initialGroup])

  // Handle auto-code generation from name if code is empty
  const handleNameChange = (val) => {
    setName(val)
    setFormErrors((prev) => ({ ...prev, name: '' }))
    if (!id && (!code || code === generateCode(name))) {
      setCode(generateCode(val))
    }
  }

  const generateCode = (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 20)
  }

  // Add option to group
  const handleAddOption = (e) => {
    e?.preventDefault()
    if (!newOptName.trim()) {
      setFormErrors((prev) => ({ ...prev, option: 'Vui lòng nhập tên lựa chọn' }))
      return
    }

    const newOpt = {
      id: 'opt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: newOptName.trim(),
      extraPrice: Number(newOptPrice) || 0,
      isDefault: options.length === 0, // Set default if first option
      isActive: true,
    }

    setOptions((prev) => [...prev, newOpt])
    setNewOptName('')
    setNewOptPrice(0)
    setFormErrors((prev) => ({ ...prev, option: '' }))
  }

  // Remove option from group
  const handleRemoveOption = (index) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  // Toggle default status
  const handleToggleDefault = (index) => {
    if (selectionType === 'SINGLE') {
      setOptions((prev) =>
        prev.map((opt, i) => ({
          ...opt,
          isDefault: i === index ? !opt.isDefault : false,
        }))
      )
    } else {
      setOptions((prev) =>
        prev.map((opt, i) => (i === index ? { ...opt, isDefault: !opt.isDefault } : opt))
      )
    }
  }

  // Update option properties inline
  const handleUpdateOption = (index, field, value) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt))
    )
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    const errors = {}

    if (!name.trim()) {
      errors.name = 'Vui lòng nhập tên nhóm tùy chọn'
    }

    if (options.length === 0) {
      errors.option = 'Nhóm tùy chọn phải có ít nhất 1 lựa chọn'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const payload = {
      id: id || undefined,
      name: name.trim(),
      code: (code.trim() || generateCode(name.trim())).toUpperCase(),
      selectionType,
      required,
      maxSelect: selectionType === 'SINGLE' ? 1 : Math.max(1, Number(maxSelect) || 1),
      displayOrder: Number(displayOrder) || 1,
      isActive,
      options: options.map((opt) => ({
        id: opt.id,
        name: opt.name.trim(),
        extraPrice: Number(opt.extraPrice) || 0,
        isDefault: Boolean(opt.isDefault),
        isActive: opt.isActive !== false,
      })),
    }

    onSave(payload)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={id ? 'Chỉnh sửa nhóm tùy chọn' : 'Thêm nhóm tùy chọn mới'}
      subtitle="Thiết lập nhóm tùy chọn dùng chung toàn quán (Size, Nhiệt độ, Topping...)"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (5/12): CẤU HÌNH NHÓM */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C88A35]" />
                1. Thông tin nhóm tùy chọn
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#C88A35] accent-[#C88A35]"
                />
                <span>Kích hoạt</span>
              </label>
            </div>

            <div className="space-y-2.5">
              <Input
                label="Tên nhóm tùy chọn"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={formErrors.name}
                placeholder="Ví dụ: Kích cỡ (Size), Topping..."
                required
                autoFocus
              />
            </div>

            {/* Kiểu chọn món & Quy tắc */}
            <div className="p-3 bg-stone-50 rounded-xl border border-[#D4C7B8] space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1">
                  Kiểu chọn món
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionType('SINGLE')
                      setMaxSelect(1)
                    }}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectionType === 'SINGLE'
                        ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                        : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-100'
                    }`}
                  >
                    <Circle className="w-3 h-3" />
                    <span>Chọn một (SINGLE)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectionType('MULTIPLE')}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectionType === 'MULTIPLE'
                        ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                        : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Chọn nhiều (MULTIPLE)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#E8DFD5] min-h-[36px]">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#2D1B14] select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#C88A35] accent-[#C88A35]"
                  />
                  <span>Bắt buộc chọn (Required)</span>
                </label>

                <div
                  className={`flex items-center gap-1.5 shrink-0 transition-opacity duration-150 ${
                    selectionType === 'MULTIPLE' ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                  }`}
                  aria-hidden={selectionType !== 'MULTIPLE'}
                >
                  <span className="text-[11px] font-semibold text-stone-600">Tối đa:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    tabIndex={selectionType === 'MULTIPLE' ? 0 : -1}
                    value={maxSelect}
                    onChange={(e) => setMaxSelect(Math.max(1, Number(e.target.value) || 1))}
                    className="w-14 text-xs py-1 px-1.5 rounded-md border border-[#D4C7B8] bg-white text-center font-bold text-[#2D1B14]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (7/12): CÁC LỰA CHỌN */}
          <div className="lg:col-span-7 space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C88A35]" />
                2. Các lựa chọn trong nhóm ({options.length})
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                Tick để đặt mặc định
              </span>
            </div>

            {formErrors.option && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{formErrors.option}</span>
              </div>
            )}

            {/* Quick add option sub-form trên đầu */}
            <div className="p-2 bg-stone-50 rounded-xl border border-[#D4C7B8] flex items-center gap-1.5">
              <input
                type="text"
                value={newOptName}
                onChange={(e) => setNewOptName(e.target.value)}
                placeholder="Tên lựa chọn (ví dụ: Size Lớn, Trân châu...)"
                className="flex-1 text-xs py-1.5 px-2.5 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddOption()
                  }
                }}
              />

              <div className="relative shrink-0">
                <input
                  type="number"
                  step="1000"
                  value={newOptPrice}
                  onChange={(e) => setNewOptPrice(Number(e.target.value))}
                  placeholder="0"
                  className="w-20 text-xs py-1.5 pl-2 pr-5 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] text-right font-bold focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400">₫</span>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddOption}
                className="shrink-0 text-xs py-1.5 px-3"
              >
                Thêm
              </Button>
            </div>

            {/* Option list container cuộn bên trong */}
            <div className="divide-y divide-[#E8DFD5] border border-[#E8DFD5] rounded-xl overflow-hidden bg-white max-h-[220px] overflow-y-auto">
              {options.length === 0 ? (
                <div className="p-5 text-center text-xs text-stone-400 italic">
                  Chưa có lựa chọn nào. Nhập tên và bấm "Thêm" ở trên.
                </div>
              ) : (
                options.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className="p-2 flex items-center justify-between gap-2 hover:bg-[#FAF7F2] transition"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleDefault(idx)}
                      title={opt.isDefault ? 'Đang là mặc định' : 'Bấm để đặt làm mặc định'}
                      className={`p-1 rounded-md transition cursor-pointer shrink-0 ${
                        opt.isDefault
                          ? 'bg-[#C88A35] text-white'
                          : 'text-stone-300 hover:text-stone-500 bg-stone-100'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => handleUpdateOption(idx, 'name', e.target.value)}
                      placeholder="Tên lựa chọn"
                      className="flex-1 text-xs py-1 px-2 rounded-md border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-stone-400">+</span>
                      <input
                        type="number"
                        step="1000"
                        value={opt.extraPrice}
                        onChange={(e) =>
                          handleUpdateOption(idx, 'extraPrice', Number(e.target.value) || 0)
                        }
                        className="w-18 text-xs py-1 px-1.5 rounded-md border border-[#D4C7B8] bg-white text-[#2D1B14] text-right font-bold"
                      />
                      <span className="text-[11px] text-stone-500">₫</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                      title="Xóa lựa chọn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer cố định gọn gàng */}
        <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting} className="text-xs">
            Hủy
          </Button>
          <Button
            type="submit"
            variant="accent"
            size="sm"
            loading={isSubmitting}
            icon={Save}
            className="px-5 shadow-sm text-xs font-bold"
          >
            {id ? 'Cập nhật nhóm' : 'Tạo nhóm tùy chọn'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
