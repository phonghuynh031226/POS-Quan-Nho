import { useState, useEffect, useMemo } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/formatters'
import { Plus, Minus, Check, Circle, CheckCircle2, AlertCircle } from 'lucide-react'
import { optionGroupApi } from '../../api/optionGroupApi'
import LoadingSpinner from '../common/LoadingSpinner'

export default function ItemCustomizeModal({ isOpen, onClose, item, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [selections, setSelections] = useState({}) // { [groupId]: string[] (optionIds) }
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (!isOpen || !item) return

    setQuantity(1)
    setNotes('')
    setValidationError('')

    let isMounted = true
    setLoading(true)

    optionGroupApi
      .getProductOptionGroupsDetailed(item.id)
      .then((detailedGroups) => {
        if (!isMounted) return
        setGroups(detailedGroups || [])

        // Initialize selections with default options
        const initial = {}
        detailedGroups.forEach((group) => {
          const defaultOpts = (group.options || []).filter((opt) => opt.isDefault)
          if (defaultOpts.length > 0) {
            initial[group.id] =
              group.selectionType === 'SINGLE'
                ? [defaultOpts[0].id]
                : defaultOpts.map((o) => o.id).slice(0, group.maxSelect || 1)
          } else if (group.selectionType === 'SINGLE' && group.required && group.options?.length > 0) {
            // If required SINGLE with no default, pick first option
            initial[group.id] = [group.options[0].id]
          } else {
            initial[group.id] = []
          }
        })

        setSelections(initial)
      })
      .catch((err) => {
        console.error('Error loading product option groups:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, item])

  // Calculate selected options and surcharge
  const { selectedOptionsSnapshot, totalSurcharge, unitPriceWithSurcharge, lineTotal } =
    useMemo(() => {
      if (!item) {
        return {
          selectedOptionsSnapshot: [],
          totalSurcharge: 0,
          unitPriceWithSurcharge: 0,
          lineTotal: 0,
        }
      }

      const snapshot = []
      let surchargeSum = 0

      groups.forEach((group) => {
        const selectedIds = selections[group.id] || []
        ;(group.options || []).forEach((opt) => {
          if (selectedIds.includes(opt.id)) {
            const extra = Number(opt.extraPrice) || 0
            surchargeSum += extra
            snapshot.push({
              optionGroupId: group.id,
              groupName: group.name,
              optionId: opt.id,
              optionName: opt.name,
              extraPrice: extra,
            })
          }
        })
      })

      const basePrice = Number(item.price) || 0
      const unitTotal = basePrice + surchargeSum
      const finalTotal = unitTotal * quantity

      return {
        selectedOptionsSnapshot: snapshot,
        totalSurcharge: surchargeSum,
        unitPriceWithSurcharge: unitTotal,
        lineTotal: finalTotal,
      }
    }, [item, groups, selections, quantity])

  if (!item) return null

  // Handle click on an option
  const handleSelectOption = (group, option) => {
    setValidationError('')
    const isSingle = group.selectionType === 'SINGLE'
    const current = selections[group.id] || []
    const isSelected = current.includes(option.id)

    if (isSingle) {
      if (isSelected) {
        // Can only unselect if NOT required
        if (!group.required) {
          setSelections((prev) => ({ ...prev, [group.id]: [] }))
        }
      } else {
        setSelections((prev) => ({ ...prev, [group.id]: [option.id] }))
      }
    } else {
      // MULTIPLE
      if (isSelected) {
        setSelections((prev) => ({
          ...prev,
          [group.id]: current.filter((id) => id !== option.id),
        }))
      } else {
        const max = group.maxSelect || 99
        if (current.length >= max) {
          setValidationError(
            `Nhóm "${group.name}" chỉ được chọn tối đa ${max} lựa chọn.`
          )
          return
        }
        setSelections((prev) => ({
          ...prev,
          [group.id]: [...current, option.id],
        }))
      }
    }
  }

  // Confirm and add to cart
  const handleConfirm = () => {
    // Validate required groups
    for (const group of groups) {
      if (group.required) {
        const selectedIds = selections[group.id] || []
        if (selectedIds.length === 0) {
          setValidationError(`Vui lòng chọn mục "${group.name}" trước khi thêm vào đơn.`)
          return
        }
      }
    }

    // Build legacy options map for backward-compatibility with older views
    const legacyOptions = {}
    groups.forEach((g) => {
      const selectedIds = selections[g.id] || []
      const selectedNames = (g.options || [])
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => o.name)
      if (selectedNames.length > 0) {
        legacyOptions[g.name] =
          g.selectionType === 'SINGLE' ? selectedNames[0] : selectedNames.join(', ')
      }
    })

    onAddToCart({
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      selectedOptions: selectedOptionsSnapshot,
      surcharge: totalSurcharge,
      lineTotal,
      notes: notes.trim(),
      options: legacyOptions,
    })

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      subtitle={`Giá cơ bản: ${formatCurrency(item.price)}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Loading state */}
        {loading ? (
          <div className="py-10">
            <LoadingSpinner text="Đang tải tùy chọn món..." />
          </div>
        ) : (
          <>
            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Render each attached Option Group in display order */}
            {groups.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl border border-[#E8DFD5]">
                Món này không có nhóm tùy chọn nào kèm theo.
              </p>
            ) : (
              groups.map((group) => {
                const isSingle = group.selectionType === 'SINGLE'
                const selectedIds = selections[group.id] || []

                return (
                  <div key={group.id} className="space-y-2">
                    {/* Group Title & Rule hints */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wider flex items-center gap-1.5">
                        <span>{group.name}</span>
                        {group.required && (
                          <span className="text-[10px] text-rose-600 font-bold lowercase">
                            (bắt buộc)
                          </span>
                        )}
                      </label>

                      <span className="text-[11px] text-stone-500 font-medium">
                        {isSingle
                          ? 'Chọn 1'
                          : `Chọn tối đa ${group.maxSelect || 'nhiều'}`}
                      </span>
                    </div>

                    {/* Group Options Container */}
                    <div className="grid grid-cols-2 gap-2">
                      {group.options && group.options.length > 0 ? (
                        group.options.map((opt) => {
                          const isSelected = selectedIds.includes(opt.id)

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectOption(group, opt)}
                              className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                                  : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                {isSingle ? (
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'border-white bg-[#C88A35]'
                                        : 'border-stone-400 bg-white'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'border-white bg-[#C88A35] text-white'
                                        : 'border-stone-400 bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                )}
                                <span className="truncate">{opt.name}</span>
                              </div>

                              {opt.extraPrice > 0 && (
                                <span
                                  className={`text-xs shrink-0 font-bold ${
                                    isSelected ? 'text-[#E09F3E]' : 'text-[#C88A35]'
                                  }`}
                                >
                                  +{formatCurrency(opt.extraPrice)}
                                </span>
                              )}
                            </button>
                          )
                        })
                      ) : (
                        <span className="text-xs text-stone-400 italic col-span-2">
                          Chưa có lựa chọn nào trong nhóm này
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                Ghi chú riêng cho món
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: để riêng nước đá, mang đi túi đôi..."
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
              />
            </div>

            {/* Footer with Quantity & Total */}
            <div className="pt-4 border-t border-[#E8DFD5] flex items-center justify-between gap-4">
              {/* Quantity selector */}
              <div className="flex items-center border border-[#D4C7B8] rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-sm min-w-[32px] text-center text-[#2D1B14]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2 text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to cart button */}
              <Button
                variant="accent"
                size="lg"
                onClick={handleConfirm}
                className="flex-1 justify-between shadow-md"
              >
                <span>Thêm vào đơn</span>
                <span className="font-extrabold">{formatCurrency(lineTotal)}</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
