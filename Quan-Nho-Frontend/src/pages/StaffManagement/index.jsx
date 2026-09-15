import { useState, useEffect } from 'react'
import { Plus, UserCheck, UserX, Shield, Phone, Edit2, Lock, Save } from 'lucide-react'
import { staffApi } from '../../api/staffApi'
import { ROLES } from '../../constants'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useToast } from '../../context/ToastContext'

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toast = useToast()

  const loadStaff = async () => {
    try {
      setLoading(true)
      const data = await staffApi.getStaffList()
      setStaffList(data)
    } catch (err) {
      toast.error('Lỗi tải danh sách nhân viên: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleToggleStatus = async (id) => {
    try {
      const updated = await staffApi.toggleStaffStatus(id)
      setStaffList(updated)
      toast.success('Đã cập nhật trạng thái tài khoản nhân viên!')
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const handleOpenAddModal = () => {
    setEditingStaff({
      id: '',
      username: '',
      name: '',
      role: 'CASHIER',
      phone: '',
      isActive: true,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (staff) => {
    setEditingStaff({ ...staff })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleSaveStaff = async (e) => {
    e?.preventDefault()
    const errs = {}
    if (!editingStaff.name?.trim()) errs.name = 'Họ và tên không được để trống'
    if (!editingStaff.username?.trim()) errs.username = 'Tên đăng nhập không được để trống'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await staffApi.saveStaff(editingStaff)
      setStaffList(updated)
      toast.success(
        editingStaff.id ? 'Cập nhật nhân viên thành công!' : 'Thêm nhân viên mới thành công!'
      )
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
            Quản Lý Nhân Viên & Phân Quyền
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Cấu hình quyền thu ngân quầy, pha chế, và quản lý trạng thái tài khoản
          </p>
        </div>

        <Button variant="accent" icon={Plus} onClick={handleOpenAddModal} className="shadow-md">
          Thêm nhân viên mới
        </Button>
      </div>

      {/* Staff Table */}
      {loading ? (
        <LoadingSpinner text="Đang tải danh sách nhân viên..." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8F5F0] border-b border-[#E8DFD5] text-[#3E2723] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Họ và tên</th>
                  <th className="p-4">Tên đăng nhập</th>
                  <th className="p-4">Số điện thoại</th>
                  <th className="p-4">Vai trò / Quyền hạn</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD5]">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[#FAF7F2] transition">
                    <td className="p-4 font-bold text-[#2D1B14]">{staff.name}</td>

                    <td className="p-4 font-mono text-stone-600 text-xs">@{staff.username}</td>

                    <td className="p-4 text-stone-500">{staff.phone || 'Chưa cập nhật'}</td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-[#EFE9E0] text-[#3E2723] text-xs font-bold inline-flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#C88A35]" />
                        <span>{ROLES[staff.role]?.name || staff.role}</span>
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(staff.id)}
                        disabled={staff.role === 'ADMIN'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          staff.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {staff.isActive ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Đang hoạt động</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Đã tạm khóa</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEditModal(staff)}
                      >
                        Sửa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff?.id ? 'Chỉnh sửa tài khoản nhân viên' : 'Thêm tài khoản nhân viên'}
        subtitle="Phân quyền xác định các màn hình nhân viên có thể truy cập"
        maxWidth="max-w-md"
      >
        {editingStaff && (
          <form onSubmit={handleSaveStaff} className="space-y-4">
            <Input
              label="Họ và tên nhân viên"
              value={editingStaff.name}
              onChange={(e) => {
                setEditingStaff({ ...editingStaff, name: e.target.value })
                setErrors({ ...errors, name: '' })
              }}
              error={errors.name}
              placeholder="Nguyễn Văn A"
              required
            />

            <Input
              label="Tên đăng nhập"
              value={editingStaff.username}
              onChange={(e) => {
                setEditingStaff({ ...editingStaff, username: e.target.value })
                setErrors({ ...errors, username: '' })
              }}
              error={errors.username}
              placeholder="nhanvien1"
              required
            />

            <Input
              label="Số điện thoại liên hệ"
              value={editingStaff.phone || ''}
              onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
              placeholder="0901234567"
            />

            <div>
              <label className="block text-sm font-semibold text-[#3E2723] mb-1.5">
                Vai trò / Quyền hạn
              </label>
              <select
                value={editingStaff.role}
                onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                className="w-full text-sm py-3 px-4 rounded-xl border border-[#D4C7B8] bg-white text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
              >
                <option value="CASHIER">Nhân viên quầy (Bán hàng & Thu tiền)</option>
                <option value="BARISTA">Nhân viên pha chế (KDS)</option>
                <option value="HYBRID">Quầy & Pha chế (Tổng hợp)</option>
                <option value="ADMIN">Chủ quán (Toàn quyền)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#E8DFD5] flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="accent"
                loading={isSubmitting}
                icon={Save}
                className="px-6 shadow-md"
              >
                Lưu tài khoản
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
