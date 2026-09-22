import apiClient from './apiClient'
import { DEFAULT_STORE_SETTINGS } from '../constants'

const toSettings = (shop) => ({
  ...DEFAULT_STORE_SETTINGS,
  ...shop,
  storeName: shop.shop_name,
  storeSubtitle: shop.store_subtitle || '',
  address: shop.shop_address || '',
  wifiName: shop.wifi_name || '',
  wifiPass: shop.wifi_password_encrypted || '',
  receiptFooterMessage: shop.receipt_message || '',
})

const toShop = (settings) => ({
  shop_name: settings.storeName || settings.shop_name,
  store_subtitle: settings.storeSubtitle ?? settings.store_subtitle ?? '',
  phone: settings.phone || '',
  shop_address: settings.address ?? settings.shop_address ?? '',
  wifi_name: settings.wifiName ?? settings.wifi_name ?? '',
  wifi_password_encrypted: settings.wifiPass ?? settings.wifi_password_encrypted ?? '',
  receipt_message: settings.receiptFooterMessage ?? settings.receipt_message ?? '',
  show_wifi_on_receipt: settings.show_wifi_on_receipt !== false,
})

export const settingsApi = {
  async getSettings() {
    const { data } = await apiClient.get('/settings/shop')
    return toSettings(data)
  },
  async updateSettings(settings) {
    const { data } = await apiClient.put('/settings/shop', toShop(settings))
    return toSettings(data)
  },
  async resetSettings() {
    return this.updateSettings(DEFAULT_STORE_SETTINGS)
  },
  async getShopSettings() {
    const { data } = await apiClient.get('/settings/shop')
    return data
  },
  async updateShopSettings(shopData) {
    const { data } = await apiClient.put('/settings/shop', shopData)
    return data
  },
  async getSepaySettings() {
    const { data } = await apiClient.get('/settings/sepay')
    return data
  },
  async saveSepayApiKey(apiKey) {
    await apiClient.post('/settings/sepay/key', { apiKey })
    throw new Error('SePay chưa được kết nối')
  },
}
