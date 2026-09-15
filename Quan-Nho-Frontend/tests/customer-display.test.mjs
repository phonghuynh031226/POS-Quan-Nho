import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DISPLAY_STATES } from '../src/utils/customerDisplaySync.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const routesPath = path.resolve(__dirname, '../src/routes/index.jsx')
const customerDisplayPath = path.resolve(__dirname, '../src/pages/CustomerDisplay/index.jsx')
const posPagePath = path.resolve(__dirname, '../src/pages/Pos/index.jsx')
const paymentModalPath = path.resolve(__dirname, '../src/components/pos/PaymentModal.jsx')

test('DISPLAY_STATES defines all required workflow states', () => {
  assert.equal(DISPLAY_STATES.IDLE, 'IDLE')
  assert.equal(DISPLAY_STATES.ORDERING, 'ORDERING')
  assert.equal(DISPLAY_STATES.PAYMENT, 'PAYMENT')
  assert.equal(DISPLAY_STATES.SUCCESS, 'SUCCESS')
})

test('Router registers /display as a public customer facing display route', async () => {
  const routesCode = await readFile(routesPath, 'utf8')

  assert.match(routesCode, /path:\s*'\/display'/)
  assert.match(routesCode, /CustomerDisplayPage/)
  assert.match(routesCode, /path:\s*'\/customer-display'/)
})

test('CustomerDisplayPage implements the full 5-step customer workflow', async () => {
  const code = await readFile(customerDisplayPath, 'utf8')

  // 1. Màn hình chờ (Idle)
  assert.match(code, /DISPLAY_STATES\.IDLE/)
  assert.match(code, /Chào mừng Quý khách đến với/i)
  assert.match(code, /Món đặc sắc/i)

  // 2. Hiển thị danh sách món & Tổng tiền (Ordering)
  assert.match(code, /DISPLAY_STATES\.ORDERING/)
  assert.match(code, /Đơn Hàng Của Quý Khách/i)
  assert.match(code, /TỔNG CỘNG CẦN TRẢ/i)

  // 3. Thanh toán Tiền mặt (Cash)
  assert.match(code, /DISPLAY_STATES\.PAYMENT/)
  assert.match(code, /Thanh Toán Tiền Mặt/i)
  assert.match(code, /Số tiền cần trả/i)
  assert.match(code, /Tiền khách đưa/i)
  assert.match(code, /Tiền thối lại/i)

  // 3. Thanh toán Chuyển khoản VietQR (Transfer)
  assert.match(code, /Thanh Toán Chuyển Khoản VietQR/i)
  assert.match(code, /VIETQR QUÁN NHỎ/i)
  assert.match(code, /Quét Mã Để Thanh Toán/i)

  // 4. Thanh toán thành công (Success) & 5. Trở về màn hình chờ
  assert.match(code, /DISPLAY_STATES\.SUCCESS/)
  assert.match(code, /Thanh Toán Thành Công!/i)
  assert.match(code, /SỐ PHIẾU NHẬN MÓN/i)
  assert.match(code, /Tự động trở về màn hình chờ/i)
})

test('PosPage and PaymentModal broadcast realtime sync updates to Customer Display', async () => {
  const posCode = await readFile(posPagePath, 'utf8')
  const paymentCode = await readFile(paymentModalPath, 'utf8')

  // PosPage sends ordering updates & has launcher button
  assert.match(posCode, /sendDisplayState/)
  assert.match(posCode, /Màn hình khách/)
  assert.match(posCode, /window\.open\('\/display'/)

  // PaymentModal sends payment & success updates
  assert.match(paymentCode, /sendDisplayState/)
  assert.match(paymentCode, /DISPLAY_STATES\.PAYMENT/)
  assert.match(paymentCode, /DISPLAY_STATES\.SUCCESS/)
})
