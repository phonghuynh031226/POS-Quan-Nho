import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('cancelled-order KPI distinguishes shop loss from customer refunds', async () => {
  const code = await readFile(new URL('../src/pages/OrderHistory/index.jsx', import.meta.url), 'utf8')

  assert.match(code, /const totalLoss = cancelledOrders\.reduce/)
  assert.match(code, /Number\(o\.lossAmount\)/)
  assert.match(code, /Lỗ:\s*\{formatCurrency\(stats\.totalLoss\)\}/)
  assert.match(code, /Hoàn khách:\s*\{formatCurrency\(stats\.totalRefund\)\}/)
})
