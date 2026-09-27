import assert from 'node:assert/strict'
import test from 'node:test'

import { buildReportFilename, buildReportWorkbook } from '../src/utils/reportExcel.js'
import { readFile } from 'node:fs/promises'

const periodCases = [
  ['day', 'Ngày 25-09-2026'],
  ['week', 'Tuần 21-09-2026 đến 27-09-2026'],
  ['month', 'Tháng 09-2026'],
  ['year', 'Năm 2026'],
  ['custom', 'Từ 01-09-2026 đến 25-09-2026'],
]

for (const [periodType, expectedPeriod] of periodCases) {
  test(`report filename describes the ${periodType} period`, () => {
    const filename = buildReportFilename({
      shopName: 'Quán Nhỏ',
      periodType,
      selectedDate: '2026-09-25',
      selectedMonth: '2026-09',
      selectedYear: '2026',
      fromDate: periodType === 'week' ? '2026-09-21' : '2026-09-01',
      toDate: periodType === 'week' ? '2026-09-27' : '2026-09-25',
    })

    assert.equal(filename, `Báo cáo doanh thu - Quán Nhỏ - ${expectedPeriod}.xlsx`)
  })
}

test('report workbook applies readable business formatting to both sheets', () => {
  const workbook = buildReportWorkbook({
    shopName: 'Quán Nhỏ',
    stats: {
      label: 'Ngày 25/09/2026',
      netRevenue: 29000,
      totalGrossRevenue: 29000,
      totalRefundAmount: 0,
      totalOrdersCount: 1,
      paidOrdersCount: 1,
      averageOrderValue: 29000,
      totalItemsSold: 1,
      cashRevenue: 29000,
      transferRevenue: 0,
      orders: [
        {
          orderNumber: 'QN-000001',
          createdAt: '2026-09-25T08:30:00',
          createdBy: 'Chủ quán',
          paymentMethod: 'TIEN_MAT',
          paymentStatus: 'DA_THANH_TOAN',
          totalAmount: 29000,
        },
      ],
    },
    exportedAt: new Date('2026-09-25T21:07:00'),
  })

  const summary = workbook.Sheets['Tổng Quan']
  const orders = workbook.Sheets['Danh Sách Đơn Hàng']

  assert.deepEqual(summary['!merges'][0], { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } })
  assert.equal(summary.A1.s.font.bold, true)
  assert.equal(summary.A1.s.fill.fgColor.rgb, '3E2723')
  assert.equal(summary.B6.z, '#,##0 "₫"')
  assert.equal(summary.B6.s.border.bottom.style, 'thin')

  assert.equal(orders.A1.s.font.bold, true)
  assert.equal(orders.A1.s.fill.fgColor.rgb, 'C88A35')
  assert.equal(orders.F2.z, '#,##0 "₫"')
  assert.deepEqual(orders['!autofilter'], { ref: 'A1:H2' })
  assert.deepEqual(orders['!freeze'], { xSplit: 0, ySplit: 1 })
})

test('report export loads the browser bundle without Node stream shims', async () => {
  const source = await readFile(new URL('../src/utils/reportExcel.js', import.meta.url), 'utf8')

  assert.match(source, /xlsx-js-style\/dist\/xlsx\.bundle\.js/)
})

test('report workbook exports cancellation loss summary and per-order audit columns', () => {
  const workbook = buildReportWorkbook({
    stats: {
      label: 'Ngày 27/09/2026',
      noMaterialLossCancellationCount: 0,
      fullOrderLossCancellationCount: 1,
      totalCancellationLoss: 30000,
      orders: [
        {
          orderNumber: 'QN-000039',
          createdAt: '2026-09-27T17:03:50',
          paymentMethod: 'TIEN_MAT',
          paymentStatus: 'DA_HOAN_TIEN',
          totalAmount: 30000,
          cancellationLossType: 'FULL_ORDER_LOSS',
          lossAmount: 30000,
        },
      ],
    },
  })

  const summary = workbook.Sheets['Tổng Quan']
  const orders = workbook.Sheets['Danh Sách Đơn Hàng']

  assert.equal(summary.A15.v, 'Đơn hủy không hao hụt')
  assert.equal(summary.B15.v, 0)
  assert.equal(summary.A16.v, 'Đơn hủy có hao hụt')
  assert.equal(summary.B16.v, 1)
  assert.equal(summary.A17.v, 'Tiền lỗ do đơn hủy')
  assert.equal(summary.B17.v, 30000)
  assert.equal(summary.B17.z, '#,##0 "₫"')

  assert.equal(orders.G1.v, 'Loại hủy')
  assert.equal(orders.H1.v, 'Tiền lỗ của quán (VNĐ)')
  assert.equal(orders.G2.v, 'Hủy có hao hụt')
  assert.equal(orders.H2.v, 30000)
  assert.equal(orders.H2.z, '#,##0 "₫"')
  assert.deepEqual(orders['!autofilter'], { ref: 'A1:H2' })
})
