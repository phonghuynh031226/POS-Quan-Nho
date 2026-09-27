export async function persistMenuItem(itemData, optionGroupRelations, { saveItem, saveRelations }) {
  const savedItem = await saveItem(itemData)
  await saveRelations(savedItem.id, optionGroupRelations)
  return savedItem
}
