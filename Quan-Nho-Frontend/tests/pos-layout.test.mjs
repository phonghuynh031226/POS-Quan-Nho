import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const posPagePath = new URL('../src/pages/Pos/index.jsx', import.meta.url)
const cartSidebarPath = new URL('../src/components/pos/CartSidebar.jsx', import.meta.url)

test('desktop POS keeps scrolling inside the menu while the cart stays fixed', async () => {
  const [posPage, cartSidebar] = await Promise.all([
    readFile(posPagePath, 'utf8'),
    readFile(cartSidebarPath, 'utf8'),
  ])

  assert.match(posPage, /lg:h-\[calc\(100dvh-4rem\)\]/)
  assert.match(posPage, /lg:min-h-0/)
  assert.match(posPage, /overflow-y-auto/)
  assert.match(cartSidebar, /lg:h-full/)
  assert.match(cartSidebar, /lg:overflow-hidden/)
})

test('POS categories open from one floating animated menu button', async () => {
  const posPage = await readFile(posPagePath, 'utf8')

  assert.match(posPage, /isCategoryMenuOpen/)
  assert.match(posPage, /aria-label="Chọn danh mục"/)
  assert.match(posPage, /aria-expanded=\{isCategoryMenuOpen\}/)
  assert.match(posPage, /data-category-overlay/)
  assert.match(posPage, /opacity-0 scale-95 -translate-y-2/)
  assert.match(posPage, /opacity-100 scale-100 translate-y-0/)
  assert.match(posPage, /setIsCategoryMenuOpen\(false\)/)
  assert.match(posPage, /data-search-category-row/)
  assert.match(posPage, /data-search-category-row[\s\S]*Search Input[\s\S]*aria-label="Chọn danh mục"/)
})
