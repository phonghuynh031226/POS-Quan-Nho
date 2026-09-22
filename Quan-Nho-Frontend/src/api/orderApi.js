import apiClient from './apiClient'

export const orderApi = {
  async createOrder(orderPayload) {
    const { data } = await apiClient.post('/orders', orderPayload)
    return data
  },

  async getOrders(filters = {}) {
    const { data } = await apiClient.get('/orders')
    return data.filter((order) => {
      if (filters.paymentStatus && filters.paymentStatus !== 'ALL' &&
          order.paymentStatus !== filters.paymentStatus && order.payment_status !== filters.paymentStatus) return false
      if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'ALL' &&
          order.fulfillmentStatus !== filters.fulfillmentStatus) return false
      if (filters.date && String(order.createdAt).slice(0, 10) !== filters.date) return false
      if (filters.search) {
        const query = filters.search.trim().toLowerCase()
        return order.orderNumber.toLowerCase().includes(query) ||
          order.createdBy.toLowerCase().includes(query) ||
          order.items.some((item) => item.name.toLowerCase().includes(query))
      }
      return true
    })
  },

  async getOrderById(id) {
    const { data } = await apiClient.get(`/orders/${id}`)
    return data
  },

  async cancelOrder(id, reason, refundAmount) {
    const { data } = await apiClient.post(`/orders/${id}/cancel`, { reason, refundAmount })
    return data
  },

  async markReprint(id) {
    return this.getOrderById(id)
  },
}
