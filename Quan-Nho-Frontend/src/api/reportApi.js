import { mockDb } from './mockDb'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const reportApi = {
  async getDailyStats(selectedDate = null) {
    await delay(200)
    const allOrders = mockDb.getOrders()

    // Filter by date if provided (YYYY-MM-DD), otherwise today
    const targetDate = selectedDate || new Date().toISOString().slice(0, 10)
    const orders = allOrders.filter((o) => o.createdAt.startsWith(targetDate))

    // Valid paid orders (exclude fully cancelled without revenue or calculate refund)
    const paidOrders = orders.filter((o) => o.paymentStatus === 'DA_THANH_TOAN')
    const cancelledOrders = orders.filter((o) => o.fulfillmentStatus === 'DA_HUY' || o.paymentStatus === 'DA_HOAN_TIEN')

    // Revenue calculations (all in integers VND)
    let totalGrossRevenue = 0
    let totalRefundAmount = 0
    let cashRevenue = 0
    let transferRevenue = 0
    let cashCount = 0
    let transferCount = 0

    orders.forEach((o) => {
      if (o.paymentStatus === 'DA_THANH_TOAN') {
        totalGrossRevenue += o.totalAmount
        if (o.paymentMethod === 'TIEN_MAT') {
          cashRevenue += o.totalAmount
          cashCount++
        } else {
          transferRevenue += o.totalAmount
          transferCount++
        }
      } else if (o.paymentStatus === 'DA_HOAN_TIEN') {
        totalRefundAmount += o.refundAmount || o.totalAmount
      }
    })

    const netRevenue = totalGrossRevenue - totalRefundAmount

    // Best selling items aggregation
    const itemMap = {}
    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            name: item.name,
            totalQuantity: 0,
            totalSales: 0,
          }
        }
        itemMap[item.name].totalQuantity += item.quantity
        itemMap[item.name].totalSales += item.lineTotal
      })
    })

    const bestSellers = Object.values(itemMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)

    return {
      date: targetDate,
      totalOrdersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      totalGrossRevenue,
      totalRefundAmount,
      netRevenue,
      cashRevenue,
      cashCount,
      transferRevenue,
      transferCount,
      bestSellers,
    }
  },
}
