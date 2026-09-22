import { useState, useEffect } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Check,
  Save,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Circle,
  CheckCircle2,
  X,
  Eye,
  Coffee,
  Utensils,
} from 'lucide-react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/formatters'
import { optionGroupApi } from '../../api/optionGroupApi'

// Thư viện ảnh mẫu chất lượng cao cho Quán
const PRESET_IMAGES = [
  // Cà phê
  {
    name: 'Cà phê sữa đá',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Bạc xỉu 3 tầng',
    url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Cà phê đen phin',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Cà phê muối béo',
    url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Cold Brew cam sả',
    url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
  },
  // Trà & Thức uống
  {
    name: 'Trà đào cam sả',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Trà vải lài sen',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Trà sữa ô long trân châu',
    url: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Trà chanh mật ong',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Nước ép cam tươi',
    url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=60',
  },
  // Đồ ăn vặt & Bánh
  {
    name: 'Khoai tây chiên giòn',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Bánh mì que Hải Phòng',
    url: 'https://images.unsplash.com/photo-1621852004158-f3bc188ace2d?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Nem chua rán giòn',
    url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Khô gà lá chanh',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
  },
  {
    name: 'Hạt hướng dương rang',
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=60',
  },
]

export default function MenuItemModal({
  isOpen,
  onClose,
  initialItem,
  onSave,
  isSubmitting,
  categories = [],
  onOpenCategoryManager,
  optionGroups = [],
  onOpenOptionGroupManager,
}) {
  // Form Fields
  const [id, setId] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('COFFEE')
  const [price, setPrice] = useState(30000)
  const [image, setImage] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  // Product Option Groups: array of { optionGroupId, required, maxSelect, displayOrder }
  const [selectedGroups, setSelectedGroups] = useState([])

  const [formErrors, setFormErrors] = useState({})

  const generateCode = (text) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30)
  }

  // Initialize when modal opens
  useEffect(() => {
    if (!isOpen) return

    setFormErrors({})

    if (initialItem && initialItem.name) {
      setId(initialItem.id || '')
      setCode(initialItem.code || '')
      setName(initialItem.name || '')
      setCategory(initialItem.category_id || initialItem.category || (categories[0]?.id || 'COFFEE'))
      setPrice(initialItem.base_price || initialItem.price || 30000)
      setImage(initialItem.image_url || initialItem.image || '')
      setIsAvailable(initialItem.is_available !== false && initialItem.isAvailable !== false)

      // Load existing relations for this product
      if (initialItem.id) {
        optionGroupApi.getProductOptionGroups(initialItem.id).then((relations) => {
          setSelectedGroups(relations || [])
        })
      } else {
        setSelectedGroups([])
      }
    } else {
      setId('')
      setCode('')
      setName('')
      setCategory(categories[0]?.id || 'COFFEE')
      setPrice(30000)
      setImage('')
      setIsAvailable(true)
      setSelectedGroups([])
    }
  }, [isOpen, initialItem, categories])

  // Toggle option group selection
  const handleToggleGroup = (group) => {
    const isSelected = selectedGroups.some((sg) => sg.optionGroupId === group.id)

    if (isSelected) {
      setSelectedGroups((prev) => prev.filter((sg) => sg.optionGroupId !== group.id))
    } else {
      const nextOrder = selectedGroups.length + 1
      const newRelation = {
        optionGroupId: group.id,
        required: Boolean(group.required),
        maxSelect: group.selectionType === 'SINGLE' ? 1 : (group.maxSelect || 1),
        displayOrder: nextOrder,
      }
      setSelectedGroups((prev) => [...prev, newRelation])
    }
  }

  // Update override properties of a selected group
  const handleUpdateGroupRelation = (groupId, field, value) => {
    setSelectedGroups((prev) =>
      prev.map((sg) => (sg.optionGroupId === groupId ? { ...sg, [field]: value } : sg))
    )
  }

  // Move group up/down for display order
  const handleMoveGroupOrder = (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= selectedGroups.length) return

    const updated = [...selectedGroups]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    // Re-assign displayOrder sequentially
    const reordered = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }))

    setSelectedGroups(reordered)
  }

  // Handle image upload from file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước ảnh nên nhỏ hơn 2MB để tối ưu tốc độ lưu trữ.')
      return
    }
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setImage(uploadEvent.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    const errors = {}

    if (!name.trim()) {
      errors.name = 'Vui lòng nhập tên món'
    }
    if (!price || Number(price) <= 0) {
      errors.price = 'Giá món phải lớn hơn 0 ₫'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const finalCode = (code.trim() || generateCode(name.trim())).toUpperCase()
    const selectedCatObj = categories.find((c) => c.id === category || c.code === category)
    const categoryId = selectedCatObj ? Number(selectedCatObj.id) : (Number(category) || 1)

    const payload = {
      id: id || undefined,
      code: finalCode,
      name: name.trim(),
      category_id: categoryId,
      category: selectedCatObj ? selectedCatObj.code : category,
      base_price: Number(price),
      price: Number(price),
      image_url: image ? image.trim() : '',
      image: image ? image.trim() : '',
      is_available: isAvailable,
      isAvailable,
      hasOptions: selectedGroups.length > 0,
    }

    onSave(payload, selectedGroups)
  }

  const currentCategoryObj = categories.find((c) => c.id === category || c.code === category)
  const categoryName =
    currentCategoryObj?.name ||
    (category === 'COFFEE'
      ? 'Cà phê'
      : category === 'OTHER_DRINKS'
      ? 'Trà & Nước khác'
      : 'Đồ ăn vặt')
  const isFoodCategory = currentCategoryObj?.type === 'FOOD' || category === 'SNACKS'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={id ? 'Chỉnh sửa món' : 'Thêm món mới vào thực đơn'}
      subtitle="Thiết lập tên món, danh mục, đơn giá và các nhóm tùy chọn dùng chung"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (6/12): THÔNG TIN MÓN & HÌNH ẢNH */}
          <div className="lg:col-span-6 space-y-3.5">
            {/* 1. Basic Item Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723]">
                  1. Thông tin món
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-stone-700 select-none">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#C88A35] accent-[#C88A35]"
                  />
                  <span>Đang có sẵn để bán</span>
                </label>
              </div>

              <div className="space-y-2.5">
                <Input
                  label="Tên món"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setFormErrors({ ...formErrors, name: '' })
                    if (!code || !id) {
                      setCode(generateCode(e.target.value))
                    }
                  }}
                  error={formErrors.name}
                  placeholder="Ví dụ: Cà phê sữa, Trà đào cam sả, Bánh mì que..."
                  required
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-3 items-start">
                  <div className="w-full space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-[#3E2723]">
                        Danh mục món
                      </label>
                      {onOpenCategoryManager && (
                        <button
                          type="button"
                          onClick={onOpenCategoryManager}
                          className="text-xs text-[#C88A35] hover:underline font-semibold cursor-pointer"
                        >
                          + Danh mục
                        </button>
                      )}
                    </div>
                    <div className="relative rounded-xl shadow-xs">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full rounded-xl border transition-all text-sm font-medium py-3 px-4 bg-white border-[#D4C7B8] text-[#2D1B14] focus:outline-none focus:border-[#C88A35] focus:ring-2 focus:ring-[#F5E6D0] cursor-pointer"
                      >
                        {categories && categories.length > 0 ? (
                          categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="COFFEE">Cà phê</option>
                            <option value="OTHER_DRINKS">Trà & Nước khác</option>
                            <option value="SNACKS">Đồ ăn vặt</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <Input
                    label="Giá bán cơ bản (VNĐ)"
                    type="number"
                    step="1000"
                    value={price}
                    onChange={(e) => {
                      setPrice(Number(e.target.value))
                      setFormErrors({ ...formErrors, price: '' })
                    }}
                    error={formErrors.price}
                    placeholder="30000"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Image Representation (Tùy chọn: có thể thêm hoặc không thêm ảnh) */}
            <div className="space-y-2.5 pt-2.5 border-t border-[#E8DFD5]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
                  2. Hình ảnh món <span className="text-stone-400 text-[11px] font-normal normal-case">(không bắt buộc)</span>
                </span>
              </div>

              {/* Current Image Preview & Upload Controls */}
              <div className="flex items-center gap-2.5">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#D4C7B8] bg-[#F7F3EE] shrink-0 flex items-center justify-center">
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt="Xem trước"
                        className="w-full h-full object-cover"
                        onError={() => setImage('')}
                      />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        title="Bỏ ảnh này"
                        className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-300" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <ImageIcon className="w-4 h-4 opacity-50" />
                      <span className="text-[8px] font-bold mt-0.5">Không ảnh</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Dán link ảnh (không bắt buộc)..."
                      className="w-full text-xs py-2 pl-2.5 pr-7 rounded-lg border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-1 focus:ring-[#C88A35]"
                    />
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                        title="Xóa link ảnh"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="shrink-0 px-2.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold cursor-pointer border border-rose-200 flex items-center gap-1 transition"
                      title="Không dùng ảnh cho món này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bỏ ảnh</span>
                    </button>
                  )}

                  <label className="shrink-0 px-2.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer border border-[#D4C7B8] flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-stone-600" />
                    <span>Tải ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Live Card Preview trên màn hình bán hàng POS */}
            <div className="pt-2.5 border-t border-[#E8DFD5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#C88A35]" />
                  Xem trước thẻ món (màn hình POS)
                </span>
                <span className="text-[10px] text-stone-400 font-semibold bg-stone-100 px-2 py-0.5 rounded-full">
                  Trực tiếp
                </span>
              </div>

              {/* Live Preview Card */}
              <div className="p-2.5 bg-gradient-to-br from-[#FDFBF7] to-[#F5EFEB] rounded-xl border border-[#E8DFD5] shadow-xs flex items-center gap-3">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E8DFD5] flex items-center justify-center">
                  {image ? (
                    <img
                      src={image}
                      alt={name || 'Xem trước'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 p-1">
                      {isFoodCategory ? (
                        <Utensils className="w-5 h-5 text-stone-300" />
                      ) : (
                        <Coffee className="w-5 h-5 text-stone-300" />
                      )}
                      <span className="text-[8px] font-bold text-stone-400 mt-0.5">Không ảnh</span>
                    </div>
                  )}

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                      <span className="px-1 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase rounded">
                        Hết món
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-bold text-xs text-[#2D1B14] truncate">
                      {name.trim() || 'Tên món ăn / thức uống'}
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isAvailable ? 'Đang bán' : 'Tạm hết'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="font-extrabold text-[#C88A35]">
                      {formatCurrency(price || 0)}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[11px] text-stone-500 truncate">{categoryName}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-500">
                    <SlidersHorizontal className="w-3 h-3 text-[#C88A35]" />
                    <span>
                      {selectedGroups.length > 0
                        ? `${selectedGroups.length} nhóm tùy chọn áp dụng`
                        : 'Không có tùy chọn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (6/12): NHÓM TÙY CHỌN ÁP DỤNG */}
          <div className="lg:col-span-6 space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C88A35]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#3E2723]">
                  3. Nhóm tùy chọn áp dụng ({selectedGroups.length} nhóm)
                </span>
              </div>

              {onOpenOptionGroupManager && (
                <button
                  type="button"
                  onClick={onOpenOptionGroupManager}
                  className="text-[11px] text-[#C88A35] hover:text-[#96631F] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Quản lý nhóm tùy chọn</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-stone-500">
              Chọn các nhóm tùy chọn dùng chung (Size, Nhiệt độ, Topping...) cho món này:
            </p>

            {/* Option Groups Selector List */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {optionGroups.length === 0 ? (
                <div className="p-4 bg-stone-50 rounded-xl border border-[#D4C7B8] text-xs text-stone-500 text-center">
                  Chưa có nhóm tùy chọn nào trong hệ thống. Hãy bấm vào "Quản lý nhóm tùy chọn" để tạo mới.
                </div>
              ) : (
                optionGroups.map((group) => {
                  const relationIndex = selectedGroups.findIndex(
                    (sg) => sg.optionGroupId === group.id
                  )
                  const isSelected = relationIndex !== -1
                  const relation = isSelected ? selectedGroups[relationIndex] : null
                  const isSingle = group.selectionType === 'SINGLE'

                  return (
                    <div
                      key={group.id}
                      className={`p-2.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-white border-[#C88A35] shadow-xs'
                          : 'bg-stone-50 border-[#D4C7B8] opacity-75'
                      }`}
                    >
                      {/* Header line of group */}
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleGroup(group)}
                            className="w-3.5 h-3.5 rounded text-[#C88A35] accent-[#C88A35]"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#2D1B14] truncate">
                                {group.name}
                              </span>
                              {group.code && (
                                <span className="text-[9px] uppercase font-bold px-1 rounded bg-stone-100 text-stone-600 border border-stone-300">
                                  {group.code}
                                </span>
                              )}
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                                  isSingle
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                }`}
                              >
                                {isSingle ? 'Chọn 1' : 'Chọn nhiều'}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 truncate mt-0.5">
                              {group.options?.map((o) => o.name).join(', ') || 'Chưa có lựa chọn'}
                            </div>
                          </div>
                        </label>

                        {/* Sorting buttons if selected */}
                        {isSelected && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={relationIndex === 0}
                              onClick={() => handleMoveGroupOrder(relationIndex, -1)}
                              className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer text-stone-700"
                              title="Di chuyển lên trên"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={relationIndex === selectedGroups.length - 1}
                              onClick={() => handleMoveGroupOrder(relationIndex, 1)}
                              className="p-1 rounded bg-stone-100 hover:bg-stone-200 disabled:opacity-30 cursor-pointer text-stone-700"
                              title="Di chuyển xuống dưới"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Override settings row when selected */}
                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-[#E8DFD5] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-stone-700 text-[11px] select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(relation.required)}
                              onChange={(e) =>
                                handleUpdateGroupRelation(
                                  group.id,
                                  'required',
                                  e.target.checked
                                )
                              }
                              className="w-3 h-3 rounded text-[#C88A35] accent-[#C88A35]"
                            />
                            <span>Bắt buộc chọn món này (Required)</span>
                          </label>

                          {!isSingle && (
                            <div className="flex items-center gap-1 font-semibold text-stone-700 text-[11px]">
                              <span>Tối đa:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={relation.maxSelect || 1}
                                onChange={(e) =>
                                  handleUpdateGroupRelation(
                                    group.id,
                                    'maxSelect',
                                    Math.max(1, Number(e.target.value) || 1)
                                  )
                                }
                                className="w-12 py-0.5 px-1.5 rounded border border-[#D4C7B8] bg-white text-center font-bold text-[#2D1B14]"
                              />
                              <span>chọn</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
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
            {id ? 'Cập nhật món' : 'Lưu vào thực đơn'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
