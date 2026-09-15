import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const paymentModalPath = path.resolve(__dirname, '../src/components/pos/PaymentModal.jsx')
const receiptModalPath = path.resolve(__dirname, '../src/components/print/ReceiptModal.jsx')
const posPagePath = path.resolve(__dirname, '../src/pages/Pos/index.jsx')

test('PaymentModal supports auto-printing and customer vs kitchen print selection', async () => {
  const code = await readFile(paymentModalPath, 'utf8')

  // Verifies state and options for customer and kitchen printing
  assert.match(code, /autoPrint/)
  assert.match(code, /defaultPrintType/)
  assert.match(code, /In hóa đơn khách|Cho Khách|1\. Khách/i)
  assert.match(code, /In phiếu cho bếp|Cho Bếp|2\. Cho Bếp/i)
  assert.match(code, /Cả 2 liên/i)
  assert.match(code, /onPrintOrder\(order,\s*defaultPrintType\)/)
})

test('ReceiptModal provides dedicated customer receipt and kitchen ticket templates', async () => {
  const code = await readFile(receiptModalPath, 'utf8')

  // Supports 3 print modes: customer, kitchen, both
  assert.match(code, /renderCustomerReceipt/)
  assert.match(code, /renderKitchenTicket/)
  assert.match(code, /initialPrintType/)
  assert.match(code, /printType === 'customer'/)
  assert.match(code, /printType === 'kitchen'/)
  assert.match(code, /printType === 'both'/)

  // Kitchen ticket focuses on order prep without billing details
  assert.match(code, /PHIẾU BÁO CHẾ BIẾN/)
  assert.match(code, /CẮT GIẤY TẠI ĐÂY/)
})

test('PosPage integrates printType between PaymentModal and ReceiptModal', async () => {
  const code = await readFile(posPagePath, 'utf8')

  assert.match(code, /const \[printType,\s*setPrintType\] = useState\('both'\)/)
  assert.match(code, /onPrintOrder=\{\(order,\s*type\s*=\s*'both'\)/)
  assert.match(code, /initialPrintType=\{printType\}/)
})
