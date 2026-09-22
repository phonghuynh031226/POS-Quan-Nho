import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Coffee, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useToast } from '../../context/ToastContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')

    try {
      const user = await login(username, password)
      toast.success(`Xin chào, ${user.name}!`)

      const from = location.state?.from?.pathname
      if (from && from !== '/login' && from !== '/kitchen' && from !== '/staff') {
        navigate(from, { replace: true })
      } else {
        navigate('/pos', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#3E2723] text-white shadow-lg mb-4">
          <Coffee className="w-8 h-8 text-[#C88A35]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#2D1B14]">
          POS QUÁN NHỎ
        </h1>
        <p className="mt-1 text-sm text-stone-600">Hệ thống quản lý bán hàng dành cho Chủ quán</p>
      </div>

      {/* Login Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-[#E8DFD5] rounded-3xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Tên đăng nhập / Email"
              type="text"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin hoặc giamdoc@gmail.com"
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 animate-in fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-base font-extrabold shadow-md bg-[#2D1B14] hover:bg-[#3E2723] mt-2"
            >
              <span>Đăng nhập hệ thống</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

        </div>

        {/* Security / Backend disclaimer notice */}
        <p className="text-center text-xs text-stone-500 mt-6 max-w-sm mx-auto">
          Frontend kết nối mock API lưu trữ localStorage & đồng bộ đa tab. Phiên bản thật sẽ sử dụng
          Spring Security Session Cookie & PostgreSQL.
        </p>
      </div>
    </div>
  )
}
