import { mockDb } from './mockDb.js'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export const settingsApi = {
  // --- STORE SETTINGS TỔNG HỢP ---
  async getSettings() {
    await delay(80)
    return mockDb.getStoreSettings()
  },

  async updateSettings(settings) {
    await delay(180)
    if (!settings) throw new Error('Dữ liệu cài đặt không hợp lệ')
    return mockDb.saveStoreSettings(settings)
  },

  async resetSettings() {
    await delay(150)
    return mockDb.resetStoreSettings()
  },

  // --- SHOP SETTINGS (Table 10 - In Bill) ---
  async getShopSettings() {
    await delay(80)
    return mockDb.getShopSettings()
  },

  async updateShopSettings(shopData) {
    await delay(180)
    if (!shopData || !shopData.shop_name?.trim()) {
      throw new Error('Tên quán không được để trống')
    }
    return mockDb.saveShopSettings(shopData)
  },

  // --- SEPAY SETTINGS (Table 11 - Cấu hình API Key) ---
  async getSepaySettings() {
    await delay(80)
    return mockDb.getSepaySettings()
  },

  async saveSepayApiKey(apiKey) {
    await delay(200)
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 4) {
      throw new Error('Vui lòng nhập SePay API Key hợp lệ')
    }
    return mockDb.saveSepayApiKey(apiKey)
  },
}
