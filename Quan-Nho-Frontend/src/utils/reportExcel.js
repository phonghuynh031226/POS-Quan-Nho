import XLSX from 'xlsx-js-style/dist/xlsx.bundle.js'

const COLORS = {
  brown: '3E2723',
  gold: 'C88A35',
  cream: 'F8F3ED',
  lightGold: 'F6E7CF',
  white: 'FFFFFF',
  border: 'D8C9BA',
  green: 'DCFCE7',
  greenText: '166534',
  red: 'FEE2E2',
  redText: '991B1B',
}

const thinBorder = {
  top: { style: 'thin', color: { rgb: COLORS.border } },
  bottom: { style: 'thin', color: { rgb: COLORS.border } },
  left: { style: 'thin', color: { rgb: COLORS.border } },
  right: { style: 'thin', color: { rgb: COLORS.border } },
}

const formatDatePart = (dateString) => {
  const [year, month, day] = String(dateString || '').slice(0, 10).split('-')
  return year && month && day ? `${day}-${month}-${year}` : 'Không xác định'
}

const sanitizeFilenamePart = (value, fallback) => {
  const cleaned = String(value || fallback)
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || fallback
}

export function buildReportFilename({
  shopName,
  periodType,
  selectedDate,
  selectedMonth,
  selectedYear,
  fromDate,
  toDate,
}) {
  let periodLabel

  if (periodType === 'week') {
    periodLabel = `Tuần ${formatDatePart(fromDate)} đến ${formatDatePart(toDate)}`
  } else if (periodType === 'month') {
    const [year, month] = String(selectedMonth || '').split('-')
    periodLabel = `Tháng ${month || '--'}-${year || '----'}`
  } else if (periodType === 'year') {
    periodLabel = `Năm ${selectedYear || '----'}`
  } else if (periodType === 'custom') {
    periodLabel = `Từ ${formatDatePart(fromDate)} đến ${formatDatePart(toDate)}`
  } else {
    periodLabel = `Ngày ${formatDatePart(selectedDate || fromDate)}`
  }

  const safeShopName = sanitizeFilenamePart(shopName, 'Quán Nhỏ')
  return `Báo cáo doanh thu - ${safeShopName} - ${periodLabel}.xlsx`
}

const getOrderPaymentMethod = (order) =>
  order.paymentMethod === 'TIEN_MAT' || order.payment_method === 'CASH'
    ? 'Tiền mặt'
    : 'Chuyển khoản VietQR'

const getOrderPaymentStatus = (order) => {
  if (order.paymentStatus === 'DA_THANH_TOAN' || order.payment_status === 'PAID') {
    return 'Đã thanh toán'
  }
  if (order.paymentStatus === 'DA_HOAN_TIEN' || order.payment_status === 'REFUNDED') {
    return 'Đã hoàn tiền'
  }
  return 'Chưa thanh toán'
}

const getCancellationLossLabel = (order) => {
  if (order.cancellationLossType === 'FULL_ORDER_LOSS') return 'Hủy có hao hụt'
  if (order.cancellationLossType === 'NO_MATERIAL_LOSS') return 'Hủy không hao hụt'
  return ''
}

const applyTableBorders = (worksheet, range) => {
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: column })
      if (!worksheet[address]) worksheet[address] = { t: 's', v: '' }
      worksheet[address].s = {
        ...worksheet[address].s,
        border: thinBorder,
        alignment: {
          vertical: 'center',
          wrapText: true,
          ...worksheet[address].s?.alignment,
        },
      }
    }
  }
}

export function buildReportWorkbook({ shopName = 'Quán Nhỏ', stats, exportedAt = new Date() }) {
  const workbook = XLSX.utils.book_new()
  const summaryRows = [
    [`BÁO CÁO DOANH THU & KINH DOANH - ${shopName.toUpperCase()}`],
    ['Kỳ báo cáo:', stats.label || ''],
    ['Thời gian xuất:', exportedAt.toLocaleString('vi-VN')],
    [],
    ['CHỈ SỐ DOANH THU & ĐƠN HÀNG', 'GIÁ TRỊ'],
    ['Doanh thu thực (Net Revenue)', Number(stats.netRevenue || 0)],
    ['Tổng doanh thu gộp', Number(stats.totalGrossRevenue || 0)],
    ['Tiền hoàn hủy đơn', Number(stats.totalRefundAmount || 0)],
    ['Tổng số đơn', Number(stats.totalOrdersCount || 0)],
    ['Đơn thành công', Number(stats.paidOrdersCount || 0)],
    ['Giá trị trung bình đơn (AOV)', Number(stats.averageOrderValue || 0)],
    ['Tổng số phần món phục vụ', Number(stats.totalItemsSold || 0)],
    ['Doanh thu tiền mặt', Number(stats.cashRevenue || 0)],
    ['Doanh thu chuyển khoản VietQR', Number(stats.transferRevenue || 0)],
    ['Đơn hủy không hao hụt', Number(stats.noMaterialLossCancellationCount || 0)],
    ['Đơn hủy có hao hụt', Number(stats.fullOrderLossCancellationCount || 0)],
    ['Tiền lỗ do đơn hủy', Number(stats.totalCancellationLoss || 0)],
  ]
  const summary = XLSX.utils.aoa_to_sheet(summaryRows)
  summary['!merges'] = [XLSX.utils.decode_range('A1:B1')]
  summary['!cols'] = [{ wch: 38 }, { wch: 26 }]
  summary['!rows'] = [{ hpt: 28 }, { hpt: 22 }, { hpt: 22 }, { hpt: 8 }, { hpt: 24 }]
  summary.A1.s = {
    font: { bold: true, color: { rgb: COLORS.white }, sz: 15 },
    fill: { patternType: 'solid', fgColor: { rgb: COLORS.brown } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  }
  for (const address of ['A2', 'A3']) {
    summary[address].s = { font: { bold: true, color: { rgb: COLORS.brown } } }
  }
  for (const address of ['A5', 'B5']) {
    summary[address].s = {
      font: { bold: true, color: { rgb: COLORS.white } },
      fill: { patternType: 'solid', fgColor: { rgb: COLORS.gold } },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }
  applyTableBorders(summary, XLSX.utils.decode_range('A5:B17'))
  for (let row = 6; row <= 17; row += 1) {
    summary[`A${row}`].s.fill = {
      patternType: 'solid',
      fgColor: { rgb: row % 2 === 0 ? COLORS.cream : COLORS.white },
    }
    summary[`B${row}`].s.fill = summary[`A${row}`].s.fill
    summary[`B${row}`].s.alignment = { horizontal: 'right', vertical: 'center' }
  }
  for (const row of [6, 7, 8, 11, 13, 14, 17]) summary[`B${row}`].z = '#,##0 "₫"'
  for (const row of [9, 10, 12, 15, 16]) summary[`B${row}`].z = '#,##0'
  XLSX.utils.book_append_sheet(workbook, summary, 'Tổng Quan')

  const orderHeaders = [
    'Mã đơn',
    'Thời gian',
    'Thu ngân',
    'Phương thức thanh toán',
    'Trạng thái',
    'Tổng tiền (VNĐ)',
    'Loại hủy',
    'Tiền lỗ của quán (VNĐ)',
  ]
  const orders = stats.orders || []
  const orderRows = orders.map((order) => [
    order.orderNumber || order.order_code || order.id,
    new Date(order.createdAt || order.created_at),
    order.createdBy || 'Chủ quán',
    getOrderPaymentMethod(order),
    getOrderPaymentStatus(order),
    Number(order.totalAmount ?? order.total_amount ?? 0),
    getCancellationLossLabel(order),
    Number(order.lossAmount ?? order.loss_amount ?? 0),
  ])
  if (orderRows.length === 0) orderRows.push(['(Chưa có đơn hàng trong kỳ này)', '', '', '', '', '', '', ''])

  const orderSheet = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows], { cellDates: true })
  const orderLastRow = orderRows.length + 1
  orderSheet['!cols'] = [
    { wch: 17 },
    { wch: 22 },
    { wch: 18 },
    { wch: 27 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
  ]
  orderSheet['!rows'] = [{ hpt: 25 }]
  orderSheet['!autofilter'] = { ref: `A1:H${orderLastRow}` }
  orderSheet['!freeze'] = { xSplit: 0, ySplit: 1 }
  for (let column = 0; column < orderHeaders.length; column += 1) {
    const address = XLSX.utils.encode_cell({ r: 0, c: column })
    orderSheet[address].s = {
      font: { bold: true, color: { rgb: COLORS.white } },
      fill: { patternType: 'solid', fgColor: { rgb: COLORS.gold } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    }
  }
  applyTableBorders(orderSheet, XLSX.utils.decode_range(`A1:H${orderLastRow}`))
  for (let row = 2; row <= orderLastRow; row += 1) {
    if (orders.length > 0) {
      orderSheet[`B${row}`].z = 'dd/mm/yyyy hh:mm'
      orderSheet[`F${row}`].z = '#,##0 "₫"'
      orderSheet[`H${row}`].z = '#,##0 "₫"'
      const isPaid = orderSheet[`E${row}`].v === 'Đã thanh toán'
      orderSheet[`E${row}`].s = {
        ...orderSheet[`E${row}`].s,
        font: { bold: true, color: { rgb: isPaid ? COLORS.greenText : COLORS.redText } },
        fill: {
          patternType: 'solid',
          fgColor: { rgb: isPaid ? COLORS.green : COLORS.red },
        },
        alignment: { horizontal: 'center', vertical: 'center' },
      }
    }
  }
  XLSX.utils.book_append_sheet(workbook, orderSheet, 'Danh Sách Đơn Hàng')

  return workbook
}

export function saveReportWorkbook(workbook, filename) {
  XLSX.writeFile(workbook, filename)
}
