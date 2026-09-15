export function formatCurrency(amount) {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫'
}

export function formatDateTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getElapsedMinutes(isoString) {
  if (!isoString) return 0
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  return Math.max(0, mins)
}

export function generateToken(length = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
