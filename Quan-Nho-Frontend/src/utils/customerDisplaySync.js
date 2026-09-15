// Module đồng bộ thời gian thực giữa quầy POS và Màn hình khách (Customer Facing Display)

export const DISPLAY_STATES = {
  IDLE: 'IDLE', // Màn hình chờ
  ORDERING: 'ORDERING', // Đang gọi món / cập nhật giỏ hàng & tổng tiền
  PAYMENT: 'PAYMENT', // Đang thanh toán (Tiền mặt / Chuyển khoản VietQR)
  SUCCESS: 'SUCCESS', // Thanh toán thành công (Số phiếu nhận món QN-xxx)
}

const STORAGE_KEY = 'pos_qn_customer_display_state_v1'
const CHANNEL_NAME = 'pos_qn_customer_display_channel'

let channel = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch (e) {
    console.warn('BroadcastChannel not supported or failed to initialize:', e)
  }
}

/**
 * Lấy trạng thái hiện tại của màn hình khách
 */
export function getDisplayState() {
  if (typeof window === 'undefined') {
    return { type: DISPLAY_STATES.IDLE, timestamp: Date.now() }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { type: DISPLAY_STATES.IDLE, timestamp: Date.now() }
    return JSON.parse(raw)
  } catch {
    return { type: DISPLAY_STATES.IDLE, timestamp: Date.now() }
  }
}

/**
 * Gửi cập nhật trạng thái mới từ quầy POS tới Màn hình khách
 */
export function sendDisplayState(payload) {
  if (typeof window === 'undefined') return
  const state = {
    ...payload,
    timestamp: Date.now(),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save customer display state to localStorage:', e)
  }

  if (channel) {
    try {
      channel.postMessage(state)
    } catch (e) {
      console.error('Failed to postMessage via BroadcastChannel:', e)
    }
  }

  // Bắn CustomEvent nội bộ phòng khi chạy trong cùng 1 window
  window.dispatchEvent(new CustomEvent('pos_qn_customer_display_update', { detail: state }))
}

/**
 * Lắng nghe sự kiện đồng bộ từ quầy POS
 */
export function subscribeDisplayState(callback) {
  if (typeof window === 'undefined') return () => {}

  // 1. Lắng nghe qua BroadcastChannel (đa cửa sổ / đa tab)
  const handleChannelMessage = (event) => {
    if (event.data && typeof callback === 'function') {
      callback(event.data)
    }
  }

  if (channel) {
    channel.addEventListener('message', handleChannelMessage)
  }

  // 2. Lắng nghe qua StorageEvent (khi thay đổi giữa các tab/cửa sổ khác)
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue)
        callback(parsed)
      } catch (e) {
        console.error('Error parsing display state from storage:', e)
      }
    }
  }
  window.addEventListener('storage', handleStorage)

  // 3. Lắng nghe qua CustomEvent nội bộ
  const handleCustomEvent = (event) => {
    if (event.detail && typeof callback === 'function') {
      callback(event.detail)
    }
  }
  window.addEventListener('pos_qn_customer_display_update', handleCustomEvent)

  // Trả về hàm hủy đăng ký
  return () => {
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage)
    }
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('pos_qn_customer_display_update', handleCustomEvent)
  }
}
