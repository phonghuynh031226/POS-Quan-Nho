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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const navbarPath = path.resolve(__dirname, '../src/components/layout/Navbar.jsx')
const routesPath = path.resolve(__dirname, '../src/routes/index.jsx')
const settingsPagePath = path.resolve(__dirname, '../src/pages/Settings/index.jsx')
const settingsApiPath = path.resolve(__dirname, '../src/api/settingsApi.js')

test('settingsApi provides full get, update, and reset operations', async () => {
  const code = await readFile(settingsApiPath, 'utf8')
  assert.match(code, /apiClient\.get\('\/settings\/shop'\)/)
  assert.match(code, /apiClient\.put\('\/settings\/shop'/)
  assert.match(code, /resetSettings/)
  assert.doesNotMatch(code, /mockDb/)
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
})
