import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Không có dữ liệu',
  description = 'Chưa có thông tin hoặc đơn hàng nào được ghi nhận',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-[#EFE9E0] text-[#8C7A6B] flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-[#2D1B14] mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
