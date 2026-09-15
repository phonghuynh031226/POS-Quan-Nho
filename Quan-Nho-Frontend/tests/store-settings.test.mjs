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
import { settingsApi } from '../src/api/settingsApi.js'
import { ROLES, DEFAULT_STORE_SETTINGS } from '../src/constants/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const navbarPath = path.resolve(__dirname, '../src/components/layout/Navbar.jsx')
const routesPath = path.resolve(__dirname, '../src/routes/index.jsx')
const settingsPagePath = path.resolve(__dirname, '../src/pages/Settings/index.jsx')

test('settingsApi provides full get, update, and reset operations', async () => {
  // 1. Get default settings
  const initial = await settingsApi.getSettings()
  assert.equal(initial.storeName.toUpperCase(), 'QUÁN NHỎ')
  assert.equal(initial.defaultPaperSize, '80mm')
  assert.equal(initial.defaultPrintMode, 'both')

  // 2. Update settings
  const updated = await settingsApi.updateSettings({
    storeName: 'QUÁN NHỎ COFFEE GARDEN',
    phone: '0988 777 666',
    defaultPaperSize: '58mm',
  })
  assert.equal(updated.storeName, 'QUÁN NHỎ COFFEE GARDEN')
  assert.equal(updated.phone, '0988 777 666')
  assert.equal(updated.defaultPaperSize, '58mm')

  // 3. Reset settings
  const reset = await settingsApi.resetSettings()
  assert.equal(reset.storeName, DEFAULT_STORE_SETTINGS.storeName)
  assert.equal(reset.defaultPaperSize, DEFAULT_STORE_SETTINGS.defaultPaperSize)
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

test('SettingsPage renders all 4 configuration areas', async () => {
  const code = await readFile(settingsPagePath, 'utf8')

  // Tab 1: Store info
  assert.match(code, /storeName/)
  assert.match(code, /storeSubtitle/)
  assert.match(code, /address/)
  assert.match(code, /phone/)
  assert.match(code, /wifiName/)

  // Tab 2: Payment & VietQR
  assert.match(code, /bankName/)
  assert.match(code, /bankAccountNumber/)
  assert.match(code, /bankAccountName/)
  assert.match(code, /transferContentPrefix/)

  // Tab 3: Printer & Receipt
  assert.match(code, /defaultPaperSize/)
  assert.match(code, /defaultPrintMode/)
  assert.match(code, /kitchenTitle/)
  assert.match(code, /autoOpenPrint/)

  // Tab 4: Customer Display
  assert.match(code, /customerDisplayWelcomeTitle/)
  assert.match(code, /autoResetDelaySeconds/)
  assert.match(code, /showFeaturedItems/)
})
