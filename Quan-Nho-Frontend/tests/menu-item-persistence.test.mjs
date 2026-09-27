import test from 'node:test'
import assert from 'node:assert/strict'
import { persistMenuItem } from '../src/utils/menuItemPersistence.js'

test('new menu item relations use the numeric id returned by the backend', async () => {
  const calls = []
  const saved = await persistMenuItem(
    { name: 'Cà phê mới', base_price: 30000 },
    [{ option_group_id: 1 }],
    {
      saveItem: async (item) => {
        calls.push(['item', item.id])
        return { ...item, id: 42 }
      },
      saveRelations: async (productId, relations) => {
        calls.push(['relations', productId, relations])
      },
    }
  )

  assert.equal(saved.id, 42)
  assert.deepEqual(calls, [
    ['item', undefined],
    ['relations', 42, [{ option_group_id: 1 }]],
  ])
})
