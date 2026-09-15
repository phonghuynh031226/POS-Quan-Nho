import { mockDb } from './mockDb.js'
import { DEMO_ACCOUNTS } from '../constants/index.js'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export const authApi = {
  async login(username, password) {
    await delay(300)
    if (!username || !password) {
      throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu')
    }

    const cleanUser = username.trim().toLowerCase()

    // Check against mock users / staff
    const staffList = mockDb.getStaffList()
    let staff = staffList.find(
      (s) =>
        (s.username && s.username.toLowerCase() === cleanUser) ||
        (s.email && s.email.toLowerCase() === cleanUser)
    )

    // Hỗ trợ đăng nhập linh hoạt bằng email giamdoc@gmail.com hoặc admin
    if (!staff && (cleanUser === 'giamdoc@gmail.com' || cleanUser.includes('giamdoc') || cleanUser === 'admin')) {
      staff = staffList.find((s) => s.username === 'admin') || staffList[0]
    }

    if (!staff) {
      throw new Error('Tài khoản không tồn tại trong hệ thống. Bạn có thể dùng tên đăng nhập "admin" hoặc "giamdoc@gmail.com"!')
    }

    if (staff.is_active === false && staff.isActive === false) {
      throw new Error('Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ chủ quán!')
    }

    // Any password with at least 4 characters works for demo
    if (password.length < 4) {
      throw new Error('Mật khẩu tối thiểu 4 ký tự')
    }

    const sessionUser = {
      id: staff.id,
      username: staff.username,
      email: staff.email || (cleanUser.includes('@') ? cleanUser : 'giamdoc@gmail.com'),
      name: staff.full_name || staff.name || 'Chủ quán',
      role: staff.role || 'OWNER',
      loginAt: new Date().toISOString(),
    }

    mockDb.setCurrentUser(sessionUser)
    return sessionUser
  },

  async logout() {
    await delay(150)
    mockDb.setCurrentUser(null)
    return true
  },

  async getCurrentSession() {
    await delay(100)
    return mockDb.getCurrentUser()
  },

  getDemoAccounts() {
    return DEMO_ACCOUNTS
  },
}
