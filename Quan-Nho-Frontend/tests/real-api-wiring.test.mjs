import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const apiDir = new URL('../src/api/', import.meta.url)

test('active frontend APIs use HTTP instead of mockDb', async () => {
  const files = await readdir(apiDir)
  assert.equal(files.includes('mockDb.js'), false)
  for (const name of ['authApi.js', 'menuApi.js', 'optionGroupApi.js', 'orderApi.js', 'settingsApi.js']) {
    const code = await readFile(new URL(name, apiDir), 'utf8')
    assert.match(code, /apiClient/)
    assert.doesNotMatch(code, /mockDb|localStorage/)
  }
})

test('menu image upload uses the backend API instead of storing base64 data', async () => {
  const [menuApiCode, modalCode] = await Promise.all([
    readFile(new URL('../src/api/menuApi.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/menu/MenuItemModal.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(menuApiCode, /uploadImage/)
  assert.match(menuApiCode, /\/uploads\/images/)
  assert.match(modalCode, /menuApi\.uploadImage/)
  assert.doesNotMatch(modalCode, /readAsDataURL/)
  assert.doesNotMatch(modalCode, /new FileReader/)
})

test('payment cannot fabricate a successful bank transfer', async () => {
  const code = await readFile(new URL('../src/components/pos/PaymentModal.jsx', import.meta.url), 'utf8')
  assert.match(code, /paymentMethod !== 'TIEN_MAT'/)
  assert.doesNotMatch(code, /setTransferPaid\(true\)/)
  assert.doesNotMatch(code, /const mockTx/)
})

test('Axios does not overwrite the masked Spring CSRF header with the raw cookie token', async () => {
  const code = await readFile(new URL('../src/api/apiClient.js', import.meta.url), 'utf8')
  assert.match(code, /xsrfCookieName:\s*null/)
})
