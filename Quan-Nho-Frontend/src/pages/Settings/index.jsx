import { useState, useEffect } from 'react'
import {
  Store,
  CreditCard,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Phone,
  MapPin,
  FileText,
  Sliders,
  Key,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Printer,
  Copy,
  User,
  Mail,
  Clock,
  Calendar,
  History,
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import ReceiptModal from '../../components/print/ReceiptModal'
import { orderApi } from '../../api/orderApi'
import { settingsApi } from '../../api/settingsApi'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { getLatestOrderForPreview } from '../../utils/receiptPrintSettings'
import { useToast } from '../../context/ToastContext'

function formatDateTime(isoString) {
  if (!isoString) return 'Chưa ghi nhận'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'Chưa ghi nhận'
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return 'Chưa ghi nhận'
  }
}

export default function SettingsPage() {
  const { currentUser, updateCurrentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('store') // 'store' | 'payment' | 'account'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)
  const [sepaySettings, setSepaySettings] = useState(null)
  const [sepayApiKeyInput, setSepayApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingSepay, setSavingSepay] = useState(false)
  const [testingSepay, setTestingSepay] = useState(false)
  const [sepayTestResult, setSepayTestResult] = useState(null)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isTestPrintOpen, setIsTestPrintOpen] = useState(false)
  const [testPrintOrder, setTestPrintOrder] = useState(null)
  const [loadingTestPrint, setLoadingTestPrint] = useState(false)

  // State thông tin cá nhân (Tên, SĐT bắt buộc, Email tùy chọn)
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  // State đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const toast = useToast()
  const apiBaseUrl = new URL(import.meta.env.VITE_API_BASE_URL || '/api', window.location.origin)
  const sepayWebhookUrl = `${apiBaseUrl.toString().replace(/\/+$/, '')}/webhooks/sepay`

  // Đồng bộ form khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        fullName: currentUser.fullName || currentUser.name || '',
        phone: currentUser.phone || currentUser.username || '',
        email: currentUser.email || '',
      })
    }
  }, [currentUser])

  // Load settings on mount
  useEffect(() => {
    loadAllSettings()
  }, [])

  const loadAllSettings = async () => {
    try {
      setLoading(true)
      const [generalData, sepayData, shopData] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getSepaySettings(),
        settingsApi.getShopSettings(),
      ])
      setSettings({
        ...generalData,
        ...shopData,
        storeName: shopData.shop_name || generalData.storeName,
        storeSubtitle: shopData.store_subtitle || generalData.storeSubtitle,
        phone: shopData.phone || generalData.phone,
        address: shopData.shop_address || generalData.address,
        wifiName: shopData.wifi_name || generalData.wifiName,
        wifiPass: shopData.wifi_password_encrypted || generalData.wifiPass,
        receiptFooterMessage: shopData.receipt_message || generalData.receiptFooterMessage,
        show_wifi_on_receipt: shopData.show_wifi_on_receipt !== false,
      })
      setSepaySettings(sepayData)
    } catch (err) {
      toast.error('Lỗi tải cài đặt: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Save Shop Settings & General Settings
  const handleSaveSettings = async (e) => {
    e?.preventDefault()
    try {
      setSaving(true)

      const updated = await settingsApi.updateSettings(settings)
      setSettings((prev) => ({ ...prev, ...updated }))
      toast.success('Đã lưu cấu hình cài đặt quán thành công!')
    } catch (err) {
      toast.error('Lỗi khi lưu cài đặt: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenTestPrint = async () => {
    try {
      setLoadingTestPrint(true)
      const latestOrder = getLatestOrderForPreview(await orderApi.getOrders())
      if (!latestOrder) {
        toast.warning('Chưa có đơn hàng trong PostgreSQL để xem trước hóa đơn.')
        return
      }
      setTestPrintOrder(latestOrder)
      setIsTestPrintOpen(true)
    } catch (err) {
      toast.error('Lỗi tải đơn gần nhất để xem trước: ' + err.message)
    } finally {
      setLoadingTestPrint(false)
    }
  }

  // Save SePay API Key (Table 11: sepay_settings - Chỉ có ô dán API Key)
  const handleSaveSepayKey = async (e) => {
    e?.preventDefault()
    if (!sepayApiKeyInput.trim()) {
      toast.warning('Vui lòng dán SePay API Key!')
      return
    }

    try {
      setSavingSepay(true)
      const res = await settingsApi.saveSepayApiKey(sepayApiKeyInput.trim())
      setSepaySettings(res)
      setSepayApiKeyInput('')
      toast.success(`Đã lưu và mã hóa SePay API Key thành công (${res.masked_key})!`)
    } catch (err) {
      toast.error(err.message || 'Lỗi lưu SePay API Key')
    } finally {
      setSavingSepay(false)
    }
  }

  const handleTestSepayConnection = async () => {
    if (!sepaySettings?.is_configured) {
      toast.warning('Vui lòng lưu API Key webhook SePay trước khi kiểm tra.')
      return
    }

    setSepayTestResult(null)
    try {
      setTestingSepay(true)
      const result = await settingsApi.testSepayConnection()
      setSepayTestResult({
        connected: result?.success === true,
        message: result?.success === true
          ? 'Kiểm tra thành công: máy chủ đã nhận cấu hình API Key webhook SePay.'
          : 'Máy chủ chưa xác nhận được cấu hình webhook.',
      })
    } catch (err) {
      const status = err.response?.status
      const message = status === 503
        ? 'Máy chủ chưa có API Key webhook SePay đã lưu.'
        : 'Không thể kiểm tra cấu hình trên máy chủ. Hãy thử lại.'
      setSepayTestResult({ connected: false, message })
    } finally {
      setTestingSepay(false)
    }
  }

  const handleCopySepayWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(sepayWebhookUrl)
      toast.success('Đã sao chép URL nhận webhook SePay.')
    } catch {
      toast.error('Không thể sao chép URL webhook. Bạn có thể chọn và sao chép thủ công.')
    }
  }

  const handleConfirmReset = async () => {
    try {
      setSaving(true)
      const defaults = await settingsApi.resetSettings()
      setSettings(defaults)
      setIsResetModalOpen(false)
      toast.success('Đã đặt lại tùy chọn; thông tin quán và SePay được giữ nguyên.')
    } catch (err) {
      toast.error('Lỗi khôi phục cài đặt: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e?.preventDefault()
    setProfileError('')

    if (!profileForm.fullName.trim()) {
      setProfileError('Vui lòng nhập họ và tên chủ quán')
      return
    }
    if (!profileForm.phone.trim()) {
      setProfileError('Vui lòng nhập số điện thoại đăng nhập (bắt buộc)')
      return
    }

    try {
      setSavingProfile(true)
      const updatedUser = await authApi.updateProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim() || null,
      })
      if (updateCurrentUser) {
        updateCurrentUser(updatedUser)
      }
      toast.success('Đã cập nhật thông tin tài khoản thành công!')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Cập nhật thông tin thất bại. Vui lòng kiểm tra lại.'
      setProfileError(msg)
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e?.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp')
      return
    }

    try {
      setChangingPassword(true)
      await authApi.changePassword(currentPassword, newPassword)
      toast.success('Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.'
      setPasswordError(msg)
      toast.error(msg)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <LoadingSpinner size="lg" text="Đang tải thông tin cài đặt..." />
      </div>
    )
  }

  const tabs = [
    { id: 'store', label: 'Thông tin in bill', icon: Store },
    { id: 'payment', label: 'Cổng thanh toán SePay', icon: CreditCard },
    { id: 'account', label: 'Tài khoản & Mật khẩu', icon: Key },
  ]

  return (
    <div className="flex-1 bg-[#F8F5F0] overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header trang tinh gọn, không đóng hộp rườm rà */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#2D1B14] text-[#C88A35] shadow-xs shrink-0">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
                Cài Đặt Hệ Thống Quán
              </h1>
              <p className="text-xs sm:text-sm text-stone-500">
                Cấu hình thông tin in hóa đơn, kết nối SePay và bảo mật tài khoản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'store' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  icon={RotateCcw}
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-xs"
                >
                  Khôi phục mặc định
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  icon={Save}
                  loading={saving}
                  onClick={handleSaveSettings}
                  className="text-xs font-bold bg-[#2D1B14] hover:bg-[#3E2723]"
                >
                  Lưu cài đặt
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Khối Card thống nhất: Gộp Tabs và Nội dung cài đặt */}
        <div className="bg-white rounded-3xl border border-[#E8DFD5] shadow-sm overflow-hidden">
          {/* Thanh chuyển Tab tích hợp liền mạch vào Card */}
          <div className="flex items-center gap-2 border-b border-[#E8DFD5] bg-[#FAF7F2]/60 px-6 pt-3 pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2 -mb-[1px] ${
                    isActive
                      ? 'border-[#C88A35] text-[#2D1B14] bg-white rounded-t-2xl shadow-xs'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C88A35]' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Nội dung Tab */}
          <div className="p-6 sm:p-8">
            {/* ========================================================================= */}
            {/* TAB 1: THÔNG TIN IN BILL */}
            {/* ========================================================================= */}
            {activeTab === 'store' && (
              <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Tên quán"
                    icon={Store}
                    value={settings.storeName || ''}
                    onChange={(e) => handleFieldChange('storeName', e.target.value)}
                    placeholder="Nhập tên quán"
                    helperText="Tên quán in to rõ ở đầu hóa đơn"
                    required
                  />

                  <Input
                    label="Phụ đề / Khẩu hiệu quán"
                    value={settings.storeSubtitle || ''}
                    onChange={(e) => handleFieldChange('storeSubtitle', e.target.value)}
                    placeholder="Nhập mô tả"
                    helperText="Mô tả ngắn gọn về loại hình kinh doanh"
                  />

                  <Input
                    label="Số điện thoại / Hotline"
                    icon={Phone}
                    value={settings.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="090 123 4567"
                    helperText="Hotline hỗ trợ khách hàng in trên phiếu"
                  />

                  <Input
                    label="Địa chỉ quán"
                    icon={MapPin}
                    value={settings.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ"
                    helperText="Địa chỉ kinh doanh in trực tiếp trên phiếu tính tiền"
                    required
                  />

                  <Input
                    label="Tên Wi-Fi"
                    icon={Wifi}
                    value={settings.wifiName || ''}
                    onChange={(e) => handleFieldChange('wifiName', e.target.value)}
                    placeholder="Ví dụ: QUAN_NHO_WIFI"
                    helperText="Tên Wi-Fi miễn phí dành cho khách"
                  />

                  <Input
                    label="Mật khẩu Wi-Fi"
                    value={settings.wifiPass || ''}
                    onChange={(e) => handleFieldChange('wifiPass', e.target.value)}
                    placeholder="Nhập mật khẩu Wi-Fi"
                    helperText="Mật khẩu Wi-Fi in trên bill để khách kết nối"
                  />

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#F5EFEB] cursor-pointer transition select-none">
                      <input
                        type="checkbox"
                        checked={settings.show_wifi_on_receipt !== false}
                        onChange={(e) => handleFieldChange('show_wifi_on_receipt', e.target.checked)}
                        className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35]"
                      />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-[#2D1B14] block">
                          In thông tin Wi-Fi lên hóa đơn
                        </span>
                        <span className="text-xs text-stone-500">
                          Hiển thị tên Wi-Fi và mật khẩu ở phần đầu hóa đơn thanh toán
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Câu chúc / Cảm ơn chân hóa đơn"
                      icon={FileText}
                      value={settings.receiptFooterMessage || ''}
                      onChange={(e) => handleFieldChange('receiptFooterMessage', e.target.value)}
                      placeholder="Ví dụ: Cảm ơn quý khách, hẹn gặp lại!"
                      helperText="Lời cảm ơn và lời chúc thân thiện in ở cuối hóa đơn"
                    />
                  </div>
                </div>

                {/* Thanh lưu ở cuối form để thuận tiện khi kéo xuống */}
                <div className="pt-4 border-t border-[#F5EFEB] flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    icon={Printer}
                    loading={loadingTestPrint}
                    onClick={handleOpenTestPrint}
                    className="text-xs font-bold"
                  >
                    Xem/in đơn gần nhất
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Save}
                    loading={saving}
                    className="text-xs font-bold bg-[#2D1B14] hover:bg-[#3E2723] px-6"
                  >
                    Lưu cài đặt
                  </Button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: CỔNG SEPAY */}
            {/* ========================================================================= */}
            {activeTab === 'payment' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Trạng thái kết nối */}
                <div className="p-5 sm:p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                        Cấu hình SePay API Key
                      </h3>
                    </div>

                    {sepaySettings?.is_configured ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Đã lưu API Key webhook: {sepaySettings.masked_key || `••••••••${sepaySettings.api_key_last4}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Chưa cấu hình SePay
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    Khóa webhook đã lưu được giữ kín nên ô nhập sẽ để trống khi mở lại trang. Nút <strong>Kiểm tra kết nối</strong> kiểm tra máy chủ có cấu hình khóa đã lưu hay chưa; thao tác này không lưu payload, xử lý giao dịch hay cập nhật đơn. Để kiểm tra SePay gọi được URL công khai, dùng <strong>Gửi thử</strong> trên dashboard SePay.
                  </p>

                  {/* Form dán API Key */}
                  <form onSubmit={handleSaveSepayKey} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center pt-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={sepayApiKeyInput}
                        onChange={(e) => setSepayApiKeyInput(e.target.value)}
                        placeholder="Nhập SePay API Key"
                        className="w-full px-4 py-2.5 pr-10 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#C88A35] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      icon={Wifi}
                      loading={testingSepay}
                      disabled={savingSepay || testingSepay || !sepaySettings?.is_configured}
                      onClick={handleTestSepayConnection}
                      className="shrink-0 text-xs font-bold"
                    >
                      Kiểm tra kết nối
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Key}
                      loading={savingSepay}
                      className="shrink-0 bg-[#2D1B14] hover:bg-[#3E2723] text-xs font-bold"
                    >
                      Lưu SePay Key
                    </Button>
                  </form>

                  {sepayTestResult && (
                    <p role="status" className={`text-xs font-medium ${sepayTestResult.connected ? 'text-emerald-700' : 'text-red-600'}`}>
                      {sepayTestResult.message}
                    </p>
                  )}

                  <div className="space-y-2 pt-3 border-t border-stone-200">
                    <label htmlFor="sepay-webhook-url" className="text-xs font-bold text-stone-700">URL nhận webhook</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id="sepay-webhook-url"
                        readOnly
                        value={sepayWebhookUrl}
                        className="flex-1 min-w-0 px-3 py-2.5 text-xs bg-white border border-stone-300 rounded-xl text-stone-700 font-mono"
                      />
                      <Button type="button" variant="outline" icon={Copy} onClick={handleCopySepayWebhookUrl} className="shrink-0 text-xs font-bold">
                        Sao chép URL
                      </Button>
                    </div>
                    <p className="text-xs text-stone-500">
                      Dùng nút Gửi thử của SePay để xác nhận server nhận được request. Endpoint này chỉ phục vụ kiểm tra kết nối, không dùng để xác nhận thanh toán thật.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: TÀI KHOẢN & MẬT KHẨU */}
            {/* ========================================================================= */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. KHỐI TỔNG QUAN TÀI KHOẢN & LỊCH SỬ HOẠT ĐỘNG */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FAF7F2] to-[#F5EFE6] border border-[#E8DFD5] shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C88A35] to-[#8C4A16] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="font-black text-[#2D1B14] text-lg sm:text-xl">
                            {currentUser?.fullName || currentUser?.name || 'Chủ quán'}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#2D1B14] text-[#E09F3E] uppercase tracking-wider">
                            {currentUser?.role || 'OWNER'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-[#2D1B14]">
                            <Phone className="w-3.5 h-3.5 text-[#C88A35]" />
                            <span>{currentUser?.phone || currentUser?.username || 'Chưa cập nhật SĐT'}</span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">Bắt buộc</span>
                          </span>
                          {currentUser?.email ? (
                            <span className="flex items-center gap-1 text-stone-600">
                              <Mail className="w-3.5 h-3.5 text-stone-400" />
                              <span>{currentUser.email}</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 italic flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-stone-300" />
                              Chưa có email
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Toàn quyền quản trị quán</span>
                    </div>
                  </div>

                  {/* Lịch sử tài khoản: Đăng nhập & Cập nhật */}
                  <div className="pt-4 border-t border-[#E8DFD5] grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white border border-[#E8DFD5]/80 shadow-2xs">
                      <div className="flex items-center gap-2 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đăng nhập gần nhất</span>
                      </div>
                      <p className="mt-1.5 font-bold text-stone-800 text-xs sm:text-sm">
                        {formatDateTime(currentUser?.lastLoginAt)}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#E8DFD5]/80 shadow-2xs">
                      <div className="flex items-center gap-2 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                        <History className="w-3.5 h-3.5 text-sky-600" />
                        <span>Cập nhật gần nhất</span>
                      </div>
                      <p className="mt-1.5 font-bold text-stone-800 text-xs sm:text-sm">
                        {formatDateTime(currentUser?.updatedAt)}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-[#E8DFD5]/80 shadow-2xs">
                      <div className="flex items-center gap-2 text-stone-500 text-[11px] font-bold uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-[#C88A35]" />
                        <span>Ngày tạo tài khoản</span>
                      </div>
                      <p className="mt-1.5 font-bold text-stone-800 text-xs sm:text-sm">
                        {formatDateTime(currentUser?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. FORM CẬP NHẬT THÔNG TIN: TÊN, PHONE (BẮT BUỘC), EMAIL (TÙY CHỌN) */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-5">
                  <div className="border-b border-stone-100 pb-3">
                    <h2 className="font-bold text-[#2D1B14] text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-[#C88A35]" />
                      Thông tin cá nhân & Số điện thoại đăng nhập
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Chỉnh sửa họ tên, số điện thoại chính dùng để đăng nhập và email liên kết
                    </p>
                  </div>

                  {profileError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                    <Input
                      label="Họ và tên chủ quán"
                      icon={User}
                      value={profileForm.fullName}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, fullName: e.target.value })
                        if (profileError) setProfileError('')
                      }}
                      placeholder="Ví dụ: Huỳnh Tấn Phong"
                      helperText="Tên hiển thị của chủ quán trên hệ thống"
                      required
                    />

                    <Input
                      label="Số điện thoại đăng nhập (Bắt buộc)"
                      icon={Phone}
                      value={profileForm.phone}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, phone: e.target.value })
                        if (profileError) setProfileError('')
                      }}
                      placeholder="Ví dụ: 0901234567"
                      helperText="Số điện thoại chính bắt buộc dùng để đăng nhập vào POS"
                      required
                    />

                    <Input
                      label="Email liên kết (Không bắt buộc)"
                      icon={Mail}
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, email: e.target.value })
                        if (profileError) setProfileError('')
                      }}
                      placeholder="chuan@quannho.vn (có thể để trống)"
                      helperText="Không bắt buộc. Dùng để đăng nhập phụ hoặc nhận thông báo nếu cần"
                    />

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        icon={Save}
                        loading={savingProfile}
                        disabled={!profileForm.fullName.trim() || !profileForm.phone.trim() || savingProfile}
                        className="bg-[#2D1B14] hover:bg-[#3E2723] text-xs font-bold shadow-sm"
                      >
                        Lưu thông tin tài khoản
                      </Button>
                    </div>
                  </form>
                </div>

                {/* 3. FORM ĐỔI MẬT KHẨU ĐĂNG NHẬP */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-5">
                  <div className="border-b border-stone-100 pb-3">
                    <h2 className="font-bold text-[#2D1B14] text-base flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#C88A35]" />
                      Đổi mật khẩu đăng nhập
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Vui lòng nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn (tối thiểu 6 ký tự)
                    </p>
                  </div>

                  {passwordError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                    {/* Mật khẩu hiện tại */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Mật khẩu hiện tại <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value)
                            if (passwordError) setPasswordError('')
                          }}
                          placeholder="Nhập mật khẩu đang dùng"
                          className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm font-semibold rounded-xl border border-[#D4C7B8] focus:border-[#C88A35] focus:ring-2 focus:ring-[#C88A35]/20 focus:outline-none bg-stone-50/40 focus:bg-white transition-all"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Mật khẩu mới <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value)
                            if (passwordError) setPasswordError('')
                          }}
                          placeholder="Tối thiểu 6 ký tự"
                          className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm font-semibold rounded-xl border border-[#D4C7B8] focus:border-[#C88A35] focus:ring-2 focus:ring-[#C88A35]/20 focus:outline-none bg-stone-50/40 focus:bg-white transition-all"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            if (passwordError) setPasswordError('')
                          }}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm font-semibold rounded-xl border border-[#D4C7B8] focus:border-[#C88A35] focus:ring-2 focus:ring-[#C88A35]/20 focus:outline-none bg-stone-50/40 focus:bg-white transition-all"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        icon={Save}
                        loading={changingPassword}
                        disabled={!currentPassword || !newPassword || !confirmPassword || changingPassword}
                        className="bg-[#2D1B14] hover:bg-[#3E2723] text-xs font-bold shadow-sm"
                      >
                        Cập nhật mật khẩu
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Khôi Phục Cài Đặt Gốc */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Khôi Phục Cài Đặt Mặc Định"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Bạn có chắc chắn muốn đặt lại cài đặt gốc?</p>
              <p className="text-amber-800">
                Các tùy chọn in và Wi-Fi sẽ được đặt lại. Tên, địa chỉ quán và khóa SePay được giữ nguyên.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetModalOpen(false)}
              className="text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={saving}
              onClick={handleConfirmReset}
              className="text-xs font-bold"
            >
              Xác nhận đặt lại
            </Button>
          </div>
        </div>
      </Modal>

      <ReceiptModal
        isOpen={isTestPrintOpen}
        onClose={() => setIsTestPrintOpen(false)}
        order={testPrintOrder}
        initialPrintType="both"
        customSettings={settings}
      />

    </div>
  )
}
