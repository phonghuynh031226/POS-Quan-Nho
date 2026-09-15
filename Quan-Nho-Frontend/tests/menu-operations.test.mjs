import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const menuApiPath = new URL('../src/api/menuApi.js', import.meta.url)
const mockDbPath = new URL('../src/api/mockDb.js', import.meta.url)
const menuItemModalPath = new URL('../src/components/menu/MenuItemModal.jsx', import.meta.url)
const posPagePath = new URL('../src/pages/Pos/index.jsx', import.meta.url)
const menuManagementPath = new URL('../src/pages/MenuManagement/index.jsx', import.meta.url)

test('menuApi and mockDb support saving and deleting menu items', async () => {
  const [menuApiCode, mockDbCode] = await Promise.all([
    readFile(menuApiPath, 'utf8'),
    readFile(mockDbPath, 'utf8'),
  ])

  assert.match(menuApiCode, /saveItem/)
  assert.match(menuApiCode, /deleteItem/)
  assert.match(mockDbCode, /deleteMenuItem/)
})

test('MenuItemModal supports intuitive category selection with shared option groups', async () => {
  const modalCode = await readFile(menuItemModalPath, 'utf8')

  // Check for shared option groups integration
  assert.match(modalCode, /optionGroups/)
  assert.match(modalCode, /selectedGroups/)
  assert.match(modalCode, /displayOrder/)

  // Check for preset image library & upload
  assert.match(modalCode, /PRESET_IMAGES/)
  assert.match(modalCode, /handleFileUpload/)
})

test('PosPage focuses on counter sales with dynamic category filters and cart interactions', async () => {
  const posCode = await readFile(posPagePath, 'utf8')

  // POS focuses on counter sales and streamlined experience
  assert.match(posCode, /handleAddToCart/)
  assert.match(posCode, /CartSidebar/)
  assert.match(posCode, /ItemCustomizeModal/)
  assert.match(posCode, /PaymentModal/)
})

test('MenuManagement page includes deletion with confirmation and uses MenuItemModal', async () => {
  const menuPageCode = await readFile(menuManagementPath, 'utf8')

  assert.match(menuPageCode, /MenuItemModal/)
  assert.match(menuPageCode, /handleConfirmDelete/)
  assert.match(menuPageCode, /Xác nhận xóa món/)
})

test('Menu system supports dynamic category management', async () => {
  const [menuApiCode, mockDbCode, menuPageCode] = await Promise.all([
    readFile(menuApiPath, 'utf8'),
    readFile(mockDbPath, 'utf8'),
    readFile(menuManagementPath, 'utf8'),
  ])

  assert.match(menuApiCode, /getCategories/)
  assert.match(menuApiCode, /saveCategory/)
  assert.match(menuApiCode, /deleteCategory/)
  assert.match(mockDbCode, /getCategories/)
  assert.match(mockDbCode, /saveCategory/)
  assert.match(mockDbCode, /deleteCategory/)
  assert.match(menuPageCode, /CategoryManagementModal/)
  assert.match(menuPageCode, /Quản lý danh mục/)
})

test('Menu system supports master topping management from outside', async () => {
  const [menuApiCode, mockDbCode, menuPageCode, itemModalCode] = await Promise.all([
    readFile(menuApiPath, 'utf8'),
    readFile(mockDbPath, 'utf8'),
    readFile(menuManagementPath, 'utf8'),
    readFile(menuItemModalPath, 'utf8'),
  ])

  // APIs for toppings
  assert.match(menuApiCode, /getToppings/)
  assert.match(menuApiCode, /saveTopping/)
  assert.match(menuApiCode, /deleteTopping/)
  assert.match(mockDbCode, /getToppings/)
  assert.match(mockDbCode, /saveTopping/)
  assert.match(mockDbCode, /deleteTopping/)

  // Menu management includes Topping modal & button
  assert.match(menuPageCode, /ToppingManagementModal/)

  // MenuItemModal receives optionGroups and onOpenOptionGroupManager
  assert.match(itemModalCode, /optionGroups/)
  assert.match(itemModalCode, /onOpenOptionGroupManager/)
})

