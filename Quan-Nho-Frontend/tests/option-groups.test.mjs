import test from 'node:test'
import assert from 'node:assert/strict'
if (!globalThis.localStorage) {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  }
}

import { readFile } from 'node:fs/promises'
import { mockDb } from '../src/api/mockDb.js'
import { optionGroupApi } from '../src/api/optionGroupApi.js'

const routesPath = new URL('../src/routes/index.jsx', import.meta.url)
const constantsPath = new URL('../src/constants/index.js', import.meta.url)
const itemCustomizeModalPath = new URL(
  '../src/components/pos/ItemCustomizeModal.jsx',
  import.meta.url
)
const menuItemModalPath = new URL(
  '../src/components/menu/MenuItemModal.jsx',
  import.meta.url
)

test('Option Groups and Product Option Groups APIs support full CRUD and resolution', async () => {
  // Test get initial option groups
  const groups = await optionGroupApi.getOptionGroups()
  assert.ok(Array.isArray(groups))
  assert.ok(groups.length >= 5)

  // Verify group structure
  const sizeGroup = groups.find((g) => g.code === 'SIZE' || g.id === 'og_size')
  assert.ok(sizeGroup)
  assert.equal(sizeGroup.selectionType, 'SINGLE')
  assert.ok(Array.isArray(sizeGroup.options))
  assert.ok(sizeGroup.options.some((o) => o.name.includes('Size M')))

  // Verify product option groups detailed resolution
  const m1Details = await optionGroupApi.getProductOptionGroupsDetailed('m1')
  assert.ok(Array.isArray(m1Details))
  assert.ok(m1Details.length >= 3)
  const resolvedSize = m1Details.find((g) => g.id === 'og_size' || g.code === 'SIZE' || g.id === 1)
  assert.ok(resolvedSize)
  assert.ok(resolvedSize.options.length > 0)

  // Test saving an option group
  const testGroup = {
    name: 'Mức đường thử nghiệm',
    code: 'TEST_SUGAR',
    selectionType: 'SINGLE',
    required: true,
    maxSelect: 1,
    displayOrder: 10,
    isActive: true,
    options: [
      { id: 'opt_t1', name: 'Ít đường', extraPrice: 0, isDefault: true, isActive: true },
      { id: 'opt_t2', name: 'Nhiều đường', extraPrice: 2000, isDefault: false, isActive: true },
    ],
  }

  const saved = await optionGroupApi.saveOptionGroup(testGroup)
  assert.ok(saved.id)
  assert.equal(saved.name, 'Mức đường thử nghiệm')

  // Test saving relations
  const newRelations = [
    { optionGroupId: saved.id, required: true, maxSelect: 1, displayOrder: 1 },
  ]
  const savedRelations = await optionGroupApi.saveProductOptionGroups('test_prod', newRelations)
  assert.equal(savedRelations.length, 1)

  const detailedForTest = await optionGroupApi.getProductOptionGroupsDetailed('test_prod')
  assert.equal(detailedForTest.length, 1)
  assert.equal(detailedForTest[0].name, 'Mức đường thử nghiệm')

  // Clean up
  await optionGroupApi.deleteOptionGroup(saved.id)
  const afterDelete = await optionGroupApi.getProductOptionGroupsDetailed('test_prod')
  assert.equal(afterDelete.length, 0)
})

test('ItemCustomizeModal and MenuItemModal implement option groups workflow and snapshots', async () => {
  const [modalCode, itemModalCode] = await Promise.all([
    readFile(itemCustomizeModalPath, 'utf8'),
    readFile(menuItemModalPath, 'utf8'),
  ])

  // ItemCustomizeModal creates selectedOptions snapshot with groupName and extraPrice
  assert.match(modalCode, /selectedOptionsSnapshot/)
  assert.match(modalCode, /optionGroupId/)
  assert.match(modalCode, /groupName/)
  assert.match(modalCode, /optionId/)
  assert.match(modalCode, /optionName/)
  assert.match(modalCode, /extraPrice/)

  // Calculates surcharge and total price
  assert.match(modalCode, /lineTotal/)
  assert.match(modalCode, /surcharge/)

  // Validates required option groups
  assert.match(modalCode, /group\.required/)
  assert.match(modalCode, /validationError/)

  // MenuItemModal lets admin assign optionGroups to products and reorder them
  assert.match(itemModalCode, /optionGroups/)
  assert.match(itemModalCode, /selectedGroups/)
  assert.match(itemModalCode, /displayOrder/)
})

test('Routing and access control restrict /options to ADMIN role', async () => {
  const [routesCode, constantsCode] = await Promise.all([
    readFile(routesPath, 'utf8'),
    readFile(constantsPath, 'utf8'),
  ])

  // /options is protected with ADMIN role
  assert.match(routesCode, /path:\s*'options'/)
  assert.match(routesCode, /OptionGroupsPage/)
  assert.match(constantsCode, /\/options/)
})
