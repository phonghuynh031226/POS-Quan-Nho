import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { shouldShowProductPlaceholder } from '../src/utils/productImageState.js'

const productImagePath = new URL('../src/components/common/ProductImage.jsx', import.meta.url)

test('product placeholder appears for missing and failed images', () => {
  assert.equal(shouldShowProductPlaceholder('', false), true)
  assert.equal(shouldShowProductPlaceholder(null, false), true)
  assert.equal(shouldShowProductPlaceholder('https://example.com/product.jpg', true), true)
  assert.equal(shouldShowProductPlaceholder('https://example.com/product.jpg', false), false)
})

test('product placeholder uses a large coffee, a smaller hamburger and an underline without text', async () => {
  const productImage = await readFile(productImagePath, 'utf8')

  assert.doesNotMatch(productImage, /Sandwich/)
  assert.doesNotMatch(productImage, /Chưa có ảnh/)
  assert.match(productImage, /aria-label="Cà phê và hamburger"/)
  assert.match(productImage, /w-16 h-16/)
  assert.match(productImage, /data-product-hamburger/)
  assert.match(productImage, /border-b-\[3px\]/)
  assert.match(productImage, /text-\[#7A4A32\]/)
  assert.doesNotMatch(productImage, /border-stone-300/)
})
