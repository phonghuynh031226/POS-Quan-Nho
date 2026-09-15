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
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Basic group info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C88A35]" />
              1. Thông tin nhóm tùy chọn
            </span>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#C88A35] focus:ring-[#C88A35]"
              />
              <span>Đang kích hoạt</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Tên nhóm tùy chọn"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={formErrors.name}
              placeholder="Ví dụ: Kích cỡ (Size), Lượng đá, Topping..."
              required
              autoFocus
            />

            <Input
              label="Mã code đại diện"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: SIZE, ICE, TOPPING..."
            />
          </div>

          {/* Selection type & Rules */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-[#D4C7B8] space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                Kiểu chọn món
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionType('SINGLE')
                    setMaxSelect(1)
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                    selectionType === 'SINGLE'
                      ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                      : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-100'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span>Chọn một (SINGLE)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectionType('MULTIPLE')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                    selectionType === 'MULTIPLE'
                      ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                      : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Chọn nhiều (MULTIPLE)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#2D1B14]">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-[#C88A35] focus:ring-[#C88A35]"
                />
                <div>
                  <span className="block font-bold">Bắt buộc chọn (Required)</span>
                  <span className="text-[10px] text-stone-500 font-normal">
                    Khách phải chọn trước khi thêm vào giỏ
                  </span>
                </div>
              </label>

              {selectionType === 'MULTIPLE' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-700">Số lượng chọn tối đa:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxSelect}
                    onChange={(e) => setMaxSelect(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 text-xs py-1.5 px-3 rounded-lg border border-[#D4C7B8] bg-white text-center font-bold text-[#2D1B14]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Options list */}
        <div className="space-y-3 pt-2 border-t border-[#E8DFD5]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C88A35]" />
              2. Các lựa chọn trong nhóm ({options.length})
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Tick chọn mặc định (Default)
            </span>
          </div>

          {formErrors.option && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formErrors.option}</span>
            </div>
          )}

          {/* Option list container */}
          <div className="divide-y divide-[#E8DFD5] border border-[#E8DFD5] rounded-xl overflow-hidden bg-white max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-400 italic">
                Chưa có lựa chọn nào. Hãy thêm các lựa chọn bên dưới (ví dụ: Size S, Size M...).
              </div>
            ) : (
              options.map((opt, idx) => (
                <div
                  key={opt.id || idx}
                  className="p-2.5 flex items-center justify-between gap-2.5 hover:bg-[#FAF7F2] transition"
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
                    className="flex-1 text-xs py-1.5 px-2.5 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-stone-500 font-semibold">+</span>
                    <input
                      type="number"
                      step="1000"
                      value={opt.extraPrice}
                      onChange={(e) =>
                        handleUpdateOption(idx, 'extraPrice', Number(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-20 text-xs py-1.5 px-2 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] text-right font-bold"
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

          {/* Quick add option sub-form */}
          <div className="p-3 bg-stone-50 rounded-xl border border-[#D4C7B8] flex items-center gap-2">
            <input
              type="text"
              value={newOptName}
              onChange={(e) => setNewOptName(e.target.value)}
              placeholder="Tên lựa chọn mới (ví dụ: Size Lớn, Ít đá, Trân châu...)"
              className="flex-1 text-xs py-2 px-3 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />

            <input
              type="number"
              step="1000"
              value={newOptPrice}
              onChange={(e) => setNewOptPrice(Number(e.target.value))}
              placeholder="Phụ thu (₫)"
              className="w-24 text-xs py-2 px-2.5 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddOption}
              className="shrink-0"
            >
              Thêm
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#E8DFD5] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="accent"
            loading={isSubmitting}
            icon={Save}
            className="px-6 shadow-md"
          >
            {id ? 'Cập nhật nhóm' : 'Tạo nhóm tùy chọn'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
