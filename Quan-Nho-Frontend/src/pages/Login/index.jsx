import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Coffee,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Zap,
  CreditCard,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { settingsApi } from '../../api/settingsApi'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [shopInfo, setShopInfo] = useState(() => ({
    shop_name: localStorage.getItem('quan_nho_cached_shop_name') || '',
    store_subtitle: localStorage.getItem('quan_nho_cached_store_subtitle') || '',
  }))

  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Lấy dữ liệu tên quán theo bảng shop_settings cột shop_name
  useEffect(() => {
    let isMounted = true

    settingsApi.getPublicShopInfo()
      .then((data) => {
        if (isMounted && data?.shop_name) {
          setShopInfo({
            shop_name: data.shop_name,
            store_subtitle: data.store_subtitle || '',
          })
          localStorage.setItem('quan_nho_cached_shop_name', data.shop_name)
          localStorage.setItem('quan_nho_cached_store_subtitle', data.store_subtitle || '')
        }
      })
      .catch((err) => {
        console.warn('Lấy thông tin shop_settings thất bại:', err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Đổi title trang theo tên quán
  useEffect(() => {
    if (shopInfo.shop_name) {
      document.title = `${shopInfo.shop_name} - Đăng nhập hệ thống POS`
    }
  }, [shopInfo.shop_name])

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Vui lòng nhập số điện thoại hoặc Gmail')
      return
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu')
      return
    }

    try {
      const user = await login(username.trim(), password)
      toast.success(`Xin chào, ${user.name || user.fullName || 'Quản lý'}!`)

      const from = location.state?.from?.pathname
      if (from && from !== '/login' && from !== '/kitchen' && from !== '/staff') {
        navigate(from, { replace: true })
      } else {
        navigate('/pos', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#180E09] text-stone-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden selection:bg-[#C88A35] selection:text-white">
      {/* Background Decor Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-[#8C4A16]/25 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-[#5C2E0B]/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#C88A35_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />

      {/* Main Container: Gọn gàng, vừa vặn, không bị giãn khoảng trống thừa */}
      <div className="w-full max-w-5xl bg-[#23140D]/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] border border-[#482819]/80 shadow-[0_25px_80px_rgba(0,0,0,0.65)] overflow-hidden relative z-10 transition-all">
        <div className="grid grid-cols-1 lg:grid-cols-12">

          {/* CỘT TRÁI: Hero Brand Showcase */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-b from-[#2E1810] via-[#23120B] to-[#1A0C06] border-b lg:border-b-0 lg:border-r border-[#442314] relative">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#C88A35]/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#C88A35] via-[#A86920] to-[#7B4610] text-white shadow-xl shadow-[#C88A35]/20 ring-4 ring-[#C88A35]/20 shrink-0">
                  <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFF7EC]" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#FFFDF8] uppercase leading-tight drop-shadow-sm truncate">
                    {shopInfo.shop_name}
                  </h1>
                  {shopInfo.store_subtitle && (
                    <p className="mt-1 text-sm sm:text-base text-[#D6BBA5] font-medium line-clamp-2">
                      {shopInfo.store_subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Feature Highlights: Hiển thị trên màn hình Desktop / POS lớn */}
              <div className="hidden lg:block mt-7 sm:mt-8 space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#341B10]/60 border border-[#4D2919]/70 backdrop-blur-sm transition-all hover:bg-[#341B10]">
                  <div className="p-2 rounded-xl bg-[#C88A35]/15 text-[#E5A952] shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-100">Bán hàng & Chế biến siêu tốc</h3>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#341B10]/60 border border-[#4D2919]/70 backdrop-blur-sm transition-all hover:bg-[#341B10]">
                  <div className="p-2 rounded-xl bg-[#C88A35]/15 text-[#E5A952] shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-100">Thanh toán VietQR & SePay</h3>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#341B10]/60 border border-[#4D2919]/70 backdrop-blur-sm transition-all hover:bg-[#341B10]">
                  <div className="p-2 rounded-xl bg-[#C88A35]/15 text-[#E5A952] shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-100">Báo cáo & Kiểm soát doanh thu</h3>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#341B10]/60 border border-[#4D2919]/70 backdrop-blur-sm transition-all hover:bg-[#341B10]">
                  <div className="p-2 rounded-xl bg-[#C88A35]/15 text-[#E5A952] shrink-0">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-100">Quản lý Thực đơn & Topping linh hoạt</h3>
                </div>
              </div>
            </div>

            {/* Bottom note in Left Column: Khoảng cách gọn gàng */}
            <div className="hidden lg:flex mt-5 pt-3.5 border-t border-[#3F2113] items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Hệ thống dữ liệu bảo mật
              </span>
              <span>Dành cho Quản lý quán</span>
            </div>
          </div>

          {/* CỘT PHẢI: Form Đăng Nhập Rộng Rãi, Sạch Sẽ, Thẳng Hàng Hoàn Hảo */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-stone-900">
            <div className="max-w-md w-full mx-auto">
              {/* Form Title: Thẳng hàng ngang hoàn hảo với Logo & Tên quán ở cột trái */}
              <div className="mb-6 sm:mb-7">
                <h2 className="text-2xl sm:text-3xl font-black text-[#2B170E] tracking-tight">
                  Chào mừng trở lại!
                </h2>
                <p className="mt-1 text-sm sm:text-base text-stone-600">
                  Hệ thống quản lý bán hàng <span className="font-bold text-[#A86920]">{shopInfo.shop_name}</span>
                </p>
              </div>

              {/* Form Actions */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label htmlFor="login-username" className="block text-sm font-bold text-[#341B10]">
                    Số điện thoại hoặc Gmail
                  </label>
                  <div className="relative rounded-2xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập số điện thoại hoặc Gmail..."
                      className="block w-full h-13 pl-12 pr-4 rounded-2xl border-2 border-stone-200 bg-stone-50/50 text-stone-900 text-base font-semibold placeholder:text-stone-400 placeholder:font-normal focus:bg-white focus:border-[#C88A35] focus:ring-4 focus:ring-[#C88A35]/15 focus:outline-none transition-all"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="block text-sm font-bold text-[#341B10]">
                    Mật khẩu
                  </label>
                  <div className="relative rounded-2xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="block w-full h-13 pl-12 pr-12 rounded-2xl border-2 border-stone-200 bg-stone-50/50 text-stone-900 text-base font-semibold placeholder:text-stone-400 placeholder:font-normal focus:bg-white focus:border-[#C88A35] focus:ring-4 focus:ring-[#C88A35]/15 focus:outline-none transition-all"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-sm pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#C88A35] border-stone-300 focus:ring-[#C88A35] accent-[#C88A35] cursor-pointer"
                    />
                    <span className="text-stone-600 font-medium text-xs sm:text-sm">Ghi nhớ đăng nhập</span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-semibold text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full h-14 rounded-2xl text-base sm:text-lg font-black shadow-lg shadow-[#2D1B14]/25 bg-[#2B170E] hover:bg-[#3D2114] text-white transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Đăng nhập vào hệ thống</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            </div>

            {/* Bottom note in Right Column: Cân bằng đối xứng với cột trái */}
            <div className="hidden lg:flex mt-5 pt-3.5 border-t border-stone-100 items-center justify-between text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Phiên đăng nhập an toàn
              </span>
              <span>Hệ thống POS</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
