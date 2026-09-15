import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variants = {
    primary:
      'bg-[#3E2723] hover:bg-[#2D1B14] text-white shadow-sm focus:ring-[#3E2723]',
    accent:
      'bg-[#C88A35] hover:bg-[#B45309] text-white shadow-sm focus:ring-[#C88A35]',
    secondary:
      'bg-[#EFE9E0] hover:bg-[#E4DCCE] text-[#3E2723] focus:ring-[#A6907C]',
    outline:
      'border-2 border-[#D4C7B8] hover:border-[#3E2723] text-[#3E2723] bg-transparent hover:bg-[#F5EFEB] focus:ring-[#3E2723]',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    ghost:
      'text-[#3E2723] hover:bg-[#F5EFEB] focus:ring-stone-400',
  }

  const sizes = {
    sm: 'text-xs px-3 py-2 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3.5 min-h-[50px] gap-2.5',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  )
}
