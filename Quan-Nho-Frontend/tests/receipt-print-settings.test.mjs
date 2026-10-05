import assert from 'node:assert/strict'
import test from 'node:test'

import { getLatestOrderForPreview, resolveReceiptPrintSettings } from '../src/utils/receiptPrintSettings.js'

test('test print selects the latest persisted order without mutating API results', () => {
  const orders = [
    { id: 1, createdAt: '2026-10-01T10:00:00+07:00' },
    { id: 2, createdAt: '2026-10-02T10:00:00+07:00' },
  ]

  assert.equal(getLatestOrderForPreview(orders).id, 2)
  assert.equal(orders[0].id, 1)
  assert.equal(getLatestOrderForPreview([]), null)
})

test('test-print values override saved settings without requiring a save', () => {
  const result = resolveReceiptPrintSettings({
    savedSettings: {
      storeName: 'Tên đã lưu',
      address: 'Địa chỉ đã lưu',
      defaultPaperSize: '80mm',
      defaultPrintMode: 'customer',
    },
    customSettings: {
      storeName: 'Tên đang nhập',
      address: 'Địa chỉ đang nhập',
      defaultPaperSize: '58mm',
      defaultPrintMode: 'both',
    },
  })

  assert.equal(result.settings.storeName, 'Tên đang nhập')
  assert.equal(result.settings.address, 'Địa chỉ đang nhập')
  assert.equal(result.paperSize, '58mm')
  assert.equal(result.printType, 'both')
})

test('an explicit print type wins while paper size still comes from saved settings', () => {
  const result = resolveReceiptPrintSettings({
    savedSettings: { defaultPaperSize: '58mm', defaultPrintMode: 'customer' },
    initialPrintType: 'both',
  })

  assert.equal(result.paperSize, '58mm')
  assert.equal(result.printType, 'both')
})
