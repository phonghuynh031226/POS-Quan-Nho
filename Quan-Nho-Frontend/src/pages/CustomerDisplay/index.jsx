import { useState, useEffect, useTransition } from 'react'
import QRCode from 'qrcode'
import {
  Coffee,
  ShoppingBag,
  CheckCircle2,
  QrCode,
  Banknote,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  Heart,
  ArrowRight,
} from 'lucide-react'
import {
  DISPLAY_STATES,
  getDisplayState,
  subscribeDisplayState,
  sendDisplayState,
} from '../../utils/customerDisplaySync'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { mockDb } from '../../api/mockDb'

// Danh sách món nổi bật giới thiệu khi ở màn hình chờ
const FEATURED_ITEMS = [
  {
    name: 'Cà phê sữa đá truyền thống',
    price: 29000,
    tag: 'Bán chạy nhất',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
    desc: 'Đậm đà cà phê Robusta rang mộc kết hợp sữa đặc ngọt béo',
  },
  {
    name: 'Bạc xỉu kem sữa 3 tầng',
    price: 32000,
    tag: 'Đặc sản quán',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60',
    desc: 'Nhiều sữa tươi béo thơm, ngọt thanh nhẹ nhàng',
  },
  {
    name: 'Trà đào cam sả thanh mát',
    price: 35000,
    tag: 'Món giải nhiệt',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60',
    desc: 'Trà đen hảo hạng quyện hương sả và lát đào giòn ngọt',
  },
]

export default function CustomerDisplayPage() {
  const [storeSettings, setStoreSettings] = useState(() => mockDb.getStoreSettings())
  const [displayData, setDisplayData] = useState(() => getDisplayState())
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [countdown, setCountdown] = useState(() => storeSettings.autoResetDelaySeconds || 5)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Đồng hồ thời gian thực & Lắng nghe settings
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    const unsub = mockDb.subscribe((e) => {
      if (e?.type === 'SETTINGS_UPDATED') {
        setStoreSettings(mockDb.getStoreSettings())
      }
    })
    return () => {
      clearInterval(timer)
      unsub()
    }
  }, [])

  // Đăng ký nhận sự kiện realtime từ quầy POS
  useEffect(() => {
    const unsubscribe = subscribeDisplayState((newState) => {
      if (newState) {
        setDisplayData(newState)
      }
    })
    return unsubscribe
  }, [])

  // Sinh mã QR khi trạng thái là thanh toán chuyển khoản
  useEffect(() => {
    if (
      displayData.type === DISPLAY_STATES.PAYMENT &&
      displayData.paymentMethod === 'CHUYEN_KHOAN' &&
      displayData.totalAmount > 0
    ) {
      const amount = displayData.totalAmount
      const orderCode = displayData.orderNumber || 'QN' + Date.now().toString().slice(-4)
      const bankCode = storeSettings.bankName?.includes('MB') ? 'MB' : 'VCB'
      const prefix = storeSettings.transferContentPrefix || 'QUAN NHO'
      const accNumber = storeSettings.bankAccountNumber || '0901234567'
      const accName = storeSettings.bankAccountName || 'QUAN NHO COFFEE'

      // Tạo cú pháp VietQR mẫu chuẩn
      const qrContent = `https://img.vietqr.io/image/${bankCode}-${accNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
        prefix + ' ' + orderCode
      )}&accountName=${encodeURIComponent(accName)}`

      QRCode.toDataURL(qrContent, {
        width: 280,
        margin: 1,
        color: {
          dark: '#2D1B14',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch(() => {
          setQrCodeUrl('')
        })
    }
  }, [displayData, storeSettings])

  // Đếm ngược khi thanh toán thành công rồi tự động quay về Màn hình chờ
  useEffect(() => {
    let timer = null
    const delay = storeSettings.autoResetDelaySeconds || 5
    if (displayData.type === DISPLAY_STATES.SUCCESS) {
      setCountdown(delay)
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            sendDisplayState({ type: DISPLAY_STATES.IDLE })
            return delay
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [displayData.type, storeSettings.autoResetDelaySeconds])

  // Toggle Toàn màn hình
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Format danh sách tùy chọn của món
  const renderItemOptions = (item) => {
    if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
      return item.selectedOptions.map((o) => {
        const priceStr = o.extraPrice > 0 ? ` (+${formatCurrency(o.extraPrice)})` : ''
        return `${o.groupName ? `${o.groupName}: ` : ''}${o.optionName}${priceStr}`
      })
    }
    if (item.options) {
      return Object.entries(item.options)
        .filter(([k, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
        .map(([k, v]) => (Array.isArray(v) ? v.map((t) => t.name).join(', ') : v))
    }
    return []
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#2D1B14] flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="bg-[#2D1B14] text-white px-6 py-4 flex items-center justify-between shadow-md border-b border-[#3E2723]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C88A35] flex items-center justify-center text-white shadow-sm font-black">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg tracking-tight text-[#FDFBF7]">
                {storeSettings.storeName || 'QUÁN NHỎ'}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#4A2E20] text-[#E09F3E]">
                MÀN HÌNH KHÁCH
              </span>
            </div>
            <p className="text-xs text-[#D4C7B8]">
              {storeSettings.storeSubtitle || 'Cà phê & Đồ ăn vặt thơm ngon'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E8DFD5] bg-[#3E2723] px-3 py-1.5 rounded-xl border border-[#543828]">
            <Clock className="w-4 h-4 text-[#C88A35]" />
            <span>
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="p-2 rounded-xl bg-[#3E2723] hover:bg-[#4A2E20] text-[#E8DFD5] hover:text-white border border-[#543828] transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
        {/* ================================================================================= */}
        {/* TRẠNG THÁI 1: MÀN HÌNH CHỜ (IDLE) */}
        {/* ================================================================================= */}
        {displayData.type === DISPLAY_STATES.IDLE && (
          <div className="flex-1 flex flex-col justify-center items-center py-8 space-y-8 animate-in fade-in duration-300">
            {/* Welcome banner */}
            <div className="text-center space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFE9E0] text-[#7A5A43] text-xs font-extrabold uppercase tracking-wider border border-[#D4C7B8]">
                <Sparkles className="w-4 h-4 text-[#C88A35]" />
                <span>Chào mừng Quý khách đến với {storeSettings.storeName || 'Quán Nhỏ'}</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#2D1B14] leading-tight">
                {storeSettings.customerDisplayWelcomeTitle || 'Hương vị thân quen, Gửi trọn yêu thương'}
              </h2>

              <p className="text-base text-stone-600 font-medium">
                {storeSettings.customerDisplaySubtitle ||
                  'Vui lòng xem menu và gọi món tại quầy. Chúng tôi luôn sẵn sàng phục vụ bạn!'}
              </p>
            </div>

            {/* Featured Menu Cards */}
            {storeSettings.showFeaturedItems !== false && (
            <div className="w-full max-w-5xl">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7A5A43]">
                  Món đặc sắc hôm nay:
                </span>
                <span className="text-xs text-stone-500 font-medium">Thực đơn tươi mới mỗi ngày</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {FEATURED_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl overflow-hidden border border-[#E8DFD5] shadow-md hover:shadow-lg transition flex flex-col group"
                  >
                    <div className="h-44 overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-[#2D1B14]/85 backdrop-blur-xs text-[#E09F3E] text-[11px] font-extrabold px-2.5 py-1 rounded-lg">
                        {item.tag}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-extrabold text-base text-[#2D1B14] line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">{item.desc}</p>
                      </div>

                      <div className="pt-2 border-t border-[#F5EFEB] flex items-center justify-between">
                        <span className="text-base font-black text-[#C88A35]">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">Giá niêm yết</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Cảm ơn Quý khách đã ủng hộ {storeSettings.storeName || 'Quán Nhỏ'}</span>
            </div>
          </div>
        )}

        {/* ================================================================================= */}
        {/* TRẠNG THÁI 2: ĐANG GỌI MÓN (ORDERING) */}
        {/* ================================================================================= */}
        {displayData.type === DISPLAY_STATES.ORDERING && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Cột Trái: Danh sách món trong giỏ hàng (7 cột) */}
            <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-[#E8DFD5] shadow-md overflow-hidden">
              <div className="p-5 border-b border-[#E8DFD5] bg-[#FDFBF7] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EFE9E0] text-[#7A5A43] flex items-center justify-center font-black">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#2D1B14]">Đơn Hàng Của Quý Khách</h2>
                    <p className="text-xs text-stone-500">Đang cập nhật trực tiếp từ thu ngân</p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FAF7F2] text-[#C88A35] border border-[#D4C7B8]">
                  {displayData.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} phần món
                </span>
              </div>

              {/* Danh sách các dòng món */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 divide-y divide-[#F5EFEB]">
                {displayData.items?.map((item, idx) => {
                  const optList = renderItemOptions(item)

                  return (
                    <div key={item.lineId || idx} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#3E2723] text-white font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {item.quantity}
                        </span>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-sm sm:text-base text-[#2D1B14] truncate">
                            {item.name}
                          </h4>

                          {optList.length > 0 && (
                            <div className="text-xs text-stone-600 space-y-0.5 mt-1">
                              {optList.map((opt, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#C88A35] shrink-0" />
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <div className="text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 mt-1.5 inline-block font-semibold">
                              Ghi chú: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-sm sm:text-base text-[#2D1B14]">
                          {formatCurrency(item.lineTotal || (item.unitPrice + (item.surcharge || 0)) * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <div className="text-[11px] text-stone-400">
                            {formatCurrency(item.unitPrice + (item.surcharge || 0))}/ly
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cột Phải: Tổng kết số tiền to bản (5 cột) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl border border-[#E8DFD5] shadow-md p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                  ⚡ Đang ghi nhận món
                </div>

                <h3 className="text-xl font-bold text-[#2D1B14]">Tổng Thanh Toán</h3>
                <p className="text-xs text-stone-500">
                  Quý khách vui lòng kiểm tra danh sách món trước khi thu ngân chốt đơn.
                </p>

                <div className="p-6 rounded-2xl bg-[#F8F5F0] border border-[#E8DFD5] space-y-2">
                  <span className="text-xs font-bold uppercase text-stone-500 tracking-wider block">
                    TỔNG CỘNG CẦN TRẢ
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-[#C88A35] tracking-tight">
                    {formatCurrency(displayData.totalAmount || 0)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs text-stone-600 space-y-1">
                <p className="font-bold text-[#2D1B14]">Phương thức thanh toán hỗ trợ:</p>
                <p>• Tiền mặt tại quầy</p>
                <p>• Quét mã VietQR chuyển khoản (MB, Vietcombank, Momo, Techcombank...)</p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================================= */}
        {/* TRẠNG THÁI 3: THANH TOÁN (TIỀN MẶT HOẶC CHUYỂN KHOẢN VIETQR) */}
        {/* ================================================================================= */}
        {displayData.type === DISPLAY_STATES.PAYMENT && (
          <div className="flex-1 flex flex-col justify-center items-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-full max-w-4xl bg-white rounded-3xl border border-[#E8DFD5] shadow-xl overflow-hidden">
              {/* Header của trạng thái thanh toán */}
              <div className="p-5 sm:p-6 bg-[#2D1B14] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C88A35] flex items-center justify-center text-white">
                    {displayData.paymentMethod === 'TIEN_MAT' ? (
                      <Banknote className="w-6 h-6" />
                    ) : (
                      <QrCode className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[#FDFBF7]">
                      {displayData.paymentMethod === 'TIEN_MAT'
                        ? 'Thanh Toán Tiền Mặt'
                        : 'Thanh Toán Chuyển Khoản VietQR'}
                    </h2>
                    <p className="text-xs text-[#D4C7B8]">
                      {displayData.paymentMethod === 'TIEN_MAT'
                        ? 'Vui lòng đưa tiền mặt cho nhân viên tại quầy'
                        : 'Mở ứng dụng ngân hàng và quét mã QR bên dưới'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-300 uppercase tracking-wider block">
                    SỐ TIỀN CẦN TRẢ
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#E09F3E]">
                    {formatCurrency(displayData.totalAmount || 0)}
                  </span>
                </div>
              </div>

              {/* Nội dung chi tiết theo 2 nhánh rõ ràng */}
              <div className="p-6 sm:p-8">
                {/* 1. Nhánh Tiền Mặt */}
                {displayData.paymentMethod === 'TIEN_MAT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] text-center space-y-1">
                      <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                        Số tiền cần trả
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-[#2D1B14]">
                        {formatCurrency(displayData.totalAmount || 0)}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-[#D4C7B8] text-center space-y-1 shadow-xs">
                      <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                        Tiền khách đưa
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-stone-700">
                        {formatCurrency(displayData.cashGiven || 0)}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-1">
                      <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                        Tiền thối lại
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                        {formatCurrency(displayData.changeReturned || 0)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Nhánh Chuyển Khoản VietQR */}
                {displayData.paymentMethod === 'CHUYEN_KHOAN' && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
                    {/* Mã QR To Bản */}
                    <div className="p-4 bg-white rounded-2xl border-2 border-[#C88A35] shadow-md flex flex-col items-center">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="VietQR Quán Nhỏ"
                          className="w-56 h-56 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-56 h-56 bg-stone-100 flex items-center justify-center rounded-lg">
                          <QrCode className="w-28 h-28 text-stone-400" />
                        </div>
                      )}
                      <div className="text-center mt-2">
                        <span className="text-[11px] font-bold text-[#2D1B14] uppercase">
                          VIETQR QUÁN NHỎ
                        </span>
                        <div className="text-xs font-black text-[#C88A35]">
                          {formatCurrency(displayData.totalAmount || 0)}
                        </div>
                      </div>
                    </div>

                    {/* Hướng Dẫn Quét Mã */}
                    <div className="space-y-4 max-w-sm text-left">
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-[#2D1B14]">Quét Mã Để Thanh Toán</h4>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          Mã QR đã gắn sẵn số tiền <strong>{formatCurrency(displayData.totalAmount || 0)}</strong>.
                          Quý khách chỉ cần mở app Ngân hàng để quét và xác nhận.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] text-xs space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Ngân hàng:</span>
                          <span className="font-bold text-[#2D1B14]">
                            {storeSettings.bankName || 'MB Bank'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Chủ tài khoản:</span>
                          <span className="font-bold text-[#2D1B14]">
                            {storeSettings.bankAccountName || 'QUAN NHO COFFEE'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Số tài khoản:</span>
                          <span className="font-bold text-[#2D1B14] font-mono">
                            {storeSettings.bankAccountNumber || '0901234567'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 italic">
                        * Hệ thống sẽ tự động cập nhật ngay khi nhận được thông báo chuyển tiền thành công.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================================= */}
        {/* TRẠNG THÁI 4: THANH TOÁN THÀNH CÔNG (SUCCESS) */}
        {/* ================================================================================= */}
        {displayData.type === DISPLAY_STATES.SUCCESS && (
          <div className="flex-1 flex flex-col justify-center items-center py-6 animate-in zoom-in-95 duration-300">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E8DFD5] shadow-2xl p-8 sm:p-10 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                  ĐÃ THANH TOÁN XONG
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#2D1B14]">
                  Thanh Toán Thành Công!
                </h2>
                <p className="text-sm text-stone-600">
                  Cảm ơn Quý khách! Đơn hàng đã được chuyển tới quầy pha chế.
                </p>
              </div>

              {/* Số phiếu nhận món siêu to */}
              <div className="p-6 rounded-3xl bg-[#FAF7F2] border-2 border-[#C88A35] inline-block w-full max-w-md mx-auto space-y-1 shadow-sm">
                <span className="text-xs uppercase font-extrabold tracking-widest text-stone-500">
                  SỐ PHIẾU NHẬN MÓN
                </span>
                <div className="text-5xl sm:text-6xl font-black tracking-tight text-[#2D1B14]">
                  {displayData.orderNumber || 'QN-101'}
                </div>
                <p className="text-xs text-[#C88A35] font-bold pt-1">
                  Vui lòng giữ phiếu nhận món và chờ gọi số tại quầy
                </p>
              </div>

              {/* Thông tin phụ */}
              <div className="flex justify-center gap-6 text-xs text-stone-500 pt-2">
                <div>
                  Hình thức:{' '}
                  <strong className="text-[#2D1B14]">
                    {displayData.paymentMethod === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt'}
                  </strong>
                </div>
                <div>
                  Tổng tiền:{' '}
                  <strong className="text-[#2D1B14]">
                    {formatCurrency(displayData.totalAmount || 0)}
                  </strong>
                </div>
              </div>

              {/* Thanh đếm ngược tự động trở về màn hình chờ */}
              <div className="pt-4 border-t border-[#F5EFEB] space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                  <span>↓ Tự động trở về màn hình chờ</span>
                  <span className="font-bold text-[#C88A35]">{countdown}s</span>
                </div>
                <div className="w-full bg-[#EFE9E0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#C88A35] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
