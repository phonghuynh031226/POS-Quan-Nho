import { Clock, Coffee, CheckCircle2, CheckCheck, XCircle } from 'lucide-react'
import { ORDER_STATUS, PAYMENT_STATUS } from '../../constants'

const iconMap = {
  Clock,
  Coffee,
  CheckCircle2,
  CheckCheck,
  XCircle,
}

export default function Badge({ statusKey, type = 'fulfillment', size = 'md' }) {
  let config = null

  if (type === 'fulfillment') {
    config = ORDER_STATUS[statusKey]
  } else if (type === 'payment') {
    config = PAYMENT_STATUS[statusKey]
  }

  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
        {statusKey}
      </span>
    )
  }

  const Icon = config.iconName ? iconMap[config.iconName] : null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-3 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-4 py-1.5 gap-2 font-bold',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${config.badgeClass} ${sizeClasses[size] || sizeClasses.md}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  )
}
