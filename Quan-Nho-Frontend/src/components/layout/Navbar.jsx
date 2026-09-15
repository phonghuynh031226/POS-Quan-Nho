import { NavLink, useNavigate } from 'react-router-dom'
import {
  Coffee,
  ShoppingBag,
  History,
  BookOpen,
  BarChart3,
  LogOut,
  SlidersHorizontal,
  Settings,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Danh mục điều hướng cho Chủ quán
  const navItems = [
    {
      to: '/pos',
      label: 'Bán hàng',
      icon: ShoppingBag,
    },
    {
      to: '/orders',
      label: 'Đơn hàng',
      icon: History,
    },
    {
      to: '/menu',
      label: 'Thực đơn',
      icon: BookOpen,
    },
    {
      to: '/options',
      label: 'Tùy chọn',
      icon: SlidersHorizontal,
    },
    {
      to: '/reports',
      label: 'Báo cáo',
      icon: BarChart3,
    },
    {
      to: '/settings',
      label: 'Cài đặt',
      icon: Settings,
    },
  ]

  const visibleNavItems = navItems

  return (
    <header className="bg-[#2D1B14] text-white border-b border-[#3E2723] sticky top-0 z-30 shadow-md">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#C88A35] flex items-center justify-center text-white shadow-sm font-black">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#FDFBF7] whitespace-nowrap">
                  QUÁN NHỎ
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#4A2E20] text-[#E09F3E]">
                  POS
                </span>
              </div>
              <p className="text-[10px] text-[#D4C7B8] whitespace-nowrap hidden sm:block">
                Cà phê & Đồ ăn vặt
              </p>
            </div>
          </div>

          {/* Center Navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto scrollbar-none py-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-2.5 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
                      isActive
                        ? 'bg-[#C88A35] text-white shadow-xs'
                        : 'text-[#E8DFD5] hover:bg-[#3E2723] hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* User profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentUser && (
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#3E2723] border border-[#543828] text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="text-left leading-tight hidden sm:block max-w-[140px] truncate">
                  <div className="font-bold text-[#FDFBF7] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-[#C88A35]">
                    {ROLES[currentUser.role]?.name || 'Chủ quán'}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 sm:p-2.5 rounded-xl bg-[#3E2723] hover:bg-[#4A2E20] text-[#E8DFD5] hover:text-white border border-[#543828] transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tablet & Mobile secondary nav bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-[#3E2723] -mx-3 px-3 scrollbar-none">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                    isActive ? 'bg-[#C88A35] text-white' : 'text-[#E8DFD5] bg-[#3E2723]'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </header>
  )
}
