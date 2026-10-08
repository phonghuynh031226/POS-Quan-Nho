import test from 'node:test'
import assert from 'node:assert/strict'

if (!globalThis.localStorage) {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}
if (!globalThis.window) {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }
}

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROLES } from '../src/constants/index.js'
import { buildResetShopSettings } from '../src/utils/shopSettings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const navbarPath = path.resolve(__dirname, '../src/components/layout/Navbar.jsx')
const routesPath = path.resolve(__dirname, '../src/routes/index.jsx')
const settingsPagePath = path.resolve(__dirname, '../src/pages/Settings/index.jsx')
const settingsApiPath = path.resolve(__dirname, '../src/api/settingsApi.js')
const backendSecurityPath = path.resolve(__dirname, '../../Quan-Nho-Backend/src/main/java/com/quannho/pos/shared/security/SecurityConfig.java')

test('reset keeps required real shop identity while resetting optional settings', () => {
  const reset = buildResetShopSettings(
    { storeName: 'Quán Thật', address: 'Địa chỉ thật', phone: '0900000000', wifiName: 'Wifi thật' },
    { storeName: '', address: '', phone: '', wifiName: '', defaultPrintMode: 'both' }
  )

  assert.equal(reset.storeName, 'Quán Thật')
  assert.equal(reset.address, 'Địa chỉ thật')
  assert.equal(reset.phone, '0900000000')
  assert.equal(reset.wifiName, '')
  assert.equal(reset.defaultPrintMode, 'both')
})

test('only public shop identity is unauthenticated; full settings stay private', async () => {
  const code = await readFile(backendSecurityPath, 'utf8')

  assert.match(code, /"\/api\/settings\/shop\/public"\)\.permitAll\(\)/)
  assert.doesNotMatch(code, /requestMatchers\(org\.springframework\.http\.HttpMethod\.GET,\s*"\/api\/settings\/shop"\)\.permitAll\(\)/)
})

test('SePay webhook callback is public for provider delivery and protected by its API Key', async () => {
  const code = await readFile(backendSecurityPath, 'utf8')

  assert.match(code, /ignoringRequestMatchers\("\/api\/webhooks\/sepay"\)/)
  assert.match(code, /requestMatchers\("\/api\/webhooks\/sepay"\)\.permitAll\(\)/)
})

test('settingsApi provides full get, update, and reset operations', async () => {
  const code = await readFile(settingsApiPath, 'utf8')
  assert.match(code, /apiClient\.get\('\/settings\/shop'\)/)
  assert.match(code, /apiClient\.put\('\/settings\/shop'/)
  assert.match(code, /resetSettings/)
  assert.doesNotMatch(code, /mockDb/)
})

test('settingsApi returns the saved SePay configuration instead of throwing a placeholder error', async () => {
  const code = await readFile(settingsApiPath, 'utf8')

  assert.match(code, /const \{ data \} = await apiClient\.post\('\/settings\/sepay\/key', \{ apiKey \}\)/)
  assert.match(code, /return data/)
  assert.doesNotMatch(code, /SePay chưa được kết nối/)
})

test('SePay settings check webhook connectivity with a POST button and show the provider callback URL', async () => {
  const [apiCode, pageCode] = await Promise.all([
    readFile(settingsApiPath, 'utf8'),
    readFile(settingsPagePath, 'utf8'),
  ])

  assert.match(apiCode, /async testSepayConnection\(\)/)
  assert.match(apiCode, /apiClient\.post\('\/settings\/sepay\/test'\)/)
  assert.match(pageCode, /webhooks\/sepay/)
  assert.match(pageCode, /handleTestSepayConnection/)
  assert.match(pageCode, /Kiểm tra kết nối/)
  assert.match(pageCode, /Gửi thử/)
  assert.match(pageCode, /máy chủ đã nhận cấu hình API Key webhook/i)
  assert.doesNotMatch(pageCode, /Authorization: Apikey/)
  assert.match(pageCode, /URL công khai.*dashboard SePay/i)
  assert.match(pageCode, /sepaySettings\?\.is_configured/)
})

test('Admin navigation and routing includes /settings page', async () => {
  const [navbarCode, routesCode] = await Promise.all([
    readFile(navbarPath, 'utf8'),
    readFile(routesPath, 'utf8'),
  ])

  // ROLES allows /settings
  assert.equal(ROLES.ADMIN.allowedPaths.includes('/settings'), true)

  // Navbar includes /settings
  assert.match(navbarCode, /to:\s*'\/settings'/)
  assert.match(navbarCode, /label:\s*'Cài đặt'/)

  // Routes defines protected /settings
  assert.match(routesCode, /path:\s*'settings'/)
  assert.match(routesCode, /SettingsPage/)
})

test('SettingsPage renders both configuration areas', async () => {
  const code = await readFile(settingsPagePath, 'utf8')

  // Tab 1: Store info
  assert.match(code, /storeName/)
  assert.match(code, /storeSubtitle/)
  assert.match(code, /address/)
  assert.match(code, /phone/)
  assert.match(code, /wifiName/)

  // Tab 2: Payment (Chỉ có ô dán SePay API Key)
  assert.match(code, /sepayApiKeyInput/)
  assert.match(code, /handleSaveSepayKey/)
  assert.match(code, /sepay_settings/)
  assert.match(code, /không lưu payload, xử lý giao dịch hay cập nhật đơn/i)
  assert.doesNotMatch(code, /kích hoạt tính năng tự động nhận diện thanh toán/)
  assert.doesNotMatch(code, /Đã kết nối:/)
})
