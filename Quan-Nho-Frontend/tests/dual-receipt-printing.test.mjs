import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const paymentModalPath = path.resolve(__dirname, '../src/components/pos/PaymentModal.jsx')
const receiptModalPath = path.resolve(__dirname, '../src/components/print/ReceiptModal.jsx')
const posPagePath = path.resolve(__dirname, '../src/pages/Pos/index.jsx')
const settingsPagePath = path.resolve(__dirname, '../src/pages/Settings/index.jsx')
const orderHistoryPath = path.resolve(__dirname, '../src/pages/OrderHistory/index.jsx')
const globalCssPath = path.resolve(__dirname, '../src/index.css')

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
})

test('ReceiptModal closes the preview after the browser print dialog finishes', async () => {
  const code = await readFile(receiptModalPath, 'utf8')
  const handlePrint = code.match(/const handlePrint = async \(\) => \{[\s\S]*?\n  \}/)?.[0] || ''

  assert.match(handlePrint, /window\.print\(\)[\s\S]*onPrinted\?\.\(\)[\s\S]*onClose\(\)/)
})

test('combined printing puts the customer receipt first and starts the kitchen ticket on the next free page', async () => {
  const code = await readFile(receiptModalPath, 'utf8')
  const css = await readFile(globalCssPath, 'utf8')
  const combinedPrintBlock = code.match(/\{printType === 'both' && \([\s\S]*?\n\s*\)\}/)?.[0] || ''

  assert.ok(combinedPrintBlock.indexOf('renderCustomerReceipt()') >= 0)
  assert.ok(
    combinedPrintBlock.indexOf('renderCustomerReceipt()') <
      combinedPrintBlock.indexOf('renderKitchenTicket()')
  )
  assert.match(combinedPrintBlock, /page-break-before[\s\S]*renderKitchenTicket\(\)/)
  assert.doesNotMatch(combinedPrintBlock, /CẮT GIẤY TẠI ĐÂY/)
  assert.match(css, /\.page-break-before\s*\{[\s\S]*page-break-before:\s*always;[\s\S]*break-before:\s*page;/)
})

test('printed line items are kept together when a long receipt spans multiple pages', async () => {
  const code = await readFile(receiptModalPath, 'utf8')
  const css = await readFile(globalCssPath, 'utf8')

  assert.ok((code.match(/print-line-item/g) || []).length >= 2)
  assert.match(css, /\.print-line-item\s*\{[\s\S]*page-break-inside:\s*avoid;[\s\S]*break-inside:\s*avoid;/)
})

test('PosPage integrates printType between PaymentModal and ReceiptModal', async () => {
  const code = await readFile(posPagePath, 'utf8')

  assert.match(code, /const \[printType,\s*setPrintType\] = useState\('both'\)/)
  assert.match(code, /onPrintOrder=\{\(order,\s*type\s*=\s*'both'\)/)
  assert.match(code, /initialPrintType=\{printType\}/)
})

test('settings test print and order reprint both open the shared two-receipt workflow', async () => {
  const settingsCode = await readFile(settingsPagePath, 'utf8')
  const orderHistoryCode = await readFile(orderHistoryPath, 'utf8')
  const receiptCode = await readFile(receiptModalPath, 'utf8')

  assert.match(settingsCode, /initialPrintType="both"/)
  assert.match(settingsCode, /customSettings=\{settings\}/)
  assert.doesNotMatch(settingsCode, /isReprint=\{true\}/)
  assert.match(orderHistoryCode, /isReprint=\{true\}[\s\S]*initialPrintType="both"/)
  assert.match(receiptCode, /customSettings/)
  assert.match(receiptCode, /resolveReceiptPrintSettings/)
})
