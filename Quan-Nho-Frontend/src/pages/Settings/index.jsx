import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Store,
  CreditCard,
  Printer,
  Monitor,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  QrCode,
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
} from 'lucide-react'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { settingsApi } from '../../api/settingsApi'
import { useToast } from '../../context/ToastContext'

const POPULAR_BANKS = [
  'MB Bank (Quân Đội)',
  'Vietcombank',
  'Techcombank',
  'ACB (Á Châu)',
  'BIDV',
  'VPBank',
  'Agribank',
  'TPBank',
  'Sacombank',
  'VIB',
  'HDBank',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('store') // 'store' | 'payment' | 'print' | 'display'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)
  const [sepaySettings, setSepaySettings] = useState(null)
  const [sepayApiKeyInput, setSepayApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingSepay, setSavingSepay] = useState(false)
  const [qrPreviewUrl, setQrPreviewUrl] = useState('')
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)

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

  // Generate live VietQR preview whenever bank info changes
  useEffect(() => {
    if (settings?.bankAccountNumber && settings?.bankName) {
      const bankCode = settings.bankName.includes('MB') ? 'MB' : 'VCB'
      const sampleUrl = `https://img.vietqr.io/image/${bankCode}-${settings.bankAccountNumber}-compact2.png?amount=50000&addInfo=${encodeURIComponent(
        (settings.transferContentPrefix || 'QUAN NHO') + ' TEST'
      )}&accountName=${encodeURIComponent(settings.bankAccountName || '')}`

      QRCode.toDataURL(sampleUrl, {
        width: 220,
        margin: 1,
        color: { dark: '#2D1B14', light: '#ffffff' },
      })
        .then((url) => setQrPreviewUrl(url))
        .catch(() => setQrPreviewUrl(''))
    }
  }, [settings?.bankAccountNumber, settings?.bankName, settings?.bankAccountName, settings?.transferContentPrefix])

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

      // 1. Lưu shop_settings chuẩn DB (Table 10)
      await settingsApi.updateShopSettings({
        id: 1,
        shop_name: settings.storeName || settings.shop_name || 'Quán Nhỏ',
        shop_address: settings.address || settings.shop_address || '',
        wifi_name: settings.wifiName || settings.wifi_name || '',
        wifi_password_encrypted: settings.wifiPass || settings.wifi_password_encrypted || '',
        receipt_message: settings.receiptFooterMessage || settings.receipt_message || '',
        show_wifi_on_receipt: settings.show_wifi_on_receipt !== false,
      })

      // 2. Lưu store settings tổng hợp
      const updated = await settingsApi.updateSettings(settings)
      setSettings((prev) => ({ ...prev, ...updated }))
      toast.success('Đã lưu cấu hình cài đặt quán thành công!')
    } catch (err) {
      toast.error('Lỗi khi lưu cài đặt: ' + err.message)
    } finally {
      setSaving(false)
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
      const sepay = await settingsApi.getSepaySettings()
      setSettings(defaults)
      setSepaySettings(sepay)
      setIsResetModalOpen(false)
      toast.success('Đã khôi phục cài đặt mặc định của quán!')
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
    { id: 'store', label: 'Thông tin in bill (shop_settings)', icon: Store },
    { id: 'payment', label: 'Cổng SePay & VietQR', icon: CreditCard },
    { id: 'print', label: 'Máy in & Hóa đơn', icon: Printer },
    { id: 'display', label: 'Màn hình khách', icon: Monitor },
  ]

  return (
    <div className="flex-1 bg-[#F8F5F0] overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8DFD5] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FAF7F2] text-[#C88A35] border border-[#E8DFD5]">
                <Sliders className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#2D1B14] tracking-tight">
                Cài Đặt Hệ Thống Quán
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Khớp chuẩn 11 bảng database: Thông tin in bill (shop_settings) & Cổng SePay (sepay_settings)
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
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
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#2D1B14] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-[#E8DFD5] hover:bg-[#FAF7F2] hover:text-[#2D1B14]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C88A35]' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFD5] shadow-sm space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: THÔNG TIN IN BILL (shop_settings) */}
          {/* ========================================================================= */}
          {activeTab === 'store' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#F5EFEB] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#2D1B14]">Thông Tin In Hóa Đơn (shop_settings)</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Bảng database <code className="bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-700">shop_settings</code> chỉ phục vụ thông tin in bill cho khách hàng
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
                  shop_settings
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Tên quán (shop_name)"
                  icon={Store}
                  value={settings.storeName || ''}
                  onChange={(e) => handleFieldChange('storeName', e.target.value)}
                  placeholder="Ví dụ: Quán Nhỏ"
                  helperText="Tên quán in to rõ ở đầu hóa đơn"
                  required
                />

                <Input
                  label="Phụ đề / Khẩu hiệu quán"
                  value={settings.storeSubtitle || ''}
                  onChange={(e) => handleFieldChange('storeSubtitle', e.target.value)}
                  placeholder="Ví dụ: Cà phê & Đồ ăn vặt"
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

                <div className="sm:col-span-2">
                  <Input
                    label="Địa chỉ quán (shop_address)"
                    icon={MapPin}
                    value={settings.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="Ví dụ: 123 Nguyễn Văn A"
                    helperText="Địa chỉ kinh doanh in trực tiếp trên phiếu tính tiền"
                    required
                  />
                </div>

                <Input
                  label="Tên Wi-Fi (wifi_name)"
                  icon={Wifi}
                  value={settings.wifiName || ''}
                  onChange={(e) => handleFieldChange('wifiName', e.target.value)}
                  placeholder="Ví dụ: QUAN_NHO_WIFI"
                  helperText="Tên Wi-Fi miễn phí dành cho khách"
                />

                <Input
                  label="Mật khẩu Wi-Fi (wifi_password_encrypted)"
                  value={settings.wifiPass || ''}
                  onChange={(e) => handleFieldChange('wifiPass', e.target.value)}
                  placeholder="quannho888"
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
                        In thông tin Wi-Fi lên hóa đơn (show_wifi_on_receipt)
                      </span>
                      <span className="text-xs text-stone-500">
                        Hiển thị tên Wi-Fi và mật khẩu ở phần chân phiếu thanh toán
                      </span>
                    </div>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Câu chúc / Cảm ơn chân hóa đơn (receipt_message)"
                    icon={FileText}
                    value={settings.receiptFooterMessage || ''}
                    onChange={(e) => handleFieldChange('receiptFooterMessage', e.target.value)}
                    placeholder="Ví dụ: Cảm ơn quý khách, hẹn gặp lại!"
                    helperText="Lời cảm ơn và lời chúc thân thiện in ở cuối hóa đơn"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CỔNG SEPAY & VIETQR */}
          {/* ========================================================================= */}
          {activeTab === 'payment' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#F5EFEB] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#2D1B14]">Cấu Hình Cổng SePay & Chuyển Khoản VietQR</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Tích hợp tự động nhận diện thanh toán SePay và sinh mã VietQR động
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg">
                  sepay_settings
                </span>
              </div>

              {/* SEPAY API KEY SECTION (Theo đúng đặc tả: chỉ có ô dán API Key) */}
              <div className="p-5 sm:p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                      Cấu hình SePay API Key (sepay_settings)
                    </h3>
                  </div>

                  {sepaySettings?.is_configured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã kết nối: {sepaySettings.masked_key || `••••••••${sepaySettings.api_key_last4}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Chưa cấu hình SePay
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Trang cài đặt chỉ có ô dán API Key. Khi lưu, API Key trong database sẽ được mã hóa an toàn. Frontend không được nhận lại API Key đầy đủ, chỉ nhận lại 4 số cuối dạng <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-700">••••••••1234</code>.
                </p>

                {/* Form dán API Key */}
                <form onSubmit={handleSaveSepayKey} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={sepayApiKeyInput}
                      onChange={(e) => setSepayApiKeyInput(e.target.value)}
                      placeholder="Dán SePay API Key tại đây (Ví dụ: SP_LIVE_xxxx1234)..."
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

              {/* TÀI KHOẢN NGÂN HÀNG & VIETQR PREVIEW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Thông Tin Tài Khoản Nhận Chuyển Khoản
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-1.5">
                      Ngân hàng thụ hưởng
                    </label>
                    <select
                      value={settings.bankName || 'MB Bank'}
                      onChange={(e) => handleFieldChange('bankName', e.target.value)}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-[#D4C7B8] rounded-xl text-[#2D1B14] focus:outline-none focus:ring-2 focus:ring-[#C88A35]"
                    >
                      {POPULAR_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Số tài khoản ngân hàng"
                    value={settings.bankAccountNumber || ''}
                    onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value.replace(/\s/g, ''))}
                    placeholder="Ví dụ: 0901234567"
                    helperText="Số tài khoản nhận tiền chính thức của quán"
                    required
                  />

                  <Input
                    label="Tên chủ tài khoản (In hoa không dấu)"
                    value={settings.bankAccountName || ''}
                    onChange={(e) => handleFieldChange('bankAccountName', e.target.value.toUpperCase())}
                    placeholder="Ví dụ: QUAN NHO COFFEE"
                    helperText="Tên đăng ký tài khoản ngân hàng"
                    required
                  />

                  <Input
                    label="Tiền tố nội dung chuyển khoản"
                    value={settings.transferContentPrefix || ''}
                    onChange={(e) => handleFieldChange('transferContentPrefix', e.target.value.toUpperCase())}
                    placeholder="Ví dụ: QUAN NHO"
                    helperText="Cú pháp tự động điền: [Tiền tố] + [Mã đơn QN-xxx]"
                  />
                </div>

                {/* Live QR Preview */}
                <div className="lg:col-span-5 bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8DFD5] text-center space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A43] flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#C88A35]" />
                    <span>Xem trước mã VietQR quét thử:</span>
                  </span>

                  <div className="p-4 bg-white rounded-2xl border-2 border-[#C88A35] inline-block shadow-sm">
                    {qrPreviewUrl ? (
                      <img
                        src={qrPreviewUrl}
                        alt="VietQR Preview"
                        className="w-48 h-48 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-stone-100 flex items-center justify-center rounded-lg text-stone-400">
                        Chưa có mã QR
                      </div>
                    )}
                    <div className="mt-2 text-center text-xs font-bold text-[#2D1B14]">
                      {settings.bankName} • {settings.bankAccountNumber}
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
                    Mã VietQR tự động khớp tài khoản và tự điền mã đơn hàng tương thích webhook SePay.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MÁY IN & HÓA ĐƠN */}
          {/* ========================================================================= */}
          {activeTab === 'print' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#F5EFEB] pb-4">
                <h2 className="text-lg font-black text-[#2D1B14]">Cấu Hình Máy In Nhiệt & Phiếu In</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tối ưu hóa bản in nhiệt tương thích máy in K80 (80mm) và K58 (58mm)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Khổ giấy in */}
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] space-y-2">
                  <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Khổ giấy in mặc định
                  </label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('defaultPaperSize', '80mm')}
                      className={`p-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        settings.defaultPaperSize === '80mm'
                          ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                          : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                      }`}
                    >
                      K80 (80mm - Phổ biến)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('defaultPaperSize', '58mm')}
                      className={`p-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        settings.defaultPaperSize === '58mm'
                          ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                          : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                      }`}
                    >
                      K58 (58mm - Nhỏ gọn)
                    </button>
                  </div>
                </div>

                {/* Chế độ in mặc định */}
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] space-y-2">
                  <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Chế độ in mặc định khi thanh toán
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('defaultPrintMode', 'both')}
                      className={`p-2.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        settings.defaultPrintMode === 'both'
                          ? 'bg-[#C88A35] text-white border-[#C88A35] shadow-xs'
                          : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                      }`}
                    >
                      Cả 2 liên
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('defaultPrintMode', 'customer')}
                      className={`p-2.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        settings.defaultPrintMode === 'customer'
                          ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                          : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                      }`}
                    >
                      Chỉ Khách
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('defaultPrintMode', 'kitchen')}
                      className={`p-2.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                        settings.defaultPrintMode === 'kitchen'
                          ? 'bg-[#3E2723] text-white border-[#3E2723] shadow-xs'
                          : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                      }`}
                    >
                      Chỉ Bếp
                    </button>
                  </div>
                </div>

                {/* Tiêu đề phiếu bếp */}
                <div className="sm:col-span-2">
                  <Input
                    label="Tiêu đề in trên phiếu chế biến của Bếp"
                    value={settings.kitchenTitle || ''}
                    onChange={(e) => handleFieldChange('kitchenTitle', e.target.value)}
                    placeholder="*** PHIẾU BÁO CHẾ BIẾN (BẾP / BAR) ***"
                    helperText="Dòng chữ nổi bật in hoa ở đầu phiếu để bếp dễ phân biệt"
                  />
                </div>

                {/* Các checkbox tùy chọn */}
                <div className="sm:col-span-2 space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#F5EFEB] cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={settings.autoOpenPrint || false}
                      onChange={(e) => handleFieldChange('autoOpenPrint', e.target.checked)}
                      className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35]"
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-[#2D1B14] block">
                        Tự động mở hộp thoại in sau khi bấm Xác nhận thanh toán
                      </span>
                      <span className="text-xs text-stone-500">
                        Giúp thao tác bán hàng 1-chạm không cần bấm thêm nút in
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#F5EFEB] cursor-pointer transition select-none">
                    <input
                      type="checkbox"
                      checked={settings.showQrOnReceipt ?? true}
                      onChange={(e) => handleFieldChange('showQrOnReceipt', e.target.checked)}
                      className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35]"
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-[#2D1B14] block">
                        In mã QR tra cứu trạng thái đơn hàng trên hóa đơn khách
                      </span>
                      <span className="text-xs text-stone-500">
                        Khách có thể quét mã QR trên bill để theo dõi trạng thái đơn hàng
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MÀN HÌNH KHÁCH */}
          {/* ========================================================================= */}
          {activeTab === 'display' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#F5EFEB] pb-4">
                <h2 className="text-lg font-black text-[#2D1B14]">Cấu Hình Màn Hình Khách (Customer Facing Display)</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tùy chỉnh giao diện hiển thị trên màn hình phụ / tablet quay về phía khách hàng tại quầy
                </p>
              </div>

              <div className="space-y-5">
                <Input
                  label="Tiêu đề chào mừng trên màn hình chờ"
                  value={settings.customerDisplayWelcomeTitle || ''}
                  onChange={(e) => handleFieldChange('customerDisplayWelcomeTitle', e.target.value)}
                  placeholder="Hương vị thân quen, Gửi trọn yêu thương"
                  helperText="Dòng thông điệp lớn xuất hiện khi màn hình ở trạng thái chờ khách"
                />

                <Input
                  label="Phụ đề lời chào"
                  value={settings.customerDisplaySubtitle || ''}
                  onChange={(e) => handleFieldChange('customerDisplaySubtitle', e.target.value)}
                  placeholder="Vui lòng xem menu và gọi món tại quầy. Chúng tôi luôn sẵn sàng phục vụ bạn!"
                  helperText="Thông điệp hướng dẫn phụ đặt dưới tiêu đề chào mừng"
                />

                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD5] space-y-2">
                  <label className="block text-xs font-bold text-[#3E2723] uppercase tracking-wider">
                    Thời gian tự động quay về màn hình chờ sau khi thanh toán xong
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { seconds: 3, label: '3 Giây (Nhanh)' },
                      { seconds: 5, label: '5 Giây (Mặc định)' },
                      { seconds: 8, label: '8 Giây' },
                      { seconds: 10, label: '10 Giây (Dài)' },
                    ].map((item) => (
                      <button
                        key={item.seconds}
                        type="button"
                        onClick={() => handleFieldChange('autoResetDelaySeconds', item.seconds)}
                        className={`p-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                          settings.autoResetDelaySeconds === item.seconds
                            ? 'bg-[#2D1B14] text-white border-[#2D1B14] shadow-xs'
                            : 'bg-white text-stone-700 border-[#D4C7B8] hover:bg-stone-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#F5EFEB] cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={settings.showFeaturedItems ?? true}
                    onChange={(e) => handleFieldChange('showFeaturedItems', e.target.checked)}
                    className="w-4 h-4 rounded text-[#C88A35] accent-[#C88A35]"
                  />
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[#2D1B14] block">
                      Hiển thị danh sách món đặc sắc / nổi bật trên màn hình chờ
                    </span>
                    <span className="text-xs text-stone-500">
                      Gợi ý các món bán chạy của quán khi khách hàng đang đứng chờ gọi món
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
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
                Toàn bộ thông tin in bill, SePay API Key, VietQR và cấu hình màn hình khách sẽ được đưa về giá trị thiết lập ban đầu.
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
    </div>
  )
}
