import assert from 'node:assert/strict'
import test from 'node:test'
import { countCategoryProducts, removeById, upsertById } from '../src/utils/catalogCollection.js'

test('upsertById keeps the collection shape while replacing a persisted record', () => {
  const existing = [{ id: 1, name: 'Trà' }, { id: 2, name: 'Cà phê' }]

  assert.deepEqual(upsertById(existing, { id: 2, name: 'Cà phê sữa' }), [
    { id: 1, name: 'Trà' },
    { id: 2, name: 'Cà phê sữa' },
  ])
})

test('removeById handles boolean delete responses without replacing the collection', () => {
  assert.deepEqual(removeById([{ id: 1 }, { id: 2 }], 1), [{ id: 2 }])
})

test('category usage compares persisted numeric category ids instead of category codes', () => {
  assert.equal(countCategoryProducts([
    { category: 'COFFEE', category_id: 4 },
    { category: 'TEA', category_id: 5 },
    { category: 'COFFEE', category_id: '4' },
  ], 4), 2)
})
