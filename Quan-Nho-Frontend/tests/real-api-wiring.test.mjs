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

test('payment cannot fabricate a successful bank transfer', async () => {
  const code = await readFile(new URL('../src/components/pos/PaymentModal.jsx', import.meta.url), 'utf8')
  assert.match(code, /paymentMethod !== 'TIEN_MAT'/)
  assert.doesNotMatch(code, /setTransferPaid\(true\)/)
  assert.doesNotMatch(code, /const mockTx/)
})
