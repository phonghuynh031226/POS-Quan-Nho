import { Coffee } from 'lucide-react'

export default function LoadingSpinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-[#5A4535]">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E8DFD5] animate-pulse flex items-center justify-center text-[#3E2723]">
          <Coffee className="w-6 h-6 animate-bounce" />
        </div>
      </div>
      <p className="text-sm font-semibold tracking-wide text-[#3E2723]">{text}</p>
    </div>
  )
}
