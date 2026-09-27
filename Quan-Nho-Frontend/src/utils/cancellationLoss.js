const safeAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

export function getCancellationLossPreview(order) {
  const hasMaterialLoss = ['PREPARING', 'READY_FOR_PICKUP'].includes(order?.fulfillmentStatus)

  if (hasMaterialLoss) {
    return {
      type: 'FULL_ORDER_LOSS',
      lossAmount: safeAmount(order?.totalAmount ?? order?.total_amount),
      label: 'Hủy có hao hụt',
      description: 'Quán đã bắt đầu làm món nên ghi nhận lỗ toàn bộ giá trị đơn.',
    }
  }

  return {
    type: 'NO_MATERIAL_LOSS',
    lossAmount: 0,
    label: 'Hủy không hao hụt nguyên liệu',
    description: 'Món chưa được chế biến; quán không ghi nhận tiền nguyên liệu bị lỗ.',
  }
}

export function summarizeCancellationLoss(cancelledOrders = []) {
  return cancelledOrders.reduce(
    (summary, order) => {
      if (order?.cancellationLossType === 'NO_MATERIAL_LOSS') {
        summary.noMaterialLossCancellationCount += 1
      } else if (order?.cancellationLossType === 'FULL_ORDER_LOSS') {
        summary.fullOrderLossCancellationCount += 1
        summary.totalCancellationLoss += safeAmount(order.lossAmount ?? order.loss_amount)
      }
      return summary
    },
    {
      noMaterialLossCancellationCount: 0,
      fullOrderLossCancellationCount: 0,
      totalCancellationLoss: 0,
    }
  )
}
