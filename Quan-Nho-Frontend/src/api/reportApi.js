import { orderApi } from './orderApi.js'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

function getStartOfWeek(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  // Adjust so Monday is 0, Sunday is 6
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().slice(0, 10)
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const reportApi = {
  /**
   * Universal advanced report statistics calculator
   * @param {Object} options
   * @param {'day'|'week'|'month'|'year'|'custom'} [options.periodType='day']
   * @param {string} [options.date] - YYYY-MM-DD for day/week calculation
   * @param {string} [options.month] - YYYY-MM for month calculation
   * @param {number|string} [options.year] - YYYY for year calculation
   * @param {string} [options.fromDate] - YYYY-MM-DD for custom range
   * @param {string} [options.toDate] - YYYY-MM-DD for custom range
   */
  async getStats(options = {}) {
    await delay(150)
    const allOrders = await orderApi.getOrders()
    const periodType = options.periodType || 'day'
    const todayStr = new Date().toISOString().slice(0, 10)

    let fromDate = options.fromDate
    let toDate = options.toDate
    let label = ''
    let timeline = []

    if (periodType === 'day') {
      const targetDate = options.date || todayStr
      fromDate = targetDate
      toDate = targetDate
      label = `Ngày ${targetDate.split('-').reverse().join('/')}`

      // Create hourly timeline buckets (from 6:00 to 23:00)
      const hourBuckets = [
        { label: '06h - 08h', startH: 6, endH: 8, revenue: 0, orders: 0 },
        { label: '08h - 10h', startH: 8, endH: 10, revenue: 0, orders: 0 },
        { label: '10h - 12h', startH: 10, endH: 12, revenue: 0, orders: 0 },
        { label: '12h - 14h', startH: 12, endH: 14, revenue: 0, orders: 0 },
        { label: '14h - 16h', startH: 14, endH: 16, revenue: 0, orders: 0 },
        { label: '16h - 18h', startH: 16, endH: 18, revenue: 0, orders: 0 },
        { label: '18h - 20h', startH: 18, endH: 20, revenue: 0, orders: 0 },
        { label: '20h - 22h', startH: 20, endH: 22, revenue: 0, orders: 0 },
        { label: '22h - 24h', startH: 22, endH: 24, revenue: 0, orders: 0 },
      ]
      timeline = hourBuckets
    } else if (periodType === 'week') {
      const refDate = options.date || todayStr
      const startOfWeek = getStartOfWeek(refDate)
      fromDate = startOfWeek
      toDate = addDays(startOfWeek, 6)
      const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

      timeline = dayNames.map((name, i) => {
        const dStr = addDays(startOfWeek, i)
        return {
          key: dStr,
          label: `${name} (${dStr.slice(8, 10)}/${dStr.slice(5, 7)})`,
          shortLabel: name,
          dateStr: dStr,
          revenue: 0,
          orders: 0,
        }
      })
      label = `Tuần (${timeline[0].dateStr.slice(8, 10)}/${timeline[0].dateStr.slice(5, 7)} - ${timeline[6].dateStr.slice(8, 10)}/${timeline[6].dateStr.slice(5, 7)}/${timeline[6].dateStr.slice(0, 4)})`
    } else if (periodType === 'month') {
      const monthStr = options.month || todayStr.slice(0, 7) // YYYY-MM
      const [yr, mo] = monthStr.split('-').map(Number)
      const daysInMonth = new Date(yr, mo, 0).getDate()
      fromDate = `${monthStr}-01`
      toDate = `${monthStr}-${String(daysInMonth).padStart(2, '0')}`
      label = `Tháng ${mo}/${yr}`

      timeline = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1
        const dStr = `${monthStr}-${String(dayNum).padStart(2, '0')}`
        return {
          key: dStr,
          label: `${String(dayNum).padStart(2, '0')}/${String(mo).padStart(2, '0')}`,
          shortLabel: String(dayNum),
          dateStr: dStr,
          revenue: 0,
          orders: 0,
        }
      })
    } else if (periodType === 'year') {
      const yr = Number(options.year || todayStr.slice(0, 4))
      fromDate = `${yr}-01-01`
      toDate = `${yr}-12-31`
      label = `Năm ${yr}`

      timeline = Array.from({ length: 12 }, (_, i) => {
        const mo = i + 1
        const monthKey = `${yr}-${String(mo).padStart(2, '0')}`
        return {
          key: monthKey,
          label: `Tháng ${mo}`,
          shortLabel: `T${mo}`,
          revenue: 0,
          orders: 0,
        }
      })
    } else {
      // Custom range
      fromDate = options.fromDate || todayStr
      toDate = options.toDate || todayStr
      label = `${fromDate.split('-').reverse().join('/')} - ${toDate.split('-').reverse().join('/')}`

      // Create daily timeline between fromDate and toDate (capped at 60 days)
      let cur = fromDate
      const diffDays = Math.min(
        60,
        Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1)
      )
      timeline = Array.from({ length: diffDays }, (_, i) => {
        const dStr = addDays(fromDate, i)
        return {
          key: dStr,
          label: `${dStr.slice(8, 10)}/${dStr.slice(5, 7)}`,
          shortLabel: dStr.slice(8, 10),
          dateStr: dStr,
          revenue: 0,
          orders: 0,
        }
      })
    }

    // Filter orders within [fromDate, toDate]
    const orders = allOrders.filter((o) => {
      const orderDate = (o.createdAt || o.created_at || '').slice(0, 10)
      if (!orderDate) return false
      return orderDate >= fromDate && orderDate <= toDate
    })

    // Sort orders descending by createdAt for transaction table
    const sortedOrders = [...orders].sort((a, b) => {
      const da = new Date(a.createdAt || a.created_at || 0)
      const db = new Date(b.createdAt || b.created_at || 0)
      return db - da
    })

    const paidOrders = orders.filter((o) => o.paymentStatus === 'DA_THANH_TOAN' || o.payment_status === 'PAID')
    const cancelledOrders = orders.filter(
      (o) =>
        o.fulfillmentStatus === 'DA_HUY' ||
        o.status === 'CANCELLED' ||
        o.paymentStatus === 'DA_HOAN_TIEN' ||
        o.payment_status === 'REFUNDED'
    )

    let totalGrossRevenue = 0
    let totalRefundAmount = 0
    let cashRevenue = 0
    let transferRevenue = 0
    let cashCount = 0
    let transferCount = 0
    let totalItemsSold = 0

    orders.forEach((o) => {
      const isPaid = o.paymentStatus === 'DA_THANH_TOAN' || o.payment_status === 'PAID'
      const isRefunded = o.paymentStatus === 'DA_HOAN_TIEN' || o.payment_status === 'REFUNDED'
      const amount = Number(o.totalAmount ?? o.total_amount ?? 0)

      if (isPaid) {
        totalGrossRevenue += amount
        const method = o.paymentMethod || o.payment_method
        const isCash = method === 'TIEN_MAT' || method === 'CASH'
        if (isCash) {
          cashRevenue += amount
          cashCount++
        } else {
          transferRevenue += amount
          transferCount++
        }

        // Add to timeline
        const created = new Date(o.createdAt || o.created_at)
        const dateStr = (o.createdAt || o.created_at || '').slice(0, 10)

        let bucket = null
        if (periodType === 'day') {
          const hour = created.getHours()
          bucket = timeline.find((b) => hour >= b.startH && hour < b.endH)
        } else if (periodType === 'week' || periodType === 'month' || periodType === 'custom') {
          bucket = timeline.find((b) => b.dateStr === dateStr)
        } else if (periodType === 'year') {
          const monthKey = dateStr.slice(0, 7)
          bucket = timeline.find((b) => b.key === monthKey)
        }

        if (bucket) {
          bucket.revenue += amount
          bucket.orders++
          if (isCash) {
            bucket.cashRevenue = (bucket.cashRevenue || 0) + amount
          } else {
            bucket.transferRevenue = (bucket.transferRevenue || 0) + amount
          }
        }
      } else if (isRefunded) {
        totalRefundAmount += Number(o.refundAmount ?? o.refund_amount ?? amount)
      }
    })

    const netRevenue = totalGrossRevenue - totalRefundAmount
    const averageOrderValue = paidOrders.length > 0 ? Math.round(netRevenue / paidOrders.length) : 0

    // Item aggregation
    const itemMap = {}
    paidOrders.forEach((order) => {
      const orderItems = order.items || order.order_items || []
      orderItems.forEach((item) => {
        const itemName = item.name || item.product_name || 'Món'
        if (!itemMap[itemName]) {
          itemMap[itemName] = {
            name: itemName,
            totalQuantity: 0,
            totalSales: 0,
          }
        }
        const qty = Number(item.quantity || item.qty || 1)
        const sales = Number(
          item.lineTotal ??
            item.line_total ??
            ((item.unitPrice ?? item.unit_price ?? item.base_price ?? 0) * qty)
        )
        itemMap[itemName].totalQuantity += qty
        itemMap[itemName].totalSales += sales
        totalItemsSold += qty
      })
    })

    const bestSellers = Object.values(itemMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        percentage: totalGrossRevenue > 0 ? Math.round((item.totalSales / totalGrossRevenue) * 100) : 0,
      }))

    return {
      periodType,
      label,
      fromDate,
      toDate,
      date: options.date || todayStr,
      totalOrdersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      totalGrossRevenue,
      totalRefundAmount,
      netRevenue,
      averageOrderValue,
      totalItemsSold,
      cashRevenue,
      cashCount,
      transferRevenue,
      transferCount,
      bestSellers,
      timeline,
      orders: sortedOrders,
    }
  },

  /**
   * Backwards compatible daily stats method for existing tests
   */
  async getDailyStats(selectedDate = null) {
    return this.getStats({
      periodType: 'day',
      date: selectedDate || new Date().toISOString().slice(0, 10),
    })
  },
}
