export function upsertById(items, item) {
  if (!item || item.id == null) return items

  const index = items.findIndex((current) => String(current.id) === String(item.id))
  if (index === -1) return [...items, item]

  return items.map((current, currentIndex) => (currentIndex === index ? item : current))
}

export function removeById(items, id) {
  return items.filter((item) => String(item.id) !== String(id))
}

export function countCategoryProducts(items = [], categoryId) {
  return items.filter((item) => String(item.category_id) === String(categoryId)).length
}
