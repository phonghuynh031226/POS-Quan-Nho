import { mockDb } from './mockDb'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export const orderApi = {
  async createOrder(orderPayload) {
    await delay(350)
    if (!orderPayload.items || orderPayload.items.length === 0) {
      throw new Error('Giỏ hàng trống, không thể tạo đơn')
    }

    if (orderPayload.paymentMethod === 'TIEN_MAT') {
      if ((orderPayload.cashGiven || 0) < orderPayload.totalAmount) {
        throw new Error('Tiền khách đưa chưa đủ để thanh toán đơn hàng')
      }
    }

    return mockDb.createOrder(orderPayload)
  },

  async getOrders(filters = {}) {
    await delay(150)
    let orders = mockDb.getOrders()

    if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'ALL') {
      orders = orders.filter((o) => o.fulfillmentStatus === filters.fulfillmentStatus)
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
      orders = orders.filter((o) => o.paymentStatus === filters.paymentStatus)
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase()
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.createdBy.toLowerCase().includes(q) ||
          o.items.some((i) => i.name.toLowerCase().includes(q))
      )
    }

    if (filters.date) {
      orders = orders.filter((o) => o.createdAt.startsWith(filters.date))
    }

    return orders
  },

  async getOrderById(id) {
    await delay(100)
    return mockDb.getOrderById(id)
  },

  async getOrderByToken(token) {
    await delay(200)
    const order = mockDb.getOrderByToken(token)
    if (!order) {
      throw new Error('Không tìm thấy thông tin đơn hàng hoặc mã tra cứu không hợp lệ')
    }
    return order
  },

  async updateFulfillmentStatus(orderId, newStatus) {
    await delay(200)
    return mockDb.updateFulfillmentStatus(orderId, newStatus)
  },

  async toggleKitchenItemDone(orderId, lineId) {
    await delay(100)
    return mockDb.toggleKitchenItemDone(orderId, lineId)
  },

  async cancelOrder(orderId, reason, refundAmount) {
    await delay(300)
    if (!reason || !reason.trim()) {
      throw new Error('Vui lòng nhập lý do hủy đơn hàng')
    }
    return mockDb.cancelOrder(orderId, reason.trim(), refundAmount)
  },

  async markReprint(orderId) {
    return mockDb.markReprint(orderId)
  },

  subscribe(callback) {
    return mockDb.subscribe(callback)
  },
}
