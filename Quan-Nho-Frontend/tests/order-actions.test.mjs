import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { canCancelOrder, getNextFulfillmentAction } from '../src/utils/orderActions.js'
import { FULFILLMENT_STATUS } from '../src/constants/index.js'

test('counter pickup states use customer-facing Vietnamese labels', () => {
  assert.equal(FULFILLMENT_STATUS.NEW.label, 'Mới nhận')
  assert.equal(FULFILLMENT_STATUS.PREPARING.label, 'Đang chuẩn bị')
  assert.equal(FULFILLMENT_STATUS.READY_FOR_PICKUP.label, 'Chờ khách nhận')
  assert.equal(FULFILLMENT_STATUS.COMPLETED.label, 'Hoàn tất')
  assert.equal(FULFILLMENT_STATUS.CANCELLED.label, 'Đã hủy')
})

test('only active counter pickup orders can be cancelled', () => {
  assert.equal(canCancelOrder({ fulfillmentStatus: 'NEW' }), true)
  assert.equal(canCancelOrder({ fulfillmentStatus: 'PREPARING' }), true)
  assert.equal(canCancelOrder({ fulfillmentStatus: 'READY_FOR_PICKUP' }), true)
  assert.equal(canCancelOrder({ fulfillmentStatus: 'COMPLETED' }), false)
  assert.equal(canCancelOrder({ fulfillmentStatus: 'CANCELLED' }), false)
  assert.equal(canCancelOrder({ fulfillmentStatus: 'UNKNOWN' }), false)
  assert.equal(canCancelOrder(null), false)
})

test('each active state exposes exactly one next pickup action', () => {
  assert.deepEqual(getNextFulfillmentAction({ fulfillmentStatus: 'NEW' }), {
    nextStatus: 'PREPARING', label: 'Bắt đầu làm',
  })
  assert.deepEqual(getNextFulfillmentAction({ fulfillmentStatus: 'PREPARING' }), {
    nextStatus: 'READY_FOR_PICKUP', label: 'Làm xong',
  })
  assert.deepEqual(getNextFulfillmentAction({ fulfillmentStatus: 'READY_FOR_PICKUP' }), {
    nextStatus: 'COMPLETED', label: 'Khách đã nhận',
  })
  assert.equal(getNextFulfillmentAction({ fulfillmentStatus: 'COMPLETED' }), null)
  assert.equal(getNextFulfillmentAction({ fulfillmentStatus: 'CANCELLED' }), null)
  assert.equal(getNextFulfillmentAction({ fulfillmentStatus: 'UNKNOWN' }), null)
  assert.equal(getNextFulfillmentAction(null), null)
})

test('order history uses the cancellation rule for its actions', async () => {
  const page = await readFile(new URL('../src/pages/OrderHistory/index.jsx', import.meta.url), 'utf8')
  assert.match(page, /canCancelOrder\(order\)/)
  assert.match(page, /canCancelOrder\(viewingOrder\)/)
})
