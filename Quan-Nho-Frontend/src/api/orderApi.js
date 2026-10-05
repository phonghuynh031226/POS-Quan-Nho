import apiClient from './apiClient'

export const orderApi = {
  async createOrder(orderPayload) {
    const { data } = await apiClient.post('/orders', orderPayload)
    return data
  },

  async getOrders(filters = {}) {
    const { data } = await apiClient.get('/orders')
    return (data || []).filter((order) => {
      if (filters.paymentStatus && filters.paymentStatus !== 'ALL' &&
          order.paymentStatus !== filters.paymentStatus && order.payment_status !== filters.paymentStatus) return false
      if (filters.fulfillmentStatus && filters.fulfillmentStatus !== 'ALL' &&
          order.fulfillmentStatus !== filters.fulfillmentStatus) return false
      if (filters.date && String(order.createdAt || '').slice(0, 10) !== filters.date) return false
      if (filters.search && filters.search.trim()) {
        const query = filters.search.trim().toLowerCase()
        const normalizedQuery = query.replace(/^od[-_ ]?/i, 'qn-')
        const digitsOnly = query.replace(/\D/g, '')

        const orderNumber = String(order.orderNumber || order.order_code || '').toLowerCase()
        const orderId = String(order.id || '')
        const createdBy = String(order.createdBy || order.creator_name || '').toLowerCase()
        const customerNote = String(order.customerNote || order.customer_note || '').toLowerCase()

        const matchCode =
          orderNumber.includes(query) ||
          orderNumber.includes(normalizedQuery) ||
          orderId.includes(query) ||
          (digitsOnly && orderNumber.replace(/\D/g, '').includes(digitsOnly))
        const matchCreator = createdBy.includes(query)
        const matchNote = customerNote.includes(query)
        const matchItems = Array.isArray(order.items) && order.items.some((item) => {
          const itemName = String(item?.name || item?.product_name || '').toLowerCase()
          const itemNote = String(item?.notes || item?.customer_note || '').toLowerCase()
          return itemName.includes(query) || itemNote.includes(query)
        })

        return matchCode || matchCreator || matchNote || matchItems
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

  async updateFulfillmentStatus(id, status) {
    const { data } = await apiClient.patch(`/orders/${id}/fulfillment-status`, { status })
    return data
  },

  async markReprint(id) {
    return this.getOrderById(id)
  },
}
