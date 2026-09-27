import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const historyUrl = new URL('../src/pages/OrderHistory/index.jsx', import.meta.url)
const badgeUrl = new URL('../src/components/common/Badge.jsx', import.meta.url)

test('order history presents the counter pickup workflow and real transition action', async () => {
  const code = await readFile(historyUrl, 'utf8')

  for (const label of ['Mới nhận', 'Đang chuẩn bị', 'Chờ khách nhận', 'Hoàn tất', 'Đã hủy']) {
    assert.match(code, new RegExp(label))
  }

  assert.match(code, /getNextFulfillmentAction/)
  assert.match(code, /orderApi\.updateFulfillmentStatus/)
  assert.doesNotMatch(code, /Chờ làm|Sẵn sàng|Đã giao/)
})

test('shared badge uses fulfillment-specific status metadata', async () => {
  const code = await readFile(badgeUrl, 'utf8')

  assert.match(code, /FULFILLMENT_STATUS/)
  assert.match(code, /config = FULFILLMENT_STATUS\[statusKey\]/)
})

test('reports and integration guide use the persisted pickup status contract', async () => {
  const [reportApi, reportsPage, guide] = await Promise.all([
    readFile(new URL('../src/api/reportApi.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/Reports/index.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/api/springBootGuide.js', import.meta.url), 'utf8'),
  ])

  assert.doesNotMatch(reportApi, /fulfillmentStatus === 'DA_HUY'/)
  assert.doesNotMatch(reportsPage, /fulfillmentStatus === 'DA_HUY'/)
  assert.match(reportApi, /fulfillmentStatus === 'CANCELLED'/)
  assert.match(reportsPage, /fulfillmentStatus === 'CANCELLED'/)
  assert.match(guide, /Body: \{ "status": "PREPARING" \| "READY_FOR_PICKUP" \| "COMPLETED" \}/)
  assert.doesNotMatch(guide, /DANG_LAM|SAN_SANG|DA_GIAO/)
})
