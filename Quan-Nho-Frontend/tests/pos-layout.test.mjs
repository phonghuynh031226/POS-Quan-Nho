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
