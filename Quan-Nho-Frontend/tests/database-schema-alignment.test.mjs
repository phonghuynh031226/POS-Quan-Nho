import test from 'node:test'
import assert from 'node:assert/strict'

// Polyfill localStorage & window for Node environment
const storage = new Map()
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
}
globalThis.window = {
  location: { origin: 'http://localhost:5173' },
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
}

import { mockDb, STORAGE_KEYS } from '../src/api/mockDb.js'
import { settingsApi } from '../src/api/settingsApi.js'
import { ROLES, DEFAULT_SHOP_SETTINGS, DEFAULT_SEPAY_SETTINGS } from '../src/constants/index.js'

test('1. users table schema and sample data', () => {
  mockDb.init()
  const users = mockDb.getUsers()
  assert.ok(users.length >= 1)
  const admin = users.find((u) => u.username === 'admin')

  assert.ok(admin, 'Admin user should exist')
  assert.equal(admin.full_name, 'Chủ quán')
  assert.equal(admin.role, 'OWNER')
  assert.equal(admin.is_active, true)
  assert.ok(admin.created_at)
  assert.ok(admin.updated_at)
})

test('2. categories table: 5 categories without description', () => {
  const categories = mockDb.getCategories()
  assert.equal(categories.length, 5)

  const codes = categories.map((c) => c.code)
  assert.deepEqual(codes, ['COFFEE', 'OTHER_DRINKS', 'MILK_TEA', 'SNACKS', 'BAKERY'])

  // Check no description in any category
  categories.forEach((c) => {
    assert.equal(c.description, undefined, `Category ${c.code} must not have description`)
    assert.ok(typeof c.id === 'number', 'Category id should be integer')
    assert.ok(typeof c.display_order === 'number', 'display_order should be integer')
    assert.equal(c.is_active, true)
  })
})

test('3. products table: 11 products with integer base_price and no description', () => {
  const products = mockDb.getProducts()
  assert.equal(products.length, 11)

  const sampleProducts = [
    { code: 'CA_PHE_SUA_DA', price: 29000, catId: 1 },
    { code: 'BAC_XIU', price: 32000, catId: 1 },
    { code: 'CA_PHE_DEN', price: 25000, catId: 1 },
    { code: 'COLD_BREW_CAM_SA', price: 45000, catId: 1 },
    { code: 'CA_PHE_MUOI', price: 35000, catId: 1 },
    { code: 'TRA_DAO_CAM_SA', price: 38000, catId: 2 },
    { code: 'TRA_VAI_HOA_LAI', price: 38000, catId: 2 },
    { code: 'TRA_SUA_O_LONG', price: 42000, catId: 3 },
    { code: 'KHOAI_TAY_CHIEN', price: 35000, catId: 4 },
    { code: 'CA_VIEN_CHIEN', price: 35000, catId: 4 },
    { code: 'BANH_MI_QUE', price: 24000, catId: 4 },
  ]

  sampleProducts.forEach((expected) => {
    const p = products.find((prod) => prod.code === expected.code)
    assert.ok(p, `Product ${expected.code} must exist`)
    assert.equal(p.base_price, expected.price, `base_price for ${p.code} must be integer ${expected.price}`)
    assert.equal(p.category_id, expected.catId, `category_id for ${p.code} must match ${expected.catId}`)
    assert.equal(p.description, undefined, `Product ${p.code} must NOT have description`)
    assert.equal(p.is_available, true)
  })
})

test('4. option_groups and option_values tables schema and relations', () => {
  const groups = mockDb.getOptionGroups()
  assert.equal(groups.length, 7)

  const groupCodes = groups.map((g) => g.code)
  assert.deepEqual(groupCodes, ['SIZE', 'TEMPERATURE', 'SUGAR', 'ICE', 'TOPPING', 'SPICE', 'SAUCE'])

  // Check Size options
  const sizeGroup = groups.find((g) => g.code === 'SIZE')
  assert.equal(sizeGroup.selection_type, 'SINGLE')
  assert.equal(sizeGroup.default_required, true)
  assert.equal(sizeGroup.options.length, 3)

  const sizeM = sizeGroup.options.find((o) => o.code === 'SIZE_M')
  assert.ok(sizeM)
  assert.equal(sizeM.extra_price, 6000)

  // Check Topping options
  const toppingGroup = groups.find((g) => g.code === 'TOPPING')
  assert.equal(toppingGroup.selection_type, 'MULTIPLE')
  assert.equal(toppingGroup.default_required, false)
  assert.equal(toppingGroup.default_max_select, 5)
})

test('5. product_option_groups table relation validation', () => {
  const p1Relations = mockDb.getProductOptionGroupsDetailed(1) // Cà phê sữa
  assert.ok(p1Relations.length >= 4)
  assert.ok(p1Relations.some((r) => r.code === 'SIZE' && r.required === true))
  assert.ok(p1Relations.some((r) => r.code === 'TEMPERATURE' && r.required === true))
  assert.ok(p1Relations.some((r) => r.code === 'TOPPING' && r.required === false))

  const p9Relations = mockDb.getProductOptionGroupsDetailed(9) // Khoai tây chiên
  assert.ok(p9Relations.some((r) => r.code === 'SPICE'))
  assert.ok(p9Relations.some((r) => r.code === 'SAUCE'))
})

test('6. orders, order_items and order_item_options snapshots', () => {
  const orders = mockDb.getOrders()
  assert.ok(orders.length >= 2)

  const qn1 = orders.find((o) => o.order_code === 'QN-000001')
  assert.ok(qn1)
  assert.equal(qn1.status, 'COMPLETED')
  assert.equal(qn1.payment_status, 'PAID')
  assert.equal(qn1.payment_method, 'CASH')
  assert.equal(qn1.total_amount, 64000)
  assert.equal(qn1.cash_received, 100000)
  assert.equal(qn1.change_amount, 36000)
  assert.ok(qn1.order_items.length >= 2)

  // Validate item unit_price = base_price + option_extra_price
  const item1 = qn1.order_items[0]
  assert.equal(item1.unit_price, item1.base_price + item1.option_extra_price)
  assert.equal(item1.line_total, item1.unit_price * item1.quantity)
  assert.ok(item1.order_item_options.length > 0)
})

test('7. shop_settings table (In Bill configuration)', async () => {
  const shop = await settingsApi.getShopSettings()
  assert.equal(shop.shop_name, 'Quán Nhỏ')
  assert.equal(shop.shop_address, '123 Nguyễn Văn A')
  assert.equal(shop.wifi_name, 'QUAN_NHO_WIFI')
  assert.equal(shop.receipt_message, 'Cảm ơn quý khách, hẹn gặp lại!')
  assert.equal(shop.show_wifi_on_receipt, true)

  // Test updating shop settings
  const updated = await settingsApi.updateShopSettings({
    shop_name: 'Quán Nhỏ Coffee',
    shop_address: '456 Lê Lợi, TP.HCM',
    wifi_name: 'QUAN_NHO_5G',
    show_wifi_on_receipt: true,
  })
  assert.equal(updated.shop_name, 'Quán Nhỏ Coffee')
  assert.equal(updated.shop_address, '456 Lê Lợi, TP.HCM')
})

test('8. sepay_settings table security: client never receives full API Key', async () => {
  // Test initial unconfigured state
  mockDb.resetStoreSettings()
  const initial = await settingsApi.getSepaySettings()
  assert.equal(initial.is_configured, false)
  assert.equal(initial.api_key_last4, null)

  // Test saving API Key
  const rawKey = 'SP_PROD_SECRET_KEY_99881234'
  const saved = await settingsApi.saveSepayApiKey(rawKey)

  assert.equal(saved.is_configured, true)
  assert.equal(saved.api_key_last4, '1234')
  assert.equal(saved.masked_key, '••••••••1234')
  assert.equal(saved.api_key_encrypted, undefined, 'Client must NEVER receive full or raw API Key back')
})

test('9. authApi login supports both "admin" and "giamdoc@gmail.com"', async () => {
  const { authApi } = await import('../src/api/authApi.js')

  // Test 1: login with admin
  const user1 = await authApi.login('admin', '123456')
  assert.equal(user1.username, 'admin')
  assert.equal(user1.role, 'OWNER')

  // Test 2: login with giamdoc@gmail.com
  const user2 = await authApi.login('giamdoc@gmail.com', '123456')
  assert.equal(user2.role, 'OWNER')
  assert.ok(user2.name.includes('Chủ quán'))
})
