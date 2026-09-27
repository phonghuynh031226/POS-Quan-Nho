import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveReceiptPrintSettings } from '../src/utils/receiptPrintSettings.js'

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
