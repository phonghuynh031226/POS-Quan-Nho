const CANCELLABLE_FULFILLMENT_STATUSES = new Set(['NEW', 'PREPARING', 'READY_FOR_PICKUP'])

const NEXT_FULFILLMENT_ACTIONS = {
  NEW: { nextStatus: 'PREPARING', label: 'Bắt đầu làm' },
  PREPARING: { nextStatus: 'READY_FOR_PICKUP', label: 'Làm xong' },
  READY_FOR_PICKUP: { nextStatus: 'COMPLETED', label: 'Khách đã nhận' },
}

export function canCancelOrder(order) {
  return CANCELLABLE_FULFILLMENT_STATUSES.has(order?.fulfillmentStatus)
}

export function getNextFulfillmentAction(order) {
  return NEXT_FULFILLMENT_ACTIONS[order?.fulfillmentStatus] || null
}
