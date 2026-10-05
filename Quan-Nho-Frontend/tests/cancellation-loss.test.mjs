import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  getCancellationLossPreview,
  summarizeCancellationLoss,
  sumRefundAmounts,
} from '../src/utils/cancellationLoss.js'

test('refund totals preserve an explicit zero refund instead of counting the order total', () => {
  assert.equal(sumRefundAmounts([
    { refundAmount: 0, totalAmount: 35000 },
    { refund_amount: 12000, total_amount: 35000 },
  ]), 12000)
})

test('cancellation preview classifies loss from the current fulfillment state', () => {
  assert.deepEqual(getCancellationLossPreview({ fulfillmentStatus: 'NEW', totalAmount: 30000 }), {
    type: 'NO_MATERIAL_LOSS',
    lossAmount: 0,
    label: 'Hủy không hao hụt nguyên liệu',
    description: 'Món chưa được chế biến; quán không ghi nhận tiền nguyên liệu bị lỗ.',
  })

  for (const fulfillmentStatus of ['PREPARING', 'READY_FOR_PICKUP']) {
    const preview = getCancellationLossPreview({ fulfillmentStatus, totalAmount: '30000' })
    assert.equal(preview.type, 'FULL_ORDER_LOSS')
    assert.equal(preview.lossAmount, 30000)
    assert.equal(preview.label, 'Hủy có hao hụt')
  }
})

test('report aggregation separates known cancellation types and ignores legacy unknown type', () => {
  const summary = summarizeCancellationLoss([
    { cancellationLossType: 'NO_MATERIAL_LOSS', lossAmount: 0 },
    { cancellationLossType: 'FULL_ORDER_LOSS', lossAmount: '30000' },
    { cancellationLossType: 'FULL_ORDER_LOSS' },
    { cancellationLossType: null, lossAmount: 99999 },
  ])

  assert.deepEqual(summary, {
    noMaterialLossCancellationCount: 1,
    fullOrderLossCancellationCount: 2,
    totalCancellationLoss: 30000,
  })
})

test('order history previews cancellation loss without sending editable loss fields', async () => {
  const code = await readFile(new URL('../src/pages/OrderHistory/index.jsx', import.meta.url), 'utf8')
  const apiCode = await readFile(new URL('../src/api/orderApi.js', import.meta.url), 'utf8')

  assert.match(code, /getCancellationLossPreview/)
  assert.match(code, /Hủy không hao hụt nguyên liệu|cancellationPreview\.label/)
  assert.match(code, /Tiền lỗ của quán/)
  assert.match(apiCode, /\{ reason, refundAmount \}/)
  assert.doesNotMatch(apiCode, /\{ reason, refundAmount, lossAmount/)
})

test('report API exposes cancellation loss totals from the shared aggregator', async () => {
  const code = await readFile(new URL('../src/api/reportApi.js', import.meta.url), 'utf8')

  assert.match(code, /summarizeCancellationLoss/)
  assert.match(code, /noMaterialLossCancellationCount/)
  assert.match(code, /fullOrderLossCancellationCount/)
  assert.match(code, /totalCancellationLoss/)
})
