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
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import ReceiptModal from '../../components/print/ReceiptModal'
import { orderApi } from '../../api/orderApi'
import { settingsApi } from '../../api/settingsApi'
import { getLatestOrderForPreview } from '../../utils/receiptPrintSettings'
import { useToast } from '../../context/ToastContext'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store') // 'store' | 'payment'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)
  const [sepaySettings, setSepaySettings] = useState(null)
  const [sepayApiKeyInput, setSepayApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingSepay, setSavingSepay] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isTestPrintOpen, setIsTestPrintOpen] = useState(false)
  const [testPrintOrder, setTestPrintOrder] = useState(null)
  const [loadingTestPrint, setLoadingTestPrint] = useState(false)
  const toast = useToast()

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
                Cấu hình thông tin in hóa đơn và kết nối cổng thanh toán SePay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              icon={RotateCcw}
              onClick={() => setIsResetModalOpen(true)}
              className="text-xs"
            >
              Khôi phục mặc định
            </Button>

            {activeTab === 'store' && (
              <>
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
                        Đã lưu khóa, chưa kết nối thanh toán: {sepaySettings.masked_key || `••••••••${sepaySettings.api_key_last4}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Chưa cấu hình SePay
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    SePay chưa được tích hợp để nhận hoặc đối soát giao dịch. API Key hiện chỉ được băm và lưu; nhập khóa chưa bật thanh toán chuyển khoản. Giao diện chỉ hiện 4 số cuối dạng <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-700">••••••••1234</code>.
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
                      type="submit"
                      variant="primary"
                      icon={Key}
                      loading={savingSepay}
                      className="shrink-0 bg-[#2D1B14] hover:bg-[#3E2723] text-xs font-bold"
                    >
                      Lưu SePay Key
                    </Button>
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
