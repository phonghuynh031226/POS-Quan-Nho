import { mockDb } from './mockDb'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const staffApi = {
  async getStaffList() {
    await delay(150)
    return mockDb.getStaffList()
  },

  async saveStaff(staffItem) {
    await delay(250)
    if (!staffItem.name || !staffItem.name.trim()) {
      throw new Error('Họ tên nhân viên không được để trống')
    }
    if (!staffItem.username || !staffItem.username.trim()) {
      throw new Error('Tên đăng nhập không được để trống')
    }
    return mockDb.saveStaff(staffItem)
  },

  async toggleStaffStatus(id) {
    await delay(150)
    return mockDb.toggleStaffStatus(id)
  },
}
